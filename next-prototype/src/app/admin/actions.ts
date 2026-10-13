"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import type { AdminActionState } from "@/lib/admin/action-state";
import { parseInviteInput, parseStoreInput } from "@/lib/admin/validation";
import { isAcademyEmailConfigured, sendAcademyInvitationEmail } from "@/lib/email/send-invitation";
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

async function revokePendingInvite(
  supabase: Awaited<ReturnType<typeof createAcademyServerClient>>,
  inviteId: number,
) {
  try {
    const { data, error: revokeError } = await supabase
      .from("user_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", inviteId)
      .is("accepted_at", null)
      .select("id");

    return !revokeError && data?.length === 1;
  } catch {
    return false;
  }
}

async function deleteUnconfirmedAuthUser(
  admin: ReturnType<typeof createAcademyAdminClient>,
  userId: string | null,
  emailConfirmedAt: string | null,
) {
  if (!userId || emailConfirmedAt) return true;

  try {
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    return !deleteError;
  } catch {
    return false;
  }
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
    preferredLanguage: formData.get("preferred_language"),
  });
  if (!parsed.ok) return error(parsed.error);
  if (!isAcademyEmailConfigured()) {
    return error("Uzupełnij konfigurację Resend, aby wysyłać zaproszenia.");
  }

  let siteUrl: string;
  try {
    siteUrl = getAcademySiteUrl();
  } catch {
    return error("Ustaw adres aplikacji w NEXT_PUBLIC_SITE_URL.");
  }

  let admin: ReturnType<typeof createAcademyAdminClient>;
  try {
    admin = createAcademyAdminClient();
  } catch {
    return error("Sprawdź serwerową konfigurację Supabase Admin API.");
  }

  const { email, role, store_id, preferred_language } = parsed.value;
  const { data: invite, error: insertError } = await access.supabase
    .from("user_invites")
    .insert({
      email,
      role,
      store_id,
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

  let actionLink: string | null = null;
  let generatedUserId: string | null = null;
  let generatedUserEmailConfirmed: string | null = null;
  try {
    const { data: generatedInvite, error: linkError } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: redirectTo.toString(),
        data: { preferred_language },
      },
    });

    if (generatedInvite?.user) {
      generatedUserId = generatedInvite.user.id;
      generatedUserEmailConfirmed = generatedInvite.user.email_confirmed_at ?? null;
    }
    if (!linkError && generatedInvite?.properties?.action_link) {
      actionLink = generatedInvite.properties.action_link;
    }
  } catch {
    actionLink = null;
  }

  if (!actionLink || !generatedUserId) {
    const userDeleted = await deleteUnconfirmedAuthUser(
      admin,
      generatedUserId,
      generatedUserEmailConfirmed,
    );
    const inviteRevoked = await revokePendingInvite(access.supabase, invite.id);
    revalidatePath("/admin");

    if (!userDeleted || !inviteRevoked) {
      return error("Nie udało się przygotować zaproszenia. Sprawdź status konta i zaproszenia w panelu.");
    }

    return error("Nie udało się przygotować zaproszenia. Sprawdź konfigurację Supabase Auth.");
  }

  const emailResult = await sendAcademyInvitationEmail({
    to: email,
    actionLink,
    language: preferred_language,
  });

  if (!emailResult.ok) {
    const userDeleted = await deleteUnconfirmedAuthUser(
      admin,
      generatedUserId,
      generatedUserEmailConfirmed,
    );
    const inviteRevoked = await revokePendingInvite(access.supabase, invite.id);
    revalidatePath("/admin");

    if (!userDeleted || !inviteRevoked) {
      return error("Wysyłka nie powiodła się. Sprawdź status konta i zaproszenia w panelu.");
    }

    return error(
      emailResult.reason === "configuration"
        ? "Uzupełnij konfigurację Resend, aby wysyłać zaproszenia."
        : "Resend nie wysłał zaproszenia. Sprawdź konfigurację adresu nadawcy.",
    );
  }

  revalidatePath("/admin");
  return success("Zaproszenie zostało wysłane.");
}
