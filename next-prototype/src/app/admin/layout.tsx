import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/admin-shell";
import { requireAcademyProfile } from "@/lib/auth/profile";

async function AdminSession({ children }: { children: ReactNode }) {
  const profile = await requireAcademyProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return children;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="admin-theme min-h-screen bg-background-full" />}>
      <AdminSession><AdminShell>{children}</AdminShell></AdminSession>
    </Suspense>
  );
}
