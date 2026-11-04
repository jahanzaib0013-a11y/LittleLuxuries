import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { AnimationTemplate } from "@/lib/content-data";
import { intensityFor, prefersReducedMotion } from "@/lib/motion";

/**
 * Client-only lazy wrappers for the storefront's animation layer.
 *
 * The real components pull in heavy libraries (`motion`, `lenis`) that would
 * otherwise sit in the main entry chunk and block first paint. These wrappers
 * keep the full visual experience but defer those libraries until AFTER
 * hydration: on the server and the first client render they return the plain
 * content (or nothing), then dynamically import the animated version and swap
 * it in. No SSR/hydration mismatch because the initial output matches.
 *
 * Each wrapper asks the intensity table before fetching anything. With the
 * published template at `none` nothing here is requested at all — the store
 * renders its static output and the animation layer never enters the network
 * graph. The checks mirror the ones inside the modules being imported, so an
 * enabled template gets exactly the same component it got before.
 */

/**
 * True when the reduced-motion preference should veto an otherwise-enabled
 * effect. Safe to call after mount only (these effects run on the client).
 */
function wants(template: AnimationTemplate, key: "smoothScroll" | "introLoader" | "customCursor") {
  return intensityFor(template)[key] && !prefersReducedMotion();
}

/** Smooth momentum scrolling (Lenis). Renders children immediately meanwhile. */
export function SmoothScroll({
  template,
  children,
}: {
  template: AnimationTemplate;
  children: ReactNode;
}) {
  const [Comp, setComp] = useState<ComponentType<{
    template: AnimationTemplate;
    children: ReactNode;
  }> | null>(null);
  useEffect(() => {
    if (!wants(template, "smoothScroll")) return;
    let active = true;
    import("./smooth-scroll").then((m) => active && setComp(() => m.SmoothScroll));
    return () => {
      active = false;
    };
  }, [template]);
  if (!Comp) return <>{children}</>;
  return <Comp template={template}>{children}</Comp>;
}

/** First-load brand curtain (motion). Renders nothing until loaded. */
export function IntroLoader({ template }: { template: AnimationTemplate }) {
  const [Comp, setComp] = useState<ComponentType<{ template: AnimationTemplate }> | null>(null);
  useEffect(() => {
    if (!wants(template, "introLoader")) return;
    let active = true;
    import("./intro-loader").then((m) => active && setComp(() => m.IntroLoader));
    return () => {
      active = false;
    };
  }, [template]);
  return Comp ? <Comp template={template} /> : null;
}

/** Custom cursor (motion). Renders nothing until loaded. */
export function CustomCursor({ template }: { template: AnimationTemplate }) {
  const [Comp, setComp] = useState<ComponentType<{ template: AnimationTemplate }> | null>(null);
  useEffect(() => {
    if (!wants(template, "customCursor")) return;
    let active = true;
    import("./custom-cursor").then((m) => active && setComp(() => m.CustomCursor));
    return () => {
      active = false;
    };
  }, [template]);
  return Comp ? <Comp template={template} /> : null;
}
