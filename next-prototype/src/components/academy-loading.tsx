export function AcademyLoading({ label = "Wczytywanie Xzone Academy" }: { label?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background-full" role="status">
      <span className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">
        {label}
      </span>
    </main>
  );
}
