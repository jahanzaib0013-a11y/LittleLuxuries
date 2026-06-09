import { Fragment, useRef, type ElementType } from "react";
import { motion, useInView } from "motion/react";
import { useAnimationTemplate } from "@/components/reveal";
import { intensityFor, prefersReducedMotion, LUX_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type RevealTextProps = {
  /** Source text. `\n` splits into separate lines. */
  text: string;
  as?: ElementType;
  className?: string;
  /** Class applied to lines after the first `\n` (e.g. italic accent). */
  emphasisClassName?: string;
};

/**
 * Premium masked text reveal: each word rises from behind a clip mask,
 * staggered, when the heading scrolls into view (or on mount if already
 * visible). Falls back to plain text when motion is disabled.
 */
export function RevealText({ text, as, className, emphasisClassName }: RevealTextProps) {
  const template = useAnimationTemplate();
  const { enabled, reveal } = intensityFor(template);
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const lines = text.split("\n");

  if (!enabled || prefersReducedMotion()) {
    return (
      <Tag className={className}>
        {lines.map((line, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            <span className={i > 0 ? emphasisClassName : undefined}>{line}</span>
          </Fragment>
        ))}
      </Tag>
    );
  }

  let wordCounter = 0;
  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className={cn("block", lineIndex > 0 && emphasisClassName)}>
          {line.split(" ").map((word, wi) => {
            const delay = wordCounter * reveal.stagger;
            wordCounter += 1;
            return (
              <span
                key={wi}
                className="reveal-line mr-[0.25em] inline-block align-bottom"
                aria-hidden="true"
              >
                <motion.span
                  className="inline-block will-change-transform"
                  initial={{ y: `${reveal.distance}%` }}
                  animate={inView ? { y: "0%" } : { y: `${reveal.distance}%` }}
                  transition={{ duration: reveal.duration, ease: LUX_EASE, delay }}
                >
                  {word}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
    </Tag>
  );
}
