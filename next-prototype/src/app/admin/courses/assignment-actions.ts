"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import type { AdminActionState } from "@/lib/admin/action-state";
import { createAcademyServerClient } from "@/lib/supabase/server";

function error(message: string): AdminActionState {
  return { status: "error", message };
}

function success(message: string): AdminActionState {
  return { status: "success", message };
}

async function getAdminAccess() {
  const profile = await getCurrentAcademyProfile();
  if (!profile || profile.role !== "admin") return null;
  return { profile, supabase: await createAcademyServerClient() };
}

function positiveInteger(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function coursePath(courseId: number) {
  return `/admin/courses/${courseId}`;
}

export async function assignCourseToStoreAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnie\u0144 administratora.");

  const courseId = positiveInteger(formData.get("course_id"));
  const storeId = positiveInteger(formData.get("store_id"));
  if (!courseId || !storeId) return error("Wybierz szkolenie i aktywny sklep.");

  const { data: course } = await access.supabase
    .from("courses")
    .select("id, published_version_id")
    .eq("id", courseId)
    .maybeSingle();
  if (!course?.published_version_id) return error("Najpierw opublikuj szkolenie.");

  const { data: store } = await access.supabase
    .from("stores")
    .select("id, is_active")
    .eq("id", storeId)
    .maybeSingle();
  if (!store?.is_active) return error("Mo\u017Cesz wybra\u0107 tylko aktywny sklep.");

  const { error: assignmentError } = await access.supabase
    .from("course_assignments")
    .insert({ course_id: courseId, store_id: storeId, assigned_by: access.profile.id });
  if (assignmentError) {
    return error(assignmentError.code === "23505"
      ? "To szkolenie jest ju\u017C przypisane do tego sklepu."
      : "Nie uda\u0142o si\u0119 przypisa\u0107 szkolenia.");
  }

  revalidatePath(coursePath(courseId));
  return success("Szkolenie przypisano do sklepu.");
}

export async function assignCourseToEmployeeAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnie\u0144 administratora.");

  const courseId = positiveInteger(formData.get("course_id"));
  const profileId = formData.get("profile_id");
  if (!courseId || typeof profileId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) {
    return error("Wybierz pracownika.");
  }

  const { data: course } = await access.supabase
    .from("courses")
    .select("id, published_version_id")
    .eq("id", courseId)
    .maybeSingle();
  if (!course?.published_version_id) return error("Najpierw opublikuj szkolenie.");

  const { data: employee } = await access.supabase
    .from("profiles")
    .select("id, role")
    .eq("id", profileId)
    .eq("role", "employee")
    .maybeSingle();
  if (!employee) return error("Nie znaleziono pracownika.");

  const { error: assignmentError } = await access.supabase
    .from("course_assignments")
    .insert({ course_id: courseId, profile_id: employee.id, assigned_by: access.profile.id });
  if (assignmentError) {
    return error(assignmentError.code === "23505"
      ? "To szkolenie jest ju\u017C przypisane temu pracownikowi."
      : "Nie uda\u0142o si\u0119 przypisa\u0107 szkolenia.");
  }

  revalidatePath(coursePath(courseId));
  return success("Szkolenie przypisano pracownikowi.");
}

export async function removeCourseAssignmentAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnie\u0144 administratora.");

  const courseId = positiveInteger(formData.get("course_id"));
  const assignmentId = positiveInteger(formData.get("assignment_id"));
  if (!courseId || !assignmentId) return error("Nieprawid\u0142owe przypisanie.");

  const { data: removedAssignment, error: removeError } = await access.supabase
    .from("course_assignments")
    .delete()
    .eq("id", assignmentId)
    .eq("course_id", courseId)
    .select("id")
    .maybeSingle();
  if (removeError || !removedAssignment) return error("Nie uda\u0142o si\u0119 usun\u0105\u0107 przypisania.");

  revalidatePath(coursePath(courseId));
  return success("Przypisanie zosta\u0142o usuni\u0119te.");
}
