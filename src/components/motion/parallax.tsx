import { Suspense, lazy, type ReactNode } from "react";
import { useAnimationTemplate } from "@/components/reveal";
import {
  intensityFor,
  prefersReducedMotion,
  useMounted,
  useMotionContentSettled,
} from "@/lib/motion";

const Drift = lazy(() => import("./animated").then((m) => ({ default: m.ParallaxDrift })));

/**
 * Vertical drift driven by scroll, applied to the wrapped content.
 *
 * The animation itself lives in `./animated`, which is fetched only when the
 * published template animates: at intensity `none` (what the storefront serves
 * today) this renders a plain div and `motion/react` never enters the graph.
 * The Suspense fallback is that same plain div, so the server HTML, the first
 * client render and the settled render are identical — no flash, no layout
 * shift, and hydration stays clean because `!mounted` is true on the server and
 * on the first client render alike.
 *
 * `settled` covers the other guess: before the published content has been read
 * the template is the coded default, so drifting would fetch this module for an
 * effect the real value then throws away.
 */
export function Parallax({
  children,
  className,
  factor = 1,
}: {
  children: ReactNode;
  className?: string;
  /** Multiplies the template's parallax travel. Negative drifts the other way. */
  factor?: number;
}) {
  const template = useAnimationTemplate();
  const { enabled, parallax } = intensityFor(template);
  const mounted = useMounted();
  const settled = useMotionContentSettled();

  if (!enabled || !settled || !mounted || prefersReducedMotion()) {
    return <div className={className}>{children}</div>;
  }

  const travel = parallax * factor;
  return (
    <Suspense fallback={<div className={className}>{children}</div>}>
      <Drift className={className} travel={travel}>
        {children}
      </Drift>
    </Suspense>
  );
}
