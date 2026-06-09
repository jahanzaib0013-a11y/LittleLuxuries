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

const defaultCategories: CategoryDef[] = [
  { id: "1", name: "Onesies", image: onesie, tagline: "Everyday softness" },
  { id: "2", name: "Sleepwear", image: sleepwear, tagline: "Gentle dreams" },
  { id: "3", name: "Knitwear", image: booties, tagline: "Warmth for the winter" },
  { id: "4", name: "Accessories", image: accessories, tagline: "Tender finishing touches" },
  { id: "5", name: "Gift Sets", image: giftbox, tagline: "Perfect for giving" },
  { id: "6", name: "Swaddles", image: swaddle, tagline: "Wrapped in love" },
];

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
