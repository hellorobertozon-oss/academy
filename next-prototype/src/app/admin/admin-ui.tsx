import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

export function AdminPageHeading({
  section,
  title,
  description,
  action,
}: {
  section?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3">
        {section ? (
          <p className="inline-flex w-fit items-center rounded-full bg-accent-100 px-3 py-1 text-caption-1-semibold text-accent-900">{section}</p>
        ) : null}
        <h1 className="text-title-1-semibold text-text-primary">{title}</h1>
        <p className="max-w-3xl text-body-regular text-text-secondary">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function AdminCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("flex min-w-0 flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-title-3-semibold text-text-primary">{title}</h2>
        {description ? <p className="text-body-2-regular text-text-secondary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
