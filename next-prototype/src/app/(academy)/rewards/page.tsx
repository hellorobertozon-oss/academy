import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AcademyLoading } from "@/components/academy-loading";
import { RewardsPage } from "@/components/pages/rewards-page";
import { getLearningCopy } from "@/lib/academy/learning-copy";
import { readEmployeeLeaderboard, readEmployeePoints } from "@/lib/academy/learning";

async function RewardsContent() {
  const [pointsResult, leaderboardResult] = await Promise.all([
    readEmployeePoints(),
    readEmployeeLeaderboard(),
  ]);
  if (pointsResult.status === "forbidden" || leaderboardResult.status === "forbidden") redirect("/admin/courses");
  const languageCode = pointsResult.status === "ok"
    ? pointsResult.languageCode
    : leaderboardResult.status === "ok"
      ? leaderboardResult.languageCode
      : "pl";
  const copy = getLearningCopy(languageCode);

  return (
    <RewardsPage
      currentPoints={pointsResult.status === "ok" ? pointsResult.data : null}
      leaderboard={leaderboardResult.status === "ok" ? leaderboardResult.data : null}
      leaderboardEnabled={leaderboardResult.status === "ok" ? leaderboardResult.enabled : null}
      leaderboardCopy={{
        title: copy.leaderboardTitle,
        description: copy.leaderboardDescription,
        empty: copy.leaderboardEmpty,
        loadError: copy.leaderboardLoadError,
        you: copy.leaderboardYou,
        city: copy.leaderboardCity,
        points: copy.leaderboardPoints,
      }}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie wyników" />}>
      <RewardsContent />
    </Suspense>
  );
}
