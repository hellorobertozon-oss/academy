import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const foundationMigration = new URL("../supabase/migrations/20261012090000_academy_foundation.sql", import.meta.url);
const contentMigration = new URL("../supabase/migrations/20261012100000_academy_training_content.sql", import.meta.url);
const orderingMigration = new URL("../supabase/migrations/20261012110000_academy_content_ordering.sql", import.meta.url);
const assignmentsMigration = new URL("../supabase/migrations/20261012120000_academy_course_assignments.sql", import.meta.url);
const progressMigration = new URL("../supabase/migrations/20261012130000_academy_lesson_progress.sql", import.meta.url);
const quizMigration = new URL("../supabase/migrations/20261012140000_academy_quizzes.sql", import.meta.url);
const leaderboardMigration = new URL("../supabase/migrations/20261012150000_academy_leaderboard.sql", import.meta.url);
const adminProgressMigration = new URL("../supabase/migrations/20261012160000_academy_admin_progress.sql", import.meta.url);
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
        email_confirmed_at timestamptz,
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
      "insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, $2, now(), $3::jsonb)",
      [adminId, "admin@academy.test", JSON.stringify({ first_name: "Anna" })],
    );
    await db.query(
      "insert into public.user_invites (email, role, store_id, created_by) values ('employee@academy.test', 'employee', $1, $2)",
      [storeId, adminId],
    );
    await db.query(
      "insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, $2, now(), $3::jsonb)",
      [employeeId, "employee@academy.test", JSON.stringify({ first_name: "Emilia" })],
    );

    await db.query(
      "insert into public.user_invites (email, role, store_id, created_by) values ('other@academy.test', 'employee', $1, $2)",
      [otherStoreId, adminId],
    );
    await db.query(
      "insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, $2, now(), $3::jsonb)",
      [otherStoreEmployeeId, "other@academy.test", JSON.stringify({ first_name: "Olek" })],
    );

    await db.exec(await readFile(contentMigration, "utf8"));
    await db.exec(await readFile(orderingMigration, "utf8"));
    await db.exec(await readFile(assignmentsMigration, "utf8"));
    await db.exec(await readFile(progressMigration, "utf8"));
    await db.exec(await readFile(quizMigration, "utf8"));
    await db.exec(await readFile(leaderboardMigration, "utf8"));
    await db.exec(await readFile(adminProgressMigration, "utf8"));
  });

  after(async () => {
    await db?.close();
  });

  it("marks an invitation accepted only after the invited account confirms its email", async () => {
    const pendingId = "00000000-0000-4000-8000-000000000099";
    await db.query(
      "insert into public.user_invites (email, role) values ('pending-content@academy.test', 'admin')",
    );
    await db.query(
      "insert into auth.users (id, email, raw_user_meta_data) values ($1, 'pending-content@academy.test', '{}'::jsonb)",
      [pendingId],
    );

    const pending = await db.query(
      "select accepted_at from public.user_invites where email = 'pending-content@academy.test'",
    );
    assert.equal(pending.rows[0].accepted_at, null);

    await db.query(
      "update auth.users set email_confirmed_at = now() where id = $1",
      [pendingId],
    );
    const accepted = await db.query(
      "select accepted_at is not null as accepted from public.user_invites where email = 'pending-content@academy.test'",
    );
    assert.equal(accepted.rows[0].accepted, true);
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
      "insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, $2, now(), $3::jsonb)",
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

  it("supports translated lesson and module quizzes with unlimited, protected attempts", async () => {
    const targetLesson = await db.query(
      `select lesson.id as lesson_id, module.id as module_id
       from public.course_modules as module
       join public.course_lessons as lesson on lesson.module_id = module.id
       where module.course_version_id = $1
       order by module.sort_order, lesson.sort_order
       limit 1`,
      [draftVersionId],
    );
    const lessonId = targetLesson.rows[0].lesson_id;
    const moduleId = targetLesson.rows[0].module_id;
    const questionRows = [];
    const optionRowsByQuestion = [];
    let lessonQuizId;
    let moduleQuizId;

    await asUserCommitted(adminId, async () => {
      await db.query(
        `insert into public.lesson_translations (lesson_id, language_code, title)
         select lesson.id, course.default_language_code, 'Lekcja do testow'
         from public.course_modules as module
         join public.course_versions as version on version.id = module.course_version_id
         join public.courses as course on course.id = version.course_id
         join public.course_lessons as lesson on lesson.module_id = module.id
         left join public.lesson_translations as translation
           on translation.lesson_id = lesson.id and translation.language_code = course.default_language_code
         where version.id = $1 and translation.lesson_id is null`,
        [draftVersionId],
      );
      const lessonQuiz = await db.query(
        "insert into public.quizzes (course_version_id, lesson_id) values ($1, $2) returning id",
        [draftVersionId, lessonId],
      );
      lessonQuizId = lessonQuiz.rows[0].id;
      await db.query(
        "insert into public.quiz_translations (quiz_id, language_code, title, instructions) values ($1, 'pl', 'Test lekcji', 'Wybierz najlepsza odpowiedz.')",
        [lessonQuizId],
      );
      await assert.rejects(
        db.query("select public.publish_academy_course($1, $2)", [courseId, draftVersionId]),
        /Every quiz needs a default-language title/,
      );

      for (let index = 0; index < 5; index += 1) {
        const question = await db.query(
          "insert into public.quiz_questions (quiz_id, sort_order) values ($1, $2) returning id",
          [lessonQuizId, index],
        );
        const questionId = question.rows[0].id;
        questionRows.push({ id: questionId, sort_order: index });
        await db.query(
          "insert into public.quiz_question_translations (question_id, language_code, prompt) values ($1, 'pl', $2)",
          [questionId, `Pytanie ${index + 1}`],
        );

        const options = await db.query(
          `insert into public.quiz_options (question_id, sort_order)
           values ($1, 0), ($1, 1) returning id, sort_order`,
          [questionId],
        );
        const orderedOptions = options.rows.toSorted((left, right) => left.sort_order - right.sort_order);
        optionRowsByQuestion.push(orderedOptions);
        await db.query(
          `insert into public.quiz_option_translations (option_id, language_code, label)
           values ($1, 'pl', 'Odpowiedz poprawna'), ($2, 'pl', 'Odpowiedz bledna')`,
          [orderedOptions[0].id, orderedOptions[1].id],
        );
        await db.query(
          "insert into public.quiz_correct_answers (question_id, option_id) values ($1, $2)",
          [questionId, orderedOptions[0].id],
        );
      }

      const moduleQuiz = await db.query(
        "insert into public.quizzes (course_version_id, module_id) values ($1, $2) returning id",
        [draftVersionId, moduleId],
      );
      moduleQuizId = moduleQuiz.rows[0].id;
      await db.query(
        "insert into public.quiz_translations (quiz_id, language_code, title) values ($1, 'pl', 'Test modulu')",
        [moduleQuizId],
      );
      const moduleQuestion = await db.query(
        "insert into public.quiz_questions (quiz_id, sort_order) values ($1, 0) returning id",
        [moduleQuizId],
      );
      const moduleQuestionId = moduleQuestion.rows[0].id;
      await db.query(
        "insert into public.quiz_question_translations (question_id, language_code, prompt) values ($1, 'pl', 'Pytanie modulu')",
        [moduleQuestionId],
      );
      const moduleOptions = await db.query(
        `insert into public.quiz_options (question_id, sort_order)
         values ($1, 0), ($1, 1) returning id, sort_order`,
        [moduleQuestionId],
      );
      const orderedModuleOptions = moduleOptions.rows.toSorted((left, right) => left.sort_order - right.sort_order);
      await db.query(
        `insert into public.quiz_option_translations (option_id, language_code, label)
         values ($1, 'pl', 'Tak'), ($2, 'pl', 'Nie')`,
        [orderedModuleOptions[0].id, orderedModuleOptions[1].id],
      );
      await db.query(
        "insert into public.quiz_correct_answers (question_id, option_id) values ($1, $2)",
        [moduleQuestionId, orderedModuleOptions[0].id],
      );

      await assert.rejects(
        db.query(
          "insert into public.quizzes (course_version_id, module_id) values ($1, $2)",
          [draftVersionId, moduleId],
        ),
        /unique constraint/,
      );
      await assert.rejects(
        db.query(
          "insert into public.quizzes (course_version_id, lesson_id) values ($1, $2)",
          [latestPublishedVersionId, lessonId],
        ),
        /Quiz target must belong to its course version/,
      );

      await db.query("select public.publish_academy_course($1, $2)", [courseId, draftVersionId]);
    });
    latestPublishedVersionId = draftVersionId;

    const buildAnswers = (correctQuestionCount) => questionRows.map((question, index) => ({
      question_id: question.id,
      option_id: optionRowsByQuestion[index][index < correctQuestionCount ? 0 : 1].id,
    }));
    const failedAttempt = await asUserCommitted(employeeId, () => db.query(
      "select * from public.submit_academy_quiz($1, $2::jsonb)",
      [lessonQuizId, JSON.stringify(buildAnswers(3))],
    ));
    assert.deepEqual(failedAttempt.rows[0], {
      attempt_id: failedAttempt.rows[0].attempt_id,
      attempt_number: 1,
      correct_count: 3,
      question_count: 5,
      score_percentage: 60,
      passed: false,
      points_awarded: 0,
    });

    const passingAttempt = await asUserCommitted(employeeId, () => db.query(
      "select * from public.submit_academy_quiz($1, $2::jsonb)",
      [lessonQuizId, JSON.stringify(buildAnswers(4))],
    ));
    assert.equal(passingAttempt.rows[0].score_percentage, 80);
    assert.equal(passingAttempt.rows[0].passed, true);
    assert.equal(passingAttempt.rows[0].points_awarded, 20);
    assert.equal(passingAttempt.rows[0].attempt_number, 2);

    const repeatedPass = await asUserCommitted(employeeId, () => db.query(
      "select * from public.submit_academy_quiz($1, $2::jsonb)",
      [lessonQuizId, JSON.stringify(buildAnswers(5))],
    ));
    assert.equal(repeatedPass.rows[0].score_percentage, 100);
    assert.equal(repeatedPass.rows[0].passed, true);
    assert.equal(repeatedPass.rows[0].points_awarded, 0);
    assert.equal(repeatedPass.rows[0].attempt_number, 3);

    await asUser(employeeId, async () => {
      const quizzes = await db.query("select id, module_id, lesson_id, pass_percentage from public.quizzes order by id");
      assert.deepEqual(quizzes.rows, [
        { id: lessonQuizId, module_id: null, lesson_id: lessonId, pass_percentage: 80 },
        { id: moduleQuizId, module_id: moduleId, lesson_id: null, pass_percentage: 80 },
      ]);
      const questionRows = await db.query("select id from public.quiz_questions where quiz_id = $1", [lessonQuizId]);
      assert.equal(questionRows.rows.length, 5);
      const answers = await db.query("select question_id, option_id from public.quiz_correct_answers");
      assert.deepEqual(answers.rows, []);
      const attempts = await db.query(
        "select correct_count, score_percentage, passed, points_awarded from public.quiz_attempts order by id",
      );
      assert.deepEqual(attempts.rows.map((attempt) => [
        attempt.correct_count,
        attempt.score_percentage,
        attempt.passed,
        attempt.points_awarded,
      ]), [
        [3, 60, false, 0],
        [4, 80, true, 20],
        [5, 100, true, 0],
      ]);
    });

    await asUser(employeeId, () => assert.rejects(
      db.query(
        "insert into public.quiz_attempts (profile_id, quiz_id, submitted_answers, correct_count, question_count, score_percentage, passed, points_awarded) values ($1, $2, '[]', 0, 5, 0, false, 0)",
        [employeeId, lessonQuizId],
      ),
      /permission denied/,
    ));
    await asUser(employeeId, () => assert.rejects(
      db.query(
        "select * from public.submit_academy_quiz($1, $2::jsonb)",
        [lessonQuizId, JSON.stringify([
          { question_id: questionRows[0].id, option_id: optionRowsByQuestion[0][0].id },
          { question_id: questionRows[0].id, option_id: optionRowsByQuestion[0][1].id },
        ])],
      ),
      /A question can only have one selected answer/,
    ));

    await asUser(frenchEmployeeId, async () => {
      const quizzes = await db.query("select id from public.quizzes");
      assert.deepEqual(quizzes.rows, []);
      await assert.rejects(
        db.query("select * from public.submit_academy_quiz($1, '[]'::jsonb)", [lessonQuizId]),
        /Quiz is not available to this employee/,
      );
    });

    const nextDraft = await asUserCommitted(adminId, () => db.query(
      "select public.create_academy_course_draft($1) as version_id",
      [courseId],
    ));
    draftVersionId = nextDraft.rows[0].version_id;
    const clonedQuizzes = await asUser(adminId, async () => {
      const quizzes = await db.query(
        "select module_id, lesson_id, pass_percentage from public.quizzes where course_version_id = $1 order by id",
        [draftVersionId],
      );
      const questions = await db.query(
        `select quiz.id as quiz_id, count(question.id)::integer as question_count
         from public.quizzes as quiz
         left join public.quiz_questions as question on question.quiz_id = quiz.id
         where quiz.course_version_id = $1
         group by quiz.id order by quiz.id`,
        [draftVersionId],
      );
      const correctAnswers = await db.query(
        `select count(*)::integer as answer_count
         from public.quiz_correct_answers as answer
         join public.quiz_questions as question on question.id = answer.question_id
         join public.quizzes as quiz on quiz.id = question.quiz_id
         where quiz.course_version_id = $1`,
        [draftVersionId],
      );
      return { quizzes, questions, correctAnswers };
    });
    assert.equal(clonedQuizzes.quizzes.rows.length, 2);
    assert.ok(clonedQuizzes.quizzes.rows.every((quiz) => quiz.pass_percentage === 80));
    assert.deepEqual(clonedQuizzes.questions.rows.map((quiz) => quiz.question_count), [5, 1]);
    assert.equal(clonedQuizzes.correctAnswers.rows[0].answer_count, 6);
  });

  it("saves quiz structure in the default language and translations against the same answers", async () => {
    const quizId = await asUserCommitted(adminId, async () => {
      const target = await db.query(
        `select lesson.id
         from public.course_modules as module
         join public.course_lessons as lesson on lesson.module_id = module.id
         where module.course_version_id = $1
           and not exists (select 1 from public.quizzes as quiz where quiz.lesson_id = lesson.id)
         order by module.sort_order, lesson.sort_order
         limit 1`,
        [draftVersionId],
      );
      const quiz = await db.query(
        "insert into public.quizzes (course_version_id, lesson_id) values ($1, $2) returning id",
        [draftVersionId, target.rows[0].id],
      );
      const id = quiz.rows[0].id;
      const questions = [{
        question_id: null,
        prompt: "Jak zapisac nowy produkt?",
        options: [
          { option_id: null, label: "W panelu", is_correct: true },
          { option_id: null, label: "W notatniku", is_correct: false },
        ],
      }];
      await db.query(
        "select public.save_academy_quiz_content($1, 'pl', 'Nowy quiz', 'Wybierz odpowiedz.', $2::jsonb)",
        [id, JSON.stringify(questions)],
      );
      return id;
    });

    const stored = await asUser(adminId, async () => {
      const quizTranslation = await db.query(
        "select title, instructions from public.quiz_translations where quiz_id = $1 and language_code = 'pl'",
        [quizId],
      );
      const question = await db.query(
        `select question.id, translation.prompt
         from public.quiz_questions as question
         join public.quiz_question_translations as translation on translation.question_id = question.id
         where question.quiz_id = $1 and translation.language_code = 'pl'`,
        [quizId],
      );
      const options = await db.query(
        `select option.id, option_translation.label, (answer.option_id = option.id) as is_correct
         from public.quiz_options as option
         join public.quiz_question_translations as prompt on prompt.question_id = option.question_id
         join public.quiz_option_translations as option_translation on option_translation.option_id = option.id
         left join public.quiz_correct_answers as answer on answer.question_id = option.question_id
         where prompt.language_code = 'pl' and option_translation.language_code = 'pl'
           and option.question_id = $1
         order by option.sort_order`,
        [question.rows[0].id],
      );
      return { quizTranslation, question, options };
    });
    assert.deepEqual(stored.quizTranslation.rows, [{ title: "Nowy quiz", instructions: "Wybierz odpowiedz." }]);
    assert.equal(stored.question.rows[0].prompt, "Jak zapisac nowy produkt?");
    assert.equal(stored.options.rows.length, 2);
    assert.equal(stored.options.rows.filter((option) => option.is_correct).length, 1);

    await asUserCommitted(adminId, () => db.query(
      "select public.save_academy_quiz_content($1, 'fr', 'Nouveau quiz', 'Choisissez une reponse.', $2::jsonb)",
      [quizId, JSON.stringify([{
        question_id: stored.question.rows[0].id,
        prompt: "Comment ajouter un produit ?",
        options: stored.options.rows.map((option) => ({
          option_id: option.id,
          label: option.is_correct ? "Dans le panneau" : "Dans un carnet",
          is_correct: false,
        })),
      }])],
    ));

    await asUser(adminId, async () => {
      const frenchRows = await db.query(
        `select quiz_translation.title, question_translation.prompt, option_translation.label
         from public.quiz_translations as quiz_translation
         join public.quiz_questions as question on question.quiz_id = quiz_translation.quiz_id
         join public.quiz_question_translations as question_translation on question_translation.question_id = question.id
         join public.quiz_options as option on option.question_id = question.id
         join public.quiz_option_translations as option_translation on option_translation.option_id = option.id
         where quiz_translation.quiz_id = $1 and quiz_translation.language_code = 'fr'
           and question_translation.language_code = 'fr' and option_translation.language_code = 'fr'
         order by option.sort_order`,
        [quizId],
      );
      assert.deepEqual(frenchRows.rows.map((row) => [row.title, row.prompt]), [
        ["Nouveau quiz", "Comment ajouter un produit ?"],
        ["Nouveau quiz", "Comment ajouter un produit ?"],
      ]);
      assert.deepEqual(frenchRows.rows.map((row) => row.label), ["Dans le panneau", "Dans un carnet"]);
    });

    await asUser(employeeId, () => assert.rejects(
      db.query(
        "select public.save_academy_quiz_content($1, 'pl', 'Changed', '', $2::jsonb)",
        [quizId, JSON.stringify([])],
      ),
      /Administrator access is required/,
    ));
  });

  it("reports assigned lesson and quiz progress to admins by employee, store and module", async () => {
    const quizLesson = await db.query(
      `select lesson.id, lesson.module_id
       from public.quizzes as quiz
       join public.course_lessons as lesson on lesson.id = quiz.lesson_id
       where quiz.course_version_id = $1 and quiz.lesson_id is not null
       order by quiz.id limit 1`,
      [latestPublishedVersionId],
    );
    await asUserCommitted(employeeId, () => db.query(
      "select * from public.complete_academy_lesson($1)",
      [quizLesson.rows[0].id],
    ));

    const report = await asUser(adminId, () => db.query("select * from public.read_academy_admin_progress()"));
    const employeeModule = report.rows.find((row) =>
      row.employee_email === "employee@academy.test" && row.module_id === quizLesson.rows[0].module_id,
    );
    assert.ok(employeeModule);
    assert.equal(employeeModule.store_name, "Xzone Warszawa");
    assert.equal(employeeModule.store_city, "Warszawa");
    assert.equal(employeeModule.lesson_count, 2);
    assert.equal(employeeModule.completed_lesson_count, 1);
    assert.equal(employeeModule.passed_quiz_count, 1);
    assert.equal(employeeModule.quiz_attempt_count, 3);
    assert.equal(employeeModule.latest_quiz_score, 100);
    assert.ok(employeeModule.last_activity_at);
    assert.equal(report.rows.some((row) => row.employee_email === "other@academy.test"), false);

    const frenchSafetyRows = report.rows.filter((row) =>
      row.employee_email === "fr@academy.test" && row.course_slug === "safety-briefing",
    );
    assert.deepEqual(frenchSafetyRows, []);

    await asUser(employeeId, () => assert.rejects(
      db.query("select * from public.read_academy_admin_progress()"),
      /Administrator access is required/,
    ));
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    await assert.rejects(
      db.query("select * from public.read_academy_admin_progress()"),
      /Administrator access is required/,
    );
  });

  it("returns a privacy-limited global points leaderboard to employees only", async () => {
    await db.query(
      "update public.profiles set first_name = 'Emilia', last_name = 'Kowalska' where id = $1",
      [employeeId],
    );
    await db.query(
      "update public.profiles set first_name = 'Olek', last_name = 'Nowak' where id = $1",
      [otherStoreEmployeeId],
    );

    const expectedPoints = await db.query(
      `select
         coalesce((select sum(points_awarded) from public.lesson_completions where profile_id = $1), 0)
         + coalesce((select sum(points_awarded) from public.quiz_attempts where profile_id = $1), 0) as points`,
      [employeeId],
    );
    const leaderboard = await asUser(employeeId, () => db.query("select * from public.read_academy_leaderboard()"));
    const currentUser = leaderboard.rows.find((entry) => entry.is_current_user);
    const otherEmployee = leaderboard.rows.find((entry) => entry.display_name === "Olek N.");

    assert.ok(currentUser);
    assert.equal(currentUser.leaderboard_position, 1);
    assert.equal(currentUser.display_name, "Emilia K.");
    assert.equal(currentUser.city, "Warszawa");
    assert.equal(Number(currentUser.total_points), Number(expectedPoints.rows[0].points));
    assert.equal(currentUser.is_current_user, true);
    assert.ok(otherEmployee);
    assert.equal(otherEmployee.city, "Krakow");
    assert.equal(Object.hasOwn(currentUser, "email"), false);
    assert.equal(Object.hasOwn(currentUser, "profile_id"), false);
    assert.deepEqual(Object.keys(currentUser).sort(), [
      "city",
      "display_name",
      "is_current_user",
      "leaderboard_position",
      "total_points",
    ]);

    const publishedQuiz = await db.query(
      "select id from public.quizzes where course_version_id = $1 order by id limit 1",
      [latestPublishedVersionId],
    );
    for (let index = 0; index < 11; index += 1) {
      const profileId = `10000000-0000-4000-8000-${String(100 + index).padStart(12, "0")}`;
      const email = `leader-${index + 1}@academy.test`;
      await db.query(
        "insert into public.user_invites (email, role, store_id, created_by) values ($1, 'employee', $2, $3)",
        [email, storeId, adminId],
      );
      await db.query(
        "insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, $2, now(), $3::jsonb)",
        [profileId, email, JSON.stringify({ first_name: `Leader${index + 1}`, last_name: `Employee${index + 1}` })],
      );
      for (let attemptIndex = 0; attemptIndex < 4; attemptIndex += 1) {
        await db.query(
          `insert into public.quiz_attempts (
             profile_id, quiz_id, submitted_answers, correct_count, question_count,
             score_percentage, passed, points_awarded
           ) values ($1, $2, '[]', 4, 5, 80, true, 20)`,
          [profileId, publishedQuiz.rows[0].id],
        );
      }
    }

    const outsideTopTen = await asUser(employeeId, () => db.query("select * from public.read_academy_leaderboard()"));
    const currentOutsideTopTen = outsideTopTen.rows.find((entry) => entry.is_current_user);
    assert.equal(outsideTopTen.rows.length, 11);
    assert.equal(currentOutsideTopTen.leaderboard_position, 12);
    assert.equal(outsideTopTen.rows.filter((entry) => entry.display_name.startsWith("Leader")).length, 10);

    const otherEmployeeView = await asUser(otherStoreEmployeeId, () => db.query("select * from public.read_academy_leaderboard()"));
    const otherEmployeeOwnRow = otherEmployeeView.rows.find((entry) => entry.is_current_user);
    assert.equal(otherEmployeeOwnRow.display_name, "Olek N.");
    assert.equal(otherEmployeeOwnRow.city, "Krakow");

    await asUser(adminId, () => assert.rejects(
      db.query("select * from public.read_academy_leaderboard()"),
      /Employee access is required/,
    ));
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    await assert.rejects(
      db.query("select * from public.read_academy_leaderboard()"),
      /Authentication is required/,
    );
  });
});
