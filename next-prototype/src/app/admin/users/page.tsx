import { Suspense } from "react";
import { AcademyLoading } from "@/components/academy-loading";
import { InviteForm } from "@/app/admin/admin-forms";
import { AdminCard, AdminPageHeading } from "@/app/admin/admin-ui";
import { AdminStats } from "@/app/admin/admin-stats";
import {
  UserAccountsTable,
  UserInvitesTable,
  type AdminInviteRow,
  type AdminProfileRow,
} from "@/app/admin/users/user-tables";
import { requireAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";
import { formatPolishCount } from "@/lib/admin/polish-count";

async function UsersContent() {
  const profile = await requireAcademyProfile();
  const supabase = await createAcademyServerClient();
  const [storesResult, profilesResult, invitesResult] = await Promise.all([
    supabase.from("stores").select("id, name, city").order("name"),
    supabase.from("profiles").select("id, email, first_name, last_name, role, store_id").order("email"),
    supabase
      .from("user_invites")
      .select("id, email, role, store_id, created_at, accepted_at, revoked_at")
      .order("created_at", { ascending: false }),
  ]);
  const stores = storesResult.data ?? [];
  const profiles = (profilesResult.data ?? []) as AdminProfileRow[];
  const invites = (invitesResult.data ?? []) as AdminInviteRow[];
  const loadError = Boolean(storesResult.error || profilesResult.error || invitesResult.error);
  const learnerCount = profiles.filter((item) => item.role === "employee").length;
  const adminCount = profiles.filter((item) => item.role === "admin").length;
  const pendingInviteCount = invites.filter((invite) => !invite.accepted_at && !invite.revoked_at).length;

  return (
    <>
      <AdminPageHeading
        title="Użytkownicy"
        description="Zapraszaj użytkowników i administratorów oraz sprawdzaj przypisane konta."
        action={(
          <InviteForm
            stores={stores.map((store) => ({ id: store.id, name: store.name, city: store.city }))}
            defaultLanguage={profile.preferred_language}
          />
        )}
      />

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
          Nie udało się wczytać kont. Sprawdź dostęp do danych projektu Academy.
        </div>
      ) : null}

      <AdminStats metrics={[
        { icon: "users", label: "Konta Academy", value: String(profiles.length), caption: formatPolishCount(adminCount, "administrator", "administratorów", "administratorów") },
        { icon: "users", label: "Użytkownicy", value: String(learnerCount), caption: "Konta uczące się w Akademii" },
        { icon: "invitations", label: "Oczekujące zaproszenia", value: String(pendingInviteCount), caption: "Wysłane, jeszcze nieprzyjęte" },
      ]} />

      <AdminCard title="Konta Academy" description={`${formatPolishCount(profiles.length, "konto", "konta", "kont")} · ${formatPolishCount(learnerCount, "użytkownik", "użytkowników", "użytkowników")} · ${formatPolishCount(adminCount, "administrator", "administratorów", "administratorów")}`}>
        <UserAccountsTable profiles={profiles} stores={stores} />
      </AdminCard>

      <AdminCard title="Zaproszenia" description={`${pendingInviteCount} oczekujących · pełna historia zaproszeń`}>
        <UserInvitesTable invites={invites} stores={stores} />
      </AdminCard>
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie użytkowników" />}>
      <UsersContent />
    </Suspense>
  );
}
