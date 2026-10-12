"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiArrowDownSLine } from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import {
  Dropdown,
  DropdownDivider,
  DropdownGroup,
  DropdownItem,
  DropdownPopover,
  DropdownTrigger,
} from "@/components/base/dropdown/dropdown";
import { Select, SelectItem } from "@/components/base/select/select";
import { useAcademy } from "@/components/academy-provider";
import { backActionClassName } from "@/components/route-button";
import { cx } from "@/utils/cx";
import { createAcademyBrowserClient } from "@/lib/supabase/browser";

type HeaderMode = "landing" | "login" | "app";

export function AcademyHeader({ mode }: { mode: HeaderMode }) {
  const { language, setLanguage, t } = useAcademy();
  const router = useRouter();
  const appMode = mode === "app";

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
      mode === "landing"
        ? "border-separator-border/50 bg-background-full/45"
        : "border-separator-border bg-background-full/90",
    )}>
      <div className={cx(
        "relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-8",
        appMode ? "min-h-28 items-start pt-3 sm:min-h-20 sm:items-center sm:pt-0" : "min-h-20",
      )}>
        {appMode ? <span className="min-w-0 flex-1" aria-hidden="true" /> : null}

        <Link
          href={appMode ? "/dashboard" : "/"}
          aria-label={t("brand")}
          className={cx(
            "absolute left-1/2 -translate-x-1/2",
            appMode ? "top-3 sm:top-1/2 sm:-translate-y-1/2" : "top-1/2 -translate-y-1/2",
          )}
        >
          <Image
            src="/assets/xzone-logo.png"
            alt="Xzone"
            width={180}
            height={53}
            priority
            className="h-auto w-32 sm:w-40"
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
          <div className="absolute bottom-1.5 right-4 flex items-center gap-2 sm:static sm:ml-auto sm:gap-4">
            <Select
              aria-label={t("language")}
              selectedKey={language}
              onSelectionChange={(key) => setLanguage(String(key) as "pl" | "en")}
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
                  <DropdownItem onSelect={() => router.push("/change-password")}>
                    {t("changePassword")}
                  </DropdownItem>
                  <DropdownDivider />
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
