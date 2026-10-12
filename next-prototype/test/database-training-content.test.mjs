import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const foundationMigration = new URL("../supabase/migrations/20261012090000_academy_foundation.sql", import.meta.url);
const contentMigration = new URL("../supabase/migrations/20261012100000_academy_training_content.sql", import.meta.url);
const orderingMigration = new URL("../supabase/migrations/20261012110000_academy_content_ordering.sql", import.meta.url);
const adminId = "10000000-0000-4000-8000-000000000001";
const employeeId = "10000000-0000-4000-8000-000000000002";
const frenchEmployeeId = "10000000-0000-4000-8000-000000000003";

describe("Academy course content migration", { concurrency: false }, () => {
  let db;
  let storeId;
  let courseId;
  let publishedVersionId;
  let latestPublishedVersionId;
  let draftVersionId;

  before(async () => {
    db = new PGlite();
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role supabase_auth_admin nologin;
      create schema auth;
      create table auth.users (
        id uuid primary key,
        email text,
        raw_user_meta_data jsonb not null default '{}'::jsonb
      );
      create function auth.uid()
      returns uuid
      language sql
      stable
      as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
    `);
    await db.exec(await readFile(foundationMigration, "utf8"));

    const store = await db.query(
      `insert into public.stores (name, street_address, city, postal_code)
       values ('Xzone Warszawa', 'Marszałkowska 1', 'Warszawa', '00-001') returning id`,
    );
    storeId = store.rows[0].id;
    await db.query("insert into public.user_invites (email, role) values ('admin@academy.test', 'admin')");
    await db.query(
      "insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)",
      [adminId, "admin@academy.test", JSON.stringify({ first_name: "Anna" })],
    );
    await db.query(
      "insert into public.user_invites (email, role, store_id, created_by) values ('employee@academy.test', 'employee', $1, $2)",
      [storeId, adminId],
    );
    await db.query(
      "insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)",
      [employeeId, "employee@academy.test", JSON.stringify({ first_name: "Emilia" })],
    );

    await db.exec(await readFile(contentMigration, "utf8"));
    await db.exec(await readFile(orderingMigration, "utf8"));
  });

  after(async () => {
    await db?.close();
  });

  async function asUser(userId, callback) {
    await db.exec("begin");
    try {
      await db.exec("set local role authenticated");
      await db.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
      return await callback();
    } finally {
      await db.exec("rollback");
    }
  }

  async function asUserCommitted(userId, callback) {
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
    try {
      return await callback();
    } finally {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
    }
  }

  it("allows admins to add languages and uses active languages for new profiles", async () => {
    await asUserCommitted(adminId, () => db.query(
      `insert into public.academy_languages (code, name, native_name, sort_order)
       values ('fr', 'French', 'Français', 4)`,
    ));

    await db.query(
      "insert into public.user_invites (email, role, store_id, created_by) values ('fr@academy.test', 'employee', $1, $2)",
      [storeId, adminId],
    );
    await db.query(
      "insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)",
      [frenchEmployeeId, "fr@academy.test", JSON.stringify({ preferred_language: "fr" })],
    );

    const profile = await db.query("select preferred_language from public.profiles where id = $1", [frenchEmployeeId]);
    assert.equal(profile.rows[0].preferred_language, "fr");

    await asUser(employeeId, async () => {
      const languages = await db.query("select code from public.academy_languages order by sort_order");
      assert.deepEqual(languages.rows.map((row) => row.code), ["pl", "en", "de", "cs", "fr"]);
    });
  });

  it("creates courses atomically and publishes only complete default-language content", async () => {
    await asUser(employeeId, () => assert.rejects(
      db.query("select * from public.create_academy_course('unauthorized', 'pl', 'Unauthorized')"),
      /Administrator access is required/,
    ));
    await asUser(adminId, () => assert.rejects(
      db.query("select * from public.create_academy_course('Bad Slug', 'pl', 'Training')"),
      /Course slug is invalid/,
    ));

    const created = await asUserCommitted(adminId, () => db.query(
      "select * from public.create_academy_course($1, $2, $3, $4)",
      ["riding-basics", "pl", "Podstawy jazdy", "Szkolenie startowe"],
    ));
    courseId = created.rows[0].course_id;
    publishedVersionId = created.rows[0].version_id;
    latestPublishedVersionId = publishedVersionId;

    await asUser(adminId, () => assert.rejects(
      db.query("select public.publish_academy_course($1, $2)", [courseId, publishedVersionId]),
      /Add at least one module/,
    ));

    const moduleRow = await asUserCommitted(adminId, async () => {
      await db.query(
        `insert into public.course_translations (course_version_id, language_code, title)
         values ($1, 'fr', 'Bases de conduite')`,
        [publishedVersionId],
      );
      const result = await db.query(
        "insert into public.course_modules (course_version_id, sort_order) values ($1, 0) returning id",
        [publishedVersionId],
      );
      await db.query(
        `insert into public.module_translations (module_id, language_code, title)
         values ($1, 'pl', 'Przygotowanie'), ($1, 'fr', 'Préparation')`,
        [result.rows[0].id],
      );
      await assert.rejects(
        db.query("insert into public.course_modules (course_version_id, sort_order) values ($1, 0)", [publishedVersionId]),
        /unique constraint/,
      );
      return result;
    });
    const moduleId = moduleRow.rows[0].id;
    await asUser(adminId, () => assert.rejects(
      db.query("select public.publish_academy_course($1, $2)", [courseId, publishedVersionId]),
      /Add at least one lesson/,
    ));

    const lesson = await asUserCommitted(adminId, () => db.query(
      "insert into public.course_lessons (module_id, sort_order) values ($1, 0) returning id",
      [moduleId],
    ));
    const lessonId = lesson.rows[0].id;
    await asUser(adminId, () => assert.rejects(
      db.query("select public.publish_academy_course($1, $2)", [courseId, publishedVersionId]),
      /Every lesson needs a title in the default language/,
    ));

    const lessonDocument = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Sprawdź wyposażenie." }] }],
    };
    await asUserCommitted(adminId, async () => {
      await db.query(
        `insert into public.lesson_translations
          (lesson_id, language_code, title, youtube_video_id, content, product_bullets)
         values ($1, 'pl', 'Przed wyjazdem', 'abcdefghijk', $2::jsonb, $3::jsonb),
                ($1, 'fr', 'Avant de partir', null, $2::jsonb, '[]'::jsonb)`,
        [lessonId, JSON.stringify(lessonDocument), JSON.stringify(["Sprawdź kask", "Sprawdź rękawice"])],
      );
      await db.query("select public.publish_academy_course($1, $2)", [courseId, publishedVersionId]);
    });

    const published = await db.query(
      `select course.published_version_id, version.status
       from public.courses as course
       join public.course_versions as version on version.id = course.published_version_id
       where course.id = $1`,
      [courseId],
    );
    assert.deepEqual(published.rows, [{ published_version_id: publishedVersionId, status: "published" }]);
  });

  it("copies all translations into a new draft without changing the published release", async () => {
    const cloned = await asUserCommitted(adminId, async () => {
      const result = await db.query("select public.create_academy_course_draft($1) as version_id", [courseId]);
      const versionId = result.rows[0].version_id;
      const translations = await db.query(
        `select translation.language_code, translation.title
         from public.course_translations as translation
         where translation.course_version_id = $1 order by translation.language_code`,
        [versionId],
      );
      const lesson = await db.query(
        `select translation.language_code, translation.title, translation.youtube_video_id,
                translation.content, translation.product_bullets
         from public.course_modules as module
         join public.course_lessons as lesson on lesson.module_id = module.id
         join public.lesson_translations as translation on translation.lesson_id = lesson.id
         where module.course_version_id = $1 and translation.language_code = 'pl'`,
        [versionId],
      );
      await db.query(
        "update public.course_translations set title = 'Wersja robocza' where course_version_id = $1 and language_code = 'pl'",
        [versionId],
      );
      return { versionId, translations: translations.rows, lesson: lesson.rows[0] };
    });

    assert.deepEqual(cloned.translations, [
      { language_code: "fr", title: "Bases de conduite" },
      { language_code: "pl", title: "Podstawy jazdy" },
    ]);
    assert.equal(cloned.lesson.title, "Przed wyjazdem");
    assert.equal(cloned.lesson.youtube_video_id, "abcdefghijk");
    assert.equal(cloned.lesson.content.content[0].content[0].text, "Sprawdź wyposażenie.");
    assert.deepEqual(cloned.lesson.product_bullets, ["Sprawdź kask", "Sprawdź rękawice"]);

    const stillPublished = await db.query(
      `select translation.title, course.published_version_id
       from public.courses as course
       join public.course_translations as translation on translation.course_version_id = course.published_version_id
       where course.id = $1 and translation.language_code = 'pl'`,
      [courseId],
    );
    assert.deepEqual(stillPublished.rows, [{ title: "Podstawy jazdy", published_version_id: publishedVersionId }]);

    await asUser(adminId, () => assert.rejects(
      db.query("select public.create_academy_course_draft($1)", [courseId]),
      /A draft already exists/,
    ));

    await asUserCommitted(adminId, () => db.query(
      "select public.publish_academy_course($1, $2)",
      [courseId, cloned.versionId],
    ));
    const versions = await db.query(
      "select id, status from public.course_versions where course_id = $1 order by version_number",
      [courseId],
    );
    assert.deepEqual(versions.rows, [
      { id: publishedVersionId, status: "archived" },
      { id: cloned.versionId, status: "published" },
    ]);
    latestPublishedVersionId = cloned.versionId;

    const nextDraft = await asUserCommitted(adminId, () => db.query(
      "select public.create_academy_course_draft($1) as version_id",
      [courseId],
    ));
    draftVersionId = nextDraft.rows[0].version_id;
  });

  it("keeps course content and language changes unavailable to employees", async () => {
    const firstModule = await db.query(
      "select id from public.course_modules where course_version_id = $1 order by sort_order limit 1",
      [draftVersionId],
    );
    const firstModuleId = firstModule.rows[0].id;
    const secondModule = await asUserCommitted(adminId, async () => {
      const result = await db.query(
        "insert into public.course_modules (course_version_id, sort_order) values ($1, 1) returning id",
        [draftVersionId],
      );
      await db.query(
        "insert into public.module_translations (module_id, language_code, title) values ($1, 'pl', 'Drugi moduł')",
        [result.rows[0].id],
      );
      return result;
    });
    const secondModuleId = secondModule.rows[0].id;
    const secondLesson = await asUserCommitted(adminId, () => db.query(
      "insert into public.course_lessons (module_id, sort_order) values ($1, 1) returning id",
      [firstModuleId],
    ));
    const secondLessonId = secondLesson.rows[0].id;
    const firstLesson = await db.query(
      "select id from public.course_lessons where module_id = $1 and id <> $2 order by sort_order limit 1",
      [firstModuleId, secondLessonId],
    );
    const firstLessonId = firstLesson.rows[0].id;

    await asUserCommitted(adminId, async () => {
      await db.query(
        "select public.reorder_academy_modules($1, ARRAY[$2::bigint, $3::bigint])",
        [draftVersionId, secondModuleId, firstModuleId],
      );
      await db.query(
        "select public.reorder_academy_lessons($1, ARRAY[$2::bigint, $3::bigint])",
        [firstModuleId, secondLessonId, firstLessonId],
      );
    });
    const reorderedModules = await db.query(
      "select id from public.course_modules where course_version_id = $1 order by sort_order",
      [draftVersionId],
    );
    const reorderedLessons = await db.query(
      "select id from public.course_lessons where module_id = $1 order by sort_order",
      [firstModuleId],
    );
    assert.deepEqual(reorderedModules.rows.map((row) => row.id), [secondModuleId, firstModuleId]);
    assert.deepEqual(reorderedLessons.rows.map((row) => row.id), [secondLessonId, firstLessonId]);

    await asUser(adminId, () => assert.rejects(
      db.query(
        "select public.reorder_academy_modules($1, ARRAY[$2::bigint, $2::bigint])",
        [draftVersionId, firstModuleId],
      ),
      /every module exactly once/,
    ));
    await asUser(employeeId, () => assert.rejects(
      db.query(
        "select public.reorder_academy_modules($1, ARRAY[$2::bigint, $3::bigint])",
        [draftVersionId, secondModuleId, firstModuleId],
      ),
      /Administrator access is required/,
    ));

    await asUser(employeeId, async () => {
      const courses = await db.query("select id from public.courses");
      const versions = await db.query("select id from public.course_versions");
      assert.deepEqual(courses.rows, []);
      assert.deepEqual(versions.rows, []);

      await assert.rejects(
        db.query("insert into public.academy_languages (code, name, native_name) values ('it', 'Italian', 'Italiano')"),
        /row-level security policy/,
      );
    });

    const lesson = await db.query(
      `select lesson.id
       from public.course_versions as version
       join public.course_modules as module on module.course_version_id = version.id
       join public.course_lessons as lesson on lesson.module_id = module.id
       where version.id = $1 and version.status = 'draft'
       order by module.sort_order, lesson.sort_order limit 1`,
      [draftVersionId],
    );
    await asUser(adminId, () => assert.rejects(
      db.query(
        "insert into public.lesson_translations (lesson_id, language_code, title, youtube_video_id) values ($1, 'pl', 'Invalid', 'bad-id')",
        [lesson.rows[0].id],
      ),
      /check constraint/,
    ));
    await asUser(adminId, () => assert.rejects(
      db.query(
        "insert into public.lesson_translations (lesson_id, language_code, title, content) values ($1, 'pl', 'Invalid', '[]'::jsonb)",
        [lesson.rows[0].id],
      ),
      /check constraint/,
    ));

    await asUser(adminId, () => assert.rejects(
      db.query("update public.course_versions set status = 'archived' where id = $1", [latestPublishedVersionId]),
      /permission denied/,
    ));
    const publishedTranslation = await db.query(
      "select title from public.course_translations where course_version_id = $1 and language_code = 'pl'",
      [latestPublishedVersionId],
    );
    await asUser(adminId, async () => {
      const result = await db.query(
        "update public.course_translations set title = 'Niedozwolona zmiana' where course_version_id = $1 and language_code = 'pl'",
        [latestPublishedVersionId],
      );
      assert.equal(result.rowCount, 0);
    });
    const stillPublished = await db.query(
      "select title from public.course_translations where course_version_id = $1 and language_code = 'pl'",
      [latestPublishedVersionId],
    );
    assert.deepEqual(stillPublished.rows, publishedTranslation.rows);
  });
});
