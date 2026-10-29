import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { RiArrowLeftLine, RiArrowRightLine, RiLockLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { LessonMedia } from "@/components/pages/lesson-media";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { LessonCompletion } from "@/components/pages/lesson-completion";
import { LessonContentSections } from "@/components/pages/lesson-content-sections";
import { LessonLoading } from "@/components/pages/learning-loading";
import { readCourseLesson } from "@/lib/academy/learning";
import { getLearningCopy } from "@/lib/academy/learning-copy";

async function LessonContent({
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

        <LessonMedia
          courseSlug={course.slug}
          languageCode={result.languageCode}
          lessonNumber={result.data.lessonNumber}
          lessonTitle={lesson.title}
          imageUrl={lesson.imageUrl}
          youtubeVideoId={lesson.youtube_video_id}
          youtubeVideoIds={lesson.youtube_video_ids}
        />

        <LessonContentSections
          content={lesson.content}
          productBullets={lesson.product_bullets}
          keyPointsTitle={lesson.key_points_title}
          conversationTitle={lesson.conversation_title}
          conversation={lesson.conversation}
          unavailableMessage={copy.contentUnavailable}
        />

        <section className="border-t border-separator-border pt-6">
          <div className="flex justify-center border-b border-separator-border pb-6">
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
          <nav aria-label={copy.lessons} className="mt-6 grid grid-cols-2 gap-3">
            {result.data.previousLessonId ? (
              <ButtonLink
                href={`/learning/${course.slug}/lesson/${result.data.previousLessonId}`}
                size="large"
                variant="secondary"
                leadingIcon={RiArrowLeftLine}
                className="w-full border-accent-300 bg-transparent px-1 text-title-3-semibold text-accent-300 hover:border-accent-200 hover:bg-accent-950 active:bg-accent-900 sm:px-6 sm:text-title-2-semibold [&_svg]:size-[18px] sm:[&_svg]:size-6"
              >
                {copy.previousLesson}
              </ButtonLink>
            ) : <span aria-hidden="true" />}
            {result.data.nextQuizId ? (
              <div className="flex flex-col items-end gap-2">
                {result.data.nextQuizUnlocked ? (
                  <ButtonLink
                    href={`/quiz/${result.data.nextQuizId}`}
                    size="large"
                    trailingIcon={RiArrowRightLine}
                    className="w-full px-1 text-title-3-semibold sm:px-6 sm:text-title-2-semibold [&_svg]:size-[18px] sm:[&_svg]:size-6"
                  >
                    {copy.quizOpen}
                  </ButtonLink>
                ) : (
                  <Button
                    size="large"
                    trailingIcon={RiLockLine}
                    disabled
                    className="w-full px-1 text-title-3-semibold sm:px-6 sm:text-title-2-semibold [&_svg]:size-[18px] sm:[&_svg]:size-6"
                  >
                    {copy.quizOpen}
                  </Button>
                )}
                {!result.data.nextQuizUnlocked ? (
                  <p className="text-end text-caption-1-regular text-text-tertiary">{copy.quizLocked}</p>
                ) : null}
              </div>
            ) : result.data.nextLessonId ? (
              <ButtonLink
                href={`/learning/${course.slug}/lesson/${result.data.nextLessonId}`}
                size="large"
                trailingIcon={RiArrowRightLine}
                className="w-full px-1 text-title-3-semibold sm:px-6 sm:text-title-2-semibold [&_svg]:size-[18px] sm:[&_svg]:size-6"
              >
                {copy.nextLesson}
              </ButtonLink>
            ) : <span aria-hidden="true" />}
          </nav>
        </section>
      </main>
    </div>
  );
}

export default function Page({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  return (
    <Suspense fallback={<LessonLoading />}>
      <LessonContent params={params} />
    </Suspense>
  );
}
