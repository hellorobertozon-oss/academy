import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const directory = dirname(fileURLToPath(import.meta.url));
const languages = ["en", "de", "cs", "fr", "it"];
const expectedSlug = "pielegnacja-i-sprzedaz-produktow-xzone";
const expectedModuleOrders = [0, 1, 2, 3, 4, 5, 6];
const expectedLessonOrders = new Set(
  JSON.parse(readFileSync(join(directory, "en.json"), "utf8")).lessons.map(
    ({ module_sort_order, sort_order }) => `${module_sort_order}:${sort_order}`,
  ),
);

function readTranslation(language) {
  const translation = JSON.parse(readFileSync(join(directory, `${language}.json`), "utf8"));
  const slug = translation.course.slug ?? translation.course.course_slug;
  if ((slug !== undefined && slug !== expectedSlug) || translation.course.language_code !== language) {
    throw new Error(`Unexpected course or language metadata in ${language}.json`);
  }
  if (translation.modules.length !== 7 || translation.lessons.length !== 36) {
    throw new Error(`${language}.json must contain 7 modules and 36 lessons`);
  }
  if (typeof translation.course.title !== "string" || !translation.course.title.trim()) {
    throw new Error(`${language}.json is missing the course title`);
  }
  if (translation.modules.some((module) => typeof module.title !== "string" || !module.title.trim())) {
    throw new Error(`${language}.json contains a module without a title`);
  }
  if (translation.lessons.some((lesson) =>
    typeof lesson.title !== "string" ||
    !lesson.title.trim() ||
    !lesson.content ||
    lesson.content.type !== "doc" ||
    !Array.isArray(lesson.product_bullets) ||
    typeof lesson.key_points_title !== "string" ||
    !lesson.key_points_title.trim() ||
    typeof lesson.conversation_title !== "string" ||
    !lesson.conversation_title.trim() ||
    !Array.isArray(lesson.conversation)
  )) {
    throw new Error(`${language}.json contains an incomplete lesson translation`);
  }
  if (translation.modules.map(({ module_sort_order }) => module_sort_order).join(",") !== expectedModuleOrders.join(",")) {
    throw new Error(`${language}.json has unexpected module ordering`);
  }
  const lessonOrders = translation.lessons.map(
    ({ module_sort_order, sort_order }) => `${module_sort_order}:${sort_order}`,
  );
  if (new Set(lessonOrders).size !== 36 || lessonOrders.some((order) => !expectedLessonOrders.has(order))) {
    throw new Error(`${language}.json has missing, duplicate, or unexpected lessons`);
  }
  return translation;
}

function dollarQuote(value, prefix) {
  let tag = prefix;
  while (value.includes(`$${tag}$`)) tag += "_x";
  return `$${tag}$${value}$${tag}$`;
}

const sql = [
  "BEGIN;",
  "",
  "INSERT INTO public.academy_languages (code, name, native_name, is_active, sort_order)",
  "VALUES ('it', 'Italian', 'Italiano', true, 5)",
  "ON CONFLICT (code) DO UPDATE SET",
  "  name = EXCLUDED.name,",
  "  native_name = EXCLUDED.native_name,",
  "  is_active = true,",
  "  sort_order = EXCLUDED.sort_order,",
  "  updated_at = now();",
  "",
  "DO $guard$",
  "DECLARE",
  "  module_count integer;",
  "  lesson_count integer;",
  "BEGIN",
  "  IF NOT EXISTS (",
  "    SELECT 1",
  "    FROM public.courses AS course",
  "    JOIN public.course_versions AS version ON version.id = course.published_version_id",
  `    WHERE course.slug = '${expectedSlug}' AND version.version_number = 9 AND version.status = 'published'`,
  "  ) THEN",
  "    RAISE EXCEPTION 'The expected published Academy course version was not found';",
  "  END IF;",
  "",
  "  SELECT count(DISTINCT module.id), count(lesson.id)",
  "  INTO module_count, lesson_count",
  "  FROM public.courses AS course",
  "  JOIN public.course_versions AS version ON version.id = course.published_version_id",
  "  JOIN public.course_modules AS module ON module.course_version_id = version.id",
  "  JOIN public.course_lessons AS lesson ON lesson.module_id = module.id",
  `  WHERE course.slug = '${expectedSlug}' AND version.version_number = 9 AND version.status = 'published';`,
  "  IF module_count <> 7 OR lesson_count <> 36 THEN",
  "    RAISE EXCEPTION 'The published Academy course structure changed (modules %, lessons %)', module_count, lesson_count;",
  "  END IF;",
  "END",
  "$guard$;",
  "",
];

for (const language of languages) {
  const translation = readTranslation(language);
  const coursePayload = dollarQuote(JSON.stringify(translation.course), `${language}_course`);
  const modulePayload = dollarQuote(JSON.stringify(translation.modules), `${language}_modules`);
  const lessonPayload = dollarQuote(JSON.stringify(translation.lessons), `${language}_lessons`);

  sql.push(
    `-- ${language}: course, module, and lesson text`,
    "INSERT INTO public.course_translations (course_version_id, language_code, title, description, image_path)",
    "SELECT version.id,",
    `       '${language}', translated.title, COALESCE(translated.description, ''), source.image_path`,
    "FROM public.courses AS course",
    "JOIN public.course_versions AS version ON version.id = course.published_version_id",
    "JOIN public.course_translations AS source ON source.course_version_id = version.id AND source.language_code = 'pl'",
    `CROSS JOIN LATERAL jsonb_to_record(${coursePayload}::jsonb) AS translated(title text, description text)`,
    `WHERE course.slug = '${expectedSlug}' AND version.version_number = 9 AND version.status = 'published'`,
    `  AND translated.title IS NOT NULL AND '${language}' = '${translation.course.language_code}'`,
    "ON CONFLICT (course_version_id, language_code) DO UPDATE SET",
    "  title = EXCLUDED.title,",
    "  description = EXCLUDED.description,",
    "  image_path = COALESCE(course_translations.image_path, EXCLUDED.image_path),",
    "  updated_at = now();",
    "",
    "INSERT INTO public.module_translations (module_id, language_code, title, summary, image_path)",
    "SELECT module.id,",
    `       '${language}', translated.title, COALESCE(translated.summary, ''), source.image_path`,
    "FROM public.courses AS course",
    "JOIN public.course_versions AS version ON version.id = course.published_version_id",
    "JOIN public.course_modules AS module ON module.course_version_id = version.id",
    "JOIN public.module_translations AS source ON source.module_id = module.id AND source.language_code = 'pl'",
    `CROSS JOIN LATERAL jsonb_to_recordset(${modulePayload}::jsonb) AS translated(module_sort_order integer, title text, summary text)`,
    `WHERE course.slug = '${expectedSlug}' AND version.version_number = 9 AND version.status = 'published'`,
    "  AND module.sort_order = translated.module_sort_order",
    `  AND '${language}' = '${translation.course.language_code}'`,
    "ON CONFLICT (module_id, language_code) DO UPDATE SET",
    "  title = EXCLUDED.title,",
    "  summary = EXCLUDED.summary,",
    "  image_path = COALESCE(module_translations.image_path, EXCLUDED.image_path),",
    "  updated_at = now();",
    "",
    "INSERT INTO public.lesson_translations (",
    "  lesson_id, language_code, title, summary, youtube_video_id, content, product_bullets,",
    "  key_points_title, conversation_title, conversation, youtube_video_ids, image_path",
    ")",
    "SELECT lesson.id,",
    `       '${language}', translated.title, COALESCE(translated.summary, ''), source.youtube_video_id,`,
    "       translated.content, COALESCE(translated.product_bullets, '[]'::jsonb),",
    "       translated.key_points_title, translated.conversation_title,",
    "       COALESCE(translated.conversation, '[]'::jsonb), source.youtube_video_ids, source.image_path",
    "FROM public.courses AS course",
    "JOIN public.course_versions AS version ON version.id = course.published_version_id",
    "JOIN public.course_modules AS module ON module.course_version_id = version.id",
    "JOIN public.course_lessons AS lesson ON lesson.module_id = module.id",
    "JOIN public.lesson_translations AS source ON source.lesson_id = lesson.id AND source.language_code = 'pl'",
    `CROSS JOIN LATERAL jsonb_to_recordset(${lessonPayload}::jsonb) AS translated(`,
    "  module_sort_order integer, sort_order integer, title text, summary text, content jsonb,",
    "  product_bullets jsonb, key_points_title text, conversation_title text, conversation jsonb",
    ")",
    `WHERE course.slug = '${expectedSlug}' AND version.version_number = 9 AND version.status = 'published'`,
    "  AND module.sort_order = translated.module_sort_order",
    "  AND lesson.sort_order = translated.sort_order",
    `  AND '${language}' = '${translation.course.language_code}'`,
    "ON CONFLICT (lesson_id, language_code) DO UPDATE SET",
    "  title = EXCLUDED.title,",
    "  summary = EXCLUDED.summary,",
    "  content = EXCLUDED.content,",
    "  product_bullets = EXCLUDED.product_bullets,",
    "  key_points_title = EXCLUDED.key_points_title,",
    "  conversation_title = EXCLUDED.conversation_title,",
    "  conversation = EXCLUDED.conversation,",
    "  youtube_video_id = COALESCE(lesson_translations.youtube_video_id, EXCLUDED.youtube_video_id),",
    "  youtube_video_ids = CASE WHEN cardinality(lesson_translations.youtube_video_ids) > 0 THEN lesson_translations.youtube_video_ids ELSE EXCLUDED.youtube_video_ids END,",
    "  image_path = COALESCE(lesson_translations.image_path, EXCLUDED.image_path),",
    "  updated_at = now();",
    "",
  );
}

sql.push(
  "DO $verify$",
  "DECLARE",
  "  target_language_code text;",
  "  course_count integer;",
  "  module_count integer;",
  "  lesson_count integer;",
  "BEGIN",
  "  FOREACH target_language_code IN ARRAY ARRAY['en', 'de', 'cs', 'fr', 'it'] LOOP",
  "    SELECT count(*) INTO course_count",
  "    FROM public.course_translations AS translation",
  "    JOIN public.course_versions AS version ON version.id = translation.course_version_id",
  "    JOIN public.courses AS course ON course.published_version_id = version.id",
  `    WHERE course.slug = '${expectedSlug}' AND version.version_number = 9 AND translation.language_code = target_language_code;`,
  "    SELECT count(*) INTO module_count",
  "    FROM public.module_translations AS translation",
  "    JOIN public.course_modules AS module ON module.id = translation.module_id",
  "    JOIN public.course_versions AS version ON version.id = module.course_version_id",
  "    JOIN public.courses AS course ON course.published_version_id = version.id",
  `    WHERE course.slug = '${expectedSlug}' AND version.version_number = 9 AND translation.language_code = target_language_code;`,
  "    SELECT count(*) INTO lesson_count",
  "    FROM public.lesson_translations AS translation",
  "    JOIN public.course_lessons AS lesson ON lesson.id = translation.lesson_id",
  "    JOIN public.course_modules AS module ON module.id = lesson.module_id",
  "    JOIN public.course_versions AS version ON version.id = module.course_version_id",
  "    JOIN public.courses AS course ON course.published_version_id = version.id",
  `    WHERE course.slug = '${expectedSlug}' AND version.version_number = 9 AND translation.language_code = target_language_code;`,
  "    IF course_count <> 1 OR module_count <> 7 OR lesson_count <> 36 THEN",
  "      RAISE EXCEPTION 'Incomplete % translation (courses %, modules %, lessons %)', target_language_code, course_count, module_count, lesson_count;",
  "    END IF;",
  "  END LOOP;",
  "END",
  "$verify$;",
  "",
  "COMMIT;",
  "",
);

const migrationPath = join(directory, "..", "migrations", "20261024190000_academy_course_languages.sql");
writeFileSync(migrationPath, sql.join("\n"), "utf8");
console.log(`Wrote ${migrationPath} (${Buffer.byteLength(sql.join("\n"), "utf8")} bytes)`);
