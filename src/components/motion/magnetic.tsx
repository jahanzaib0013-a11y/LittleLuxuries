import { useRef, type ReactNode, type PointerEvent } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useAnimationTemplate } from "@/components/reveal";
import { intensityFor, prefersReducedMotion, LUX_SPRING } from "@/lib/motion";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Pulls its child toward the cursor while hovered, snapping back on leave.
 * Active only on real pointers and when motion is enabled.
 */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const template = useAnimationTemplate();
  const { enabled, magnet } = intensityFor(template);
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useSpring(useMotionValue(0), LUX_SPRING);
  const y = useSpring(useMotionValue(0), LUX_SPRING);

  const active = enabled && magnet > 0 && !isMobile && !prefersReducedMotion();
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * magnet);
    y.set((e.clientY - (r.top + r.height / 2)) * magnet);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={className}
      style={{ x, y, display: "inline-flex" }}
    >
      {children}
    </motion.div>
  );
}
