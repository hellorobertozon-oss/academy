export type AdminRole = "admin" | "employee";
export const INVITE_LANGUAGES = ["pl", "en", "de", "cs", "fr", "it"] as const;
export type InviteLanguage = (typeof INVITE_LANGUAGES)[number];

export type InviteInput = {
  email: string;
  role: AdminRole;
  store_id: number | null;
  preferred_language: InviteLanguage;
};

export type StoreInput = {
  name: string;
  street_address: string;
  city: string;
  postal_code: string;
  country_code: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseInviteInput(input: {
  email: unknown;
  role: unknown;
  storeId: unknown;
  preferredLanguage: unknown;
}): ValidationResult<InviteInput> {
  const email = text(input.email).toLowerCase();
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { ok: false, error: "Podaj poprawny adres e-mail." };
  }

  if (input.role !== "admin" && input.role !== "employee") {
    return { ok: false, error: "Wybierz prawidłową rolę." };
  }

  const preferredLanguage = text(input.preferredLanguage || "pl");
  if (!INVITE_LANGUAGES.includes(preferredLanguage as InviteLanguage)) {
    return { ok: false, error: "Wybierz prawidłowy język zaproszenia." };
  }

  if (input.role === "admin") {
    return {
      ok: true,
      value: {
        email,
        role: "admin",
        store_id: null,
        preferred_language: preferredLanguage as InviteLanguage,
      },
    };
  }

  const storeId = Number(input.storeId);
  if (!Number.isSafeInteger(storeId) || storeId < 1) {
    return { ok: false, error: "Przypisz pracownika do sklepu." };
  }

  return {
    ok: true,
    value: {
      email,
      role: "employee",
      store_id: storeId,
      preferred_language: preferredLanguage as InviteLanguage,
    },
  };
}

export function parseStoreInput(input: {
  name: unknown;
  streetAddress: unknown;
  city: unknown;
  postalCode: unknown;
  countryCode: unknown;
}): ValidationResult<StoreInput> {
  const name = text(input.name);
  const streetAddress = text(input.streetAddress);
  const city = text(input.city);
  const postalCode = text(input.postalCode);
  const countryCode = text(input.countryCode).toUpperCase();

  if (!name || !streetAddress || !city || !postalCode) {
    return { ok: false, error: "Uzupełnij nazwę i pełny adres sklepu." };
  }
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return { ok: false, error: "Kod kraju musi składać się z dwóch liter, np. PL." };
  }

  return {
    ok: true,
    value: {
      name,
      street_address: streetAddress,
      city,
      postal_code: postalCode,
      country_code: countryCode,
    },
  };
}
