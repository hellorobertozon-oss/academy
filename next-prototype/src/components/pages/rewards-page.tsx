"use client";

import { RiArrowLeftLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { PointsSummary } from "@/components/points-summary";
import { backActionClassName, RouteButton } from "@/components/route-button";
import { useAcademy } from "@/components/academy-provider";
import type { LearningLeaderboardEntry } from "@/lib/academy/learning";
import { cx } from "@/utils/cx";

const pointRules = [
  { title: "rewardLessonTitle", points: 10 },
  { title: "rewardTestTitle", points: 20 },
] as const;

export function RewardsPage({
  currentPoints,
  leaderboard,
  leaderboardEnabled,
  leaderboardCopy,
  previewMode = false,
}: {
  currentPoints: number | null;
  leaderboard: LearningLeaderboardEntry[] | null;
  leaderboardEnabled: boolean | null;
  leaderboardCopy: {
    title: string;
    description: string;
    empty: string;
    loadError: string;
    storeName: string;
    points: string;
  };
  previewMode?: boolean;
}) {
  const { t } = useAcademy();
  const topEntries = (leaderboard ?? []).filter((entry) => entry.position <= 10);
  const currentUserOutsideTopTen = (leaderboard ?? []).find(
    (entry) => entry.isCurrentUser && entry.position > 10,
  );
  const renderLeaderboardEntry = (entry: LearningLeaderboardEntry) => (
    <li
      key={entry.position}
      className="flex items-center gap-5 py-3 sm:py-4"
    >
      <span className={cx(
        "font-display text-display-3-regular tabular-nums",
        entry.isCurrentUser ? "text-accent-300" : "text-text-primary",
      )}>
        {entry.position}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-semibold text-text-primary">{entry.displayName}</span>
        {entry.storeName ? (
          <span className="mt-0.5 block truncate text-body-2-regular text-text-secondary">
            <span className="sr-only">{leaderboardCopy.storeName}: </span>{entry.storeName}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 whitespace-nowrap font-display text-display-3-regular tabular-nums text-accent-300">
        {entry.totalPoints}<span className="ms-1 text-body-2-medium text-text-secondary">{leaderboardCopy.points}</span>
      </span>
    </li>
  );

  return (
    <div className="min-h-screen bg-background-full">
      {previewMode ? (
        <div role="note" className="relative z-30 bg-accent-300 px-4 py-1.5 text-center text-body-2-semibold text-accent-950 sm:px-8">
          <p className="mx-auto max-w-6xl">{t("userPreviewNotice")}</p>
        </div>
      ) : null}
      <AcademyHeader mode="app" />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <header>
          <div className="mb-6 flex justify-start">
            <RouteButton href={previewMode ? "/admin/user-preview" : "/dashboard"} size="large" variant="secondary" leadingIcon={RiArrowLeftLine} className={backActionClassName}>
              {t("backToDashboard")}
            </RouteButton>
          </div>
          <p className="text-caption-1-semibold uppercase tracking-[0.16em] text-accent-300">{t("progress")}</p>
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8">
            <div className="min-w-0">
              <h1 className="mt-2 font-display text-display-2-regular uppercase tracking-wide text-text-primary">{t("ranking")}</h1>
              <p className="mt-3 max-w-2xl text-body-regular text-text-secondary">{t("rankingDescription")}</p>
            </div>
            <PointsSummary currentPoints={currentPoints} compact />
          </div>
        </header>

        {currentPoints === null ? (
          <div role="alert" className="mt-6 rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
            {t("progressLoadError")}
          </div>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default" aria-labelledby="leaderboard-heading">
          <div className="border-b border-separator-border px-5 py-5 sm:px-7">
            <h2 id="leaderboard-heading" className="text-title-2-medium text-text-primary">{leaderboardCopy.title}</h2>
            <p className="mt-1 text-body-2-regular text-text-secondary">{leaderboardCopy.description}</p>
          </div>
          {leaderboard === null ? (
            <p role="alert" className="px-5 py-5 text-body-regular text-text-error-primary sm:px-7">{leaderboardCopy.loadError}</p>
          ) : !leaderboardEnabled ? (
            <p className="px-5 py-5 text-body-regular text-text-secondary sm:px-7">{t("leaderboardHidden")}</p>
          ) : leaderboard.length ? (
            <ol className="divide-y divide-separator-border border-y border-separator-border px-5 sm:px-7" aria-label={leaderboardCopy.title}>
              {topEntries.map(renderLeaderboardEntry)}
              {currentUserOutsideTopTen ? (
                <>
                  <li aria-hidden="true" className="py-1 text-center text-title-3-medium tracking-[0.3em] text-text-tertiary">···</li>
                  {renderLeaderboardEntry(currentUserOutsideTopTen)}
                </>
              ) : null}
            </ol>
          ) : (
            <p className="px-5 py-5 text-body-regular text-text-secondary sm:px-7">{leaderboardCopy.empty}</p>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default" aria-labelledby="reward-rules-heading">
          <div className="border-b border-separator-border px-5 py-5 sm:px-7">
            <h2 id="reward-rules-heading" className="text-title-2-medium text-text-primary">{t("rewardRulesTitle")}</h2>
            <p className="mt-1 text-body-2-regular text-text-secondary">{t("rewardRulesDescription")}</p>
          </div>
          <div className="grid sm:grid-cols-2">
            {pointRules.map(({ title, points }, index) => (
              <article
                key={title}
                className={cx(
                  "flex items-center gap-4 px-5 py-5 sm:px-7",
                  index === 1 ? "sm:border-s sm:border-separator-border" : "border-b border-separator-border sm:border-b-0",
                )}
              >
                <h3 className="min-w-0 flex-1 text-title-3-medium text-text-primary">{t(title)}</h3>
                <p className="shrink-0 font-display text-display-3-regular tabular-nums text-accent-300">
                  +{points}<span className="ms-1 text-body-medium">{t("pointsUnit")}</span>
                </p>
              </article>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
