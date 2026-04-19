/**
 * Seller Redis Cache Layer — Insta Fashion Points
 *
 * Key namespace:  seller:{sellerId}:{dataType}
 * TTL:            1800 seconds (30 minutes)
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

// ─── Key helpers ────────────────────────────────────────────────────────────

export type SellerCacheKey = 'profile' | 'products' | 'inventory' | 'orders' | 'pricing' | 'analytics' | 'reviews';

export function sellerKey(sellerId: string, type: SellerCacheKey): string {
  return `seller:${sellerId}:${type}`;
}

// ─── Read / Write ────────────────────────────────────────────────────────────

/** Cache-first read. Returns parsed JSON or null (triggers DB fallback). */
export async function sellerCacheGet<T>(sellerId: string, type: SellerCacheKey): Promise<T | null> {
  const raw = await redisGet(sellerKey(sellerId, type));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Write to cache with 30-min TTL. Fails silently. */
export async function sellerCacheSet(sellerId: string, type: SellerCacheKey, data: unknown): Promise<void> {
  await redisSetex(sellerKey(sellerId, type), SELLER_CACHE_TTL, JSON.stringify(data));
}

// ─── Invalidation ────────────────────────────────────────────────────────────

/** Delete specific cache keys for a seller (e.g. after product update). */
export async function invalidateSellerKeys(sellerId: string, ...types: SellerCacheKey[]): Promise<void> {
  if (types.length === 0) return;
  const keys = types.map(t => sellerKey(sellerId, t));
  await redisDel(...keys);
  console.log(`[SellerCache] Invalidated keys for seller ${sellerId}:`, types.join(', '));
}

/** Delete ALL cached data for a seller (e.g. on logout). */
export async function clearAllSellerCache(sellerId: string): Promise<void> {
  const count = await redisDelPattern(`seller:${sellerId}:*`);
  console.log(`[SellerCache] Cleared ${count} keys for seller ${sellerId}`);
}

// ─── Migration (called fire-and-forget on login) ─────────────────────────────

/**
 * Fetches all seller data from DB in parallel and stores in Redis.
 * Called after successful login — does NOT block the login response.
 * Fails silently on any error.
 */
export async function migrateSellerDataToCache(sellerId: string): Promise<void> {
  const TTL = SELLER_CACHE_TTL;

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
        .select('id, product_id, name, category, sub_category, price, original_price, price_range, stock_quantity, approval_status, is_active, main_image, images, colors, sizes, created_at, updated_at')
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

    // Store all 7 keys in Redis in parallel
    await Promise.all([
      redisSetex(sellerKey(sellerId, 'profile'),   TTL, JSON.stringify(profileRes.data || null)),
      redisSetex(sellerKey(sellerId, 'products'),  TTL, JSON.stringify(products)),
      redisSetex(sellerKey(sellerId, 'inventory'), TTL, JSON.stringify(inventory)),
      redisSetex(sellerKey(sellerId, 'orders'),    TTL, JSON.stringify(ordersRes.data || [])),
      redisSetex(sellerKey(sellerId, 'pricing'),   TTL, JSON.stringify(pricing)),
      redisSetex(sellerKey(sellerId, 'analytics'), TTL, JSON.stringify(analyticsRes.data || [])),
      redisSetex(sellerKey(sellerId, 'reviews'),   TTL, JSON.stringify(reviewsRes.data || [])),
    ]);

    console.log(`[SellerCache] ✅ Migrated 7 keys for seller ${sellerId} (TTL: ${TTL}s)`);
  } catch (err) {
    // Never block login — fail silently
    console.error(`[SellerCache] ❌ Migration failed for seller ${sellerId}:`, err);
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
