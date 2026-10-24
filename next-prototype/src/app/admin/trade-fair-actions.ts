"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import type { AdminActionState } from "@/lib/admin/action-state";
import { createAcademyServerClient } from "@/lib/supabase/server";

const ALLOWED_TIME_LIMITS = new Set([30, 60, 90, 120, 150, 180, 240, 300, 600]);

function isAllowedImageUrl(value: string) {
  if (value.startsWith("/assets/") && !value.startsWith("//") && !value.includes("..") && !value.includes("\\")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

export async function updateTradeFairSettingsAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const profile = await getCurrentAcademyProfile();
  if (!profile || profile.role !== "admin") {
    return { status: "error", message: "not_admin" };
  }

  const enabled = formData.get("enabled") === "on";
  const timeLimitSeconds = Number(formData.get("timeLimitSeconds"));
  const prizeType = formData.get("prizeType");
  const prizeName = String(formData.get("prizeName") ?? "").trim();
  const prizeImageUrl = String(formData.get("prizeImageUrl") ?? "").trim();
  const privacyNoticeUrl = String(formData.get("privacyNoticeUrl") ?? "").trim();

  if (
    !ALLOWED_TIME_LIMITS.has(timeLimitSeconds) ||
    (prizeType !== "gel" && prizeType !== "sticker") ||
    prizeName.length < 1 || prizeName.length > 100 ||
    prizeImageUrl.length > 1000 || !isAllowedImageUrl(prizeImageUrl) ||
    privacyNoticeUrl.length > 1000 || !isHttpsUrl(privacyNoticeUrl)
  ) {
    return { status: "error", message: "invalid_value" };
  }

  try {
    const supabase = await createAcademyServerClient();
    const { data, error } = await supabase
      .from("academy_settings")
      .update({
        trade_fair_memory_enabled: enabled,
        trade_fair_memory_time_limit_seconds: timeLimitSeconds,
        trade_fair_prize_type: prizeType,
        trade_fair_prize_name: prizeName,
        trade_fair_prize_image_url: prizeImageUrl,
        trade_fair_privacy_notice_url: privacyNoticeUrl,
      })
      .eq("id", true)
      .select("id")
      .maybeSingle();

    if (error || !data) return { status: "error", message: "save_failed" };
  } catch {
    return { status: "error", message: "save_failed" };
  }

  revalidatePath("/admin/trade-fair");
  revalidatePath("/targi");
  return { status: "success", message: "saved" };
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}
