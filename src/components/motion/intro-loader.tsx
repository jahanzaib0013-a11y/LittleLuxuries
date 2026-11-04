import { Suspense, lazy } from "react";
import type { AnimationTemplate } from "@/lib/content-data";
import {
  intensityFor,
  prefersReducedMotion,
  useMotionContentSettled,
} from "@/lib/motion";

const Curtain = lazy(() => import("./animated").then((m) => ({ default: m.IntroLoaderImpl })));

/**
 * First-load brand curtain on the landing page. Logo fades up and a thin gold
 * rule draws across, then the panel lifts to reveal the hero. Plays once per
 * browser session and only at intensities that enable it.
 *
 * Intensities without a curtain never fetch the animation library at all, and
 * the curtain paints over the hero rather than inside it, so a late-resolving
 * chunk cannot shift anything below it.
 */
export function IntroLoader({ template }: { template: AnimationTemplate }) {
  const settled = useMotionContentSettled();
  if (!settled || !intensityFor(template).introLoader || prefersReducedMotion()) return null;

  return (
    <Suspense fallback={null}>
      <Curtain template={template} />
    </Suspense>
  );
}
