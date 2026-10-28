"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import { isLearningQuizUnlocked } from "@/lib/academy/quizzes";
import { createAcademyServerClient } from "@/lib/supabase/server";

export type QuizAttemptResult = {
  attemptNumber: number;
  correctCount: number;
  questionCount: number;
  scorePercentage: number;
  passed: boolean;
  pointsAwarded: number;
};

export type SubmitQuizResult =
  | { status: "success"; attempt: QuizAttemptResult }
  | { status: "error" };

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export async function submitQuizAction(value: unknown): Promise<SubmitQuizResult> {
  const profile = await getCurrentAcademyProfile();
  if (!profile || profile.role !== "employee") return { status: "error" };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { status: "error" };

  const submission = value as { quizId?: unknown; answers?: unknown };
  if (
    !isPositiveInteger(submission.quizId)
    || !Array.isArray(submission.answers)
    || submission.answers.length < 1
    || submission.answers.length > 100
  ) {
    return { status: "error" };
  }

  const answers: Array<{ question_id: number; option_id: number }> = [];
  const questionIds = new Set<number>();
  for (const item of submission.answers) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return { status: "error" };
    const answer = item as { questionId?: unknown; optionId?: unknown };
    if (!isPositiveInteger(answer.questionId) || !isPositiveInteger(answer.optionId) || questionIds.has(answer.questionId)) {
      return { status: "error" };
    }
    questionIds.add(answer.questionId);
    answers.push({ question_id: answer.questionId, option_id: answer.optionId });
  }

  try {
    if (!await isLearningQuizUnlocked(submission.quizId)) return { status: "error" };
    const supabase = await createAcademyServerClient();
    const { data, error } = await supabase.rpc("submit_academy_quiz", {
      p_quiz_id: submission.quizId,
      p_answers: answers,
    });
    if (error || !Array.isArray(data) || !data[0]) return { status: "error" };

    const row = data[0] as Record<string, unknown>;
    if (typeof row.passed !== "boolean") return { status: "error" };
    const attempt = {
      attemptNumber: Number(row.attempt_number),
      correctCount: Number(row.correct_count),
      questionCount: Number(row.question_count),
      scorePercentage: Number(row.score_percentage),
      passed: row.passed,
      pointsAwarded: Number(row.points_awarded),
    };
    if (
      !Number.isSafeInteger(attempt.attemptNumber)
      || !Number.isSafeInteger(attempt.correctCount)
      || !Number.isSafeInteger(attempt.questionCount)
      || !Number.isSafeInteger(attempt.scorePercentage)
      || !Number.isSafeInteger(attempt.pointsAwarded)
    ) {
      return { status: "error" };
    }

    revalidatePath("/quiz");
    revalidatePath(`/quiz/${submission.quizId}`);
    revalidatePath("/learning", "layout");
    revalidatePath("/rewards");
    return { status: "success", attempt };
  } catch {
    return { status: "error" };
  }
}
