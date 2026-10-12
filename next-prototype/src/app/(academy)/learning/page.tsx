import Image from "next/image";
import { redirect } from "next/navigation";
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { Badge } from "@/components/base/badges/badge";
import { LinkButton } from "@/components/base/buttons/link-button";
import { readAssignedCourses } from "@/lib/academy/learning";
import { getLearningCopy } from "@/lib/academy/learning-copy";

export default async function Page() {
  const result = await readAssignedCourses();
  if (result.status === "forbidden") redirect("/admin/courses");
  const copy = getLearningCopy(result.status === "ok" ? result.languageCode : "pl");
  const loadError = result.status === "error" || result.status === "not-found";

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
        <LinkButton href="/dashboard" size="medium" variant="secondary" leadingIcon={RiArrowLeftLine} className="mb-8">
          {copy.backToDashboard}
        </LinkButton>

        <header className="mb-8">
          <p className="mb-2 text-caption-1-semibold uppercase tracking-[0.16em] text-accent-300">Xzone Academy</p>
          <h1 className="font-display text-display-2-regular uppercase tracking-wide text-text-primary">{copy.pageTitle}</h1>
          <p className="mt-3 max-w-3xl text-headline-regular text-text-secondary">{copy.pageDescription}</p>
        </header>

        {loadError ? (
          <div role="alert" className="rounded-3xl border border-border-error-default bg-background-primary-default p-6 text-body-regular text-text-error-primary">
            {copy.loadError}
          </div>
        ) : result.status === "ok" && result.data.length ? (
          <section aria-label={copy.pageTitle} className="grid gap-4">
            {result.data.map((course) => (
              <article key={course.id} className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                <div className="flex min-w-0 flex-col gap-3">
                  <p className="text-caption-1-semibold uppercase tracking-[0.14em] text-accent-300">Xzone Academy</p>
                  <h2 className="text-title-1-medium text-text-primary">{course.title}</h2>
                  {course.description ? <p className="max-w-3xl text-body-regular text-text-secondary">{course.description}</p> : null}
                  <div role="group" className="flex flex-wrap gap-2" aria-label={`${copy.modules}: ${course.moduleCount}; ${copy.lessons}: ${course.lessonCount}`}>
                    <Badge color="neutral">{course.moduleCount} {copy.modules}</Badge>
                    <Badge color="neutral">{course.lessonCount} {copy.lessons}</Badge>
                  </div>
                </div>
                <LinkButton href={`/learning/${course.slug}`} trailingIcon={RiArrowRightLine} className="self-start sm:self-center">
                  {copy.openCourse}
                </LinkButton>
              </article>
            ))}
          </section>
        ) : (
          <section className="flex flex-col gap-2 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
            <h2 className="text-title-2-semibold text-text-primary">{copy.emptyTitle}</h2>
            <p className="text-body-regular text-text-secondary">{copy.emptyDescription}</p>
          </section>
        )}
      </main>
    </div>
  );
}
