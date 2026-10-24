import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AcademyLoading } from "@/components/academy-loading";
import { RiBookOpenLine } from "@remixicon/react";
import { LinkButton } from "@/components/base/buttons/link-button";
import { ProgressReport } from "@/app/admin/progress/progress-report";
import { AdminPageHeading } from "@/app/admin/admin-ui";
import { readAdminProgress } from "@/lib/admin/progress-report";

async function AdminProgressContent() {
  const report = await readAdminProgress();
  if (report.status === "forbidden") redirect("/dashboard");

  return (
    <>
        <AdminPageHeading
          section="Wyniki szkoleń"
          title="Postępy użytkowników"
          description="Analizuj ukończone lekcje, aktywność i wyniki testów z podziałem na sklep, użytkownika i moduł."
          action={<LinkButton href="/admin/courses" variant="secondary" leadingIcon={RiBookOpenLine}>Zarządzaj szkoleniami</LinkButton>}
        />

        {report.status === "error" ? (
          <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
            Nie udało się wczytać raportu. Sprawdź, czy migracja raportu postępów Academy jest dostępna.
          </div>
        ) : (
          <ProgressReport rows={report.data} />
        )}
    </>
  );
}

export default function AdminProgressPage() {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie raportu" />}>
      <AdminProgressContent />
    </Suspense>
  );
}
