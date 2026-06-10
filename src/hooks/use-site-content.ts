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

  // The FIRST render must match the server HTML exactly to avoid a React
  // hydration mismatch: the server has no localStorage, so it renders
  // `initialContent ?? defaultContent`. We mirror that here and only swap in the
  // locally-cached content AFTER hydration (in the mount effect below), so
  // returning visitors still get their saved layout — just one tick later,
  // behind the brand splash — without discarding the server markup.
  const [content, setContent] = useState<SiteContent>(initialContent ?? defaultContent);
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
    // Post-hydration: apply the locally-cached layout immediately (returning
    // visitors), unless the server already provided real content. Safe now —
    // this runs after hydration, so it can't cause an SSR mismatch.
    if (!initialContent) {
      setContent(loadLocal());
    }
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
  }, [reload, isPreview, loadLocal, initialContent]);

  return { content, isLoading, reload };
}
