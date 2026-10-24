"use client";

import {
  RiBankLine,
  RiBookOpenLine,
  RiGroupLine,
  RiNotification3Line,
  RiQuestionnaireLine,
  RiTranslate2,
} from "@remixicon/react";
import { StatCards, type Stat, type StatTone } from "@/components/application/dashboard/stat-cards";
import { cx } from "@/utils/cx";

export type AdminMetric = {
  icon: "stores" | "users" | "invitations" | "courses" | "lessons" | "languages" | "quizzes";
  label: string;
  value: string;
  caption: string;
};

const METRIC_ICONS: Record<AdminMetric["icon"], Stat["icon"]> = {
  stores: RiBankLine,
  users: RiGroupLine,
  invitations: RiNotification3Line,
  courses: RiBookOpenLine,
  lessons: RiBookOpenLine,
  languages: RiTranslate2,
  quizzes: RiQuestionnaireLine,
};

const METRIC_TONES: StatTone[] = ["blue", "emerald", "purple", "orange"];

export function AdminStats({
  metrics,
  className,
}: {
  metrics: AdminMetric[];
  className?: string;
}) {
  const stats: Stat[] = metrics.map((metric, index) => ({
    icon: METRIC_ICONS[metric.icon],
    label: metric.label,
    value: metric.value,
    caption: metric.caption,
    deltaColor: "neutral",
    tone: METRIC_TONES[index % METRIC_TONES.length],
  }));

  return (
    <section aria-label="Podsumowanie" className={cx("min-w-0", className)}>
      <StatCards
        variant="footer"
        stats={stats}
        count={stats.length}
        columns={1}
        className={cx(
          "sm:grid-cols-2",
          metrics.length >= 4 ? "xl:grid-cols-4" : "xl:grid-cols-3",
        )}
      />
    </section>
  );
}
