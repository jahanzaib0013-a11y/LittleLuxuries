import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronsLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

const THUMB_WIDTH_PX = 56;

type HorizontalScrollAreaProps = {
  children: ReactNode;
  className?: string;
  scrollClassName?: string;
  sliderLabel?: string;
};

export function HorizontalScrollArea({
  children,
  className,
  scrollClassName,
  sliderLabel = "Slide to browse",
}: HorizontalScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ pointerId: number } | null>(null);
  const skipScrollSync = useRef(false);

  const [scrollRatio, setScrollRatio] = useState(0);
  const [needsSlider, setNeedsSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const getMaxScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 0;
    return Math.max(0, el.scrollWidth - el.clientWidth);
  }, []);

  const applyScrollRatio = useCallback(
    (ratio: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const max = getMaxScroll();
      if (max <= 0) return;
      const clamped = Math.min(1, Math.max(0, ratio));
      skipScrollSync.current = true;
      el.scrollLeft = clamped * max;
      setScrollRatio(clamped);
      requestAnimationFrame(() => {
        skipScrollSync.current = false;
      });
    },
    [getMaxScroll],
  );

  const syncFromScrollElement = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const scrollable = max > 8;
    setNeedsSlider(scrollable);
    if (skipScrollSync.current) return;
    if (max <= 0) {
      setScrollRatio(0);
      return;
    }
    setScrollRatio(el.scrollLeft / max);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    syncFromScrollElement();
    el.addEventListener("scroll", syncFromScrollElement, { passive: true });
    const ro = new ResizeObserver(syncFromScrollElement);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", syncFromScrollElement);
      ro.disconnect();
    };
  }, [syncFromScrollElement, children]);

  const ratioFromPointer = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const travel = Math.max(1, rect.width - THUMB_WIDTH_PX);
    const x = clientX - rect.left - THUMB_WIDTH_PX / 2;
    return Math.min(1, Math.max(0, x / travel));
  }, []);

  const endDrag = useCallback(() => {
    dragState.current = null;
    setIsDragging(false);
  }, []);

  const startSliderDrag = (e: ReactPointerEvent<HTMLElement>) => {
    if (!needsSlider) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { pointerId: e.pointerId };
    setIsDragging(true);
    applyScrollRatio(ratioFromPointer(e.clientX));
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const drag = dragState.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      e.preventDefault();
      applyScrollRatio(ratioFromPointer(e.clientX));
    };

    const onPointerUp = (e: PointerEvent) => {
      const drag = dragState.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      endDrag();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [applyScrollRatio, ratioFromPointer, endDrag]);

  const thumbLeft = `calc(${scrollRatio * 100}% - ${scrollRatio * THUMB_WIDTH_PX}px)`;
  const fillWidth = `calc(${scrollRatio * 100}% - ${scrollRatio * THUMB_WIDTH_PX * 0.5}px)`;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="relative min-w-0">
        {needsSlider && scrollRatio > 0.02 ? (
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 bg-linear-to-r from-card to-transparent"
            aria-hidden
          />
        ) : null}
        {needsSlider && scrollRatio < 0.98 ? (
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 bg-linear-to-l from-card to-transparent"
            aria-hidden
          />
        ) : null}

        <div
          ref={scrollRef}
          className={cn(
            "hide-scrollbar overflow-x-auto overscroll-x-contain touch-pan-x",
            scrollClassName,
          )}
        >
          {children}
        </div>
      </div>

      {needsSlider ? (
        <div className="mt-3 px-3 pb-3 sm:px-4 sm:pb-4">
          <div
            ref={trackRef}
            role="slider"
            aria-label={sliderLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(scrollRatio * 100)}
            className={cn(
              "relative h-12 select-none rounded-full border border-border/50 bg-muted/70 p-1 shadow-inner",
              isDragging ? "cursor-grabbing" : "cursor-pointer",
            )}
            onPointerDown={startSliderDrag}
          >
            <div
              className="pointer-events-none absolute inset-y-1 left-1 rounded-full bg-primary/20 transition-[width] duration-75"
              style={{ width: fillWidth }}
              aria-hidden
            />

            <span
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center justify-center pl-14 pr-4 text-[11px] font-semibold tracking-wide text-muted-foreground/90 transition-opacity sm:text-xs",
                (isDragging || scrollRatio > 0.08) && "opacity-0",
              )}
            >
              {sliderLabel}
            </span>

            <div
              data-scroll-thumb
              className={cn(
                "absolute top-1 z-10 flex h-10 w-14 touch-none items-center justify-center rounded-full border border-white/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)]",
                isDragging ? "cursor-grabbing scale-[1.02]" : "cursor-grab hover:shadow-[0_4px_16px_rgba(0,0,0,0.14)]",
              )}
              style={{ left: thumbLeft }}
            >
              <ChevronsLeftRight className="h-4 w-4 text-primary" strokeWidth={2.25} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
