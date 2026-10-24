import type { ReactNode } from "react";
import { AcademyHeader } from "@/components/academy-header";
import { AcademySkeletonBlock } from "@/components/academy-skeleton";

function LoadingShell({
  label,
  children,
  mainClassName,
}: {
  label: string;
  children: ReactNode;
  mainClassName: string;
}) {
  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main aria-busy="true" className={mainClassName}>
        <p className="sr-only" role="status">{label}</p>
        <div aria-hidden="true">{children}</div>
      </main>
    </div>
  );
}

function AssignedCourseCardSkeleton() {
  return (
    <article className="relative grid grid-cols-1 gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-3 sm:grid-cols-[minmax(260px,38%)_minmax(0,1fr)] sm:items-center sm:gap-6 sm:p-4">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-background-secondary-default">
        <AcademySkeletonBlock className="absolute inset-0 rounded-2xl" />
      </div>
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <AcademySkeletonBlock className="h-5 w-14 sm:h-6 sm:w-16" />
      </div>
      <div className="flex min-w-0 flex-col py-3 sm:py-6 sm:pe-24">
        <AcademySkeletonBlock className="h-3 w-32 rounded-sm" />
        <AcademySkeletonBlock className="mt-2 h-7 w-4/5" />
        <div className="mt-2 grid max-w-3xl gap-2">
          <AcademySkeletonBlock className="h-4 w-full" />
          <AcademySkeletonBlock className="h-4 w-2/3" />
        </div>
        <div className="mt-4 grid w-full max-w-xl gap-2">
          <AcademySkeletonBlock className="h-4 w-40 rounded-sm" />
          <AcademySkeletonBlock className="h-2 w-full rounded-full" />
        </div>
        <AcademySkeletonBlock className="mt-5 h-5 w-32 rounded-sm" />
      </div>
    </article>
  );
}

export function AssignedCoursesLoading() {
  return (
    <LoadingShell
      label="Wczytywanie szkoleń"
      mainClassName="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-14"
    >
      <AcademySkeletonBlock className="mb-8 h-11 w-44 rounded-xl" />
      <header className="mb-8">
        <AcademySkeletonBlock className="mb-2 h-4 w-40 rounded-sm" />
        <AcademySkeletonBlock className="h-14 w-64 sm:w-80" />
        <div className="mt-3 grid max-w-3xl gap-2">
          <AcademySkeletonBlock className="h-6 w-full" />
          <AcademySkeletonBlock className="h-6 w-2/3" />
        </div>
      </header>
      <section className="grid gap-5">
        <AssignedCourseCardSkeleton />
        <AssignedCourseCardSkeleton />
      </section>
    </LoadingShell>
  );
}

function CourseModuleSkeleton() {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border-button-default bg-background-primary-default p-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <AcademySkeletonBlock className="h-3 w-24 rounded-sm" />
          <AcademySkeletonBlock className="h-6 w-44" />
        </div>
        <AcademySkeletonBlock className="h-6 w-20 rounded-full" />
      </div>
      <ol className="flex flex-col divide-y divide-separator-border">
        {[0, 1, 2].map((row) => (
          <li key={row} className="flex min-h-16 items-center gap-4 py-3">
            <AcademySkeletonBlock className="size-12 shrink-0 rounded-full" />
            <AcademySkeletonBlock className="h-5 w-3/4" />
          </li>
        ))}
      </ol>
    </article>
  );
}

export function CourseLoading() {
  return (
    <LoadingShell
      label="Wczytywanie kursu"
      mainClassName="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-8 sm:pt-14"
    >
      <AcademySkeletonBlock className="h-12 w-44 rounded-xl" />
      <header className="flex flex-col gap-4">
        <AcademySkeletonBlock className="h-4 w-32 rounded-sm" />
        <AcademySkeletonBlock className="h-14 w-64 sm:w-96" />
        <div className="grid max-w-4xl gap-2">
          <AcademySkeletonBlock className="h-6 w-full" />
          <AcademySkeletonBlock className="h-6 w-2/3" />
        </div>
        <div className="flex flex-wrap gap-2">
          <AcademySkeletonBlock className="h-7 w-24 rounded-full" />
          <AcademySkeletonBlock className="h-7 w-20 rounded-full" />
        </div>
      </header>
      <section className="flex flex-col gap-4">
        <CourseModuleSkeleton />
        <CourseModuleSkeleton />
      </section>
    </LoadingShell>
  );
}

export function LessonLoading() {
  return (
    <LoadingShell
      label="Wczytywanie lekcji"
      mainClassName="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-8 sm:pt-14"
    >
      <AcademySkeletonBlock className="h-11 w-40 rounded-xl" />
      <header className="flex flex-col gap-3">
        <AcademySkeletonBlock className="h-4 w-64 rounded-sm" />
        <AcademySkeletonBlock className="h-14 w-64 sm:w-96" />
        <AcademySkeletonBlock className="h-4 w-24 rounded-sm" />
        <div className="grid max-w-4xl gap-2">
          <AcademySkeletonBlock className="h-6 w-full" />
          <AcademySkeletonBlock className="h-6 w-2/3" />
        </div>
      </header>
      <AcademySkeletonBlock className="aspect-[16/7] w-full rounded-3xl" />
      <div className="grid gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-8">
        <AcademySkeletonBlock className="h-7 w-48" />
        <AcademySkeletonBlock className="h-5 w-full" />
        <AcademySkeletonBlock className="h-5 w-full" />
        <AcademySkeletonBlock className="h-5 w-4/5" />
        <AcademySkeletonBlock className="mt-4 h-7 w-40" />
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex items-center gap-3">
            <AcademySkeletonBlock className="size-2 shrink-0 rounded-full" />
            <AcademySkeletonBlock className="h-5 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-center border-t border-separator-border pt-6">
        <AcademySkeletonBlock className="h-12 w-48 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <AcademySkeletonBlock className="h-12 w-full rounded-xl" />
        <AcademySkeletonBlock className="h-12 w-full rounded-xl" />
      </div>
    </LoadingShell>
  );
}
