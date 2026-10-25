"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/base/table/table";
import { Input } from "@/components/base/input/input";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Select, SelectItem } from "@/components/base/select/select";
import { AcademyHeader } from "@/components/academy-header";
import { useAcademy } from "@/components/academy-provider";
import { StoreMap } from "@/app/(academy)/stores/store-map";
import type { StoreDirectoryEntry } from "@/lib/academy/store-directory";

type FilterOption = { id: string; label: string };

function FilterSelect({
  label,
  allLabel,
  selectedKey,
  onSelectionChange,
  options,
}: {
  label: string;
  allLabel: string;
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  options: FilterOption[];
}) {
  return (
    <Select
      aria-label={label}
      selectedKey={selectedKey}
      onSelectionChange={(key) => onSelectionChange(key === null ? "all" : String(key))}
      className="min-w-48"
    >
      <SelectItem id="all">{allLabel}</SelectItem>
      {options.map((option) => (
        <SelectItem key={option.id} id={option.id}>{option.label}</SelectItem>
      ))}
    </Select>
  );
}

function countryName(code: string, locale: string) {
  return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
}

export function StoreDirectory({
  stores,
  viewerRole,
  hasError,
}: {
  stores: StoreDirectoryEntry[];
  viewerRole: "admin" | "employee";
  hasError: boolean;
}) {
  const { language, t } = useAcademy();
  const locale = { pl: "pl-PL", en: "en-US", de: "de-DE", cs: "cs-CZ", fr: "fr-FR", it: "it-IT" }[language];
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const countryOptions = useMemo(() => [...new Set(stores.map((store) => store.countryCode))]
    .sort((first, second) => countryName(first, locale).localeCompare(countryName(second, locale), language))
    .map((code) => ({ id: code, label: countryName(code, locale) })), [language, locale, stores]);

  const cityOptions = useMemo(() => {
    const unique = new Map<string, string>();
    stores
      .filter((store) => countryFilter === "all" || store.countryCode === countryFilter)
      .forEach((store) => unique.set(JSON.stringify([store.countryCode, store.city]), store.city));
    return [...unique]
      .sort((first, second) => first[1].localeCompare(second[1], language))
      .map(([id, label]) => ({ id, label }));
  }, [countryFilter, language, stores]);

  const filteredStores = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(locale);
    return stores.filter((store) => {
      const matchesSearch = !normalizedSearch || [
        store.name,
        store.streetAddress,
        store.city,
        store.postalCode,
        countryName(store.countryCode, locale),
        ...store.employeeNames,
      ].some((value) => value.toLocaleLowerCase(locale).includes(normalizedSearch));
      const matchesCity = cityFilter === "all"
        || cityFilter === JSON.stringify([store.countryCode, store.city]);
      return matchesSearch
        && (countryFilter === "all" || store.countryCode === countryFilter)
        && matchesCity;
    });
  }, [cityFilter, countryFilter, locale, search, stores]);

  const mappedStoreCount = filteredStores.filter((store) => store.latitude !== null && store.longitude !== null).length;
  const backHref = viewerRole === "admin" ? "/admin" : "/dashboard";
  const backLabel = viewerRole === "admin" ? t("backToAdmin") : t("backToDashboard");

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-8">
        <header className="flex flex-col gap-2">
          <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">{t("brand")}</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-display-3-regular uppercase tracking-wide text-text-primary">
                {t("storesPageTitle")}
              </h1>
              <p className="mt-2 max-w-3xl text-body-regular text-text-secondary">
                {t(viewerRole === "admin" ? "storesPageAdminDescription" : "storesPageEmployeeDescription")}
              </p>
            </div>
            <LinkButton href={backHref} variant="secondary">{backLabel}</LinkButton>
          </div>
        </header>

        {hasError ? (
          <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
            {t("storeDirectoryError")}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-4 sm:p-6">
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <h2 className="text-title-3-semibold text-text-primary">{t("mapTitle")}</h2>
                  <p className="text-body-2-regular text-text-secondary">
                    {t("mapCoordinateCount")
                      .replace("{mapped}", String(mappedStoreCount))
                      .replace("{total}", String(filteredStores.length))}
                  </p>
                </div>
              </header>
              {mappedStoreCount ? (
                <StoreMap stores={filteredStores} />
              ) : (
                <div className="flex min-h-64 items-center justify-center rounded-2xl border border-separator-border bg-background-secondary-default p-6 text-center text-body-regular text-text-secondary">
                  {filteredStores.length
                    ? t("mapMissingCoordinates")
                    : t("noFilteredStores")}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-4 sm:p-6">
              <header className="flex flex-col gap-1">
                <h2 className="text-title-3-semibold text-text-primary">{t("storesListTitle")}</h2>
                <p className="text-body-2-regular text-text-secondary">
                  {t(viewerRole === "admin" ? "storesListAdminDescription" : "storesListEmployeeDescription")}
                </p>
              </header>

              <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(180px,0.45fr)_minmax(180px,0.45fr)]">
                <Input
                  label={t("storeSearchLabel")}
                  value={search}
                  onChange={setSearch}
                  placeholder={t("storeSearchPlaceholder")}
                />
                <FilterSelect
                  label={t("filterCountry")}
                  allLabel={t("allLocations")}
                  selectedKey={countryFilter}
                  onSelectionChange={(key) => {
                    setCountryFilter(key);
                    setCityFilter("all");
                  }}
                  options={countryOptions}
                />
                <FilterSelect
                  label={t("filterCity")}
                  allLabel={t("allLocations")}
                  selectedKey={cityFilter}
                  onSelectionChange={setCityFilter}
                  options={cityOptions}
                />
              </div>

              {filteredStores.length ? (
                <Table aria-label={t("storesListTitle")} size="sm">
                  <TableHeader>
                    <TableColumn id="store" isRowHeader>{t("storeColumn")}</TableColumn>
                    <TableColumn id="address">{t("addressColumn")}</TableColumn>
                    <TableColumn id="employees">{t("employeesColumn")}</TableColumn>
                    <TableColumn id="status">{t("storeStatusColumn")}</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {filteredStores.map((store) => (
                      <TableRow key={store.id} id={String(store.id)}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-body-medium text-text-primary">{store.name}</span>
                            <span className="text-caption-1-regular text-text-secondary">
                              {store.city} · {countryName(store.countryCode, locale)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{store.streetAddress}, {store.postalCode} {store.city}</TableCell>
                        <TableCell>
                          {store.employeeNames.length
                            ? store.employeeNames.join(", ")
                            : t("noAssignedEmployees")}
                        </TableCell>
                        <TableCell>{t(store.isActive ? "activeStore" : "inactiveStore")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="rounded-2xl border border-separator-border p-6 text-body-regular text-text-secondary">
                  {stores.length ? t("noFilteredStores") : t("noStoresAvailable")}
                </p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
