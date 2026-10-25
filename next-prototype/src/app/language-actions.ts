"use server";

import { cookies } from "next/headers";
import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";

const STANDARD_LANGUAGES = ["pl", "en", "de", "cs", "fr", "it"];

export async function readAcademyViewerContextAction(): Promise<{
  preferredLanguage: string | null;
  previewLanguage: string | null;
  role: "admin" | "employee" | null;
}> {
  try {
    const profile = await getCurrentAcademyProfile();
    const previewLanguage = (await cookies()).get("xzone-academy-preview-language")?.value ?? null;
    return {
      preferredLanguage: profile?.preferred_language ?? null,
      previewLanguage,
      role: profile?.role ?? null,
    };
  } catch {
    return { preferredLanguage: null, previewLanguage: null, role: null };
  }
}

export async function updatePreferredLanguageAction(value: unknown): Promise<boolean> {
  if (typeof value !== "string" || !STANDARD_LANGUAGES.includes(value)) return false;
  const profile = await getCurrentAcademyProfile();
  if (!profile) return false;

  try {
    const supabase = await createAcademyServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({ preferred_language: value })
      .eq("id", profile.id);
    return !error;
  } catch {
    return false;
  }
}

export async function updateAcademyPreviewLanguageAction(value: unknown): Promise<boolean> {
  if (typeof value !== "string" || !STANDARD_LANGUAGES.includes(value)) return false;

  try {
    const cookieStore = await cookies();
    cookieStore.set("xzone-academy-preview-language", value, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/admin/user-preview",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return true;
  } catch {
    return false;
  }
}
