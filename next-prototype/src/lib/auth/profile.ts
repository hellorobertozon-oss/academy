import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createAcademyServerClient } from "@/lib/supabase/server";

export type AcademyRole = "admin" | "employee";
export type AcademyProfile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: AcademyRole;
  store_id: number | null;
  preferred_language: "pl" | "en" | "de" | "cs" | "fr" | "it";
};

export const getCurrentAcademyProfile = cache(async (): Promise<AcademyProfile | null> => {
  try {
    const supabase = await createAcademyServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, role, store_id, preferred_language")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data as AcademyProfile;
  } catch {
    return null;
  }
});

export async function requireAcademyProfile(): Promise<AcademyProfile> {
  await connection();
  const profile = await getCurrentAcademyProfile();
  if (!profile) redirect("/login?reason=profile");
  return profile;
}
