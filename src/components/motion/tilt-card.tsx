import { useRef, type ReactNode, type PointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useAnimationTemplate } from "@/components/reveal";
import { intensityFor, prefersReducedMotion, LUX_SPRING } from "@/lib/motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * Pointer-driven 3D tilt. The card rotates toward the cursor with a spring and
 * settles back on leave. Only active on real pointers (not touch) and when
 * motion is enabled; otherwise renders a plain wrapper so the CSS hover/zoom
 * still applies.
 */
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const template = useAnimationTemplate();
  const { enabled, tilt } = intensityFor(template);
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement | null>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [tilt, -tilt]), LUX_SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-tilt, tilt]), LUX_SPRING);

  const active = enabled && tilt > 0 && !isMobile && !prefersReducedMotion();

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={cn("[transform-style:preserve-3d]", className)}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
    >
      {children}
    </motion.div>
  );
}
