"use client";

import Image from "next/image";
import { AcademyLoginCard } from "@/components/academy-login-card";
import { ShaderBackground } from "@/components/ui/adisyon-shader";
import { useAcademy } from "@/components/academy-provider";

// Temporary login-only visual preview. Set to false to restore the plain Xzone background.
const ENABLE_LOGIN_SHADER_PREVIEW = false;

export function LandingPage() {
  const { t } = useAcademy();

  return (
    <div className="xzone-auth-reference relative isolate min-h-screen overflow-hidden bg-background-full">
      {ENABLE_LOGIN_SHADER_PREVIEW ? (
        <>
          <ShaderBackground className="absolute inset-0 z-0 opacity-100" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-background-full/35 via-background-full/10 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[2] bg-black/20"
          />
        </>
      ) : null}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-6 pt-0">
        <Image
          src="/assets/xzone-logo.png"
          alt="Xzone"
          width={300}
          height={90}
          priority
          className="h-28 w-auto brightness-0 invert object-contain"
        />
      </header>
      <main className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1600px] bg-transparent lg:grid-cols-[minmax(360px,0.88fr)_minmax(0,1.12fr)]">
        <section className="flex items-center justify-center px-6 pb-10 pt-32 sm:px-12 lg:px-16" aria-label={t("signIn")}>
          <AcademyLoginCard
            className="w-full max-w-[540px] rounded-none border-0 bg-transparent p-0 shadow-none dark:bg-transparent"
          />
        </section>
        <section className="relative min-h-[58svh] overflow-hidden bg-transparent lg:min-h-screen">
          <Image
            src="/assets/login-page-right-column-v5.png"
            alt="Przedstawicielka prezentuje zestaw Xzone do detailingu motocykla"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 56vw"
            className="object-contain object-bottom origin-center scale-[1.08] translate-y-[5vh] lg:origin-bottom lg:scale-[1.188] lg:translate-y-[20vh]"
            style={{ filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.64)) drop-shadow(0 64px 104px rgba(0,0,0,0.5))" }}
          />
        </section>
      </main>
    </div>
  );
}
