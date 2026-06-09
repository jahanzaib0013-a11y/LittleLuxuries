import { useDbList } from "@/hooks/use-db-list";
import onesie from "@/assets/product-onesie.jpg";
import booties from "@/assets/product-booties.jpg";
import swaddle from "@/assets/product-swaddle.jpg";
import giftbox from "@/assets/product-giftbox.jpg";
import sleepwear from "@/assets/product-sleepwear.jpg";
import accessories from "@/assets/product-accessories.jpg";

export type CategoryDef = {
  id: string;
  name: string;
  image: string | null;
  tagline?: string;
};

// `image: null` on purpose — default images are resolved at render time by
// name via defaultCategoryImage() (live bundled imports), never persisted as
// URLs. Persisting bundled-asset URLs caused stale build-hash 404s.
const defaultCategories: CategoryDef[] = [
  { id: "1", name: "Onesies", image: null, tagline: "Everyday softness" },
  { id: "2", name: "Sleepwear", image: null, tagline: "Gentle dreams" },
  { id: "3", name: "Knitwear", image: null, tagline: "Warmth for the winter" },
  { id: "4", name: "Accessories", image: null, tagline: "Tender finishing touches" },
  { id: "5", name: "Gift Sets", image: null, tagline: "Perfect for giving" },
  { id: "6", name: "Swaddles", image: null, tagline: "Wrapped in love" },
];

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  Onesies: onesie,
  Sleepwear: sleepwear,
  Knitwear: booties,
  Accessories: accessories,
  "Gift Sets": giftbox,
  Swaddles: swaddle,
};

/**
 * Live bundled image for a known default category, by name. Re-derived from the
 * imports above (never from persisted URLs) so it's immune to stale build-hash
 * paths. Returns undefined for unknown/custom categories.
 */
export function defaultCategoryImage(name: string): string | undefined {
  const key = name.trim().toLowerCase();
  const match = Object.keys(DEFAULT_CATEGORY_IMAGES).find((k) => k.toLowerCase() === key);
  return match ? DEFAULT_CATEGORY_IMAGES[match] : undefined;
}

/** Global category list — persisted in Supabase (`site_lists` id="categories"). */
export function useCategories() {
  const { items: categories, setItems: setCategories } = useDbList<CategoryDef>(
    "categories",
    defaultCategories,
    "categories-updated",
    "site_categories",
  );
  return { categories, setCategories, defaultCategories };
}
