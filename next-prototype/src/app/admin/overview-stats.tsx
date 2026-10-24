"use client";

import { RiBankLine, RiGroupLine, RiNotification3Line } from "@remixicon/react";
import { StatCards, type Stat } from "@/components/application/dashboard/stat-cards";

export function OverviewStats({
  stores,
  users,
  invitations,
}: {
  stores: number;
  users: number;
  invitations: number;
}) {
  const stats: Stat[] = [
    { icon: RiBankLine, label: "Sklepy", value: String(stores), deltaColor: "neutral" },
    { icon: RiGroupLine, label: "Użytkownicy", value: String(users), deltaColor: "neutral" },
    { icon: RiNotification3Line, label: "Oczekujące zaproszenia", value: String(invitations), deltaColor: "neutral" },
  ];

  return (
    <section aria-label="Podsumowanie" className="rounded-3xl border border-border-button-default bg-background-primary-default p-4 sm:p-5">
      <StatCards stats={stats} count={3} columns={1} className="sm:grid-cols-3" />
    </section>
  );
}
