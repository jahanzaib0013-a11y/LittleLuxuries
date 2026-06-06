import { type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Plays a one-shot enter animation on every navigation. We key the wrapper on
 * the current pathname so it re-mounts per route, replaying the `.page-enter`
 * keyframe. The actual look is driven by the `data-anim-template` attribute on
 * an ancestor (see styles.css) and is fully neutralized for "none" /
 * prefers-reduced-motion. No exit animation — dependency-free and premium.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
