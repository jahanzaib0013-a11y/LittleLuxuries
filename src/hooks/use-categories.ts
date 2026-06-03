import { useState, useEffect } from "react";
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

export function useCategories() {
  const [categories, setCategoriesState] = useState<CategoryDef[]>(defaultCategories);

  useEffect(() => {
    const saved = localStorage.getItem("site_categories");
    if (saved) {
      try {
        setCategoriesState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse categories", e);
      }
    }

    const handleStorageChange = () => {
      const updated = localStorage.getItem("site_categories");
      if (updated) {
        try {
          setCategoriesState(JSON.parse(updated));
        } catch (e) {
          // Ignore parse errors from storage
        }
      }
    };

    window.addEventListener("categories-updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("categories-updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setCategories = (
    newCategories: CategoryDef[] | ((prev: CategoryDef[]) => CategoryDef[]),
  ) => {
    setCategoriesState((prev) => {
      const updated = typeof newCategories === "function" ? newCategories(prev) : newCategories;
      localStorage.setItem("site_categories", JSON.stringify(updated));
      window.dispatchEvent(new Event("categories-updated"));
      return updated;
    });
  };

  return { categories, setCategories, defaultCategories };
}
