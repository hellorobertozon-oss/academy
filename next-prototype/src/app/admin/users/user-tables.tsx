"use client";

import { useMemo, useState } from "react";
import { RiGroupLine, RiSearchLine } from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badge";
import { InputBase } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/base/table/table";

export type AdminProfileRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: "admin" | "employee";
  store_id: number | null;
};

export type AdminInviteRow = {
  id: number;
  email: string;
  role: "admin" | "employee";
  store_id: number | null;
  created_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

type StoreOption = { id: number; name: string; city: string };

function displayName(profile: AdminProfileRow) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Nieuzupełniony profil";
}

function initials(profile: AdminProfileRow) {
  return [profile.first_name, profile.last_name]
    .filter((part): part is string => Boolean(part))
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";
}

function storeName(storeId: number | null, storesById: Map<number, StoreOption>) {
  if (!storeId) return "—";
  const store = storesById.get(storeId);
  return store ? `${store.name} · ${store.city}` : "—";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(new Date(value));
}

export function UserAccountsTable({ profiles, stores }: { profiles: AdminProfileRow[]; stores: StoreOption[] }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const storesById = useMemo(() => new Map(stores.map((store) => [store.id, store])), [stores]);
  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pl-PL");
    return profiles.filter((profile) => {
      const matchesRole = roleFilter === "all" || profile.role === roleFilter;
      const searchableText = `${displayName(profile)} ${profile.email} ${storeName(profile.store_id, storesById)}`.toLocaleLowerCase("pl-PL");
      return matchesRole && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [profiles, query, roleFilter, storesById]);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-body-medium text-text-primary">Wszystkie konta</p>
          <p className="text-caption-1-regular text-text-secondary">{filteredProfiles.length} z {profiles.length} kont</p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <InputBase
            aria-label="Szukaj użytkowników"
            placeholder="Szukaj po nazwisku lub e-mailu"
            leadingIcon={RiSearchLine}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            fieldClassName="min-w-0 bg-background-primary-default sm:w-64"
          />
          <Select aria-label="Filtruj po roli" selectedKey={roleFilter} onSelectionChange={(key) => setRoleFilter(String(key))}>
            <SelectItem id="all">Wszystkie role</SelectItem>
            <SelectItem id="employee">Użytkownik</SelectItem>
            <SelectItem id="admin">Administrator</SelectItem>
          </Select>
        </div>
      </div>

      {filteredProfiles.length ? (
        <Table aria-label="Użytkownicy Academy" size="md">
          <TableHeader>
            <TableColumn id="name" isRowHeader>Użytkownik</TableColumn>
            <TableColumn id="email">E-mail</TableColumn>
            <TableColumn id="role">Rola</TableColumn>
            <TableColumn id="store">Sklep</TableColumn>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((profile) => (
              <TableRow key={profile.id} id={profile.id}>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="sm" color={profile.role === "admin" ? "blue" : "neutral"} initials={initials(profile)} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-body-medium text-text-primary">{displayName(profile)}</span>
                      <span className="truncate text-caption-1-regular text-text-tertiary">ID · {profile.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell><span className="text-body-2-regular text-text-secondary">{profile.email}</span></TableCell>
                <TableCell><Badge color={profile.role === "admin" ? "primary" : "neutral"}>{profile.role === "admin" ? "Administrator" : "Użytkownik"}</Badge></TableCell>
                <TableCell><span className="text-body-2-regular text-text-secondary">{storeName(profile.store_id, storesById)}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-button-default bg-background-secondary-default px-6 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-background-primary-default text-foreground-icon-secondary">
            <RiGroupLine className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-body-medium text-text-primary">{profiles.length ? "Brak wyników" : "Nie ma jeszcze kont"}</p>
            <p className="text-body-2-regular text-text-secondary">{profiles.length ? "Zmień wyszukiwanie lub filtr roli." : "Wyślij pierwsze zaproszenie, aby dodać użytkownika do Akademii."}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function UserInvitesTable({ invites, stores }: { invites: AdminInviteRow[]; stores: StoreOption[] }) {
  const storesById = new Map(stores.map((store) => [store.id, store]));
  if (!invites.length) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border-button-default bg-background-secondary-default p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background-primary-default text-foreground-icon-secondary">
          <RiGroupLine className="size-5" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-body-medium text-text-primary">Brak zaproszeń</p>
          <p className="text-body-2-regular text-text-secondary">Nowe zaproszenia pojawią się tutaj wraz ze swoim statusem.</p>
        </div>
      </div>
    );
  }

  return (
    <Table aria-label="Zaproszenia do Akademii" size="md">
      <TableHeader>
        <TableColumn id="email" isRowHeader>E-mail</TableColumn>
        <TableColumn id="role">Rola</TableColumn>
        <TableColumn id="store">Sklep</TableColumn>
        <TableColumn id="status">Stan</TableColumn>
        <TableColumn id="created">Wysłano</TableColumn>
      </TableHeader>
      <TableBody>
        {invites.map((invite) => {
          const accepted = Boolean(invite.accepted_at);
          const revoked = !accepted && Boolean(invite.revoked_at);
          const status = accepted ? "Przyjęte" : revoked ? "Unieważnione" : "Oczekujące";
          return (
            <TableRow key={invite.id} id={String(invite.id)}>
              <TableCell><span className="text-body-medium text-text-primary">{invite.email}</span></TableCell>
              <TableCell><Badge color={invite.role === "admin" ? "primary" : "neutral"}>{invite.role === "admin" ? "Administrator" : "Użytkownik"}</Badge></TableCell>
              <TableCell><span className="text-body-2-regular text-text-secondary">{storeName(invite.store_id, storesById)}</span></TableCell>
              <TableCell><Badge color={accepted ? "primary" : "neutral"}>{status}</Badge></TableCell>
              <TableCell><time className="whitespace-nowrap text-body-2-regular text-text-secondary" dateTime={invite.created_at}>{formatDate(invite.created_at)}</time></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
