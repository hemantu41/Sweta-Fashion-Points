/**
 * In-memory cache utility for API responses
 * Reduces database queries for frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class Cache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTLSeconds: number = 300) {
    // Default 5 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTLSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds (optional)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    this.cache.set(key, entry);
    console.log(`[Cache] Set: ${key} (TTL: ${ttl / 1000}s)`);
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      console.log(`[Cache] Miss: ${key}`);
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      console.log(`[Cache] Expired: ${key}`);
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache] Hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Delete a value from the cache
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
    console.log(`[Cache] Deleted: ${key}`);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    console.log('[Cache] Cleared all entries');
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    let clearedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      console.log(`[Cache] Cleared ${clearedCount} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create global cache instances
export const apiCache = new Cache(300); // 5 minutes for API responses
export const productCache = new Cache(600); // 10 minutes for products
export const sellerCache = new Cache(600); // 10 minutes for sellers

// Clear expired entries every minute
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    apiCache.clearExpired();
    productCache.clearExpired();
    sellerCache.clearExpired();
  }, 60000); // 1 minute
}

/**
 * Cache helper function for async operations
 * @param key - Cache key
 * @param fetcher - Function to fetch data if not in cache
 * @param cache - Cache instance to use
 * @param ttlSeconds - Time to live in seconds
 * @returns Cached or fresh data
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: Cache = apiCache,
  ttlSeconds?: number
): Promise<T> {
  // Try to get from cache
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  console.log(`[Cache] Fetching fresh data for: ${key}`);
  const data = await fetcher();

  // Store in cache
  cache.set(key, data, ttlSeconds);

  return data;
}

/**
 * Invalidate cache by pattern
 * @param pattern - Regex pattern or string prefix
 * @param cache - Cache instance to use
 */
export function invalidateCache(pattern: string | RegExp, cache: Cache = apiCache): void {
  const stats = cache.stats();
  const regex = typeof pattern === 'string' ? new RegExp(`^${pattern}`) : pattern;

  let deletedCount = 0;
  for (const key of stats.keys) {
    if (regex.test(key)) {
      cache.delete(key);
      deletedCount++;
    }
  }

  console.log(`[Cache] Invalidated ${deletedCount} entries matching: ${pattern}`);
}
