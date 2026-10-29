"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function KioskAutoLogin({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || started.current) return;

    const currentUrl = new URL(window.location.href);
    const next = currentUrl.searchParams.get("next") ?? "";
    if (
      currentUrl.searchParams.has("kiosk_attempted") ||
      next.includes("kiosk_attempted=1")
    ) {
      setFailed(true);
      return;
    }

    started.current = true;
    void fetch("/api/kiosk/auto-login", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Kiosk sign-in failed.");
        window.location.replace("/dashboard?kiosk_attempted=1");
      })
      .catch(() => {
        window.location.replace("/login?reason=kiosk-auto-login&kiosk_attempted=1");
      });
  }, [enabled]);

  if (!enabled || failed) return children;

  return (
    <main className="grid min-h-screen place-items-center bg-background-full px-6">
      <p role="status" className="text-body-medium text-text-secondary">
        Trwa logowanie do Akademii...
      </p>
    </main>
  );
}
