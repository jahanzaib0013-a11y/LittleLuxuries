import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useAnimationTemplate } from "@/components/reveal";
import { intensityFor, prefersReducedMotion, useMounted } from "@/lib/motion";

/**
 * One shared measurement pass for every Parallax on the page.
 *
 * Each instance used to read `getBoundingClientRect()` in its own mount effect.
 * React runs those effects one after another, and each `setTop` writes to the DOM
 * before the next instance reads — read/write/read/write against a large tree.
 * That is a forced-reflow (layout thrash) pattern: a trace of the storefront
 * measured 1,112 ms of 1,123 ms total reflow time inside this module alone.
 *
 * Now instances enqueue themselves and a single animation frame performs all the
 * reads back to back (so layout is computed exactly once), then applies all the
 * state updates (React batches those into one render).
 */
type Pending = { el: HTMLElement; setTop: (top: number) => void };

const pending: Pending[] = [];
let scheduled = 0;

function flush() {
  scheduled = 0;
  const batch = pending.splice(0, pending.length);
  if (!batch.length) return;
  const scrollY = window.scrollY;
  // Reads only — nothing mutates the DOM in this loop.
  const tops = batch.map(({ el }) => el.getBoundingClientRect().top + scrollY);
  // Writes only — one React batched render for the whole group.
  batch.forEach(({ setTop }, i) => setTop(tops[i]));
}

/** Register an element for the next shared measurement. Returns an unregister. */
function measureTop(el: HTMLElement, setTop: (top: number) => void) {
  const entry = { el, setTop };
  pending.push(entry);
  if (!scheduled) scheduled = requestAnimationFrame(flush);
  return () => {
    const i = pending.indexOf(entry);
    if (i !== -1) pending.splice(i, 1);
  };
}

/** Vertical drift driven by scroll. Rendered only when motion is enabled. */
function Drift({
  children,
  className,
  travel,
}: {
  children: ReactNode;
  className?: string;
  travel: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [top, setTop] = useState(0);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [top - 800, top + 800], [travel, -travel]);

  // The element exists and the page is laid out by the time this runs: Drift is
  // only mounted after `useMounted()` flips, which is exactly when a measurement
  // is meaningful.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return measureTop(el, setTop);
  }, []);

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}

/**
 * Drifts its children vertically as the page scrolls, creating depth. Uses
 * viewport scroll (no target ref) so it's SSR-safe and never hits motion's
 * "target ref not hydrated" path.
 *
 * When motion is off (the storefront's published `animation_style` is `none`)
 * or the visitor asks for reduced motion, this renders a plain div and mounts
 * no hooks: no scroll subscription, no measurement, no reflow. The measurement
 * used to run in that case too, for a value nothing ever read.
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

  // Order matters for hydration: `!mounted` is true on the server and on the
  // first client render, so both paint the same plain div.
  if (!enabled || !mounted || prefersReducedMotion()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Drift className={className} travel={parallax * factor}>
      {children}
    </Drift>
  );
}
