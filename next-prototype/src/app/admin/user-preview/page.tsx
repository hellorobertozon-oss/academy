import { DashboardPage } from "@/components/pages/dashboard-page";
import { requireAcademyProfile } from "@/lib/auth/profile";

export default async function UserPreviewPage() {
  const profile = await requireAcademyProfile();
  return <DashboardPage isAdmin={false} firstName={profile.first_name} currentPoints={120} previewMode />;
}
