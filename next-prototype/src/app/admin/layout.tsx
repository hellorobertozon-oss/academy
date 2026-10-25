import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AcademyLoading } from "@/components/academy-loading";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAcademyProfile } from "@/lib/auth/profile";

async function AdminSession({ children }: { children: ReactNode }) {
  const profile = await requireAcademyProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return children;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={(
      <div className="admin-theme">
        <AcademyLoading label="Wczytywanie panelu administratora" fullPage />
      </div>
    )}>
      <AdminSession><AdminShell>{children}</AdminShell></AdminSession>
    </Suspense>
  );
}
