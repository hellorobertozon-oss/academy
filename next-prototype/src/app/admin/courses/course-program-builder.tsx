"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RiAddLine, RiArrowDownLine, RiArrowUpLine } from "@remixicon/react";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { IconButton } from "@/components/base/buttons/icon-button";
import { CreateModuleForm, LessonTranslationEditor } from "@/app/admin/courses/content-forms";
import { reorderLessonsAction, reorderModulesAction } from "@/app/admin/courses/actions";
import { INITIAL_ADMIN_ACTION_STATE } from "@/lib/admin/action-state";
import { formatPolishCount } from "@/lib/admin/polish-count";
import type { LanguageOption } from "@/app/admin/courses/course-forms";
import { cx } from "@/utils/cx";
import { useConfirmCourseEditorDiscard } from "@/app/admin/courses/course-editor-state";

type CourseBuilderLesson = {
  id: number;
  title: string;
  hasQuiz: boolean;
  editor: ReactNode;
  quizEditor?: ReactNode;
};

type CourseBuilderModule = {
  id: number;
  title: string;
  lessons: CourseBuilderLesson[];
  editor: ReactNode;
  quizEditor?: ReactNode;
};

type DraggedItem = {
  kind: "module" | "lesson";
  scopeId: number;
  id: number;
};

type BuilderTab = "content" | "quiz";

function initialSelection(modules: CourseBuilderModule[], editable: boolean) {
  const firstLesson = modules[0]?.lessons[0];
  if (firstLesson) return `lesson:${firstLesson.id}`;
  if (modules[0]) return `module:${modules[0].id}`;
  return editable ? "new-module" : "";
}

function moveId(ids: number[], fromId: number, toId: number) {
  const fromIndex = ids.indexOf(fromId);
  const toIndex = ids.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return ids;
  const next = [...ids];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function itemButtonClasses(selected: boolean) {
  return cx(
    "flex min-w-0 flex-1 items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
    selected
      ? "bg-accent-50 text-accent-900"
      : "text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary",
  );
}

export function CourseProgramBuilder({
  courseId,
  versionId,
  language,
  modules,
  editable,
}: {
  courseId: number;
  versionId: number;
  language?: LanguageOption;
  modules: CourseBuilderModule[];
  editable: boolean;
}) {
  const router = useRouter();
  const confirmDiscard = useConfirmCourseEditorDiscard();
  const [orderedModuleIds, setOrderedModuleIds] = useState(() => modules.map((module) => module.id));
  const [orderedLessonIds, setOrderedLessonIds] = useState<Record<number, number[]>>(() =>
    Object.fromEntries(modules.map((module) => [module.id, module.lessons.map((lesson) => lesson.id)])),
  );
  const [selectedKey, setSelectedKey] = useState(() => initialSelection(modules, editable));
  const [activeTab, setActiveTab] = useState<BuilderTab>("content");
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [reorderMessage, setReorderMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const onModuleCreated = useCallback((moduleId: number) => {
    setOrderedModuleIds((current) => current.includes(moduleId) ? current : [...current, moduleId]);
    setOrderedLessonIds((current) => ({ ...current, [moduleId]: current[moduleId] ?? [] }));
    setSelectedKey(`module:${moduleId}`);
    setActiveTab("content");
    router.refresh();
  }, [router]);

  const onLessonCreated = useCallback((lessonId: number, moduleId: number) => {
    setOrderedLessonIds((current) => ({
      ...current,
      [moduleId]: current[moduleId]?.includes(lessonId) ? current[moduleId] : [...(current[moduleId] ?? []), lessonId],
    }));
    setSelectedKey(`lesson:${lessonId}`);
    setActiveTab("content");
    router.refresh();
  }, [router]);

  function persistOrder(kind: "module" | "lesson", scopeId: number, ids: number[]) {
    if (isPending) return;
    const previousIds = kind === "module" ? orderedModuleIds : orderedLessonIds[scopeId] ?? [];
    if (kind === "module") setOrderedModuleIds(ids);
    else setOrderedLessonIds((current) => ({ ...current, [scopeId]: ids }));
    setReorderMessage("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set(kind === "module" ? "version_id" : "module_id", String(scopeId));
      formData.set("item_ids", ids.join(","));
      const result = kind === "module"
        ? await reorderModulesAction(INITIAL_ADMIN_ACTION_STATE, formData)
        : await reorderLessonsAction(INITIAL_ADMIN_ACTION_STATE, formData);
      if (result.status === "error") {
        if (kind === "module") setOrderedModuleIds(previousIds);
        else setOrderedLessonIds((current) => ({ ...current, [scopeId]: previousIds }));
        setReorderMessage(result.message);
        return;
      }
      router.refresh();
    });
  }

  function moveItem(item: DraggedItem, targetId: number) {
    if (isPending || item.id === targetId) return;
    const currentIds = item.kind === "module"
      ? orderedModuleIds
      : orderedLessonIds[item.scopeId] ?? [];
    const nextIds = moveId(currentIds, item.id, targetId);
    if (nextIds !== currentIds) persistOrder(item.kind, item.scopeId, nextIds);
    setDraggedItem(null);
  }

  const visibleModules = orderedModuleIds
    .map((id) => modules.find((module) => module.id === id))
    .filter((module): module is CourseBuilderModule => Boolean(module));
  const selectedModule = modules.find((module) =>
    selectedKey === `module:${module.id}` || module.lessons.some((lesson) => selectedKey === `lesson:${lesson.id}`),
  );
  const selectedLesson = selectedModule?.lessons.find((lesson) => selectedKey === `lesson:${lesson.id}`);
  const isCreatingModule = selectedKey === "new-module";
  const creatingLessonModuleId = selectedKey.startsWith("new-lesson:")
    ? Number(selectedKey.slice("new-lesson:".length))
    : null;
  const creatingLessonModule = creatingLessonModuleId
    ? modules.find((module) => module.id === creatingLessonModuleId)
    : undefined;
  const selectedTitle = selectedLesson?.title ?? selectedModule?.title ?? (isCreatingModule ? "Nowy moduł" : creatingLessonModule ? "Nowa lekcja" : "Wybierz element programu");
  const selectedType = selectedLesson ? "Lekcja" : selectedModule ? "Moduł" : isCreatingModule ? "Nowy moduł" : creatingLessonModule ? "Nowa lekcja" : "Program";
  const quizEditor = selectedLesson ? selectedLesson.quizEditor : selectedModule?.quizEditor;
  const canShowQuizTab = Boolean(quizEditor);

  function selectItem(key: string) {
    if (key !== selectedKey && !confirmDiscard(false, "Zmiana elementu zamknie bieżący formularz. Niezapisane zmiany zostaną utracone. Kontynuować?")) return;
    setSelectedKey(key);
    setActiveTab("content");
  }

  function renderSortControls(kind: "module" | "lesson", scopeId: number, id: number, ids: number[], title: string) {
    if (!editable) return null;
    const index = ids.indexOf(id);
    const item: DraggedItem = { kind, scopeId, id };
    return (
      <div className="flex shrink-0 items-center gap-0.5 pt-1">
        <button
          type="button"
          draggable={!isPending}
          aria-label={`Przeciągnij, aby zmienić kolejność: ${title}`}
          disabled={isPending}
          onDragStart={(event) => {
            setDraggedItem(item);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(id));
          }}
          className="flex size-7 cursor-grab items-center justify-center rounded-lg text-text-tertiary hover:bg-background-secondary-default hover:text-text-primary active:cursor-grabbing disabled:cursor-wait"
        >
          <span aria-hidden="true">⠿</span>
        </button>
        <div className="flex flex-col">
          <IconButton
            icon={RiArrowUpLine}
            size="small"
            aria-label={`Przesuń wyżej: ${title}`}
            disabled={isPending || index <= 0}
            className="size-6 border-0 bg-transparent p-0 shadow-none hover:bg-background-secondary-default"
            onClick={() => index > 0 && persistOrder(kind, scopeId, moveId(ids, id, ids[index - 1]))}
          />
          <IconButton
            icon={RiArrowDownLine}
            size="small"
            aria-label={`Przesuń niżej: ${title}`}
            disabled={isPending || index < 0 || index >= ids.length - 1}
            className="size-6 border-0 bg-transparent p-0 shadow-none hover:bg-background-secondary-default"
            onClick={() => index >= 0 && index < ids.length - 1 && persistOrder(kind, scopeId, moveId(ids, id, ids[index + 1]))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default">
      <div className="grid min-h-[680px] lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-separator-border bg-background-secondary-default lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 border-b border-separator-border px-4 py-4">
            <div className="min-w-0">
              <h2 className="text-title-3-semibold text-text-primary">Program kursu</h2>
              <p className="mt-1 text-caption-1-regular text-text-secondary">
                {formatPolishCount(modules.length, "moduł", "moduły", "modułów")} · {formatPolishCount(modules.reduce((count, module) => count + module.lessons.length, 0), "lekcja", "lekcje", "lekcji")}
              </p>
            </div>
            {editable && language ? (
              <Button
                type="button"
                variant="secondary"
                size="small"
                leadingIcon={RiAddLine}
                onClick={() => selectItem("new-module")}
              >
                Dodaj moduł
              </Button>
            ) : null}
          </div>

          <nav aria-label="Moduły i lekcje" className="min-h-0 flex-1 overflow-y-auto p-3">
            {visibleModules.length ? (
              <ol className="flex flex-col gap-2">
                {visibleModules.map((module, moduleIndex) => {
                  const lessonIds = orderedLessonIds[module.id] ?? module.lessons.map((lesson) => lesson.id);
                  const orderedLessons = lessonIds
                    .map((id) => module.lessons.find((lesson) => lesson.id === id))
                    .filter((lesson): lesson is CourseBuilderLesson => Boolean(lesson));
                  const moduleSelected = selectedKey === `module:${module.id}`;
                  return (
                    <li
                      key={module.id}
                      className="rounded-2xl border border-separator-border bg-background-primary-default p-2"
                      onDragOver={(event) => {
                        if (draggedItem?.kind === "module") event.preventDefault();
                      }}
                      onDrop={(event) => {
                        if (draggedItem?.kind === "module") {
                          event.preventDefault();
                          moveItem(draggedItem, module.id);
                        }
                      }}
                      onDragEnd={() => setDraggedItem(null)}
                    >
                      <div className="flex items-start gap-1">
                        {renderSortControls("module", versionId, module.id, orderedModuleIds, module.title)}
                        <button
                          type="button"
                          aria-pressed={moduleSelected}
                          onClick={() => selectItem(`module:${module.id}`)}
                          className={itemButtonClasses(moduleSelected)}
                        >
                          <span className={cx("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg text-caption-1-semibold", moduleSelected ? "bg-accent-100 text-accent-900" : "bg-background-secondary-default text-text-tertiary")}>
                            {moduleIndex + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body-medium">{module.title}</span>
                            <span className="mt-0.5 block text-caption-1-regular text-text-tertiary">
                              {formatPolishCount(module.lessons.length, "lekcja", "lekcje", "lekcji")}
                            </span>
                          </span>
                        </button>
                      </div>
                      {orderedLessons.length ? (
                        <ol className="ml-2 mt-1 flex flex-col gap-0.5 border-l border-separator-border pl-1">
                          {orderedLessons.map((lesson, lessonIndex) => {
                            const lessonSelected = selectedKey === `lesson:${lesson.id}`;
                            return (
                              <li
                                key={lesson.id}
                                className="flex items-start gap-1"
                                onDragOver={(event) => {
                                  if (draggedItem?.kind === "lesson" && draggedItem.scopeId === module.id) event.preventDefault();
                                }}
                                onDrop={(event) => {
                                  if (draggedItem?.kind === "lesson" && draggedItem.scopeId === module.id) {
                                    event.preventDefault();
                                    moveItem(draggedItem, lesson.id);
                                  }
                                }}
                                onDragEnd={() => setDraggedItem(null)}
                              >
                                {renderSortControls("lesson", module.id, lesson.id, lessonIds, lesson.title)}
                                <button
                                  type="button"
                                  aria-pressed={lessonSelected}
                                  onClick={() => selectItem(`lesson:${lesson.id}`)}
                                  className={cx(itemButtonClasses(lessonSelected), "py-2")}
                                >
                                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-caption-1-semibold text-text-tertiary">
                                    {lessonIndex + 1}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-body-2-medium">{lesson.title}</span>
                                    {lesson.hasQuiz ? <span className="mt-0.5 block text-caption-1-regular text-accent-800">Quiz</span> : null}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ol>
                      ) : (
                        <p className="ml-10 px-2 py-2 text-caption-1-regular text-text-tertiary">Ten moduł nie ma jeszcze lekcji.</p>
                      )}
                      {editable && language ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="small"
                          leadingIcon={RiAddLine}
                          className="mt-2 w-full justify-start"
                          onClick={() => selectItem(`new-lesson:${module.id}`)}
                        >
                          Dodaj lekcję
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            ) : editable ? (
              <div className="rounded-2xl border border-dashed border-border-button-default bg-background-primary-default p-4">
                <p className="text-body-medium text-text-primary">Zacznij od modułu</p>
                <p className="mt-1 text-body-2-regular text-text-secondary">Moduły porządkują lekcje w rozdziały.</p>
                {language ? (
                  <Button type="button" variant="secondary" leadingIcon={RiAddLine} className="mt-3" onClick={() => selectItem("new-module")}>
                    Dodaj pierwszy moduł
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="px-2 py-3 text-body-2-regular text-text-secondary">To szkolenie nie ma jeszcze modułów.</p>
            )}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-separator-border px-5 py-5 sm:px-7">
            <div className="min-w-0">
              <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">{selectedType}</p>
              <h3 className="mt-1 truncate text-title-2-semibold text-text-primary">{selectedTitle}</h3>
              {selectedModule && selectedLesson ? <p className="mt-1 text-body-2-regular text-text-secondary">{selectedModule.title}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {editable && selectedModule && !selectedLesson && language ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  leadingIcon={RiAddLine}
                  onClick={() => selectItem(`new-lesson:${selectedModule.id}`)}
                >
                  Dodaj lekcję
                </Button>
              ) : null}
              {selectedModule && !selectedLesson ? <Badge color="neutral">{formatPolishCount(selectedModule.lessons.length, "lekcja", "lekcje", "lekcji")}</Badge> : null}
              {editable ? <Badge color="primary">Szkic</Badge> : <Badge color="neutral">Podgląd</Badge>}
            </div>
          </header>

          {selectedModule || isCreatingModule || creatingLessonModule ? (
            <>
              <div className="flex items-center gap-2 border-b border-separator-border px-5 py-3 sm:px-7" role="tablist" aria-label="Edytowany element">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "content"}
                  onClick={() => setActiveTab("content")}
                  className={cx("rounded-xl px-3 py-2 text-body-medium transition-colors", activeTab === "content" ? "bg-accent-50 text-accent-900" : "text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary")}
                >
                  Treść
                </button>
                {canShowQuizTab ? (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "quiz"}
                    onClick={() => setActiveTab("quiz")}
                    className={cx("rounded-xl px-3 py-2 text-body-medium transition-colors", activeTab === "quiz" ? "bg-accent-50 text-accent-900" : "text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary")}
                  >
                    Quiz
                  </button>
                ) : null}
              </div>
              <div className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-7">
                {isCreatingModule ? (
                  <div className="mx-auto flex max-w-3xl flex-col gap-5">
                    <div>
                      <h4 className="text-title-3-semibold text-text-primary">Dodaj moduł</h4>
                      <p className="mt-1 text-body-2-regular text-text-secondary">Moduł to rozdział, w którym umieścisz powiązane lekcje.</p>
                    </div>
                    {language ? <CreateModuleForm versionId={versionId} language={language} disabled={!editable} onCreated={onModuleCreated} /> : null}
                  </div>
                ) : creatingLessonModule ? (
                  <div className="mx-auto flex max-w-3xl flex-col gap-5">
                    <div>
                      <h4 className="text-title-3-semibold text-text-primary">Dodaj lekcję</h4>
                      <p className="mt-1 text-body-2-regular text-text-secondary">Lekcja trafi do modułu „{creatingLessonModule.title}”. Dodaj materiał, film i krótkie podsumowanie.</p>
                    </div>
                    {language ? (
                      <LessonTranslationEditor
                        mode="create"
                        courseId={courseId}
                        versionId={versionId}
                        moduleId={creatingLessonModule.id}
                        language={language}
                        disabled={!editable}
                        onCreated={onLessonCreated}
                      />
                    ) : null}
                  </div>
                ) : activeTab === "quiz" ? (
                  <div className="mx-auto max-w-3xl">{quizEditor}</div>
                ) : (
                  <div className="mx-auto max-w-3xl">
                    {selectedLesson ? selectedLesson.editor : selectedModule?.editor}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex min-h-96 flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex max-w-md flex-col items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-background-secondary-default text-text-tertiary" aria-hidden="true">↖</span>
                <h4 className="text-title-3-semibold text-text-primary">Wybierz element programu</h4>
                <p className="text-body-2-regular text-text-secondary">Wybierz moduł lub lekcję z listy po lewej stronie, aby edytować treść.</p>
              </div>
            </div>
          )}
          {reorderMessage ? <p className="border-t border-separator-border px-5 py-3 text-body-2-regular text-text-error-primary" role="alert">{reorderMessage}</p> : null}
        </section>
      </div>
    </div>
  );
}
