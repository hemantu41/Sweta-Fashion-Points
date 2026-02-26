/**
 * Client-side caching utility
 * Reduces Supabase bandwidth by caching frequently accessed data
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ClientCache {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cache = new Map();

    // Clear expired items every minute
    if (typeof window !== 'undefined') {
      setInterval(() => this.clearExpired(), 60 * 1000);
    }
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Set item in cache with TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * Delete item from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired items
   */
  private clearExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((item, key) => {
      if (now > item.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache stats
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const clientCache = new ClientCache();

/**
 * Higher-order function to wrap async functions with caching
 */
export function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = clientCache.get<T>(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  // Fetch and cache
  return fetchFn().then(data => {
    clientCache.set(key, data, ttl);
    return data;
  });
}

/**
 * Cache product listings
 */
export async function getCachedProducts(
  category?: string,
  fetchFn?: () => Promise<any[]>
) {
  const cacheKey = `products:${category || 'all'}`;

  if (!fetchFn) {
    return clientCache.get(cacheKey);
  }

  return withCache(cacheKey, fetchFn, 10 * 60 * 1000); // 10 minutes
}

/**
 * Cache single product
 */
export async function getCachedProduct(
  productId: string,
  fetchFn?: () => Promise<any>
) {
  const cacheKey = `product:${productId}`;

  if (!fetchFn) {
    return clientCache.get(cacheKey);
  }

  return withCache(cacheKey, fetchFn, 15 * 60 * 1000); // 15 minutes
}

/**
 * Invalidate product cache (call after update/delete)
 */
export function invalidateProductCache(productId?: string, category?: string) {
  if (productId) {
    clientCache.delete(`product:${productId}`);
  }
  if (category) {
    clientCache.delete(`products:${category}`);
  }
  clientCache.delete('products:all');
}
