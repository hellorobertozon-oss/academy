"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  RiBankLine,
  RiBarChartBoxLine,
  RiBookOpenLine,
  RiGroupLine,
  RiGamepadLine,
  RiHomeLine,
} from "@remixicon/react";
import type { ReactNode } from "react";
import { AcademyHeader } from "@/components/academy-header";
import { useAcademy } from "@/components/academy-provider";
import { applyTheme, THEME_STORAGE_KEY, ThemeToggle, type ThemeMode } from "@/components/application/theme/theme-toggle";
import {
  DashboardSidebar,
  type DashboardNavItem,
} from "@/components/application/dashboard/dashboard-sidebar";
import { cx } from "@/utils/cx";

const adminNavigation: DashboardNavItem[] = [
  { key: "overview", label: "Przegląd", icon: RiHomeLine, href: "/admin" },
  { key: "stores", label: "Sklepy", icon: RiBankLine, href: "/admin/stores" },
  { key: "users", label: "Użytkownicy", icon: RiGroupLine, href: "/admin/users" },
  { key: "training", label: "Szkolenia", icon: RiBookOpenLine, href: "/admin/courses" },
  { key: "progress", label: "Postępy", icon: RiBarChartBoxLine, href: "/admin/progress" },
  { key: "trade-fair", label: "Targi", icon: RiGamepadLine, href: "/admin/trade-fair" },
];

function selectedNavigation(pathname: string) {
  if (pathname.startsWith("/admin/stores")) return "stores";
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/courses")) return "training";
  if (pathname.startsWith("/admin/progress")) return "progress";
  if (pathname.startsWith("/admin/trade-fair")) return "trade-fair";
  return "overview";
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/admin"
      aria-label="Xzone Academy, panel administratora"
      className={cx(
        "flex min-w-0 items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
        collapsed ? "size-9 justify-center" : "w-full px-1 py-1",
      )}
    >
      <span className="relative block size-9 shrink-0 overflow-hidden rounded-full bg-background-primary-default">
        <Image src="/assets/xzone-brand-logo.png" alt="" fill sizes="36px" className="object-contain p-1 brightness-0 dark:invert" />
      </span>
      {!collapsed ? (
        <span className="flex min-w-0 flex-col">
          <span className="text-body-medium text-text-primary">Xzone Academy</span>
          <span className="text-caption-1-regular text-text-secondary">Panel administratora</span>
        </span>
      ) : null}
    </Link>
  );
}

function MobileNavigation({ pathname }: { pathname: string }) {
  const selected = selectedNavigation(pathname);
  return (
    <nav aria-label="Nawigacja administratora" className="flex gap-1 overflow-x-auto border-b border-separator-border px-4 py-2 lg:hidden">
      {adminNavigation.map((item) => {
        const Icon = item.icon;
        const isSelected = selected === item.key;
        return (
          <Link
            key={item.key}
            href={item.href ?? "/admin"}
            aria-current={isSelected ? "page" : undefined}
            className={cx(
              "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-caption-1-semibold transition-colors",
              isSelected
                ? "bg-accent-100 text-accent-900"
                : "text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useAcademy();
  const isAdminPanel = pathname.startsWith("/admin") && !pathname.startsWith("/admin/user-preview");
  const themeToggleLabels = {
    group: t("theme"),
    toggle: t("darkModeToggle"),
    lightMode: t("lightMode"),
    darkMode: t("darkMode"),
    useLightMode: t("useLightMode"),
    useDarkMode: t("useDarkMode"),
  };

  useEffect(() => {
    let savedTheme: ThemeMode = "light";
    try {
      savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
    } catch {
      // The admin panel uses light mode when browser storage is unavailable.
    }
    applyTheme(isAdminPanel && savedTheme !== "dark" ? "light" : "dark", { persist: false });

    return () => {
      if (window.location.pathname !== pathname) applyTheme("dark", { persist: false });
    };
  }, [isAdminPanel, pathname]);

  if (pathname.startsWith("/admin/user-preview")) return children;

  return (
    <div className="admin-theme min-h-screen bg-background-secondary-default text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-[1800px] gap-5 p-3 sm:p-5">
        <aside className="hidden w-fit shrink-0 lg:block">
          <div className="sticky top-4 h-[calc(100dvh-2rem)] min-h-[440px]">
            <DashboardSidebar
              className="h-full border-separator-border"
              selected={selectedNavigation(pathname)}
              items={adminNavigation}
              showQuickSearch={false}
              headerSlot={(collapsed) => <Brand collapsed={collapsed} />}
              footerSlot={(collapsed) => (
                <div className="flex w-full flex-col gap-2 border-t border-separator-border px-2 pt-3">
                  {collapsed ? (
                    <ThemeToggle collapsed labels={themeToggleLabels} />
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-body-2-medium text-text-secondary">{t("appearance")}</span>
                      <ThemeToggle appearance="segmented" size="small" labels={themeToggleLabels} />
                    </div>
                  )}
                  {!collapsed ? (
                    <div className="flex items-center gap-2 text-caption-1-regular text-text-tertiary">
                      <span className="size-2 rounded-full bg-accent-500" aria-hidden="true" />
                      Panel administratora
                    </div>
                  ) : null}
                </div>
              )}
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col rounded-3xl border border-border-button-default bg-background-secondary-default">
          <AcademyHeader mode="app" showThemeToggle themeToggleClassName="lg:hidden" />
          <MobileNavigation pathname={pathname} />
          <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-7 px-4 py-7 sm:px-8 sm:py-9">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
