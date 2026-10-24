import { Suspense } from "react";
import {
  RiArrowRightLine,
  RiEyeLine,
} from "@remixicon/react";
import { AcademyLoading } from "@/components/academy-loading";
import { LinkButton } from "@/components/base/buttons/link-button";
import { LeaderboardVisibilityForm } from "@/app/admin/leaderboard-form";
import { AdminPageHeading } from "@/app/admin/admin-ui";
import { AdminStats } from "@/app/admin/admin-stats";
import { requireAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";

async function AdminOverview() {
  await requireAcademyProfile();
  const supabase = await createAcademyServerClient();
  const [storesResult, usersResult, learnersResult, invitesResult, settingsResult] = await Promise.all([
    supabase.from("stores").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "employee"),
    supabase
      .from("user_invites")
      .select("id", { count: "exact", head: true })
      .is("accepted_at", null)
      .is("revoked_at", null),
    supabase.from("academy_settings").select("leaderboard_enabled").eq("id", true).maybeSingle(),
  ]);

  const storeCount = storesResult.count ?? 0;
  const userCount = usersResult.count ?? 0;
  const learnerCount = learnersResult.count ?? 0;
  const invitationCount = invitesResult.count ?? 0;
  const loadError = Boolean(storesResult.error || usersResult.error || invitesResult.error);

  return (
    <>
      <AdminPageHeading
        title="Przegląd"
        description="Zarządzaj dostępem i szkoleniami, a następnie sprawdź, jak wygląda Akademia po stronie użytkownika."
        action={(
          <LinkButton href="/admin/user-preview" variant="secondary" leadingIcon={RiEyeLine} trailingIcon={RiArrowRightLine}>
            Podgląd użytkownika
          </LinkButton>
        )}
      />

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
          Nie udało się wczytać części podsumowania. Sprawdź dostęp do danych projektu Academy.
        </div>
      ) : null}

      <AdminStats metrics={[
        { icon: "stores", label: "Sklepy", value: String(storeCount), caption: "Lokalizacje Academy" },
        { icon: "users", label: "Konta", value: String(userCount), caption: `${learnerCount} użytkowników Akademii` },
        { icon: "invitations", label: "Oczekujące zaproszenia", value: String(invitationCount), caption: "Wysłane, jeszcze nieprzyjęte" },
      ]} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <section className="flex min-w-0 flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-caption-1-semibold uppercase tracking-[0.1em] text-text-tertiary">Widok Academy</p>
              <h2 className="text-title-3-semibold text-text-primary">Zobacz Akademię jako użytkownik</h2>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-800">
              <RiEyeLine className="size-5" aria-hidden />
            </span>
          </div>
          <p className="text-body-2-regular text-text-secondary">Przejdź przez moduły, lekcje i przykładową treść bez zapisywania postępów na koncie.</p>
          <LinkButton href="/admin/user-preview" variant="primary" trailingIcon={RiArrowRightLine} className="self-start">
            Otwórz podgląd
          </LinkButton>
        </section>

        <LeaderboardVisibilityForm
          enabled={settingsResult.error ? null : settingsResult.data?.leaderboard_enabled ?? null}
        />
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie panelu" />}>
      <AdminOverview />
    </Suspense>
  );
}
