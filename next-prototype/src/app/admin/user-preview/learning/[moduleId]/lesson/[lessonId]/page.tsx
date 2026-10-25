import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { AcademyLoading } from "@/components/academy-loading";
import { AcademyContentImage } from "@/components/academy-content-image";
import { ButtonLink } from "@/components/base/buttons/button";
import { LessonCompletion } from "@/components/pages/lesson-completion";
import { LessonContentSections } from "@/components/pages/lesson-content-sections";
import { readAdminPreviewCourseLesson } from "@/lib/academy/learning";
import { getLearningCopy } from "@/lib/academy/learning-copy";

async function PreviewLessonContent({
  params,
}: {
  params: Promise<{ moduleId: string; lessonId: string }>;
}) {
  const { moduleId: courseSlug, lessonId: rawLessonId } = await params;
  const lessonId = Number(rawLessonId);
  if (!Number.isSafeInteger(lessonId) || lessonId <= 0) notFound();

  const result = await readAdminPreviewCourseLesson(courseSlug, lessonId);
  if (result.status === "not-found") notFound();
  if (result.status === "forbidden") redirect("/admin");
  const copy = getLearningCopy(result.status === "ok" ? result.languageCode : "pl");
  const courseHref = `/admin/user-preview/learning/${encodeURIComponent(courseSlug)}`;

  if (result.status === "error") {
    return (
      <div className="min-h-screen bg-background-full">
        <AcademyHeader mode="app" />
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
          <ButtonLink href={courseHref} size="large" variant="secondary" leadingIcon={RiArrowLeftLine} className="self-start border-accent-400/50 text-accent-300 hover:border-accent-300 hover:bg-accent-950 active:bg-accent-900">
            {copy.backToCourse}
          </ButtonLink>
          <div role="alert" className="rounded-3xl border border-border-error-default bg-background-primary-default p-6 text-body-regular text-text-error-primary">
            {copy.loadError}
          </div>
        </main>
      </div>
    );
  }

  const { course, module: courseModule, lesson } = result.data;
  const videoIds = Array.from(new Set(
    (lesson.youtube_video_ids?.length ? lesson.youtube_video_ids : [lesson.youtube_video_id])
      .filter((id): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id)),
  ));
  const position = copy.lessonPosition
    .replace("{current}", String(result.data.lessonNumber))
    .replace("{total}", String(result.data.lessonCount));
  const lessonHref = (id: number) => `${courseHref}/lesson/${id}`;

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <ButtonLink href={courseHref} size="large" variant="secondary" leadingIcon={RiArrowLeftLine} className="self-start border-accent-400/50 text-accent-300 hover:border-accent-300 hover:bg-accent-950 active:bg-accent-900">
          {copy.backToCourse}
        </ButtonLink>

        <header className="flex flex-col gap-3">
          <p className="text-caption-1-semibold uppercase tracking-[0.14em] text-accent-300">
            {course.title} · {courseModule.title}
          </p>
          <h1 className="font-display text-display-2-regular uppercase tracking-wide text-text-primary">{lesson.title}</h1>
          <p className="text-caption-1-semibold text-text-tertiary">{position}</p>
          {lesson.summary ? <p className="max-w-4xl text-headline-regular text-text-secondary">{lesson.summary}</p> : null}
        </header>

        {videoIds.length === 0 && lesson.imageUrl ? (
          <AcademyContentImage imageUrl={lesson.imageUrl} alt={lesson.title} placeholder="Grafika lekcji" className="aspect-[16/7] w-full rounded-3xl" />
        ) : null}

        {videoIds.map((videoId, index) => (
          <div key={videoId} className="relative aspect-video overflow-hidden rounded-3xl border border-border-button-default bg-background-secondary-default">
            <iframe
              className="absolute inset-0 size-full"
              src={"https://www.youtube-nocookie.com/embed/" + videoId}
              title={lesson.title + " — " + (index + 1)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ))}

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
              previewOnly
            />
          </div>
          <nav aria-label={copy.lessons} className="mt-6 grid grid-cols-2 gap-3">
            {result.data.previousLessonId ? (
              <ButtonLink href={lessonHref(result.data.previousLessonId)} size="large" variant="secondary" leadingIcon={RiArrowLeftLine} className="w-full border-accent-300 bg-transparent px-1 text-title-3-semibold text-accent-300 hover:border-accent-200 hover:bg-accent-950 active:bg-accent-900 sm:px-6 sm:text-title-2-semibold [&_svg]:size-[18px] sm:[&_svg]:size-6">
                {copy.previousLesson}
              </ButtonLink>
            ) : <span aria-hidden="true" />}
            {result.data.nextLessonId ? (
              <ButtonLink href={lessonHref(result.data.nextLessonId)} size="large" trailingIcon={RiArrowRightLine} className="w-full px-1 text-title-3-semibold sm:px-6 sm:text-title-2-semibold [&_svg]:size-[18px] sm:[&_svg]:size-6">
                {copy.nextLesson}
              </ButtonLink>
            ) : <span aria-hidden="true" />}
          </nav>
        </section>
      </main>
    </div>
  );
}

export default function UserPreviewLessonPage({
  params,
}: {
  params: Promise<{ moduleId: string; lessonId: string }>;
}) {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie lekcji" withHeader />}>
      <PreviewLessonContent params={params} />
    </Suspense>
  );
}
