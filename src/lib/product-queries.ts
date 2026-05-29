import {
  queryOptions,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { productService } from "./supabase-service";
import { products as fallbackProducts, type Product } from "./products";
import type { Database } from "./supabase";
import { FIVE_MINUTES } from "./query-client";
import { getProductDisplayImage } from "./product-colors";

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

export async function fetchPublishedProducts(): Promise<Product[]> {
  try {
    const fetched = await productService.getProducts("published");
    const withImages = fetched.map(mapDbProductToProduct);
    return withImages.length > 0 ? withImages : fallbackProducts;
  } catch {
    return fallbackProducts;
  }
}

export async function fetchAdminProducts(): Promise<ProductRow[]> {
  return productService.getProducts("all");
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const staticProduct = fallbackProducts.find((p) => p.id === id);
  if (staticProduct) return staticProduct;

  try {
    const product = await productService.getProduct(id);
    if (product) {
      return mapDbProductToProduct(product);
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
  return useCallback(
    () => invalidateProductQueries(queryClient),
    [queryClient],
  );
}
