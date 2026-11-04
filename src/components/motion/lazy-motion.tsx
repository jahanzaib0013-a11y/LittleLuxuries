import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { AnimationTemplate } from "@/lib/content-data";
import { intensityFor, prefersReducedMotion, useMotionContentSettled } from "@/lib/motion";

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
 * Each wrapper asks the intensity table before fetching anything, and waits
 * until the published content has settled: before that the template is the
 * coded default `couture`, not the store's real value. With the published
 * template at `none` nothing here is ever requested — the store renders its
 * static output and the animation layer never enters the network graph. The
 * checks mirror the ones inside the modules being imported, so an enabled
 * template gets exactly the same component it got before.
 */

/**
 * Should this effect run at all: does the settled template ask for it, and has
 * the browser been told not to animate? Both are client-side questions, so this
 * only ever runs from an effect.
 */
function wants(
  template: AnimationTemplate,
  key: "smoothScroll" | "introLoader" | "customCursor",
) {
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
  const settled = useMotionContentSettled();
  useEffect(() => {
    if (!settled || !wants(template, "smoothScroll")) return;
    let active = true;
    import("./smooth-scroll").then((m) => active && setComp(() => m.SmoothScroll));
    return () => {
      active = false;
    };
  }, [template, settled]);
  if (!Comp) return <>{children}</>;
  return <Comp template={template}>{children}</Comp>;
}

/** First-load brand curtain (motion). Renders nothing until loaded. */
export function IntroLoader({ template }: { template: AnimationTemplate }) {
  const [Comp, setComp] = useState<ComponentType<{ template: AnimationTemplate }> | null>(null);
  const settled = useMotionContentSettled();
  useEffect(() => {
    if (!settled || !wants(template, "introLoader")) return;
    let active = true;
    import("./intro-loader").then((m) => active && setComp(() => m.IntroLoader));
    return () => {
      active = false;
    };
  }, [template, settled]);
  return Comp ? <Comp template={template} /> : null;
}

/** Custom cursor (motion). Renders nothing until loaded. */
export function CustomCursor({ template }: { template: AnimationTemplate }) {
  const [Comp, setComp] = useState<ComponentType<{ template: AnimationTemplate }> | null>(null);
  const settled = useMotionContentSettled();
  useEffect(() => {
    if (!settled || !wants(template, "customCursor")) return;
    let active = true;
    import("./custom-cursor").then((m) => active && setComp(() => m.CustomCursor));
    return () => {
      active = false;
    };
  }, [template, settled]);
  return Comp ? <Comp template={template} /> : null;
}
