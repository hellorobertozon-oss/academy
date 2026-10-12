import "server-only";

import { requireAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";

type AcademyClient = Awaited<ReturnType<typeof createAcademyServerClient>>;

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
  moduleCount: number;
  lessonCount: number;
  completedLessonCount: number;
};

export type LearningCourseOutline = {
  id: number;
  slug: string;
  title: string;
  description: string;
  modules: Array<{
    id: number;
    title: string;
    summary: string;
    lessons: Array<{ id: number; title: string; summary: string; completed: boolean }>;
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
    content: unknown;
    product_bullets: string[];
    completed: boolean;
  };
  previousLessonId: number | null;
  nextLessonId: number | null;
  lessonNumber: number;
  lessonCount: number;
};

export type LearningLeaderboardEntry = {
  position: number;
  displayName: string;
  city: string | null;
  totalPoints: number;
  isCurrentUser: boolean;
};

type CourseRow = { id: number; slug: string; published_version_id: number | null };
type CourseTranslationRow = { course_version_id: number; title: string; description: string };
type ModuleRow = { id: number; course_version_id: number; sort_order: number };
type ModuleTranslationRow = { module_id: number; title: string; summary: string };
type LessonRow = { id: number; module_id: number; sort_order: number };
type LessonCompletionRow = { lesson_id: number; points_awarded: number };
type LessonTranslationRow = {
  lesson_id: number;
  title: string;
  summary: string;
  youtube_video_id: string | null;
  content: unknown;
  product_bullets: string[];
};

async function withEmployeeClient<T>(
  read: (client: AcademyClient, languageCode: string) => Promise<LearningRead<T>>,
): Promise<LearningRead<T>> {
  const profile = await requireAcademyProfile();
  if (profile.role !== "employee") return { status: "forbidden" };

  try {
    return await read(await createAcademyServerClient(), profile.preferred_language);
  } catch {
    return { status: "error" };
  }
}

export async function readAssignedCourses(): Promise<LearningRead<LearningCourseCard[]>> {
  return withEmployeeClient<LearningCourseCard[]>(async (client, languageCode) => {
    const { data: courses, error: coursesError } = await client
      .from("courses")
      .select("id, slug, published_version_id")
      .not("published_version_id", "is", null)
      .order("updated_at", { ascending: false });
    if (coursesError) return { status: "error" };
    if (!courses?.length) return { status: "ok", data: [], languageCode };

    const courseRows = courses as CourseRow[];
    const versionIds = courseRows.flatMap((course) => course.published_version_id === null ? [] : [course.published_version_id]);
    const [translationsResult, modulesResult] = await Promise.all([
      client
        .from("course_translations")
        .select("course_version_id, title, description")
        .in("course_version_id", versionIds),
      client
        .from("course_modules")
        .select("id, course_version_id, sort_order")
        .in("course_version_id", versionIds),
    ]);
    if (translationsResult.error || modulesResult.error) return { status: "error" };

    const translations = (translationsResult.data ?? []) as CourseTranslationRow[];
    const modules = (modulesResult.data ?? []) as ModuleRow[];
    const moduleIds = modules.map((courseModule) => courseModule.id);
    const lessonsResult = moduleIds.length
      ? await client.from("course_lessons").select("id, module_id, sort_order").in("module_id", moduleIds)
      : { data: [], error: null };
    if (lessonsResult.error) return { status: "error" };

    const lessonRows = (lessonsResult.data ?? []) as LessonRow[];
    const lessonIds = lessonRows.map((lesson) => lesson.id);
    const completionsResult = lessonIds.length
      ? await client.from("lesson_completions").select("lesson_id").in("lesson_id", lessonIds)
      : { data: [], error: null };
    if (completionsResult.error) return { status: "error" };

    const modulesByVersion = new Map<number, number>();
    for (const courseModule of modules) {
      modulesByVersion.set(courseModule.course_version_id, (modulesByVersion.get(courseModule.course_version_id) ?? 0) + 1);
    }
    const lessonCountsByModule = new Map<number, number>();
    for (const lesson of lessonRows) {
      lessonCountsByModule.set(lesson.module_id, (lessonCountsByModule.get(lesson.module_id) ?? 0) + 1);
    }
    const lessonsByVersion = new Map<number, number>();
    for (const courseModule of modules) {
      lessonsByVersion.set(
        courseModule.course_version_id,
        (lessonsByVersion.get(courseModule.course_version_id) ?? 0) + (lessonCountsByModule.get(courseModule.id) ?? 0),
      );
    }
    const moduleById = new Map(modules.map((courseModule) => [courseModule.id, courseModule]));
    const lessonById = new Map(lessonRows.map((lesson) => [lesson.id, lesson]));
    const completedCountsByVersion = new Map<number, number>();
    for (const completion of (completionsResult.data ?? []) as Array<Pick<LessonCompletionRow, "lesson_id">>) {
      const lesson = lessonById.get(completion.lesson_id);
      const courseModule = lesson ? moduleById.get(lesson.module_id) : undefined;
      if (courseModule) {
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
          moduleCount: modulesByVersion.get(course.published_version_id) ?? 0,
          lessonCount: lessonsByVersion.get(course.published_version_id) ?? 0,
          completedLessonCount: completedCountsByVersion.get(course.published_version_id) ?? 0,
        }];
      }),
    };
  });
}

async function readCourseOutlineWithClient(
  client: AcademyClient,
  slug: string,
  languageCode: string,
): Promise<LearningRead<LearningCourseOutline>> {
  const { data: course, error: courseError } = await client
    .from("courses")
    .select("id, slug, published_version_id")
    .eq("slug", slug)
    .not("published_version_id", "is", null)
    .maybeSingle();
  if (courseError) return { status: "error" };
  if (!course) return { status: "not-found" };

  const courseRow = course as CourseRow;
  if (courseRow.published_version_id === null) return { status: "not-found" };
  const [courseTranslationResult, modulesResult] = await Promise.all([
    client
      .from("course_translations")
      .select("course_version_id, title, description")
      .eq("course_version_id", courseRow.published_version_id)
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
          .select("module_id, title, summary")
          .in("module_id", moduleIds),
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
  const [lessonTranslationsResult, completionsResult] = lessonIds.length
    ? await Promise.all([
        client
          .from("lesson_translations")
          .select("lesson_id, title, summary")
          .in("lesson_id", lessonIds),
        client
          .from("lesson_completions")
          .select("lesson_id")
          .in("lesson_id", lessonIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (lessonTranslationsResult.error || completionsResult.error) return { status: "error" };

  const moduleTranslations = new Map(
    ((moduleTranslationsResult.data ?? []) as ModuleTranslationRow[]).map((translation) => [translation.module_id, translation]),
  );
  const lessonTranslations = new Map(
    ((lessonTranslationsResult.data ?? []) as Array<Pick<LessonTranslationRow, "lesson_id" | "title" | "summary">>)
      .map((translation) => [translation.lesson_id, translation]),
  );
  const completedLessonIds = new Set(
    ((completionsResult.data ?? []) as Array<Pick<LessonCompletionRow, "lesson_id">>)
      .map((completion) => completion.lesson_id),
  );
  const courseTranslation = courseTranslationResult.data as CourseTranslationRow;
  const outline: LearningCourseOutline = {
    id: courseRow.id,
    slug: courseRow.slug,
    title: courseTranslation.title,
    description: courseTranslation.description,
    modules: modules.flatMap((courseModule) => {
      const moduleTranslation = moduleTranslations.get(courseModule.id);
      if (!moduleTranslation) return [];
      return [{
        id: courseModule.id,
        title: moduleTranslation.title,
        summary: moduleTranslation.summary,
        lessons: lessons.flatMap((lesson) => {
          if (lesson.module_id !== courseModule.id) return [];
          const lessonTranslation = lessonTranslations.get(lesson.id);
          return lessonTranslation
            ? [{
                id: lesson.id,
                title: lessonTranslation.title,
                summary: lessonTranslation.summary,
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
  return withEmployeeClient((client, languageCode) => readCourseOutlineWithClient(client, slug, languageCode));
}

export async function readCourseLesson(
  slug: string,
  lessonId: number,
): Promise<LearningRead<LearningLesson>> {
  return withEmployeeClient(async (client, languageCode) => {
    const outlineResult = await readCourseOutlineWithClient(client, slug, languageCode);
    if (outlineResult.status !== "ok") return outlineResult;

    let parentModule: LearningCourseOutline["modules"][number] | undefined;
    let lessonNumber = 0;
    for (const courseModule of outlineResult.data.modules) {
      const index = courseModule.lessons.findIndex((lesson) => lesson.id === lessonId);
      if (index >= 0) {
        parentModule = courseModule;
        lessonNumber += index + 1;
        break;
      }
      lessonNumber += courseModule.lessons.length;
    }
    if (!parentModule) return { status: "not-found" };

    const { data: translation, error: translationError } = await client
      .from("lesson_translations")
      .select("lesson_id, title, summary, youtube_video_id, content, product_bullets")
      .eq("lesson_id", lessonId)
      .maybeSingle();
    if (translationError) return { status: "error" };
    if (!translation) return { status: "not-found" };

    const allLessons = outlineResult.data.modules.flatMap((courseModule) => courseModule.lessons);
    const lessonIndex = allLessons.findIndex((lesson) => lesson.id === lessonId);
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
          content: lessonTranslation.content,
          product_bullets: lessonTranslation.product_bullets,
          completed: parentModule.lessons.find((courseLesson) => courseLesson.id === lessonId)?.completed ?? false,
        },
        previousLessonId: lessonIndex > 0 ? allLessons[lessonIndex - 1].id : null,
        nextLessonId: lessonIndex >= 0 && lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1].id : null,
        lessonNumber,
        lessonCount: allLessons.length,
      },
    };
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

export async function readEmployeeLeaderboard(): Promise<LearningRead<LearningLeaderboardEntry[]>> {
  return withEmployeeClient<LearningLeaderboardEntry[]>(async (client, languageCode) => {
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
        city: value.city,
        totalPoints,
        isCurrentUser: value.is_current_user,
      });
    }

    return { status: "ok", data: entries, languageCode };
  });
}
