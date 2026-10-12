"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import type { AdminActionState } from "@/lib/admin/action-state";
import { parseInviteInput, parseStoreInput } from "@/lib/admin/validation";
import { createAcademyAdminClient } from "@/lib/supabase/admin";
import { createAcademyServerClient } from "@/lib/supabase/server";

function error(message: string): AdminActionState {
  return { status: "error", message };
}

function success(message: string): AdminActionState {
  return { status: "success", message };
}

function getAcademySiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredUrl && process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required outside local development.");
  }

  const url = new URL(configuredUrl);
  const isLocalHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if ((!isLocalHttp && url.protocol !== "https:") || url.username || url.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS.");
  }
  return url.origin;
}

async function getAdminContext() {
  const profile = await getCurrentAcademyProfile();
  if (!profile || profile.role !== "admin") return null;
  return { profile, supabase: await createAcademyServerClient() };
}

export async function createStoreAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminContext();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");

  const parsed = parseStoreInput({
    name: formData.get("name"),
    streetAddress: formData.get("street_address"),
    city: formData.get("city"),
    postalCode: formData.get("postal_code"),
    countryCode: formData.get("country_code"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  });
  if (!parsed.ok) return error(parsed.error);

  const { error: insertError } = await access.supabase
    .from("stores")
    .insert(parsed.value);

  if (insertError) {
    return error("Nie udało się zapisać sklepu. Sprawdź dane i spróbuj ponownie.");
  }

  revalidatePath("/admin");
  return success("Sklep został dodany.");
}

export async function createUserInviteAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminContext();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return error("Brakuje serwerowego klucza Supabase Admin API.");
  }

  const parsed = parseInviteInput({
    email: formData.get("email"),
    role: formData.get("role"),
    storeId: formData.get("store_id"),
  });
  if (!parsed.ok) return error(parsed.error);

  let siteUrl: string;
  try {
    siteUrl = getAcademySiteUrl();
  } catch {
    return error("Ustaw adres aplikacji w NEXT_PUBLIC_SITE_URL.");
  }

  const { data: invite, error: insertError } = await access.supabase
    .from("user_invites")
    .insert({
      ...parsed.value,
      created_by: access.profile.id,
    })
    .select("id")
    .single();

  if (insertError || !invite) {
    return error(
      insertError?.code === "23505"
        ? "Dla tego adresu istnieje już aktywne zaproszenie."
        : "Nie udało się zapisać zaproszenia. Sprawdź adres i przypisany sklep.",
    );
  }

  const redirectTo = new URL("/auth/confirm", siteUrl);
  redirectTo.searchParams.set("next", "/change-password");

  try {
    const admin = createAcademyAdminClient();
    const { error: authError } = await admin.auth.admin.inviteUserByEmail(
      parsed.value.email,
      { redirectTo: redirectTo.toString() },
    );

    if (authError) {
      await access.supabase
        .from("user_invites")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", invite.id)
        .is("accepted_at", null);
      return error("Nie udało się wysłać zaproszenia. Sprawdź konfigurację SMTP Resend w Supabase Auth.");
    }
  } catch {
    await access.supabase
      .from("user_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", invite.id)
      .is("accepted_at", null);
    return error("Nie udało się wysłać zaproszenia. Sprawdź konfigurację Supabase Auth.");
  }

  revalidatePath("/admin");
  return success("Zaproszenie zostało wysłane.");
}
