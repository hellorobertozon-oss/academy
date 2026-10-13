import { Suspense, type ReactNode } from "react";
import { requireAcademyProfile } from "@/lib/auth/profile";

async function AcademySession({ children }: { children: ReactNode }) {
  await requireAcademyProfile();
  return children;
}

export default function AcademyLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background-full" />}>
      <AcademySession>{children}</AcademySession>
    </Suspense>
  );
}
