"use client";

import { useMemo, useState } from "react";
import { RiMapPin2Line, RiSearchLine } from "@remixicon/react";
import { Badge } from "@/components/base/badges/badge";
import { InputBase } from "@/components/base/input/input";
import { LinkButton } from "@/components/base/buttons/link-button";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/base/table/table";

export type AdminStoreRow = {
  id: number;
  name: string;
  street_address: string;
  city: string;
  postal_code: string;
  country_code: string;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
};

export function StoreTable({ stores }: { stores: AdminStoreRow[] }) {
  const [query, setQuery] = useState("");
  const filteredStores = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pl-PL");
    return stores.filter((store) =>
      `${store.name} ${store.street_address} ${store.city} ${store.postal_code} ${store.country_code}`
        .toLocaleLowerCase("pl-PL")
        .includes(normalizedQuery),
    );
  }, [query, stores]);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-body-medium text-text-primary">Katalog sklepów</p>
          <p className="text-caption-1-regular text-text-secondary">{filteredStores.length} z {stores.length} lokalizacji</p>
        </div>
        <InputBase
          aria-label="Szukaj sklepu"
          placeholder="Miasto, nazwa lub adres"
          leadingIcon={RiSearchLine}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          fieldClassName="min-w-0 bg-background-secondary-default sm:w-72"
        />
      </div>

      {filteredStores.length ? (
        <Table aria-label="Sklepy Academy" size="md">
          <TableHeader>
            <TableColumn id="store" isRowHeader>Sklep</TableColumn>
            <TableColumn id="address">Adres</TableColumn>
            <TableColumn id="status">Status</TableColumn>
          </TableHeader>
          <TableBody>
            {filteredStores.map((store) => {
              return (
                <TableRow key={store.id} id={String(store.id)}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background-secondary-default text-foreground-icon-secondary">
                        <RiMapPin2Line className="size-4" aria-hidden />
                      </span>
                      <span className="truncate text-body-medium text-text-primary">{store.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-body-2-regular text-text-primary">{store.street_address}</span>
                      <span className="text-caption-1-regular text-text-secondary">{store.postal_code} {store.city} · {store.country_code}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge color={store.is_active ? "primary" : "neutral"}>{store.is_active ? "Aktywny" : "Nieaktywny"}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-button-default bg-background-secondary-default px-6 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-background-primary-default text-foreground-icon-secondary">
            <RiMapPin2Line className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-body-medium text-text-primary">{stores.length ? "Nie znaleziono sklepów" : "Dodaj pierwszą lokalizację"}</p>
            <p className="max-w-md text-body-2-regular text-text-secondary">{stores.length ? "Zmień wyszukiwanie albo sprawdź pisownię nazwy i miasta." : "Lokalizacje pozwalają przypisywać konta i pomagają użytkownikom odnaleźć zespół."}</p>
          </div>
          {!stores.length ? <LinkButton href="/admin/stores#new-store" variant="secondary">Dodaj sklep</LinkButton> : null}
        </div>
      )}
    </div>
  );
}
