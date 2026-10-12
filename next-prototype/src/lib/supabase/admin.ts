import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAcademySupabaseConfig } from "@/lib/supabase/config";

export function createAcademyAdminClient() {
  const config = getAcademySupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!config || !serviceRoleKey) {
    throw new Error(
      "Set the Academy Supabase URL, publishable key, and server-only service role key.",
    );
  }

  return createSupabaseClient(config.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

