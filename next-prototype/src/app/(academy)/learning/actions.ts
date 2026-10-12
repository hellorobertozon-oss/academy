"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";

export type CompleteLessonResult =
  | { status: "success"; newlyCompleted: boolean; pointsAwarded: number }
  | { status: "error" };

export async function completeLessonAction(value: unknown): Promise<CompleteLessonResult> {
  const profile = await getCurrentAcademyProfile();
  if (!profile || profile.role !== "employee") return { status: "error" };
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    return { status: "error" };
  }

  try {
    const supabase = await createAcademyServerClient();
    const { data, error } = await supabase.rpc("complete_academy_lesson", { p_lesson_id: value });
    if (error || !Array.isArray(data) || !data[0]) return { status: "error" };

    const completion = data[0] as { newly_completed?: unknown; points_awarded?: unknown };
    if (
      typeof completion.newly_completed !== "boolean"
      || !Number.isSafeInteger(Number(completion.points_awarded))
    ) {
      return { status: "error" };
    }

    revalidatePath("/learning", "layout");
    revalidatePath("/rewards");
    return {
      status: "success",
      newlyCompleted: completion.newly_completed,
      pointsAwarded: Number(completion.points_awarded),
    };
  } catch {
    return { status: "error" };
  }
}
