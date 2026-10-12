"use client";

import Image from "next/image";
import { useState } from "react";
import { RiArrowLeftLine, RiArrowRightLine, RiCheckLine, RiPlayFill } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { Button } from "@/components/base/buttons/button";
import { backActionClassName, RouteButton } from "@/components/route-button";
import { useAcademy, type AcademyLanguage, type CopyKey } from "@/components/academy-provider";
import { learningModules, lessonTakeaways } from "@/components/pages/learning-data";
import { cx } from "@/utils/cx";

export function ModulePage({ moduleId }: { moduleId: string }) {
  const { t, language, completedLessons, completeLesson } = useAcademy();
  const [selectedLesson, setSelectedLesson] = useState<CopyKey | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const currentModule = learningModules.find((item) => item.id === moduleId);

  if (!currentModule) return null;

  const lessons = currentModule.lessons;
  const completedLessonCount = lessons.filter((lesson) => completedLessons.includes(lesson)).length;
  const isModuleCompleted = completedLessonCount === lessons.length;
  const moduleStatus = isModuleCompleted
    ? t("moduleCompleted")
    : completedLessonCount > 0
      ? t("moduleInProgress")
      : t("moduleNotStarted");
  const moduleProgressPercent = Math.round((completedLessonCount / lessons.length) * 100);
  const moduleProgressLabel = t("moduleLessonProgress")
    .replace("{done}", String(completedLessonCount))
    .replace("{total}", String(lessons.length));
  const selectedLessonIndex = selectedLesson ? lessons.indexOf(selectedLesson) : -1;
  const isTextOnlyLesson = selectedLesson === "helmetTextLesson";
  const isSelectedLessonCompleted = selectedLesson ? completedLessons.includes(selectedLesson) : false;

  function navigateLesson(direction: -1 | 1) {
    const nextLesson = lessons[selectedLessonIndex + direction];
    if (!nextLesson) return;

    setSelectedLesson(nextLesson);
    setIsVideoLoaded(false);
  }

  return (
    <div className="relative isolate min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      {!selectedLesson ? (
        <div className="pointer-events-none absolute inset-x-0 top-28 z-0 h-96 overflow-hidden sm:top-20" aria-hidden="true">
          <Image
            src="/assets/main-learning-v3.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background-full/20 via-background-full/60 to-background-full" />
        </div>
      ) : null}

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        {!selectedLesson ? (
          <RouteButton href="/learning" size="large" variant="secondary" leadingIcon={RiArrowLeftLine} className={cx(backActionClassName, "mb-8")}>
            {t("backToModules")}
          </RouteButton>
        ) : null}

        {selectedLesson ? (
          <section aria-labelledby="lesson-heading">
            <Button
              size="large"
              variant="secondary"
              className={backActionClassName}
              leadingIcon={RiArrowLeftLine}
              onClick={() => {
                setSelectedLesson(null);
                setIsVideoLoaded(false);
              }}
            >
              {t("lessonBack")}
            </Button>
            <header className="mt-8">
              <p className="text-body-semibold uppercase tracking-[0.16em] text-accent-300">
                {t(currentModule.number)} · {t(currentModule.title)}
              </p>
              <h1 id="lesson-heading" className="mt-2 font-display text-display-3-regular uppercase tracking-wide text-text-primary sm:text-display-2-regular">
                {t(selectedLesson)}
              </h1>
            </header>

            <article className="mt-6 rounded-3xl border border-border-button-default bg-background-primary-default p-3 sm:p-5">
              {isTextOnlyLesson ? (
                <TextLessonPreview language={language} />
              ) : (
                <>
                  <div className="relative aspect-video overflow-hidden rounded-2xl bg-background-tertiary-default">
                    {isVideoLoaded ? (
                      <iframe
                        className="absolute inset-0 size-full"
                        src="https://www.youtube.com/embed/-5S4NxeYe_Y?autoplay=1&rel=0&playsinline=1"
                        title={t("lessonVideoTitle")}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        <Image src="/assets/xzone-detailing-video-thumb.jpg" alt="" fill sizes="(max-width: 768px) 100vw, 960px" className="image-outline object-cover" />
                        <div className="absolute inset-0 grid place-items-center bg-background-full/25">
                          <Button size="large" leadingIcon={RiPlayFill} onClick={() => setIsVideoLoaded(true)}>
                            {t("playLessonVideo")}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                  <section className="px-2 pb-2 pt-6 sm:px-4 sm:pb-4 sm:pt-8" aria-labelledby="lesson-takeaways-heading">
                    <h2 id="lesson-takeaways-heading" className="text-title-1-medium text-text-primary">{t("lessonKeyPoints")}</h2>
                    <ul className="mt-5 grid gap-4 sm:gap-5">
                      {lessonTakeaways.map((takeaway) => (
                        <li key={takeaway} className="flex items-start gap-4">
                          <span className="mt-2 size-2 shrink-0 rounded-full bg-accent-300" aria-hidden="true" />
                          <span className="text-title-3-regular text-text-secondary">{t(takeaway)}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="mx-2 mt-6 px-0 pt-6 sm:mx-4 sm:mt-8 sm:pt-8" aria-labelledby="lesson-client-advice-heading">
                    <h2 id="lesson-client-advice-heading" className="text-title-1-medium text-text-primary">{t("lessonClientAdviceTitle")}</h2>
                    <blockquote className="mt-4 border-s-2 border-accent-300 ps-4 text-title-3-regular italic text-text-secondary">
                      {t("lessonClientAdviceQuote")}
                    </blockquote>
                  </section>
                </>
              )}
              <section className="mx-2 mt-8 border-t border-separator-border px-0 pb-6 pt-6 sm:mx-4 sm:mt-10 sm:pb-8 sm:pt-8">
                {isSelectedLessonCompleted ? (
                  <p className="flex min-h-12 items-center justify-center gap-2 text-body-semibold text-accent-300">
                    <RiCheckLine className="size-5" aria-hidden="true" />
                    {t("lessonCompleted")}
                  </p>
                ) : (
                  <>
                    <p className="mb-3 text-center text-body-medium text-text-secondary">{t("lessonCompletionPrompt")}</p>
                    <div className="flex min-h-12 justify-center">
                      <Button
                        variant="secondary"
                        size="medium"
                        className="min-h-12 rounded-full border-accent-300 px-6 text-body-semibold text-accent-300 shadow-none transition-colors duration-150 hover:border-accent-300 hover:bg-accent-300/10 active:border-accent-300 active:bg-accent-300/15"
                        leadingIcon={RiCheckLine}
                        onClick={() => completeLesson(selectedLesson)}
                      >
                        {t("markLessonComplete")}
                      </Button>
                    </div>
                  </>
                )}
              </section>
            </article>
            <nav aria-label={t("lessons")} className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                size="large"
                variant="secondary"
                className={cx("w-full justify-start", backActionClassName)}
                leadingIcon={RiArrowLeftLine}
                disabled={selectedLessonIndex <= 0}
                onClick={() => navigateLesson(-1)}
              >
                {t("previousLesson")}
              </Button>
              <Button
                size="large"
                className="w-full justify-between"
                trailingIcon={RiArrowRightLine}
                disabled={selectedLessonIndex >= currentModule.lessons.length - 1}
                onClick={() => navigateLesson(1)}
              >
                {t("nextLesson")}
              </Button>
            </nav>
          </section>
        ) : (
          <>
            <header className="max-w-4xl">
              <p className="text-caption-1-semibold uppercase tracking-[0.16em] text-accent-300">{t(currentModule.number)}</p>
              <h1 className="mt-2 font-display text-display-2-regular uppercase tracking-wide text-text-primary">{t(currentModule.title)}</h1>
              <p className="mt-3 text-headline-regular text-text-secondary sm:text-title-3-regular">{t(currentModule.description)}</p>
              <div className="mt-5 max-w-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-body-medium text-text-secondary">{moduleProgressLabel}</p>
                  <span className={cx(
                    "inline-flex items-center gap-1.5 text-body-semibold",
                    isModuleCompleted ? "text-accent-300" : completedLessonCount > 0 ? "text-text-primary" : "text-text-secondary",
                  )}>
                    {isModuleCompleted ? (
                      <RiCheckLine className="size-4" aria-hidden="true" />
                    ) : (
                      <span className={cx("size-2 rounded-full", completedLessonCount > 0 ? "bg-accent-300" : "bg-background-tertiary-default")} aria-hidden="true" />
                    )}
                    {moduleStatus}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={t(currentModule.title)}
                  aria-valuemin={0}
                  aria-valuemax={lessons.length}
                  aria-valuenow={completedLessonCount}
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background-tertiary-default"
                >
                  <div className="h-full rounded-full bg-accent-300 transition-[width] duration-300" style={{ width: `${moduleProgressPercent}%` }} />
                </div>
              </div>
            </header>

            <section className="mt-10" aria-labelledby="module-lessons-heading">
              <div>
                <h2 id="module-lessons-heading" className="text-title-1-medium text-text-primary">{t("lessons")}</h2>
                <p className="mt-2 text-headline-regular text-text-secondary sm:text-title-3-regular">{t("lessonsDescription")}</p>
              </div>

              <ol className="mt-6 grid gap-3">
                {currentModule.lessons.map((lesson, index) => {
                  const isLessonCompleted = completedLessons.includes(lesson);

                  return (
                    <li key={lesson}>
                      <Button
                        size="large"
                        variant="secondary"
                        className={cx("min-h-16 w-full justify-between rounded-2xl border border-separator-border bg-background-primary-default px-4 py-3 text-start hover:bg-background-primary-hover", "sm:px-6")}
                        trailingIcon={RiArrowRightLine}
                        onClick={() => setSelectedLesson(lesson)}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className={cx(
                            "grid size-8 shrink-0 place-items-center rounded-full text-body-semibold tabular-nums",
                            isLessonCompleted ? "bg-accent-300 text-background-full" : "text-accent-300",
                          )}>
                            {isLessonCompleted ? <RiCheckLine className="size-5" aria-hidden="true" /> : String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-title-3-medium text-text-primary">{t(lesson)}</span>
                        </span>
                      </Button>
                    </li>
                  );
                })}
              </ol>
            </section>

            {currentModule.id === "sales-skills" ? (
              <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <p className="text-body-medium text-text-primary">{t("finalTest")}</p>
                  <p className="mt-1 text-body-2-regular text-text-secondary">{t("quizDescription")}</p>
                </div>
                <RouteButton href="/quiz" trailingIcon={RiArrowRightLine}>{t("openQuiz")}</RouteButton>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

function TextLessonPreview({ language }: { language: AcademyLanguage }) {
  const isPolish = language === "pl";
  const bulletPoints = isPolish
    ? [
        "Do skorupy dobierz środek przeznaczony do materiału, z którego została wykonana.",
        "Wizjer czyść delikatnie miękką ściereczką, bez mocnego nacisku i szorowania.",
        "Wyściółkę odświeżaj osobnym preparatem i pozwól jej całkowicie wyschnąć.",
        "Nie mieszaj różnych środków i nie nakładaj ich więcej, niż zaleca etykieta.",
      ]
    : [
        "Choose a shell cleaner intended for the material the helmet is made from.",
        "Clean the visor gently with a soft cloth; avoid pressing hard or scrubbing.",
        "Refresh the lining with a separate product and let it dry completely.",
        "Do not mix products or apply more than the label recommends.",
      ];
  const numberedSteps = isPolish
    ? [
        "Przygotuj czyste ściereczki i usuń luźny kurz z kasku.",
        "Przeczytaj etykietę i przygotuj preparat dokładnie według instrukcji.",
        "Czyść wybraną powierzchnię delikatnymi ruchami, używając osobnej części ściereczki.",
        "Wytrzyj pozostałości i pozostaw kask w przewiewnym miejscu do całkowitego wyschnięcia.",
      ]
    : [
        "Prepare clean cloths and remove loose dust from the helmet.",
        "Read the label and prepare the product exactly as instructed.",
        "Clean the chosen surface gently, using a fresh part of the cloth.",
        "Wipe away residue and leave the helmet in a ventilated place to dry completely.",
      ];

  return (
    <div className="grid w-full gap-10 px-2 pb-2 pt-6 sm:px-4 sm:pb-4 sm:pt-8">
      <section className="grid gap-4">
        <h2 className="text-title-1-medium text-text-primary">
          {isPolish ? "Dobra pielęgnacja zaczyna się od właściwego produktu" : "Good care starts with the right product"}
        </h2>
        <p className="text-title-3-regular text-text-secondary">
          {isPolish ? (
            <>
              Kask składa się z różnych materiałów, dlatego każdy element może wymagać innego sposobu pielęgnacji. <strong>Dobierz preparat do powierzchni</strong>, a przy wizjerze <em>zawsze sprawdzaj zalecenia producenta</em>. Nie zakładaj, że środek bezpieczny dla skorupy nadaje się też do wizjera, powłoki przeciwparującej albo wyściółki.
            </>
          ) : (
            <>
              A helmet uses different materials, so each part may need a different kind of care. <strong>Choose a product for the surface</strong>, and when cleaning a visor, <em>always check the helmet maker&apos;s guidance</em>. A cleaner that is suitable for the shell may not be right for the visor, anti-fog coating or lining.
            </>
          )}
        </p>
        <p className="text-title-3-regular text-text-secondary">
          {isPolish
            ? "Przed czyszczeniem przygotuj czyste ściereczki i sprawdź, czy kask nie ma luźnych elementów. Pracuj w dobrze oświetlonym miejscu, bez pośpiechu. Dzięki temu łatwiej zauważysz zabrudzenia i nie przeniesiesz ich z jednej powierzchni na drugą."
            : "Before cleaning, prepare fresh cloths and check that no parts are loose. Work in a well-lit place and take your time. This makes dirt easier to spot and helps prevent it from being transferred from one surface to another."}
        </p>
        <h3 className="text-title-2-semibold text-text-primary">
          {isPolish ? "Co warto zapamiętać?" : "What should you remember?"}
        </h3>
        <ul className="list-disc space-y-3 ps-6 text-title-3-regular text-text-secondary">
          {bulletPoints.map((point) => <li key={point}>{point}</li>)}
        </ul>
        <p className="text-title-3-regular text-text-secondary">
          {isPolish
            ? "Po pracy pozostaw kask w suchym, przewiewnym miejscu. Nie używaj go, dopóki wnętrze nie będzie całkowicie suche. Regularna, spokojna pielęgnacja pomaga utrzymać kask w dobrym stanie i ułatwia zauważenie zmian, które warto skonsultować z producentem."
            : "After cleaning, leave the helmet in a dry, ventilated place. Do not use it until the lining is completely dry. Regular, careful maintenance helps keep the helmet in good condition and makes it easier to notice changes that may need to be checked with the maker."}
        </p>
      </section>

      <section className="grid gap-4">
        <h2 className="text-title-1-medium text-text-primary">
          {isPolish ? "Prosty proces czyszczenia — krok po kroku" : "A simple cleaning process, step by step"}
        </h2>
        <p className="text-title-3-regular text-text-secondary">
          {isPolish
            ? "Ustal kolejność jeszcze przed rozpoczęciem. Najpierw usuń luźny kurz, potem pracuj nad wybraną powierzchnią, a na końcu sprawdź efekt. Jeśli przechodzisz między różnymi elementami kasku, korzystaj z czystej części ściereczki."
            : "Decide on the order before you begin. Remove loose dust first, then clean one surface at a time and check the result at the end. Use a clean part of the cloth when moving between different parts of the helmet."}
        </p>
        <ol className="list-decimal space-y-3 ps-6 text-title-3-regular text-text-secondary">
          {numberedSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <h3 className="text-title-2-semibold text-text-primary">
          {isPolish ? "Wskazówka do rozmowy z klientem" : "A tip for the customer conversation"}
        </h3>
        <p className="text-title-3-regular text-text-secondary">
          {isPolish
            ? "Zamiast wymieniać wyłącznie nazwę produktu, zapytaj o kask i sposób jego użytkowania. Wtedy łatwiej wyjaśnić, dlaczego konkretny preparat i akcesorium odpowiadają na potrzebę klienta."
            : "Instead of naming a product straight away, ask about the helmet and how it is used. It is then easier to explain why a particular cleaner and accessory fit the customer's needs."}
        </p>
        <blockquote className="border-s-2 border-accent-300 ps-4 text-title-2-regular italic text-text-secondary">
          {isPolish
            ? "Zacznijmy od tego, z czego wykonany jest kask i którą jego część chcesz wyczyścić. Na tej podstawie dobierzemy preparat i pokażę Ci, jak bezpiecznie go używać."
            : "Let's start with the helmet material and the part you want to clean. From there, we can choose a suitable product and I can show you how to use it safely."}
        </blockquote>
      </section>
    </div>
  );
}
