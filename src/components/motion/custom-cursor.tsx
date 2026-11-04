import { Suspense, lazy } from "react";
import type { AnimationTemplate } from "@/lib/content-data";
import {
  intensityFor,
  prefersReducedMotion,
  useMotionContentSettled,
} from "@/lib/motion";

const Cursor = lazy(() => import("./animated").then((m) => ({ default: m.CustomCursorImpl })));

/**
 * Minimal custom cursor: a precise dot plus a spring-trailing ring that grows
 * over interactive elements. Only on fine pointers (desktop) and at intensities
 * that enable it; otherwise the native cursor is left untouched.
 *
 * Renders nothing at intensities without a cursor, so the motion library behind
 * it is never fetched for them.
 */
export function CustomCursor({ template }: { template: AnimationTemplate }) {
  const settled = useMotionContentSettled();
  if (!settled || !intensityFor(template).customCursor || prefersReducedMotion()) return null;

  return (
    <Suspense fallback={null}>
      <Cursor template={template} />
    </Suspense>
  );
}
