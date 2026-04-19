/**
 * Category Redis Cache Layer — Insta Fashion Points
 * Key namespace: categories:{type}
 * TTL: 3600 seconds (1 hour)
 */
import { redisGet, redisSetex, redisDelPattern } from '@/lib/redis';

export const CATEGORY_CACHE_TTL = 1800;

export function categoryKey(type: string): string {
  return `categories:${type}`;
}

export async function categoryCacheGet<T>(type: string): Promise<T | null> {
  const raw = await redisGet(categoryKey(type));
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export async function categoryCacheSet(type: string, data: unknown): Promise<void> {
  await redisSetex(categoryKey(type), CATEGORY_CACHE_TTL, JSON.stringify(data));
}

export async function invalidateCategoryCache(): Promise<void> {
  await redisDelPattern('categories:*');
  console.log('[CategoryCache] Cache invalidated');
}
