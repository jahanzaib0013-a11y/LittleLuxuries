import { Suspense, lazy, type ReactNode } from "react";
import { useAnimationTemplate } from "@/components/reveal";
import { intensityFor, prefersReducedMotion } from "@/lib/motion";
import { useIsMobile } from "@/hooks/use-mobile";

const Pull = lazy(() => import("./animated").then((m) => ({ default: m.MagneticImpl })));

/**
 * Pulls its child toward the cursor while hovered, snapping back on leave.
 * Active only on real pointers and when motion is enabled. The spring lives in
 * `./animated`, fetched only for visitors who actually get the effect.
 */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const template = useAnimationTemplate();
  const { enabled, magnet } = intensityFor(template);
  const isMobile = useIsMobile();

  const active = enabled && magnet > 0 && !isMobile && !prefersReducedMotion();
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Suspense fallback={<div className={className}>{children}</div>}>
      <Pull className={className} strength={magnet}>
        {children}
      </Pull>
    </Suspense>
  );
}
