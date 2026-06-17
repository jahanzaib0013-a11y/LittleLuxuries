import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import type { AnimationTemplate } from "@/lib/content-data";
import { intensityFor, prefersReducedMotion } from "@/lib/motion";

/**
 * Minimal custom cursor: a precise dot plus a spring-trailing ring that grows
 * over interactive elements. Only on fine pointers (desktop) and at intensities
 * that enable it; otherwise the native cursor is left untouched.
 */
export function CustomCursor({ template }: { template: AnimationTemplate }) {
  const [active, setActive] = useState(false);
  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 380, damping: 32, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 380, damping: 32, mass: 0.5 });

  useEffect(() => {
    const eligible =
      intensityFor(template).customCursor &&
      !prefersReducedMotion() &&
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches;
    if (!eligible) return;

    setActive(true);
    document.body.classList.add("lux-cursor-none");

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = e.target as HTMLElement | null;
      setHovering(Boolean(el?.closest('a, button, [data-cursor="view"], [role="button"]')));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      document.body.classList.remove("lux-cursor-none");
    };
  }, [template, x, y]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] hidden md:block" aria-hidden="true">
      <motion.div
        className="fixed left-0 top-0 rounded-full bg-primary"
        style={{ x, y, width: 6, height: 6, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        className="fixed left-0 top-0 rounded-full border border-primary/50"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: hovering ? 56 : 30,
          height: hovering ? 56 : 30,
          opacity: hovering ? 0.9 : 0.5,
          // rgba (not oklch) so motion can interpolate it — oklch is not animatable.
          // rgb(92,66,149) === oklch(0.45 0.13 295), the brand primary.
          backgroundColor: hovering ? "rgba(92, 66, 149, 0.08)" : "rgba(92, 66, 149, 0)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      />
    </div>
  );
}
