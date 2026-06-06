import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import type { AnimationTemplate } from "@/lib/content-data";
import { cn } from "@/lib/utils";

const AnimationTemplateContext = createContext<AnimationTemplate>("editorial");

export function AnimationTemplateProvider({
  value,
  children,
}: {
  value: AnimationTemplate;
  children: ReactNode;
}) {
  return (
    <AnimationTemplateContext.Provider value={value}>{children}</AnimationTemplateContext.Provider>
  );
}

export function useAnimationTemplate(): AnimationTemplate {
  return useContext(AnimationTemplateContext);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type RevealProps = {
  children: ReactNode;
  /** Used for stagger delay and (for directional templates) alternating side. */
  index?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Scroll-reveal wrapper. Starts hidden and animates in when it enters the
 * viewport. The actual look (rise / scale / blur) is driven by the
 * `data-anim-template` attribute on an ancestor (see styles.css). Honors
 * prefers-reduced-motion and degrades gracefully without IntersectionObserver.
 */
export function Reveal({ children, index = 0, as, className }: RevealProps) {
  const template = useAnimationTemplate();
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (
      template === "none" ||
      prefersReducedMotion() ||
      typeof IntersectionObserver === "undefined"
    ) {
      setRevealed(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [template]);

  const dir = index % 2 === 0 ? "left" : "right";
  const delayMs = Math.min(index, 6) * 90;

  return (
    <Tag
      ref={ref}
      className={cn("reveal", className)}
      data-revealed={revealed ? "true" : "false"}
      data-dir={dir}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </Tag>
  );
}

type HeroStaggerProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
};

/**
 * Hero choreography wrapper. Each `HeroStaggerItem` child plays a one-shot
 * entrance keyframe on mount (the hero is in view at load), staggered by its
 * `--i` index consumed in styles.css. The look per template is scoped by
 * `data-anim-template`. Reduced-motion / "none" users get the final state.
 */
export function HeroStagger({ children, as, className }: HeroStaggerProps) {
  const template = useAnimationTemplate();
  const Tag = (as ?? "div") as ElementType;
  const active = template !== "none" && !prefersReducedMotion();

  return (
    <Tag
      className={cn(active && "hero-stagger", className)}
      data-hero-stagger={active ? "true" : "false"}
    >
      {children}
    </Tag>
  );
}

/** Assigns the stagger index (`--i`) to a single hero element. */
export function HeroStaggerItem({
  children,
  index,
  as,
  className,
}: {
  children: ReactNode;
  index: number;
  as?: ElementType;
  className?: string;
}) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag className={className} style={{ "--i": index } as CSSProperties}>
      {children}
    </Tag>
  );
}
