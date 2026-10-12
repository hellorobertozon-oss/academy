"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthCard } from "@/components/application/auth/auth-card";
import { TemplateCopyProvider } from "@/components/foundations/template-copy/template-copy";
import { useAcademy, type CopyKey } from "@/components/academy-provider";

const AUTH_COPY: Record<string, string> = {
  Email: "email",
  "Email address": "email",
  "you@company.com": "emailPlaceholder",
  Password: "password",
  "Enter your password": "passwordPlaceholder",
  "Sign in": "signIn",
};

type AcademyLoginCardProps = {
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  showLogo?: boolean;
  centered?: boolean;
};

export function AcademyLoginCard({ headingLevel = 1, className, showLogo = false, centered }: AcademyLoginCardProps) {
  const { t } = useAcademy();
  const router = useRouter();
  const [status, setStatus] = useState("");

  return (
    <>
      <TemplateCopyProvider
        translate={(text) => {
          const key = AUTH_COPY[text] as CopyKey | undefined;
          return key ? t(key) : text;
        }}
      >
        <AuthCard
          mode="signin"
          title={<span className="font-display text-display-2-regular tracking-wide sm:text-display-1-regular">{t("welcomeBack")}</span>}
          description={t("loginDescription")}
          logo={showLogo ? <Image src="/assets/xzone-logo.png" alt="Xzone" width={300} height={90} className="h-28 w-auto brightness-0 object-contain" /> : undefined}
          centered={centered ?? showLogo}
          providers={[]}
          showRemember={false}
          showAccountSwitch={false}
          headingLevel={headingLevel}
          forgotPasswordHref="#forgot-password"
          forgotPasswordLabel={t("forgotPassword")}
          onForgotPassword={() => setStatus(t("recoveryMessage"))}
          inputFieldClassName="min-h-16 rounded-full border-0 bg-auth-input-background px-6 py-4"
          inputLabelClassName="text-title-3-semibold"
          inputClassName="text-title-3-regular text-auth-input-foreground placeholder:text-title-3-regular placeholder:text-auth-input-placeholder"
          submitButtonVariant="secondary"
          submitButtonClassName="h-14 w-full self-end rounded-full border-transparent bg-[#3EDEB6] px-6 text-title-2-semibold text-[#141B4D] shadow-none hover:border-[#2CC69C] hover:bg-[#2CC69C] active:border-[#1A9C7A] active:bg-[#1A9C7A]"
          onSubmit={() => router.push("/dashboard")}
          className={className ?? "max-w-[540px] border-border-button-default bg-background-primary-default p-6 shadow-none sm:p-8"}
        />
      </TemplateCopyProvider>
      <p className="mt-3 min-h-5 text-center text-body-2-regular text-text-secondary" role="status" aria-live="polite">
        {status}
      </p>
    </>
  );
}
