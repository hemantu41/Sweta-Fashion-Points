/**
 * Redis client for Insta Fashion Points — powered by Upstash REST API.
 *
 * Uses @upstash/redis which communicates over HTTPS (no persistent TCP
 * connection), making it fully compatible with Vercel serverless functions.
 *
 * Required env vars (set in .env.local and Vercel dashboard):
 *   UPSTASH_REDIS_REST_URL   = https://xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN = your-token
 *
 * If either variable is missing, all cache calls are silent no-ops and
 * the app falls back to direct DB queries — zero breaking changes.
 */

import { Redis } from '@upstash/redis';

// Singleton — created once per process
let _redis: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (_redis) return _redis;

  try {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('[Redis] Upstash client initialised');
  } catch (err) {
    console.warn('[Redis] Failed to initialise Upstash client:', err);
    _redis = null;
  }

  return _redis;
}

// ─── Safe wrappers ───────────────────────────────────────────────────────────
// All functions return early (null / void) when Redis is not configured,
// and swallow errors so Redis is never on the critical path.

/** Get a raw JSON string stored by redisSetex. Returns null on miss/error. */
export async function redisGet(key: string): Promise<string | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    // @upstash/redis returns the value typed as stored.
    // We always store JSON strings, so cast accordingly.
    const val = await redis.get<string>(key);
    return val ?? null;
  } catch {
    return null;
  }
}

/** Store a JSON string with a TTL (seconds). */
export async function redisSetex(key: string, ttlSeconds: number, value: string): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.warn('[Redis] setex failed:', err);
  }
}

/** Delete one or more keys. */
export async function redisDel(...keys: string[]): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis || keys.length === 0) return;
    await redis.del(...keys);
  } catch (err) {
    console.warn('[Redis] del failed:', err);
  }
}

/**
 * Delete all keys matching a glob pattern using SCAN.
 * Safe for large keyspaces — never uses KEYS in production.
 */
export async function redisDelPattern(pattern: string): Promise<number> {
  try {
    const redis = getRedis();
    if (!redis) return 0;

    let cursor = 0;
    let deleted = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== 0);

    return deleted;
  } catch (err) {
    console.warn('[Redis] delPattern failed:', err);
    return 0;
  }
}

export const SELLER_CACHE_TTL = 1800; // 30 minutes
