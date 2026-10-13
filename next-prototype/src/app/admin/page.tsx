import { Suspense } from "react";
import { AcademyHeader } from "@/components/academy-header";
import { AcademyLoading } from "@/components/academy-loading";
import { LinkButton } from "@/components/base/buttons/link-button";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/base/table/table";
import { InviteForm, StoreForm } from "@/app/admin/admin-forms";
import { requireAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";

type StoreRow = {
  id: number;
  name: string;
  street_address: string;
  city: string;
  postal_code: string;
  country_code: string;
  is_active: boolean;
};

type ProfileRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: "admin" | "employee";
  store_id: number | null;
};

type InviteRow = {
  id: number;
  email: string;
  role: "admin" | "employee";
  store_id: number | null;
  created_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(new Date(value));
}

function displayName(profile: ProfileRow) {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return name || "Nieuzupełniony profil";
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-title-3-semibold text-text-primary">{title}</h2>
      <p className="text-body-2-regular text-text-secondary">{description}</p>
    </div>
  );
}

async function AdminDashboard() {
  const profile = await requireAcademyProfile();
  const supabase = await createAcademyServerClient();
  const [storesResult, profilesResult, invitesResult] = await Promise.all([
    supabase
      .from("stores")
      .select("id, name, street_address, city, postal_code, country_code, is_active")
      .order("city"),
    supabase
      .from("profiles")
      .select("id, email, first_name, last_name, role, store_id")
      .order("email"),
    supabase
      .from("user_invites")
      .select("id, email, role, store_id, created_at, accepted_at, revoked_at")
      .order("created_at", { ascending: false }),
  ]);

  const loadError = Boolean(storesResult.error || profilesResult.error || invitesResult.error);
  const stores = (storesResult.data ?? []) as StoreRow[];
  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const invites = (invitesResult.data ?? []) as InviteRow[];
  const storesById = new Map(stores.map((store) => [store.id, store]));
  const pendingInvites = invites.filter((invite) => !invite.accepted_at && !invite.revoked_at);

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-8">
        <header className="flex flex-col gap-2">
          <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">
            Xzone Academy · {profile.email}
          </p>
          <h1 className="font-display text-display-3-regular uppercase tracking-wide text-text-primary">
            Panel administratora
          </h1>
          <p className="max-w-3xl text-body-regular text-text-secondary">
            Zarządzaj sklepami, dostępem pracowników i administratorami.
          </p>
          <div className="mt-2 flex flex-wrap gap-4">
            <LinkButton href="/admin/courses">Zarządzaj szkoleniami</LinkButton>
            <LinkButton href="/admin/progress" variant="secondary">Postępy pracowników</LinkButton>
            <LinkButton href="/stores" variant="secondary">Mapa sklepów</LinkButton>
          </div>
        </header>

        {loadError ? (
          <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
            Nie udało się wczytać danych. Sprawdź, czy migracja została zastosowana w projekcie Academy.
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3" aria-label="Podsumowanie">
          {[
            { label: "Sklepy", value: stores.length },
            { label: "Pracownicy", value: profiles.filter((person) => person.role === "employee").length },
            { label: "Oczekujące zaproszenia", value: pendingInvites.length },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-2 rounded-3xl border border-border-button-default bg-background-primary-default p-5"
            >
              <span className="text-body-2-medium text-text-secondary">{item.label}</span>
              <span className="text-title-1-semibold text-text-primary">{item.value}</span>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
            <SectionHeading
              title="Dodaj sklep"
              description="Zapisz adres sklepu i opcjonalnie współrzędne do przyszłej mapy."
            />
            <StoreForm />
          </div>
          <div className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
            <SectionHeading
              title="Zaproszenia"
              description="Dodaj pracownika do sklepu albo zaproś kolejnego administratora."
            />
            <InviteForm
              stores={stores.map((store) => ({
                id: store.id,
                name: store.name,
                city: store.city,
              }))}
              defaultLanguage={profile.preferred_language}
            />
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
          <SectionHeading title="Sklepy" description="Adresy i stan sklepów w Akademii." />
          {stores.length ? (
            <Table aria-label="Sklepy" size="sm">
              <TableHeader>
                <TableColumn id="store" isRowHeader>Sklep</TableColumn>
                <TableColumn id="address">Adres</TableColumn>
                <TableColumn id="status">Status</TableColumn>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id} id={String(store.id)}>
                    <TableCell>{store.name}</TableCell>
                    <TableCell>
                      {store.street_address}, {store.postal_code} {store.city}, {store.country_code}
                    </TableCell>
                    <TableCell>{store.is_active ? "Aktywny" : "Nieaktywny"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-body-2-regular text-text-secondary">Nie dodano jeszcze sklepów.</p>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
          <SectionHeading title="Konta" description="Administratorzy i pracownicy przypisani do sklepów." />
          {profiles.length ? (
            <Table aria-label="Konta" size="sm">
              <TableHeader>
                <TableColumn id="name" isRowHeader>Imię i nazwisko</TableColumn>
                <TableColumn id="email">E-mail</TableColumn>
                <TableColumn id="role">Rola</TableColumn>
                <TableColumn id="store">Sklep</TableColumn>
              </TableHeader>
              <TableBody>
                {profiles.map((person) => {
                  const store = person.store_id ? storesById.get(person.store_id) : null;
                  return (
                    <TableRow key={person.id} id={person.id}>
                      <TableCell>{displayName(person)}</TableCell>
                      <TableCell>{person.email}</TableCell>
                      <TableCell>{person.role === "admin" ? "Administrator" : "Pracownik"}</TableCell>
                      <TableCell>{store ? store.name + " · " + store.city : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-body-2-regular text-text-secondary">Nie ma jeszcze kont w Akademii.</p>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
          <SectionHeading title="Zaproszenia" description="Stan zaproszeń wysłanych z panelu." />
          {invites.length ? (
            <Table aria-label="Zaproszenia" size="sm">
              <TableHeader>
                <TableColumn id="email" isRowHeader>E-mail</TableColumn>
                <TableColumn id="role">Rola</TableColumn>
                <TableColumn id="store">Sklep</TableColumn>
                <TableColumn id="status">Stan</TableColumn>
                <TableColumn id="created">Wysłano</TableColumn>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => {
                  const store = invite.store_id ? storesById.get(invite.store_id) : null;
                  const status = invite.accepted_at
                    ? "Przyjęte"
                    : invite.revoked_at
                      ? "Unieważnione"
                      : "Oczekujące";
                  return (
                    <TableRow key={invite.id} id={String(invite.id)}>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>{invite.role === "admin" ? "Administrator" : "Pracownik"}</TableCell>
                      <TableCell>{store ? store.name + " · " + store.city : "—"}</TableCell>
                      <TableCell>{status}</TableCell>
                      <TableCell>
                        <time dateTime={invite.created_at}>{formatDate(invite.created_at)}</time>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-body-2-regular text-text-secondary">Nie wysłano jeszcze zaproszeń.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie panelu" />}>
      <AdminDashboard />
    </Suspense>
  );
}
