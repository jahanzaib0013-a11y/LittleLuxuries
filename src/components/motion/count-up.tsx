import { Suspense, lazy } from "react";
import { useAnimationTemplate } from "@/components/reveal";
import {
  intensityFor,
  prefersReducedMotion,
  useMotionContentSettled,
} from "@/lib/motion";

const Counter = lazy(() => import("./animated").then((m) => ({ default: m.CountUpImpl })));

/**
 * Renders text with its first numeric token counting up from zero when it
 * scrolls into view (e.g. "Loved by 12,000+ families"). No-ops to the plain
 * text when there's no number or motion is disabled.
 *
 * The plain text is also the Suspense fallback, so the number is readable
 * before the animation module lands — and at `animation_style: none` that
 * module is never requested.
 */
export function CountUp({ text, className }: { text: string; className?: string }) {
  const template = useAnimationTemplate();
  const { enabled } = intensityFor(template);
  const settled = useMotionContentSettled();
  const match = text.match(/([\d,]+)/);
  const animateNow = enabled && settled && !prefersReducedMotion() && match !== null;

  if (!animateNow) {
    return <span className={className}>{text}</span>;
  }

  return (
    <Suspense fallback={<span className={className}>{text}</span>}>
      <Counter text={text} className={className} />
    </Suspense>
  );
}
