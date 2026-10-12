"use client";

import { useState, type FormEvent } from "react";
import { RiArrowLeftLine } from "@remixicon/react";
import { AcademyHeader } from "@/components/academy-header";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useAcademy } from "@/components/academy-provider";
import { backActionClassName } from "@/components/route-button";
import { useRouter } from "next/navigation";

export function ChangePasswordPage() {
  const { t } = useAcademy();
  const router = useRouter();
  const [status, setStatus] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get("new-password") ?? "");
    const repeated = String(values.get("repeat-password") ?? "");
    setStatus(password === repeated ? t("passwordUnavailable") : t("passwordMismatch"));
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
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <Input size="large" name="current-password" type="password" label={t("currentPassword")} autoComplete="current-password" isRequired />
            <Input size="large" name="new-password" type="password" label={t("newPassword")} autoComplete="new-password" isRequired />
            <Input size="large" name="repeat-password" type="password" label={t("repeatPassword")} autoComplete="new-password" isRequired />
            <Button size="large" type="submit" className="mt-2 w-full">{t("savePassword")}</Button>
            <p className="min-h-5 text-body-2-regular text-text-secondary" role="status" aria-live="polite">{status}</p>
          </form>
        </section>
      </main>
    </div>
  );
}
