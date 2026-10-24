"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/base/buttons/button";
import { submitTradeFairMemoryEntry } from "@/app/targi/actions";
import type { TradeFairProduct } from "@/lib/trade-fair-products";
import type { TradeFairMemorySettings } from "@/lib/trade-fair-memory";

type Language = "en" | "it";
type Screen = "language" | "register" | "playing" | "won" | "lost";
type MemoryCard = { id: string; pairId: string; image: string; isLogo: boolean };

const PAIRS_PER_LEVEL = [4, 6, 8] as const;
const COPY: Record<Language, {
  title: string;
  intro: string;
  chooseLanguage: string;
  email: string;
  emailPlaceholder: string;
  privacyStart: string;
  privacyLink: string;
  privacyEnd: string;
    privacyRequired: string;
  submit: string;
  saving: string;
  saveError: string;
  level: string;
  of: string;
  pairs: string;
  time: string;
  hiddenCard: string;
  wonTitle: string;
  wonCopy: string;
  prize: string;
  lostTitle: string;
  lostCopy: string;
  playAgain: string;
  nextParticipant: string;
}> = {
  en: {
    title: "Xzone Memory",
    intro: "Match the product pairs and the Xzone logo across three levels before time runs out.",
    chooseLanguage: "Choose your language",
    email: "Email address",
    emailPlaceholder: "you@example.com",
    privacyStart: "I agree to have my email recorded for this game and have read the ",
    privacyLink: "Privacy & Cookie Policy",
    privacyEnd: ".",
    privacyRequired: "Please accept the privacy notice to continue.",
    submit: "Continue",
    saving: "Saving…",
    saveError: "We couldn't save your entry. Please try again.",
    level: "Level",
    of: "of",
    pairs: "pairs",
    time: "Time left",
    hiddenCard: "Face-down memory card",
    wonTitle: "You did it!",
    wonCopy: "You matched all three levels in time. Show this screen to the Xzone team to collect your prize.",
    prize: "Your prize",
    lostTitle: "Time is up",
    lostCopy: "Good try. You can have another go.",
    playAgain: "Try again",
    nextParticipant: "Next participant",
  },
  it: {
    title: "Xzone Memory",
    intro: "Abbina le coppie dei prodotti e il logo Xzone in tre livelli prima che scada il tempo.",
    chooseLanguage: "Scegli la lingua",
    email: "Indirizzo e-mail",
    emailPlaceholder: "tu@esempio.it",
    privacyStart: "Acconsento alla registrazione della mia e-mail per questo gioco e dichiaro di aver letto la ",
    privacyLink: "Privacy e Cookie Policy",
    privacyEnd: ".",
    privacyRequired: "Accetta l'informativa privacy per continuare.",
    submit: "Continua",
    saving: "Salvataggio…",
    saveError: "Non è stato possibile salvare l'iscrizione. Riprova.",
    level: "Livello",
    of: "di",
    pairs: "coppie",
    time: "Tempo rimasto",
    hiddenCard: "Carta Memory coperta",
    wonTitle: "Ce l'hai fatta!",
    wonCopy: "Hai completato tutti e tre i livelli in tempo. Mostra questa schermata al team Xzone per ritirare il premio.",
    prize: "Il tuo premio",
    lostTitle: "Tempo scaduto",
    lostCopy: "Bel tentativo. Puoi riprovare.",
    playAgain: "Riprova",
    nextParticipant: "Prossimo partecipante",
  },
};

function shuffle<T,>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

function makeDeck(products: TradeFairProduct[], level: number): MemoryCard[] {
  const pairCount = PAIRS_PER_LEVEL[level - 1] ?? PAIRS_PER_LEVEL[0];
  const productPairs: MemoryCard[] = products.slice(0, pairCount - 1).map((product) => ({
    id: product.id,
    pairId: product.id,
    image: product.image,
    isLogo: false,
  }));
  const pairs = [...productPairs, {
    id: "xzone-logo",
    pairId: "xzone-logo",
    image: "/assets/xzone-logo-white.png",
    isLogo: true,
  }];

  return shuffle(pairs.flatMap((pair) => [
    { ...pair, id: `${pair.id}-a` },
    { ...pair, id: `${pair.id}-b` },
  ]));
}

export function TradeFairMemory({
  products,
  settings,
}: {
  products: TradeFairProduct[];
  settings: TradeFairMemorySettings;
}) {
  const [language, setLanguage] = useState<Language>("en");
  const [screen, setScreen] = useState<Screen>("language");
  const [email, setEmail] = useState("");
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<MemoryCard[]>(() => makeDeck(products, 1));
  const [openCards, setOpenCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(() => new Set());
  const [remainingSeconds, setRemainingSeconds] = useState(settings.timeLimitSeconds);
  const deadlineRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const copy = COPY[language];
  const pairCount = PAIRS_PER_LEVEL[level - 1] ?? PAIRS_PER_LEVEL[0];

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (screen !== "playing") return;

    const updateRemaining = () => {
      const nextRemaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setRemainingSeconds(nextRemaining);
      if (nextRemaining === 0) {
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
        setScreen("lost");
      }
    };

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(interval);
  }, [screen]);

  const beginGame = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setLevel(1);
    setCards(makeDeck(products, 1));
    setOpenCards([]);
    setMatchedPairs(new Set());
    setRemainingSeconds(settings.timeLimitSeconds);
    deadlineRef.current = Date.now() + settings.timeLimitSeconds * 1000;
    setScreen("playing");
  };

  const registerParticipant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!privacyAcknowledged) {
      setFormError(copy.privacyRequired);
      return;
    }

    setSaving(true);
    let result;
    try {
      result = await submitTradeFairMemoryEntry({
        email,
        language,
        privacyAcknowledged,
      });
    } catch {
      result = { ok: false as const, message: "save_failed" as const };
    }
    setSaving(false);

    if (!result.ok) {
      setFormError(copy.saveError);
      return;
    }

    beginGame();
  };

  const selectCard = (card: MemoryCard) => {
    if (openCards.length >= 2 || matchedPairs.has(card.pairId) || openCards.includes(card.id)) return;

    if (openCards.length === 0) {
      setOpenCards([card.id]);
      return;
    }

    const nextOpenCards = [...openCards, card.id];
    setOpenCards(nextOpenCards);
    const firstCard = cards.find((item) => item.id === openCards[0]);

    if (firstCard?.pairId === card.pairId) {
      const nextMatchedPairs = new Set(matchedPairs);
      nextMatchedPairs.add(card.pairId);
      setMatchedPairs(nextMatchedPairs);

      if (nextMatchedPairs.size === pairCount) {
        timeoutRef.current = window.setTimeout(() => {
          if (level === PAIRS_PER_LEVEL.length) {
            setScreen("won");
            return;
          }

          const nextLevel = level + 1;
          setLevel(nextLevel);
          setCards(makeDeck(products, nextLevel));
          setOpenCards([]);
          setMatchedPairs(new Set());
        }, 700);
      } else {
        timeoutRef.current = window.setTimeout(() => setOpenCards([]), 550);
      }
      return;
    }

    timeoutRef.current = window.setTimeout(() => setOpenCards([]), 850);
  };

  const resetForNextParticipant = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setScreen("language");
    setLanguage("en");
    setEmail("");
    setPrivacyAcknowledged(false);
    setFormError("");
    setLevel(1);
    setCards(makeDeck(products, 1));
    setOpenCards([]);
    setMatchedPairs(new Set());
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-8 sm:py-10">
      <section className="w-full max-w-5xl">
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {screen === "playing" ? `${copy.level} ${level} ${copy.of} 3` : screen === "won" ? copy.wonTitle : screen === "lost" ? copy.lostTitle : ""}
        </p>
        {screen === "language" ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <span className="relative block size-20">
              <Image src="/assets/xzone-logo-white.png" alt="Xzone" fill sizes="80px" className="object-contain brightness-0" />
            </span>
            <div className="space-y-3">
              <p className="text-caption-1-semibold uppercase tracking-[0.16em] text-accent-700">Xzone · Trade fair challenge</p>
              <h1 className="text-title-1-semibold text-text-primary sm:text-display-3-bold">{copy.title}</h1>
              <p className="text-body-regular text-text-secondary sm:text-title-3-regular">{copy.intro}</p>
            </div>
            <div className="w-full space-y-3">
              <p className="text-body-medium text-text-secondary">{copy.chooseLanguage}</p>
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="primary" size="large" className="min-h-16 justify-center text-title-3-semibold" onClick={() => { setLanguage("en"); setScreen("register"); }}>
                  English · EN
                </Button>
                <Button type="button" variant="secondary" size="large" className="min-h-16 justify-center text-title-3-semibold" onClick={() => { setLanguage("it"); setScreen("register"); }}>
                  Italiano · IT
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {screen === "register" ? (
          <form onSubmit={registerParticipant} className="mx-auto flex w-full max-w-2xl flex-col gap-5 rounded-3xl border border-separator-border bg-background-primary-default p-5 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-caption-1-semibold uppercase tracking-[0.14em] text-accent-700">{language === "en" ? "Trade fair challenge" : "Sfida in fiera"}</p>
                <h1 className="mt-1 text-title-2-semibold text-text-primary">{copy.title}</h1>
              </div>
              <span className="rounded-full bg-accent-100 px-3 py-2 text-body-2-semibold text-accent-900">{language.toUpperCase()}</span>
            </div>
            <label htmlFor="trade-fair-memory-email" className="flex flex-col gap-2 text-body-medium text-text-primary">
              {copy.email}
              <input
                id="trade-fair-memory-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={copy.emailPlaceholder}
                className="h-14 rounded-xl border border-border-button-default bg-background-primary-default px-4 text-body-regular text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
              />
            </label>
            <label className="flex min-h-14 items-start gap-3 rounded-xl bg-background-secondary-default p-4 text-body-2-regular text-text-secondary">
              <input
                type="checkbox"
                required
                checked={privacyAcknowledged}
                onChange={(event) => setPrivacyAcknowledged(event.target.checked)}
                className="mt-1 size-5 shrink-0 accent-[var(--color-accent-500)]"
              />
              <span>
                {copy.privacyStart}
                <a href={settings.privacyNoticeUrl} target="_blank" rel="noreferrer" className="font-semibold text-text-primary underline underline-offset-4">
                  {copy.privacyLink}
                </a>
                {copy.privacyEnd}
              </span>
            </label>
            {formError ? <p role="alert" className="text-body-2-medium text-text-error-primary">{formError}</p> : null}
            <Button type="submit" variant="primary" size="large" disabled={saving || !privacyAcknowledged} className="min-h-14 w-full justify-center">
              {saving ? copy.saving : copy.submit}
            </Button>
          </form>
        ) : null}

        {screen === "playing" ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-caption-1-semibold uppercase tracking-[0.14em] text-accent-700">{copy.level} {level} {copy.of} 3</p>
                <h1 className="mt-1 text-title-2-semibold text-text-primary sm:text-title-1-semibold">{copy.title}</h1>
                <p className="mt-1 text-body-2-regular text-text-secondary">{pairCount} {copy.pairs}</p>
              </div>
              <div className="min-w-36 rounded-2xl border border-separator-border bg-background-primary-default px-5 py-3 text-center">
                <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">{copy.time}</p>
                <p className={`mt-1 text-title-2-semibold tabular-nums ${remainingSeconds <= 15 ? "text-text-error-primary" : "text-text-primary"}`}>
                  {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}
                </p>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-accent-100" aria-hidden="true">
              <div className="h-full rounded-full bg-accent-500 transition-[width] duration-300" style={{ width: `${Math.max(0, (remainingSeconds / settings.timeLimitSeconds) * 100)}%` }} />
            </div>
            <div className="mx-auto grid w-full max-w-4xl grid-cols-4 gap-2 sm:gap-4">
              {cards.map((card) => {
                const isFaceUp = openCards.includes(card.id) || matchedPairs.has(card.pairId);
                const isUnavailable = matchedPairs.has(card.pairId) || openCards.includes(card.id) || openCards.length >= 2;
                return (
                  <button
                    key={card.id}
                    type="button"
                    aria-label={isFaceUp
                      ? card.isLogo
                        ? "Xzone logo"
                        : products.find((product) => product.id === card.pairId)?.name ?? "Xzone product"
                      : copy.hiddenCard}
                    aria-pressed={isFaceUp}
                    disabled={isUnavailable}
                    onClick={() => selectCard(card)}
                    className={`relative flex aspect-[4/3] min-h-[min(13vh,8rem)] items-center justify-center overflow-hidden rounded-2xl border-2 p-2 shadow-sm transition-transform duration-150 active:scale-[0.97] disabled:cursor-default ${isFaceUp ? "border-accent-500 bg-white" : "border-accent-200 bg-accent-500"}`}
                  >
                    {isFaceUp ? (
                      card.isLogo ? (
                        <span className="relative block h-3/4 w-3/4">
                          <Image src={card.image} alt="" fill sizes="150px" className="object-contain brightness-0" />
                        </span>
                      ) : (
                        <span className="relative block h-full w-full">
                          <Image src={card.image} alt="" fill sizes="150px" className="object-contain" />
                        </span>
                      )
                    ) : (
                      <span className="relative block h-3/5 w-3/5 rounded-xl bg-white/90 p-2">
                        <Image src="/assets/xzone-logo-white.png" alt="" fill sizes="100px" className="object-contain p-2 brightness-0" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {screen === "won" || screen === "lost" ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 rounded-3xl border border-separator-border bg-background-primary-default p-6 text-center shadow-sm sm:p-10">
            <span className="relative block size-16">
              <Image src="/assets/xzone-logo-white.png" alt="Xzone" fill sizes="64px" className="object-contain brightness-0" />
            </span>
            <div className="space-y-2">
              <p className="text-caption-1-semibold uppercase tracking-[0.14em] text-accent-700">{screen === "won" ? copy.prize : copy.time}</p>
              <h1 className="text-title-1-semibold text-text-primary">{screen === "won" ? copy.wonTitle : copy.lostTitle}</h1>
              <p className="text-body-regular text-text-secondary">{screen === "won" ? copy.wonCopy : copy.lostCopy}</p>
            </div>
            {screen === "won" ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-background-secondary-default p-4">
                <Image src={settings.prizeImageUrl} alt={settings.prizeName} width={144} height={144} unoptimized className="h-36 w-36 object-contain" />
                <p className="text-body-semibold text-text-primary">{settings.prizeName}</p>
              </div>
            ) : null}
            <Button type="button" variant="primary" size="large" onClick={resetForNextParticipant} className="min-h-14 w-full justify-center">
              {screen === "won" ? copy.nextParticipant : copy.playAgain}
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
