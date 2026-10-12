"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import type { AdminActionState } from "@/lib/admin/action-state";
import { parseQuizEditorContent } from "@/lib/admin/quiz-validation";
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
  return { supabase: await createAcademyServerClient() };
}

function positiveInteger(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function getCourseIdForVersion(supabase: Awaited<ReturnType<typeof createAcademyServerClient>>, versionId: number) {
  const { data } = await supabase.from("course_versions").select("course_id").eq("id", versionId).maybeSingle();
  return data?.course_id as number | undefined;
}

export async function createQuizAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");

  const versionId = positiveInteger(formData.get("course_version_id"));
  const targetType = formData.get("target_type");
  const targetId = positiveInteger(formData.get("target_id"));
  if (!versionId || !targetId || (targetType !== "module" && targetType !== "lesson")) {
    return error("Wybierz moduł albo lekcję dla quizu.");
  }

  const { data: version } = await access.supabase
    .from("course_versions")
    .select("id, course_id, status")
    .eq("id", versionId)
    .eq("status", "draft")
    .maybeSingle();
  if (!version) return error("Quiz można dodać tylko do szkicu szkolenia.");

  const targetTable = targetType === "module" ? "course_modules" : "course_lessons";
  const { data: target } = await access.supabase
    .from(targetTable)
    .select(targetType === "module" ? "id, course_version_id" : "id, module_id")
    .eq("id", targetId)
    .maybeSingle();
  if (!target) return error("Nie znaleziono wybranego modułu lub lekcji.");

  let targetVersionId: number | null = null;
  if (targetType === "module") {
    targetVersionId = (target as { course_version_id: number }).course_version_id;
  } else {
    const moduleId = (target as { module_id: number }).module_id;
    const { data: module } = await access.supabase
      .from("course_modules")
      .select("course_version_id")
      .eq("id", moduleId)
      .maybeSingle();
    targetVersionId = module?.course_version_id ?? null;
  }
  if (targetVersionId !== versionId) return error("Moduł lub lekcja nie należy do tego szkicu.");

  const { error: insertError } = await access.supabase
    .from("quizzes")
    .insert({
      course_version_id: versionId,
      module_id: targetType === "module" ? targetId : null,
      lesson_id: targetType === "lesson" ? targetId : null,
    });
  if (insertError) {
    return error(insertError.code === "23505" ? "Ten moduł lub lekcja ma już quiz." : "Nie udało się dodać quizu.");
  }

  revalidatePath(`/admin/courses/${version.course_id}`);
  return success("Quiz został dodany. Uzupełnij tytuł, pytania i odpowiedzi.");
}

export async function saveQuizContentAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");

  const quizId = positiveInteger(formData.get("quiz_id"));
  const languageCode = formData.get("language_code");
  const title = formData.get("title");
  const instructions = formData.get("instructions");
  const questionsJson = formData.get("questions_json");
  if (
    !quizId
    || typeof languageCode !== "string"
    || typeof title !== "string"
    || typeof instructions !== "string"
    || typeof questionsJson !== "string"
    || questionsJson.length > 100_000
  ) {
    return error("Nieprawidłowe dane quizu.");
  }

  let rawQuestions: unknown;
  try {
    rawQuestions = JSON.parse(questionsJson) as unknown;
  } catch {
    return error("Treść pytań ma nieprawidłowy format.");
  }
  const parsedQuestions = parseQuizEditorContent(rawQuestions);
  if (!parsedQuestions.ok) return error(parsedQuestions.error);
  if (!title.trim() || title.trim().length > 160 || instructions.length > 2000) {
    return error("Tytuł może mieć do 160 znaków, a instrukcja do 2000 znaków.");
  }
  if (!/^[a-z]{2,12}$/i.test(languageCode)) return error("Nieprawidłowy język quizu.");

  const { data: quiz } = await access.supabase
    .from("quizzes")
    .select("course_version_id")
    .eq("id", quizId)
    .maybeSingle();
  if (!quiz) return error("Nie znaleziono quizu.");
  const courseId = await getCourseIdForVersion(access.supabase, quiz.course_version_id);

  const { error: saveError } = await access.supabase.rpc("save_academy_quiz_content", {
    p_quiz_id: quizId,
    p_language_code: languageCode,
    p_title: title.trim(),
    p_instructions: instructions.trim(),
    p_questions: parsedQuestions.value,
  });
  if (saveError) {
    return error(saveError.code === "42501"
      ? "Quiz można edytować tylko w szkicu."
      : "Nie udało się zapisać quizu. Sprawdź, czy każde pytanie ma 2–6 odpowiedzi i jedną poprawną odpowiedź w języku domyślnym.");
  }

  if (courseId) revalidatePath(`/admin/courses/${courseId}`);
  return success("Quiz został zapisany.");
}
