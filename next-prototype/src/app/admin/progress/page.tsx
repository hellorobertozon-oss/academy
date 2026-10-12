import { redirect } from "next/navigation";
import { AcademyHeader } from "@/components/academy-header";
import { LinkButton } from "@/components/base/buttons/link-button";
import { ProgressReport } from "@/app/admin/progress/progress-report";
import { readAdminProgress } from "@/lib/admin/progress-report";

export default async function AdminProgressPage() {
  const report = await readAdminProgress();
  if (report.status === "forbidden") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-8">
        <header className="flex flex-col gap-2">
          <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">
            Xzone Academy · {report.status === "ok" ? report.adminEmail : "Panel administratora"}
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-display-3-regular uppercase tracking-wide text-text-primary">
                Postępy pracowników
              </h1>
              <p className="mt-2 max-w-3xl text-body-regular text-text-secondary">
                Wyniki przypisanych szkoleń z podziałem na sklep, pracownika i moduł.
              </p>
            </div>
            <LinkButton href="/admin" variant="secondary">Wróć do panelu</LinkButton>
          </div>
        </header>

        {report.status === "error" ? (
          <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
            Nie udało się wczytać raportu. Sprawdź, czy migracja raportu postępów Academy jest dostępna.
          </div>
        ) : (
          <ProgressReport rows={report.data} />
        )}
      </main>
    </div>
  );
}
