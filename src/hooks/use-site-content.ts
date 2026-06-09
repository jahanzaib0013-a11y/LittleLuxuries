import { useCallback, useEffect, useState } from "react";
import {
  defaultContent,
  loadPreviewContent,
  loadPublishedContent,
  loadPublishedContentAsync,
  SITE_CONTENT_PREVIEW_UPDATED_EVENT,
  SITE_CONTENT_PUBLISHED_UPDATED_EVENT,
  type SiteContent,
  type SiteContentSource,
} from "@/lib/content-data";

type UseSiteContentOptions = {
  /** `published` = live homepage (/). `preview` = storefront draft (/storefront). */
  source?: SiteContentSource;
  /**
   * Server-rendered content from the route loader. When provided, the first
   * render uses the real content (correct hero image in the initial HTML)
   * instead of `defaultContent`, eliminating the client-side fetch waterfall
   * that delayed LCP. The hook still re-syncs on mount to pick up live edits.
   */
  initialContent?: SiteContent | null;
};

export function useSiteContent(options?: UseSiteContentOptions) {
  const source = options?.source ?? "published";
  const isPreview = source === "preview";
  const initialContent = options?.initialContent ?? null;

  // Initialize synchronously from the locally-cached content on the client, so
  // returning visitors render the correct layout (promo bar, announcement
  // section, real hero text) on the FIRST paint — no default→real swap that
  // pushed the page around. Falls back to defaults on the server / first visit.
  const [content, setContent] = useState<SiteContent>(() => {
    if (initialContent) return initialContent;
    if (typeof window !== "undefined") {
      try {
        return isPreview ? loadPreviewContent() : loadPublishedContent();
      } catch {
        return defaultContent;
      }
    }
    return defaultContent;
  });
  const [isLoading, setIsLoading] = useState(!initialContent);

  const loadLocal = useCallback(() => {
    return isPreview ? loadPreviewContent() : loadPublishedContent();
  }, [isPreview]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isPreview) {
        setContent(loadPreviewContent());
      } else {
        const loaded = await loadPublishedContentAsync();
        setContent(loaded);
      }
    } catch {
      setContent(loadLocal());
    } finally {
      setIsLoading(false);
      // Signal the brand splash that content has settled so it can reveal a
      // finished page (see AppSplash in __root.tsx).
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("ll-app-ready"));
      }
    }
  }, [isPreview, loadLocal]);

  useEffect(() => {
    reload();

    const eventName = isPreview
      ? SITE_CONTENT_PREVIEW_UPDATED_EVENT
      : SITE_CONTENT_PUBLISHED_UPDATED_EVENT;

    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<SiteContent>).detail;
      if (detail) {
        setContent(detail);
        return;
      }
      setContent(loadLocal());
    };

    const onStorage = (event: StorageEvent) => {
      const previewKey = "little-luxuries-content-preview";
      const publishedKey = "little-luxuries-content-published";
      if (isPreview && event.key !== previewKey && event.key !== null) return;
      if (!isPreview && event.key !== publishedKey && event.key !== null) return;
      setContent(loadLocal());
    };

    window.addEventListener(eventName, onUpdate);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(eventName, onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, [reload, isPreview, loadLocal]);

  return { content, isLoading, reload };
}
