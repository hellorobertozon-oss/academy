import { cx } from "@/utils/cx";

export function AcademySkeletonBlock({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "block rounded-md bg-background-tertiary-default motion-safe:animate-pulse",
        className,
      )}
    />
  );
}
