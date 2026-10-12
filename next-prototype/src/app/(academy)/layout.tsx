import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { requireAcademyProfile } from "@/lib/auth/profile";

async function AcademySession({ children }: { children: ReactNode }) {
  await connection();
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

