import { RiDownloadLine } from "@remixicon/react";
import { AdminCard, AdminPageHeading } from "@/app/admin/admin-ui";
import { LinkButton } from "@/components/base/buttons/link-button";
import { createAcademyServerClient } from "@/lib/supabase/server";

export default async function AdminTradeFairPage() {
  const supabase = await createAcademyServerClient();
  const entriesResult = await supabase
    .from("trade_fair_memory_entries")
    .select("id", { count: "exact", head: true });

  return (
    <>
      <AdminPageHeading
        section="Targi"
        title="Leady targowe"
        description="Pobierz zapisane adresy e-mail uczestników i wybrany przez nich język."
        action={(
          <LinkButton href="/admin/trade-fair/export" variant="secondary" leadingIcon={RiDownloadLine}>
            Pobierz CSV
          </LinkButton>
        )}
      />

      {entriesResult.error ? (
        <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
          Nie udało się wczytać liczby zgłoszeń.
        </div>
      ) : (
        <AdminCard title="Zgłoszenia z targów" description="Eksport CSV zawiera adres e-mail oraz język. Zapisane dane pozostają dostępne po usunięciu gry.">
          <p className="text-display-3-bold text-text-primary">{entriesResult.count ?? 0}</p>
          <p className="text-body-2-regular text-text-secondary">zarejestrowanych zgłoszeń</p>
        </AdminCard>
      )}
    </>
  );
}
