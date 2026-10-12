import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseInviteInput,
  parseStoreInput,
} from "../src/lib/admin/validation.ts";

describe("admin invite validation", () => {
  it("normalizes email and requires an employee store", () => {
    const result = parseInviteInput({
      email: "  KASIA@EXAMPLE.COM ",
      role: "employee",
      storeId: "12",
    });

    assert.deepEqual(result, {
      ok: true,
      value: {
        email: "kasia@example.com",
        role: "employee",
        store_id: 12,
      },
    });
  });

  it("does not accept a missing store for employees", () => {
    const result = parseInviteInput({
      email: "kasia@example.com",
      role: "employee",
      storeId: "",
    });

    assert.equal(result.ok, false);
  });

  it("never accepts a store assignment for an administrator", () => {
    const result = parseInviteInput({
      email: "admin@example.com",
      role: "admin",
      storeId: "12",
    });

    assert.deepEqual(result, {
      ok: true,
      value: { email: "admin@example.com", role: "admin", store_id: null },
    });
  });
});

describe("store validation", () => {
  const baseStore = {
    name: " Xzone Warszawa ",
    streetAddress: "Marszałkowska 1",
    city: "Warszawa",
    postalCode: "00-001",
    countryCode: "pl",
    latitude: "52.2297",
    longitude: "21.0122",
  };

  it("normalizes fields and accepts valid coordinates", () => {
    const result = parseStoreInput(baseStore);
    assert.equal(result.ok, true);
    assert.equal(result.value.name, "Xzone Warszawa");
    assert.equal(result.value.country_code, "PL");
    assert.equal(result.value.latitude, 52.2297);
  });

  it("rejects partial or out-of-range coordinates", () => {
    assert.equal(
      parseStoreInput({ ...baseStore, longitude: "" }).ok,
      false,
    );
    assert.equal(
      parseStoreInput({ ...baseStore, latitude: "91" }).ok,
      false,
    );
  });
});
