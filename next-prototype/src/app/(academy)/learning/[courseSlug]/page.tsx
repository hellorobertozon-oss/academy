import { notFound, redirect } from "next/navigation";
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { Badge } from "@/components/base/badges/badge";
import { LinkButton } from "@/components/base/buttons/link-button";
import { readCourseOutline } from "@/lib/academy/learning";
import { getLearningCopy } from "@/lib/academy/learning-copy";

export default async function Page({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const result = await readCourseOutline(courseSlug);
  if (result.status === "not-found") notFound();
  if (result.status === "forbidden") redirect("/admin/courses");
  const copy = getLearningCopy(result.status === "ok" ? result.languageCode : "pl");

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <LinkButton href="/learning" size="medium" variant="secondary" leadingIcon={RiArrowLeftLine} className="self-start">
          {copy.backToCourses}
        </LinkButton>

        {result.status === "error" ? (
          <div role="alert" className="rounded-3xl border border-border-error-default bg-background-primary-default p-6 text-body-regular text-text-error-primary">
            {copy.loadError}
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-4">
              <p className="text-caption-1-semibold uppercase tracking-[0.16em] text-accent-300">Xzone Academy</p>
              <h1 className="font-display text-display-2-regular uppercase tracking-wide text-text-primary">{result.data.title}</h1>
              {result.data.description ? <p className="max-w-4xl text-headline-regular text-text-secondary">{result.data.description}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Badge color="neutral">{result.data.modules.length} {copy.modules}</Badge>
                <Badge color="neutral">
                  {result.data.modules.reduce((total, courseModule) => total + courseModule.lessons.length, 0)} {copy.lessons}
                </Badge>
              </div>
            </header>

            <section aria-label={copy.modules} className="flex flex-col gap-5">
              {result.data.modules.length === 0 ? (
                <p className="text-body-regular text-text-secondary">{copy.noModules}</p>
              ) : result.data.modules.map((courseModule, moduleIndex) => (
                <article key={courseModule.id} className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-2">
                      <p className="text-caption-1-semibold uppercase tracking-[0.14em] text-accent-300">{copy.modules} {moduleIndex + 1}</p>
                      <h2 className="text-title-1-medium text-text-primary">{courseModule.title}</h2>
                      {courseModule.summary ? <p className="max-w-3xl text-body-regular text-text-secondary">{courseModule.summary}</p> : null}
                    </div>
                    <Badge color="neutral">{courseModule.lessons.length} {copy.lessons}</Badge>
                  </div>

                  {courseModule.lessons.length ? (
                    <ol className="flex flex-col gap-2">
                      {courseModule.lessons.map((lesson, lessonIndex) => (
                        <li key={lesson.id}>
                          <LinkButton
                            href={`/learning/${result.data.slug}/lesson/${lesson.id}`}
                            variant="secondary"
                            trailingIcon={RiArrowRightLine}
                            className="min-h-14 w-full justify-between rounded-2xl border border-separator-border px-4 text-start sm:px-5"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-background-secondary-default text-body-semibold tabular-nums text-accent-300">
                                {String(lessonIndex + 1).padStart(2, "0")}
                              </span>
                              <span className="flex min-w-0 flex-col items-start gap-1">
                                <span className="text-title-3-medium text-text-primary">{lesson.title}</span>
                                {lesson.summary ? <span className="text-body-2-regular text-text-secondary">{lesson.summary}</span> : null}
                              </span>
                            </span>
                          </LinkButton>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-body-2-regular text-text-secondary">{copy.noLessons}</p>
                  )}
                </article>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
