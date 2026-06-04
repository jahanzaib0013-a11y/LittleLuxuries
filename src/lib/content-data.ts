import { contentService } from "@/lib/supabase-service";

export interface HeroBanner {
  headline: string;
  buttonLabel: string;
  buttonLink: string;
  seasonTag: string;
  description: string;
  badgeTitle: string;
  badgeSubtitle: string;
  imageUrl?: string;
  socialProofText: string;
  showSocialProof: boolean;
  socialProofIconName: string;
}

export interface AnnouncementBar {
  promises: {
    title: string;
    description: string;
    iconName?: string;
  }[];
  isActive: boolean;
}

export type PromoBannerVariant = "sale" | "festival" | "minimal";
export type PromoBannerTheme = "gold" | "primary" | "blush" | "lilac";

export interface PromoBannerPlacements {
  /** Above the site header and primary hero */
  top: boolean;
  /** Fixed sticky bar at the bottom of the viewport */
  stickyBottom: boolean;
  /** Above the three brand promise columns (below logo) */
  aboveBrandPromises: boolean;
  /** Under the brand promise columns */
  belowBrandPromises: boolean;
}

export const defaultPromoPlacements: PromoBannerPlacements = {
  top: true,
  stickyBottom: false,
  aboveBrandPromises: false,
  belowBrandPromises: false,
};

/** Maps legacy `belowHero` placement to sticky bottom bar. */
export function normalizePromoPlacements(
  raw: Partial<PromoBannerPlacements> & { belowHero?: boolean },
): PromoBannerPlacements {
  return {
    top: raw.top ?? defaultPromoPlacements.top,
    stickyBottom: raw.stickyBottom ?? raw.belowHero ?? defaultPromoPlacements.stickyBottom,
    aboveBrandPromises:
      raw.aboveBrandPromises ?? defaultPromoPlacements.aboveBrandPromises,
    belowBrandPromises:
      raw.belowBrandPromises ?? defaultPromoPlacements.belowBrandPromises,
  };
}

export interface PromoBanner {
  isActive: boolean;
  placements: PromoBannerPlacements;
  variant: PromoBannerVariant;
  eyebrow: string;
  headline: string;
  description: string;
  promoCode: string;
  showPromoCode: boolean;
  buttonLabel: string;
  buttonLink: string;
  showButton: boolean;
  iconName: string;
  textAlign: "left" | "center";
  backgroundTheme: PromoBannerTheme;
  endsAt: string | null;
}

export const defaultPromoBanner: PromoBanner = {
  isActive: false,
  placements: defaultPromoPlacements,
  variant: "festival",
  eyebrow: "Limited time",
  headline: "Seasonal Sale — 20% off",
  description: "On selected heirloom pieces.",
  promoCode: "LUXE10",
  showPromoCode: true,
  buttonLabel: "Shop the sale",
  buttonLink: "/shop",
  showButton: true,
  iconName: "Gift",
  textAlign: "center",
  backgroundTheme: "gold",
  endsAt: null,
};

export interface SiteContent {
  heroBanner: HeroBanner;
  announcementBar: AnnouncementBar;
  promoBanner: PromoBanner;
  layout: string;
}

export const defaultContent: SiteContent = {
  heroBanner: {
    headline: "Gentle luxuries\nfor your little one.",
    buttonLabel: "Shop Collection",
    buttonLink: "/shop",
    seasonTag: "New Collection 2026",
    description:
      "Thoughtfully designed garments that embrace your baby in softest ethically-sourced materials. Timeless elegance for modern nursery.",
    badgeTitle: "Hand-crafted",
    badgeSubtitle: "In small artisan batches",
    socialProofText: "Loved by 12,000+ families worldwide",
    showSocialProof: true,
    socialProofIconName: "Star",
  },
  announcementBar: {
    promises: [
      {
        title: "Ethically Made",
        description: "Responsibly sourced and sustainably produced with love for the planet.",
      },
      {
        title: "Heirloom Quality",
        description: "Standards of craftsmanship designed to last through generations.",
      },
      {
        title: "Soft on Skin",
        description: "Hypoallergenic and ultra-soft fabrics for the most sensitive skin.",
      },
    ],
    isActive: false,
  },
  promoBanner: defaultPromoBanner,
  layout: "Editorial Grid",
};

export const CATEGORY_LAYOUTS = ["Editorial Grid", "Minimal Carousel", "Full Width Stacks"] as const;
export type CategoryLayout = (typeof CATEGORY_LAYOUTS)[number];

const CONTENT_PUBLISHED_KEY = "little-luxuries-content-published";
const CONTENT_PREVIEW_KEY = "little-luxuries-content-preview";
/** @deprecated Legacy single-key storage; migrated to published on read */
const CONTENT_STORAGE_KEY_LEGACY = "little-luxuries-content";

export const SITE_CONTENT_PUBLISHED_UPDATED_EVENT = "site-content-published-updated";
export const SITE_CONTENT_PREVIEW_UPDATED_EVENT = "site-content-preview-updated";
/** @deprecated Use SITE_CONTENT_PUBLISHED_UPDATED_EVENT */
export const SITE_CONTENT_UPDATED_EVENT = SITE_CONTENT_PUBLISHED_UPDATED_EVENT;

export type SiteContentSource = "published" | "preview";

/** Character limits for homepage editor fields (layout-safe defaults). */
export const SITE_CONTENT_LIMITS = {
  headline: 36,
  seasonTag: 24,
  description: 140,
  badgeTitle: 16,
  badgeSubtitle: 32,
  buttonLabel: 20,
  buttonLink: 512,
  socialProofText: 48,
  promiseTitle: 24,
  promiseDescription: 100,
  promoEyebrow: 28,
  promoHeadline: 48,
  promoDescription: 80,
  promoCode: 16,
} as const;

export function withinCharLimit(value: string, max: number): boolean {
  return value.length <= max;
}

export function mergeSiteContent(base: SiteContent, partial: Partial<SiteContent>): SiteContent {
  return {
    ...base,
    ...partial,
    layout: partial.layout ?? base.layout,
    heroBanner: partial.heroBanner
      ? { ...base.heroBanner, ...partial.heroBanner }
      : base.heroBanner,
    announcementBar: partial.announcementBar
      ? {
          ...base.announcementBar,
          ...partial.announcementBar,
          promises: partial.announcementBar.promises ?? base.announcementBar.promises,
        }
      : base.announcementBar,
    promoBanner: partial.promoBanner
      ? {
          ...base.promoBanner,
          ...partial.promoBanner,
          placements: partial.promoBanner.placements
            ? normalizePromoPlacements({
                ...base.promoBanner.placements,
                ...partial.promoBanner.placements,
              })
            : base.promoBanner.placements,
        }
      : base.promoBanner,
  };
}

function parseStoredContent(stored: string): SiteContent | null {
  try {
    const parsed = JSON.parse(stored) as Partial<SiteContent>;
    return mergeSiteContent(defaultContent, parsed);
  } catch {
    return null;
  }
}

function migrateLegacyStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const legacy = localStorage.getItem(CONTENT_STORAGE_KEY_LEGACY);
    if (legacy && !localStorage.getItem(CONTENT_PUBLISHED_KEY)) {
      localStorage.setItem(CONTENT_PUBLISHED_KEY, legacy);
    }
  } catch {
    /* ignore */
  }
}

function readContentFromKey(key: string): SiteContent | null {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return parseStoredContent(stored);
  } catch (error) {
    console.error(`Failed to load content from ${key}:`, error);
  }
  return null;
}

/** Live site (/) — only updates when Save Changes runs. */
export function loadPublishedContent(): SiteContent {
  migrateLegacyStorage();
  return readContentFromKey(CONTENT_PUBLISHED_KEY) ?? defaultContent;
}

/** Storefront preview (/storefront) — updates live while editing. */
export function loadPreviewContent(): SiteContent {
  migrateLegacyStorage();
  return readContentFromKey(CONTENT_PREVIEW_KEY) ?? loadPublishedContent();
}

/** @deprecated Use loadPublishedContent */
export function loadContent(): SiteContent {
  return loadPublishedContent();
}

function dispatchContentEvent(name: string, content: SiteContent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<SiteContent>(name, { detail: content }));
}

/** Persist published snapshot (homepage + cloud). */
export function publishPublishedContent(content: SiteContent): void {
  try {
    localStorage.setItem(CONTENT_PUBLISHED_KEY, JSON.stringify(content));
    dispatchContentEvent(SITE_CONTENT_PUBLISHED_UPDATED_EVENT, content);
  } catch (error) {
    console.error("Failed to publish content:", error);
  }
}

/** Draft snapshot for /storefront live preview only. */
export function publishContentPreview(content: SiteContent): void {
  try {
    localStorage.setItem(CONTENT_PREVIEW_KEY, JSON.stringify(content));
    dispatchContentEvent(SITE_CONTENT_PREVIEW_UPDATED_EVENT, content);
  } catch (error) {
    console.error("Failed to publish content preview:", error);
  }
}

export function savePublishedContent(content: Partial<SiteContent>): void {
  try {
    const updatedContent = mergeSiteContent(loadPublishedContent(), content);
    publishPublishedContent(updatedContent);
    publishContentPreview(updatedContent);
  } catch (error) {
    console.error("Failed to save published content:", error);
    throw error;
  }
}

/** @deprecated Use savePublishedContent */
export function saveContent(content: Partial<SiteContent>): void {
  savePublishedContent(content);
}

export async function loadPublishedContentAsync(): Promise<SiteContent> {
  try {
    const fromDb = await contentService.getSiteContent();
    if (fromDb) {
      publishPublishedContent(fromDb);
      return fromDb;
    }
  } catch (error) {
    console.warn("Supabase content load failed, using local cache:", error);
  }
  return loadPublishedContent();
}

/** @deprecated Use loadPublishedContentAsync */
export async function loadContentAsync(): Promise<SiteContent> {
  return loadPublishedContentAsync();
}

export async function saveContentAsync(content: SiteContent): Promise<{ success: boolean; error?: string }> {
  try {
    const merged = mergeSiteContent(loadPublishedContent(), content);
    publishPublishedContent(merged);
    publishContentPreview(merged);

    const dbResult = await contentService.saveSiteContent(merged);
    if (!dbResult.success) {
      return {
        success: true,
        error:
          dbResult.error ??
          "Saved locally. Cloud sync failed — check Supabase connection.",
      };
    }
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save content";
    console.error("saveContentAsync failed:", error);
    return { success: false, error: message };
  }
}
