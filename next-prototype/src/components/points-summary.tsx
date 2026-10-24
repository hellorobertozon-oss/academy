"use client";

import { useAcademy } from "@/components/academy-provider";
import { GoldCoinAnimation } from "@/components/gold-coin-animation";

export function PointsSummary({
  currentPoints,
  compact = false,
}: {
  currentPoints: number | null;
  compact?: boolean;
}) {
  const { t } = useAcademy();

  if (compact) {
    return (
      <div role="group" aria-label={t("pointsBalance")} className="-translate-y-3 inline-flex shrink-0 flex-col items-center gap-0 py-1 sm:-translate-y-4">
        <div className="size-20 sm:size-24">
          <GoldCoinAnimation />
        </div>
        <p className="-mt-4 whitespace-nowrap font-display text-display-3-regular tabular-nums text-accent-300 sm:-mt-5">
          {currentPoints ?? "—"}<span className="ms-2 text-title-2-medium text-accent-300">{t("pointsUnit")}</span>
        </p>
      </div>
    );
  }

  return (
    <section
      className="flex flex-col items-center gap-2 rounded-3xl border border-border-button-default bg-background-primary-default p-5 text-center sm:p-6"
      aria-label={t("pointsBalance")}
    >
      <div className="size-20 shrink-0 sm:size-24">
        <GoldCoinAnimation />
      </div>
      <div className="min-w-0">
        <p className="text-body-medium text-text-secondary">{t("pointsBalance")}</p>
        <p className="mt-1 font-display text-display-2-regular tabular-nums text-accent-300">
          {currentPoints ?? "—"}<span className="ms-2 text-title-3-medium text-accent-300">{t("pointsUnit")}</span>
        </p>
        <p className="mt-2 text-body-2-regular text-text-secondary">{t("pointsDescription")}</p>
      </div>
    </section>
  );
}
