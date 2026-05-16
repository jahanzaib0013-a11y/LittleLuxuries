import onesie from "@/assets/product-onesie.jpg";
import booties from "@/assets/product-booties.jpg";
import swaddle from "@/assets/product-swaddle.jpg";
import giftbox from "@/assets/product-giftbox.jpg";
import sleepwear from "@/assets/product-sleepwear.jpg";
import accessories from "@/assets/product-accessories.jpg";

export type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  image: string; // For backward compatibility with sample data
  category: "Onesies" | "Sleepwear" | "Knitwear" | "Accessories" | "Gift Sets";
  variant: string;
  badge?: "New" | "Bestseller" | "Low stock" | "Out of Stock";
  description: string;
  sizes: string[];
  secondary_images?: string[];
  sustainability?: string;
  care_instructions?: string;
  units?: number;
  gender?: string;
};

export const products: Product[] = [
  {
    id: "cloud-soft-onesie",
    name: "Cloud-Soft Organic Onesie",
    price: 48,
    image: onesie,
    image_url: null,
    category: "Onesies",
    variant: "Lavender / 100% Organic Cotton",
    badge: "New",
    description:
      "Luxuriously soft organic cotton onesie, hand-finished with love for your baby's delicate skin. A heirloom-quality piece featuring breathable natural fibers and a timeless silhouette that transitions beautifully through the seasons.",
    sizes: ["Newborn", "0–3M", "3–6M", "6–12M"],
  },
  {
    id: "wool-knitted-booties",
    name: "Pure Wool Knitted Booties",
    price: 32,
    image: booties,
    image_url: null,
    category: "Knitwear",
    variant: "Dusty Rose / Merino Wool",
    badge: "Bestseller",
    description:
      "Hand-knit in small batches from the finest merino wool. Tiny, tender, and irresistibly soft on little feet.",
    sizes: ["0–3M", "3–6M", "6–12M"],
  },
  {
    id: "blush-garden-swaddle",
    name: "Blush Garden Linen Swaddle",
    price: 58,
    image: swaddle,
    image_url: null,
    category: "Accessories",
    variant: "Blush / French Linen",
    description:
      "A breathable French linen swaddle with delicate hand-embroidered botanical detail. Soft enough for newborn skin, beautiful enough to keep forever.",
    sizes: ["One Size"],
  },
  {
    id: "luxury-gift-box",
    name: "The Luxury Gift Box",
    price: 95,
    image: giftbox,
    image_url: null,
    category: "Gift Sets",
    variant: "Lavender / Curated Trio",
    badge: "New",
    description:
      "Three of our most-loved pieces, beautifully presented in a keepsake box with hand-tied gold ribbon. The perfect arrival gift.",
    sizes: ["Newborn", "0–3M", "3–6M"],
  },
  {
    id: "essential-sleepsuit",
    name: "Essential Sleep Suit Duo",
    price: 78,
    image: sleepwear,
    image_url: null,
    category: "Sleepwear",
    variant: "Sage & Ivory / Pima Cotton",
    description:
      "A pair of buttery-soft pima cotton sleep suits in calming, nursery-friendly tones. Designed for restful nights and gentle dreams.",
    sizes: ["Newborn", "0–3M", "3–6M", "6–12M"],
  },
  {
    id: "knit-hat-mittens",
    name: "Heirloom Knit Hat & Mittens",
    price: 42,
    image: accessories,
    image_url: null,
    category: "Accessories",
    variant: "Lilac & Saffron / Hand-knit",
    badge: "Low stock",
    description:
      "A cozy hat-and-mittens set hand-knit with whisper-soft yarn. Topped with playful pom-poms.",
    sizes: ["0–6M", "6–12M"],
  },
];

export const collections = [
  { name: "Onesies", tagline: "Everyday softness", image: onesie },
  { name: "Sleepwear", tagline: "Gentle dreams", image: sleepwear },
  { name: "Knitwear", tagline: "Warmth for the winter", image: booties },
  { name: "Accessories", tagline: "Tender finishing touches", image: accessories },
  { name: "Gift Sets", tagline: "Perfect for giving", image: giftbox },
  { name: "Swaddles", tagline: "Wrapped in love", image: swaddle },
];
