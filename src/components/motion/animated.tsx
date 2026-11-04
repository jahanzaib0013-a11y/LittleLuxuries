import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import type { AnimationTemplate } from "@/lib/content-data";
import { intensityFor, prefersReducedMotion, LUX_EASE, LUX_SPRING } from "@/lib/motion";

/**
 * Every animation implementation in one module.
 *
 * Nothing in `src/components/motion/*` imports this file directly — each public
 * component renders it through `lazy()`, so `motion/react` only enters the
 * network graph when the storefront's published `animation_style` actually
 * animates. With the template set to `none` (what littleluxuries.pk serves
 * today) this module is never fetched: ~75 KB of JavaScript and ~200 ms of
 * startup execution used to be paid for effects that render a plain div.
 *
 * Lenis is not here — `smooth-scroll.tsx` wraps the whole page, so swapping in
 * a lazily fetched wrapper would remount every card when it resolved.
 *
 * The fallback each gate passes is the exact markup this module replaces, so
 * the server HTML, the first client render and the settled render all look the
 * same.
 */

/* ------------------------------------------------------------------ parallax */

/**
 * One shared measurement pass for every parallax target on the page.
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

function measureTop(el: HTMLElement, setTop: (top: number) => void) {
  const entry = { el, setTop };
  pending.push(entry);
  if (!scheduled) scheduled = requestAnimationFrame(flush);
  return () => {
    const i = pending.indexOf(entry);
    if (i !== -1) pending.splice(i, 1);
  };
}

export function ParallaxDrift({
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

/* ----------------------------------------------------------------- tilt card */

export function TiltCardImpl({
  children,
  className,
  max,
}: {
  children: ReactNode;
  className?: string;
  max: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), LUX_SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), LUX_SPRING);

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
      className={`[transform-style:preserve-3d] ${className ?? ""}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ magnetic */

export function MagneticImpl({
  children,
  className,
  strength,
}: {
  children: ReactNode;
  className?: string;
  strength: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useSpring(useMotionValue(0), LUX_SPRING);
  const y = useSpring(useMotionValue(0), LUX_SPRING);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
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

/* --------------------------------------------------------------- custom cursor */

export function CustomCursorImpl({ template }: { template: AnimationTemplate }) {
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

    const move = (e: globalThis.PointerEvent) => {
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

/* ---------------------------------------------------------------- intro loader */

const SESSION_KEY = "ll-intro-shown";

export function IntroLoaderImpl({ template }: { template: AnimationTemplate }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [show, setShow] = useState(false);

  useEffect(() => {
    const eligible =
      pathname === "/" &&
      intensityFor(template).introLoader &&
      !prefersReducedMotion() &&
      typeof window !== "undefined" &&
      !sessionStorage.getItem(SESSION_KEY);
    if (!eligible) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 1900);
    return () => clearTimeout(t);
    // Run once on mount; deliberately ignore later pathname changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="lux-grain fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: "var(--gradient-hero)" }}
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: LUX_EASE }}
        >
          <motion.img
            src={logo}
            alt="Little Luxuries"
            width={96}
            height={96}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: LUX_EASE }}
          />
          <motion.span
            className="mt-5 font-serif text-2xl italic text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Little Luxuries
          </motion.span>
          <motion.span
            className="mt-4 block h-px bg-gradient-to-r from-transparent via-gold to-transparent"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 160, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.35, ease: LUX_EASE }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------- count up */

export function CountUpImpl({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const match = text.match(/([\d,]+)/);
  const target = match ? parseInt(match[1].replace(/,/g, ""), 10) : null;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || target === null) return;
    const controls = animate(0, target, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, target]);

  if (!match) return <span className={className}>{text}</span>;
  return (
    <span ref={ref} className={className}>
      {text.replace(match[1], display.toLocaleString("en-US"))}
    </span>
  );
}
