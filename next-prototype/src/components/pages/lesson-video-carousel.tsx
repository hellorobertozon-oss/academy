"use client";

import { useState } from "react";
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import type { TradeFairProductVideo } from "@/lib/trade-fair-catalog-content";

const CAROUSEL_LABELS = {
  pl: {
    region: "Filmy produktowe",
    previous: "Poprzedni film",
    next: "Następny film",
    position: (current: number, total: number) => `Film ${current} z ${total}`,
  },
  en: {
    region: "Product videos",
    previous: "Previous video",
    next: "Next video",
    position: (current: number, total: number) => `Video ${current} of ${total}`,
  },
  de: {
    region: "Produktvideos",
    previous: "Vorheriges Video",
    next: "Nächstes Video",
    position: (current: number, total: number) => `Video ${current} von ${total}`,
  },
  cs: {
    region: "Produktová videa",
    previous: "Předchozí video",
    next: "Další video",
    position: (current: number, total: number) => `Video ${current} z ${total}`,
  },
  fr: {
    region: "Vidéos produits",
    previous: "Vidéo précédente",
    next: "Vidéo suivante",
    position: (current: number, total: number) => `Vidéo ${current} sur ${total}`,
  },
  it: {
    region: "Video dei prodotti",
    previous: "Video precedente",
    next: "Video successivo",
    position: (current: number, total: number) => `Video ${current} di ${total}`,
  },
} as const;

type LessonVideoCarouselProps = {
  videos: TradeFairProductVideo[];
  lessonTitle: string;
  languageCode: string;
};

export function LessonVideoCarousel({ videos, lessonTitle, languageCode }: LessonVideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const video = videos[currentIndex];
  if (!video) return null;

  const labels = CAROUSEL_LABELS[languageCode as keyof typeof CAROUSEL_LABELS] ?? CAROUSEL_LABELS.pl;
  const position = labels.position(currentIndex + 1, videos.length);

  return (
    <section
      aria-label={labels.region}
      className="mx-auto w-full max-w-sm"
    >
      <h2 className="mb-3 min-h-11 text-title-3-semibold leading-snug text-text-secondary">{video.title}</h2>

      <div
        role="group"
        aria-label={videos.length > 1 ? position : video.title}
      >
        <div className="mx-auto aspect-[9/16] w-full max-w-xs overflow-hidden rounded-3xl border border-border-button-default bg-background-secondary-default">
          <video
            key={video.src}
            aria-label={`${lessonTitle}: ${video.title}`}
            controls
            playsInline
            preload="metadata"
            className="size-full object-contain"
          >
            <source src={video.src} type="video/mp4" />
            Odtwarzanie filmu: {video.title}
          </video>
        </div>
      </div>

      {videos.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            iconOnly
            leadingIcon={RiArrowLeftLine}
            aria-label={labels.previous}
            disabled={currentIndex === 0}
            className="min-h-11 min-w-11 rounded-full"
            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
          />
          <span aria-live="polite" className="min-w-28 text-center text-body-medium text-text-secondary tabular-nums">
            {position}
          </span>
          <Button
            variant="secondary"
            iconOnly
            leadingIcon={RiArrowRightLine}
            aria-label={labels.next}
            disabled={currentIndex === videos.length - 1}
            className="min-h-11 min-w-11 rounded-full"
            onClick={() => setCurrentIndex((index) => Math.min(videos.length - 1, index + 1))}
          />
        </div>
      ) : null}
    </section>
  );
}
