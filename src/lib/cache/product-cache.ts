import { getCached, setCached, invalidateCache } from './redis';

export interface CachedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  colors?: Array<{ name: string; hex: string }>;
  sizes?: string[];
  inStock: boolean;
  createdAt: string;
}

const PRODUCT_CACHE_TTL = 3600; // 1 hour
const ALL_PRODUCTS_CACHE_TTL = 1800; // 30 minutes

export async function getCachedProduct(productId: string): Promise<CachedProduct | null> {
  return getCached<CachedProduct>(`product:${productId}`);
}

export async function setCachedProduct(
  productId: string,
  product: CachedProduct
): Promise<void> {
  return setCached(`product:${productId}`, product, PRODUCT_CACHE_TTL);
}

export async function getCachedProducts(
  filters?: Record<string, unknown>
): Promise<CachedProduct[] | null> {
  const cacheKey = filters
    ? `products:${JSON.stringify(filters)}`
    : 'products:all';

  return getCached<CachedProduct[]>(cacheKey);
}

export async function setCachedProducts(
  products: CachedProduct[],
  filters?: Record<string, unknown>
): Promise<void> {
  const cacheKey = filters
    ? `products:${JSON.stringify(filters)}`
    : 'products:all';

  return setCached(cacheKey, products, ALL_PRODUCTS_CACHE_TTL);
}

export async function invalidateProductCache(productId?: string): Promise<void> {
  if (productId) {
    // Invalidate specific product and related queries
    await invalidateCache(`product:${productId}`);
    await invalidateCache('products:*');
  } else {
    // Invalidate all product caches
    await invalidateCache('product:*');
    await invalidateCache('products:*');
  }
}

export async function getCachedCategory(categoryId: string): Promise<CachedProduct[] | null> {
  return getCached<CachedProduct[]>(`category:${categoryId}`);
}

export async function setCachedCategory(
  categoryId: string,
  products: CachedProduct[]
): Promise<void> {
  return setCached(`category:${categoryId}`, products, ALL_PRODUCTS_CACHE_TTL);
}

export async function invalidateCategoryCache(categoryId?: string): Promise<void> {
  if (categoryId) {
    await invalidateCache(`category:${categoryId}`);
  } else {
    await invalidateCache('category:*');
  }
}
