import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeLocalRedirectPath } from "../src/lib/auth/redirect.ts";
import {
  ACADEMY_SUPABASE_PROJECT_REF,
  parseAcademySupabaseConfig,
  SupabaseConfigurationError,
} from "../src/lib/supabase/config.ts";

describe("Academy Supabase configuration", () => {
  it("allows an unconfigured local build without connecting to any project", () => {
    assert.equal(parseAcademySupabaseConfig(undefined, undefined), null);
  });

  it("accepts only the Academy project URL", () => {
    const config = parseAcademySupabaseConfig(
      "https://" + ACADEMY_SUPABASE_PROJECT_REF + ".supabase.co",
      "sb_publishable_test",
    );

    assert.equal(config.url, "https://" + ACADEMY_SUPABASE_PROJECT_REF + ".supabase.co");
    assert.equal(config.publishableKey, "sb_publishable_test");
  });

  it("rejects the separate Magazyn project", () => {
    assert.throws(
      () =>
        parseAcademySupabaseConfig(
          "https://oxpspyinexdzacumydqu.supabase.co",
          "sb_publishable_test",
        ),
      SupabaseConfigurationError,
    );
  });

  it("rejects incomplete, insecure, and credential-bearing configuration", () => {
    assert.throws(
      () => parseAcademySupabaseConfig("https://aslzogstpyppmbdhvuss.supabase.co", undefined),
      /Set both/,
    );
    assert.throws(
      () => parseAcademySupabaseConfig("http://aslzogstpyppmbdhvuss.supabase.co", "key"),
      /only connects to the Academy/,
    );
    assert.throws(
      () =>
        parseAcademySupabaseConfig(
          "https://user:password@aslzogstpyppmbdhvuss.supabase.co",
          "key",
        ),
      /only connects to the Academy/,
    );
  });
});

describe("authentication redirect targets", () => {
  it("keeps a safe local path and its query string", () => {
    assert.equal(safeLocalRedirectPath("/change-password?from=invite"), "/change-password?from=invite");
  });

  it("rejects absolute and protocol-relative redirects", () => {
    assert.equal(safeLocalRedirectPath("https://evil.example"), "/dashboard");
    assert.equal(safeLocalRedirectPath("//evil.example/path"), "/dashboard");
  });
});

