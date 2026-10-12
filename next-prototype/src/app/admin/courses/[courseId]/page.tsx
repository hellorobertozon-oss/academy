import { notFound } from "next/navigation";
import { AcademyHeader } from "@/components/academy-header";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Badge } from "@/components/base/badges/badge";
import {
  AdminDisclosure,
  CourseTranslationPanel,
  CreateModuleForm,
  LessonTranslationPanel,
  LessonTranslationEditor,
  ModuleTranslationPanel,
  type LessonTranslation,
  type CourseTranslation,
  type ModuleTranslation,
} from "@/app/admin/courses/content-forms";
import { SortableCollection } from "@/app/admin/courses/sortable-collection";
import { CreateCourseDraftForm, PublishCourseForm } from "@/app/admin/courses/course-forms";
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
  const profile = await requireAcademyProfile();
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
          .select("course_version_id, language_code, title, description")
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
          .select("module_id, language_code, title, summary")
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
              .select("lesson_id, language_code, title, summary, youtube_video_id, content, product_bullets")
              .in("lesson_id", lessonIds)
          : Promise.resolve(emptyResults),
        supabase
          .from("quizzes")
          .select("id, course_version_id, module_id, lesson_id, pass_percentage")
          .eq("course_version_id", versionId),
      ])
    : [emptyResults, emptyResults];
  const courseTranslations = (courseTranslationsResult.data ?? []) as CourseTranslationRow[];
  const moduleTranslations = (moduleTranslationsResult.data ?? []) as ModuleTranslationRow[];
  const lessonTranslations = (lessonTranslationsResult.data ?? []) as LessonTranslationRow[];
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
  const moduleItems = modules.map((module) => {
    const translations = moduleTranslations.filter((translation) => translation.module_id === module.id);
    const moduleLessons = lessons.filter((lesson) => lesson.module_id === module.id);
    const title = translatedTitle(translations, course.default_language_code, "Moduł bez tytułu");
    const lessonItems = moduleLessons.map((lesson) => {
      const lessonTexts = lessonTranslations.filter((translation) => translation.lesson_id === lesson.id);
      const lessonTitle = translatedTitle(lessonTexts, course.default_language_code, "Bez tytułu");
      const lessonQuiz = adminQuizzes.find((quiz) => quiz.lesson_id === lesson.id);
      return {
        id: lesson.id,
        title: lessonTitle,
        content: (
          <div className="flex flex-col gap-3">
            <AdminDisclosure title={`Lekcja: ${lessonTitle}`}>
              <LessonTranslationPanel
                moduleId={module.id}
                lessonId={lesson.id}
                languages={languages}
                translations={lessonTexts}
                defaultLanguage={course.default_language_code}
                disabled={!editable}
              />
            </AdminDisclosure>
            {lessonQuiz || editable ? (
              <AdminDisclosure title={lessonQuiz ? `Quiz: ${lessonQuiz.translations.find((translation) => translation.language_code === course.default_language_code)?.title ?? "Quiz lekcji"}` : "+ Dodaj quiz do lekcji"}>
                <QuizTargetPanel
                  courseVersionId={currentVersionId}
                  targetType="lesson"
                  targetId={lesson.id}
                  languages={languages}
                  defaultLanguage={course.default_language_code}
                  quiz={lessonQuiz}
                  disabled={!editable}
                />
              </AdminDisclosure>
            ) : null}
          </div>
        ),
      };
    });
    const moduleQuiz = adminQuizzes.find((quiz) => quiz.module_id === module.id);

    return {
      id: module.id,
      title,
      content: (
        <article className="flex flex-col gap-4 rounded-2xl border border-separator-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-title-3-semibold text-text-primary">{title}</h3>
            <Badge color="neutral">{moduleLessons.length} lekcji</Badge>
          </div>
          <AdminDisclosure title="Tłumaczenia modułu">
            <ModuleTranslationPanel
              moduleId={module.id}
              languages={languages}
              translations={translations}
              defaultLanguage={course.default_language_code}
              disabled={!editable}
            />
          </AdminDisclosure>
          {moduleQuiz || editable ? (
            <AdminDisclosure title={moduleQuiz ? `Quiz: ${moduleQuiz.translations.find((translation) => translation.language_code === course.default_language_code)?.title ?? "Quiz modułu"}` : "+ Dodaj quiz do modułu"}>
              <QuizTargetPanel
                courseVersionId={currentVersionId}
                targetType="module"
                targetId={module.id}
                languages={languages}
                defaultLanguage={course.default_language_code}
                quiz={moduleQuiz}
                disabled={!editable}
              />
            </AdminDisclosure>
          ) : null}
          {moduleLessons.length ? (
            <SortableCollection
              key={`${module.id}:${moduleLessons.map((lesson) => lesson.id).join(",")}`}
              kind="lesson"
              scopeId={module.id}
              items={lessonItems}
              disabled={!editable}
            />
          ) : (
            <p className="text-body-2-regular text-text-secondary">W tym module nie ma jeszcze lekcji.</p>
          )}
          {editable && locale ? (
            <AdminDisclosure title="+ Dodaj lekcję">
              <LessonTranslationEditor mode="create" moduleId={module.id} language={locale} disabled={false} />
            </AdminDisclosure>
          ) : null}
        </article>
      ),
    };
  });

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <LinkButton href="/admin/courses" variant="secondary">← Lista szkoleń</LinkButton>
            {currentVersion ? (
              <Badge color={editable ? "primary" : "neutral"}>
                {editable ? "Szkic" : "Opublikowane"} · v{currentVersion.version_number}
              </Badge>
            ) : null}
          </div>
          <div>
            <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">
              Xzone Academy · {profile.email}
            </p>
            <h1 className="mt-2 font-display text-display-3-regular uppercase tracking-wide text-text-primary">
              {courseTranslations.find((translation) => translation.language_code === course.default_language_code)?.title ?? course.slug}
            </h1>
            <p className="mt-2 text-body-2-regular text-text-secondary">
              /{course.slug} · język domyślny: {course.default_language_code.toUpperCase()}
            </p>
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
            <section className="rounded-3xl border border-border-button-default bg-background-primary-default p-6">
              <div className="flex flex-col gap-5">
                <SectionHeading
                  title="Tytuł i opis szkolenia"
                  description={editable ? "Każdy język ma niezależny tytuł i opis." : "To wydanie jest tylko do odczytu. Utwórz szkic, aby przygotować zmiany."}
                />
                <CourseTranslationPanel
                  courseId={course.id}
                  versionId={currentVersion.id}
                  defaultLanguage={course.default_language_code}
                  languages={languages}
                  translations={courseTranslations}
                  disabled={!editable}
                />
                {draftVersion ? (
                  <PublishCourseForm courseId={course.id} versionId={draftVersion.id} disabled={!editable} />
                ) : course.published_version_id ? (
                  <CreateCourseDraftForm courseId={course.id} />
                ) : null}
              </div>
            </section>

            {course.published_version_id ? (
              <CourseAssignmentManager
                courseId={course.id}
                stores={assignmentStores}
                employees={assignmentEmployees}
                assignments={courseAssignments}
              />
            ) : (
              <section className="flex flex-col gap-2 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
                <h2 className="text-title-3-semibold text-text-primary">Przypisania szkolenia</h2>
                <p className="text-body-2-regular text-text-secondary">
                  Opublikuj szkolenie, aby przypisa&#263; je do sklepu lub pracownik&#243;w.
                </p>
              </section>
            )}

            <section className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
              <SectionHeading
                title={`Moduły (${modules.length})`}
                description="Moduły grupują lekcje. Opublikowane wydanie pozostaje niezmienione podczas pracy nad szkicem."
              />
              {modules.length ? (
                <SortableCollection
                  key={`${currentVersion.id}:${modules.map((module) => module.id).join(",")}`}
                  kind="module"
                  scopeId={currentVersion.id}
                  items={moduleItems}
                  disabled={!editable}
                />
              ) : null}
              {editable && locale ? (
                <CreateModuleForm versionId={currentVersion.id} language={locale} disabled={false} />
              ) : modules.length === 0 ? (
                <p className="text-body-2-regular text-text-secondary">Dodaj szkic, aby utworzyć pierwszy moduł.</p>
              ) : null}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default async function AdminCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId: rawCourseId } = await params;
  const courseId = Number(rawCourseId);
  if (!Number.isSafeInteger(courseId) || courseId <= 0) notFound();
  return <CourseEditor courseId={courseId} />;
}
