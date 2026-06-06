import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import { useAnimationTemplate } from "@/components/reveal";
import { intensityFor, prefersReducedMotion } from "@/lib/motion";

/**
 * Renders text with its first numeric token counting up from zero when it
 * scrolls into view (e.g. "Loved by 12,000+ families"). No-ops to the plain
 * text when there's no number or motion is disabled.
 */
export function CountUp({ text, className }: { text: string; className?: string }) {
  const template = useAnimationTemplate();
  const { enabled } = intensityFor(template);
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  const match = text.match(/([\d,]+)/);
  const target = match ? parseInt(match[1].replace(/,/g, ""), 10) : null;
  const [display, setDisplay] = useState(0);

  const animateNow = enabled && !prefersReducedMotion() && target !== null;

  useEffect(() => {
    if (!animateNow || !inView) return;
    const controls = animate(0, target as number, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [animateNow, inView, target]);

  if (!animateNow || !match) {
    return (
      <span ref={ref} className={className}>
        {text}
      </span>
    );
  }

  const formatted = display.toLocaleString("en-US");
  const rendered = text.replace(match[1], formatted);
  return (
    <span ref={ref} className={className}>
      {rendered}
    </span>
  );
}
