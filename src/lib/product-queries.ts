import { queryOptions, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { productService } from "./supabase-service";
import { products as fallbackProducts, type Product } from "./products";
import { isSupabaseConfigured, type Database } from "./supabase";
import { FIVE_MINUTES } from "./query-client";
import { getProductDisplayImage } from "./product-colors";
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

export async function fetchPublishedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return fallbackProducts;

  const cacheKey = "products:published:storefront";

  // Try Redis cache first
  const cached = await getCached<Product[]>(cacheKey);
  if (cached) {
    console.log("✅ Cache hit: published products from Redis");
    return cached;
  }

  // Fetch from Supabase if not cached
  const fetched = await productService.getProducts("published", {
    throwOnError: true,
    columns: STOREFRONT_LIST_COLUMNS,
  });
  const products = fetched.map(mapDbProductToProduct);

  // Cache for 30 minutes
  await setCached(cacheKey, products, 1800);
  console.log("📝 Cached published products for 30 minutes");

  return products;
}

export async function fetchAdminProducts(): Promise<ProductRow[]> {
  return productService.getProducts("all");
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const staticProduct = fallbackProducts.find((p) => p.id === id);
  if (staticProduct) return staticProduct;

  const cacheKey = `product:${id}`;

  // Try Redis cache first
  const cached = await getCached<Product>(cacheKey);
  if (cached) {
    console.log(`✅ Cache hit: product ${id} from Redis`);
    return cached;
  }

  try {
    const product = await productService.getProduct(id);
    if (product) {
      const mapped = mapDbProductToProduct(product);
      // Cache for 1 hour
      await setCached(cacheKey, mapped, 3600);
      console.log(`📝 Cached product ${id} for 1 hour`);
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

export function usePublishedProducts() {
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
