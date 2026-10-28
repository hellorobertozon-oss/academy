"use client";

import Link from "next/link";
import { useState } from "react";
import { RiArrowDownSLine, RiArrowRightLine, RiCheckLine, RiLockLine, RiQuestionLine } from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/base/badges/badge";
import { LinkButton } from "@/components/base/buttons/link-button";
import { cx } from "@/utils/cx";

const initialLessonsPerModule = 5;
const lessonsPerLoad = 5;

type ModuleItem = {
  id: number;
  title: string;
  lessons: Array<{
    id: number;
    title: string;
    completed: boolean;
  }>;
  quiz: { id: number; title: string; passed: boolean; unlocked: boolean } | null;
};

type Copy = {
  module: string;
  modules: string;
  lessons: string;
  noModules: string;
  noLessons: string;
  lessonCompleted: string;
  lessonNotCompleted: string;
  showMoreLessons: string;
  quizOpen: string;
  quizLocked: string;
  quizPassedBadge: string;
};

export function CourseModuleOutline({
  modules,
  courseSlug,
  preview = false,
  copy,
}: {
  modules: ModuleItem[];
  courseSlug: string;
  preview?: boolean;
  copy: Copy;
}) {
  const [visibleLessons, setVisibleLessons] = useState<Record<number, number>>({});
  const coursePath = preview
    ? `/admin/user-preview/learning/${encodeURIComponent(courseSlug)}`
    : `/learning/${encodeURIComponent(courseSlug)}`;

  return (
    <section aria-label={copy.modules} className="flex flex-col gap-4">
      {modules.length === 0 ? (
        <p className="text-body-regular text-text-secondary">{copy.noModules}</p>
      ) : modules.map((courseModule, moduleIndex) => {
        const visibleCount = visibleLessons[courseModule.id] ?? initialLessonsPerModule;
        const shownLessons = courseModule.lessons.slice(0, visibleCount);
        const remainingCount = courseModule.lessons.length - shownLessons.length;

        return (
          <article key={courseModule.id} className="flex flex-col gap-3 rounded-2xl border border-border-button-default bg-background-primary-default p-4">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-caption-1-semibold uppercase tracking-[0.12em] text-accent-300">{copy.module} {moduleIndex + 1}</p>
                <h2 className="truncate text-title-2-semibold text-text-primary">{courseModule.title}</h2>
              </div>
              <Badge color="neutral" className="mt-0.5">{courseModule.lessons.length} {copy.lessons}</Badge>
            </div>

            {courseModule.lessons.length || courseModule.quiz ? (
              <>
                {courseModule.lessons.length ? (
                  <motion.ol layout className="flex flex-col divide-y divide-separator-border">
                    <AnimatePresence initial={false}>
                      {shownLessons.map((lesson) => (
                        <motion.li
                          key={lesson.id}
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                        >
                          <Link
                            href={`${coursePath}/lesson/${lesson.id}`}
                            className="group flex min-h-16 w-full items-center gap-4 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                          >
                            <span
                              className={lesson.completed
                                ? "grid size-12 shrink-0 place-items-center rounded-full border-2 border-accent-300 bg-accent-300 text-accent-950"
                                : "grid size-12 shrink-0 place-items-center rounded-full border-2 border-separator-border bg-background-secondary-default text-text-tertiary"}
                              aria-hidden="true"
                            >
                              <RiCheckLine className={cx("size-7", !lesson.completed && "opacity-30")} />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-title-3-medium text-text-primary transition-colors group-hover:text-accent-300">{lesson.title}</span>
                            <span className="sr-only">{lesson.completed ? copy.lessonCompleted : copy.lessonNotCompleted}</span>
                          </Link>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </motion.ol>
                ) : (
                  <p className="text-body-2-regular text-text-secondary">{copy.noLessons}</p>
                )}
                {remainingCount > 0 ? (
                  <div className="flex justify-center pt-1">
                    <LinkButton
                      type="button"
                      size="medium"
                      trailingIcon={RiArrowDownSLine}
                      className={cx("text-title-3-semibold text-accent-300 hover:text-accent-200 active:text-accent-400")}
                      onClick={() => setVisibleLessons((current) => ({
                        ...current,
                        [courseModule.id]: visibleCount + lessonsPerLoad,
                      }))}
                    >
                      {copy.showMoreLessons} ({remainingCount})
                    </LinkButton>
                  </div>
                ) : null}
                {courseModule.quiz ? (
                  <motion.ol start={courseModule.lessons.length + 1} layout className="flex flex-col divide-y divide-separator-border border-t border-separator-border">
                    <motion.li
                      key={`quiz-${courseModule.quiz.id}`}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                    >
                      {!preview && courseModule.quiz.unlocked ? (
                        <Link
                          href={`/quiz/${courseModule.quiz.id}`}
                          className="group flex min-h-16 w-full items-center gap-4 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                        >
                          <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-accent-300 bg-accent-300 text-accent-950" aria-hidden="true">
                            {courseModule.quiz.passed ? <RiCheckLine className="size-7" /> : <RiQuestionLine className="size-7" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-title-3-medium text-text-primary transition-colors group-hover:text-accent-300">
                            {courseModule.quiz.title}
                          </span>
                          {courseModule.quiz.passed ? (
                            <Badge color="primary">{copy.quizPassedBadge}</Badge>
                          ) : (
                            <span className="flex shrink-0 items-center gap-2 text-body-semibold text-accent-300">
                              <span className="hidden sm:inline">{copy.quizOpen}</span>
                              <RiArrowRightLine className="size-5" aria-hidden="true" />
                            </span>
                          )}
                        </Link>
                      ) : (
                        <div className="flex min-h-16 w-full items-center gap-4 py-3 text-start text-text-tertiary">
                          <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-separator-border bg-background-secondary-default text-text-tertiary" aria-hidden="true">
                            <RiLockLine className="size-6" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-title-3-medium text-text-secondary">{courseModule.quiz.title}</span>
                            <span className="mt-0.5 block text-body-2-regular text-text-tertiary">{copy.quizLocked}</span>
                          </span>
                        </div>
                      )}
                    </motion.li>
                  </motion.ol>
                ) : null}
              </>
            ) : <p className="text-body-2-regular text-text-secondary">{copy.noLessons}</p>}
          </article>
        );
      })}
    </section>
  );
}
