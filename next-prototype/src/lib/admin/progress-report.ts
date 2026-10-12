import "server-only";

import { requireAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";

export type AdminProgressRow = {
  employeeEmail: string;
  employeeName: string;
  storeId: number;
  storeName: string;
  storeCity: string;
  courseSlug: string;
  courseTitle: string;
  moduleId: number;
  moduleTitle: string;
  completedLessonCount: number;
  lessonCount: number;
  passedQuizCount: number;
  quizAttemptCount: number;
  latestQuizScore: number | null;
  lastActivityAt: string | null;
};

export type AdminProgressRead =
  | { status: "ok"; data: AdminProgressRow[]; adminEmail: string }
  | { status: "error" }
  | { status: "forbidden" };

function readSafeInteger(value: unknown, minimum = 0): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum ? parsed : null;
}

function readRow(value: Record<string, unknown>): AdminProgressRow | null {
  const storeId = readSafeInteger(value.store_id, 1);
  const moduleId = readSafeInteger(value.module_id, 1);
  const completedLessonCount = readSafeInteger(value.completed_lesson_count);
  const lessonCount = readSafeInteger(value.lesson_count);
  const passedQuizCount = readSafeInteger(value.passed_quiz_count);
  const quizAttemptCount = readSafeInteger(value.quiz_attempt_count);
  const latestQuizScore = value.latest_quiz_score === null
    ? null
    : readSafeInteger(value.latest_quiz_score);

  if (
    storeId === null
    || moduleId === null
    || completedLessonCount === null
    || lessonCount === null
    || passedQuizCount === null
    || quizAttemptCount === null
    || completedLessonCount > lessonCount
    || (latestQuizScore !== null && (latestQuizScore < 0 || latestQuizScore > 100))
    || typeof value.employee_email !== "string"
    || typeof value.employee_name !== "string"
    || typeof value.store_name !== "string"
    || typeof value.store_city !== "string"
    || typeof value.course_slug !== "string"
    || typeof value.course_title !== "string"
    || typeof value.module_title !== "string"
    || (value.last_activity_at !== null && typeof value.last_activity_at !== "string")
  ) {
    return null;
  }

  return {
    employeeEmail: value.employee_email,
    employeeName: value.employee_name,
    storeId,
    storeName: value.store_name,
    storeCity: value.store_city,
    courseSlug: value.course_slug,
    courseTitle: value.course_title,
    moduleId,
    moduleTitle: value.module_title,
    completedLessonCount,
    lessonCount,
    passedQuizCount,
    quizAttemptCount,
    latestQuizScore,
    lastActivityAt: value.last_activity_at,
  };
}

export async function readAdminProgress(): Promise<AdminProgressRead> {
  try {
    const profile = await requireAcademyProfile();
    if (profile.role !== "admin") return { status: "forbidden" };

    const supabase = await createAcademyServerClient();
    const { data, error } = await supabase.rpc("read_academy_admin_progress");
    if (error || !Array.isArray(data)) return { status: "error" };

    const rows: AdminProgressRow[] = [];
    for (const value of data as Array<Record<string, unknown>>) {
      const row = readRow(value);
      if (!row) return { status: "error" };
      rows.push(row);
    }

    return { status: "ok", data: rows, adminEmail: profile.email };
  } catch {
    return { status: "error" };
  }
}
