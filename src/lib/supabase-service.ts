import { supabase, Database } from "./supabase";
import type {
  SiteContent,
  HeroBanner,
  AnnouncementBar,
  PromoBanner,
  PromoBannerPlacements,
  PromoBannerVariant,
  PromoBannerTheme,
} from "./content-data";
import {
  defaultPromoBanner,
  defaultPromoPlacements,
  normalizePromoPlacements,
  defaultCraftStory,
} from "./content-data";
import type { CraftStoryContent } from "./content-data";

const FALLBACK_HERO: HeroBanner = {
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
};

const FALLBACK_PROMISES: AnnouncementBar["promises"] = [
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
];

function mapHeroFromDb(raw: unknown): HeroBanner {
  const hb = (raw ?? {}) as Record<string, unknown>;
  if (typeof hb.buttonLabel === "string" || typeof hb.seasonTag === "string") {
    return {
      headline: String(hb.headline ?? FALLBACK_HERO.headline),
      buttonLabel: String(hb.buttonLabel ?? FALLBACK_HERO.buttonLabel),
      buttonLink: String(hb.buttonLink ?? FALLBACK_HERO.buttonLink),
      seasonTag: String(hb.seasonTag ?? FALLBACK_HERO.seasonTag),
      description: String(hb.description ?? FALLBACK_HERO.description),
      badgeTitle: String(hb.badgeTitle ?? FALLBACK_HERO.badgeTitle),
      badgeSubtitle: String(hb.badgeSubtitle ?? FALLBACK_HERO.badgeSubtitle),
      imageUrl: typeof hb.imageUrl === "string" ? hb.imageUrl : undefined,
      socialProofText: String(hb.socialProofText ?? FALLBACK_HERO.socialProofText),
      showSocialProof: hb.showSocialProof !== false,
      socialProofIconName: String(hb.socialProofIconName ?? FALLBACK_HERO.socialProofIconName),
    };
  }
  return {
    ...FALLBACK_HERO,
    headline: String(hb.headline ?? hb.title ?? FALLBACK_HERO.headline),
    description: String(hb.subtitle ?? hb.headline ?? FALLBACK_HERO.description),
    badgeTitle: String(hb.badge_text ?? hb.badgeTitle ?? FALLBACK_HERO.badgeTitle),
    imageUrl:
      typeof hb.image_url === "string"
        ? hb.image_url
        : typeof hb.imageUrl === "string"
          ? hb.imageUrl
          : undefined,
    socialProofText: String(hb.socialProofText ?? FALLBACK_HERO.socialProofText),
    showSocialProof: hb.showSocialProof !== false,
    socialProofIconName: String(hb.socialProofIconName ?? FALLBACK_HERO.socialProofIconName),
  };
}

function mapAnnouncementFromDb(raw: unknown): AnnouncementBar {
  const bar = (raw ?? {}) as Record<string, unknown>;
  const promises = Array.isArray(bar.promises)
    ? (bar.promises as AnnouncementBar["promises"])
    : FALLBACK_PROMISES;
  return {
    isActive: Boolean(bar.isActive ?? bar.is_active ?? false),
    promises,
  };
}

const PROMO_VARIANTS: PromoBannerVariant[] = ["sale", "festival", "minimal"];
const PROMO_THEMES: PromoBannerTheme[] = ["gold", "primary", "blush", "lilac"];

function mapPlacementsFromDb(raw: unknown): PromoBannerPlacements {
  const p = (raw ?? {}) as Record<string, unknown> & { belowHero?: boolean; below_hero?: boolean };
  const hasPlacements = raw !== null && typeof raw === "object" && Object.keys(p).length > 0;
  if (!hasPlacements) return defaultPromoPlacements;
  return normalizePromoPlacements({
    top: p.top !== false,
    stickyBottom: Boolean(p.stickyBottom ?? p.sticky_bottom ?? p.belowHero ?? p.below_hero),
    aboveBrandPromises: Boolean(p.aboveBrandPromises ?? p.above_brand_promises),
    belowBrandPromises: Boolean(p.belowBrandPromises ?? p.below_brand_promises),
  });
}

function mapPromoBannerFromDb(raw: unknown): PromoBanner {
  const pb = (raw ?? {}) as Record<string, unknown>;
  const variant = PROMO_VARIANTS.includes(pb.variant as PromoBannerVariant)
    ? (pb.variant as PromoBannerVariant)
    : defaultPromoBanner.variant;
  const backgroundTheme = PROMO_THEMES.includes(pb.backgroundTheme as PromoBannerTheme)
    ? (pb.backgroundTheme as PromoBannerTheme)
    : defaultPromoBanner.backgroundTheme;
  const textAlign = pb.textAlign === "left" ? "left" : "center";

  return {
    isActive: Boolean(pb.isActive ?? pb.is_active ?? defaultPromoBanner.isActive),
    placements: mapPlacementsFromDb(pb.placements),
    variant,
    eyebrow: String(pb.eyebrow ?? defaultPromoBanner.eyebrow),
    headline: String(pb.headline ?? defaultPromoBanner.headline),
    description: String(pb.description ?? defaultPromoBanner.description),
    promoCode: String(pb.promoCode ?? defaultPromoBanner.promoCode),
    showPromoCode: pb.showPromoCode !== false,
    buttonLabel: String(pb.buttonLabel ?? defaultPromoBanner.buttonLabel),
    buttonLink: String(pb.buttonLink ?? defaultPromoBanner.buttonLink),
    showButton: pb.showButton !== false,
    iconName: String(pb.iconName ?? defaultPromoBanner.iconName),
    textAlign,
    backgroundTheme,
    endsAt:
      typeof pb.endsAt === "string" && pb.endsAt.length > 0
        ? pb.endsAt
        : pb.endsAt === null
          ? null
          : defaultPromoBanner.endsAt,
  };
}

const ANIMATION_TEMPLATE_IDS: SiteContent["animationTemplate"][] = [
  "none",
  "editorial",
  "boutique",
  "couture",
];

const BACKGROUND_ANIMATION_IDS: SiteContent["backgroundAnimation"][] = [
  "none",
  "aurora",
  "orbs",
  "mesh",
  "shimmer",
  "petals",
  "bubbles",
  "twinkle",
  "confetti",
  "waves",
];

/** Map legacy single-layer preset values onto the new coordinated templates. */
const LEGACY_ANIMATION_MAP: Record<string, SiteContent["animationTemplate"]> = {
  none: "none",
  // The old single-layer presets all felt too subtle; upgrade existing installs
  // to the full cinematic template so the new motion is visible out of the box.
  fade: "couture",
  rise: "couture",
  luxe: "couture",
  slide: "boutique",
};

function mapCraftStoryFromDb(raw: unknown): CraftStoryContent {
  const cs = (raw ?? {}) as Record<string, unknown>;
  const hasData = raw !== null && typeof raw === "object" && Object.keys(cs).length > 0;
  if (!hasData) return defaultCraftStory;
  const chapters = Array.isArray(cs.chapters)
    ? (cs.chapters as { title?: unknown; body?: unknown }[]).map((c, i) => ({
        title: String(c?.title ?? defaultCraftStory.chapters[i]?.title ?? ""),
        body: String(c?.body ?? defaultCraftStory.chapters[i]?.body ?? ""),
      }))
    : defaultCraftStory.chapters;
  return {
    isActive: cs.isActive !== false,
    eyebrow: String(cs.eyebrow ?? defaultCraftStory.eyebrow),
    headline: String(cs.headline ?? defaultCraftStory.headline),
    imageUrl: typeof cs.imageUrl === "string" ? cs.imageUrl : undefined,
    chapters: chapters.length > 0 ? chapters : defaultCraftStory.chapters,
  };
}

function mapRowToSiteContent(row: {
  hero_banner: unknown;
  announcement_bar: unknown;
  promo_banner?: unknown;
  layout: string;
  animation_style?: unknown;
  background_animation?: unknown;
  craft_story?: unknown;
}): SiteContent {
  const raw = typeof row.animation_style === "string" ? row.animation_style : "";
  const template = ANIMATION_TEMPLATE_IDS.includes(raw as SiteContent["animationTemplate"])
    ? (raw as SiteContent["animationTemplate"])
    : (LEGACY_ANIMATION_MAP[raw] ?? "couture");
  // Aurora & Mesh were retired — fold any stored value onto the kept "orbs".
  const rawBg =
    row.background_animation === "aurora" || row.background_animation === "mesh"
      ? "orbs"
      : row.background_animation;
  const bg = BACKGROUND_ANIMATION_IDS.includes(rawBg as SiteContent["backgroundAnimation"])
    ? (rawBg as SiteContent["backgroundAnimation"])
    : "orbs";
  return {
    heroBanner: mapHeroFromDb(row.hero_banner),
    announcementBar: mapAnnouncementFromDb(row.announcement_bar),
    promoBanner: mapPromoBannerFromDb(row.promo_banner),
    layout: row.layout || "Editorial Grid",
    animationTemplate: template,
    backgroundAnimation: bg,
    craftStory: mapCraftStoryFromDb(row.craft_story),
  };
}

// Content management
export const contentService = {
  // Get current content
  async getContent() {
    const { data, error } = await supabase.from("content").select("*").single();

    if (error) {
      console.error("Error fetching content:", error);
      return null;
    }

    return data;
  },

  // Update content
  async updateContent(updates: Partial<Database["public"]["Tables"]["content"]["Update"]>) {
    const { data, error } = await supabase
      .from("content")
      .update(updates)
      .eq("id", "default")
      .select()
      .single();

    if (error) {
      console.error("Error updating content:", error);
      return null;
    }

    return data;
  },

  // Initialize content if it doesn't exist
  async initializeContent(defaultContent: Database["public"]["Tables"]["content"]["Insert"]) {
    const { data, error } = await supabase
      .from("content")
      .insert({ ...defaultContent, id: "default" })
      .select()
      .single();

    if (error) {
      console.error("Error initializing content:", error);
      return null;
    }

    return data;
  },

  async getSiteContent(): Promise<SiteContent | null> {
    const { data, error } = await supabase
      .from("content")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      console.error("Error fetching site content:", error);
      return null;
    }
    if (!data) return null;

    return mapRowToSiteContent(data);
  },

  async saveSiteContent(content: SiteContent): Promise<{ success: boolean; error?: string }> {
    const base = {
      id: "default",
      hero_banner:
        content.heroBanner as unknown as Database["public"]["Tables"]["content"]["Row"]["hero_banner"],
      announcement_bar: {
        is_active: content.announcementBar.isActive,
        promises: content.announcementBar.promises,
      },
      layout: content.layout,
      promo_banner: content.promoBanner as unknown as Record<string, unknown>,
    };

    // Optional columns added by later migrations (006 animation_style,
    // 007 craft_story). If a column is missing we retry without the offending
    // one(s) so content saving never breaks before the migration is run.
    const optional: Record<string, unknown> = {
      animation_style: content.animationTemplate,
      background_animation: content.backgroundAnimation,
      craft_story: content.craftStory as unknown as Record<string, unknown>,
    };

    let error: { message: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      ({ error } = await supabase
        .from("content")
        .upsert({ ...base, ...optional }, { onConflict: "id" }));
      if (!error) break;
      const dropped = Object.keys(optional).find((col) =>
        new RegExp(col, "i").test(error!.message),
      );
      if (!dropped) break;
      console.warn(`content.${dropped} column missing — run migrations. Saving without it.`);
      delete optional[dropped];
    }

    if (error) {
      console.error("Error saving site content:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  },
};

/**
 * Global editable lists (sizes / categories / badges / size-chart templates),
 * stored one JSON row per list in `site_lists`. All methods are resilient:
 * if the table is missing (migration 009 not run) or offline, reads return
 * null and writes return { success:false } without throwing, so callers fall
 * back to localStorage / defaults.
 */
export const siteListsService = {
  async getList<T>(id: string): Promise<T[] | null> {
    try {
      const { data, error } = await supabase
        .from("site_lists")
        .select("data")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return null;
      return Array.isArray(data.data) ? (data.data as T[]) : null;
    } catch {
      return null;
    }
  },

  async saveList<T>(id: string, data: T[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("site_lists")
        .upsert({ id, data: data as unknown }, { onConflict: "id" });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "save failed" };
    }
  },
};

let siteListChannelSeq = 0;
export const subscribeToSiteList = (id: string, callback: () => void) => {
  // Unique channel name per subscription — multiple components can use the same
  // list (e.g. categories in the homepage AND the footer); reusing a channel
  // name makes Supabase throw "cannot add postgres_changes callbacks". Wrapped
  // so a realtime hiccup can never bubble up and crash the page.
  try {
    siteListChannelSeq += 1;
    return supabase
      .channel(`site-lists-${id}-${siteListChannelSeq}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_lists", filter: `id=eq.${id}` },
        () => callback(),
      )
      .subscribe();
  } catch (e) {
    console.warn("site_lists realtime subscribe failed:", e);
    return null;
  }
};

// Products management
export const productService = {
  // Get all products. `columns` lets storefront list callers fetch only the
  // fields the grids need (smaller payload); defaults to all columns.
  async getProducts(status?: string, opts?: { throwOnError?: boolean; columns?: string }) {
    const base = supabase.from("products").select(opts?.columns ?? "*");
    const filtered = status && status !== "all" ? base.eq("status", status) : base;
    const { data, error } = await filtered.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      // Storefront read paths opt in to throwOnError so a real backend failure
      // surfaces as a query error (retry UI) instead of an empty list that the
      // caller would mistake for "no products" and backfill with demo data.
      if (opts?.throwOnError) throw error;
      return [];
    }

    return (data ?? []) as unknown as Database["public"]["Tables"]["products"]["Row"][];
  },

  // Get product by ID
  async getProduct(id: string) {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();

    if (error) {
      console.error("Error fetching product:", error);
      return null;
    }

    return data;
  },

  // Create product
  async createProduct(product: Database["public"]["Tables"]["products"]["Insert"]) {
    const { data, error } = await supabase.from("products").insert(product).select().single();

    if (error) {
      console.error("Error creating product:", error);
      return null;
    }

    return data;
  },

  // Update product
  async updateProduct(id: string, updates: Database["public"]["Tables"]["products"]["Update"]) {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return null;
    }

    return data;
  },

  // Delete product
  async deleteProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      return false;
    }

    return true;
  },

  // Get low stock products count
  async getLowStockCount() {
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .lt("units", 5)
      .gt("units", 0);

    if (error) {
      console.error("Error fetching low stock count:", error);
      return 0;
    }

    return count || 0;
  },
};

// Real-time subscriptions
export const subscribeToContent = (
  callback: (content: Database["public"]["Tables"]["content"]["Row"]) => void,
) => {
  return supabase
    .channel("content-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "content",
        filter: "id=eq.default",
      },
      (payload) => {
        if (payload.eventType === "UPDATE") {
          callback(payload.new as Database["public"]["Tables"]["content"]["Row"]);
        }
      },
    )
    .subscribe();
};

export const subscribeToProducts = (
  callback: (products: Database["public"]["Tables"]["products"]["Row"][]) => void,
) => {
  return supabase
    .channel("products-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products",
      },
      async () => {
        const products = await productService.getProducts();
        callback(products);
      },
    )
    .subscribe();
};
