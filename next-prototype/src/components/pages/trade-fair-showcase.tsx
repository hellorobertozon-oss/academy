"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiPauseLine,
  RiPlayLine,
  RiSettings3Line,
} from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Switch } from "@/components/base/switch/switch";
import { AcademyLanguagePicker } from "@/components/academy-header";
import { ACADEMY_LANGUAGES, useAcademy, type AcademyLanguage } from "@/components/academy-provider";
import { TRADE_FAIR_COPY } from "@/lib/trade-fair-copy";
import type { TradeFairProduct } from "@/lib/trade-fair-products";
import { cx } from "@/utils/cx";
import "./trade-fair-showcase-motion.module.css";

const AUTO_ADVANCE_PRESETS = [5, 10, 15, 30, 60] as const;
const IDLE_RESET_DELAY_MS = 60_000;
const STAFF_PASSWORD = "kiosk";

export function TradeFairShowcase({ products }: { products: TradeFairProduct[] }) {
  const { language, setKioskLanguage } = useAcademy();
  const copy = TRADE_FAIR_COPY[language];
  const [selectedId, setSelectedId] = useState(products[0].id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [canScrollProductsLeft, setCanScrollProductsLeft] = useState(false);
  const [canScrollProductsRight, setCanScrollProductsRight] = useState(false);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(false);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number>(15);
  const [loopProducts, setLoopProducts] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [staffUnlocked, setStaffUnlocked] = useState(false);
  const [staffPassword, setStaffPassword] = useState("");
  const [staffPasswordError, setStaffPasswordError] = useState(false);
  const [activityVersion, setActivityVersion] = useState(0);
  const productCarouselRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const product = products.find((item) => item.id === selectedId) ?? products[0];
  const productImages = product.galleryImages.length > 0 ? product.galleryImages : [product.image];
  const selectedImage = productImages[selectedImageIndex] ?? productImages[0] ?? product.image;
  const selectedNumber = products.findIndex((item) => item.id === product.id) + 1;
  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    setStaffUnlocked(false);
    setStaffPassword("");
    setStaffPasswordError(false);
  }, []);

  useEffect(() => {
    const applyLanguage = (value: unknown) => {
      if (typeof value === "string" && ACADEMY_LANGUAGES.includes(value as AcademyLanguage)) {
        setKioskLanguage(value as AcademyLanguage);
      }
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== "https://robertozon.com") return;
      if (!event.data || typeof event.data !== "object" || event.data.type !== "xzone-language") return;
      applyLanguage(event.data.lang);
    };

    applyLanguage(new URLSearchParams(window.location.search).get("lang"));
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setKioskLanguage]);

  useEffect(() => {
    const carousel = productCarouselRef.current;
    if (!carousel) return;

    const updateScrollButtons = () => {
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      setCanScrollProductsLeft(carousel.scrollLeft > 1);
      setCanScrollProductsRight(carousel.scrollLeft < maxScroll - 1);
    };

    updateScrollButtons();
    carousel.addEventListener("scroll", updateScrollButtons, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(carousel);

    return () => {
      carousel.removeEventListener("scroll", updateScrollButtons);
      resizeObserver.disconnect();
    };
  }, [products.length]);

  const scrollProducts = (direction: -1 | 1) => {
    const carousel = productCarouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction * carousel.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  const revealProductCard = useCallback((index: number) => {
    const carousel = productCarouselRef.current;
    const card = carousel?.children.item(index) as HTMLElement | null;
    if (!carousel || !card) return;

    const carouselBounds = carousel.getBoundingClientRect();
    const cardBounds = card.getBoundingClientRect();
    const leftDelta = cardBounds.left < carouselBounds.left
      ? cardBounds.left - carouselBounds.left
      : cardBounds.right > carouselBounds.right
        ? cardBounds.right - carouselBounds.right
        : 0;

    if (leftDelta !== 0) {
      carousel.scrollBy({
        left: leftDelta,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    }
  }, []);

  const changeProduct = useCallback((direction: -1 | 1) => {
    const currentIndex = products.findIndex((item) => item.id === product.id);
    const nextIndex = (currentIndex + direction + products.length) % products.length;
    setSelectedId(products[nextIndex].id);
    setSelectedImageIndex(0);
  }, [product.id, products]);

  useEffect(() => {
    revealProductCard(selectedNumber - 1);
  }, [revealProductCard, selectedNumber]);

  useEffect(() => {
    if (!autoAdvanceEnabled || products.length < 2) return;

    const timeout = window.setTimeout(() => {
      const currentIndex = products.findIndex((item) => item.id === selectedId);
      const nextIndex = currentIndex + 1;

      if (nextIndex >= products.length) {
        if (loopProducts) {
          setSelectedId(products[0].id);
          setSelectedImageIndex(0);
        } else {
          setAutoAdvanceEnabled(false);
        }
        return;
      }

      setSelectedId(products[nextIndex].id);
      setSelectedImageIndex(0);
    }, autoAdvanceSeconds * 1000);

    return () => window.clearTimeout(timeout);
  }, [activityVersion, autoAdvanceEnabled, autoAdvanceSeconds, loopProducts, products, selectedId]);

  useEffect(() => {
    let idleTimeout = 0;

    const returnToStart = () => {
      if (!autoAdvanceEnabled) {
        setSelectedId(products[0].id);
        setSelectedImageIndex(0);
      }
      closeSettings();
    };
    const recordActivity = () => {
      setActivityVersion((version) => version + 1);
      window.clearTimeout(idleTimeout);
      idleTimeout = window.setTimeout(returnToStart, IDLE_RESET_DELAY_MS);
    };

    idleTimeout = window.setTimeout(returnToStart, IDLE_RESET_DELAY_MS);
    window.addEventListener("pointerdown", recordActivity, { passive: true });
    window.addEventListener("keydown", recordActivity);
    window.addEventListener("wheel", recordActivity, { passive: true });

    return () => {
      window.clearTimeout(idleTimeout);
      window.removeEventListener("pointerdown", recordActivity);
      window.removeEventListener("keydown", recordActivity);
      window.removeEventListener("wheel", recordActivity);
    };
  }, [autoAdvanceEnabled, closeSettings, products]);

  useEffect(() => {
    if (!settingsOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) closeSettings();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeSettings();
      settingsTriggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeSettings, settingsOpen]);

  return (
    <div className="flex min-h-svh flex-col bg-background-primary-default text-text-primary">
      <header className="relative flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-separator-border px-4 sm:min-h-20 sm:px-8">
        <Image
          src="/assets/xzone-logo-white.png"
          alt="Xzone"
          width={189}
          height={193}
          className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 brightness-0 sm:size-16"
        />
        <div className="absolute left-2 top-1/2 z-50 -translate-y-1/2 sm:left-6">
          <AcademyLanguagePicker persistence="kiosk" className="min-h-12" />
        </div>
        <div ref={settingsRef} className="relative z-50 ml-auto flex items-center gap-1">
          <Button
            ref={settingsTriggerRef}
            type="button"
            variant="ghost"
            size="xs"
            iconOnly
            leadingIcon={RiSettings3Line}
            aria-label={copy.staffSettings}
            aria-expanded={settingsOpen}
            aria-controls="trade-fair-presentation-settings"
            onClick={() => settingsOpen ? closeSettings() : setSettingsOpen(true)}
            className="size-8 rounded-full p-0 text-text-tertiary opacity-40 transition-opacity hover:opacity-100 focus-visible:opacity-100"
          />
          <LinkButton href="/dashboard" variant="secondary" size="small" leadingIcon={RiArrowLeftLine} className="min-h-11 rounded-full px-3">
            {copy.academy}
          </LinkButton>
          {settingsOpen ? (
            <div
              id="trade-fair-presentation-settings"
              role="dialog"
              aria-label={copy.settingsDialog}
              className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-separator-border bg-background-primary-default p-4 shadow-xl"
            >
              {staffUnlocked ? (
                <>
                  <h3 className="text-body-1-semibold text-text-primary">{copy.kioskSettings}</h3>
                  <p id="trade-fair-interval-label" className="mb-2 mt-4 text-body-2-regular text-text-secondary">
                    {copy.changeProductEvery}
                  </p>
                  <div role="group" aria-labelledby="trade-fair-interval-label" className="grid grid-cols-5 gap-2">
                    {AUTO_ADVANCE_PRESETS.map((seconds) => (
                      <Button
                        key={seconds}
                        type="button"
                        variant={autoAdvanceSeconds === seconds ? "primary" : "secondary"}
                        size="small"
                        aria-pressed={autoAdvanceSeconds === seconds}
                        onClick={() => setAutoAdvanceSeconds(seconds)}
                        className="min-h-11 rounded-xl px-2"
                      >
                        {seconds} s
                      </Button>
                    ))}
                  </div>
                  <Switch
                    isSelected={loopProducts}
                    onChange={setLoopProducts}
                    className="mt-3 min-h-11 w-full justify-between rounded-xl border border-border-button-default px-3 py-2"
                  >
                    {loopProducts ? copy.loopOn : copy.loopOff}
                  </Switch>
                  <Button
                    type="button"
                    variant={autoAdvanceEnabled ? "secondary" : "primary"}
                    size="large"
                    leadingIcon={autoAdvanceEnabled ? RiPauseLine : RiPlayLine}
                    aria-pressed={autoAdvanceEnabled}
                    onClick={() => setAutoAdvanceEnabled((enabled) => !enabled)}
                    className="mt-3 w-full justify-center"
                  >
                    {autoAdvanceEnabled ? copy.stopRotation : copy.startRotation}
                  </Button>
                </>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (staffPassword.trim().toLowerCase() === STAFF_PASSWORD) {
                      setStaffUnlocked(true);
                      setStaffPassword("");
                      setStaffPasswordError(false);
                    } else {
                      setStaffPasswordError(true);
                    }
                  }}
                >
                  <h3 className="text-body-1-semibold text-text-primary">{copy.staffSettings}</h3>
                  <label htmlFor="trade-fair-staff-password" className="mb-2 mt-3 block text-body-2-regular text-text-secondary">
                    {copy.password}
                  </label>
                  <input
                    id="trade-fair-staff-password"
                    type="password"
                    autoComplete="off"
                    value={staffPassword}
                    onChange={(event) => {
                      setStaffPassword(event.target.value);
                      setStaffPasswordError(false);
                    }}
                    aria-invalid={staffPasswordError}
                    aria-describedby={staffPasswordError ? "trade-fair-password-error" : undefined}
                    className="h-11 w-full rounded-xl border border-border-button-default bg-background-primary-default px-3 text-body-regular text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                  />
                  {staffPasswordError ? (
                    <p id="trade-fair-password-error" role="alert" className="mt-2 text-body-2-regular text-text-error-primary">
                      {copy.invalidPassword}
                    </p>
                  ) : null}
                  <Button type="submit" variant="primary" size="medium" className="mt-3 min-h-11 w-full rounded-xl">
                    {copy.unlockSettings}
                  </Button>
                </form>
              )}
            </div>
          ) : null}
        </div>
        {autoAdvanceEnabled && products.length > 1 ? (
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 h-[3px] overflow-hidden bg-accent-100">
            <div
              key={`${product.id}-${autoAdvanceSeconds}-${activityVersion}`}
              data-trade-fair-progress=""
              className="h-full w-full origin-left bg-accent-500"
              style={{ animationDuration: `${autoAdvanceSeconds}s` }}
            />
          </div>
        ) : null}
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-4 px-4 py-4 sm:px-8 sm:py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10 lg:py-3 2xl:max-w-[1600px]">
        <div className="flex min-w-0 flex-col items-center justify-center gap-3">
          <div className="relative flex w-full items-center justify-center">
            {products.length > 1 ? (
              <Button
                type="button"
                variant="primary"
                size="large"
                iconOnly
                leadingIcon={RiArrowLeftLine}
                aria-label={copy.previousProducts}
                aria-controls="trade-fair-products"
                onClick={() => changeProduct(-1)}
                className="absolute start-0 top-1/2 z-20 size-12 -translate-y-1/2 rounded-full p-0 shadow-md sm:size-14 lg:size-16 [&_svg]:size-6 lg:[&_svg]:size-8"
              />
            ) : null}
            <div
              key={`stage-${product.id}`}
              className={cx(
                "relative isolate aspect-square w-full max-w-[min(82vw,38svh)] shrink-0 sm:max-w-[min(62vw,44svh)] lg:max-w-[min(55vw,58svh)]",
              )}
            >
              <span aria-hidden="true" data-trade-fair-spotlight="" />
              <div
                key={`${product.id}-${selectedImageIndex}`}
                data-trade-fair-product-enter=""
                className="absolute inset-0 overflow-hidden rounded-3xl"
              >
                <Image
                  src={selectedImage}
                  alt={`${product.name}, photo ${selectedImageIndex + 1} of ${productImages.length}`}
                  fill
                  preload
                  sizes="(max-width: 640px) min(82vw, 38svh), (min-width: 1024px) min(55vw, 58svh), min(62vw, 44svh)"
                  className="z-10 object-contain"
                />
              </div>
            </div>
            {products.length > 1 ? (
              <Button
                type="button"
                variant="primary"
                size="large"
                iconOnly
                leadingIcon={RiArrowRightLine}
                aria-label={copy.nextProducts}
                aria-controls="trade-fair-products"
                onClick={() => changeProduct(1)}
                className="absolute end-0 top-1/2 z-20 size-12 -translate-y-1/2 rounded-full p-0 shadow-md sm:size-14 lg:size-16 [&_svg]:size-6 lg:[&_svg]:size-8"
              />
            ) : null}
          </div>
          <div role="group" aria-label={copy.productPhotos} className="mx-auto flex max-w-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {productImages.map((image, index) => {
              const isSelected = index === selectedImageIndex;

              return (
                <Button
                  key={`${product.id}-${image}`}
                  type="button"
                  variant="secondary"
                  size="small"
                  aria-label={copy.photoNumber(index + 1, productImages.length)}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedImageIndex(index)}
                  style={{ animationDelay: `${Math.min(index, 6) * 28}ms` }}
                  data-trade-fair-thumbnail-enter=""
                  className={cx(
                    "size-14 shrink-0 snap-start rounded-xl p-1",
                    isSelected && "border-accent-500 bg-accent-50 hover:bg-accent-50 active:bg-accent-50",
                  )}
                >
                  <span className="relative block size-11 shrink-0 overflow-hidden rounded-lg bg-background-secondary-default">
                    <Image src={image} alt="" fill sizes="44px" className="object-contain" />
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <section key={`copy-${product.id}`} data-trade-fair-product-copy-enter="" aria-live="polite" aria-atomic="true" className="mx-auto w-full max-w-4xl lg:mx-0 lg:max-w-none">
          <div className="mb-3 flex items-end justify-between gap-4">
            <h1 className="text-balance text-title-1-semibold text-text-primary sm:text-display-3-bold">{product.name}</h1>
            <span className="shrink-0 pb-1 text-body-2-medium tabular-nums text-text-tertiary">
              {String(selectedNumber).padStart(2, "0")} / {String(products.length).padStart(2, "0")}
            </span>
          </div>
          <article className="border-s-2 border-accent-500 ps-4">
            <p className="mb-1 text-caption-1-semibold uppercase tracking-wide text-text-tertiary">{copy.productDescription}</p>
            <p className="text-pretty text-body-regular text-text-secondary">
              {product.descriptionByLanguage[language]}
            </p>
          </article>
        </section>
      </main>

      <nav aria-label={copy.exploreProducts} className="shrink-0 border-t border-separator-border bg-background-primary-default">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 pb-2 pt-3 sm:gap-4 sm:px-8 sm:pt-4 2xl:max-w-[1600px]">
          <h2 className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">
            {copy.exploreProducts}
          </h2>
          <span className="text-body-2-regular text-text-tertiary">{copy.tapToExplore}</span>
        </div>
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-2 pb-4 pt-1 sm:gap-3 sm:px-8 2xl:max-w-[1600px]">
          <Button
            type="button"
            variant="primary"
            size="large"
            iconOnly
            leadingIcon={RiArrowLeftLine}
            aria-label={copy.previousProducts}
            aria-controls="trade-fair-products"
            disabled={!canScrollProductsLeft}
            onClick={() => scrollProducts(-1)}
            className="size-14 shrink-0 rounded-full p-0 text-text-primary shadow-sm sm:size-16 [&_svg]:size-7 sm:[&_svg]:size-8"
          />

          <div
            id="trade-fair-products"
            ref={productCarouselRef}
            className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3"
            role="list"
          >
            {products.map((item) => {
              const isSelected = item.id === product.id;

              return (
                <div key={item.id} role="listitem" className="shrink-0 snap-start">
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    aria-label={item.name}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedId(item.id);
                      setSelectedImageIndex(0);
                    }}
                    className={cx(
                      "h-auto w-32 snap-start flex-col items-stretch rounded-2xl p-2 text-start sm:w-36",
                      isSelected && "border-accent-500 bg-accent-50 hover:bg-accent-50 active:bg-accent-50",
                    )}
                  >
                    <span className="flex w-full flex-col gap-2">
                      <span className="relative aspect-square w-full overflow-hidden rounded-xl bg-background-secondary-default">
                        <Image src={item.galleryImages[0] ?? item.image} alt="" fill sizes="144px" className="object-contain" />
                      </span>
                      <span className="line-clamp-2 min-h-10 w-full whitespace-normal text-left text-body-2-medium text-text-primary">
                        {item.name}
                      </span>
                    </span>
                  </Button>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="primary"
            size="large"
            iconOnly
            leadingIcon={RiArrowRightLine}
            aria-label={copy.nextProducts}
            aria-controls="trade-fair-products"
            disabled={!canScrollProductsRight}
            onClick={() => scrollProducts(1)}
            className="size-14 shrink-0 rounded-full p-0 text-text-primary shadow-sm sm:size-16 [&_svg]:size-7 sm:[&_svg]:size-8"
          />
        </div>
      </nav>
    </div>
  );
}
