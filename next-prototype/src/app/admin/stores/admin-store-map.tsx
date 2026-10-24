"use client";

import { useState, type FormEvent } from "react";
import { RiSearchLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { StoreMap } from "@/app/(academy)/stores/store-map";
import type { StoreDirectoryEntry } from "@/lib/academy/store-directory";
import type { GeocodedLocation } from "@/lib/maps/geocoding-types";

export function AdminStoreMap({ stores }: { stores: StoreDirectoryEntry[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeocodedLocation | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  async function searchAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) {
      setError("Wpisz co najmniej 3 znaki, na przykład ulicę i miasto.");
      setMessage("");
      return;
    }

    setIsSearching(true);
    setError("");
    setMessage("");
    setResults([]);
    setSelectedLocation(null);

    try {
      const response = await fetch(`/api/admin/store-geocode?q=${encodeURIComponent(normalizedQuery)}`, {
        headers: { Accept: "application/json" },
      });
      const payload = await response.json() as { results?: GeocodedLocation[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Nie udało się wyszukać adresu.");

      const nextResults = Array.isArray(payload.results) ? payload.results : [];
      setResults(nextResults);
      setSelectedLocation(nextResults[0] ?? null);
      if (nextResults.length === 0) {
        setMessage("Nie znaleziono tego adresu. Spróbuj dodać kod pocztowy lub kraj.");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nie udało się wyszukać adresu.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <form onSubmit={searchAddress} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Input
          label="Szukaj adresu lub miejsca"
          value={query}
          onChange={setQuery}
          placeholder="Ulica, miasto, kod pocztowy lub miejsce"
          autoComplete="street-address"
          isDisabled={isSearching}
        />
        <Button type="submit" leadingIcon={RiSearchLine} disabled={isSearching || query.trim().length < 3}>
          {isSearching ? "Wyszukiwanie…" : "Pokaż na mapie"}
        </Button>
      </form>

      {error ? <p role="alert" className="text-body-2-medium text-text-error-primary">{error}</p> : null}
      {message ? <p role="status" className="text-body-2-regular text-text-secondary">{message}</p> : null}
      {results.length > 1 ? (
        <div className="flex flex-col gap-2" aria-label="Wyniki wyszukiwania adresu">
          <p className="text-caption-1-semibold text-text-secondary">Wyniki OpenStreetMap — wybierz lokalizację:</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  aria-pressed={selectedLocation?.id === result.id}
                  onClick={() => setSelectedLocation(result)}
                  className="h-full w-full rounded-xl border border-border-button-default bg-background-primary-default p-3 text-left text-body-2-regular text-text-primary outline-none transition-colors hover:border-border-button-hover hover:bg-background-secondary-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring aria-pressed:border-accent-500 aria-pressed:bg-accent-50"
                >
                  {result.displayName}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <StoreMap
        stores={stores}
        showEmployees={false}
        fitStores={false}
        searchLocation={selectedLocation}
      />
    </div>
  );
}
