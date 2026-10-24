"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import type { AdminActionState } from "@/lib/admin/action-state";
import {
  parseCourseInput,
  parseLanguageInput,
  parseLessonInput,
} from "@/lib/admin/content-validation";
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

function readSubmittedImagePath(formData: FormData, expectedPrefix: string, existingPath?: string | null) {
  const rawPath = formData.get("image_path");
  const imagePath = typeof rawPath === "string" ? rawPath.trim() : "";
  if (!imagePath) return { ok: true as const, imagePath: null };
  if (existingPath && imagePath === existingPath) return { ok: true as const, imagePath };
  const filename = imagePath.startsWith(`${expectedPrefix}/`) ? imagePath.slice(expectedPrefix.length + 1) : "";
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(filename)) return { ok: false as const, imagePath: null };
  return { ok: true as const, imagePath };
}

export async function addLanguageAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");

  const parsed = parseLanguageInput({
    code: formData.get("code"),
    name: formData.get("name"),
    nativeName: formData.get("native_name"),
  });
  if (!parsed.ok) return error(parsed.error);

  const { error: insertError } = await access.supabase
    .from("academy_languages")
    .insert({ ...parsed.value, sort_order: 100 });
  if (insertError) {
    return error(insertError.code === "23505" ? "Ten język jest już dodany." : "Nie udało się dodać języka.");
  }

  revalidatePath("/admin/courses");
  return success("Język został dodany.");
}

export async function createCourseAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");

  const parsed = parseCourseInput({
    slug: formData.get("slug"),
    languageCode: formData.get("language_code"),
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.ok) return error(parsed.error);

  const { data, error: createError } = await access.supabase.rpc("create_academy_course", {
    p_slug: parsed.value.slug,
    p_language_code: parsed.value.languageCode,
    p_title: parsed.value.title,
    p_description: parsed.value.description,
  });
  if (createError) {
    return error(createError.code === "23505" ? "Szkolenie o takim adresie już istnieje." : "Nie udało się utworzyć szkolenia.");
  }

  const createdCourseId = Number(Array.isArray(data) ? data[0]?.course_id : null);
  if (!Number.isSafeInteger(createdCourseId) || createdCourseId <= 0) {
    return error("Szkolenie powstało, ale nie udało się otworzyć jego programu. Wróć do biblioteki i otwórz je z listy.");
  }

  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${createdCourseId}`);
}

export async function ensureCourseDraftAction(courseId: number): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");
  if (!Number.isSafeInteger(courseId) || courseId <= 0) return error("Nieprawidłowe szkolenie.");

  const { data: course, error: courseError } = await access.supabase
    .from("courses")
    .select("id, published_version_id")
    .eq("id", courseId)
    .maybeSingle();
  if (courseError || !course) return error("Nie znaleziono szkolenia.");

  const { data: existingDraft, error: lookupError } = await access.supabase
    .from("course_versions")
    .select("id")
    .eq("course_id", courseId)
    .eq("status", "draft")
    .maybeSingle();
  if (lookupError) return error("Nie udało się sprawdzić wersji szkolenia.");
  if (existingDraft) {
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${courseId}`);
    return success("Szkic jest gotowy do edycji.");
  }
  if (!course.published_version_id) return error("Najpierw opublikuj szkolenie, aby przygotować jego szkic.");

  const { error: draftError } = await access.supabase.rpc("create_academy_course_draft", {
    p_course_id: courseId,
  });
  if (draftError) {
    if (draftError.code === "23505") {
      const { data: concurrentDraft } = await access.supabase
        .from("course_versions")
        .select("id")
        .eq("course_id", courseId)
        .eq("status", "draft")
        .maybeSingle();
      if (concurrentDraft) {
        revalidatePath("/admin/courses");
        revalidatePath(`/admin/courses/${courseId}`);
        return success("Szkic jest gotowy do edycji.");
      }
    }
    return error("Nie udało się przygotować szkicu. Spróbuj ponownie.");
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  return success("Szkic jest gotowy do edycji.");
}

export async function publishCourseAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");
  const courseId = positiveInteger(formData.get("course_id"));
  const versionId = positiveInteger(formData.get("version_id"));
  if (!courseId || !versionId) return error("Nieprawidłowa wersja szkolenia.");

  const { error: publishError } = await access.supabase.rpc("publish_academy_course", {
    p_course_id: courseId,
    p_version_id: versionId,
  });
  if (publishError) {
    const messages: Record<string, string> = {
      "The default course translation is required": "Uzupełnij tytuł szkolenia w jego języku domyślnym.",
      "Add at least one module before publishing": "Dodaj przynajmniej jeden moduł.",
      "Every module needs a title in the default language": "Uzupełnij tytuł każdego modułu w języku domyślnym.",
      "Add at least one lesson before publishing": "Dodaj przynajmniej jedną lekcję.",
      "Every lesson needs a title in the default language": "Uzupełnij tytuł każdej lekcji w języku domyślnym.",
    };
    return error(messages[publishError.message] ?? "Nie udało się opublikować szkolenia.");
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  return success("Opublikowano szkolenie. Poprzednia wersja została zachowana w archiwum.");
}

export async function setCourseVisibilityAction(
  courseId: number,
  isActive: boolean,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");
  if (!Number.isSafeInteger(courseId) || courseId <= 0 || typeof isActive !== "boolean") {
    return error("Nieprawidłowe ustawienie widoczności szkolenia.");
  }

  const { error: updateError } = await access.supabase.rpc("set_academy_course_active", {
    p_course_id: courseId,
    p_is_active: isActive,
  });
  if (updateError) {
    return error(updateError.message.includes("must be published")
      ? "Najpierw opublikuj szkolenie."
      : "Nie udało się zmienić widoczności szkolenia.");
  }

  revalidatePath("/admin/courses");
  revalidatePath("/learning");
  revalidatePath("/admin/user-preview/learning");
  return success(isActive ? "Szkolenie jest teraz aktywne." : "Szkolenie zostało ukryte przed użytkownikami.");
}

export async function createModuleAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");
  const versionId = positiveInteger(formData.get("version_id"));
  const languageCode = String(formData.get("language_code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  if (!versionId || !languageCode || !title || title.length > 160 || summary.length > 500) {
    return error("Podaj tytuł modułu (maksymalnie 160 znaków) i krótkie podsumowanie.");
  }

  const { data: version } = await access.supabase
    .from("course_versions")
    .select("id, course_id, status")
    .eq("id", versionId)
    .maybeSingle();
  if (!version || version.status !== "draft") return error("Moduły można zmieniać tylko w szkicu.");

  const { data: existing } = await access.supabase
    .from("course_modules")
    .select("sort_order")
    .eq("course_version_id", versionId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;
  const { data: module, error: insertError } = await access.supabase
    .from("course_modules")
    .insert({ course_version_id: versionId, sort_order: sortOrder })
    .select("id")
    .single();
  if (insertError || !module) return error("Nie udało się dodać modułu.");

  const { error: translationError } = await access.supabase
    .from("module_translations")
    .insert({ module_id: module.id, language_code: languageCode, title, summary });
  if (translationError) {
    await access.supabase.from("course_modules").delete().eq("id", module.id);
    return error("Nie udało się zapisać tłumaczenia modułu.");
  }

  revalidatePath(`/admin/courses/${version.course_id}`);
  return { status: "success", message: "Moduł został dodany.", entityId: module.id };
}

export async function saveCourseTranslationAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");
  const courseId = positiveInteger(formData.get("course_id"));
  const versionId = positiveInteger(formData.get("version_id"));
  const languageCode = String(formData.get("language_code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!courseId || !versionId || !languageCode || !title || title.length > 160 || description.length > 2000) {
    return error("Podaj tytuł do 160 znaków i opis do 2000 znaków.");
  }

  const { data: version } = await access.supabase
    .from("course_versions")
    .select("course_id, status")
    .eq("id", versionId)
    .maybeSingle();
  if (!version || version.course_id !== courseId || version.status !== "draft") {
    return error("Tłumaczenie można zmieniać tylko w szkicu tego szkolenia.");
  }
  const { data: currentTranslation } = await access.supabase
    .from("course_translations")
    .select("image_path")
    .eq("course_version_id", versionId)
    .eq("language_code", languageCode)
    .maybeSingle();
  const submittedImage = readSubmittedImagePath(
    formData,
    `courses/${courseId}/versions/${versionId}/translations/course/${courseId}/${languageCode}`,
    currentTranslation?.image_path,
  );
  if (!submittedImage.ok) return error("Wybierz grafikę ponownie przed zapisaniem.");

  const { error: saveError } = await access.supabase
    .from("course_translations")
    .upsert(
      { course_version_id: versionId, language_code: languageCode, title, description, image_path: submittedImage.imagePath },
      { onConflict: "course_version_id,language_code" },
    );
  if (saveError) return error("Nie udało się zapisać tłumaczenia szkolenia.");

  revalidatePath(`/admin/courses/${courseId}`);
  return success("Tłumaczenie szkolenia zostało zapisane.");
}

export async function saveModuleTranslationAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");
  const moduleId = positiveInteger(formData.get("module_id"));
  const languageCode = String(formData.get("language_code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  if (!moduleId || !languageCode || !title || title.length > 160 || summary.length > 500) {
    return error("Podaj tytuł modułu do 160 znaków i podsumowanie do 500 znaków.");
  }

  const { data: module } = await access.supabase
    .from("course_modules")
    .select("course_version_id")
    .eq("id", moduleId)
    .maybeSingle();
  if (!module) return error("Nie znaleziono modułu.");
  const { data: version } = await access.supabase
    .from("course_versions")
    .select("course_id, status")
    .eq("id", module.course_version_id)
    .maybeSingle();
  if (!version || version.status !== "draft") return error("Moduły można zmieniać tylko w szkicu.");

  const { data: currentTranslation } = await access.supabase
    .from("module_translations")
    .select("image_path")
    .eq("module_id", moduleId)
    .eq("language_code", languageCode)
    .maybeSingle();
  const submittedImage = readSubmittedImagePath(
    formData,
    `courses/${version.course_id}/versions/${module.course_version_id}/translations/module/${moduleId}/${languageCode}`,
    currentTranslation?.image_path,
  );
  if (!submittedImage.ok) return error("Wybierz grafikę ponownie przed zapisaniem.");

  const { error: saveError } = await access.supabase
    .from("module_translations")
    .upsert({ module_id: moduleId, language_code: languageCode, title, summary, image_path: submittedImage.imagePath }, { onConflict: "module_id,language_code" });
  if (saveError) return error("Nie udało się zapisać tłumaczenia modułu.");

  revalidatePath(`/admin/courses/${version.course_id}`);
  return success("Tłumaczenie modułu zostało zapisane.");
}

export async function createLessonAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");
  const moduleId = positiveInteger(formData.get("module_id"));
  if (!moduleId) return error("Nieprawidłowy moduł.");

  const parsed = parseLessonInput({
    languageCode: formData.get("language_code"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    youtubeUrls: formData.get("youtube_urls") ?? formData.get("youtube_url"),
    contentJson: formData.get("content_json"),
    productBullets: formData.get("product_bullets"),
    keyPointsTitle: formData.get("key_points_title"),
    conversationTitle: formData.get("conversation_title"),
    conversationJson: formData.get("conversation_json"),
  });
  if (!parsed.ok) return error(parsed.error);

  const { data: module } = await access.supabase
    .from("course_modules")
    .select("id, course_version_id")
    .eq("id", moduleId)
    .maybeSingle();
  if (!module) return error("Nie znaleziono modułu.");
  const { data: version } = await access.supabase
    .from("course_versions")
    .select("course_id, status")
    .eq("id", module.course_version_id)
    .maybeSingle();
  if (!version || version.status !== "draft") return error("Lekcje można zmieniać tylko w szkicu.");

  const submittedImage = readSubmittedImagePath(
    formData,
    `courses/${version.course_id}/versions/${module.course_version_id}/translations/lesson/${moduleId}/${parsed.value.languageCode}`,
  );
  if (!submittedImage.ok) return error("Wybierz grafikę ponownie przed zapisaniem.");

  const { data: existing } = await access.supabase
    .from("course_lessons")
    .select("sort_order")
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;
  const { data: lesson, error: insertError } = await access.supabase
    .from("course_lessons")
    .insert({ module_id: moduleId, sort_order: sortOrder })
    .select("id")
    .single();
  if (insertError || !lesson) return error("Nie udało się dodać lekcji.");

  const { error: translationError } = await access.supabase
    .from("lesson_translations")
    .insert({
      lesson_id: lesson.id,
      language_code: parsed.value.languageCode,
      title: parsed.value.title,
      summary: parsed.value.summary,
      youtube_video_id: parsed.value.youtubeVideoId,
      youtube_video_ids: parsed.value.youtubeVideoIds,
      content: parsed.value.content,
      product_bullets: parsed.value.productBullets,
      key_points_title: parsed.value.keyPointsTitle,
      conversation_title: parsed.value.conversationTitle,
      conversation: parsed.value.conversation,
      image_path: submittedImage.imagePath,
    });
  if (translationError) {
    await access.supabase.from("course_lessons").delete().eq("id", lesson.id);
    return error("Nie udało się zapisać tłumaczenia lekcji.");
  }

  revalidatePath(`/admin/courses/${version.course_id}`);
  return { status: "success", message: "Lekcja została dodana.", entityId: lesson.id };
}

export async function saveLessonTranslationAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");
  const lessonId = positiveInteger(formData.get("lesson_id"));
  if (!lessonId) return error("Nieprawidłowa lekcja.");

  const parsed = parseLessonInput({
    languageCode: formData.get("language_code"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    youtubeUrls: formData.get("youtube_urls") ?? formData.get("youtube_url"),
    contentJson: formData.get("content_json"),
    productBullets: formData.get("product_bullets"),
    keyPointsTitle: formData.get("key_points_title"),
    conversationTitle: formData.get("conversation_title"),
    conversationJson: formData.get("conversation_json"),
  });
  if (!parsed.ok) return error(parsed.error);

  const { data: lesson } = await access.supabase
    .from("course_lessons")
    .select("module_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return error("Nie znaleziono lekcji.");
  const { data: module } = await access.supabase
    .from("course_modules")
    .select("course_version_id")
    .eq("id", lesson.module_id)
    .maybeSingle();
  const { data: version } = module
    ? await access.supabase.from("course_versions").select("course_id, status").eq("id", module.course_version_id).maybeSingle()
    : { data: null };
  if (!module || !version || version.status !== "draft") return error("Lekcje można zmieniać tylko w szkicu.");

  const { data: currentTranslation } = await access.supabase
    .from("lesson_translations")
    .select("image_path")
    .eq("lesson_id", lessonId)
    .eq("language_code", parsed.value.languageCode)
    .maybeSingle();
  const submittedImage = readSubmittedImagePath(
    formData,
    `courses/${version.course_id}/versions/${module.course_version_id}/translations/lesson/${lesson.module_id}/${parsed.value.languageCode}`,
    currentTranslation?.image_path,
  );
  if (!submittedImage.ok) return error("Wybierz grafikę ponownie przed zapisaniem.");

  const { error: saveError } = await access.supabase
    .from("lesson_translations")
    .upsert({
      lesson_id: lessonId,
      language_code: parsed.value.languageCode,
      title: parsed.value.title,
      summary: parsed.value.summary,
      youtube_video_id: parsed.value.youtubeVideoId,
      youtube_video_ids: parsed.value.youtubeVideoIds,
      content: parsed.value.content,
      product_bullets: parsed.value.productBullets,
      key_points_title: parsed.value.keyPointsTitle,
      conversation_title: parsed.value.conversationTitle,
      conversation: parsed.value.conversation,
      image_path: submittedImage.imagePath,
    }, { onConflict: "lesson_id,language_code" });
  if (saveError) return error("Nie udało się zapisać tłumaczenia lekcji.");

  revalidatePath(`/admin/courses/${version.course_id}`);
  return success("Tłumaczenie lekcji zostało zapisane.");
}

function parseOrderedIds(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  const ids = value.split(",").map((item) => Number(item));
  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0) || new Set(ids).size !== ids.length) return null;
  return ids;
}

export async function reorderModulesAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");
  const versionId = positiveInteger(formData.get("version_id"));
  const moduleIds = parseOrderedIds(formData.get("item_ids"));
  if (!versionId || !moduleIds) return error("Nieprawidłowa kolejność modułów.");

  const { error: reorderError } = await access.supabase.rpc("reorder_academy_modules", {
    p_course_version_id: versionId,
    p_module_ids: moduleIds,
  });
  if (reorderError) return error("Nie udało się zapisać kolejności modułów.");
  revalidatePath(`/admin/courses`);
  const { data: version } = await access.supabase
    .from("course_versions")
    .select("course_id")
    .eq("id", versionId)
    .maybeSingle();
  if (version) revalidatePath(`/admin/courses/${version.course_id}`);
  return success("Kolejność modułów została zapisana.");
}

export async function reorderLessonsAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminAccess();
  if (!access) return error("Ta operacja wymaga uprawnień administratora.");
  const moduleId = positiveInteger(formData.get("module_id"));
  const lessonIds = parseOrderedIds(formData.get("item_ids"));
  if (!moduleId || !lessonIds) return error("Nieprawidłowa kolejność lekcji.");

  const { error: reorderError } = await access.supabase.rpc("reorder_academy_lessons", {
    p_module_id: moduleId,
    p_lesson_ids: lessonIds,
  });
  if (reorderError) return error("Nie udało się zapisać kolejności lekcji.");
  const { data: module } = await access.supabase
    .from("course_modules")
    .select("course_version_id")
    .eq("id", moduleId)
    .maybeSingle();
  const { data: version } = module
    ? await access.supabase.from("course_versions").select("course_id").eq("id", module.course_version_id).maybeSingle()
    : { data: null };
  if (version) revalidatePath(`/admin/courses/${version.course_id}`);
  return success("Kolejność lekcji została zapisana.");
}
