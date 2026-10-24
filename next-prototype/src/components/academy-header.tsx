"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RiArrowDownSLine } from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import {
  Dropdown,
  DropdownDivider,
  DropdownGroup,
  DropdownItem,
  DropdownPopover,
  DropdownTrigger,
} from "@/components/base/dropdown/dropdown";
import { Select, SelectItem } from "@/components/base/select/select";
import { useAcademy, type AcademyLanguage } from "@/components/academy-provider";
import { ThemeToggle } from "@/components/application/theme/theme-toggle";
import { backActionClassName } from "@/components/route-button";
import { cx } from "@/utils/cx";
import { createAcademyBrowserClient } from "@/lib/supabase/browser";

type HeaderMode = "landing" | "login" | "app";

export function AcademyHeader({
  mode,
  showThemeToggle = false,
  themeToggleClassName,
}: {
  mode: HeaderMode;
  showThemeToggle?: boolean;
  themeToggleClassName?: string;
}) {
  const { language, setLanguage, setPreviewLanguage, t, isAdmin } = useAcademy();
  const router = useRouter();
  const pathname = usePathname();
  const appMode = mode === "app";
  const isUserPreview = pathname.startsWith("/admin/user-preview");
  const isAdminShell = pathname.startsWith("/admin") && !isUserPreview;
  const adminSection = pathname.startsWith("/admin/stores")
    ? "Sklepy"
    : pathname.startsWith("/admin/users")
      ? "Użytkownicy"
      : pathname.startsWith("/admin/courses")
        ? "Szkolenia"
        : pathname.startsWith("/admin/progress")
          ? "Postępy"
          : "Przegląd";
  const themeToggleLabels = {
    group: t("theme"),
    toggle: t("darkModeToggle"),
    lightMode: t("lightMode"),
    darkMode: t("darkMode"),
    useLightMode: t("useLightMode"),
    useDarkMode: t("useDarkMode"),
  };

  async function signOut() {
    try {
      const supabase = createAcademyBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Continue to the public login page if the session has already expired.
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className={cx(
      "relative z-20 border-b backdrop-blur-xl",
      isAdminShell && "sticky top-0",
      mode === "landing"
        ? "border-separator-border/50 bg-background-full/45"
        : isAdminShell
          ? "border-separator-border bg-background-primary-default/95"
          : "border-separator-border bg-background-full/90",
    )}>
      <div className={cx(
        "relative mx-auto flex w-full items-center justify-between",
        isAdminShell ? "max-w-none px-5 sm:px-7" : "max-w-6xl px-4 sm:px-8",
        appMode && isAdminShell
          ? "min-h-16"
          : appMode
            ? "min-h-28 items-start pt-3 sm:min-h-20 sm:items-center sm:pt-0"
            : "min-h-20",
      )}>
        {(mode === "landing" || (appMode && !isAdminShell)) ? (
          <ButtonLink
            href="/targi"
            variant="secondary"
            size="small"
            className="min-h-10 shrink-0 rounded-full px-3"
          >
            <span className="hidden sm:inline">Lista produktów</span>
            <span className="sm:hidden">Produkty</span>
          </ButtonLink>
        ) : null}

        {isAdminShell ? (
          <nav aria-label="Okruszki" className="flex min-w-0 items-center gap-2 text-body-2-regular">
            <Link href="/admin" className="text-text-secondary transition-colors hover:text-text-primary">Panel</Link>
            <span aria-hidden="true" className="text-text-tertiary">/</span>
            <span className="truncate text-body-2-medium text-text-primary">{adminSection}</span>
          </nav>
        ) : null}

        <Link
          href={isUserPreview ? "/admin/user-preview" : appMode ? "/dashboard" : "/"}
          aria-label={t("brand")}
          className={cx(
            "absolute left-1/2 -translate-x-1/2",
            isAdminShell && "hidden",
            appMode ? "top-3 sm:top-1/2 sm:-translate-y-1/2" : "top-1/2 -translate-y-1/2",
          )}
        >
          <Image
            src="/assets/logo-xzone-academy.png"
            alt="Xzone Academy"
            width={1026}
            height={360}
            priority
            className={cx("h-auto w-32 sm:w-40", isAdminShell && "brightness-0 dark:invert")}
          />
        </Link>

        {mode === "login" ? (
          <div className="ml-auto">
            <Button variant="secondary" className={backActionClassName} onClick={() => router.push("/")}>
              {t("backHome")}
            </Button>
          </div>
        ) : null}

        {appMode ? (
          <div className={cx(
            "flex items-center gap-2 sm:gap-4",
            isAdminShell ? "ml-auto" : "absolute bottom-1.5 right-4 sm:static sm:ml-auto",
          )}>
            <Select
              aria-label={t("language")}
              selectedKey={language}
              onSelectionChange={(key) => (isUserPreview ? setPreviewLanguage : setLanguage)(String(key) as AcademyLanguage)}
              triggerClassName="min-h-10 border-0 bg-transparent px-1.5 py-2 text-text-primary shadow-none hover:border-transparent hover:bg-transparent"
              popoverClassName="z-50"
            >
              <SelectItem id="pl">
                <span aria-hidden="true" className="relative size-6 shrink-0 overflow-hidden rounded-full border border-separator-border">
                  <Image src="/assets/flag-pl.svg" alt="" fill sizes="24px" />
                </span>
                <span>{t("polish")}</span>
              </SelectItem>
              <SelectItem id="en">
                <span aria-hidden="true" className="relative size-6 shrink-0 overflow-hidden rounded-full border border-separator-border">
                  <Image src="/assets/flag-en.svg" alt="" fill sizes="24px" />
                </span>
                <span>{t("english")}</span>
              </SelectItem>
              <SelectItem id="de">
                <span aria-hidden="true" className="relative size-6 shrink-0 overflow-hidden rounded-full border border-separator-border">
                  <Image src="/assets/flag-de.svg" alt="" fill sizes="24px" />
                </span>
                <span>{t("german")}</span>
              </SelectItem>
              <SelectItem id="cs">
                <span aria-hidden="true" className="relative size-6 shrink-0 overflow-hidden rounded-full border border-separator-border">
                  <Image src="/assets/flag-cs.svg" alt="" fill sizes="24px" />
                </span>
                <span>{t("czech")}</span>
              </SelectItem>
              <SelectItem id="fr">
                <span aria-hidden="true" className="relative size-6 shrink-0 overflow-hidden rounded-full border border-separator-border">
                  <Image src="/assets/flag-fr.svg" alt="" fill sizes="24px" />
                </span>
                <span>{t("french")}</span>
              </SelectItem>
            </Select>

            <Dropdown>
              <DropdownTrigger
                aria-label={t("profileMenu")}
                className="flex min-h-10 items-center gap-2 rounded-full px-1 py-1 text-text-primary transition-colors hover:bg-transparent focus-visible:ring-2 focus-visible:ring-border-focus-ring"
              >
                <Avatar
                  size="md"
                  initials="K"
                  className="bg-accent-200 text-accent-950"
                />
                <span className="text-body-medium">{t("profile")}</span>
                <RiArrowDownSLine className="size-4 text-text-tertiary" aria-hidden="true" />
              </DropdownTrigger>
              <DropdownPopover
                aria-label={t("profileMenu")}
                placement="bottom end"
                className="z-50"
              >
                <DropdownGroup>
                  <DropdownItem onSelect={() => router.push("/profile")}>
                    {t("profileDetails")}
                  </DropdownItem>
                  {isAdmin ? (
                    <DropdownItem onSelect={() => router.push(isUserPreview ? "/admin" : "/admin/user-preview")}>
                      {t(isUserPreview ? "exitUserPreview" : "previewAsUser")}
                    </DropdownItem>
                  ) : null}
                  <DropdownItem onSelect={() => router.push("/change-password")}>
                    {t("changePassword")}
                  </DropdownItem>
                </DropdownGroup>
                {showThemeToggle ? (
                  <>
                    <DropdownDivider className={themeToggleClassName} />
                    <DropdownGroup label={t("appearance")} className={themeToggleClassName}>
                      <div className="flex items-center justify-between gap-2 rounded-2lg px-2 py-1">
                        <span className="text-body-medium text-text-primary">{t("theme")}</span>
                        <ThemeToggle appearance="segmented" size="small" labels={themeToggleLabels} />
                      </div>
                    </DropdownGroup>
                    <DropdownDivider className={themeToggleClassName} />
                  </>
                ) : null}
                {!showThemeToggle ? <DropdownDivider /> : null}
                <DropdownGroup>
                  <DropdownItem onSelect={() => void signOut()}>
                    {t("logout")}
                  </DropdownItem>
                </DropdownGroup>
              </DropdownPopover>
            </Dropdown>
          </div>
        ) : null}
      </div>
    </header>
  );
}
