"use server";

import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";

const STANDARD_LANGUAGES = ["pl", "en", "de", "cs"];

export async function readPreferredLanguageAction(): Promise<string | null> {
  try {
    const profile = await getCurrentAcademyProfile();
    return profile?.preferred_language ?? null;
  } catch {
    return null;
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
