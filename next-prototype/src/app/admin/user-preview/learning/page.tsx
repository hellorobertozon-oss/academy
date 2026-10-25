import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { AcademyLoading } from "@/components/academy-loading";
import { AcademyContentImage } from "@/components/academy-content-image";
import { ButtonLink } from "@/components/base/buttons/button";
import { readAdminPreviewCourses } from "@/lib/academy/learning";
import { getLearningCopy } from "@/lib/academy/learning-copy";

async function PreviewLearningContent() {
  const result = await readAdminPreviewCourses();
  if (result.status === "forbidden") redirect("/admin");
  if (result.status === "not-found") notFound();
  const copy = getLearningCopy(result.status === "ok" ? result.languageCode : "pl");

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <ButtonLink href="/admin/user-preview" size="large" variant="secondary" leadingIcon={RiArrowLeftLine} className="self-start border-accent-400/50 text-accent-300 hover:border-accent-300 hover:bg-accent-950 active:bg-accent-900">
          {copy.backToDashboard}
        </ButtonLink>

        <header className="flex flex-col gap-3">
          <p className="text-caption-1-semibold uppercase tracking-[0.16em] text-accent-300">Xzone Academy</p>
          <h1 className="font-display text-display-2-regular uppercase tracking-wide text-text-primary">{copy.pageTitle}</h1>
          <p className="max-w-3xl text-headline-regular text-text-secondary">{copy.pageDescription}</p>
        </header>

        {result.status === "error" ? (
          <div role="alert" className="rounded-3xl border border-border-error-default bg-background-primary-default p-6 text-body-regular text-text-error-primary">
            {copy.loadError}
          </div>
        ) : result.data.length ? (
          <section aria-label={copy.pageTitle} className="grid gap-5">
            {result.data.map((course) => (
              <Link
                key={course.id}
                href={`/admin/user-preview/learning/${course.slug}`}
                className="group relative grid w-full grid-cols-1 gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-3 transition-colors duration-150 hover:border-border-button-hover hover:bg-background-primary-hover active:bg-background-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring sm:grid-cols-[minmax(260px,38%)_minmax(0,1fr)] sm:items-center sm:gap-6 sm:p-4"
              >
                <span className="relative block aspect-video overflow-hidden rounded-2xl bg-background-secondary-default">
                  <AcademyContentImage imageUrl={course.imageUrl} alt={course.title} placeholder="Grafika szkolenia" className="size-full image-outline motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover:scale-[1.015]" />
                </span>
                <span className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6" aria-hidden="true">
                  <Image src="/assets/xzone-brand-logo.png" alt="" width={64} height={64} className="size-12 object-contain sm:size-14" />
                </span>
                <span className="flex min-w-0 flex-col py-3 sm:py-6 sm:pr-24">
                  <span className="text-caption-1-semibold uppercase tracking-[0.14em] text-accent-300">Xzone Academy</span>
                  <span className="mt-2 text-title-1-medium text-text-primary">{course.title}</span>
                  {course.description ? <span className="mt-2 max-w-3xl text-body-regular text-text-secondary">{course.description}</span> : null}
                  {course.lessonCount > 0 ? (
                    <span className="mt-4 flex w-full max-w-xl flex-col gap-2">
                      <span className="flex items-center justify-between gap-4">
                        <span className="text-body-2-medium text-text-secondary">{copy.progressLabel}</span>
                        <span className="text-body-2-medium tabular-nums text-text-secondary">0/{course.lessonCount}</span>
                      </span>
                      <span
                        role="progressbar"
                        aria-label={copy.courseProgress.replace("{completed}", "0").replace("{total}", String(course.lessonCount))}
                        aria-valuemin={0}
                        aria-valuemax={course.lessonCount}
                        aria-valuenow={0}
                        className="h-2 overflow-hidden rounded-full bg-background-secondary-default"
                      >
                        <span className="block h-full rounded-full bg-accent-300" style={{ width: "0%" }} />
                      </span>
                    </span>
                  ) : null}
                  <span className="mt-5 flex items-center gap-2 text-title-3-semibold text-accent-300">
                    {copy.openCourse}
                    <RiArrowRightLine className="size-5" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ))}
          </section>
        ) : (
          <section className="flex flex-col gap-2 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
            <h2 className="text-title-2-semibold text-text-primary">Brak opublikowanych szkoleń do podglądu</h2>
            <p className="text-body-regular text-text-secondary">Opublikuj szkolenie, aby zobaczyć rzeczywiste moduły i lekcje w widoku użytkownika.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default function UserPreviewLearningPage() {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie szkoleń" withHeader />}>
      <PreviewLearningContent />
    </Suspense>
  );
}
