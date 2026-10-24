import { AcademyHeader } from "@/components/academy-header";
import { AcademySkeletonBlock as SkeletonBlock } from "@/components/academy-skeleton";

function DashboardCardSkeleton() {
  return (
    <article className="relative grid grid-cols-1 gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-3 sm:grid-cols-[minmax(260px,38%)_minmax(0,1fr)] sm:items-center sm:gap-6 sm:p-4">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-background-secondary-default">
        <SkeletonBlock className="absolute inset-0 rounded-2xl" />
      </div>
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <SkeletonBlock className="h-5 w-14 sm:h-6 sm:w-16" />
      </div>
      <div className="flex min-w-0 flex-col py-3 sm:py-6 sm:pe-24">
        <SkeletonBlock className="h-3 w-24 rounded-sm" />
        <SkeletonBlock className="mt-2 h-7 w-4/5" />
        <SkeletonBlock className="mt-5 h-5 w-32 rounded-sm" />
      </div>
    </article>
  );
}

function DashboardActionSkeleton() {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:flex-row sm:items-center sm:px-6">
      <div className="w-full min-w-0 sm:flex-1">
        <SkeletonBlock className="h-5 w-40 rounded-sm" />
        <SkeletonBlock className="mt-1 h-4 w-full max-w-md rounded-sm" />
      </div>
      <SkeletonBlock className="h-11 w-44 rounded-xl" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="relative isolate min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main
        aria-busy="true"
        className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-8 sm:pt-16"
      >
        <p className="sr-only" role="status">
          Wczytywanie panelu kursanta
        </p>
        <div aria-hidden="true">
          <section className="grid gap-6">
            <div>
              <SkeletonBlock className="mb-2 h-5 w-40 rounded-sm" />
              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8">
                <div className="min-w-0">
                  <SkeletonBlock className="h-12 w-40 sm:h-16 sm:w-52" />
                  <div className="mt-3 grid max-w-3xl gap-2">
                    <SkeletonBlock className="h-6 w-full" />
                    <SkeletonBlock className="h-6 w-2/3" />
                  </div>
                </div>
                <div className="-translate-y-3 flex shrink-0 flex-col items-center gap-1 py-1 sm:-translate-y-4">
                  <SkeletonBlock className="size-20 rounded-full sm:size-24" />
                  <SkeletonBlock className="-mt-4 h-7 w-28 rounded-full sm:-mt-5" />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-5" aria-label="Główne sekcje">
            {Array.from({ length: 3 }, (_, index) => (
              <DashboardCardSkeleton key={index} />
            ))}
          </section>

          <section className="mt-5 grid gap-5">
            <DashboardActionSkeleton />
            <DashboardActionSkeleton />
          </section>
        </div>
      </main>
    </div>
  );
}
