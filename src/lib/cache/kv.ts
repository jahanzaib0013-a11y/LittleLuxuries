// Cloudflare KV caching layer
// Works in Cloudflare Pages / Workers environment

type KVNamespace = any;

declare global {
  var LITTLE_LUXURIES_KV: KVNamespace;
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (typeof globalThis === 'undefined' || !globalThis.LITTLE_LUXURIES_KV) {
      return null;
    }

    const cached = await globalThis.LITTLE_LUXURIES_KV.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.error('KV get error:', error);
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    if (typeof globalThis === 'undefined' || !globalThis.LITTLE_LUXURIES_KV) {
      return;
    }

    await globalThis.LITTLE_LUXURIES_KV.put(key, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    });
  } catch (error) {
    console.error('KV set error:', error);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    if (typeof globalThis === 'undefined' || !globalThis.LITTLE_LUXURIES_KV) {
      return;
    }

    // KV doesn't support wildcard deletes, so we'll delete specific patterns
    // For products, we delete the main keys we know about
    const keysToDelete = [
      'products:published:storefront',
      'products:all',
      ...Array.from({ length: 100 }, (_, i) => `product:${i}`),
    ];

    for (const key of keysToDelete) {
      if (key.includes(pattern.replace('*', ''))) {
        await globalThis.LITTLE_LUXURIES_KV.delete(key);
      }
    }
  } catch (error) {
    console.error('KV invalidation error:', error);
  }
}

export async function closeKV(): Promise<void> {
  // KV doesn't require explicit cleanup
}
