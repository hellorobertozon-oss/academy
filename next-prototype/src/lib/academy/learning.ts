import "server-only";

import { cookies } from "next/headers";
import type { LessonConversationMessage } from "@/lib/admin/content-validation";
import { requireAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";
import { createAcademyImageUrlMap } from "@/lib/academy/content-images";

type AcademyClient = Awaited<ReturnType<typeof createAcademyServerClient>>;
const ACADEMY_LANGUAGE_CODES = ["pl", "en", "de", "cs", "fr", "it"] as const;

export type LearningRead<T> =
  | { status: "ok"; data: T; languageCode: string }
  | { status: "error" }
  | { status: "not-found" }
  | { status: "forbidden" };

export type LearningCourseCard = {
  id: number;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  moduleCount: number;
  lessonCount: number;
  completedLessonCount: number;
};

export type LearningCourseOutline = {
  id: number;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  modules: Array<{
    id: number;
    title: string;
    summary: string;
    imageUrl: string | null;
    lessons: Array<{ id: number; title: string; summary: string; imageUrl: string | null; completed: boolean }>;
    quiz: { id: number; title: string; passed: boolean; unlocked: boolean } | null;
  }>;
};

export type LearningLesson = {
  course: Pick<LearningCourseOutline, "id" | "slug" | "title">;
  module: { id: number; title: string };
  lesson: {
    id: number;
    title: string;
    summary: string;
    youtube_video_id: string | null;
    youtube_video_ids: string[];
    content: unknown;
    product_bullets: string[];
    key_points_title: string;
    conversation_title: string;
    conversation: LessonConversationMessage[];
    imageUrl: string | null;
    completed: boolean;
  };
  previousLessonId: number | null;
  nextLessonId: number | null;
  nextQuizId: number | null;
  nextQuizUnlocked: boolean;
  lessonNumber: number;
  lessonCount: number;
};

export type LearningLeaderboardEntry = {
  position: number;
  displayName: string;
  storeName: string | null;
  totalPoints: number;
  isCurrentUser: boolean;
};

export type LearningLeaderboardRead =
  | { status: "ok"; data: LearningLeaderboardEntry[]; languageCode: string; enabled: boolean }
  | { status: "error" }
  | { status: "forbidden" };

type CourseRow = { id: number; slug: string; published_version_id: number | null };
type CourseTranslationRow = { course_version_id: number; title: string; description: string; image_path: string | null };
type ModuleRow = { id: number; course_version_id: number; sort_order: number };
type ModuleTranslationRow = { module_id: number; title: string; summary: string; image_path: string | null };
type LessonRow = { id: number; module_id: number; sort_order: number };
type LessonCompletionRow = { lesson_id: number; points_awarded: number };
type ModuleQuizRow = { id: number; module_id: number; pass_percentage: number };
type ModuleQuizTranslationRow = { quiz_id: number; title: string };
type ModuleQuizAttemptRow = { quiz_id: number };
type LessonTranslationRow = {
  lesson_id: number;
  title: string;
  summary: string;
  youtube_video_id: string | null;
  youtube_video_ids: string[];
  content: unknown;
  product_bullets: string[];
  key_points_title: string;
  conversation_title: string;
  conversation: LessonConversationMessage[];
  image_path: string | null;
};

async function withEmployeeClient<T>(
  read: (client: AcademyClient, languageCode: string, profileId: string) => Promise<LearningRead<T>>,
): Promise<LearningRead<T>> {
  const profile = await requireAcademyProfile();
  if (profile.role !== "employee") return { status: "forbidden" };

  try {
    return await read(await createAcademyServerClient(), profile.preferred_language, profile.id);
  } catch {
    return { status: "error" };
  }
}

async function withAdminPreviewClient<T>(
  read: (client: AcademyClient, languageCode: string, profileId: string) => Promise<LearningRead<T>>,
): Promise<LearningRead<T>> {
  const profile = await requireAcademyProfile();
  if (profile.role !== "admin") return { status: "forbidden" };

  try {
    const previewLanguage = (await cookies()).get("xzone-academy-preview-language")?.value;
    const languageCode = ACADEMY_LANGUAGE_CODES.includes(previewLanguage as (typeof ACADEMY_LANGUAGE_CODES)[number])
      ? previewLanguage as (typeof ACADEMY_LANGUAGE_CODES)[number]
      : profile.preferred_language;
    return await read(await createAcademyServerClient(), languageCode, profile.id);
  } catch {
    return { status: "error" };
  }
}

export async function readAssignedCourses(): Promise<LearningRead<LearningCourseCard[]>> {
  return withEmployeeClient<LearningCourseCard[]>(async (client, languageCode, profileId) => {
    const { data: courses, error: coursesError } = await client
      .from("courses")
      .select("id, slug, published_version_id")
      .not("published_version_id", "is", null)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });
    if (coursesError) return { status: "error" };
    if (!courses?.length) return { status: "ok", data: [], languageCode };

    const courseRows = courses as CourseRow[];
    const versionIds = courseRows.flatMap((course) => course.published_version_id === null ? [] : [course.published_version_id]);
    const [translationsResult, modulesResult] = await Promise.all([
      client
        .from("course_translations")
        .select("course_version_id, title, description, image_path")
        .in("course_version_id", versionIds)
        .eq("language_code", languageCode),
      client
        .from("course_modules")
        .select("id, course_version_id, sort_order")
        .in("course_version_id", versionIds),
    ]);
    if (translationsResult.error || modulesResult.error) return { status: "error" };

    const translations = (translationsResult.data ?? []) as CourseTranslationRow[];
    const imageUrls = await createAcademyImageUrlMap(client, translations.map((translation) => translation.image_path));
    const modules = (modulesResult.data ?? []) as ModuleRow[];
    const moduleIds = modules.map((courseModule) => courseModule.id);
    const [moduleTranslationsResult, lessonsResult] = moduleIds.length
      ? await Promise.all([
          client
            .from("module_translations")
            .select("module_id")
            .in("module_id", moduleIds)
            .eq("language_code", languageCode),
          client.from("course_lessons").select("id, module_id, sort_order").in("module_id", moduleIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];
    if (moduleTranslationsResult.error || lessonsResult.error) return { status: "error" };

    const lessonRows = (lessonsResult.data ?? []) as LessonRow[];
    const lessonIds = lessonRows.map((lesson) => lesson.id);
    const [lessonTranslationsResult, completionsResult] = lessonIds.length
      ? await Promise.all([
          client
            .from("lesson_translations")
            .select("lesson_id")
            .in("lesson_id", lessonIds)
            .eq("language_code", languageCode),
          client
            .from("lesson_completions")
            .select("lesson_id")
            .eq("profile_id", profileId)
            .in("lesson_id", lessonIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];
    if (lessonTranslationsResult.error || completionsResult.error) return { status: "error" };

    const translatedModuleIds = new Set(
      ((moduleTranslationsResult.data ?? []) as Array<{ module_id: number }>).map((translation) => translation.module_id),
    );
    const translatedLessonIds = new Set(
      ((lessonTranslationsResult.data ?? []) as Array<{ lesson_id: number }>).map((translation) => translation.lesson_id),
    );
    const modulesByVersion = new Map<number, number>();
    for (const courseModule of modules) {
      if (!translatedModuleIds.has(courseModule.id)) continue;
      modulesByVersion.set(courseModule.course_version_id, (modulesByVersion.get(courseModule.course_version_id) ?? 0) + 1);
    }
    const moduleById = new Map(modules.map((courseModule) => [courseModule.id, courseModule]));
    const lessonById = new Map(lessonRows.map((lesson) => [lesson.id, lesson]));
    const lessonsByVersion = new Map<number, number>();
    for (const lessonId of translatedLessonIds) {
      const lesson = lessonById.get(lessonId);
      const courseModule = lesson ? moduleById.get(lesson.module_id) : undefined;
      if (!courseModule || !translatedModuleIds.has(courseModule.id)) continue;
      lessonsByVersion.set(
        courseModule.course_version_id,
        (lessonsByVersion.get(courseModule.course_version_id) ?? 0) + 1,
      );
    }
    const completedCountsByVersion = new Map<number, number>();
    for (const completion of (completionsResult.data ?? []) as Array<Pick<LessonCompletionRow, "lesson_id">>) {
      if (!translatedLessonIds.has(completion.lesson_id)) continue;
      const lesson = lessonById.get(completion.lesson_id);
      const courseModule = lesson ? moduleById.get(lesson.module_id) : undefined;
      if (courseModule && translatedModuleIds.has(courseModule.id)) {
        completedCountsByVersion.set(
          courseModule.course_version_id,
          (completedCountsByVersion.get(courseModule.course_version_id) ?? 0) + 1,
        );
      }
    }
    const translationByVersion = new Map(translations.map((translation) => [translation.course_version_id, translation]));

    return {
      status: "ok",
      languageCode,
      data: courseRows.flatMap((course) => {
        if (course.published_version_id === null) return [];
        const translation = translationByVersion.get(course.published_version_id);
        if (!translation) return [];
        return [{
          id: course.id,
          slug: course.slug,
          title: translation.title,
          description: translation.description,
          imageUrl: translation.image_path ? imageUrls.get(translation.image_path) ?? null : null,
          moduleCount: modulesByVersion.get(course.published_version_id) ?? 0,
          lessonCount: lessonsByVersion.get(course.published_version_id) ?? 0,
          completedLessonCount: completedCountsByVersion.get(course.published_version_id) ?? 0,
        }];
      }),
    };
  });
}

export async function readAdminPreviewCourses(): Promise<LearningRead<LearningCourseCard[]>> {
  return withAdminPreviewClient<LearningCourseCard[]>(async (client, languageCode) => {
    const { data: courses, error: coursesError } = await client
      .from("courses")
      .select("id, slug, published_version_id")
      .not("published_version_id", "is", null)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });
    if (coursesError) return { status: "error" };
    if (!courses?.length) return { status: "ok", data: [], languageCode };

    const courseRows = courses as CourseRow[];
    const versionIds = courseRows.flatMap((course) => course.published_version_id === null ? [] : [course.published_version_id]);
    const [translationsResult, modulesResult] = await Promise.all([
      client
        .from("course_translations")
        .select("course_version_id, title, description, image_path")
        .in("course_version_id", versionIds)
        .eq("language_code", languageCode),
      client
        .from("course_modules")
        .select("id, course_version_id, sort_order")
        .in("course_version_id", versionIds),
    ]);
    if (translationsResult.error || modulesResult.error) return { status: "error" };

    const modules = (modulesResult.data ?? []) as ModuleRow[];
    const moduleIds = modules.map((module) => module.id);
    const [moduleTranslationsResult, lessonsResult] = moduleIds.length
      ? await Promise.all([
          client
            .from("module_translations")
            .select("module_id")
            .in("module_id", moduleIds)
            .eq("language_code", languageCode),
          client
            .from("course_lessons")
            .select("id, module_id, sort_order")
            .in("module_id", moduleIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];
    if (moduleTranslationsResult.error || lessonsResult.error) return { status: "error" };

    const lessons = (lessonsResult.data ?? []) as LessonRow[];
    const lessonIds = lessons.map((lesson) => lesson.id);
    const lessonTranslationsResult = lessonIds.length
      ? await client
          .from("lesson_translations")
          .select("lesson_id")
          .in("lesson_id", lessonIds)
          .eq("language_code", languageCode)
      : { data: [], error: null };
    if (lessonTranslationsResult.error) return { status: "error" };

    const courseTranslations = (translationsResult.data ?? []) as CourseTranslationRow[];
    const imageUrls = await createAcademyImageUrlMap(client, courseTranslations.map((translation) => translation.image_path));
    const translatedModuleIds = new Set(
      ((moduleTranslationsResult.data ?? []) as Array<{ module_id: number }>).map((translation) => translation.module_id),
    );
    const translatedLessonIds = new Set(
      ((lessonTranslationsResult.data ?? []) as Array<{ lesson_id: number }>).map((translation) => translation.lesson_id),
    );
    const modulesByVersion = new Map<number, ModuleRow[]>();
    for (const courseModule of modules) {
      if (!translatedModuleIds.has(courseModule.id)) continue;
      const items = modulesByVersion.get(courseModule.course_version_id) ?? [];
      items.push(courseModule);
      modulesByVersion.set(courseModule.course_version_id, items);
    }
    const lessonsByModule = new Map<number, number>();
    for (const lesson of lessons) {
      if (!translatedLessonIds.has(lesson.id) || !translatedModuleIds.has(lesson.module_id)) continue;
      lessonsByModule.set(lesson.module_id, (lessonsByModule.get(lesson.module_id) ?? 0) + 1);
    }
    const translationByVersion = new Map(courseTranslations.map((translation) => [translation.course_version_id, translation]));

    return {
      status: "ok",
      languageCode,
      data: courseRows.flatMap((course) => {
        if (course.published_version_id === null) return [];
        const translation = translationByVersion.get(course.published_version_id);
        if (!translation) return [];
        const visibleModules = modulesByVersion.get(course.published_version_id) ?? [];
        return [{
          id: course.id,
          slug: course.slug,
          title: translation.title,
          description: translation.description,
          imageUrl: translation.image_path ? imageUrls.get(translation.image_path) ?? null : null,
          moduleCount: visibleModules.length,
          lessonCount: visibleModules.reduce((total, courseModule) => total + (lessonsByModule.get(courseModule.id) ?? 0), 0),
          completedLessonCount: 0,
        }];
      }),
    };
  });
}

async function readCourseOutlineWithClient(
  client: AcademyClient,
  slug: string,
  languageCode: string,
  profileId: string,
): Promise<LearningRead<LearningCourseOutline>> {
  const { data: course, error: courseError } = await client
    .from("courses")
    .select("id, slug, published_version_id")
    .eq("slug", slug)
    .not("published_version_id", "is", null)
    .eq("is_active", true)
    .maybeSingle();
  if (courseError) return { status: "error" };
  if (!course) return { status: "not-found" };

  const courseRow = course as CourseRow;
  if (courseRow.published_version_id === null) return { status: "not-found" };
  const [courseTranslationResult, modulesResult] = await Promise.all([
    client
      .from("course_translations")
      .select("course_version_id, title, description, image_path")
      .eq("course_version_id", courseRow.published_version_id)
      .eq("language_code", languageCode)
      .maybeSingle(),
    client
      .from("course_modules")
      .select("id, course_version_id, sort_order")
      .eq("course_version_id", courseRow.published_version_id)
      .order("sort_order"),
  ]);
  if (courseTranslationResult.error || modulesResult.error) return { status: "error" };
  if (!courseTranslationResult.data) return { status: "not-found" };

  const modules = (modulesResult.data ?? []) as ModuleRow[];
  const moduleIds = modules.map((courseModule) => courseModule.id);
  const [moduleTranslationsResult, lessonsResult] = moduleIds.length
    ? await Promise.all([
        client
          .from("module_translations")
          .select("module_id, title, summary, image_path")
          .in("module_id", moduleIds)
          .eq("language_code", languageCode),
        client
          .from("course_lessons")
          .select("id, module_id, sort_order")
          .in("module_id", moduleIds)
          .order("sort_order"),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (moduleTranslationsResult.error || lessonsResult.error) return { status: "error" };

  const lessons = (lessonsResult.data ?? []) as LessonRow[];
  const lessonIds = lessons.map((lesson) => lesson.id);
  const [lessonTranslationsResult, completionsResult, quizzesResult] = await Promise.all([
    lessonIds.length
      ? client
          .from("lesson_translations")
          .select("lesson_id, title, summary, image_path")
          .in("lesson_id", lessonIds)
          .eq("language_code", languageCode)
      : Promise.resolve({ data: [], error: null }),
    lessonIds.length
      ? client
          .from("lesson_completions")
          .select("lesson_id")
          .eq("profile_id", profileId)
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [], error: null }),
    moduleIds.length
      ? client.from("quizzes").select("id, module_id, pass_percentage").in("module_id", moduleIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (lessonTranslationsResult.error || completionsResult.error || quizzesResult.error) return { status: "error" };

  const quizRows = (quizzesResult.data ?? []) as ModuleQuizRow[];
  const quizIds = quizRows.map((quiz) => quiz.id);
  const [quizTranslationsResult, quizAttemptsResult] = quizIds.length
    ? await Promise.all([
        client
          .from("quiz_translations")
          .select("quiz_id, title")
          .in("quiz_id", quizIds)
          .eq("language_code", languageCode),
        client
          .from("quiz_attempts")
          .select("quiz_id")
          .eq("profile_id", profileId)
          .eq("passed", true)
          .in("quiz_id", quizIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (quizTranslationsResult.error || quizAttemptsResult.error) return { status: "error" };

  const moduleTranslationRows = (moduleTranslationsResult.data ?? []) as ModuleTranslationRow[];
  const lessonTranslationRows = (lessonTranslationsResult.data ?? []) as Array<Pick<LessonTranslationRow, "lesson_id" | "title" | "summary" | "image_path">>;
  const courseTranslation = courseTranslationResult.data as CourseTranslationRow;
  const imageUrls = await createAcademyImageUrlMap(client, [
    courseTranslation.image_path,
    ...moduleTranslationRows.map((translation) => translation.image_path),
    ...lessonTranslationRows.map((translation) => translation.image_path),
  ]);

  const moduleTranslations = new Map(
    moduleTranslationRows.map((translation) => [translation.module_id, translation]),
  );
  const lessonTranslations = new Map(
    lessonTranslationRows.map((translation) => [translation.lesson_id, translation]),
  );
  const completedLessonIds = new Set(
    ((completionsResult.data ?? []) as Array<Pick<LessonCompletionRow, "lesson_id">>)
      .map((completion) => completion.lesson_id),
  );
  const translatedModuleIds = new Set(moduleTranslations.keys());
  const availableLessons = lessons.filter((lesson) =>
    translatedModuleIds.has(lesson.module_id) && lessonTranslations.has(lesson.id),
  );
  const quizUnlockedByModule = new Map<number, boolean>();
  let previousLessonsCompleted = true;
  for (const courseModule of modules) {
    const moduleLessons = availableLessons.filter((lesson) => lesson.module_id === courseModule.id);
    const currentModuleCompleted = moduleLessons.length > 0
      && moduleLessons.every((lesson) => completedLessonIds.has(lesson.id));
    quizUnlockedByModule.set(courseModule.id, previousLessonsCompleted && currentModuleCompleted);
    previousLessonsCompleted = previousLessonsCompleted
      && moduleLessons.every((lesson) => completedLessonIds.has(lesson.id));
  }
  const quizTranslations = (quizTranslationsResult.data ?? []) as ModuleQuizTranslationRow[];
  const passedQuizIds = new Set(
    ((quizAttemptsResult.data ?? []) as ModuleQuizAttemptRow[])
      .map((attempt) => attempt.quiz_id),
  );
  const quizByModule = new Map(
    quizRows.flatMap((quiz) => {
      const translation = quizTranslations.find((item) => item.quiz_id === quiz.id);
      return translation ? [[quiz.module_id, {
        id: quiz.id,
        title: translation.title,
        passed: passedQuizIds.has(quiz.id),
        unlocked: quizUnlockedByModule.get(quiz.module_id) ?? false,
      }] as const] : [];
    }),
  );
  const outline: LearningCourseOutline = {
    id: courseRow.id,
    slug: courseRow.slug,
    title: courseTranslation.title,
    description: courseTranslation.description,
    imageUrl: courseTranslation.image_path ? imageUrls.get(courseTranslation.image_path) ?? null : null,
    modules: modules.flatMap((courseModule) => {
      const moduleTranslation = moduleTranslations.get(courseModule.id);
      if (!moduleTranslation) return [];
      return [{
        id: courseModule.id,
        title: moduleTranslation.title,
        summary: moduleTranslation.summary,
        imageUrl: moduleTranslation.image_path ? imageUrls.get(moduleTranslation.image_path) ?? null : null,
        quiz: quizByModule.get(courseModule.id) ?? null,
        lessons: lessons.flatMap((lesson) => {
          if (lesson.module_id !== courseModule.id) return [];
          const lessonTranslation = lessonTranslations.get(lesson.id);
          return lessonTranslation
            ? [{
                id: lesson.id,
                title: lessonTranslation.title,
                summary: lessonTranslation.summary,
                imageUrl: lessonTranslation.image_path ? imageUrls.get(lessonTranslation.image_path) ?? null : null,
                completed: completedLessonIds.has(lesson.id),
              }]
            : [];
        }),
      }];
    }),
  };

  return { status: "ok", data: outline, languageCode };
}

export async function readCourseOutline(slug: string): Promise<LearningRead<LearningCourseOutline>> {
  return withEmployeeClient((client, languageCode, profileId) =>
    readCourseOutlineWithClient(client, slug, languageCode, profileId),
  );
}

export async function readAdminPreviewCourseOutline(slug: string): Promise<LearningRead<LearningCourseOutline>> {
  return withAdminPreviewClient(async (client, languageCode, profileId) => {
    const result = await readCourseOutlineWithClient(client, slug, languageCode, profileId);
    if (result.status !== "ok") return result;
    return {
      ...result,
      data: {
        ...result.data,
        modules: result.data.modules.map((courseModule) => ({
          ...courseModule,
          quiz: courseModule.quiz ? { ...courseModule.quiz, unlocked: false } : null,
          lessons: courseModule.lessons.map((lesson) => ({ ...lesson, completed: false })),
        })),
      },
    };
  });
}

async function readCourseLessonWithClient(
  client: AcademyClient,
  slug: string,
  lessonId: number,
  languageCode: string,
  profileId: string,
): Promise<LearningRead<LearningLesson>> {
  const outlineResult = await readCourseOutlineWithClient(client, slug, languageCode, profileId);
  if (outlineResult.status !== "ok") return outlineResult;

  let parentModule: LearningCourseOutline["modules"][number] | undefined;
  let lessonNumber = 0;
  let lessonIndexInModule = -1;
  for (const courseModule of outlineResult.data.modules) {
    const index = courseModule.lessons.findIndex((lesson) => lesson.id === lessonId);
    if (index >= 0) {
      parentModule = courseModule;
      lessonIndexInModule = index;
      lessonNumber += index + 1;
      break;
    }
    lessonNumber += courseModule.lessons.length;
  }
  if (!parentModule) return { status: "not-found" };

  const { data: translation, error: translationError } = await client
    .from("lesson_translations")
    .select("lesson_id, title, summary, youtube_video_id, youtube_video_ids, content, product_bullets, key_points_title, conversation_title, conversation")
    .eq("lesson_id", lessonId)
    .eq("language_code", languageCode)
    .maybeSingle();
  if (translationError) return { status: "error" };
  if (!translation) return { status: "not-found" };

  const allLessons = outlineResult.data.modules.flatMap((courseModule) => courseModule.lessons);
  const lessonIndex = allLessons.findIndex((lesson) => lesson.id === lessonId);
  const isLastLessonInModule = lessonIndexInModule === parentModule.lessons.length - 1;
  const nextQuizId = isLastLessonInModule ? parentModule.quiz?.id ?? null : null;
  const lessonTranslation = translation as LessonTranslationRow;
  return {
    status: "ok",
    languageCode,
    data: {
      course: {
        id: outlineResult.data.id,
        slug: outlineResult.data.slug,
        title: outlineResult.data.title,
      },
      module: { id: parentModule.id, title: parentModule.title },
      lesson: {
        id: lessonTranslation.lesson_id,
        title: lessonTranslation.title,
        summary: lessonTranslation.summary,
        youtube_video_id: lessonTranslation.youtube_video_id,
        youtube_video_ids: lessonTranslation.youtube_video_ids ?? [],
        content: lessonTranslation.content,
        product_bullets: lessonTranslation.product_bullets,
        key_points_title: lessonTranslation.key_points_title,
        conversation_title: lessonTranslation.conversation_title,
        conversation: lessonTranslation.conversation,
        imageUrl: parentModule.lessons.find((courseLesson) => courseLesson.id === lessonId)?.imageUrl ?? null,
        completed: parentModule.lessons.find((courseLesson) => courseLesson.id === lessonId)?.completed ?? false,
      },
      previousLessonId: lessonIndex > 0 ? allLessons[lessonIndex - 1].id : null,
      nextLessonId: lessonIndex >= 0 && lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1].id : null,
      nextQuizId,
      nextQuizUnlocked: nextQuizId !== null && parentModule.quiz?.unlocked === true,
      lessonNumber,
      lessonCount: allLessons.length,
    },
  };
}

export async function readCourseLesson(
  slug: string,
  lessonId: number,
): Promise<LearningRead<LearningLesson>> {
  return withEmployeeClient((client, languageCode, profileId) =>
    readCourseLessonWithClient(client, slug, lessonId, languageCode, profileId),
  );
}

export async function readAdminPreviewCourseLesson(
  slug: string,
  lessonId: number,
): Promise<LearningRead<LearningLesson>> {
  return withAdminPreviewClient(async (client, languageCode, profileId) => {
    const result = await readCourseLessonWithClient(client, slug, lessonId, languageCode, profileId);
    if (result.status !== "ok") return result;
    return { ...result, data: { ...result.data, lesson: { ...result.data.lesson, completed: false } } };
  });
}

export async function readEmployeePoints(): Promise<LearningRead<number>> {
  return withEmployeeClient<number>(async (client, languageCode) => {
    const [lessonPointsResult, quizPointsResult] = await Promise.all([
      client
        .from("lesson_completions")
        .select("lesson_id", { count: "exact", head: true }),
      client
        .from("quiz_attempts")
        .select("id", { count: "exact", head: true })
        .eq("points_awarded", 20),
    ]);
    if (lessonPointsResult.error || quizPointsResult.error) return { status: "error" };

    const lessonPoints = (lessonPointsResult.count ?? 0) * 10;
    const quizPoints = (quizPointsResult.count ?? 0) * 20;
    return { status: "ok", data: lessonPoints + quizPoints, languageCode };
  });
}

export async function readEmployeeLeaderboard(): Promise<LearningLeaderboardRead> {
  const profile = await requireAcademyProfile();
  if (profile.role !== "employee") return { status: "forbidden" };

  try {
    const client = await createAcademyServerClient();
    const { data: settings, error: settingsError } = await client
      .from("academy_settings")
      .select("leaderboard_enabled")
      .eq("id", true)
      .maybeSingle();

    if (settingsError || typeof settings?.leaderboard_enabled !== "boolean") {
      return { status: "error" };
    }
    if (!settings.leaderboard_enabled) {
      return { status: "ok", data: [], languageCode: profile.preferred_language, enabled: false };
    }

    const { data, error } = await client.rpc("read_academy_leaderboard");
    if (error || !Array.isArray(data)) return { status: "error" };

    const entries: LearningLeaderboardEntry[] = [];
    for (const value of data as Array<Record<string, unknown>>) {
      const position = Number(value.leaderboard_position);
      const totalPoints = Number(value.total_points);
      if (
        !Number.isSafeInteger(position)
        || position <= 0
        || !Number.isSafeInteger(totalPoints)
        || totalPoints < 0
        || typeof value.display_name !== "string"
        || (value.city !== null && typeof value.city !== "string")
        || typeof value.is_current_user !== "boolean"
      ) {
        return { status: "error" };
      }
      entries.push({
        position,
        displayName: value.display_name,
        storeName: value.city,
        totalPoints,
        isCurrentUser: value.is_current_user,
      });
    }

    return {
      status: "ok",
      data: entries,
      languageCode: profile.preferred_language,
      enabled: true,
    };
  } catch {
    return { status: "error" };
  }
}
