"use client";

import { AcademyHeader } from "@/components/academy-header";
import { AcademyLoginCard } from "@/components/academy-login-card";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="login" />
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col items-center justify-center px-4 py-12 sm:px-8">
        <AcademyLoginCard />
      </main>
    </div>
  );
}
