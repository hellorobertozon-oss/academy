import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseCourseInput,
  parseLanguageInput,
  parseLessonInput,
  parseYoutubeVideoId,
  sanitizeTiptapDocument,
} from "../src/lib/admin/content-validation.ts";

describe("Academy content validation", () => {
  it("normalizes language codes and accepts course identifiers", () => {
    assert.deepEqual(parseLanguageInput({ code: "PT-br", name: "Portuguese", nativeName: "Português" }), {
      ok: true,
      value: { code: "pt-BR", name: "Portuguese", native_name: "Português" },
    });
    assert.equal(
      parseCourseInput({ slug: "Riding Basics", languageCode: "pl", title: "Jazda", description: "Opis" }).value?.slug,
      "riding-basics",
    );
    assert.equal(parseLanguageInput({ code: "javascript", name: "X", nativeName: "X" }).ok, false);
  });

  it("accepts standard YouTube links and rejects lookalike or insecure hosts", () => {
    assert.deepEqual(parseYoutubeVideoId("https://www.youtube.com/watch?v=abcdefghijk"), {
      ok: true,
      value: "abcdefghijk",
    });
    assert.deepEqual(parseYoutubeVideoId("https://youtu.be/abcdefghijk?t=10"), {
      ok: true,
      value: "abcdefghijk",
    });
    assert.equal(parseYoutubeVideoId("https://youtube.com.evil.test/watch?v=abcdefghijk").ok, false);
    assert.equal(parseYoutubeVideoId("http://youtube.com/watch?v=abcdefghijk").ok, false);
  });

  it("keeps editor JSON to supported nodes and safe link and image URLs", () => {
    const safe = sanitizeTiptapDocument(JSON.stringify({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Kask" }] },
        { type: "image", attrs: { src: "https://cdn.example.test/helmet.jpg", alt: "Kask" } },
      ],
    }));
    assert.equal(safe.ok, true);
    assert.equal(safe.value?.content[0].attrs.level, 2);

    const unsafeLink = sanitizeTiptapDocument({
      type: "doc",
      content: [{
        type: "paragraph",
        content: [{ type: "text", text: "Kliknij", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }],
      }],
    });
    assert.equal(unsafeLink.ok, false);
    assert.equal(sanitizeTiptapDocument({ type: "doc", content: [{ type: "script" }] }).ok, false);
    assert.equal(sanitizeTiptapDocument({ type: "doc", content: [{ type: "image", attrs: { src: "data:image/png;base64,abc" } }] }).ok, false);
  });

  it("normalizes lesson text, product bullets, video and rich content", () => {
    const parsed = parseLessonInput({
      languageCode: "pl",
      title: " Przygotowanie ",
      summary: " Krótko ",
      youtubeUrl: "https://youtube.com/shorts/abcdefghijk",
      contentJson: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Start" }] }] }),
      productBullets: " Sprawdź kask\n\nSprawdź rękawice ",
    });
    assert.equal(parsed.ok, true);
    assert.deepEqual(parsed.value?.productBullets, ["Sprawdź kask", "Sprawdź rękawice"]);
    assert.equal(parsed.value?.youtubeVideoId, "abcdefghijk");
    assert.equal(parseLessonInput({
      languageCode: "pl",
      title: "Lekcja",
      summary: "",
      youtubeUrl: "",
      contentJson: "{broken",
      productBullets: "",
    }).ok, false);
  });
});
