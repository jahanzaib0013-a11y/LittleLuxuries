import { useEffect, type ReactNode } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import { useRouterState } from "@tanstack/react-router";
import type { AnimationTemplate } from "@/lib/content-data";
import { intensityFor, prefersReducedMotion, useMounted } from "@/lib/motion";

/** Scrolls to top instantly whenever the route changes (Lenis owns scroll). */
function ScrollReset() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lenis = useLenis();
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname, lenis]);
  return null;
}

/**
 * Wraps the app in buttery momentum scrolling (Lenis). Smooth wheel only —
 * native touch scrolling is preserved on mobile. Falls back to a plain
 * passthrough when motion is disabled (template "none" / reduced-motion).
 */
export function SmoothScroll({
  template,
  children,
}: {
  template: AnimationTemplate;
  children: ReactNode;
}) {
  const mounted = useMounted();
  const enabled = mounted && intensityFor(template).smoothScroll && !prefersReducedMotion();

  if (!enabled) return <>{children}</>;

  return (
    <ReactLenis root options={{ smoothWheel: true, lerp: 0.1, wheelMultiplier: 1 }}>
      <ScrollReset />
      {children}
    </ReactLenis>
  );
}
