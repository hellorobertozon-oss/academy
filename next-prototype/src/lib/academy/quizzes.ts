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
type LessonRow = { id: number; module_id: number };
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
};

export type LearningQuiz = LearningQuizCard & {
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

type QuizClient = Awaited<ReturnType<typeof createAcademyServerClient>>;

async function withEmployeeQuizClient<T>(
  read: (client: QuizClient, languageCode: string) => Promise<LearningRead<T>>,
): Promise<LearningRead<T>> {
  const profile = await requireAcademyProfile();
  if (profile.role !== "employee") return { status: "forbidden" };
  try {
    return await read(await createAcademyServerClient(), profile.preferred_language);
  } catch {
    return { status: "error" };
  }
}

export async function readAssignedQuizzes(): Promise<LearningRead<LearningQuizCard[]>> {
  return withEmployeeQuizClient<LearningQuizCard[]>(async (client, languageCode) => {
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
    const [quizTranslationsResult, questionsResult, versionsResult, lessonTargetsResult] = await Promise.all([
      client
        .from("quiz_translations")
        .select("quiz_id, title, instructions")
        .in("quiz_id", quizIds)
        .eq("language_code", languageCode),
      client.from("quiz_questions").select("id, quiz_id, sort_order").in("quiz_id", quizIds),
      client.from("course_versions").select("id, course_id").in("id", versionIds),
      lessonIds.length
        ? client.from("course_lessons").select("id, module_id").in("id", lessonIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (quizTranslationsResult.error || questionsResult.error || versionsResult.error || lessonTargetsResult.error) {
      return { status: "error" };
    }

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
    const lessonTargets = (lessonTargetsResult.data ?? []) as LessonRow[];
    const moduleIds = [...new Set([
      ...quizRows.flatMap((quiz) => quiz.module_id === null ? [] : [quiz.module_id]),
      ...lessonTargets.map((lesson) => lesson.module_id),
    ])];
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
      moduleIds.length
        ? client
            .from("module_translations")
            .select("module_id, title")
            .in("module_id", moduleIds)
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
        }];
      }),
    };
  });
}

export async function readLearningQuiz(quizId: number): Promise<LearningRead<LearningQuiz>> {
  if (!Number.isSafeInteger(quizId) || quizId <= 0) return { status: "not-found" };

  return withEmployeeQuizClient<LearningQuiz>(async (client, languageCode) => {
    const { data: quizData, error: quizError } = await client
      .from("quizzes")
      .select("id, course_version_id, module_id, lesson_id, pass_percentage")
      .eq("id", quizId)
      .maybeSingle();
    if (quizError) return { status: "error" };
    if (!quizData) return { status: "not-found" };

    const quiz = quizData as QuizRow;
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
    const [courseResult, moduleResult, lessonTargetResult] = await Promise.all([
      client.from("courses").select("id, slug").eq("id", version.course_id).maybeSingle(),
      quiz.module_id
        ? client.from("course_modules").select("id, course_version_id").eq("id", quiz.module_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      quiz.lesson_id
        ? client.from("course_lessons").select("id, module_id").eq("id", quiz.lesson_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (courseResult.error || moduleResult.error || lessonTargetResult.error) return { status: "error" };
    if (!courseResult.data) return { status: "not-found" };

    const targetModuleId = quiz.module_id ?? (lessonTargetResult.data as LessonRow | null)?.module_id;
    if (!targetModuleId) return { status: "not-found" };
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
      quiz.lesson_id
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
