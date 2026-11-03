import { queryOptions, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { productService } from "./supabase-service";
import { products as fallbackProducts, type Product } from "./products";
import { isSupabaseConfigured, type Database } from "./supabase";
import { FIVE_MINUTES } from "./query-client";
import { getProductDisplayImage } from "./product-colors";
import { CARD_IMAGE_WIDTH, sizedImage } from "./supabase-image";
import { getCached, setCached } from "./cache/kv";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (status?: string) => [...productKeys.lists(), status ?? "all"] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

function mapDbProductToProduct(product: ProductRow): Product {
  const displayImage = getProductDisplayImage(product);
  return {
    ...product,
    image: displayImage || product.image_url || fallbackProducts[0]?.image,
    category: product.category as Product["category"],
    badge: product.badge as Product["badge"],
  };
}

// Only the columns the storefront grids/cards actually read. Skips the heavy
// detail-only fields (description, size_chart, secondary_images, sustainability,
// care_instructions, gift_wrapping, …) so the list payload stays small on a
// growing catalog. The product detail page fetches the full row via getProduct.
const STOREFRONT_LIST_COLUMNS =
  "id,name,price,image_url,category,variant,badge,sizes,colors,units,status,gender,created_at";

// Client-side mirror of the published catalog in localStorage, using the same
// instant-paint pattern the site content and the categories/badges lists already
// use. fetchPublishedProducts() always revalidates against Supabase and refreshes
// this cache; usePublishedProducts() then paints it for returning visitors before
// the network round-trip finishes (see the mount-effect note below).
const PUBLISHED_PRODUCTS_LS_KEY = "ll-products-published-cache";

function readProductsCache(): Product[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PUBLISHED_PRODUCTS_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : null;
  } catch {
    return null;
  }
}

function writeProductsCache(products: Product[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PUBLISHED_PRODUCTS_LS_KEY, JSON.stringify(products));
  } catch {
    /* storage full or unavailable — ignore, cache is best-effort */
  }
}

/**
 * Rewrites a product's card image to the storage resize endpoint. Idempotent —
 * an already-proxied URL doesn't match the object path, so it passes through.
 * Only `image` (what cards render) is touched; `image_url` and `colors[]` stay
 * full-resolution so the product page gallery keeps its originals.
 */
function cardSized(product: Product): Product {
  return { ...product, image: sizedImage(product.image, CARD_IMAGE_WIDTH) ?? product.image };
}

export async function fetchPublishedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return fallbackProducts;

  const cacheKey = "products:published:storefront";

  // Try cache first — the KV entry holds pre-transform rows, so size it here too.
  const cached = await getCached<Product[]>(cacheKey);
  if (cached) {
    return cached.map(cardSized);
  }

  // Fetch from Supabase if not cached
  const fetched = await productService.getProducts("published", {
    throwOnError: true,
    columns: STOREFRONT_LIST_COLUMNS,
  });
  const products = fetched.map((row) => cardSized(mapDbProductToProduct(row)));

  // Cache for 30 minutes (KV on the edge) and mirror to localStorage so the
  // next client render can paint real products before the fetch resolves.
  await setCached(cacheKey, products, 1800);
  writeProductsCache(products);

  return products;
}

export async function fetchAdminProducts(): Promise<ProductRow[]> {
  return productService.getProducts("all");
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const staticProduct = fallbackProducts.find((p) => p.id === id);
  if (staticProduct) return staticProduct;

  const cacheKey = `product:${id}`;

  // Try cache first
  const cached = await getCached<Product>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const product = await productService.getProduct(id);
    if (product) {
      const mapped = mapDbProductToProduct(product);
      // Cache for 1 hour
      await setCached(cacheKey, mapped, 3600);
      return mapped;
    }
  } catch (error) {
    console.error("Error loading product from Supabase:", error);
  }

  const published = await fetchPublishedProducts();
  return published.find((p) => p.id === id) ?? null;
}

export const publishedProductsQueryOptions = () =>
  queryOptions({
    queryKey: productKeys.list("published"),
    queryFn: fetchPublishedProducts,
    staleTime: FIVE_MINUTES,
  });

export const adminProductsQueryOptions = () =>
  queryOptions({
    queryKey: productKeys.list("all"),
    queryFn: fetchAdminProducts,
    staleTime: FIVE_MINUTES,
  });

export const productDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProductById(id),
    staleTime: FIVE_MINUTES,
  });

/**
 * Published catalog for the storefront.
 *
 * The localStorage mirror is applied AFTER mount, never as `initialData`:
 * `initialData` resolves during the first client render, where the browser holds
 * a cached catalog while the server had none — that DOM diff makes React discard
 * the whole server render (hydration error #418) and re-render from scratch,
 * throwing away the SSR head start. Seeding in a mount effect keeps the first
 * render identical to the server HTML, then paints the cached catalog straight
 * afterwards — still behind the brand splash, so returning visitors never see
 * skeleton rows. Query freshness is left untouched, so the background
 * revalidation against Supabase always runs.
 */
export function usePublishedProducts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const key = productKeys.list("published");
    if (queryClient.getQueryData<Product[]>(key)) return;
    const cached = readProductsCache();
    if (cached) queryClient.setQueryData(key, cached);
  }, [queryClient]);

  return useQuery(publishedProductsQueryOptions());
}

export function useAdminProducts() {
  return useQuery(adminProductsQueryOptions());
}

export function invalidateProductQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: productKeys.all });
}

/** Call after any create/update/delete/publish so shop + admin lists stay in sync. */
export function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return useCallback(() => invalidateProductQueries(queryClient), [queryClient]);
}
