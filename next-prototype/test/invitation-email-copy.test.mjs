import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getInvitationEmailCopy,
  INVITATION_EMAIL_COPY,
} from "../src/lib/email/invitation-copy.ts";

describe("Academy invitation email copy", () => {
  it("provides complete invitation copy for all Academy languages", () => {
    assert.deepEqual(Object.keys(INVITATION_EMAIL_COPY).sort(), ["cs", "de", "en", "fr", "it", "pl"]);

    for (const copy of Object.values(INVITATION_EMAIL_COPY)) {
      assert.ok(copy.subject);
      assert.ok(copy.preview);
      assert.ok(copy.heading);
      assert.ok(copy.body);
      assert.ok(copy.button);
      assert.ok(copy.fallback);
    }
  });

  it("returns the selected language copy", () => {
    assert.equal(getInvitationEmailCopy("de").button, "Konto aktivieren");
    assert.equal(getInvitationEmailCopy("cs").button, "Aktivovat účet");
    assert.equal(getInvitationEmailCopy("fr").button, "Activer le compte");
  });
});
