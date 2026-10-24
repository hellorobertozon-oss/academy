import { Suspense } from "react";
import { AcademyLoading } from "@/components/academy-loading";
import { StoreForm } from "@/app/admin/admin-forms";
import { AdminCard, AdminPageHeading } from "@/app/admin/admin-ui";
import { AdminStats } from "@/app/admin/admin-stats";
import { StoreTable, type AdminStoreRow } from "@/app/admin/stores/store-table";
import { AdminStoreMap } from "@/app/admin/stores/admin-store-map";
import type { StoreDirectoryEntry } from "@/lib/academy/store-directory";
import { requireAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";

async function StoresContent() {
  await requireAcademyProfile();
  const supabase = await createAcademyServerClient();
  const { data, error } = await supabase
    .from("stores")
    .select("id, name, street_address, city, postal_code, country_code, is_active, latitude, longitude")
    .order("city")
    .order("name");
  const stores = (data ?? []) as AdminStoreRow[];
  const activeStoreCount = stores.filter((store) => store.is_active).length;
  const mappedStoreCount = stores.filter((store) => store.latitude !== null && store.longitude !== null).length;
  const mapStores: StoreDirectoryEntry[] = stores.map((store) => ({
    id: store.id,
    name: store.name,
    streetAddress: store.street_address,
    city: store.city,
    postalCode: store.postal_code,
    countryCode: store.country_code,
    latitude: store.latitude,
    longitude: store.longitude,
    isActive: store.is_active,
    employeeNames: [],
  }));

  return (
    <>
      <AdminPageHeading
        title="Sklepy"
        description="Wyszukuj miejsca na mapie i zarządzaj lokalizacjami sklepów."
        action={<div id="new-store" className="scroll-mt-6"><StoreForm /></div>}
      />

      {error ? (
        <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
          Nie udało się wczytać sklepów.
        </div>
      ) : null}

      <AdminStats metrics={[
        { icon: "stores", label: "Wszystkie sklepy", value: String(stores.length), caption: "Lokalizacje Academy" },
        { icon: "stores", label: "Aktywne", value: String(activeStoreCount), caption: "Dostępne użytkownikom" },
        { icon: "stores", label: "Na mapie", value: String(mappedStoreCount), caption: "Mają współrzędne" },
      ]} />

      <AdminCard title="Mapa sklepów">
        <AdminStoreMap stores={mapStores} />
      </AdminCard>

      <AdminCard title="Lokalizacje Academy" description={`${stores.length} sklepów · ${activeStoreCount} aktywnych`}>
        <StoreTable stores={stores} />
      </AdminCard>
    </>
  );
}

export default function AdminStoresPage() {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie sklepów" />}>
      <StoresContent />
    </Suspense>
  );
}
