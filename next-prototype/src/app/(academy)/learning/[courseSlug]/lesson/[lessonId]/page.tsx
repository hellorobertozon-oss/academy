import { notFound, redirect } from "next/navigation";
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { LinkButton } from "@/components/base/buttons/link-button";
import { LessonCompletion } from "@/components/pages/lesson-completion";
import { RichContent } from "@/components/pages/rich-content";
import { readCourseLesson } from "@/lib/academy/learning";
import { getLearningCopy } from "@/lib/academy/learning-copy";

export default async function Page({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId: rawLessonId } = await params;
  const lessonId = Number(rawLessonId);
  if (!Number.isSafeInteger(lessonId) || lessonId <= 0) notFound();

  const result = await readCourseLesson(courseSlug, lessonId);
  if (result.status === "not-found") notFound();
  if (result.status === "forbidden") redirect("/admin/courses");
  const copy = getLearningCopy(result.status === "ok" ? result.languageCode : "pl");

  if (result.status === "error") {
    return (
      <div className="min-h-screen bg-background-full">
        <AcademyHeader mode="app" />
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
          <LinkButton href={`/learning/${courseSlug}`} size="medium" variant="secondary" leadingIcon={RiArrowLeftLine} className="self-start">
            {copy.backToCourse}
          </LinkButton>
          <div role="alert" className="rounded-3xl border border-border-error-default bg-background-primary-default p-6 text-body-regular text-text-error-primary">
            {copy.loadError}
          </div>
        </main>
      </div>
    );
  }

  const { course, module: courseModule, lesson } = result.data;
  const videoId = lesson.youtube_video_id && /^[A-Za-z0-9_-]{11}$/.test(lesson.youtube_video_id)
    ? lesson.youtube_video_id
    : null;
  const position = copy.lessonPosition
    .replace("{current}", String(result.data.lessonNumber))
    .replace("{total}", String(result.data.lessonCount));

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <LinkButton href={`/learning/${course.slug}`} size="medium" variant="secondary" leadingIcon={RiArrowLeftLine} className="self-start">
          {copy.backToCourse}
        </LinkButton>

        <header className="flex flex-col gap-3">
          <p className="text-caption-1-semibold uppercase tracking-[0.14em] text-accent-300">
            {course.title} · {courseModule.title}
          </p>
          <h1 className="font-display text-display-2-regular uppercase tracking-wide text-text-primary">{lesson.title}</h1>
          <p className="text-caption-1-semibold text-text-tertiary">{position}</p>
          {lesson.summary ? <p className="max-w-4xl text-headline-regular text-text-secondary">{lesson.summary}</p> : null}
        </header>

        {videoId ? (
          <div className="relative aspect-video overflow-hidden rounded-3xl border border-border-button-default bg-background-secondary-default">
            <iframe
              className="absolute inset-0 size-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : null}

        <article className="flex flex-col gap-6 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-8">
          <RichContent content={lesson.content} unavailableMessage={copy.contentUnavailable} />
          {lesson.product_bullets.length ? (
            <section className="flex flex-col gap-3" aria-labelledby="lesson-key-points-heading">
              <h2 id="lesson-key-points-heading" className="text-title-1-medium text-text-primary">{copy.keyPoints}</h2>
              <ul className="flex flex-col gap-3">
                {lesson.product_bullets.map((bullet, index) => (
                  <li key={`${index}-${bullet}`} className="flex items-start gap-3">
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-accent-300" aria-hidden="true" />
                    <span className="text-body-regular text-text-secondary">{bullet}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <div className="border-t border-separator-border pt-6">
            <LessonCompletion
              lessonId={lesson.id}
              completed={lesson.completed}
              markLabel={copy.markLessonComplete}
              completedLabel={copy.lessonCompleted}
              pendingLabel={copy.completionPending}
              awardedMessage={copy.completionAwarded}
              errorMessage={copy.completionError}
            />
          </div>
        </article>

        <nav aria-label={copy.lessons} className="grid gap-3 sm:grid-cols-2">
          {result.data.previousLessonId ? (
            <LinkButton
              href={`/learning/${course.slug}/lesson/${result.data.previousLessonId}`}
              size="medium"
              variant="secondary"
              leadingIcon={RiArrowLeftLine}
              className="w-full justify-start"
            >
              {copy.previousLesson}
            </LinkButton>
          ) : <span aria-hidden="true" />}
          {result.data.nextLessonId ? (
            <LinkButton
              href={`/learning/${course.slug}/lesson/${result.data.nextLessonId}`}
              size="medium"
              trailingIcon={RiArrowRightLine}
              className="w-full justify-between"
            >
              {copy.nextLesson}
            </LinkButton>
          ) : null}
        </nav>
      </main>
    </div>
  );
}
