import { AcademyContentImage } from "@/components/academy-content-image";
import { LessonVideoCarousel } from "@/components/pages/lesson-video-carousel";
import { LEGACY_YOUTUBE_LESSON_VIDEOS_VISIBLE } from "@/lib/academy/lesson-video-config";
import { getTradeFairVideosForLesson } from "@/lib/academy/trade-fair-lesson-videos";

type LessonMediaProps = {
  courseSlug: string;
  languageCode: string;
  lessonNumber: number;
  lessonTitle: string;
  imageUrl: string | null;
  youtubeVideoId: string | null;
  youtubeVideoIds: string[];
};

function getLegacyYoutubeVideoIds(videoId: string | null, videoIds: string[]) {
  if (!LEGACY_YOUTUBE_LESSON_VIDEOS_VISIBLE) return [];

  return Array.from(new Set(
    (videoIds.length ? videoIds : [videoId])
      .filter((id): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id)),
  ));
}

export function LessonMedia({
  courseSlug,
  languageCode,
  lessonNumber,
  lessonTitle,
  imageUrl,
  youtubeVideoId,
  youtubeVideoIds,
}: LessonMediaProps) {
  const tradeFairVideos = getTradeFairVideosForLesson(courseSlug, lessonNumber);
  const youtubeVideoIdsToShow = getLegacyYoutubeVideoIds(youtubeVideoId, youtubeVideoIds);
  const hasVideos = tradeFairVideos.length > 0 || youtubeVideoIdsToShow.length > 0;

  return (
    <>
      {!hasVideos && imageUrl ? (
        <AcademyContentImage imageUrl={imageUrl} alt={lessonTitle} placeholder="Grafika lekcji" className="aspect-[16/7] w-full rounded-3xl" />
      ) : null}

      {tradeFairVideos.length > 0 ? (
        <LessonVideoCarousel videos={tradeFairVideos} lessonTitle={lessonTitle} languageCode={languageCode} />
      ) : null}

      {youtubeVideoIdsToShow.map((videoId, index) => (
        <div key={videoId} className="relative aspect-video overflow-hidden rounded-3xl border border-border-button-default bg-background-secondary-default">
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title={`${lessonTitle} — ${index + 1}`}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ))}
    </>
  );
}
