import { DashboardPage } from "@/components/pages/dashboard-page";
import { requireAcademyProfile } from "@/lib/auth/profile";

export default async function Page() {
  const profile = await requireAcademyProfile();
  return <DashboardPage isAdmin={profile.role === "admin"} />;
}
