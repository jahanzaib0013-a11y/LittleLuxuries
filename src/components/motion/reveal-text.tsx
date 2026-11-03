import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
} from "react";
import { useAnimationTemplate } from "@/components/reveal";
import { intensityFor, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type RevealTextProps = {
  /** Source text. `\n` splits into separate lines. */
  text: string;
  as?: ElementType;
  className?: string;
  /** Class applied to lines after the first `\n` (e.g. italic accent). */
  emphasisClassName?: string;
  /**
   * Play the entrance on load instead of waiting for the element to scroll
   * into view. Use above the fold so the text animates from CSS alone —
   * no observer, no hydration wait.
   */
  immediate?: boolean;
};

/**
 * Premium masked text reveal: each word rises from behind a clip mask,
 * staggered, when the heading scrolls into view (or on mount if already
 * visible). The entrance itself is pure CSS (`lux-word-rise` in styles.css)
 * so it runs on the compositor instead of costing main-thread time for every
 * word. Falls back to plain text when motion is disabled.
 */
export function RevealText({
  text,
  as,
  className,
  emphasisClassName,
  immediate = false,
}: RevealTextProps) {
  const template = useAnimationTemplate();
  const { enabled, reveal } = intensityFor(template);
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(immediate);

  useEffect(() => {
    if (immediate || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate]);

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

  // Sequential word index across the whole heading drives the stagger, which
  // keeps the timing of the previous per-word delay calculation intact.
  let wordCounter = 0;

  const tuning = {
    "--reveal-dist": `${reveal.distance}%`,
    "--reveal-dur": `${Math.round(reveal.duration * 1000)}ms`,
    "--reveal-stagger": `${Math.round(reveal.stagger * 1000)}ms`,
  } as CSSProperties;

  return (
    <Tag
      ref={ref}
      className={cn("reveal-text", className)}
      data-inview={inView ? "true" : "false"}
      style={tuning}
    >
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className={cn("block", lineIndex > 0 && emphasisClassName)}>
          {line.split(" ").map((word, wi) => {
            const w = wordCounter++;
            return (
              <span
                key={wi}
                className="reveal-line mr-[0.25em] inline-block align-bottom"
                aria-hidden="true"
              >
                <span className="reveal-word" style={{ "--w": w } as CSSProperties}>
                  {word}
                </span>
              </span>
            );
          })}
        </span>
      ))}
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
    </Tag>
  );
}
