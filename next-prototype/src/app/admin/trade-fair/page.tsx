import { RiDownloadLine } from "@remixicon/react";
import { AdminCard, AdminPageHeading } from "@/app/admin/admin-ui";
import { TradeFairSettingsForm } from "@/app/admin/trade-fair-form";
import { LinkButton } from "@/components/base/buttons/link-button";
import { createAcademyServerClient } from "@/lib/supabase/server";
import { DEFAULT_TRADE_FAIR_MEMORY_SETTINGS, parseTradeFairMemorySettings } from "@/lib/trade-fair-memory";

export default async function AdminTradeFairPage() {
  const supabase = await createAcademyServerClient();
  const [settingsResult, entriesResult] = await Promise.all([
    supabase
      .from("academy_settings")
      .select("trade_fair_memory_enabled, trade_fair_memory_time_limit_seconds, trade_fair_prize_type, trade_fair_prize_name, trade_fair_prize_image_url, trade_fair_privacy_notice_url")
      .eq("id", true)
      .maybeSingle(),
    supabase.from("trade_fair_memory_entries").select("id", { count: "exact", head: true }),
  ]);
  const settings = settingsResult.error
    ? DEFAULT_TRADE_FAIR_MEMORY_SETTINGS
    : parseTradeFairMemorySettings(settingsResult.data);

  return (
    <>
      <AdminPageHeading
        section="Targi"
        title="Kiosk targowy"
        description="Skonfiguruj grę Memory, wybierz nagrodę i pobierz listę zgłoszeń uczestników."
        action={(
          <LinkButton href="/admin/trade-fair/export" variant="secondary" leadingIcon={RiDownloadLine}>
            Pobierz zgłoszenia CSV
          </LinkButton>
        )}
      />

      {entriesResult.error ? (
        <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
          Nie udało się wczytać liczby zgłoszeń.
        </div>
      ) : (
        <AdminCard title="Zgłoszenia z targów" description="Eksport zawiera adres e-mail oraz język wybrany przez uczestnika.">
          <p className="text-display-3-bold text-text-primary">{entriesResult.count ?? 0}</p>
          <p className="text-body-2-regular text-text-secondary">zarejestrowanych zgłoszeń</p>
        </AdminCard>
      )}

      {settingsResult.error ? (
        <div role="alert" className="rounded-2xl border border-border-error-default bg-background-primary-default p-4 text-body-regular text-text-error-primary">
          Nie udało się odczytać ustawień gry z projektu Academy.
        </div>
      ) : (
        <TradeFairSettingsForm settings={settings} />
      )}
    </>
  );
}
