"use client";

import { useState } from "react";
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { Button } from "@/components/base/buttons/button";
import { RadioCard } from "@/components/base/radio/radio-card";
import { RadioGroup } from "@/components/base/radio/radio";
import { useAcademy, type CopyKey } from "@/components/academy-provider";
import { cx } from "@/utils/cx";
import { backActionClassName, RouteButton } from "@/components/route-button";

const questions: { prompt: CopyKey; options: CopyKey[]; correct: number }[] = [
  { prompt: "quizPromptOne", options: ["quizOptionOneA", "quizOptionOneB", "quizOptionOneC"], correct: 1 },
  { prompt: "quizPromptTwo", options: ["quizOptionTwoA", "quizOptionTwoB", "quizOptionTwoC"], correct: 0 },
  { prompt: "quizPromptThree", options: ["quizOptionThreeA", "quizOptionThreeB", "quizOptionThreeC"], correct: 2 },
  { prompt: "quizPromptFour", options: ["quizOptionFourA", "quizOptionFourB", "quizOptionFourC"], correct: 1 },
];

export function QuizPage() {
  const { t } = useAcademy();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [isFinished, setIsFinished] = useState(false);
  const selectedAnswer = answers[current];
  const score = answers.reduce<number>((total, answer, index) => total + (answer === questions[index].correct ? 1 : 0), 0);
  const didPass = score >= 3;

  function selectAnswer(value: string) {
    setAnswers((currentAnswers) => currentAnswers.map((answer, index) => index === current ? Number(value) : answer));
  }

  function startOver() {
    setAnswers(Array(questions.length).fill(null));
    setCurrent(0);
    setIsFinished(false);
  }

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-8 sm:pt-12">
        <RouteButton href="/learning" size="large" variant="secondary" leadingIcon={RiArrowLeftLine} className={backActionClassName}>
          {t("backToDashboard")}
        </RouteButton>
        <div className="mt-8 text-center">
          <p className="text-body-semibold uppercase tracking-[0.16em] text-accent-300">{t("moduleOne")} {"\u00b7"} {t("products")}</p>
          <h1 className="mt-2 font-display text-display-3-regular uppercase tracking-wide text-text-primary sm:text-display-1-regular">{t("quizTitle")}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-headline-regular text-text-secondary sm:text-title-3-regular">{t("quizDescription")}</p>
        </div>

        <section className="mt-8 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-8" aria-label={t("quizTitle")}>
          {isFinished ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <span className="grid size-16 place-items-center rounded-full bg-accent-500 text-text-white text-title-1-semibold" aria-hidden="true">{didPass ? "\u2713" : "!"}</span>
              <h2 className="mt-5 font-display text-display-3-regular uppercase tracking-wide text-text-primary">{didPass ? t("quizPassed") : t("quizTryAgain")}</h2>
              <p className="mt-2 text-title-2-semibold text-accent-300">{t("quizScore").replace("{score}", String(score)).replace("{total}", String(questions.length))}</p>
              <p className="mt-3 max-w-lg text-headline-regular text-text-secondary">{didPass ? t("quizPassedDescription") : t("quizRetryDescription")}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button size="large" variant="secondary" onClick={startOver}>{t("quizTitle")}</Button>
                <RouteButton href="/dashboard" size="large" variant="secondary" className={backActionClassName}>{t("backToDashboard")}</RouteButton>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-4">
                <p className="whitespace-nowrap text-body-medium tabular-nums text-text-primary">
                  <span className="text-title-2-semibold text-accent-300">{String(current + 1).padStart(2, "0")}</span> / {String(questions.length).padStart(2, "0")}
                </p>
                <div
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={questions.length}
                  aria-valuenow={current + 1}
                  aria-label={t("quizTitle")}
                  className="h-2 overflow-hidden rounded-full bg-background-tertiary-default"
                >
                  <div className="h-full w-full origin-left rounded-full bg-accent-500 rtl:origin-right" style={{ transform: `scaleX(${(current + 1) / questions.length})` }} />
                </div>
                <p className="whitespace-nowrap text-body-medium text-text-secondary">
                  {t("questionProgress").replace("{current}", String(current + 1)).replace("{total}", String(questions.length))}
                </p>
              </div>

              <div className="mt-10">
                <p className="text-center text-body-semibold uppercase tracking-wide text-accent-300">{t("chooseAnswer")}</p>
                <h2 className="mx-auto mt-3 max-w-3xl text-center text-title-1-medium text-text-primary">{t(questions[current].prompt)}</h2>
                <RadioGroup
                  aria-label={t("chooseAnswer")}
                  value={selectedAnswer === null ? undefined : String(selectedAnswer)}
                  onChange={selectAnswer}
                  className="mx-auto mt-7 grid max-w-3xl gap-3"
                >
                  {questions[current].options.map((option, index) => (
                    <RadioCard
                      key={option}
                      value={String(index)}
                      title={<span className="flex items-center gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background-secondary-default text-body-semibold text-text-secondary">{String.fromCharCode(65 + index)}</span><span className="whitespace-normal text-start">{t(option)}</span></span>}
                      titleClassName="text-title-3-regular"
                      className={(state) => cx("min-h-16 rounded-2xl px-4 py-4 sm:px-5", state.isSelected && "border-accent-400 bg-accent-950")}
                    />
                  ))}
                </RadioGroup>
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <Button size="large" variant="secondary" leadingIcon={RiArrowLeftLine} disabled={current === 0} onClick={() => setCurrent((index) => Math.max(index - 1, 0))}>
                  {t("previous")}
                </Button>
                <Button
                  trailingIcon={current === questions.length - 1 ? undefined : RiArrowRightLine}
                  size="large"
                  disabled={selectedAnswer === null}
                  onClick={() => current === questions.length - 1 ? setIsFinished(true) : setCurrent((index) => index + 1)}
                >
                  {current === questions.length - 1 ? t("seeResult") : t("next")}
                </Button>
              </div>
              <p className="mt-4 text-center text-body-regular text-text-secondary">{t("quizHint")}</p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
