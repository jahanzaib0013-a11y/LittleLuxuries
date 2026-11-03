/**
 * Supabase Storage image transforms.
 *
 * Product/category photos are uploaded at camera resolution (1050-1664 px wide,
 * some originals over 2 MB) while the storefront renders them inside cards that
 * are 290-400 CSS px wide. Requesting the original bytes for every card is the
 * single biggest payload on the page.
 *
 * Supabase exposes the same objects through a resize/format CDN at
 * `/storage/v1/render/image/public/<bucket>/<path>?width=&resize=&quality=&format=`,
 * so we rewrite the stored public object URL to that endpoint and ask for a
 * retina-sized proxy. Two parameters are load-bearing and were measured on this
 * project's own objects:
 *   `resize=contain` — with only `width`, the renderer keeps the ORIGINAL height
 *   and squashes the image (a 1200x1200 photo came back 700x1200). With
 *   `contain` and no height it scales proportionally (1200x1200 → 700x700,
 *   1051x1400 → 700x932), which is what preserves the look exactly.
 *   `format=webp` — without it the renderer re-encodes to PNG, which measured
 *   larger than the original (1.4 MB vs 2.2 MB source).
 * The renderer answers with `cache-control: public, max-age=31536000`, so each
 * variant is computed once and then served from the edge.
 *
 * Everything here is deterministic and side-effect free, so server and client
 * render the same URL (no hydration drift), and any URL we don't recognise
 * (bundled asset, external CDN, signed URL, unknown host) is returned verbatim.
 */

/** Storage public-object path prefix that the render endpoint can serve. */
const PUBLIC_OBJECT_PREFIX = "/storage/v1/object/public/";
/** The transform endpoint serves the same path under this prefix. */
const RENDER_PREFIX = "/storage/v1/render/image/public/";

/** Formats Supabase's image renderer accepts as input. */
const TRANSFORMABLE_EXT = /\.(avif|bmp|gif|jpe?g|png|tiff|webp)$/i;

/**
 * Cards on `/`, `/shop` and `/favorites` render at 290-400 CSS px wide; 700 px
 * covers ~2x for the grid with a little headroom for the larger featured tiles,
 * and one shared width keeps every surface on the same cached variant.
 */
export const CARD_IMAGE_WIDTH = 700;

/**
 * Returns a resized WebP proxy URL for a Supabase public object URL, or the
 * input unchanged for anything else. `width` is only ever applied as a
 * downscale request — the renderer keeps the original aspect ratio.
 */
export function sizedImage(
  url: string | null | undefined,
  width: number = CARD_IMAGE_WIDTH,
  quality = 78,
): string | null | undefined {
  if (!url) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url; // relative/bundled asset path or malformed — leave it alone
  }

  if (!/(^|\.)supabase\.co$/i.test(parsed.hostname)) return url;
  if (!parsed.pathname.startsWith(PUBLIC_OBJECT_PREFIX)) return url; // signed/private paths stay as-is
  if (!TRANSFORMABLE_EXT.test(parsed.pathname)) return url;

  const bucketPath = parsed.pathname.slice(PUBLIC_OBJECT_PREFIX.length);
  const proxied = new URL(`${parsed.origin}${RENDER_PREFIX}${bucketPath}`);
  proxied.searchParams.set("width", String(width));
  // Required for a proportional scale — see the note above (default pins height).
  proxied.searchParams.set("resize", "contain");
  proxied.searchParams.set("quality", String(quality));
  proxied.searchParams.set("format", "webp");
  return proxied.toString();
}

/**
 * Inverse of {@link sizedImage}: the original object URL for a proxied one,
 * identity for anything else. Used to retry a card at full resolution if the
 * transform endpoint ever refuses an object (oversized source, odd format),
 * so a failed proxy degrades to the real photo instead of a placeholder.
 */
export function originalImage(url: string): string {
  if (!url.includes(RENDER_PREFIX)) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith(RENDER_PREFIX)) return url;
    parsed.pathname = PUBLIC_OBJECT_PREFIX + parsed.pathname.slice(RENDER_PREFIX.length);
    parsed.search = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * `onError` for surfaces with no placeholder image of their own: if a proxied
 * URL fails, retry the original object once. Cards on `/shop` and `/favorites`
 * use this; storefront surfaces use imageErrorFallback (retry, then a fallback).
 */
export function retryOriginal(e: { currentTarget: HTMLImageElement }): void {
  const el = e.currentTarget;
  if (el.dataset.originalRetried === "1") return;
  const original = originalImage(el.src);
  if (original === el.src) return;
  el.dataset.originalRetried = "1";
  el.src = original;
}

/**
 * `onError` handler for storefront images: proxied URL → retry the original →
 * fall back to `lastResort`. Mirrors lib/utils imgErrorFallback, but keeps the
 * product's own picture on screen whenever it is reachable.
 */
export function imageErrorFallback(lastResort: string) {
  return (e: { currentTarget: HTMLImageElement }) => {
    const el = e.currentTarget;
    const attempt = Number(el.dataset.fallbackAttempt ?? "0");
    if (attempt >= 2) return;
    el.dataset.fallbackAttempt = String(attempt + 1);
    const original = originalImage(el.src);
    el.src = original !== el.src ? original : lastResort;
  };
}
