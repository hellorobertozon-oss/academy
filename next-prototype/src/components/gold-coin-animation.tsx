"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";

export function GoldCoinAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animation: AnimationItem | null = null;
    let isDisposed = false;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    void import("lottie-web").then(({ default: lottie }) => {
      if (isDisposed || !containerRef.current) return;

      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: !prefersReducedMotion,
        autoplay: !prefersReducedMotion,
        path: "/assets/gold-coin.json",
      });

      if (prefersReducedMotion) {
        animation.addEventListener("DOMLoaded", () => animation?.goToAndStop(0, true));
      }
    });

    return () => {
      isDisposed = true;
      animation?.destroy();
    };
  }, []);

  return <div ref={containerRef} className="relative size-full overflow-hidden" aria-hidden="true" />;
}
