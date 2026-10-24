"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Switch } from "@/components/base/switch/switch";
import { updateTradeFairSettingsAction } from "@/app/admin/trade-fair-actions";
import { INITIAL_ADMIN_ACTION_STATE } from "@/lib/admin/action-state";
import { DEFAULT_TRADE_FAIR_MEMORY_SETTINGS, type TradeFairMemorySettings } from "@/lib/trade-fair-memory";

const TIME_PRESETS = [30, 60, 90, 120, 150, 180, 240, 300, 600];

export function TradeFairSettingsForm({ settings }: { settings: TradeFairMemorySettings }) {
  const [prizeType, setPrizeType] = useState(settings.prizeType);
  const [prizeName, setPrizeName] = useState(settings.prizeName);
  const [prizeImageUrl, setPrizeImageUrl] = useState(settings.prizeImageUrl);
  const [state, formAction, isPending] = useActionState(
    updateTradeFairSettingsAction,
    INITIAL_ADMIN_ACTION_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-title-3-semibold text-text-primary">Gra Memory</h2>
        <p className="text-body-2-regular text-text-secondary">Włącz grę na kiosku, ustaw czas i nagrodę. Na kiosku obsługa może przełączać widok między produktami a grą.</p>
      </div>

      <Switch name="enabled" value="on" defaultSelected={settings.enabled} className="min-h-14 w-full justify-between rounded-xl border border-border-button-default px-4 py-3">
        <span className="flex flex-col text-left">
          <span className="text-body-medium text-text-primary">Przycisk Memory dla gości</span>
          <span className="text-caption-1-regular text-text-secondary">Obsługa zawsze może uruchomić grę z ikony ustawień kiosku po wpisaniu hasła „kiosk”.</span>
        </span>
      </Switch>

      <label className="flex max-w-sm flex-col gap-2 text-body-2-medium text-text-primary">
        Limit czasu na wszystkie 3 poziomy
        <select
          name="timeLimitSeconds"
          defaultValue={settings.timeLimitSeconds}
          className="h-12 rounded-xl border border-border-button-default bg-background-primary-default px-3 text-body-regular outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        >
          {TIME_PRESETS.map((seconds) => <option key={seconds} value={seconds}>{seconds} sekund</option>)}
        </select>
      </label>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-body-2-medium text-text-primary">
          Rodzaj nagrody
          <select
            name="prizeType"
            value={prizeType}
            onChange={(event) => setPrizeType(event.target.value as "gel" | "sticker")}
            className="h-12 rounded-xl border border-border-button-default bg-background-primary-default px-3 text-body-regular outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
          >
            <option value="gel">Żel</option>
            <option value="sticker">Naklejka</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-body-2-medium text-text-primary">
          Nazwa nagrody
          <input
            name="prizeName"
            value={prizeName}
            onChange={(event) => setPrizeName(event.target.value)}
            required
            maxLength={100}
            className="h-12 rounded-xl border border-border-button-default bg-background-primary-default px-3 text-body-regular outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-body-2-medium text-text-primary">
        Zdjęcie nagrody
        <input
          name="prizeImageUrl"
          type="text"
          value={prizeImageUrl}
          onChange={(event) => setPrizeImageUrl(event.target.value)}
          placeholder="https://… albo ścieżka /assets/…"
          maxLength={1000}
          className="h-12 rounded-xl border border-border-button-default bg-background-primary-default px-3 text-body-regular outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        />
        <span className="text-caption-1-regular text-text-tertiary">Wklej adres HTTPS albo ścieżkę do zdjęcia w public/assets.</span>
      </label>

      <label className="flex flex-col gap-2 text-body-2-medium text-text-primary">
        Link do polityki prywatności
        <input
          name="privacyNoticeUrl"
          type="url"
          defaultValue={settings.privacyNoticeUrl || DEFAULT_TRADE_FAIR_MEMORY_SETTINGS.privacyNoticeUrl}
          required
          maxLength={1000}
          className="h-12 rounded-xl border border-border-button-default bg-background-primary-default px-3 text-body-regular outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        />
      </label>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-background-secondary-default p-4">
        <span className="relative block size-24 shrink-0 rounded-xl bg-white p-2">
          <Image src={prizeImageUrl || settings.prizeImageUrl} alt="" fill sizes="96px" className="object-contain p-2" unoptimized />
        </span>
        <div>
          <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">Podgląd nagrody</p>
          <p className="mt-1 text-body-semibold text-text-primary">{prizeName || settings.prizeName}</p>
          <p className="text-body-2-regular text-text-secondary">{prizeType === "gel" ? "Żel" : "Naklejka"}</p>
        </div>
      </div>

      {state.status !== "idle" ? (
        <p role={state.status === "error" ? "alert" : "status"} aria-live="polite" className={state.status === "error" ? "text-body-2-medium text-text-error-primary" : "text-body-2-medium text-text-secondary"}>
          {state.status === "error"
            ? state.message === "invalid_value" ? "Sprawdź ustawienia nagrody, czasu i linków." : "Nie udało się zapisać ustawień."
            : "Ustawienia zapisane."}
        </p>
      ) : null}
      <Button type="submit" variant="primary" size="large" disabled={isPending} className="min-h-12 self-start">
        {isPending ? "Zapisywanie…" : "Zapisz ustawienia gry"}
      </Button>
    </form>
  );
}
