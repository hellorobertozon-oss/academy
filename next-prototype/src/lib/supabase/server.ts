import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAcademySupabaseConfig } from "@/lib/supabase/config";

export async function createAcademyServerClient() {
  const config = getAcademySupabaseConfig();
  if (!config) {
    throw new Error("Academy authentication is not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookieOptions: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The proxy refreshes them.
        }
      },
    },
  });
}

