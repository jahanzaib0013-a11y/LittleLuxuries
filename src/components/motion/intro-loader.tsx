import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import type { AnimationTemplate } from "@/lib/content-data";
import { intensityFor, prefersReducedMotion, LUX_EASE } from "@/lib/motion";

const SESSION_KEY = "ll-intro-shown";

/**
 * First-load brand curtain on the landing page. Logo fades up and a thin gold
 * rule draws across, then the panel lifts to reveal the hero. Plays once per
 * browser session and only at intensities that enable it.
 */
export function IntroLoader({ template }: { template: AnimationTemplate }) {
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
