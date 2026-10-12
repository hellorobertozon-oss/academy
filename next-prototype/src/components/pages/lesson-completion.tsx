"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/base/buttons/button";
import { completeLessonAction } from "@/app/(academy)/learning/actions";

export function LessonCompletion({
  lessonId,
  completed,
  markLabel,
  completedLabel,
  pendingLabel,
  awardedMessage,
  errorMessage,
}: {
  lessonId: number;
  completed: boolean;
  markLabel: string;
  completedLabel: string;
  pendingLabel: string;
  awardedMessage: string;
  errorMessage: string;
}) {
  const [pending, startTransition] = useTransition();
  const [locallyCompletedLessonId, setLocallyCompletedLessonId] = useState<number | null>(null);
  const [completionFeedback, setCompletionFeedback] = useState<{
    lessonId: number;
    message: string;
  } | null>(null);
  const [failedLessonId, setFailedLessonId] = useState<number | null>(null);
  const isCompleted = completed || locallyCompletedLessonId === lessonId;
  const feedback = completionFeedback?.lessonId === lessonId ? completionFeedback.message : null;

  function markComplete() {
    if (pending || isCompleted) return;
    setFailedLessonId(null);

    startTransition(async () => {
      try {
        const result = await completeLessonAction(lessonId);
        if (result.status === "error") {
          setFailedLessonId(lessonId);
          return;
        }

        setLocallyCompletedLessonId(lessonId);
        setCompletionFeedback({
          lessonId,
          message: result.newlyCompleted
            ? awardedMessage.replace("{points}", String(result.pointsAwarded))
            : completedLabel,
        });
      } catch {
        setFailedLessonId(lessonId);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        variant={isCompleted ? "secondary" : "primary"}
        disabled={pending || isCompleted}
        onClick={markComplete}
      >
        {pending ? pendingLabel : isCompleted ? completedLabel : markLabel}
      </Button>
      {feedback ? <p role="status" aria-live="polite" className="text-body-2-regular text-text-secondary">{feedback}</p> : null}
      {failedLessonId === lessonId ? <p role="alert" className="text-body-2-regular text-text-error-primary">{errorMessage}</p> : null}
    </div>
  );
}
