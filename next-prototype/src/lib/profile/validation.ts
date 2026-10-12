export type OwnProfileInput = {
  first_name: string;
  last_name: string;
};

export type OwnProfileParseResult =
  | { ok: true; value: OwnProfileInput }
  | { ok: false; reason: "required" | "too-long" | "invalid" };

const MAX_NAME_LENGTH = 80;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/u;

function normalizeName(value: unknown): string | null {
  if (typeof value !== "string" || CONTROL_CHARACTERS.test(value)) return null;
  return value.trim().replace(/\s+/gu, " ");
}

export function parseOwnProfileInput(input: {
  firstName: unknown;
  lastName: unknown;
}): OwnProfileParseResult {
  const firstName = normalizeName(input.firstName);
  const lastName = normalizeName(input.lastName);
  if (firstName === null || lastName === null) return { ok: false, reason: "invalid" };
  if (!firstName || !lastName) return { ok: false, reason: "required" };
  if (Array.from(firstName).length > MAX_NAME_LENGTH || Array.from(lastName).length > MAX_NAME_LENGTH) {
    return { ok: false, reason: "too-long" };
  }

  return {
    ok: true,
    value: { first_name: firstName, last_name: lastName },
  };
}
