export function safeLocalRedirectPath(value: string | null, fallback = "/dashboard") {
  if (!value) return fallback;

  try {
    const base = new URL("https://academy.invalid");
    const parsed = new URL(value, base);
    if (parsed.origin !== base.origin || !parsed.pathname.startsWith("/")) {
      return fallback;
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}

