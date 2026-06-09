import type { CSSProperties } from "react";
import type { BackgroundAnimation as BackgroundAnimationType } from "@/lib/content-data";

/** Deterministic pseudo-random in [0,1) — stable across SSR & client (no hydration drift). */
function rand(seed: number): number {
  const x = Math.sin(seed * 99.13) * 43758.5453;
  return x - Math.floor(x);
}

/** Particle-based variants and how many bits each renders. */
const PARTICLE_COUNTS: Partial<Record<BackgroundAnimationType, number>> = {
  petals: 10,
  bubbles: 16,
  twinkle: 20,
  confetti: 18,
};

/**
 * Decorative animated backdrop rendered behind the hero. Pure CSS motion (see
 * styles.css `.bg-anim-*`); particle variants scatter `.bit` spans with
 * deterministic positions/timings. SSR-safe and frozen under reduced-motion.
 */
export function BackgroundAnimation({ variant }: { variant: BackgroundAnimationType }) {
  if (variant === "none") return null;

  const count = PARTICLE_COUNTS[variant];
  if (count) {
    return (
      <div className={`bg-anim bg-anim-${variant}`} aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => {
          const size = 8 + Math.round(rand(i + 4) * 12);
          const style: CSSProperties = {
            left: `${(rand(i + 1) * 100).toFixed(2)}%`,
            top: `${(rand(i + 5) * 100).toFixed(2)}%`,
            animationDelay: `${(-rand(i + 2) * 10).toFixed(2)}s`,
            animationDuration: `${(6 + rand(i + 3) * 8).toFixed(2)}s`,
            // consumed by CSS for per-bit size
            ["--s" as string]: `${size}px`,
          };
          return <span key={i} className="bit" style={style} />;
        })}
      </div>
    );
  }

  return <div className={`bg-anim bg-anim-${variant}`} aria-hidden="true" />;
}
