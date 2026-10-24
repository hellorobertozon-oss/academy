import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RiArrowLeftLine } from "@remixicon/react";
import { AcademyLoading } from "@/components/academy-loading";
import { Badge } from "@/components/base/badges/badge";
import { Tab, TabList, TabPanel, Tabs } from "@/components/base/tabs/tabs";
import {
  CourseTranslationPanel,
  LessonTranslationPanel,
  ModuleTranslationPanel,
  type LessonTranslation,
  type CourseTranslation,
  type ModuleTranslation,
} from "@/app/admin/courses/content-forms";
import { CourseProgramBuilder } from "@/app/admin/courses/course-program-builder";
import { CourseDraftAutoPrepare, PublishCourseForm } from "@/app/admin/courses/course-forms";
import { CourseEditorChangesProvider } from "@/app/admin/courses/course-editor-state";
import type { LanguageOption } from "@/app/admin/courses/course-forms";
import { QuizTargetPanel, type AdminQuiz } from "@/app/admin/courses/quiz-forms";
import {
  CourseAssignmentManager,
  type AssignmentEmployee,
  type AssignmentStore,
  type CourseAssignment,
} from "@/app/admin/courses/assignment-forms";
import { requireAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";
import { formatPolishCount } from "@/lib/admin/polish-count";
import { createAcademyImageUrlMap } from "@/lib/academy/content-images";

type CourseRow = {
  id: number;
  slug: string;
  default_language_code: string;
  published_version_id: number | null;
  created_at: string;
};

type VersionRow = {
  id: number;
  course_id: number;
  version_number: number;
  status: "draft" | "published" | "archived";
  published_at: string | null;
};

type ModuleRow = { id: number; sort_order: number };
type LessonRow = { id: number; module_id: number; sort_order: number };
type ModuleTranslationRow = ModuleTranslation & { module_id: number };
type LessonTranslationRow = LessonTranslation & { lesson_id: number };
type CourseTranslationRow = CourseTranslation & { course_version_id: number };
type QuizRow = {
  id: number;
  course_version_id: number;
  module_id: number | null;
  lesson_id: number | null;
  pass_percentage: number;
};
type QuizTranslationRow = { quiz_id: number; language_code: string; title: string; instructions: string };
type QuizQuestionRow = { id: number; quiz_id: number; sort_order: number };
type QuizQuestionTranslationRow = { question_id: number; language_code: string; prompt: string };
type QuizOptionRow = { id: number; question_id: number; sort_order: number };
type QuizOptionTranslationRow = { option_id: number; language_code: string; label: string };
type QuizCorrectAnswerRow = { question_id: number; option_id: number };

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-title-3-semibold text-text-primary">{title}</h2>
      <p className="text-body-2-regular text-text-secondary">{description}</p>
    </div>
  );
}

function translatedTitle<T extends { language_code: string; title: string }>(
  translations: T[],
  languageCode: string,
  fallback: string,
) {
  return translations.find((translation) => translation.language_code === languageCode)?.title || fallback;
}

async function CourseEditor({ courseId }: { courseId: number }) {
  await requireAcademyProfile();
  const supabase = await createAcademyServerClient();
  const [courseResult, languagesResult] = await Promise.all([
    supabase
      .from("courses")
      .select("id, slug, default_language_code, published_version_id, created_at")
      .eq("id", courseId)
      .maybeSingle(),
    supabase
      .from("academy_languages")
      .select("code, name, native_name, is_active, sort_order")
      .order("sort_order"),
  ]);
  if (!courseResult.data) notFound();
  const course = courseResult.data as CourseRow;
  const languages = (languagesResult.data ?? []) as LanguageOption[];
  const [versionsResult, storesResult, employeesResult, assignmentsResult] = await Promise.all([
    supabase
      .from("course_versions")
      .select("id, course_id, version_number, status, published_at")
      .eq("course_id", courseId)
      .order("version_number", { ascending: false }),
    supabase
      .from("stores")
      .select("id, name, city, is_active")
      .order("name"),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, store_id")
      .eq("role", "employee")
      .order("last_name")
      .order("first_name"),
    course.published_version_id
      ? supabase
          .from("course_assignments")
          .select("id, store_id, profile_id")
          .eq("course_id", courseId)
          .order("created_at")
      : Promise.resolve({ data: [], error: null }),
  ]);
  const versions = (versionsResult.data ?? []) as VersionRow[];
  const assignmentStores = (storesResult.data ?? []) as AssignmentStore[];
  const assignmentEmployees = (employeesResult.data ?? []) as AssignmentEmployee[];
  const courseAssignments = (assignmentsResult.data ?? []) as CourseAssignment[];
  const assignmentLoadError = Boolean(storesResult.error || employeesResult.error || assignmentsResult.error);
  const draftVersion = versions.find((version) => version.status === "draft");
  const currentVersion = draftVersion
    ?? versions.find((version) => version.id === course.published_version_id)
    ?? versions.find((version) => version.status === "published");

  const emptyResults = { data: [], error: null };
  const versionId = currentVersion?.id;
  const [courseTranslationsResult, modulesResult] = versionId
    ? await Promise.all([
        supabase
          .from("course_translations")
          .select("course_version_id, language_code, title, description, image_path")
          .eq("course_version_id", versionId),
        supabase
          .from("course_modules")
          .select("id, sort_order")
          .eq("course_version_id", versionId)
          .order("sort_order"),
      ])
    : [emptyResults, emptyResults];
  const modules = (modulesResult.data ?? []) as ModuleRow[];
  const moduleIds = modules.map((module) => module.id);
  const [moduleTranslationsResult, lessonsResult] = moduleIds.length
    ? await Promise.all([
        supabase
          .from("module_translations")
          .select("module_id, language_code, title, summary, image_path")
          .in("module_id", moduleIds),
        supabase
          .from("course_lessons")
          .select("id, module_id, sort_order")
          .in("module_id", moduleIds)
          .order("sort_order"),
      ])
    : [emptyResults, emptyResults];
  const lessons = (lessonsResult.data ?? []) as LessonRow[];
  const lessonIds = lessons.map((lesson) => lesson.id);
  const [lessonTranslationsResult, quizzesResult] = versionId
    ? await Promise.all([
        lessonIds.length
          ? supabase
              .from("lesson_translations")
              .select("lesson_id, language_code, title, summary, youtube_video_id, youtube_video_ids, content, product_bullets, key_points_title, conversation_title, conversation, image_path")
              .in("lesson_id", lessonIds)
          : Promise.resolve(emptyResults),
        supabase
          .from("quizzes")
          .select("id, course_version_id, module_id, lesson_id, pass_percentage")
          .eq("course_version_id", versionId),
      ])
    : [emptyResults, emptyResults];
  const rawCourseTranslations = (courseTranslationsResult.data ?? []) as CourseTranslationRow[];
  const rawModuleTranslations = (moduleTranslationsResult.data ?? []) as ModuleTranslationRow[];
  const rawLessonTranslations = (lessonTranslationsResult.data ?? []) as LessonTranslationRow[];
  const imageUrls = await createAcademyImageUrlMap(supabase, [
    ...rawCourseTranslations.map((translation) => translation.image_path),
    ...rawModuleTranslations.map((translation) => translation.image_path),
    ...rawLessonTranslations.map((translation) => translation.image_path),
  ]);
  const courseTranslations = rawCourseTranslations.map((translation) => ({
    ...translation,
    image_url: translation.image_path ? imageUrls.get(translation.image_path) ?? null : null,
  }));
  const moduleTranslations = rawModuleTranslations.map((translation) => ({
    ...translation,
    image_url: translation.image_path ? imageUrls.get(translation.image_path) ?? null : null,
  }));
  const lessonTranslations = rawLessonTranslations.map((translation) => ({
    ...translation,
    image_url: translation.image_path ? imageUrls.get(translation.image_path) ?? null : null,
  }));
  const quizRows = (quizzesResult.data ?? []) as QuizRow[];
  const quizIds = quizRows.map((quiz) => quiz.id);
  const [quizTranslationsResult, quizQuestionsResult] = quizIds.length
    ? await Promise.all([
        supabase
          .from("quiz_translations")
          .select("quiz_id, language_code, title, instructions")
          .in("quiz_id", quizIds),
        supabase
          .from("quiz_questions")
          .select("id, quiz_id, sort_order")
          .in("quiz_id", quizIds)
          .order("sort_order"),
      ])
    : [emptyResults, emptyResults];
  const quizQuestionRows = (quizQuestionsResult.data ?? []) as QuizQuestionRow[];
  const quizQuestionIds = quizQuestionRows.map((question) => question.id);
  const [quizQuestionTranslationsResult, quizOptionsResult, quizCorrectAnswersResult] = quizQuestionIds.length
    ? await Promise.all([
        supabase
          .from("quiz_question_translations")
          .select("question_id, language_code, prompt")
          .in("question_id", quizQuestionIds),
        supabase
          .from("quiz_options")
          .select("id, question_id, sort_order")
          .in("question_id", quizQuestionIds)
          .order("sort_order"),
        supabase
          .from("quiz_correct_answers")
          .select("question_id, option_id")
          .in("question_id", quizQuestionIds),
      ])
    : [emptyResults, emptyResults, emptyResults];
  const quizOptionRows = (quizOptionsResult.data ?? []) as QuizOptionRow[];
  const quizOptionIds = quizOptionRows.map((option) => option.id);
  const quizOptionTranslationsResult = quizOptionIds.length
    ? await supabase
        .from("quiz_option_translations")
        .select("option_id, language_code, label")
        .in("option_id", quizOptionIds)
    : emptyResults;
  const quizTranslations = (quizTranslationsResult.data ?? []) as QuizTranslationRow[];
  const quizQuestionTranslations = (quizQuestionTranslationsResult.data ?? []) as QuizQuestionTranslationRow[];
  const quizOptionTranslations = (quizOptionTranslationsResult.data ?? []) as QuizOptionTranslationRow[];
  const quizCorrectAnswers = (quizCorrectAnswersResult.data ?? []) as QuizCorrectAnswerRow[];
  const adminQuizzes: AdminQuiz[] = quizRows.map((quiz) => ({
    ...quiz,
    translations: quizTranslations
      .filter((translation) => translation.quiz_id === quiz.id)
      .map(({ language_code, title, instructions }) => ({ language_code, title, instructions })),
    questions: quizQuestionRows
      .filter((question) => question.quiz_id === quiz.id)
      .map((question) => ({
        id: question.id,
        sort_order: question.sort_order,
        translations: quizQuestionTranslations
          .filter((translation) => translation.question_id === question.id)
          .map(({ language_code, prompt }) => ({ language_code, prompt })),
        options: quizOptionRows
          .filter((option) => option.question_id === question.id)
          .map((option) => ({
            id: option.id,
            sort_order: option.sort_order,
            is_correct: quizCorrectAnswers.some((answer) => answer.question_id === question.id && answer.option_id === option.id),
            translations: quizOptionTranslations
              .filter((translation) => translation.option_id === option.id)
              .map(({ language_code, label }) => ({ language_code, label })),
          })),
      })),
  }));
  const loadError = Boolean(
    languagesResult.error || versionsResult.error || courseTranslationsResult.error || modulesResult.error ||
    moduleTranslationsResult.error || lessonsResult.error || lessonTranslationsResult.error || quizzesResult.error ||
    quizTranslationsResult.error || quizQuestionsResult.error || quizQuestionTranslationsResult.error ||
    quizOptionsResult.error || quizCorrectAnswersResult.error || quizOptionTranslationsResult.error,
  );
  const editable = currentVersion?.status === "draft";
  const currentVersionId = currentVersion?.id ?? 0;
  const locale = languages.find((language) => language.code === course.default_language_code);
  const totalLessonCount = lessons.length;
  const moduleItems = modules.map((module) => {
    const translations = moduleTranslations.filter((translation) => translation.module_id === module.id);
    const moduleLessons = lessons.filter((lesson) => lesson.module_id === module.id);
    const title = translatedTitle(translations, course.default_language_code, "Moduł bez tytułu");
    const moduleQuiz = adminQuizzes.find((quiz) => quiz.module_id === module.id);
    const lessonItems = moduleLessons.map((lesson) => {
      const lessonTexts = lessonTranslations.filter((translation) => translation.lesson_id === lesson.id);
      const lessonTitle = translatedTitle(lessonTexts, course.default_language_code, "Bez tytułu");
      const lessonQuiz = adminQuizzes.find((quiz) => quiz.lesson_id === lesson.id);
      return {
        id: lesson.id,
        title: lessonTitle,
        hasQuiz: Boolean(lessonQuiz),
        editor: (
          <LessonTranslationPanel
            courseId={course.id}
            versionId={currentVersionId}
            moduleId={module.id}
            lessonId={lesson.id}
            languages={languages}
            translations={lessonTexts}
            defaultLanguage={course.default_language_code}
            disabled={!editable}
          />
        ),
        quizEditor: lessonQuiz || editable ? (
          <QuizTargetPanel
            courseVersionId={currentVersionId}
            targetType="lesson"
            targetId={lesson.id}
            languages={languages}
            defaultLanguage={course.default_language_code}
            quiz={lessonQuiz}
            disabled={!editable}
          />
        ) : undefined,
      };
    });

    return {
      id: module.id,
      title,
      lessons: lessonItems,
      editor: (
        <ModuleTranslationPanel
          courseId={course.id}
          versionId={currentVersionId}
          moduleId={module.id}
          languages={languages}
          translations={translations}
          defaultLanguage={course.default_language_code}
          disabled={!editable}
        />
      ),
      quizEditor: moduleQuiz || editable ? (
        <QuizTargetPanel
          courseVersionId={currentVersionId}
          targetType="module"
          targetId={module.id}
          languages={languages}
          defaultLanguage={course.default_language_code}
          quiz={moduleQuiz}
          disabled={!editable}
        />
      ) : undefined,
    };
  });

  return (
    <CourseEditorChangesProvider>
      <header className="flex flex-col gap-4">
        <Link href="/admin/courses" className="inline-flex w-fit items-center gap-2 text-body-medium text-text-secondary transition-colors hover:text-text-primary">
          <RiArrowLeftLine className="size-4" aria-hidden />
          Wszystkie szkolenia
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-caption-1-semibold uppercase tracking-[0.14em] text-text-tertiary">Edytor szkolenia · /{course.slug}</p>
            <h1 className="mt-2 text-title-1-semibold text-text-primary">
              {courseTranslations.find((translation) => translation.language_code === course.default_language_code)?.title ?? course.slug}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-body-2-regular text-text-secondary">
              <span>Język główny: {course.default_language_code.toUpperCase()}</span>
              <span aria-hidden="true">·</span>
              <span>{formatPolishCount(modules.length, "moduł", "moduły", "modułów")}</span>
              <span aria-hidden="true">·</span>
              <span>{formatPolishCount(totalLessonCount, "lekcja", "lekcje", "lekcji")}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {currentVersion ? (
              <Badge color={editable ? "primary" : "neutral"}>
                {editable ? "Szkic" : "Opublikowane"} · v{currentVersion.version_number}
              </Badge>
            ) : null}
            {draftVersion ? (
              <PublishCourseForm courseId={course.id} versionId={draftVersion.id} disabled={!editable} />
            ) : course.published_version_id ? (
              <CourseDraftAutoPrepare courseId={course.id} />
            ) : null}
          </div>
        </div>
      </header>

        {loadError ? (
          <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
            Nie udało się wczytać całej treści szkolenia. Odśwież stronę i sprawdź migrację Academy.
          </div>
        ) : null}

        {assignmentLoadError ? (
          <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
            {"Nie uda\u0142o si\u0119 wczyta\u0107 przypisa\u0144. Sprawd\u017A, czy migracja przypisa\u0144 Academy zosta\u0142a zastosowana."}
          </div>
        ) : null}

        {!currentVersion ? (
          <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
            Szkolenie nie ma jeszcze wersji do edycji.
          </div>
        ) : (
          <>
            <Tabs defaultSelectedKey="program" className="gap-5">
              <TabList aria-label="Sekcje edytora szkolenia">
                <Tab id="program" count={totalLessonCount}>Program kursu</Tab>
                <Tab id="details">Opis i języki</Tab>
                <Tab id="access">Dostęp</Tab>
              </TabList>
              <TabPanel id="program">
                <section className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6">
                  <SectionHeading
                    title="Program szkolenia"
                    description={editable
                      ? "Ułóż kurs w moduły i lekcje. Wybierz element z listy, aby edytować jego treść."
                      : "Przygotowujemy kopię szkolenia do edycji. Opublikowana wersja pozostaje bez zmian."}
                  />
                  <CourseProgramBuilder
                    key={currentVersion.id}
                    courseId={course.id}
                    versionId={currentVersion.id}
                    language={locale}
                    modules={moduleItems}
                    editable={editable}
                  />
                </section>
              </TabPanel>
              <TabPanel id="details">
                <section className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6">
                  <SectionHeading
                    title="Opis i języki"
                    description={editable
                      ? "Uzupełnij nazwę i opis szkolenia. Tłumaczenia dodasz w wybranym języku."
                      : "Przygotowujemy kopię szkolenia do edycji. Opublikowana wersja pozostaje bez zmian."}
                  />
                  <CourseTranslationPanel
                    courseId={course.id}
                    versionId={currentVersion.id}
                    defaultLanguage={course.default_language_code}
                    languages={languages}
                    translations={courseTranslations}
                    disabled={!editable}
                  />
                </section>
              </TabPanel>
              <TabPanel id="access">
                {course.published_version_id ? (
                  <CourseAssignmentManager
                    courseId={course.id}
                    stores={assignmentStores}
                    employees={assignmentEmployees}
                    assignments={courseAssignments}
                  />
                ) : (
                  <section className="flex flex-col gap-2 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6">
                    <h2 className="text-title-3-semibold text-text-primary">Dostęp do szkolenia</h2>
                    <p className="text-body-2-regular text-text-secondary">Po opublikowaniu przypiszesz szkolenie do sklepów lub poszczególnych użytkowników.</p>
                  </section>
                )}
              </TabPanel>
            </Tabs>
          </>
        )}
    </CourseEditorChangesProvider>
  );
}

async function AdminCourseContent({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId: rawCourseId } = await params;
  const courseId = Number(rawCourseId);
  if (!Number.isSafeInteger(courseId) || courseId <= 0) notFound();
  return <CourseEditor courseId={courseId} />;
}

export default function AdminCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie edytora szkolenia" />}>
      <AdminCourseContent params={params} />
    </Suspense>
  );
}
