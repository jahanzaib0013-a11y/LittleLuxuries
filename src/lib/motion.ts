import { useEffect, useState } from "react";
import type { AnimationTemplate } from "@/lib/content-data";

/** Shared premium easing — matches the CSS reveal curve. */
export const LUX_EASE = [0.22, 1, 0.36, 1] as const;

/** Shared spring for tilt / magnetic interactions. */
export const LUX_SPRING = { stiffness: 220, damping: 26, mass: 0.6 } as const;

export interface MotionIntensity {
  /** Master switch — false means render everything plain/static. */
  enabled: boolean;
  /** Smooth (Lenis) momentum scrolling on/off. */
  smoothScroll: boolean;
  /** Masked text reveal tuning. */
  reveal: { distance: number; stagger: number; duration: number };
  /** Hero image parallax travel, in px. */
  parallax: number;
  /** Max 3D tilt rotation on product cards, in degrees (0 disables tilt). */
  tilt: number;
  /** Magnetic-button pull strength, 0–1 (0 disables). */
  magnet: number;
  /** First-load brand curtain (landing, once per session). */
  introLoader: boolean;
  /** Replace the native cursor with a custom dot + ring on fine pointers. */
  customCursor: boolean;
}

const NONE: MotionIntensity = {
  enabled: false,
  smoothScroll: false,
  reveal: { distance: 0, stagger: 0, duration: 0 },
  parallax: 0,
  tilt: 0,
  magnet: 0,
  introLoader: false,
  customCursor: false,
};

const EDITORIAL: MotionIntensity = {
  enabled: true,
  smoothScroll: true,
  reveal: { distance: 80, stagger: 0.04, duration: 0.7 },
  parallax: 40,
  tilt: 0,
  magnet: 0,
  introLoader: false,
  customCursor: false,
};

const BOUTIQUE: MotionIntensity = {
  enabled: true,
  smoothScroll: true,
  reveal: { distance: 100, stagger: 0.05, duration: 0.8 },
  parallax: 70,
  tilt: 7,
  magnet: 0.25,
  introLoader: false,
  customCursor: true,
};

const COUTURE: MotionIntensity = {
  enabled: true,
  smoothScroll: true,
  reveal: { distance: 115, stagger: 0.06, duration: 0.9 },
  parallax: 110,
  tilt: 11,
  magnet: 0.4,
  introLoader: true,
  customCursor: true,
};

const MAP: Record<AnimationTemplate, MotionIntensity> = {
  none: NONE,
  editorial: EDITORIAL,
  boutique: BOUTIQUE,
  couture: COUTURE,
};

/** Tuned motion parameters for a given template (one cinematic design, scaled). */
export function intensityFor(template: AnimationTemplate): MotionIntensity {
  return MAP[template] ?? COUTURE;
}

/* --------------------------------------------------------------- settle state */

/**
 * Has the storefront's published content been read yet?
 *
 * There is no server loader (see `routes/index.tsx`), so the first render of
 * every page — the HTML string and the hydration pass — necessarily uses the
 * coded default template, `couture`. The real value (`none` today) arrives a
 * network round trip later. Until then the app is guessing, and guessing
 * "animate" is expensive: the animation module gets fetched, Lenis mounts and
 * the parallax springs bind, only for the settled `none` to tear all of that
 * down and leave a 51 KB chunk and a mount/unmount cycle as pure waste. Lighthouse
 * measures that waste on every run because it always starts from an empty cache.
 *
 * `useSiteContent` flips this the moment its fetch resolves — the same moment it
 * tells the brand splash to lift — and every motion gate treats `false` as
 * "render static". Nothing about the page looks different while the splash is
 * still up, and a storefront published at `none` never asks for the library.
 *
 * The window-load failsafe keeps this from becoming a dependency: a page that
 * never reads published content still gets its animations, just one beat later.
 */
let settled = false;
const settledListeners = new Set<() => void>();

export function markMotionContentSettled(): void {
  if (settled) return;
  settled = true;
  for (const listener of Array.from(settledListeners)) listener();
}

if (typeof window !== "undefined") {
  const arm = () => setTimeout(markMotionContentSettled, 1500);
  if (document.readyState === "complete") arm();
  else window.addEventListener("load", arm, { once: true });
}

/** False until the published template is known; stable once true. */
export function useMotionContentSettled(): boolean {
  const [isSettled, setIsSettled] = useState(settled);
  useEffect(() => {
    if (settled) {
      setIsSettled(true);
      return;
    }
    const listener = () => setIsSettled(true);
    settledListeners.add(listener);
    return () => {
      settledListeners.delete(listener);
    };
  }, []);
  return isSettled;
}

/**
 * True only after the component has mounted on the client. Use to defer
 * motion (scroll bindings, Lenis) until layout exists — avoids SSR/hydration
 * mismatches and motion's WAAPI "offsets" errors when binding scroll values
 * before the page has measured.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** SSR-safe reduced-motion check. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
