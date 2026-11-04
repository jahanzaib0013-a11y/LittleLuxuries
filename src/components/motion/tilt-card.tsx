import { Suspense, lazy, type ReactNode } from "react";
import { useAnimationTemplate } from "@/components/reveal";
import { intensityFor, prefersReducedMotion } from "@/lib/motion";
import { useIsMobile } from "@/hooks/use-mobile";

const Tilt = lazy(() => import("./animated").then((m) => ({ default: m.TiltCardImpl })));

/**
 * Pointer-driven 3D tilt. The card rotates toward the cursor with a spring and
 * settles back on leave. Only active on real pointers (not touch) and when
 * motion is enabled; otherwise renders a plain wrapper so the CSS hover/zoom
 * still applies.
 *
 * The spring machinery lives in `./animated` and is fetched on demand, so a
 * storefront published at `animation_style: none` never downloads the animation
 * library for cards that will not move.
 */
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const template = useAnimationTemplate();
  const { enabled, tilt } = intensityFor(template);
  const isMobile = useIsMobile();

  const active = enabled && tilt > 0 && !isMobile && !prefersReducedMotion();

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Suspense fallback={<div className={className}>{children}</div>}>
      <Tilt className={className} max={tilt}>
        {children}
      </Tilt>
    </Suspense>
  );
}
