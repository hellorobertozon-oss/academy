"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getAcademySupabaseConfig } from "@/lib/supabase/config";

export function createAcademyBrowserClient() {
  const config = getAcademySupabaseConfig();
  if (!config) {
    throw new Error("Academy authentication is not configured.");
  }

  return createBrowserClient(config.url, config.publishableKey, {
    cookieOptions: {
      sameSite: "none",
      secure: true,
    },
  });
}

