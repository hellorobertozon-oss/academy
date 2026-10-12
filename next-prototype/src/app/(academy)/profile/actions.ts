"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import type { ProfileActionMessage, ProfileActionState } from "@/lib/profile/action-state";
import { parseOwnProfileInput } from "@/lib/profile/validation";
import { createAcademyServerClient } from "@/lib/supabase/server";

const VALIDATION_MESSAGES: Record<"required" | "too-long" | "invalid", ProfileActionMessage> = {
  required: "profileNameRequired",
  "too-long": "profileNameTooLong",
  invalid: "profileNameInvalid",
};

export async function updateOwnProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const profile = await getCurrentAcademyProfile();
  if (!profile) return { status: "error", message: "profileAuthError" };

  const parsed = parseOwnProfileInput({
    firstName: formData.get("first_name"),
    lastName: formData.get("last_name"),
  });
  if (!parsed.ok) {
    const message = VALIDATION_MESSAGES[parsed.reason];
    return { status: "error", message };
  }

  try {
    const supabase = await createAcademyServerClient();
    const { error } = await supabase
      .from("profiles")
      .update(parsed.value)
      .eq("id", profile.id);

    if (error) return { status: "error", message: "profileSaveError" };

    revalidatePath("/profile");
    revalidatePath("/admin");
    revalidatePath("/admin/progress");
    revalidatePath("/rewards");
    revalidatePath("/stores");
    return { status: "success", message: "profileSaveSuccess" };
  } catch {
    return { status: "error", message: "profileSaveError" };
  }
}
