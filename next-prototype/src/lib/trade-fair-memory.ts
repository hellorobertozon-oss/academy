export type TradeFairMemorySettings = {
  enabled: boolean;
  timeLimitSeconds: number;
  prizeType: "gel" | "sticker";
  prizeName: string;
  prizeImageUrl: string;
  privacyNoticeUrl: string;
};

export const DEFAULT_TRADE_FAIR_MEMORY_SETTINGS: TradeFairMemorySettings = {
  enabled: false,
  timeLimitSeconds: 120,
  prizeType: "gel",
  prizeName: "Xzone Helmet Cleaning Gel",
  prizeImageUrl: "/assets/xzone-products/Helmet_Cleaning_Gel_01.webp",
  privacyNoticeUrl: "https://xzone24.com/privacy-policy-and-cookies/",
};

export function parseTradeFairMemorySettings(value: unknown): TradeFairMemorySettings {
  if (!value || typeof value !== "object") return DEFAULT_TRADE_FAIR_MEMORY_SETTINGS;
  const row = value as Record<string, unknown>;
  const prizeType = row.trade_fair_prize_type === "sticker" ? "sticker" : "gel";
  const timeLimitSeconds = Number(row.trade_fair_memory_time_limit_seconds);

  return {
    enabled: row.trade_fair_memory_enabled === true,
    timeLimitSeconds: Number.isInteger(timeLimitSeconds) && timeLimitSeconds >= 30 && timeLimitSeconds <= 600
      ? timeLimitSeconds
      : DEFAULT_TRADE_FAIR_MEMORY_SETTINGS.timeLimitSeconds,
    prizeType,
    prizeName: typeof row.trade_fair_prize_name === "string" && row.trade_fair_prize_name.trim()
      ? row.trade_fair_prize_name.trim()
      : DEFAULT_TRADE_FAIR_MEMORY_SETTINGS.prizeName,
    prizeImageUrl: typeof row.trade_fair_prize_image_url === "string" && row.trade_fair_prize_image_url.trim()
      ? row.trade_fair_prize_image_url.trim()
      : DEFAULT_TRADE_FAIR_MEMORY_SETTINGS.prizeImageUrl,
    privacyNoticeUrl: typeof row.trade_fair_privacy_notice_url === "string" && row.trade_fair_privacy_notice_url.trim()
      ? row.trade_fair_privacy_notice_url.trim()
      : DEFAULT_TRADE_FAIR_MEMORY_SETTINGS.privacyNoticeUrl,
  };
}
