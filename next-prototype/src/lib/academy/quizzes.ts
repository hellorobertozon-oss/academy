import "server-only";

import { requireAcademyProfile } from "@/lib/auth/profile";
import type { LearningRead } from "@/lib/academy/learning";
import { createAcademyServerClient } from "@/lib/supabase/server";

type QuizRow = {
  id: number;
  course_version_id: number;
  module_id: number | null;
  lesson_id: number | null;
  pass_percentage: number;
};
type QuizTranslationRow = { quiz_id: number; title: string; instructions: string };
type QuestionRow = { id: number; quiz_id: number; sort_order: number };
type QuestionTranslationRow = { question_id: number; prompt: string };
type OptionRow = { id: number; question_id: number; sort_order: number };
type OptionTranslationRow = { option_id: number; label: string };
type CourseVersionRow = { id: number; course_id: number };
type CourseRow = { id: number; slug: string };
type CourseTranslationRow = { course_version_id: number; title: string };
type ModuleTranslationRow = { module_id: number; title: string };
type ModuleRow = { id: number; course_version_id: number; sort_order: number };
type LessonRow = { id: number; module_id: number; sort_order: number };
type LessonTranslationRow = { lesson_id: number; title: string };
type AttemptRow = {
  id: number;
  score_percentage: number;
  correct_count: number;
  question_count: number;
  passed: boolean;
  points_awarded: number;
  submitted_at: string;
};

export type LearningQuizCard = {
  id: number;
  title: string;
  instructions: string;
  courseSlug: string;
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string | null;
  questionCount: number;
  passPercentage: number;
  unlocked: boolean;
};

export type LearningQuiz = LearningQuizCard & {
  nextLessonId: number | null;
  questions: Array<{
    id: number;
    prompt: string;
    options: Array<{ id: number; label: string }>;
  }>;
  attempts: Array<{
    attemptNumber: number;
    scorePercentage: number;
    correctCount: number;
    questionCount: number;
    passed: boolean;
    pointsAwarded: number;
    submittedAt: string;
  }>;
  attemptCount: number;
};

export type LearningQuizRead = LearningRead<LearningQuiz> | { status: "locked"; languageCode: string };

type QuizClient = Awaited<ReturnType<typeof createAcademyServerClient>>;

async function withEmployeeQuizClient<
  T,
  R extends LearningRead<T> | { status: "locked"; languageCode: string } = LearningRead<T>,
>(
  read: (client: QuizClient, languageCode: string, profileId: string) => Promise<R>,
): Promise<R | { status: "forbidden" } | { status: "error" }> {
  const profile = await requireAcademyProfile();
  if (profile.role !== "employee") return { status: "forbidden" };
  try {
    return await read(await createAcademyServerClient(), profile.preferred_language, profile.id);
  } catch {
    return { status: "error" };
  }
}

async function hasCompletedQuizPrerequisites(
  client: QuizClient,
  quiz: QuizRow,
  profileId: string,
  languageCode: string,
  prerequisiteContent?: { modules: ModuleRow[]; lessons: LessonRow[] },
): Promise<boolean> {
  const content = prerequisiteContent ?? await readQuizPrerequisiteContent(client, [quiz], languageCode);
  if (!content) return false;
  const lessonIds = getRequiredLessonIds(quiz, content.modules, content.lessons);
  if (lessonIds.length === 0) return false;

  const completionsResult = await client
    .from("lesson_completions")
    .select("lesson_id")
    .eq("profile_id", profileId)
    .in("lesson_id", lessonIds);
  if (completionsResult.error) return false;

  const completedLessonIds = new Set(
    ((completionsResult.data ?? []) as Array<{ lesson_id: number }>).map((completion) => completion.lesson_id),
  );
  return lessonIds.every((lessonId) => completedLessonIds.has(lessonId));
}

async function readQuizPrerequisiteContent(
  client: QuizClient,
  quizzes: QuizRow[],
  languageCode: string,
): Promise<{ modules: ModuleRow[]; lessons: LessonRow[] } | null> {
  const versionIds = [...new Set(quizzes.map((quiz) => quiz.course_version_id))];
  if (versionIds.length === 0) return { modules: [], lessons: [] };

  const modulesResult = await client
    .from("course_modules")
    .select("id, course_version_id, sort_order")
    .in("course_version_id", versionIds)
    .order("sort_order");
  if (modulesResult.error) return null;

  const allModules = (modulesResult.data ?? []) as ModuleRow[];
  const allModuleIds = allModules.map((module) => module.id);
  if (allModuleIds.length === 0) return { modules: [], lessons: [] };

  const moduleTranslationsResult = await client
    .from("module_translations")
    .select("module_id")
    .in("module_id", allModuleIds)
    .eq("language_code", languageCode);
  if (moduleTranslationsResult.error) return null;
  const translatedModuleIds = new Set(
    ((moduleTranslationsResult.data ?? []) as Array<{ module_id: number }>).map((translation) => translation.module_id),
  );
  const modules = allModules.filter((module) => translatedModuleIds.has(module.id));
  const moduleIds = modules.map((module) => module.id);
  if (moduleIds.length === 0) return { modules, lessons: [] };

  const lessonsResult = await client
    .from("course_lessons")
    .select("id, module_id, sort_order")
    .in("module_id", moduleIds)
    .order("sort_order");
  if (lessonsResult.error) return null;

  const lessons = (lessonsResult.data ?? []) as LessonRow[];
  const lessonTranslationsResult = lessons.length
    ? await client
        .from("lesson_translations")
        .select("lesson_id")
        .in("lesson_id", lessons.map((lesson) => lesson.id))
        .eq("language_code", languageCode)
    : { data: [], error: null };
  if (lessonTranslationsResult.error) return null;
  const translatedLessonIds = new Set(
    ((lessonTranslationsResult.data ?? []) as Array<{ lesson_id: number }>).map((translation) => translation.lesson_id),
  );

  return { modules, lessons: lessons.filter((lesson) => translatedLessonIds.has(lesson.id)) };
}

function getRequiredLessonIds(quiz: QuizRow, modules: ModuleRow[], lessons: LessonRow[]): number[] {
  const versionModules = modules
    .filter((module) => module.course_version_id === quiz.course_version_id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const targetLesson = quiz.lesson_id === null ? undefined : lessons.find((lesson) => lesson.id === quiz.lesson_id);
  const targetModuleId = quiz.module_id ?? targetLesson?.module_id;
  if (targetModuleId === undefined || targetModuleId === null) return [];

  const targetModuleIndex = versionModules.findIndex((module) => module.id === targetModuleId);
  if (targetModuleIndex < 0) return [];

  return lessons
    .flatMap((lesson) => {
      const lessonModuleIndex = versionModules.findIndex((module) => module.id === lesson.module_id);
      if (lessonModuleIndex < 0 || lessonModuleIndex > targetModuleIndex) return [];
      if (lessonModuleIndex < targetModuleIndex || quiz.module_id !== null) return [lesson];
      return targetLesson && lesson.sort_order <= targetLesson.sort_order ? [lesson] : [];
    })
    .sort((a, b) => {
      const moduleOrderA = versionModules.find((module) => module.id === a.module_id)?.sort_order ?? 0;
      const moduleOrderB = versionModules.find((module) => module.id === b.module_id)?.sort_order ?? 0;
      return moduleOrderA - moduleOrderB || a.sort_order - b.sort_order;
    })
    .map((lesson) => lesson.id);
}

function getNextLessonId(quiz: QuizRow, modules: ModuleRow[], lessons: LessonRow[]): number | null {
  const versionModules = modules
    .filter((module) => module.course_version_id === quiz.course_version_id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const targetLesson = quiz.lesson_id === null ? undefined : lessons.find((lesson) => lesson.id === quiz.lesson_id);
  const targetModuleId = quiz.module_id ?? targetLesson?.module_id;
  if (targetModuleId === undefined || targetModuleId === null) return null;
  const targetModuleIndex = versionModules.findIndex((module) => module.id === targetModuleId);
  if (targetModuleIndex < 0) return null;

  const orderedLessons = versionModules.flatMap((module) =>
    lessons
      .filter((lesson) => lesson.module_id === module.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  );
  if (quiz.module_id !== null) {
    return orderedLessons.find((lesson) =>
      versionModules.findIndex((module) => module.id === lesson.module_id) > targetModuleIndex,
    )?.id ?? null;
  }

  const targetLessonIndex = orderedLessons.findIndex((lesson) => lesson.id === targetLesson?.id);
  return targetLessonIndex >= 0 ? orderedLessons[targetLessonIndex + 1]?.id ?? null : null;
}

export async function isLearningQuizUnlocked(quizId: number): Promise<boolean> {
  if (!Number.isSafeInteger(quizId) || quizId <= 0) return false;
  const profile = await requireAcademyProfile();
  if (profile.role !== "employee") return false;

  try {
    const client = await createAcademyServerClient();
    const { data, error } = await client
      .from("quizzes")
      .select("id, course_version_id, module_id, lesson_id, pass_percentage")
      .eq("id", quizId)
      .maybeSingle();
    if (error || !data) return false;
    return hasCompletedQuizPrerequisites(client, data as QuizRow, profile.id, profile.preferred_language);
  } catch {
    return false;
  }
}

export async function readAssignedQuizzes(): Promise<LearningRead<LearningQuizCard[]>> {
  return withEmployeeQuizClient<LearningQuizCard[]>(async (client, languageCode, profileId) => {
    const { data, error } = await client
      .from("quizzes")
      .select("id, course_version_id, module_id, lesson_id, pass_percentage")
      .order("id");
    if (error) return { status: "error" };

    const quizRows = (data ?? []) as QuizRow[];
    if (!quizRows.length) return { status: "ok", data: [], languageCode };
    const quizIds = quizRows.map((quiz) => quiz.id);
    const versionIds = [...new Set(quizRows.map((quiz) => quiz.course_version_id))];
    const lessonIds = quizRows.flatMap((quiz) => quiz.lesson_id === null ? [] : [quiz.lesson_id]);
    const [quizTranslationsResult, questionsResult, versionsResult, prerequisiteContent] = await Promise.all([
      client
        .from("quiz_translations")
        .select("quiz_id, title, instructions")
        .in("quiz_id", quizIds)
        .eq("language_code", languageCode),
      client.from("quiz_questions").select("id, quiz_id, sort_order").in("quiz_id", quizIds),
      client.from("course_versions").select("id, course_id").in("id", versionIds),
      readQuizPrerequisiteContent(client, quizRows, languageCode),
    ]);
    if (quizTranslationsResult.error || questionsResult.error || versionsResult.error || !prerequisiteContent) {
      return { status: "error" };
    }

    const { modules, lessons: prerequisiteLessonRows } = prerequisiteContent;
    const prerequisiteLessonIds = prerequisiteLessonRows.map((lesson) => lesson.id);
    const completionsResult = prerequisiteLessonIds.length
      ? await client
          .from("lesson_completions")
          .select("lesson_id")
          .eq("profile_id", profileId)
          .in("lesson_id", prerequisiteLessonIds)
      : { data: [], error: null };
    if (completionsResult.error) return { status: "error" };
    const completedLessonIds = new Set(
      ((completionsResult.data ?? []) as Array<{ lesson_id: number }>).map((completion) => completion.lesson_id),
    );
    const unlockedQuizIds = new Set(quizRows.flatMap((quiz) => {
      const requiredLessonIds = getRequiredLessonIds(quiz, modules, prerequisiteLessonRows);
      return requiredLessonIds.length > 0 && requiredLessonIds.every((lessonId) => completedLessonIds.has(lessonId))
        ? [quiz.id]
        : [];
    }));

    const questions = (questionsResult.data ?? []) as QuestionRow[];
    const questionIds = questions.map((question) => question.id);
    const [questionTranslationsResult, optionsResult] = questionIds.length
      ? await Promise.all([
          client
            .from("quiz_question_translations")
            .select("question_id, prompt")
            .in("question_id", questionIds)
            .eq("language_code", languageCode),
          client
            .from("quiz_options")
            .select("id, question_id, sort_order")
            .in("question_id", questionIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];
    if (questionTranslationsResult.error || optionsResult.error) return { status: "error" };

    const options = (optionsResult.data ?? []) as OptionRow[];
    const optionIds = options.map((option) => option.id);
    const optionTranslationsResult = optionIds.length
      ? await client
          .from("quiz_option_translations")
          .select("option_id, label")
          .in("option_id", optionIds)
          .eq("language_code", languageCode)
      : { data: [], error: null };
    if (optionTranslationsResult.error) return { status: "error" };

    const questionTranslations = (questionTranslationsResult.data ?? []) as QuestionTranslationRow[];
    const optionTranslations = (optionTranslationsResult.data ?? []) as OptionTranslationRow[];
    const completeQuizIds = new Set<number>();
    for (const quiz of quizRows) {
      const quizQuestions = questions.filter((question) => question.quiz_id === quiz.id);
      if (!quizQuestions.length || quizQuestions.some((question) =>
        !questionTranslations.some((translation) => translation.question_id === question.id),
      )) continue;

      const quizQuestionIds = new Set(quizQuestions.map((question) => question.id));
      const quizOptions = options.filter((option) => quizQuestionIds.has(option.question_id));
      if (quizQuestions.some((question) => !quizOptions.some((option) => option.question_id === question.id))) continue;
      if (quizOptions.some((option) =>
        !optionTranslations.some((translation) => translation.option_id === option.id),
      )) continue;
      completeQuizIds.add(quiz.id);
    }

    const versions = (versionsResult.data ?? []) as CourseVersionRow[];
    const courseIds = [...new Set(versions.map((version) => version.course_id))];
    const lessonTargets = prerequisiteLessonRows.filter((lesson) => lessonIds.includes(lesson.id));
    const translatedModuleIds = modules.map((module) => module.id);
    const [coursesResult, courseTranslationsResult, lessonsTranslationsResult] = await Promise.all([
      courseIds.length
        ? client.from("courses").select("id, slug").in("id", courseIds)
        : Promise.resolve({ data: [], error: null }),
      client
        .from("course_translations")
        .select("course_version_id, title")
        .in("course_version_id", versionIds)
        .eq("language_code", languageCode),
      lessonIds.length
        ? client
            .from("lesson_translations")
            .select("lesson_id, title")
            .in("lesson_id", lessonIds)
            .eq("language_code", languageCode)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (coursesResult.error || courseTranslationsResult.error || lessonsTranslationsResult.error) {
      return { status: "error" };
    }

    const [moduleTranslationsResult] = await Promise.all([
      translatedModuleIds.length
        ? client
            .from("module_translations")
            .select("module_id, title")
            .in("module_id", translatedModuleIds)
            .eq("language_code", languageCode)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (moduleTranslationsResult.error) return { status: "error" };

    const courses = (coursesResult.data ?? []) as CourseRow[];
    const courseTranslations = (courseTranslationsResult.data ?? []) as CourseTranslationRow[];
    const lessons = (lessonsTranslationsResult.data ?? []) as LessonTranslationRow[];
    const moduleTranslations = (moduleTranslationsResult.data ?? []) as ModuleTranslationRow[];
    const lessonById = new Map(lessonTargets.map((lesson) => [lesson.id, lesson]));
    const versionById = new Map(versions.map((version) => [version.id, version]));
    const courseById = new Map(courses.map((course) => [course.id, course]));
    const courseTranslationByVersion = new Map(courseTranslations.map((translation) => [translation.course_version_id, translation]));
    const moduleTranslationById = new Map(moduleTranslations.map((translation) => [translation.module_id, translation]));
    const lessonTranslationById = new Map(lessons.map((translation) => [translation.lesson_id, translation]));
    const quizTranslations = (quizTranslationsResult.data ?? []) as QuizTranslationRow[];

    return {
      status: "ok",
      languageCode,
      data: quizRows.flatMap((quiz) => {
        const quizTranslation = quizTranslations.find((translation) => translation.quiz_id === quiz.id);
        const version = versionById.get(quiz.course_version_id);
        const course = version ? courseById.get(version.course_id) : undefined;
        const courseTranslation = courseTranslationByVersion.get(quiz.course_version_id);
        const targetModuleId = quiz.module_id ?? (quiz.lesson_id === null ? null : lessonById.get(quiz.lesson_id)?.module_id ?? null);
        const moduleTranslation = targetModuleId === null ? undefined : moduleTranslationById.get(targetModuleId);
        const lessonTranslation = quiz.lesson_id === null ? undefined : lessonTranslationById.get(quiz.lesson_id);
        if (!completeQuizIds.has(quiz.id) || !quizTranslation || !course || !courseTranslation || !moduleTranslation) return [];
        return [{
          id: quiz.id,
          title: quizTranslation.title,
          instructions: quizTranslation.instructions,
          courseSlug: course.slug,
          courseTitle: courseTranslation.title,
          moduleTitle: moduleTranslation.title,
          lessonTitle: lessonTranslation?.title ?? null,
          questionCount: questions.filter((question) => question.quiz_id === quiz.id).length,
          passPercentage: quiz.pass_percentage,
          unlocked: unlockedQuizIds.has(quiz.id),
        }];
      }),
    };
  });
}

export async function readLearningQuiz(quizId: number): Promise<LearningQuizRead> {
  if (!Number.isSafeInteger(quizId) || quizId <= 0) return { status: "not-found" };

  return withEmployeeQuizClient<LearningQuiz, LearningQuizRead>(async (client, languageCode, profileId) => {
    const { data: quizData, error: quizError } = await client
      .from("quizzes")
      .select("id, course_version_id, module_id, lesson_id, pass_percentage")
      .eq("id", quizId)
      .maybeSingle();
    if (quizError) return { status: "error" };
    if (!quizData) return { status: "not-found" };

    const quiz = quizData as QuizRow;
    const prerequisiteContent = await readQuizPrerequisiteContent(client, [quiz], languageCode);
    if (!prerequisiteContent) return { status: "error" };
    if (!await hasCompletedQuizPrerequisites(client, quiz, profileId, languageCode, prerequisiteContent)) {
      return { status: "locked", languageCode };
    }
    const [translationResult, questionsResult, versionResult, attemptsResult, attemptCountResult] = await Promise.all([
      client
        .from("quiz_translations")
        .select("quiz_id, title, instructions")
        .eq("quiz_id", quizId)
        .eq("language_code", languageCode)
        .maybeSingle(),
      client.from("quiz_questions").select("id, quiz_id, sort_order").eq("quiz_id", quizId).order("sort_order"),
      client.from("course_versions").select("id, course_id").eq("id", quiz.course_version_id).maybeSingle(),
      client
        .from("quiz_attempts")
        .select("id, score_percentage, correct_count, question_count, passed, points_awarded, submitted_at")
        .eq("quiz_id", quizId)
        .order("id", { ascending: false })
        .limit(10),
      client.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("quiz_id", quizId),
    ]);
    if (translationResult.error || questionsResult.error || versionResult.error || attemptsResult.error || attemptCountResult.error) {
      return { status: "error" };
    }
    if (!translationResult.data || !versionResult.data) return { status: "not-found" };

    const questions = (questionsResult.data ?? []) as QuestionRow[];
    const questionIds = questions.map((question) => question.id);
    if (!questionIds.length) return { status: "not-found" };
    const [questionTranslationsResult, optionsResult] = await Promise.all([
      client
        .from("quiz_question_translations")
        .select("question_id, prompt")
        .in("question_id", questionIds)
        .eq("language_code", languageCode),
      client
        .from("quiz_options")
        .select("id, question_id, sort_order")
        .in("question_id", questionIds)
        .order("sort_order"),
    ]);
    if (questionTranslationsResult.error || optionsResult.error) return { status: "error" };

    const options = (optionsResult.data ?? []) as OptionRow[];
    const optionIds = options.map((option) => option.id);
    const optionTranslationsResult = optionIds.length
      ? await client
          .from("quiz_option_translations")
          .select("option_id, label")
          .in("option_id", optionIds)
          .eq("language_code", languageCode)
      : { data: [], error: null };
    if (optionTranslationsResult.error) return { status: "error" };

    const version = versionResult.data as CourseVersionRow;
    const courseResult = await client
      .from("courses")
      .select("id, slug")
      .eq("id", version.course_id)
      .maybeSingle();
    if (courseResult.error) return { status: "error" };
    if (!courseResult.data) return { status: "not-found" };

    const targetLesson = quiz.lesson_id === null
      ? undefined
      : prerequisiteContent.lessons.find((lesson) => lesson.id === quiz.lesson_id);
    const targetModuleId = quiz.module_id ?? targetLesson?.module_id;
    if (!targetModuleId) return { status: "not-found" };
    const modules = prerequisiteContent.modules;
    const moduleIndex = modules.findIndex((module) => module.id === targetModuleId);
    if (moduleIndex < 0) return { status: "not-found" };
    const [courseTranslationResult, moduleTranslationResult, lessonTranslationResult] = await Promise.all([
      client
        .from("course_translations")
        .select("course_version_id, title")
        .eq("course_version_id", quiz.course_version_id)
        .eq("language_code", languageCode)
        .maybeSingle(),
      client
        .from("module_translations")
        .select("module_id, title")
        .eq("module_id", targetModuleId)
        .eq("language_code", languageCode)
        .maybeSingle(),
      quiz.lesson_id !== null
        ? client
            .from("lesson_translations")
            .select("lesson_id, title")
            .eq("lesson_id", quiz.lesson_id)
            .eq("language_code", languageCode)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (courseTranslationResult.error || moduleTranslationResult.error || lessonTranslationResult.error) return { status: "error" };
    if (!courseTranslationResult.data || !moduleTranslationResult.data) return { status: "not-found" };

    const nextLessonId = getNextLessonId(quiz, prerequisiteContent.modules, prerequisiteContent.lessons);

    const questionTranslations = (questionTranslationsResult.data ?? []) as QuestionTranslationRow[];
    const optionTranslations = (optionTranslationsResult.data ?? []) as OptionTranslationRow[];
    if (questionTranslations.length !== questions.length) return { status: "not-found" };
    if (options.some((option) => !optionTranslations.some((translation) => translation.option_id === option.id))) {
      return { status: "not-found" };
    }
    const translation = translationResult.data as QuizTranslationRow;
    const attemptCount = attemptCountResult.count ?? 0;
    const attempts = ((attemptsResult.data ?? []) as AttemptRow[]).map((attempt, index) => ({
      attemptNumber: attemptCount - index,
      scorePercentage: attempt.score_percentage,
      correctCount: attempt.correct_count,
      questionCount: attempt.question_count,
      passed: attempt.passed,
      pointsAwarded: attempt.points_awarded,
      submittedAt: attempt.submitted_at,
    }));

    return {
      status: "ok",
      languageCode,
      data: {
        id: quiz.id,
        title: translation.title,
        instructions: translation.instructions,
        courseSlug: (courseResult.data as CourseRow).slug,
        courseTitle: (courseTranslationResult.data as CourseTranslationRow).title,
        moduleTitle: (moduleTranslationResult.data as ModuleTranslationRow).title,
        lessonTitle: (lessonTranslationResult.data as LessonTranslationRow | null)?.title ?? null,
        questionCount: questions.length,
        passPercentage: quiz.pass_percentage,
        unlocked: true,
        nextLessonId,
        questions: questions.map((question) => ({
          id: question.id,
          prompt: questionTranslations.find((item) => item.question_id === question.id)?.prompt ?? "",
          options: options
            .filter((option) => option.question_id === question.id)
            .map((option) => ({
              id: option.id,
              label: optionTranslations.find((item) => item.option_id === option.id)?.label ?? "",
            })),
        })),
        attempts,
        attemptCount,
      },
    };
  });
}
