export type ContentValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type TiptapDocument = {
  type: "doc";
  content: Array<Record<string, unknown>>;
};

export type LessonConversationMessage = {
  speaker: "client" | "seller";
  text: string;
};

export type CourseInput = {
  slug: string;
  languageCode: string;
  title: string;
  description: string;
};

export type LessonInput = {
  languageCode: string;
  title: string;
  summary: string;
  youtubeVideoId: string | null;
  youtubeVideoIds: string[];
  content: TiptapDocument;
  productBullets: string[];
  keyPointsTitle: string;
  conversationTitle: string;
  conversation: LessonConversationMessage[];
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLanguageCode(value: unknown) {
  const raw = text(value);
  const parts = raw.split("-");
  return parts.length === 2 ? `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}` : raw.toLowerCase();
}

export function parseLanguageInput(input: {
  code: unknown;
  name: unknown;
  nativeName: unknown;
}): ContentValidationResult<{ code: string; name: string; native_name: string }> {
  const code = normalizeLanguageCode(input.code);
  const name = text(input.name);
  const nativeName = text(input.nativeName);
  if (!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(code)) {
    return { ok: false, error: "Kod języka musi mieć format BCP 47, np. pl lub pt-BR." };
  }
  if (!name || name.length > 60 || !nativeName || nativeName.length > 60) {
    return { ok: false, error: "Podaj nazwę języka i jego nazwę własną (maksymalnie 60 znaków)." };
  }
  return { ok: true, value: { code, name, native_name: nativeName } };
}

export function parseCourseInput(input: {
  slug: unknown;
  languageCode: unknown;
  title: unknown;
  description: unknown;
}): ContentValidationResult<CourseInput> {
  const slug = text(input.slug).toLowerCase().replace(/\s+/g, "-");
  const languageCode = normalizeLanguageCode(input.languageCode);
  const title = text(input.title);
  const description = text(input.description);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 100) {
    return { ok: false, error: "Identyfikator szkolenia może zawierać małe litery, cyfry i łączniki." };
  }
  if (!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(languageCode)) {
    return { ok: false, error: "Wybierz prawidłowy język szkolenia." };
  }
  if (!title || title.length > 160 || description.length > 2000) {
    return { ok: false, error: "Tytuł musi mieć do 160 znaków, a opis do 2000 znaków." };
  }
  return { ok: true, value: { slug, languageCode, title, description } };
}

export function parseYoutubeVideoId(value: unknown): ContentValidationResult<string | null> {
  const raw = text(value);
  if (!raw) return { ok: true, value: null };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "Wklej pełny adres filmu YouTube." };
  }
  if (url.protocol !== "https:") {
    return { ok: false, error: "Film YouTube musi używać bezpiecznego adresu HTTPS." };
  }

  const hostname = url.hostname.toLowerCase();
  let videoId = "";
  if (hostname === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(hostname)) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") ?? "";
    } else {
      const match = url.pathname.match(/^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})\/?$/);
      videoId = match?.[1] ?? "";
    }
  }

  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return { ok: false, error: "Podany adres nie prowadzi do filmu YouTube." };
  }
  return { ok: true, value: videoId };
}

export function parseYoutubeVideoIds(value: unknown): ContentValidationResult<string[]> {
  const raw = text(value);
  if (!raw) return { ok: true, value: [] };

  const urls = raw.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  if (urls.length > 10) {
    return { ok: false, error: "Dodaj maksymalnie 10 filmów do jednej lekcji." };
  }

  const ids: string[] = [];
  for (const url of urls) {
    const parsed = parseYoutubeVideoId(url);
    if (!parsed.ok || !parsed.value) {
      return { ok: false, error: parsed.ok ? "Podany adres nie prowadzi do filmu YouTube." : parsed.error };
    }
    if (ids.includes(parsed.value)) {
      return { ok: false, error: "Ten sam film występuje na liście więcej niż raz." };
    }
    ids.push(parsed.value);
  }
  return { ok: true, value: ids };
}

function safeExternalUrl(value: unknown, allowMailto = false) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || (allowMailto && url.protocol === "mailto:")) {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function cleanInlineContent(value: unknown, depth: number): Record<string, unknown>[] | null {
  if (!Array.isArray(value) || depth > 12 || value.length > 300) return null;
  const result: Record<string, unknown>[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const node = item as Record<string, unknown>;
    const type = node.type;
    if (type === "text") {
      if (typeof node.text !== "string" || node.text.length > 20000) return null;
      const cleaned: Record<string, unknown> = { type: "text", text: node.text };
      if (node.marks !== undefined) {
        if (!Array.isArray(node.marks) || node.marks.length > 8) return null;
        const marks: Record<string, unknown>[] = [];
        for (const markValue of node.marks) {
          if (!markValue || typeof markValue !== "object" || Array.isArray(markValue)) return null;
          const mark = markValue as Record<string, unknown>;
          if (["bold", "italic", "strike", "underline", "code"].includes(String(mark.type))) {
            marks.push({ type: mark.type });
          } else if (mark.type === "link") {
            const href = safeExternalUrl(
              (mark.attrs as Record<string, unknown> | undefined)?.href,
              true,
            );
            if (!href) return null;
            marks.push({ type: "link", attrs: { href } });
          } else {
            return null;
          }
        }
        cleaned.marks = marks;
      }
      result.push(cleaned);
      continue;
    }
    if (type === "image") {
      const attrs = node.attrs as Record<string, unknown> | undefined;
      const src = safeExternalUrl(attrs?.src);
      if (!src) return null;
      result.push({
        type: "image",
        attrs: {
          src,
          alt: typeof attrs?.alt === "string" ? attrs.alt.slice(0, 300) : "",
          title: typeof attrs?.title === "string" ? attrs.title.slice(0, 300) : null,
        },
      });
      continue;
    }

    const allowedContainers = new Set([
      "paragraph",
      "heading",
      "blockquote",
      "bulletList",
      "orderedList",
      "listItem",
    ]);
    if (type === "horizontalRule" || type === "hardBreak") {
      result.push({ type });
      continue;
    }
    if (!allowedContainers.has(String(type))) return null;
    const children = cleanInlineContent(node.content ?? [], depth + 1);
    if (!children) return null;
    const cleaned: Record<string, unknown> = { type, content: children };
    if (type === "heading") {
      const level = (node.attrs as Record<string, unknown> | undefined)?.level;
      if (level !== 2 && level !== 3) return null;
      cleaned.attrs = { level };
    }
    result.push(cleaned);
  }
  return result;
}

export function sanitizeTiptapDocument(value: unknown): ContentValidationResult<TiptapDocument> {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  if (!serialized || serialized.length > 250_000) {
    return { ok: false, error: "Treść lekcji jest pusta albo przekracza limit 250 KB." };
  }

  let document: unknown;
  try {
    document = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return { ok: false, error: "Nie udało się odczytać treści edytora." };
  }
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    return { ok: false, error: "Treść musi być dokumentem edytora." };
  }

  const root = document as Record<string, unknown>;
  if (root.type !== "doc") return { ok: false, error: "Nieprawidłowy format dokumentu lekcji." };
  const content = cleanInlineContent(root.content ?? [], 0);
  if (!content) return { ok: false, error: "Treść zawiera nieobsługiwany albo niebezpieczny element." };
  return { ok: true, value: { type: "doc", content } };
}

export function parseLessonInput(input: {
  languageCode: unknown;
  title: unknown;
  summary: unknown;
  youtubeUrls?: unknown;
  youtubeUrl?: unknown;
  contentJson: unknown;
  productBullets: unknown;
  keyPointsTitle?: unknown;
  conversationTitle?: unknown;
  conversationJson?: unknown;
}): ContentValidationResult<LessonInput> {
  const languageCode = normalizeLanguageCode(input.languageCode);
  const title = text(input.title);
  const summary = text(input.summary);
  if (!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(languageCode)) {
    return { ok: false, error: "Wybierz prawidłowy język lekcji." };
  }
  if (!title || title.length > 160 || summary.length > 500) {
    return { ok: false, error: "Tytuł lekcji jest wymagany; podsumowanie może mieć do 500 znaków." };
  }

  const youtube = parseYoutubeVideoIds(input.youtubeUrls ?? input.youtubeUrl);
  if (!youtube.ok) return youtube;
  const content = sanitizeTiptapDocument(input.contentJson);
  if (!content.ok) return content;

  let rawBullets: unknown[];
  const rawBulletsText = text(input.productBullets);
  if (rawBulletsText.startsWith("[")) {
    try {
      const parsedBullets = JSON.parse(rawBulletsText) as unknown;
      if (!Array.isArray(parsedBullets)) return { ok: false, error: "Lista punktów ma nieprawidłowy format." };
      rawBullets = parsedBullets;
    } catch {
      return { ok: false, error: "Nie udało się odczytać listy punktów." };
    }
  } else {
    rawBullets = rawBulletsText.split(/\r?\n/);
  }
  if (rawBullets.some((bullet) => typeof bullet !== "string")) {
    return { ok: false, error: "Każdy punkt musi być tekstem." };
  }
  const productBullets = rawBullets
    .map((bullet) => (bullet as string).trim())
    .filter(Boolean);
  if (productBullets.length > 12 || productBullets.some((bullet) => bullet.length > 160)) {
    return { ok: false, error: "Dodaj maksymalnie 12 krótkich punktów (do 160 znaków każdy)." };
  }

  const keyPointsTitle = text(input.keyPointsTitle) || "Warto zapamiętać";
  const conversationTitle = text(input.conversationTitle) || "Rozmowa z klientem";
  if (keyPointsTitle.length > 120 || conversationTitle.length > 120) {
    return { ok: false, error: "Tytuły sekcji mogą mieć maksymalnie 120 znaków." };
  }

  let rawConversation: unknown;
  const conversationText = text(input.conversationJson);
  if (!conversationText) {
    rawConversation = [];
  } else {
    try {
      rawConversation = JSON.parse(conversationText) as unknown;
    } catch {
      return { ok: false, error: "Nie udało się odczytać rozmowy z klientem." };
    }
  }
  if (!Array.isArray(rawConversation) || rawConversation.length > 30) {
    return { ok: false, error: "Rozmowa może zawierać maksymalnie 30 wypowiedzi." };
  }
  const conversation: LessonConversationMessage[] = [];
  for (const item of rawConversation) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: "Wypowiedź w rozmowie ma nieprawidłowy format." };
    }
    const message = item as Record<string, unknown>;
    const messageText = text(message.text);
    if (!messageText) continue;
    if (messageText.length > 500) {
      return { ok: false, error: "Wypowiedź może mieć maksymalnie 500 znaków." };
    }
    if (message.speaker !== "client" && message.speaker !== "seller") {
      return { ok: false, error: "Wybierz, kto wypowiada każdą kwestię: klient czy sprzedawca." };
    }
    conversation.push({ speaker: message.speaker, text: messageText });
  }

  return {
    ok: true,
    value: {
      languageCode,
      title,
      summary,
      youtubeVideoId: youtube.value[0] ?? null,
      youtubeVideoIds: youtube.value,
      content: content.value,
      productBullets,
      keyPointsTitle,
      conversationTitle,
      conversation,
    },
  };
}
