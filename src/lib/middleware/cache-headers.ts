// Cache strategy for different content types
export const cacheHeaders = {
  // Static assets - cache for 1 year (immutable)
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
  // HTML pages - cache for 1 hour
  html: {
    'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  },
  // Images - cache for 30 days
  images: {
    'Cache-Control': 'public, max-age=2592000, s-maxage=2592000',
  },
  // API responses - cache for 5 minutes
  api: {
    'Cache-Control': 'public, max-age=300, s-maxage=300',
  },
  // Products - cache for 1 hour (with stale-while-revalidate)
  products: {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
  },
};

// Image lazy loading attributes
export const imageLazyLoadConfig = {
  loading: 'lazy' as const,
  decoding: 'async' as const,
};

// Recommended srcset sizes for responsive images
export const imageSrcsetSizes = {
  thumbnail: '(max-width: 640px) 100vw, 640px',
  card: '(max-width: 768px) 100vw, 768px',
  hero: '(max-width: 1440px) 100vw, 1440px',
};
