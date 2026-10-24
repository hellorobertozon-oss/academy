import { DashboardPage } from "@/components/pages/dashboard-page";
import { requireAcademyProfile } from "@/lib/auth/profile";
import { readEmployeePoints } from "@/lib/academy/learning";

export default async function Page() {
  const profile = await requireAcademyProfile();
  const pointsResult = profile.role === "employee" ? await readEmployeePoints() : null;
  return (
    <DashboardPage
      isAdmin={profile.role === "admin"}
      firstName={profile.first_name}
      currentPoints={pointsResult?.status === "ok" ? pointsResult.data : null}
    />
  );
}
