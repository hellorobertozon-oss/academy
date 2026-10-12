"use client";

import { useActionState } from "react";
import { AcademyHeader } from "@/components/academy-header";
import { useAcademy } from "@/components/academy-provider";
import { Button } from "@/components/base/buttons/button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Input } from "@/components/base/input/input";
import { updateOwnProfileAction } from "@/app/(academy)/profile/actions";
import { INITIAL_PROFILE_ACTION_STATE } from "@/lib/profile/action-state";

type StoreProfileDetails = {
  name: string;
  street_address: string;
  city: string;
  postal_code: string;
  country_code: string;
};

export function ProfileSettings({
  firstName,
  lastName,
  email,
  role,
  store,
  hasStoreError,
}: {
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "employee";
  store: StoreProfileDetails | null;
  hasStoreError: boolean;
}) {
  const { t } = useAcademy();
  const [state, action, isPending] = useActionState(updateOwnProfileAction, INITIAL_PROFILE_ACTION_STATE);
  const backHref = role === "admin" ? "/admin" : "/dashboard";
  const backLabel = role === "admin" ? t("backToAdmin") : t("backToDashboard");

  return (
    <div className="min-h-screen bg-background-full">
      <AcademyHeader mode="app" />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-8">
        <header className="flex flex-col gap-2">
          <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">{t("brand")}</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-display-3-regular uppercase tracking-wide text-text-primary">
                {t("profileTitle")}
              </h1>
              <p className="mt-2 max-w-3xl text-body-regular text-text-secondary">{t("profileDescription")}</p>
            </div>
            <LinkButton href={backHref} variant="secondary">{backLabel}</LinkButton>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <section className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6">
            <header className="flex flex-col gap-1">
              <h2 className="text-title-3-semibold text-text-primary">{t("profilePersonalDetails")}</h2>
              <p className="text-body-2-regular text-text-secondary">{t("profileNameDescription")}</p>
            </header>

            <dl className="flex flex-col gap-1 rounded-2xl bg-background-secondary-default p-4">
              <dt className="text-caption-1-semibold text-text-tertiary">{t("email")}</dt>
              <dd className="text-body-medium text-text-primary"><bdi dir="ltr">{email}</bdi></dd>
            </dl>

            <form action={action} className="flex flex-col gap-4">
              <Input
                name="first_name"
                label={t("firstName")}
                autoComplete="given-name"
                defaultValue={firstName}
                maxLength={80}
                isRequired
              />
              <Input
                name="last_name"
                label={t("lastName")}
                autoComplete="family-name"
                defaultValue={lastName}
                maxLength={80}
                isRequired
              />
              {state.message ? (
                <p
                  role={state.status === "error" ? "alert" : "status"}
                  aria-live="polite"
                  className={state.status === "error" ? "text-body-2-medium text-text-error-primary" : "text-body-2-medium text-text-secondary"}
                >
                  {t(state.message)}
                </p>
              ) : null}
              <Button type="submit" disabled={isPending} className="self-start">
                {isPending ? t("profileSaving") : t("profileSave")}
              </Button>
            </form>
          </section>

          {role === "employee" ? (
            <section className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6">
              <header className="flex flex-col gap-1">
                <h2 className="text-title-3-semibold text-text-primary">{t("assignedStore")}</h2>
                <p className="text-body-2-regular text-text-secondary">{t("assignedStoreDescription")}</p>
              </header>
              {hasStoreError ? (
                <p role="alert" className="text-body-2-regular text-text-error-primary">{t("assignedStoreLoadError")}</p>
              ) : store ? (
                <div className="flex flex-col gap-2 rounded-2xl bg-background-secondary-default p-4">
                  <p className="text-body-medium text-text-primary">{store.name}</p>
                  <address className="text-body-2-regular text-text-secondary not-italic">
                    {store.street_address}<br />
                    {store.postal_code} {store.city}<br />
                    {store.country_code}
                  </address>
                </div>
              ) : (
                <p className="text-body-2-regular text-text-secondary">{t("noAssignedStore")}</p>
              )}
              <LinkButton href="/stores" variant="secondary" className="self-start">
                {t("storeMapButton")}
              </LinkButton>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
