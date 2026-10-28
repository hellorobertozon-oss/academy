"use client";

import { useState, useTransition } from "react";
import { RiArrowLeftLine, RiArrowRightLine, RiCheckLine, RiCloseLine } from "@remixicon/react";
import { Badge } from "@/components/base/badges/badge";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import { RadioCard } from "@/components/base/radio/radio-card";
import { RadioGroup } from "@/components/base/radio/radio";
import type { LearningCopy } from "@/lib/academy/learning-copy";
import type { LearningQuiz } from "@/lib/academy/quizzes";
import { submitQuizAction, type QuizAttemptResult } from "@/app/(academy)/quiz-actions";
import { cx } from "@/utils/cx";

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replace(`{${key}}`, String(value)), template);
}

export function LearningQuizPage({ quiz, copy }: {
  quiz: LearningQuiz;
  copy: LearningCopy;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const question = quiz.questions[current];
  const selectedOptionId = answers[question.id];

  function chooseAnswer(value: string) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: Number(value) }));
  }

  function submit() {
    setError(false);
    startTransition(async () => {
      const response = await submitQuizAction({
        quizId: quiz.id,
        answers: quiz.questions.map((item) => ({ questionId: item.id, optionId: answers[item.id] })),
      });
      if (response.status === "error") {
        setError(true);
        return;
      }
      setResult(response.attempt);
    });
  }

  function tryAgain() {
    setAnswers({});
    setCurrent(0);
    setError(false);
    setResult(null);
  }

  return (
    <section className="rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-8" aria-label={quiz.title}>
      {result ? (
        <div className="flex min-h-80 flex-col items-center justify-center text-center" aria-live="polite">
          <span className={cx(
            "grid size-16 place-items-center rounded-full text-text-white",
            result.passed ? "bg-accent-500" : "bg-background-tertiary-default text-text-secondary",
          )} aria-hidden="true">
            {result.passed ? <RiCheckLine className="size-8" /> : <RiCloseLine className="size-8" />}
          </span>
          <h2 className="mt-5 font-display text-display-3-regular uppercase tracking-wide text-text-primary">
            {result.passed ? copy.quizPassedTitle : copy.quizFailedTitle}
          </h2>
          <p className="mt-3 text-title-2-semibold text-accent-300">
            {fill(copy.quizScore, { score: result.scorePercentage, correct: result.correctCount, total: result.questionCount })}
          </p>
          <p className="mt-3 max-w-lg text-body-regular text-text-secondary">
            {result.passed
              ? copy.quizPassedDescription
              : fill(copy.quizFailedDescription, { percentage: quiz.passPercentage })}
          </p>
          {result.pointsAwarded > 0 ? (
            <p className="mt-3 text-body-semibold text-accent-300">{fill(copy.quizPointsEarned, { points: result.pointsAwarded })}</p>
          ) : null}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {result.passed ? (
              <ButtonLink
                href={quiz.nextLessonId
                  ? `/learning/${quiz.courseSlug}/lesson/${quiz.nextLessonId}`
                  : `/learning/${quiz.courseSlug}`}
                size="large"
                trailingIcon={quiz.nextLessonId ? RiArrowRightLine : undefined}
              >
                {quiz.nextLessonId ? copy.nextLesson : copy.backToCourse}
              </ButtonLink>
            ) : null}
            <Button size="large" variant="secondary" onClick={tryAgain}>{copy.quizOpen}</Button>
            <ButtonLink href="/quiz" size="large" variant="secondary">{copy.quizBackToList}</ButtonLink>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:gap-4">
            <p className="whitespace-nowrap text-body-medium tabular-nums text-text-primary">
              <span className="text-title-2-semibold text-accent-300">{String(current + 1).padStart(2, "0")}</span>
              {" / "}{String(quiz.questions.length).padStart(2, "0")}
            </p>
            <div
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={quiz.questions.length}
              aria-valuenow={current + 1}
              aria-label={fill(copy.quizQuestionProgress, { current: current + 1, total: quiz.questions.length })}
              className="h-2 overflow-hidden rounded-full bg-background-tertiary-default"
            >
              <div className="h-full rounded-full bg-accent-500 transition-[width]" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
            </div>
          </div>

          <div className="mt-9">
            <p className="text-center text-body-semibold uppercase tracking-wide text-accent-300">
              {fill(copy.quizQuestionProgress, { current: current + 1, total: quiz.questions.length })}
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl text-center text-title-1-medium text-text-primary">{question.prompt}</h2>
            <RadioGroup
              aria-label={copy.quizChooseAnswer}
              value={selectedOptionId === undefined ? undefined : String(selectedOptionId)}
              onChange={chooseAnswer}
              className="mx-auto mt-7 grid max-w-3xl gap-3"
            >
              {question.options.map((option, index) => (
                <RadioCard
                  key={option.id}
                  value={String(option.id)}
                  title={<span className="flex items-center gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background-secondary-default text-body-semibold text-text-secondary">{String.fromCharCode(65 + index)}</span><span className="whitespace-normal text-start">{option.label}</span></span>}
                  titleClassName="text-title-3-regular"
                  className={(state) => cx("min-h-16 rounded-2xl px-4 py-4 sm:px-5", state.isSelected && "border-accent-400 bg-accent-950")}
                />
              ))}
            </RadioGroup>
          </div>

          {error ? <p role="alert" className="mt-5 text-center text-body-2-medium text-text-error-primary">{copy.quizSubmitError}</p> : null}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              size="large"
              variant="secondary"
              leadingIcon={RiArrowLeftLine}
              disabled={current === 0 || isPending}
              onClick={() => setCurrent((index) => Math.max(index - 1, 0))}
            >
              {copy.quizPrevious}
            </Button>
            {current < quiz.questions.length - 1 ? (
              <Button
                size="large"
                trailingIcon={RiArrowRightLine}
                disabled={selectedOptionId === undefined || isPending}
                onClick={() => setCurrent((index) => Math.min(index + 1, quiz.questions.length - 1))}
              >
                {copy.quizNext}
              </Button>
            ) : (
              <Button size="large" disabled={selectedOptionId === undefined || isPending} onClick={submit}>
                {isPending ? copy.quizSubmitting : copy.quizSubmit}
              </Button>
            )}
          </div>
        </>
      )}

      {!result && quiz.attemptCount > 0 ? (
        <div className="mt-8 border-t border-separator-border pt-5">
          <h3 className="text-body-semibold text-text-primary">{copy.quizAttempts}</h3>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {quiz.attempts.map((attempt) => (
              <li key={attempt.attemptNumber} className="flex items-center justify-between gap-3 rounded-xl bg-background-secondary-default px-4 py-3">
                <span className="text-body-2-regular text-text-secondary">
                  {fill(copy.quizAttempt, { number: attempt.attemptNumber })} · {attempt.scorePercentage}%
                </span>
                <Badge color={attempt.passed ? "primary" : "neutral"}>
                  {attempt.passed ? copy.quizPassedBadge : copy.quizFailedBadge}
                </Badge>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {!result ? <p className="mt-4 text-center text-caption-1-regular text-text-secondary">{copy.quizUnlimitedAttempts}</p> : null}
    </section>
  );
}
