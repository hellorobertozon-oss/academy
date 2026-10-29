import { Suspense } from "react";
import { headers } from "next/headers";
import { LandingPage } from "@/components/pages/landing-page";
import { KioskAutoLogin } from "@/components/kiosk-auto-login";
import { isAcademyKioskAutoLoginEnabled } from "@/lib/auth/kiosk";

export default function Page() {
  return (
    <Suspense fallback={<LandingPage />}>
      <LandingOrKiosk />
    </Suspense>
  );
}

async function LandingOrKiosk() {
  await headers();
  return (
    <KioskAutoLogin enabled={isAcademyKioskAutoLoginEnabled()}>
      <LandingPage />
    </KioskAutoLogin>
  );
}
