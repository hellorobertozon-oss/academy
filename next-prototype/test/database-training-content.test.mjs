import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const foundationMigration = new URL("../supabase/migrations/20261012090000_academy_foundation.sql", import.meta.url);
const contentMigration = new URL("../supabase/migrations/20261012100000_academy_training_content.sql", import.meta.url);
const orderingMigration = new URL("../supabase/migrations/20261012110000_academy_content_ordering.sql", import.meta.url);
const assignmentsMigration = new URL("../supabase/migrations/20261012120000_academy_course_assignments.sql", import.meta.url);
const progressMigration = new URL("../supabase/migrations/20261012130000_academy_lesson_progress.sql", import.meta.url);
const adminId = "10000000-0000-4000-8000-000000000001";
const employeeId = "10000000-0000-4000-8000-000000000002";
const frenchEmployeeId = "10000000-0000-4000-8000-000000000003";
const otherStoreEmployeeId = "10000000-0000-4000-8000-000000000004";

describe("Academy course content migration", { concurrency: false }, () => {
  let db;
  let storeId;
  let otherStoreId;
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
    const otherStore = await db.query(
      `insert into public.stores (name, street_address, city, postal_code)
       values ('Xzone Krakow', 'Dluga 2', 'Krakow', '30-001') returning id`,
    );
    otherStoreId = otherStore.rows[0].id;
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

    await db.query(
      "insert into public.user_invites (email, role, store_id, created_by) values ('other@academy.test', 'employee', $1, $2)",
      [otherStoreId, adminId],
    );
    await db.query(
      "insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)",
      [otherStoreEmployeeId, "other@academy.test", JSON.stringify({ first_name: "Olek" })],
    );

    await db.exec(await readFile(contentMigration, "utf8"));
    await db.exec(await readFile(orderingMigration, "utf8"));
    await db.exec(await readFile(assignmentsMigration, "utf8"));
    await db.exec(await readFile(progressMigration, "utf8"));
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
      [otherStoreId, adminId],
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

  it("restricts published course access to assigned employees and available translations", async () => {
    await asUserCommitted(adminId, () => db.query(
      "insert into public.course_assignments (course_id, store_id, assigned_by) values ($1, $2, $3)",
      [courseId, storeId, adminId],
    ));
    await asUserCommitted(adminId, async () => {
      await db.query("update public.stores set is_active = false where id = $1", [otherStoreId]);
      await assert.rejects(
        db.query(
          "insert into public.course_assignments (course_id, store_id, assigned_by) values ($1, $2, $3)",
          [courseId, otherStoreId, adminId],
        ),
        /Course assignments can only target active stores/,
      );
      await db.query("update public.stores set is_active = true where id = $1", [otherStoreId]);
    });

    await asUser(otherStoreEmployeeId, async () => {
      const courses = await db.query("select id from public.courses");
      const assignments = await db.query("select id from public.course_assignments");
      assert.deepEqual(courses.rows, []);
      assert.deepEqual(assignments.rows, []);
      await assert.rejects(
        db.query(
          "insert into public.course_assignments (course_id, profile_id, assigned_by) values ($1, $2, $3)",
          [courseId, otherStoreEmployeeId, otherStoreEmployeeId],
        ),
        /row-level security policy/,
      );
    });

    await asUser(employeeId, async () => {
      const courses = await db.query("select id, published_version_id from public.courses");
      const versions = await db.query("select id, status from public.course_versions where course_id = $1", [courseId]);
      const translations = await db.query("select language_code, title from public.course_translations");
      assert.deepEqual(courses.rows, [{ id: courseId, published_version_id: latestPublishedVersionId }]);
      assert.deepEqual(versions.rows, [{ id: latestPublishedVersionId, status: "published" }]);
      assert.deepEqual(translations.rows, [{ language_code: "pl", title: "Wersja robocza" }]);
    });

    let untranslatedCourseId;
    await asUserCommitted(adminId, async () => {
      const created = await db.query(
        "select * from public.create_academy_course($1, $2, $3)",
        ["safety-briefing", "pl", "Zasady bezpieczenstwa"],
      );
      untranslatedCourseId = created.rows[0].course_id;
      const versionId = created.rows[0].version_id;
      await db.query(
        "insert into public.course_translations (course_version_id, language_code, title) values ($1, 'fr', 'Consignes de securite')",
        [versionId],
      );
      const courseModule = await db.query(
        "insert into public.course_modules (course_version_id, sort_order) values ($1, 0) returning id",
        [versionId],
      );
      await db.query(
        "insert into public.module_translations (module_id, language_code, title) values ($1, 'pl', 'Zasady')",
        [courseModule.rows[0].id],
      );
      const lesson = await db.query(
        "insert into public.course_lessons (module_id, sort_order) values ($1, 0) returning id",
        [courseModule.rows[0].id],
      );
      await db.query(
        `insert into public.lesson_translations (lesson_id, language_code, title, content)
         values ($1, 'pl', 'Podstawy bezpieczenstwa', '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb)`,
        [lesson.rows[0].id],
      );
      await db.query("select public.publish_academy_course($1, $2)", [untranslatedCourseId, versionId]);
      await db.query(
        "insert into public.course_assignments (course_id, profile_id, assigned_by) values ($1, $2, $3), ($4, $2, $3)",
        [courseId, frenchEmployeeId, adminId, untranslatedCourseId],
      );
      await assert.rejects(
        db.query(
          "insert into public.course_assignments (course_id, profile_id, assigned_by) values ($1, $2, $3)",
          [courseId, adminId, adminId],
        ),
        /Course assignments can only target employees/,
      );
      await assert.rejects(
        db.query(
          "insert into public.course_assignments (course_id, store_id, assigned_by) values ($1, $2, $3)",
          [courseId, otherStoreId, employeeId],
        ),
        /Assignment actor must match the authenticated user/,
      );
    });

    await asUser(frenchEmployeeId, async () => {
      const courses = await db.query(
        `select course.id, translation.title
         from public.courses as course
         join public.course_translations as translation
           on translation.course_version_id = course.published_version_id
         order by course.id`,
      );
      const moduleCourses = await db.query(
        `select version.course_id
         from public.course_modules as module
         join public.course_versions as version on version.id = module.course_version_id
         order by version.course_id, module.id`,
      );
      const lessonCourses = await db.query(
        `select version.course_id
         from public.course_lessons as lesson
         join public.course_modules as module on module.id = lesson.module_id
         join public.course_versions as version on version.id = module.course_version_id
         order by version.course_id, lesson.id`,
      );
      const translations = await db.query("select language_code, title from public.lesson_translations");

      assert.deepEqual(courses.rows, [
        { id: courseId, title: "Bases de conduite" },
        { id: untranslatedCourseId, title: "Consignes de securite" },
      ]);
      assert.deepEqual(moduleCourses.rows, [{ course_id: courseId }]);
      assert.deepEqual(lessonCourses.rows, [{ course_id: courseId }]);
      assert.deepEqual(translations.rows, [{ language_code: "fr", title: "Avant de partir" }]);
    });
  });

  it("stores lesson completion once, awards points once, and limits access", async () => {
    const lesson = await db.query(
      `select lesson.id
       from public.course_versions as version
       join public.course_modules as module on module.course_version_id = version.id
       join public.course_lessons as lesson on lesson.module_id = module.id
       where version.id = $1
       order by module.sort_order, lesson.sort_order
       limit 1`,
      [latestPublishedVersionId],
    );
    const lessonId = lesson.rows[0].id;

    const firstCompletion = await asUserCommitted(employeeId, () => db.query(
      "select * from public.complete_academy_lesson($1)",
      [lessonId],
    ));
    assert.deepEqual(firstCompletion.rows, [{
      lesson_id: lessonId,
      completed_at: firstCompletion.rows[0].completed_at,
      points_awarded: 10,
      newly_completed: true,
    }]);

    const repeatedCompletion = await asUserCommitted(employeeId, () => db.query(
      "select * from public.complete_academy_lesson($1)",
      [lessonId],
    ));
    assert.equal(repeatedCompletion.rows[0].newly_completed, false);
    assert.equal(repeatedCompletion.rows[0].points_awarded, 10);
    assert.equal(repeatedCompletion.rows[0].completed_at.toISOString(), firstCompletion.rows[0].completed_at.toISOString());

    await asUser(employeeId, async () => {
      const completions = await db.query("select lesson_id, points_awarded from public.lesson_completions");
      assert.deepEqual(completions.rows, [{ lesson_id: lessonId, points_awarded: 10 }]);
      await assert.rejects(
        db.query(
          "insert into public.lesson_completions (profile_id, lesson_id) values ($1, $2)",
          [employeeId, lessonId],
        ),
        /permission denied/,
      );
    });

    await asUser(otherStoreEmployeeId, async () => {
      const completions = await db.query("select lesson_id from public.lesson_completions");
      assert.deepEqual(completions.rows, []);
      await assert.rejects(
        db.query("select * from public.complete_academy_lesson($1)", [lessonId]),
        /Lesson is not available to this employee/,
      );
    });

    const draftLesson = await db.query(
      `select lesson.id
       from public.course_modules as module
       join public.course_lessons as lesson on lesson.module_id = module.id
       where module.course_version_id = $1
       order by module.sort_order, lesson.sort_order
       limit 1`,
      [draftVersionId],
    );
    await asUser(employeeId, () => assert.rejects(
      db.query("select * from public.complete_academy_lesson($1)", [draftLesson.rows[0].id]),
      /Lesson is not available to this employee/,
    ));

    await asUser(adminId, async () => {
      const completions = await db.query("select lesson_id, profile_id from public.lesson_completions");
      assert.deepEqual(completions.rows, [{ lesson_id: lessonId, profile_id: employeeId }]);
      await assert.rejects(
        db.query("select * from public.complete_academy_lesson($1)", [lessonId]),
        /Employee access is required/,
      );
    });
  });
});
