export type AdminRole = "admin" | "employee";

export type InviteInput = {
  email: string;
  role: AdminRole;
  store_id: number | null;
};

export type StoreInput = {
  name: string;
  street_address: string;
  city: string;
  postal_code: string;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
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

  if (input.role === "admin") {
    return { ok: true, value: { email, role: "admin", store_id: null } };
  }

  const storeId = Number(input.storeId);
  if (!Number.isSafeInteger(storeId) || storeId < 1) {
    return { ok: false, error: "Przypisz pracownika do sklepu." };
  }

  return {
    ok: true,
    value: { email, role: "employee", store_id: storeId },
  };
}

export function parseStoreInput(input: {
  name: unknown;
  streetAddress: unknown;
  city: unknown;
  postalCode: unknown;
  countryCode: unknown;
  latitude: unknown;
  longitude: unknown;
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

  const latitudeText = text(input.latitude);
  const longitudeText = text(input.longitude);
  if (Boolean(latitudeText) !== Boolean(longitudeText)) {
    return { ok: false, error: "Podaj obie współrzędne albo pozostaw je puste." };
  }

  let latitude: number | null = null;
  let longitude: number | null = null;
  if (latitudeText && longitudeText) {
    latitude = Number(latitudeText);
    longitude = Number(longitudeText);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return { ok: false, error: "Współrzędne muszą mieścić się w dozwolonym zakresie." };
    }
  }

  return {
    ok: true,
    value: {
      name,
      street_address: streetAddress,
      city,
      postal_code: postalCode,
      country_code: countryCode,
      latitude,
      longitude,
    },
  };
}
