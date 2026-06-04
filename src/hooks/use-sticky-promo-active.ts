import { useSiteContent } from "@/hooks/use-site-content";
import type { SiteContentSource } from "@/lib/content-data";

/** True when the bottom sticky promo bar should show on the homepage. */
export function useStickyPromoActive(contentSource: SiteContentSource = "published") {
  const { content } = useSiteContent({ source: contentSource });
  const promo = content.promoBanner;
  return Boolean(promo.isActive && promo.placements.stickyBottom);
}
