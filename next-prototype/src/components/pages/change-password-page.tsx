"use client";

import { useState, type FormEvent } from "react";
import { RiArrowLeftLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useAcademy } from "@/components/academy-provider";
import { backActionClassName } from "@/components/route-button";
import { useRouter } from "next/navigation";
import { createAcademyBrowserClient } from "@/lib/supabase/browser";

export function ChangePasswordPage() {
  const { t } = useAcademy();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const values = new FormData(event.currentTarget);
    const password = String(values.get("new-password") ?? "");
    const repeated = String(values.get("repeat-password") ?? "");

    if (password.length < 8) {
      setStatus(t("passwordTooShort"));
      return;
    }
    if (password !== repeated) {
      setStatus(t("passwordMismatch"));
      return;
    }

    setIsSubmitting(true);
    setStatus("");
    try {
      const supabase = createAcademyBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setStatus(t("passwordSaveError"));
        return;
      }
      setStatus(t("passwordSaved"));
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .maybeSingle();
      const needsProfileSetup = !profile?.first_name?.trim() || !profile.last_name?.trim();
      router.replace(needsProfileSetup ? "/profile" : "/dashboard");
      router.refresh();
    } catch {
      setStatus(t("loginConfigurationError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <Button variant="secondary" className={backActionClassName} leadingIcon={RiArrowLeftLine} onClick={() => router.push("/dashboard")}>
          {t("backToDashboard")}
        </Button>
        <section className="mx-auto mt-8 max-w-lg rounded-3xl border border-border-button-default bg-background-primary-default p-6 sm:p-8">
          <h1 className="font-display text-display-3-regular uppercase tracking-wide text-text-primary">{t("changePassword")}</h1>
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4" aria-busy={isSubmitting}>
            <Input size="large" name="new-password" type="password" label={t("newPassword")} autoComplete="new-password" isRequired />
            <Input size="large" name="repeat-password" type="password" label={t("repeatPassword")} autoComplete="new-password" isRequired />
            <Button size="large" type="submit" disabled={isSubmitting} className="mt-2 w-full">{t("savePassword")}</Button>
            <p className="min-h-5 text-body-2-regular text-text-secondary" role="status" aria-live="polite">{status}</p>
          </form>
        </section>
      </main>
    </div>
  );
}
