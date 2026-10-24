"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { useAcademy } from "@/components/academy-provider";
import { CustomerAdviceGame } from "@/components/pages/customer-advice-game";
import { backActionClassName, RouteButton } from "@/components/route-button";
import { cx } from "@/utils/cx";

const gamePreviewImage = "/assets/customer-advisor-game-preview.png";

export function GamesPage({ previewMode = false }: { previewMode?: boolean }) {
  const { t } = useAcademy();

  return (
    <div className="relative isolate min-h-screen bg-background-full">
      {previewMode ? (
        <div role="note" className="relative z-30 bg-accent-300 px-4 py-1.5 text-center text-body-2-semibold text-accent-950 sm:px-8">
          <p className="mx-auto max-w-6xl">{t("userPreviewNotice")}</p>
        </div>
      ) : null}
      <AcademyHeader mode="app" />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <RouteButton
          href={previewMode ? "/admin/user-preview" : "/dashboard"}
          size="large"
          variant="secondary"
          leadingIcon={RiArrowLeftLine}
          className={cx(backActionClassName, "mb-8")}
        >
          {t("backToDashboard")}
        </RouteButton>

        <header className="mb-8">
          <p className="mb-2 text-caption-1-semibold uppercase tracking-[0.16em] text-accent-300">{t("games")}</p>
          <h1 className="font-display text-display-2-regular uppercase tracking-wide text-text-primary">{t("gamesPageTitle")}</h1>
          <p className="mt-3 max-w-3xl text-headline-regular text-text-secondary">{t("gamesPageDescription")}</p>
        </header>

        <section aria-label={t("gamesPageTitle")} className="grid gap-5">
          <Link
            href={previewMode ? "/admin/user-preview/games/customer-advice" : "/games/customer-advice"}
            className={cx(
              "group relative grid w-full grid-cols-1 gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-3 transition-colors duration-150 hover:border-border-button-hover hover:bg-background-primary-hover active:bg-background-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
              "sm:grid-cols-[minmax(260px,42%)_minmax(0,1fr)] sm:items-center sm:gap-6 sm:p-4",
            )}
          >
            <span className="relative block aspect-video overflow-hidden rounded-2xl bg-background-secondary-default">
              <Image
                src={gamePreviewImage}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 42vw"
                className="image-outline object-cover motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover:scale-[1.015]"
              />
            </span>
            <span className="flex min-w-0 flex-col items-start py-3 sm:px-2 sm:py-6 sm:pe-5">
              <span role="heading" aria-level={2} className="text-title-1-medium text-text-primary">
                {t("customerAdviceGame")}
              </span>
              <span className="mt-2 max-w-2xl text-body-regular text-text-secondary">
                {t("customerAdviceGameDescription")}
              </span>
              <span className="mt-5 flex items-center gap-2 text-title-3-semibold text-accent-300">
                {t("gamePreview")}
                <RiArrowRightLine className="size-5" aria-hidden="true" />
              </span>
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}

export function CustomerAdviceGamePage({ previewMode = false }: { previewMode?: boolean }) {
  const { t } = useAcademy();
  const pathname = usePathname();
  const [gameSessionKey, setGameSessionKey] = useState(0);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    setGameSessionKey((current) => current + 1);
  }, [pathname]);

  return (
    <div className="dark relative isolate min-h-screen bg-background-full">
      {previewMode ? (
        <div role="note" className="relative z-30 bg-accent-300 px-4 py-1.5 text-center text-body-2-semibold text-accent-950 sm:px-8">
          <p className="mx-auto max-w-6xl">{t("userPreviewNotice")}</p>
        </div>
      ) : null}
      <AcademyHeader mode="app" />
      <main className="relative z-10 pb-5 pt-4 sm:pb-6 sm:pt-5">
        <div className="mx-auto mb-2 w-full max-w-[1640px] px-3 sm:mb-3 sm:px-6 lg:px-8">
        <RouteButton
          href={previewMode ? "/admin/user-preview/games" : "/games"}
          size="large"
          variant="secondary"
          leadingIcon={RiArrowLeftLine}
          className={cx(backActionClassName, "mb-5")}
          onClick={() => setGameSessionKey((current) => current + 1)}
        >
          {t("gameBackToList")}
        </RouteButton>
        </div>
        <CustomerAdviceGame key={gameSessionKey} />
      </main>
    </div>
  );
}
