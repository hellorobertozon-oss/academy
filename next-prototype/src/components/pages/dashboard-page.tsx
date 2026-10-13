"use client";

import Link from "next/link";
import Image from "next/image";
import { RiArrowRightLine, RiMapPin2Line } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { useAcademy } from "@/components/academy-provider";
import { RouteButton } from "@/components/route-button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { cx } from "@/utils/cx";

const sections: { href: string; previewHref: string; title: "learning" | "questions"; description: "learningDescription" | "questionsDescription"; image: string }[] = [
  { href: "/learning", previewHref: "/admin/user-preview/learning", title: "learning", description: "learningDescription", image: "/assets/main-learning-v3.png" },
  { href: "/faq", previewHref: "/admin/user-preview/faq", title: "questions", description: "questionsDescription", image: "/assets/main-faq-v3.png" },
];

export function DashboardPage({ isAdmin, previewMode = false }: { isAdmin: boolean; previewMode?: boolean }) {
  const { t } = useAcademy();

  return (
    <div className="relative isolate min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <div className="pointer-events-none absolute inset-x-0 top-28 z-0 h-96 overflow-hidden sm:top-20" aria-hidden="true">
        <Image
          src="/assets/dashboard-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background-full/20 via-background-full/60 to-background-full" />
      </div>
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-8 sm:pt-16">
        {previewMode ? (
          <p className="mb-6 rounded-2xl border border-accent-400/40 bg-background-secondary-default px-5 py-4 text-body-medium text-text-primary">
            {t("userPreviewNotice")}
          </p>
        ) : null}
        <section className="grid gap-8" aria-labelledby="dashboard-heading">
          <div>
            <p className="mb-2 text-body-semibold uppercase tracking-[0.16em] text-accent-300 sm:text-title-3-semibold">
              {t("brand")}
            </p>
            <h1 id="dashboard-heading" className="font-display text-display-3-regular uppercase tracking-wide text-text-primary sm:text-display-1-regular">
              {t("greeting")}
            </h1>
            <p className="mt-3 max-w-3xl text-headline-regular text-text-secondary sm:text-title-3-regular">
              {t("dashboardIntro")}
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-5" aria-label={t("mainMenu")}>
          {sections.map(({ href, previewHref, title, description, image }) => {
            const cardClassName = cx(
              "relative grid grid-cols-1 gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-3 sm:grid-cols-[minmax(260px,38%)_minmax(0,1fr)] sm:items-center sm:gap-6 sm:p-4",
              "group transition-colors duration-150 hover:border-border-button-hover hover:bg-background-primary-hover active:bg-background-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
            );
            const card = (
              <>
                <span className="relative block aspect-video overflow-hidden rounded-2xl bg-background-secondary-default">
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 38vw"
                    className="image-outline object-cover motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover:scale-[1.015]"
                  />
                </span>
                <span className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6" aria-hidden="true">
                  <Image src="/assets/xzone-brand-logo.png" alt="" width={64} height={64} className="size-12 object-contain sm:size-14" />
                </span>
                <span className="flex min-w-0 flex-col py-3 sm:py-6 sm:pr-24">
                  <span className="text-caption-1-semibold uppercase tracking-[0.14em] text-accent-300">{t(title)}</span>
                  <span className="mt-2 text-title-1-medium text-text-primary">{t(description)}</span>
                  <span className="mt-5 flex items-center gap-2 text-title-3-semibold text-accent-300">
                    {t("openSection")}
                    <RiArrowRightLine className="size-5" aria-hidden="true" />
                  </span>
                </span>
              </>
            );

            return <Link key={href} href={previewMode ? previewHref : href} className={cardClassName}>{card}</Link>;
          })}
        </section>

        {isAdmin ? (
          <section className="mt-5 flex flex-col items-start justify-between gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <p className="text-body-medium text-text-primary">{t("adminPanelTitle")}</p>
              <p className="mt-1 text-body-2-regular text-text-secondary">{t("adminPanelDescription")}</p>
            </div>
            <LinkButton href="/admin" size="medium" trailingIcon={RiArrowRightLine}>
              {t("adminPanelOpen")}
            </LinkButton>
          </section>
        ) : null}

        <section className="mt-5 flex flex-col items-start justify-between gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <p className="text-body-medium text-text-primary">{t("finalTest")}</p>
            <p className="mt-1 text-body-2-regular text-text-secondary">{t("quizDescription")}</p>
          </div>
          <RouteButton href={previewMode ? "/admin/user-preview/quiz" : "/quiz"} size="large" trailingIcon={RiArrowRightLine}>
            {t("openQuiz")}
          </RouteButton>
        </section>

        <section className="mt-5 flex flex-col items-start justify-between gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <p className="text-body-medium text-text-primary">{t("storeMapTitle")}</p>
            <p className="mt-1 text-body-2-regular text-text-secondary">{t("storeMapDescription")}</p>
          </div>
          <RouteButton href="/stores" size="large" leadingIcon={RiMapPin2Line} trailingIcon={RiArrowRightLine} disabled={previewMode}>
            {previewMode ? t("previewOnly") : t("storeMapButton")}
          </RouteButton>
        </section>
      </main>
    </div>
  );
}
