"use server";

import { createAcademyServerClient } from "@/lib/supabase/server";

export type TradeFairEntryResult = { ok: true } | { ok: false; message: "invalid" | "save_failed" };

export async function submitTradeFairMemoryEntry(input: {
  email: string;
  language: "en" | "it";
  privacyAcknowledged: boolean;
}): Promise<TradeFairEntryResult> {
  if (!input || typeof input !== "object") return { ok: false, message: "invalid" };
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (
    input.privacyAcknowledged !== true ||
    !["en", "it"].includes(input.language) ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { ok: false, message: "invalid" };
  }

  try {
    const supabase = await createAcademyServerClient();
    const { error } = await supabase.from("trade_fair_memory_entries").insert({
      email,
      language: input.language,
      privacy_acknowledged: true,
    });
    if (error) return { ok: false, message: "save_failed" };
    return { ok: true };
  } catch {
    return { ok: false, message: "save_failed" };
  }
}
