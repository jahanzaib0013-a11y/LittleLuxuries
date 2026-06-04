import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;
const CLICK_ZOOM = 2;
const TAP_THRESHOLD = 10;

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
  badge?: string | null;
}

export function ProductImageGallery({ images, alt, badge }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const pointerStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const didDragRef = useRef(false);
  const activePointerId = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const applyTransform = useCallback((s: number, p: { x: number; y: number }) => {
    const img = imgRef.current;
    if (!img) return;
    img.style.transform = `translate(${p.x}px, ${p.y}px) scale(${s})`;
  }, []);

  const clampPan = useCallback((p: { x: number; y: number }, s: number) => {
    const el = viewportRef.current;
    if (!el || s <= MIN_ZOOM) return { x: 0, y: 0 };

    const { width, height } = el.getBoundingClientRect();
    const maxX = (width * (s - 1)) / 2;
    const maxY = (height * (s - 1)) / 2;

    return {
      x: Math.min(maxX, Math.max(-maxX, p.x)),
      y: Math.min(maxY, Math.max(-maxY, p.y)),
    };
  }, []);

  const setPanClamped = useCallback(
    (p: { x: number; y: number }, s: number = scaleRef.current) => {
      const clamped = clampPan(p, s);
      panRef.current = clamped;
      applyTransform(s, clamped);
      return clamped;
    },
    [clampPan, applyTransform],
  );

  const gallery = images.filter(Boolean);
  const currentImage = gallery[activeIndex] ?? gallery[0];
  const isZoomed = scale > 1;

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    applyTransform(scale, pan);
  }, [scale, pan, currentImage, applyTransform]);

  const resetView = useCallback(() => {
    scaleRef.current = MIN_ZOOM;
    panRef.current = { x: 0, y: 0 };
    setScale(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
    setIsPanning(false);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + gallery.length) % gallery.length);
      resetView();
    },
    [gallery.length, resetView],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  const zoomIn = useCallback(() => {
    setScale((s) => {
      const next = Math.min(MAX_ZOOM, s + ZOOM_STEP);
      const clamped = setPanClamped(panRef.current, next);
      setPan(clamped);
      return next;
    });
  }, [setPanClamped]);

  const zoomOut = useCallback(() => {
    setScale((s) => {
      const next = Math.max(MIN_ZOOM, s - ZOOM_STEP);
      if (next === MIN_ZOOM) {
        panRef.current = { x: 0, y: 0 };
        setPan({ x: 0, y: 0 });
      } else {
        const clamped = setPanClamped(panRef.current, next);
        setPan(clamped);
      }
      return next;
    });
  }, [setPanClamped]);

  const zoomAtPoint = useCallback((clientX: number, clientY: number) => {
    const el = viewportRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const ox = clientX - rect.left;
    const oy = clientY - rect.top;
    const newScale = CLICK_ZOOM;
    const panX = (rect.width / 2 - ox) * (newScale - 1);
    const panY = (rect.height / 2 - oy) * (newScale - 1);
    const nextPan = clampPan({ x: panX, y: panY }, newScale);

    scaleRef.current = newScale;
    panRef.current = nextPan;
    setScale(newScale);
    setPan(nextPan);
  }, [clampPan]);

  const stopControlEvent = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const endPointerSession = useCallback(
    (clientX: number, clientY: number) => {
      const moved = Math.hypot(
        clientX - pointerStart.current.x,
        clientY - pointerStart.current.y,
      );

      activePointerId.current = null;
      setIsPanning(false);

      if (scaleRef.current > MIN_ZOOM) {
        setPan(setPanClamped(panRef.current, scaleRef.current));

        if (!didDragRef.current && moved < TAP_THRESHOLD) {
          resetView();
        }
        return;
      }

      if (!didDragRef.current && moved < TAP_THRESHOLD) {
        zoomAtPoint(clientX, clientY);
      }
    },
    [resetView, zoomAtPoint, setPanClamped],
  );

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (activePointerId.current === null || e.pointerId !== activePointerId.current) return;
      if (scaleRef.current <= MIN_ZOOM) return;

      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;

      if (Math.hypot(dx, dy) > 2) {
        didDragRef.current = true;
        setIsPanning(true);
      }

      const nextPan = clampPan(
        {
          x: pointerStart.current.panX + dx,
          y: pointerStart.current.panY + dy,
        },
        scaleRef.current,
      );
      panRef.current = nextPan;
      applyTransform(scaleRef.current, nextPan);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (activePointerId.current === null || e.pointerId !== activePointerId.current) return;
      endPointerSession(e.clientX, e.clientY);
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (activePointerId.current === null || e.pointerId !== activePointerId.current) return;
      setPan(setPanClamped(panRef.current, scaleRef.current));
      activePointerId.current = null;
      setIsPanning(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [applyTransform, clampPan, endPointerSession, setPanClamped]);

  useEffect(() => {
    if (!isZoomed) return;

    const onPointerDown = (e: PointerEvent) => {
      if (activePointerId.current !== null) return;

      const viewport = viewportRef.current;
      if (!viewport) return;

      const target = e.target as Node;
      if (viewport.contains(target)) return;
      if (controlsRef.current?.contains(target)) return;

      resetView();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isZoomed, resetView]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || activePointerId.current !== null) return;

    didDragRef.current = false;
    setIsPanning(false);
    activePointerId.current = e.pointerId;
    pointerStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (scaleRef.current > MIN_ZOOM) {
      resetView();
    } else {
      zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  };

  if (!currentImage) return null;

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-card shadow-(--shadow-card)">
        {badge && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
            {badge}
          </span>
        )}

        <div
          ref={viewportRef}
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          className={cn(
            "relative h-full w-full touch-none select-none outline-none",
            isZoomed ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
          )}
          aria-label={
            isZoomed ? "Drag to pan. Tap to reset zoom." : "Tap or click to zoom in"
          }
        >
          <img
            ref={imgRef}
            src={currentImage}
            alt={alt}
            width={1024}
            height={1024}
            draggable={false}
            className="h-full w-full object-cover"
            style={{
              transformOrigin: "center center",
              willChange: isZoomed ? "transform" : undefined,
            }}
          />
        </div>

        {isZoomed && (
          <div
            ref={controlsRef}
            className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-white/90 p-1 shadow-md backdrop-blur-sm"
            onPointerDown={stopControlEvent}
            onClick={stopControlEvent}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onPointerDown={stopControlEvent}
              onClick={(e) => {
                stopControlEvent(e);
                zoomOut();
              }}
              disabled={scale <= MIN_ZOOM}
              className="size-8 rounded-full"
              aria-label="Zoom out"
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="min-w-10 text-center text-[10px] font-medium tabular-nums text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onPointerDown={stopControlEvent}
              onClick={(e) => {
                stopControlEvent(e);
                zoomIn();
              }}
              disabled={scale >= MAX_ZOOM}
              className="size-8 rounded-full"
              aria-label="Zoom in"
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onPointerDown={stopControlEvent}
              onClick={(e) => {
                stopControlEvent(e);
                resetView();
              }}
              className="size-8 rounded-full"
              aria-label="Reset zoom"
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/30 to-transparent p-4">
          <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
            {isZoomed ? "Drag to pan · Tap to reset" : "Click to zoom"}
          </span>
        </div>

        {gallery.length > 1 && !isZoomed && (
          <>
            <button
              type="button"
              onPointerDown={stopControlEvent}
              onClick={(e) => {
                stopControlEvent(e);
                goPrev();
              }}
              className="absolute left-3 top-1/2 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-md hover:bg-white touch-manipulation"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onPointerDown={stopControlEvent}
              onClick={(e) => {
                stopControlEvent(e);
                goNext();
              }}
              className="absolute right-3 top-1/2 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-md hover:bg-white touch-manipulation"
              aria-label="Next image"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
          {gallery.slice(0, 5).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                "aspect-square overflow-hidden rounded-xl border-2 transition-all touch-manipulation",
                currentImage === img
                  ? "scale-95 border-primary"
                  : "border-transparent hover:border-border",
              )}
              aria-label={`View image ${i + 1}`}
              aria-current={currentImage === img}
            >
              <img src={img} alt="" className="h-full w-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
