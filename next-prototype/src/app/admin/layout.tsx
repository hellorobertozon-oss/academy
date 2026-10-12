import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireAcademyProfile } from "@/lib/auth/profile";

async function AdminSession({ children }: { children: ReactNode }) {
  await connection();
  const profile = await requireAcademyProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return children;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background-full" />}>
      <AdminSession>{children}</AdminSession>
    </Suspense>
  );
}
