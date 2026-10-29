import { Suspense } from "react";
import { headers } from "next/headers";
import { LoginPage } from "@/components/pages/login-page";
import { KioskAutoLogin } from "@/components/kiosk-auto-login";
import { isAcademyKioskAutoLoginEnabled } from "@/lib/auth/kiosk";

export default function Page() {
  return (
    <Suspense fallback={<LoginPage />}>
      <LoginOrKiosk />
    </Suspense>
  );
}

async function LoginOrKiosk() {
  await headers();
  return (
    <KioskAutoLogin enabled={isAcademyKioskAutoLoginEnabled()}>
      <LoginPage />
    </KioskAutoLogin>
  );
}
