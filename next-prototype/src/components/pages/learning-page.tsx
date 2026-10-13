"use client";

import Image from "next/image";
import Link from "next/link";
import { RiArrowLeftLine, RiArrowRightLine, RiCheckLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { backActionClassName, RouteButton } from "@/components/route-button";
import { useAcademy } from "@/components/academy-provider";
import { learningModules } from "@/components/pages/learning-data";
import { cx } from "@/utils/cx";

export function LearningPage({ previewMode = false }: { previewMode?: boolean }) {
  const { t, completedLessons } = useAcademy();

  return (
    <div className="relative isolate min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <div className="pointer-events-none absolute inset-x-0 top-28 z-0 h-96 overflow-hidden sm:top-20" aria-hidden="true">
        <Image
          src="/assets/main-learning-v3.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background-full/20 via-background-full/60 to-background-full" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <RouteButton href={previewMode ? "/admin/user-preview" : "/dashboard"} size="large" variant="secondary" leadingIcon={RiArrowLeftLine} className={cx(backActionClassName, "mb-8")}>
          {t("backToDashboard")}
        </RouteButton>

        <header className="mb-8">
          <p className="mb-2 text-caption-1-semibold uppercase tracking-[0.16em] text-accent-300">{t("learning")}</p>
          <h1 className="font-display text-display-2-regular uppercase tracking-wide text-text-primary">{t("chooseModule")}</h1>
        </header>

        <section aria-label={t("learning")} className="grid gap-4">
          {learningModules.map((module) => {
            const completedCount = previewMode ? 0 : module.lessons.filter((lesson) => completedLessons.includes(lesson)).length;
            const isModuleCompleted = completedCount === module.lessons.length;
            const moduleStatus = isModuleCompleted
              ? t("moduleCompleted")
              : completedCount > 0
                ? t("moduleInProgress")
                : t("moduleNotStarted");
            const progressPercent = Math.round((completedCount / module.lessons.length) * 100);
            const progressLabel = t("moduleLessonProgress")
              .replace("{done}", String(completedCount))
              .replace("{total}", String(module.lessons.length));

            return (
            <article key={module.id} className="rounded-3xl border border-border-button-default bg-background-primary-default p-3">
              <Link
                href={previewMode ? `/admin/user-preview/learning/${module.id}` : `/learning/${module.id}`}
                className={cx(
                  "group grid w-full grid-cols-1 gap-3 rounded-2xl bg-background-primary-default p-0 text-start transition-colors duration-150 hover:bg-background-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                  "sm:grid-cols-[minmax(260px,38%)_minmax(0,1fr)] sm:items-center sm:gap-6",
                )}
              >
                <span className="relative block aspect-video overflow-hidden rounded-2xl bg-background-secondary-default">
                  <Image src={module.image} alt="" fill sizes="(max-width: 640px) 100vw, 38vw" className="image-outline object-cover motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover:scale-[1.015]" />
                </span>
                <span className="flex min-w-0 flex-col items-start py-1 sm:py-2 sm:pr-5">
                  <span className="text-caption-1-semibold uppercase tracking-[0.14em] text-accent-300">{t(module.number)}</span>
                  <span role="heading" aria-level={2} className="mt-2 text-title-1-medium text-text-primary">{t(module.title)}</span>
                  <span className="mt-2 max-w-2xl text-body-regular text-text-secondary">{t(module.description)}</span>
                  <span className="mt-4 flex w-full flex-wrap items-center justify-between gap-2">
                    <span className="text-body-medium text-text-secondary">{progressLabel}</span>
                    <span className={cx(
                      "inline-flex items-center gap-1.5 text-body-semibold",
                      isModuleCompleted ? "text-accent-300" : completedCount > 0 ? "text-text-primary" : "text-text-secondary",
                    )}>
                      {isModuleCompleted ? (
                        <RiCheckLine className="size-4" aria-hidden="true" />
                      ) : (
                        <span className={cx("size-2 rounded-full", completedCount > 0 ? "bg-accent-300" : "bg-background-tertiary-default")} aria-hidden="true" />
                      )}
                      {moduleStatus}
                    </span>
                  </span>
                  <span
                    role="progressbar"
                    aria-label={t(module.title)}
                    aria-valuemin={0}
                    aria-valuemax={module.lessons.length}
                    aria-valuenow={completedCount}
                    className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-background-tertiary-default"
                  >
                    <span className="block h-full rounded-full bg-accent-300 transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
                  </span>
                  <span className="mt-5 flex items-center gap-2 text-title-3-semibold text-accent-300">
                    {t("openSection")}
                    <RiArrowRightLine className="size-5" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </article>
            );
          })}
        </section>

        <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <p className="text-body-medium text-text-primary">{t("finalTest")}</p>
            <p className="mt-1 text-body-2-regular text-text-secondary">{t("quizDescription")}</p>
          </div>
          <RouteButton href={previewMode ? "/admin/user-preview/quiz" : "/quiz"} trailingIcon={RiArrowRightLine}>{t("openQuiz")}</RouteButton>
        </div>
      </main>
    </div>
  );
}
