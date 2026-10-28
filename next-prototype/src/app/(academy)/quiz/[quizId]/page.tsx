import { Suspense } from "react";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { RiArrowLeftLine, RiLockLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { AcademyLoading } from "@/components/academy-loading";
import { LinkButton } from "@/components/base/buttons/link-button";
import { LearningQuizPage } from "@/components/pages/learning-quiz";
import { readLearningQuiz } from "@/lib/academy/quizzes";
import { getLearningCopy } from "@/lib/academy/learning-copy";

async function QuizContent({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId: rawQuizId } = await params;
  const quizId = Number(rawQuizId);
  const result = await readLearningQuiz(quizId);
  if (result.status === "forbidden") redirect("/admin/courses");
  if (result.status === "not-found") notFound();

  const copy = getLearningCopy(result.status === "ok" || result.status === "locked" ? result.languageCode : "pl");
  return (
    <div className="relative isolate min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <div className="pointer-events-none absolute inset-x-0 top-28 z-0 h-96 overflow-hidden sm:top-20" aria-hidden="true">
        <Image src="/assets/main-learning-v3.png" alt="" fill priority sizes="100vw" className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background-full/20 via-background-full/60 to-background-full" />
      </div>
      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <LinkButton href={result.status === "locked" ? "/learning" : "/quiz"} size="medium" variant="secondary" leadingIcon={RiArrowLeftLine} className="mb-8">
          {result.status === "locked" ? copy.backToCourses : copy.quizBackToList}
        </LinkButton>
        {result.status === "locked" ? (
          <section role="status" className="flex items-center gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-separator-border bg-background-secondary-default text-text-tertiary" aria-hidden="true">
              <RiLockLine className="size-6" />
            </span>
            <p className="text-body-regular text-text-secondary">{copy.quizLocked}</p>
          </section>
        ) : result.status === "error" ? (
          <div role="alert" className="rounded-3xl border border-border-error-default bg-background-primary-default p-6 text-body-regular text-text-error-primary">
            {copy.loadError}
          </div>
        ) : (
          <>
            <header className="mb-7">
              <p className="mb-2 text-caption-1-semibold uppercase tracking-[0.14em] text-accent-300">
                {result.data.courseTitle} · {result.data.moduleTitle}{result.data.lessonTitle ? ` · ${result.data.lessonTitle}` : ""}
              </p>
              <h1 className="font-display text-display-2-regular uppercase tracking-wide text-text-primary">{result.data.title}</h1>
              {result.data.instructions ? <p className="mt-3 max-w-3xl text-headline-regular text-text-secondary">{result.data.instructions}</p> : null}
            </header>
            <LearningQuizPage quiz={result.data} copy={copy} />
          </>
        )}
      </main>
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ quizId: string }> }) {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie quizu" withHeader />}>
      <QuizContent params={params} />
    </Suspense>
  );
}
