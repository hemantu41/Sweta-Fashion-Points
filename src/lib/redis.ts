/**
 * Redis client singleton for Insta Fashion Points.
 *
 * Set REDIS_URL in your environment to enable Redis caching.
 * If REDIS_URL is not set, all cache operations are no-ops and the
 * app falls back to direct DB queries — zero breaking changes.
 *
 * Supported Redis providers:
 *   - Local:   redis://localhost:6379
 *   - Upstash: rediss://:password@host:6380   (TLS)
 *   - Redis Cloud / Railway / Render: standard redis:// URL
 *
 * Add to .env.local:
 *   REDIS_URL=redis://localhost:6379
 */

import Redis from 'ioredis';

// Global singleton — prevents multiple connections during Next.js hot reload
declare global {
  // eslint-disable-next-line no-var
  var _redisClient: Redis | null | undefined;
}

export function getRedis(): Redis | null {
  // Redis disabled — no URL configured
  if (!process.env.REDIS_URL) return null;

  if (global._redisClient) return global._redisClient;

  try {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      commandTimeout: 2000,
      lazyConnect: true,
      // Disable auto-reconnect to avoid hanging serverless functions
      retryStrategy: (times) => (times > 2 ? null : Math.min(times * 100, 500)),
    });

    client.on('error', (err) => {
      // Log but never crash — Redis is non-critical
      console.warn('[Redis] Connection error:', err.message);
    });

    client.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    global._redisClient = client;
    return client;
  } catch (err) {
    console.warn('[Redis] Failed to create client:', err);
    global._redisClient = null;
    return null;
  }
}

/**
 * Safe wrapper — returns null on any error instead of throwing.
 */
export async function redisGet(key: string): Promise<string | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function redisSetex(key: string, ttlSeconds: number, value: string): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.setex(key, ttlSeconds, value);
  } catch (err) {
    console.warn('[Redis] setex failed:', err);
  }
}

export async function redisDel(...keys: string[]): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis || keys.length === 0) return;
    await redis.del(...keys);
  } catch (err) {
    console.warn('[Redis] del failed:', err);
  }
}

/** Delete all keys matching a pattern using SCAN (safe for large keyspaces). */
export async function redisDelPattern(pattern: string): Promise<number> {
  try {
    const redis = getRedis();
    if (!redis) return 0;

    let cursor = '0';
    let deleted = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== '0');

    return deleted;
  } catch (err) {
    console.warn('[Redis] delPattern failed:', err);
    return 0;
  }
}

export const SELLER_CACHE_TTL = 1800; // 30 minutes
