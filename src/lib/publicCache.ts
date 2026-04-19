/**
 * Two-tier public data cache — Insta Fashion Points
 *
 * L1 : In-memory Map  — < 1 ms, only warm for the current serverless instance
 * L2 : Upstash Redis  — ~30 ms, shared across every instance / region
 * L3 : Fetcher fn     — Supabase DB query (100 – 500 ms)
 *
 * Used exclusively for public-facing (unauthenticated) data so the API
 * routes can also return aggressive CDN Cache-Control headers.
 *
 * Key namespace convention:
 *   pub:products:{params}
 *   pub:product:{id}
 *
 * All functions are safe no-ops when Redis is not configured — the app
 * falls back to L1 (memory) or L3 (DB) transparently.
 */

import { redisGet, redisSetex, redisDelPattern, redisDel } from '@/lib/redis';

// ─── L1 in-memory store ──────────────────────────────────────────────────────

interface MemEntry {
  data: unknown;
  expiresAt: number;
}

const mem = new Map<string, MemEntry>();

function memGet<T>(key: string): T | null {
  const e = mem.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { mem.delete(key); return null; }
  return e.data as T;
}

function memSet(key: string, data: unknown, ttlSeconds: number): void {
  mem.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memDelByGlob(pattern: string): void {
  // Convert glob (pub:products:*) to a RegExp
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const re = new RegExp(`^${escaped}$`);
  for (const key of mem.keys()) {
    if (re.test(key)) mem.delete(key);
  }
}

// ─── Public helpers ───────────────────────────────────────────────────────────

/**
 * Cache-first fetcher. Checks L1 → L2 → calls fetcher() on miss.
 * Populates both tiers after a DB fetch.
 *
 * Usage:
 *   const products = await publicGet('pub:products:womens', fetchFromDB, 600);
 */
export async function publicGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 1800,
): Promise<T> {
  // L1 — sub-millisecond on warm instances
  const l1 = memGet<T>(key);
  if (l1 !== null) {
    console.log(`[PublicCache] L1 hit: ${key}`);
    return l1;
  }

  // L2 — Redis (~30 ms, shared across instances)
  const raw = await redisGet(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as T;
      memSet(key, parsed, ttlSeconds);          // warm L1 for next request
      console.log(`[PublicCache] L2 hit: ${key}`);
      return parsed;
    } catch { /* corrupted value — fall through to DB */ }
  }

  // L3 — DB query
  console.log(`[PublicCache] Miss, querying DB: ${key}`);
  const data = await fetcher();

  // Store in both tiers (Redis write is fire-and-forget — never blocks response)
  memSet(key, data, ttlSeconds);
  redisSetex(key, ttlSeconds, JSON.stringify(data)).catch(() => {});

  return data;
}

/**
 * Read from cache only (L1 → L2). Returns null on miss.
 * Use this when you need to control the "not found" path yourself.
 */
export async function publicCacheGet<T>(key: string, ttlSeconds = 1800): Promise<T | null> {
  const l1 = memGet<T>(key);
  if (l1 !== null) return l1;

  const raw = await redisGet(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as T;
    memSet(key, parsed, ttlSeconds);
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Write to both tiers.
 */
export async function publicCacheSet(key: string, data: unknown, ttlSeconds = 1800): Promise<void> {
  memSet(key, data, ttlSeconds);
  await redisSetex(key, ttlSeconds, JSON.stringify(data));
}

/**
 * Delete all keys matching a glob pattern from L1 + Redis.
 * e.g. publicInvalidate('pub:products:*')
 */
export async function publicInvalidate(pattern: string): Promise<void> {
  memDelByGlob(pattern);
  await redisDelPattern(pattern);
  console.log(`[PublicCache] Invalidated: ${pattern}`);
}

/**
 * Delete specific keys from L1 + Redis.
 */
export async function publicDel(...keys: string[]): Promise<void> {
  keys.forEach(k => mem.delete(k));
  if (keys.length > 0) await redisDel(...keys);
}
