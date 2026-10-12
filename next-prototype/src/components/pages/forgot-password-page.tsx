"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AcademyHeader } from "@/components/academy-header";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useAcademy } from "@/components/academy-provider";
import { createAcademyBrowserClient } from "@/lib/supabase/browser";

export function ForgotPasswordPage() {
  const { t } = useAcademy();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    setIsSubmitting(true);
    setStatus("");

    try {
      const supabase = createAcademyBrowserClient();
      const redirectTo = new URL("/auth/confirm", window.location.origin);
      redirectTo.searchParams.set("next", "/change-password");

      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo.toString(),
      });
      setStatus(t("resetLinkSent"));
    } catch {
      setStatus(t("loginConfigurationError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="login" />
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col items-center justify-center px-4 py-12 sm:px-8">
        <section className="w-full max-w-lg rounded-3xl border border-border-button-default bg-background-primary-default p-6 sm:p-8">
          <h1 className="font-display text-display-3-regular uppercase tracking-wide text-text-primary">
            {t("forgotPasswordTitle")}
          </h1>
          <p className="mt-3 text-body-regular text-text-secondary">
            {t("forgotPasswordDescription")}
          </p>
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4" aria-busy={isSubmitting}>
            <Input
              size="large"
              name="email"
              type="email"
              label={t("email")}
              autoComplete="email"
              isRequired
            />
            <Button size="large" type="submit" disabled={isSubmitting} className="w-full">
              {t("sendResetLink")}
            </Button>
            <p className="min-h-5 text-body-2-regular text-text-secondary" role="status" aria-live="polite">
              {status}
            </p>
          </form>
          <Button
            variant="secondary"
            className="mt-3 w-full"
            onClick={() => router.push("/login")}
          >
            {t("backToLogin")}
          </Button>
        </section>
      </main>
    </div>
  );
}

