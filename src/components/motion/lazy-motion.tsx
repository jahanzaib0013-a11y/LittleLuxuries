import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { AnimationTemplate } from "@/lib/content-data";

/**
 * Client-only lazy wrappers for the storefront's animation layer.
 *
 * The real components pull in heavy libraries (`motion`, `lenis`) that would
 * otherwise sit in the main entry chunk and block first paint. These wrappers
 * keep the full visual experience but defer those libraries until AFTER
 * hydration: on the server and the first client render they return the plain
 * content (or nothing), then dynamically import the animated version and swap
 * it in. No SSR/hydration mismatch because the initial output matches.
 */

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
    let active = true;
    import("./smooth-scroll").then((m) => active && setComp(() => m.SmoothScroll));
    return () => {
      active = false;
    };
  }, []);
  if (!Comp) return <>{children}</>;
  return <Comp template={template}>{children}</Comp>;
}

/** First-load brand curtain (motion). Renders nothing until loaded. */
export function IntroLoader({ template }: { template: AnimationTemplate }) {
  const [Comp, setComp] = useState<ComponentType<{ template: AnimationTemplate }> | null>(null);
  useEffect(() => {
    let active = true;
    import("./intro-loader").then((m) => active && setComp(() => m.IntroLoader));
    return () => {
      active = false;
    };
  }, []);
  return Comp ? <Comp template={template} /> : null;
}

/** Custom cursor (motion). Renders nothing until loaded. */
export function CustomCursor({ template }: { template: AnimationTemplate }) {
  const [Comp, setComp] = useState<ComponentType<{ template: AnimationTemplate }> | null>(null);
  useEffect(() => {
    let active = true;
    import("./custom-cursor").then((m) => active && setComp(() => m.CustomCursor));
    return () => {
      active = false;
    };
  }, []);
  return Comp ? <Comp template={template} /> : null;
}
