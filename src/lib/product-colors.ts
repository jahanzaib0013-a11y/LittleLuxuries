import type { Database } from "@/lib/supabase";

export type ProductColor = {
  id: string;
  name: string;
  hex?: string;
  image_url: string;
  secondary_images?: string[];
  is_default?: boolean;
};

type ProductLike = {
  image_url?: string | null;
  secondary_images?: string[] | null;
  variant?: string | null;
  colors?: ProductColor[] | null;
};

export function createColorId(): string {
  return `color-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyColor(isDefault = false): ProductColor {
  return {
    id: createColorId(),
    name: "",
    hex: "",
    image_url: "",
    secondary_images: [],
    is_default: isDefault,
  };
}

export function parseProductColors(raw: unknown): ProductColor[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const c = entry as Record<string, unknown>;
      const image_url = typeof c.image_url === "string" ? c.image_url : "";
      const name = typeof c.name === "string" ? c.name.trim() : "";
      if (!name && !image_url) return null;
      return {
        id: typeof c.id === "string" ? c.id : createColorId(),
        name: name || "Color",
        hex: typeof c.hex === "string" ? c.hex : undefined,
        image_url,
        secondary_images: Array.isArray(c.secondary_images)
          ? c.secondary_images.filter((u): u is string => typeof u === "string")
          : [],
        is_default: Boolean(c.is_default),
      } satisfies ProductColor;
    })
    .filter((c): c is ProductColor => c !== null);
}

export function getProductColors(product: ProductLike): ProductColor[] {
  const fromDb = parseProductColors(product.colors);
  if (fromDb.length > 0) return fromDb;

  if (!product.image_url) return [];

  return [
    {
      id: "default",
      name: product.variant?.split("/")[0]?.trim() || "Default",
      image_url: product.image_url,
      secondary_images: product.secondary_images ?? [],
      is_default: true,
    },
  ];
}

export function getDefaultColor(colors: ProductColor[]): ProductColor | null {
  if (colors.length === 0) return null;
  return colors.find((c) => c.is_default) ?? colors[0];
}

export function getGalleryImagesForColor(color: ProductColor | null | undefined): string[] {
  if (!color?.image_url) return [];
  return [color.image_url, ...(color.secondary_images ?? [])].filter(Boolean).slice(0, 5);
}

export function getProductDisplayImage(product: ProductLike): string | null {
  const colors = getProductColors(product);
  const def = getDefaultColor(colors);
  return def?.image_url ?? product.image_url ?? null;
}

export function buildVariantLabel(colors: ProductColor[]): string {
  return colors
    .map((c) => c.name.trim())
    .filter(Boolean)
    .join(" / ");
}

export function syncLegacyFieldsFromColors(colors: ProductColor[]): {
  image_url: string;
  secondary_images: string[];
  variant: string;
  colors: ProductColor[];
} {
  const normalized = colors.map((c, index) => ({
    ...c,
    name: c.name.trim() || `Color ${index + 1}`,
  }));
  const defaultIndex = Math.max(
    0,
    normalized.findIndex((c) => c.is_default),
  );
  const withDefault = normalized.map((c, index) => ({
    ...c,
    is_default: index === defaultIndex,
  }));
  const def = withDefault[defaultIndex]!;
  return {
    image_url: def.image_url,
    secondary_images: def.secondary_images ?? [],
    variant: buildVariantLabel(withDefault),
    colors: withDefault,
  };
}

export function validateProductColors(colors: ProductColor[]): string | null {
  if (colors.length === 0) return "Tap a color and add a photo";

  for (const color of colors) {
    if (!color.name.trim()) return "Tap a color for each variant (pink, blue, etc.)";
    if (!color.image_url) {
      return `Add a photo for ${color.name.trim() || "each color"}`;
    }
  }

  if (colors.length === 1) {
    const only = colors[0];
    const galleryCount = 1 + (only.secondary_images?.length ?? 0);
    if (galleryCount < 2) {
      return "Tap + under More photos to add one extra picture";
    }
  }

  return null;
}

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export function cartItemKey(id: string, size: string, color = ""): string {
  return `${id}::${size}::${color}`;
}
