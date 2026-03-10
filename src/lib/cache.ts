/**
 * Cache utility — Upstash Redis (primary) with in-memory fallback.
 *
 * Upstash Redis is a serverless-compatible shared cache that works
 * correctly across all Vercel function instances, unlike in-memory Maps.
 *
 * Setup:
 *  1. Create a free Redis database at https://console.upstash.com
 *  2. Add to .env.local:
 *       UPSTASH_REDIS_REST_URL=https://...upstash.io
 *       UPSTASH_REDIS_REST_TOKEN=...
 *  3. Add the same vars to Vercel Environment Variables (Settings → Env Vars)
 *
 * If the env vars are absent the module falls back to in-memory Maps
 * (useful for local dev without a Redis instance).
 */

import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Redis client — created lazily so missing env vars don't crash at import time
// ---------------------------------------------------------------------------
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
    console.log('[Cache] Using Upstash Redis');
  }
  return redis;
}

// ---------------------------------------------------------------------------
// In-memory fallback (works in local dev, NOT shared across serverless instances)
// ---------------------------------------------------------------------------
interface MemEntry<T> { data: T; expiresAt: number }
const memStore = new Map<string, MemEntry<any>>();

function memGet<T>(key: string): T | null {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memStore.delete(key); return null; }
  return entry.data as T;
}
function memSet<T>(key: string, value: T, ttlSeconds: number): void {
  memStore.set(key, { data: value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
function memDelete(key: string): void { memStore.delete(key); }
function memClear(): void { memStore.clear(); }
function memKeys(): string[] { return Array.from(memStore.keys()); }

// ---------------------------------------------------------------------------
// Public Cache class — same API as before, now backed by Redis when available
// ---------------------------------------------------------------------------
class Cache {
  private prefix: string;
  private defaultTTL: number; // seconds

  constructor(defaultTTLSeconds: number = 300, prefix: string = 'spf') {
    this.defaultTTL = defaultTTLSeconds;
    this.prefix = prefix;
  }

  private key(k: string): string {
    return `${this.prefix}:${k}`;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTTL;
    const r = getRedis();
    if (r) {
      try {
        await r.set(this.key(key), JSON.stringify(value), { ex: ttl });
        console.log(`[Cache:Redis] Set: ${key} (TTL: ${ttl}s)`);
        return;
      } catch (e) {
        console.warn('[Cache:Redis] set failed, falling back to memory:', e);
      }
    }
    memSet(this.key(key), value, ttl);
    console.log(`[Cache:Mem] Set: ${key} (TTL: ${ttl}s)`);
  }

  async get<T>(key: string): Promise<T | null> {
    const r = getRedis();
    if (r) {
      try {
        const raw = await r.get<string>(this.key(key));
        if (raw === null || raw === undefined) {
          console.log(`[Cache:Redis] Miss: ${key}`);
          return null;
        }
        console.log(`[Cache:Redis] Hit: ${key}`);
        return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T;
      } catch (e) {
        console.warn('[Cache:Redis] get failed, falling back to memory:', e);
      }
    }
    const mem = memGet<T>(this.key(key));
    console.log(`[Cache:Mem] ${mem !== null ? 'Hit' : 'Miss'}: ${key}`);
    return mem;
  }

  async delete(key: string): Promise<void> {
    const r = getRedis();
    if (r) {
      try { await r.del(this.key(key)); return; } catch {}
    }
    memDelete(this.key(key));
  }

  async clear(): Promise<void> {
    const r = getRedis();
    if (r) {
      try {
        // Scan all keys with this prefix and delete them
        let cursor = 0;
        do {
          const result = await r.scan(cursor, { match: `${this.prefix}:*`, count: 100 });
          cursor = result[0];
          const keys = result[1];
          if (keys.length > 0) await r.del(...keys);
        } while (cursor !== 0);
        console.log(`[Cache:Redis] Cleared all ${this.prefix}:* keys`);
        return;
      } catch (e) {
        console.warn('[Cache:Redis] clear failed, falling back to memory:', e);
      }
    }
    // Fallback: clear only keys belonging to this prefix
    for (const k of memKeys()) {
      if (k.startsWith(`${this.prefix}:`)) memDelete(k);
    }
    console.log(`[Cache:Mem] Cleared all ${this.prefix}:* keys`);
  }
}

// ---------------------------------------------------------------------------
// Shared cache instances (TTLs preserved from original)
// ---------------------------------------------------------------------------
export const apiCache     = new Cache(300, 'api');      // 5 min
export const productCache = new Cache(600, 'product');  // 10 min
export const sellerCache  = new Cache(600, 'seller');   // 10 min

// ---------------------------------------------------------------------------
// getCachedData — same signature as before, now async-aware
// ---------------------------------------------------------------------------
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: Cache = apiCache,
  ttlSeconds?: number
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) return cached;

  console.log(`[Cache] Fetching fresh data for: ${key}`);
  const data = await fetcher();
  await cache.set(key, data, ttlSeconds);
  return data;
}

// ---------------------------------------------------------------------------
// invalidateCache — pattern-based deletion (memory fallback only)
// For Redis, prefer calling cache.clear() directly on the relevant instance.
// ---------------------------------------------------------------------------
export async function invalidateCache(
  pattern: string | RegExp,
  cache: Cache = apiCache
): Promise<void> {
  // Simplest cross-environment approach: clear the whole namespace
  await cache.clear();
  console.log(`[Cache] Invalidated entries matching: ${pattern}`);
}
