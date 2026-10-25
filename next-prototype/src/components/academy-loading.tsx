import { AcademyHeader } from "@/components/academy-header";
import { AcademySkeletonBlock } from "@/components/academy-skeleton";

export function AcademyLoading({
  label = "Wczytywanie Xzone Academy",
  withHeader = false,
  fullPage = false,
}: {
  label?: string;
  withHeader?: boolean;
  fullPage?: boolean;
}) {
  const pageClassName = withHeader
    ? "min-h-screen bg-background-full"
    : fullPage
      ? "min-h-screen bg-background-full px-4 py-10 sm:px-8 sm:py-14"
      : "w-full";
  const sectionClassName = withHeader
    ? "mx-auto grid w-full max-w-6xl gap-6 px-4 pb-16 pt-10 sm:px-8 sm:pt-14"
    : fullPage
      ? "mx-auto grid w-full max-w-6xl gap-6"
      : "grid w-full gap-6";

  return (
    <div className={pageClassName}>
      {withHeader ? <AcademyHeader mode="app" /> : null}
      <section
        aria-busy="true"
        className={sectionClassName}
      >
        <p className="sr-only" role="status">{label}</p>

        <div aria-hidden="true" className="grid gap-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid min-w-0 flex-1 gap-3">
              <AcademySkeletonBlock className="h-4 w-32 rounded-sm" />
              <AcademySkeletonBlock className="h-10 w-56 sm:h-12 sm:w-72" />
              <div className="grid max-w-3xl gap-2">
                <AcademySkeletonBlock className="h-4 w-full" />
                <AcademySkeletonBlock className="h-4 w-2/3" />
              </div>
            </div>
            <AcademySkeletonBlock className="h-11 w-40 rounded-xl" />
          </header>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
            <section className="grid gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6">
              <div className="grid gap-2">
                <AcademySkeletonBlock className="h-6 w-44" />
                <AcademySkeletonBlock className="h-4 w-3/4 rounded-sm" />
              </div>
              <div className="grid divide-y divide-separator-border">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="flex min-h-16 items-center gap-4 py-3">
                    <AcademySkeletonBlock className="size-11 shrink-0 rounded-full" />
                    <div className="grid min-w-0 flex-1 gap-2">
                      <AcademySkeletonBlock className="h-4 w-3/4 rounded-sm" />
                      <AcademySkeletonBlock className="h-3 w-1/2 rounded-sm" />
                    </div>
                    <AcademySkeletonBlock className="h-8 w-20 shrink-0 rounded-lg" />
                  </div>
                ))}
              </div>
            </section>

            <section className="grid content-start gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6">
              <div className="grid gap-2">
                <AcademySkeletonBlock className="h-6 w-36" />
                <AcademySkeletonBlock className="h-4 w-4/5 rounded-sm" />
              </div>
              <AcademySkeletonBlock className="h-32 w-full rounded-2xl" />
              <div className="grid grid-cols-3 gap-3">
                <AcademySkeletonBlock className="h-16 rounded-xl" />
                <AcademySkeletonBlock className="h-16 rounded-xl" />
                <AcademySkeletonBlock className="h-16 rounded-xl" />
              </div>
            </section>
          </div>

          <section className="grid gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6">
            <AcademySkeletonBlock className="h-6 w-40" />
            <div className="grid gap-3 sm:grid-cols-2">
              <AcademySkeletonBlock className="h-24 rounded-2xl" />
              <AcademySkeletonBlock className="h-24 rounded-2xl" />
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
