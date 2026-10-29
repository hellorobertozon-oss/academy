import { TRADE_FAIR_PRODUCT_VIDEOS, type TradeFairProductVideo } from "@/lib/trade-fair-catalog-content";

// Temporary mapping for the current 36-lesson course order. The lesson numbers are 1-based.
// YouTube IDs stay stored in lesson_translations; the display flag is kept in a small shared config.

const PRODUCT_IDS_BY_LESSON_NUMBER: Partial<Record<number, readonly string[]>> = {
  2: ["helmet-cleaning-gel", "helmet-detailer", "helmet-cleaning-gel-mini"],
  4: [
    "interior-refresher-man",
    "interior-refresher-woman",
    "interior-refresher-neptun",
    "freshener-orange-spritz",
    "helmet-freshener-mint",
    "helmet-interior-care",
  ],
  5: ["helmet-care-kit", "helmet-care-trip-kit"],
  8: ["leather-cleaner", "leather-cleaning-brush"],
  9: ["leather-care-balm"],
  10: ["leather-care-kit"],
  13: ["textile-care-kit", "washing-booster-active-oxygen"],
  14: ["fabric-protect-freshness-extender"],
  15: ["active-care-sportswear-wash", "active-care-sportswear-sachet"],
  17: ["jeans-care-liquid", "jeans-care-sachet"],
  20: ["magic-gloves-cleaner"],
  21: ["zip-service-agent"],
  23: ["wash-and-ride-cleaner"],
  24: ["power-powder-moto-wash"],
  25: ["power-powder-bug-killer", "power-powder-wheelixir"],
  26: ["motorcycle-ceramic-detailer"],
  27: [
    "premium-microfiber",
    "evolon-detailing-cloths",
    "motorcycle-detailing-soft-brush",
    "fiber-hand",
    "wheel-brush",
    "chain-brush",
  ],
};

export function getTradeFairVideosForLesson(courseSlug: string, lessonNumber: number): TradeFairProductVideo[] {
  if (courseSlug !== "pielegnacja-i-sprzedaz-produktow-xzone") return [];

  return (PRODUCT_IDS_BY_LESSON_NUMBER[lessonNumber] ?? []).flatMap(
    (productId) => TRADE_FAIR_PRODUCT_VIDEOS[productId] ?? [],
  );
}
