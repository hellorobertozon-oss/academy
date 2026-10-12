import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseOwnProfileInput } from "../src/lib/profile/validation.ts";

describe("employee profile validation", () => {
  it("trims and normalizes names while preserving Unicode and punctuation", () => {
    assert.deepEqual(parseOwnProfileInput({
      firstName: "  Łucja   Maria ",
      lastName: " O'Connor-Smith ",
    }), {
      ok: true,
      value: { first_name: "Łucja Maria", last_name: "O'Connor-Smith" },
    });
  });

  it("requires both names", () => {
    assert.deepEqual(parseOwnProfileInput({ firstName: " ", lastName: "Nowak" }), {
      ok: false,
      reason: "required",
    });
    assert.deepEqual(parseOwnProfileInput({ firstName: "Ola", lastName: "" }), {
      ok: false,
      reason: "required",
    });
  });

  it("rejects non-text values and control characters", () => {
    assert.deepEqual(parseOwnProfileInput({ firstName: 12, lastName: "Nowak" }), {
      ok: false,
      reason: "invalid",
    });
    assert.deepEqual(parseOwnProfileInput({ firstName: "Ola\nAdmin", lastName: "Nowak" }), {
      ok: false,
      reason: "invalid",
    });
  });

  it("limits each name to 80 Unicode characters", () => {
    assert.equal(parseOwnProfileInput({ firstName: "Ł".repeat(80), lastName: "Nowak" }).ok, true);
    assert.deepEqual(parseOwnProfileInput({ firstName: "Ł".repeat(81), lastName: "Nowak" }), {
      ok: false,
      reason: "too-long",
    });
  });
});
