"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import type { AdminActionState } from "@/lib/admin/action-state";
import { createAcademyServerClient } from "@/lib/supabase/server";

export async function updateLeaderboardVisibilityAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const requestedValue = formData.get("enabled");
  if (requestedValue !== "true" && requestedValue !== "false") {
    return { status: "error", message: "invalid_value" };
  }

  const profile = await getCurrentAcademyProfile();
  if (!profile || profile.role !== "admin") {
    return { status: "error", message: "not_admin" };
  }

  try {
    const supabase = await createAcademyServerClient();
    const enabled = requestedValue === "true";
    const { data, error } = await supabase
      .from("academy_settings")
      .update({ leaderboard_enabled: enabled })
      .eq("id", true)
      .select("leaderboard_enabled")
      .maybeSingle();

    if (error || data?.leaderboard_enabled !== enabled) {
      return { status: "error", message: "save_failed" };
    }
  } catch {
    return { status: "error", message: "save_failed" };
  }

  revalidatePath("/admin");
  revalidatePath("/rewards");
  return { status: "success", message: "saved" };
}
