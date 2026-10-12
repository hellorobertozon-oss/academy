import "server-only";

import { requireAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";

export type StoreDirectoryEntry = {
  id: number;
  name: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  employeeNames: string[];
};

export type StoreDirectoryRead =
  | { status: "ok"; stores: StoreDirectoryEntry[]; viewerRole: "admin" | "employee" }
  | { status: "error"; viewerRole: "admin" | "employee" };

function safeInteger(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function coordinate(value: unknown, minimum: number, maximum: number): number | null | undefined {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) return undefined;
  return value;
}

export async function readAcademyStoreDirectory(): Promise<StoreDirectoryRead> {
  const profile = await requireAcademyProfile();
  try {
    const supabase = await createAcademyServerClient();
    const { data, error } = await supabase.rpc("read_academy_store_directory");
    if (error || !Array.isArray(data)) return { status: "error", viewerRole: profile.role };

    const stores = new Map<number, StoreDirectoryEntry>();
    for (const value of data as Array<Record<string, unknown>>) {
      const id = safeInteger(value.store_id);
      const latitude = coordinate(value.latitude, -90, 90);
      const longitude = coordinate(value.longitude, -180, 180);
      if (
        id === null
        || latitude === undefined
        || longitude === undefined
        || (latitude === null) !== (longitude === null)
        || typeof value.store_name !== "string"
        || typeof value.street_address !== "string"
        || typeof value.city !== "string"
        || typeof value.postal_code !== "string"
        || typeof value.country_code !== "string"
        || !/^[A-Z]{2}$/.test(value.country_code)
        || typeof value.is_active !== "boolean"
        || (value.employee_name !== null && typeof value.employee_name !== "string")
      ) {
        return { status: "error", viewerRole: profile.role };
      }

      let store = stores.get(id);
      if (!store) {
        store = {
          id,
          name: value.store_name,
          streetAddress: value.street_address,
          city: value.city,
          postalCode: value.postal_code,
          countryCode: value.country_code,
          latitude,
          longitude,
          isActive: value.is_active,
          employeeNames: [],
        };
        stores.set(id, store);
      } else if (
        store.name !== value.store_name
        || store.streetAddress !== value.street_address
        || store.city !== value.city
        || store.postalCode !== value.postal_code
        || store.countryCode !== value.country_code
        || store.latitude !== latitude
        || store.longitude !== longitude
        || store.isActive !== value.is_active
      ) {
        return { status: "error", viewerRole: profile.role };
      }

      if (typeof value.employee_name === "string") store.employeeNames.push(value.employee_name);
    }

    return { status: "ok", stores: [...stores.values()], viewerRole: profile.role };
  } catch {
    return { status: "error", viewerRole: profile.role };
  }
}
