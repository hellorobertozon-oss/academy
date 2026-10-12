export const ACADEMY_SUPABASE_PROJECT_REF = "aslzogstpyppmbdhvuss";
export const ACADEMY_SUPABASE_URL = "https://" + ACADEMY_SUPABASE_PROJECT_REF + ".supabase.co";

export type AcademySupabaseConfig = {
  url: string;
  publishableKey: string;
};

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

export function parseAcademySupabaseConfig(
  url: string | undefined,
  publishableKey: string | undefined,
): AcademySupabaseConfig | null {
  if (!url && !publishableKey) return null;

  if (!url || !publishableKey) {
    throw new SupabaseConfigurationError(
      "Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new SupabaseConfigurationError("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
  }

  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.hostname !== ACADEMY_SUPABASE_PROJECT_REF + ".supabase.co" ||
    parsedUrl.username !== "" ||
    parsedUrl.password !== "" ||
    parsedUrl.port !== "" ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new SupabaseConfigurationError(
      "This app only connects to the Academy Supabase project.",
    );
  }

  return { url: parsedUrl.origin, publishableKey };
}

export function getAcademySupabaseConfig(): AcademySupabaseConfig | null {
  return parseAcademySupabaseConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

