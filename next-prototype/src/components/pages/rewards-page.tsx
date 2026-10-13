"use client";

import Image from "next/image";
import { RiArrowLeftLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { backActionClassName, RouteButton } from "@/components/route-button";
import { useAcademy } from "@/components/academy-provider";
import { Badge } from "@/components/base/badges/badge";
import type { LearningLeaderboardEntry } from "@/lib/academy/learning";
import { cx } from "@/utils/cx";

const rewardTarget = 500;

const pointRules = [
  { title: "rewardLessonTitle", points: 10 },
  { title: "rewardTestTitle", points: 20 },
] as const;

export function RewardsPage({
  currentPoints,
  leaderboard,
  leaderboardEnabled,
  leaderboardCopy,
}: {
  currentPoints: number | null;
  leaderboard: LearningLeaderboardEntry[] | null;
  leaderboardEnabled: boolean | null;
  leaderboardCopy: {
    title: string;
    description: string;
    empty: string;
    loadError: string;
    you: string;
    city: string;
    points: string;
  };
}) {
  const { t } = useAcademy();
  const pointsToReward = currentPoints === null ? null : Math.max(rewardTarget - currentPoints, 0);

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <header>
          <div className="mb-6 flex justify-start">
            <RouteButton href="/dashboard" size="large" variant="secondary" leadingIcon={RiArrowLeftLine} className={backActionClassName}>
              {t("backToDashboard")}
            </RouteButton>
          </div>
          <p className="text-caption-1-semibold uppercase tracking-[0.16em] text-accent-300">{t("progress")}</p>
          <h1 className="mt-2 font-display text-display-2-regular uppercase tracking-wide text-text-primary">{t("rewardsTitle")}</h1>
          <p className="mt-3 max-w-2xl text-body-regular text-text-secondary">{t("rewardsDescriptionLong")}</p>
        </header>

        {currentPoints === null ? (
          <div role="alert" className="mt-6 rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
            {t("progressLoadError")}
          </div>
        ) : null}

        <section className="mt-8 overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default shadow-lg" aria-label={t("rewardBadge")}>
          <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="relative min-h-80 overflow-hidden bg-background-secondary-default sm:min-h-[28rem]">
              <Image
                src="/assets/reward-packshot.jpg"
                alt={t("rewardImageAlt")}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="image-outline object-cover"
              />
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
              <p className="text-caption-1-semibold uppercase tracking-[0.16em] text-accent-300">{t("rewardBadge")}</p>
              <h2 className="mt-3 max-w-xl font-display text-display-2-regular leading-none uppercase tracking-wide text-text-primary">{t("rewardTitle")}</h2>
              <p className="mt-3 max-w-xl text-title-3-regular text-text-secondary">{t("rewardUnlockDescription")}</p>
              <ul className="mt-4 space-y-2.5">
                <li className="flex items-start gap-3">
                  <span className="mt-2.5 size-3 shrink-0 rounded-full bg-accent-300" aria-hidden="true" />
                  <p className="text-title-3-regular leading-snug text-text-primary"><strong className="font-semibold text-accent-300">{t("rewardKitGelTitle")}</strong> — {t("rewardKitGelDescription")}</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2.5 size-3 shrink-0 rounded-full bg-accent-300" aria-hidden="true" />
                  <p className="text-title-3-regular leading-snug text-text-primary"><strong className="font-semibold text-accent-300">{t("rewardKitDetailerTitle")}</strong> — {t("rewardKitDetailerDescription")}</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2.5 size-3 shrink-0 rounded-full bg-accent-300" aria-hidden="true" />
                  <p className="text-title-3-regular leading-snug text-text-primary"><strong className="font-semibold text-accent-300">{t("rewardKitAccessoriesTitle")}</strong> — {t("rewardKitAccessoriesDescription")}</p>
                </li>
              </ul>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-body-medium text-text-secondary">{t("rewardThresholdLabel")}</p>
                  <p className="font-display text-title-2-medium tabular-nums text-text-primary">
                    {rewardTarget}<span className="ms-1 text-body-medium text-text-tertiary">{t("pointsUnit")}</span>
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-body-medium text-text-secondary">{t("pointsBalance")}</p>
                    <p className="mt-1 font-display text-display-2-regular tabular-nums text-accent-300">
                      {currentPoints ?? "—"}<span className="ms-1 text-body-medium">{t("pointsUnit")}</span>
                    </p>
                  </div>
                  <div className="text-end">
                    {pointsToReward === null ? (
                      <p className="pt-5 text-body-semibold text-text-tertiary">—</p>
                    ) : pointsToReward > 0 ? (
                      <>
                        <p className="text-body-medium text-text-secondary">{t("rewardPointsMissingLabel")}</p>
                        <p className="mt-1 font-display text-display-2-regular tabular-nums text-text-primary">
                          {pointsToReward}<span className="ms-1 text-body-medium text-text-tertiary">{t("pointsUnit")}</span>
                        </p>
                      </>
                    ) : (
                      <p className="pt-5 text-body-semibold text-accent-300">{t("rewardGoalReached")}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            <ol className="grid gap-2 p-4 sm:p-6" aria-label={leaderboardCopy.title}>
              {leaderboard.map((entry) => (
                <li
                  key={entry.position}
                  className={cx(
                    "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3 sm:gap-4 sm:p-4",
                    entry.isCurrentUser
                      ? "border-accent-400 bg-background-secondary-default"
                      : "border-separator-border bg-background-primary-default",
                  )}
                >
                  <span className="grid size-10 place-items-center rounded-full bg-background-tertiary-default text-body-semibold tabular-nums text-text-primary">
                    {entry.position}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-body-semibold text-text-primary">{entry.displayName}</span>
                    {entry.city ? (
                      <span className="mt-0.5 block truncate text-body-2-regular text-text-secondary">
                        <span className="sr-only">{leaderboardCopy.city}: </span>{entry.city}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    {entry.isCurrentUser ? <Badge color="primary">{leaderboardCopy.you}</Badge> : null}
                    <span className="whitespace-nowrap text-body-semibold tabular-nums text-accent-300">
                      {entry.totalPoints} <span className="text-body-2-medium text-text-secondary">{leaderboardCopy.points}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="px-5 py-5 text-body-regular text-text-secondary sm:px-7">{leaderboardCopy.empty}</p>
          )}
        </section>
      </main>
    </div>
  );
}
