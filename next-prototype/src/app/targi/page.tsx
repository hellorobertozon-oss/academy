import type { Metadata } from "next";
import { TradeFairShowcase } from "@/components/pages/trade-fair-showcase";
import { TRADE_FAIR_PRODUCTS } from "@/lib/trade-fair-products";
import {
  DEFAULT_TRADE_FAIR_MEMORY_SETTINGS,
  parseTradeFairMemorySettings,
} from "@/lib/trade-fair-memory";
import { createAcademyServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Xzone products | Xzone Academy",
  description: "Explore the Xzone product collection in English and Italian.",
};

export default async function TradeFairPage() {
  let memorySettings = DEFAULT_TRADE_FAIR_MEMORY_SETTINGS;

  try {
    const supabase = await createAcademyServerClient();
    const { data } = await supabase
      .from("academy_settings")
      .select("trade_fair_memory_enabled, trade_fair_memory_time_limit_seconds, trade_fair_prize_type, trade_fair_prize_name, trade_fair_prize_image_url, trade_fair_privacy_notice_url")
      .maybeSingle();
    memorySettings = parseTradeFairMemorySettings(data);
  } catch {
    // Keep the product catalog available if the optional game configuration is unavailable.
  }

  return <TradeFairShowcase products={TRADE_FAIR_PRODUCTS} memorySettings={memorySettings} />;
}
