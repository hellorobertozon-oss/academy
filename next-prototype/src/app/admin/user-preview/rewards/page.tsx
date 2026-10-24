import { redirect } from "next/navigation";
import { RewardsPage } from "@/components/pages/rewards-page";
import { getLearningCopy } from "@/lib/academy/learning-copy";
import { requireAcademyProfile } from "@/lib/auth/profile";

export default async function UserPreviewRewardsPage() {
  const profile = await requireAcademyProfile();
  if (profile.role !== "admin") redirect("/dashboard");

  const copy = getLearningCopy(profile.preferred_language);

  return (
    <RewardsPage
      currentPoints={120}
      leaderboard={[
        ...Array.from({ length: 10 }, (_, index) => ({
            position: index + 1,
            displayName: `${copy.leaderboardPreviewName} ${index + 1}`,
            storeName: copy.leaderboardPreviewStore,
            totalPoints: 320 - index * 20,
            isCurrentUser: false,
          })),
        {
          position: 134,
          displayName: `${copy.leaderboardPreviewName} 134`,
          storeName: copy.leaderboardPreviewStore,
          totalPoints: 120,
          isCurrentUser: true,
        },
      ]}
      leaderboardEnabled
      previewMode
      leaderboardCopy={{
        title: copy.leaderboardTitle,
        description: copy.leaderboardDescription,
        empty: copy.leaderboardEmpty,
        loadError: copy.leaderboardLoadError,
        storeName: copy.leaderboardStore,
        points: copy.leaderboardPoints,
      }}
    />
  );
}
