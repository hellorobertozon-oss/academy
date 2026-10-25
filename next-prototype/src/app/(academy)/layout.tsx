import { Suspense, type ReactNode } from "react";
import { AcademyLoading } from "@/components/academy-loading";
import { requireAcademyProfile } from "@/lib/auth/profile";

async function AcademySession({ children }: { children: ReactNode }) {
  await requireAcademyProfile();
  return children;
}

export default function AcademyLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AcademyLoading label="Wczytywanie Akademii" withHeader />}>
      <AcademySession>{children}</AcademySession>
    </Suspense>
  );
}
