"use server";

import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";

export async function updatePreferredLanguageAction(value: unknown): Promise<boolean> {
  if (value !== "pl" && value !== "en") return false;
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
