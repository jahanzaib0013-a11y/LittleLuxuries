import { createClient } from '@supabase/supabase-js';
import {
  getCachedProduct,
  setCachedProduct,
  getCachedProducts,
  setCachedProducts,
  invalidateProductCache,
  CachedProduct,
} from '../cache/product-cache';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

export async function getProductById(productId: string): Promise<CachedProduct | null> {
  // Try cache first
  const cached = await getCachedProduct(productId);
  if (cached) {
    console.log(`Cache hit for product: ${productId}`);
    return cached;
  }

  // Fetch from database
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !data) {
      console.error('Product fetch error:', error);
      return null;
    }

    const product: CachedProduct = {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      images: data.images || [],
      colors: data.colors,
      sizes: data.sizes,
      inStock: data.in_stock,
      createdAt: data.created_at,
    };

    // Cache it
    await setCachedProduct(productId, product);
    return product;
  } catch (error) {
    console.error('Product fetch error:', error);
    return null;
  }
}

export async function getAllProducts(filters?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<CachedProduct[]> {
  // Try cache first
  const cached = await getCachedProducts(filters);
  if (cached) {
    console.log('Cache hit for all products');
    return cached;
  }

  // Fetch from database
  try {
    let query = supabase.from('products').select('*');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Products fetch error:', error);
      return [];
    }

    const products: CachedProduct[] = (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      images: p.images || [],
      colors: p.colors,
      sizes: p.sizes,
      inStock: p.in_stock,
      createdAt: p.created_at,
    }));

    // Cache it
    await setCachedProducts(products, filters);
    return products;
  } catch (error) {
    console.error('Products fetch error:', error);
    return [];
  }
}

export async function invalidateProductCaches(productId?: string): Promise<void> {
  await invalidateProductCache(productId);
}
