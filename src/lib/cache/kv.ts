// Cloudflare KV caching layer
// Works in Cloudflare Pages / Workers environment
// Falls back gracefully in development

type KVNamespace = any;

declare global {
  var LITTLE_LUXURIES_KV: KVNamespace;
}

const isDevMode = () => typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    // Skip caching in development if KV not available
    if (isDevMode() || typeof globalThis === 'undefined' || !globalThis.LITTLE_LUXURIES_KV) {
      return null;
    }

    const cached = await globalThis.LITTLE_LUXURIES_KV.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    if (isDevMode() || typeof globalThis === 'undefined' || !globalThis.LITTLE_LUXURIES_KV) {
      return;
    }

    await globalThis.LITTLE_LUXURIES_KV.put(key, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    });
  } catch (error) {
    return;
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    if (isDevMode() || typeof globalThis === 'undefined' || !globalThis.LITTLE_LUXURIES_KV) {
      return;
    }

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
    return;
  }
}

export async function closeKV(): Promise<void> {
  // KV doesn't require explicit cleanup
}
