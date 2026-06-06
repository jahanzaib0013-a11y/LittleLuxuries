import { useRef, useState, useEffect, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useAnimationTemplate } from "@/components/reveal";
import { intensityFor, prefersReducedMotion, useMounted } from "@/lib/motion";

/**
 * Drifts its children vertically as the page scrolls, creating depth. Uses
 * viewport scroll (no target ref) so it's SSR-safe and never hits motion's
 * "target ref not hydrated" path. Plain wrapper when motion is off / reduced.
 */
export function Parallax({
  children,
  className,
  /** Multiplier on the template's base parallax travel. Negative drifts up. */
  factor = 1,
}: {
  children: ReactNode;
  className?: string;
  factor?: number;
}) {
  const template = useAnimationTemplate();
  const { enabled, parallax } = intensityFor(template);
  const mounted = useMounted();
  const ref = useRef<HTMLDivElement | null>(null);
  const [top, setTop] = useState(0);

  // Measure the element's document position once mounted so the drift is
  // centered on when it's roughly in view (cheap, no per-frame layout reads).
  useEffect(() => {
    if (ref.current) setTop(ref.current.getBoundingClientRect().top + window.scrollY);
  }, [mounted]);

  const { scrollY } = useScroll();
  const travel = parallax * factor;
  const y = useTransform(scrollY, [top - 800, top + 800], [travel, -travel]);

  if (!enabled || !mounted || prefersReducedMotion()) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
