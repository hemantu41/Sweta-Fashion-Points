/**
 * Seller Redis Cache Layer — Insta Fashion Points
 *
 * Key namespace:  seller:{sellerId}:{dataType}
 * TTL:            300 seconds (5 minutes)
 *
 * Data types cached:
 *   profile    → seller profile + user info from spf_sellers + spf_users
 *   products   → all product listings from spf_productdetails
 *   inventory  → stock quantities extracted from products
 *   orders     → recent 90 days from spf_payment_orders
 *   pricing    → price/originalPrice per product (derived from products)
 *   analytics  → raw earnings rows from spf_seller_earnings (last 90 days)
 *
 * Usage:
 *   import { migrateSellerDataToCache, sellerCacheGet, sellerCacheSet, invalidateSellerKeys } from '@/lib/sellerCache';
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { redisGet, redisSetex, redisDel, redisDelPattern, SELLER_CACHE_TTL } from '@/lib/redis';

// ─── L1: In-memory cache ─────────────────────────────────────────────────────
// Keeps a hot copy of each seller's data inside the serverless instance.
// Sub-millisecond reads for warm instances; falls back to Redis (L2) on cold start.

interface MemEntry { data: unknown; expiresAt: number; }
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

function memDelGlob(pattern: string): void {
  const re = new RegExp(
    '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
  );
  for (const key of mem.keys()) { if (re.test(key)) mem.delete(key); }
}

// ─── Key helpers ────────────────────────────────────────────────────────────

export type SellerCacheKey = 'profile' | 'products' | 'inventory' | 'orders' | 'pricing' | 'analytics' | 'reviews';

export function sellerKey(sellerId: string, type: SellerCacheKey): string {
  return `seller:${sellerId}:${type}`;
}

// ─── Read / Write ────────────────────────────────────────────────────────────

/** Cache-first read: L1 (memory) → L2 (Redis) → null */
export async function sellerCacheGet<T>(sellerId: string, type: SellerCacheKey): Promise<T | null> {
  const key = sellerKey(sellerId, type);

  // L1 — sub-millisecond on warm instances
  const l1 = memGet<T>(key);
  if (l1 !== null) {
    console.log(`[SellerCache] L1 hit: ${key}`);
    return l1;
  }

  // L2 — Redis (~30 ms, shared across instances)
  const raw = await redisGet(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as T;
    memSet(key, parsed, SELLER_CACHE_TTL); // warm L1 for next request
    console.log(`[SellerCache] L2 hit: ${key}`);
    return parsed;
  } catch {
    return null;
  }
}

/** Write to both L1 (memory) and L2 (Redis) with 30-min TTL. */
export async function sellerCacheSet(sellerId: string, type: SellerCacheKey, data: unknown): Promise<void> {
  const key = sellerKey(sellerId, type);
  memSet(key, data, SELLER_CACHE_TTL);
  await redisSetex(key, SELLER_CACHE_TTL, JSON.stringify(data));
}

// ─── Invalidation ────────────────────────────────────────────────────────────

/** Delete specific cache keys from L1 + L2 (e.g. after product update). */
export async function invalidateSellerKeys(sellerId: string, ...types: SellerCacheKey[]): Promise<void> {
  if (types.length === 0) return;
  const keys = types.map(t => sellerKey(sellerId, t));
  keys.forEach(k => mem.delete(k));    // L1
  await redisDel(...keys);             // L2
  console.log(`[SellerCache] Invalidated keys for seller ${sellerId}:`, types.join(', '));
}

/** Delete ALL cached data for a seller from L1 + L2 (e.g. on logout). */
export async function clearAllSellerCache(sellerId: string): Promise<void> {
  memDelGlob(`seller:${sellerId}:*`);  // L1
  const count = await redisDelPattern(`seller:${sellerId}:*`); // L2
  console.log(`[SellerCache] Cleared ${count} Redis keys for seller ${sellerId}`);
}

// ─── Migration (called fire-and-forget on login) ─────────────────────────────

/**
 * Fetches all seller data from DB in parallel and stores in Redis.
 * Called after successful login — does NOT block the login response.
 * Fails silently on any error.
 */
export async function migrateSellerDataToCache(sellerId: string): Promise<void> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

    console.log(`[SellerCache] Starting cache migration for seller ${sellerId}...`);

    // Fetch all data in parallel (7 concurrent queries)
    const [profileRes, productsRes, ordersRes, analyticsRes, reviewsRes] = await Promise.all([
      // 1. Seller profile + user info
      supabaseAdmin
        .from('spf_sellers')
        .select(`
          *,
          user:spf_users!spf_sellers_user_id_fkey (
            id, name, email, mobile
          )
        `)
        .eq('id', sellerId)
        .single(),

      // 2. All product listings (also used for inventory & pricing)
      supabaseAdmin
        .from('spf_productdetails')
        .select('id, product_id, name, category, sub_category, l1_category_id, l2_category_id, l3_category_id, price, original_price, price_range, stock_quantity, approval_status, is_active, main_image, images, colors, sizes, created_at, updated_at')
        .eq('seller_id', sellerId)
        .is('deleted_at', null),

      // 3. Orders from spf_orders — same table/shape as the orders API route
      supabaseAdmin
        .from('spf_orders')
        .select(`
          id, order_number, seller_id, customer_id, status,
          subtotal, shipping_charge,
          acceptance_sla_deadline, packing_sla_deadline,
          packed_at, picked_up_at, delivered_at,
          shipping_address, created_at,
          awb_number, courier_partner, tracking_url,
          spf_order_items (
            id, product_id, seller_id, product_name,
            variant_details, sku, quantity, unit_price, total_price
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(300),

      // 4. Raw earnings rows for analytics (last 90 days)
      supabaseAdmin
        .from('spf_seller_earnings')
        .select('id, order_date, seller_earning, commission_amount, quantity, product_id, item_name, payment_status')
        .eq('seller_id', sellerId)
        .gte('order_date', ninetyDaysAgoStr)
        .order('order_date', { ascending: false }),

      // 5. All seller reviews (incl. seller responses) — used by reviews page
      supabaseAdmin
        .from('spf_reviews')
        .select('*, spf_seller_responses(*)')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    const products = productsRes.data || [];

    // Derive inventory from products (stock per product)
    const inventory = products.map(p => ({
      productId: p.id,
      productName: p.name,
      category: p.category,
      stockQuantity: p.stock_quantity ?? 0,
      isActive: p.is_active,
      approvalStatus: p.approval_status,
    }));

    // Derive pricing from products
    const pricing = products.map(p => ({
      productId: p.id,
      productName: p.name,
      price: p.price,
      originalPrice: p.original_price,
      priceRange: p.price_range,
    }));

    // Store all 7 keys in both L1 (memory) and L2 (Redis) in parallel
    await Promise.all([
      sellerCacheSet(sellerId, 'profile',   profileRes.data || null),
      sellerCacheSet(sellerId, 'products',  products),
      sellerCacheSet(sellerId, 'inventory', inventory),
      sellerCacheSet(sellerId, 'orders',    ordersRes.data || []),
      sellerCacheSet(sellerId, 'pricing',   pricing),
      sellerCacheSet(sellerId, 'analytics', analyticsRes.data || []),
      sellerCacheSet(sellerId, 'reviews',   reviewsRes.data || []),
    ]);

    console.log(`[SellerCache]  Migrated 7 keys for seller ${sellerId} (TTL: ${SELLER_CACHE_TTL}s)`);
  } catch (err) {
    // Never block login — fail silently
    console.error(`[SellerCache]  Migration failed for seller ${sellerId}:`, err);
  }
}

/**
 * Cache-first fetch helper.
 * Checks Redis first; on miss, calls fetcher(), stores result, returns data.
 */
export async function cacheFirst<T>(
  sellerId: string,
  type: SellerCacheKey,
  fetcher: () => Promise<T>,
): Promise<T> {
  // 1. Try cache
  const cached = await sellerCacheGet<T>(sellerId, type);
  if (cached !== null) {
    console.log(`[SellerCache] HIT  seller:${sellerId}:${type}`);
    return cached;
  }

  // 2. Cache miss — fetch from DB
  console.log(`[SellerCache] MISS seller:${sellerId}:${type} — fetching from DB`);
  const fresh = await fetcher();

  // 3. Store in cache (don't await — background write)
  sellerCacheSet(sellerId, type, fresh).catch(() => {});

  return fresh;
}
