/**
 * Admin Redis Cache Layer — Insta Fashion Points
 *
 * Key namespace:  admin:{dataType}
 * TTL:            900 seconds (15 minutes)
 *
 * Data types cached:
 *   stats       → dashboard stat cards (totalOrders, revenue, etc.)
 *   orders      → recent 50 orders with customer/seller info
 *   products    → all products with seller names
 *   payments    → recent 90-day payment records
 *   sellers     → all sellers with user info
 *   customers   → customer count + recent customers
 *   analytics   → aggregated analytics (category-wise, delivery zones)
 *
 * Usage:
 *   import { migrateAdminDataToCache, adminCacheGet, invalidateAdminCache } from '@/lib/adminCache';
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { redisGet, redisSetex, redisDel, redisDelPattern } from '@/lib/redis';

// ─── Constants ──────────────────────────────────────────────────────────────

export const ADMIN_CACHE_TTL = 900; // 15 minutes

export type AdminCacheKey =
  | 'stats'
  | 'orders'
  | 'products'
  | 'payments'
  | 'sellers'
  | 'customers'
  | 'analytics';

// ─── Key helpers ────────────────────────────────────────────────────────────

export function adminKey(type: AdminCacheKey): string {
  return `admin:${type}`;
}

// ─── Read / Write ───────────────────────────────────────────────────────────

/** Cache-first read. Returns parsed JSON or null (triggers DB fallback). */
export async function adminCacheGet<T>(type: AdminCacheKey): Promise<T | null> {
  const raw = await redisGet(adminKey(type));
  if (!raw) return null;
  try {
    // @upstash/redis may return already-parsed objects
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T;
  } catch {
    return null;
  }
}

/** Write to cache with TTL. Fails silently. */
export async function adminCacheSet(type: AdminCacheKey, data: unknown): Promise<void> {
  await redisSetex(adminKey(type), ADMIN_CACHE_TTL, JSON.stringify(data));
}

// ─── Invalidation ───────────────────────────────────────────────────────────

/** Delete specific admin cache keys. */
export async function invalidateAdminCache(...types: AdminCacheKey[]): Promise<void> {
  if (types.length === 0) return;
  const keys = types.map(t => adminKey(t));
  await redisDel(...keys);
  console.log('[AdminCache] Invalidated:', types.join(', '));
}

/** Delete ALL admin cached data. */
export async function clearAllAdminCache(): Promise<void> {
  const count = await redisDelPattern('admin:*');
  console.log(`[AdminCache] Cleared ${count} keys`);
}

// ─── Migration (called fire-and-forget on admin login) ──────────────────────

/**
 * Fetches all admin dashboard data from Supabase in parallel and stores in Redis.
 * Called after admin login — does NOT block the login response.
 * Fails silently on any error.
 */
export async function migrateAdminDataToCache(): Promise<void> {
  const TTL = ADMIN_CACHE_TTL;

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    console.log('[AdminCache] Starting admin data migration to Redis...');

    // ── Fetch all data in parallel ──────────────────────────────────────

    const [
      totalOrdersRes,
      todayOrdersRes,
      returnedOrdersRes,
      recentOrdersRes,
      productsRes,
      pendingProductsRes,
      sellersRes,
      customersRes,
      paymentsRes,
      weekRevenueRes,
    ] = await Promise.all([
      // 1. Total orders count — spf_orders matches the Orders page
      supabaseAdmin
        .from('spf_orders')
        .select('id', { count: 'exact', head: true }),

      // 2. Today's orders count
      supabaseAdmin
        .from('spf_orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart),

      // 3. Returned orders count for real return rate
      supabaseAdmin
        .from('spf_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'RETURNED'),

      // 4. Recent 50 orders with details
      supabaseAdmin
        .from('spf_orders')
        .select(`
          id, order_number, status, subtotal, shipping_charge,
          shipping_address, payment_method, created_at, updated_at,
          spf_order_items(id, product_name, quantity, unit_price)
        `)
        .order('created_at', { ascending: false })
        .limit(50),

      // 4. All active products with seller name
      supabaseAdmin
        .from('spf_productdetails')
        .select(`
          id, product_id, name, name_hi, category, sub_category,
          price, original_price, main_image, stock_quantity,
          approval_status, is_active, seller_id, created_at,
          spf_sellers!spf_productdetails_seller_id_fkey ( business_name )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200),

      // 5. Pending approval count
      supabaseAdmin
        .from('spf_productdetails')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', 'pending')
        .is('deleted_at', null),

      // 6. Sellers with user info
      supabaseAdmin
        .from('spf_sellers')
        .select(`
          id, business_name, status, created_at,
          spf_users!spf_sellers_user_id_fkey ( name, email, mobile )
        `)
        .order('created_at', { ascending: false }),

      // 7. Customer count (unique users who placed orders)
      supabaseAdmin
        .from('spf_users')
        .select('id', { count: 'exact', head: true }),

      // 8. Recent payments/earnings
      supabaseAdmin
        .from('spf_seller_earnings')
        .select('id, order_id, order_date, seller_earning, commission_amount, quantity, item_name, payment_status, seller_id')
        .gte('order_date', ninetyDaysAgo)
        .order('order_date', { ascending: false })
        .limit(100),

      // 9. Last 7 days revenue for chart
      supabaseAdmin
        .from('spf_seller_earnings')
        .select('order_date, seller_earning')
        .gte('order_date', sevenDaysAgo),
    ]);

    // ── Compute stats ───────────────────────────────────────────────────

    const products = productsRes.data || [];
    const orders = recentOrdersRes.data || [];
    const sellers = sellersRes.data || [];
    const payments = paymentsRes.data || [];

    // Total revenue from earnings
    const totalRevenue = payments.reduce((sum: number, p: Record<string, unknown>) =>
      sum + (Number(p.seller_earning) || 0), 0
    );

    // Today's revenue
    const todayPayments = payments.filter((p: Record<string, unknown>) => {
      const d = String(p.order_date || '');
      return d >= todayStart.split('T')[0];
    });
    const todayRevenue = todayPayments.reduce((sum: number, p: Record<string, unknown>) =>
      sum + (Number(p.seller_earning) || 0), 0
    );

    // Return rate from DB counts (accurate, not limited to recent 50)
    const totalOrderCount = totalOrdersRes.count || 0;
    const returnedOrderCount = returnedOrdersRes.count || 0;
    const returnRate = totalOrderCount > 0
      ? Math.round((returnedOrderCount / totalOrderCount) * 1000) / 10
      : 0;

    const activeProducts = products.filter((p: Record<string, unknown>) => p.is_active).length;
    const activeSellers = sellers.filter((s: Record<string, unknown>) => s.status === 'approved').length;

    const avgOrderValue = orders.length > 0
      ? Math.round(orders.reduce((s: number, o: Record<string, unknown>) => {
          const total = Number(o.subtotal || 0) + Number(o.shipping_charge || 0);
          return s + total;
        }, 0) / orders.length)
      : 0;

    const stats = {
      totalOrders: totalOrderCount,
      todayOrders: todayOrdersRes.count || 0,
      totalRevenue,
      todayRevenue,
      totalProducts: products.length,
      activeProducts,
      pendingApprovals: pendingProductsRes.count || 0,
      totalSellers: sellers.length,
      activeSellers,
      totalCustomers: customersRes.count || 0,
      avgOrderValue,
      returnRate,
    };

    // Flatten products with seller name
    const flatProducts = products.map((p: Record<string, unknown>) => ({
      ...p,
      seller_name: (p.spf_sellers as Record<string, unknown>)?.business_name ?? 'Unknown',
      stock: (p.stock_quantity as number) ?? 0,
      spf_sellers: undefined,
    }));

    // Flatten orders with customer info from shipping_address (spf_orders schema)
    const flatOrders = orders.map((o: Record<string, unknown>) => {
      const addr = o.shipping_address as Record<string, unknown> | null;
      const items = (o.spf_order_items as Array<Record<string, unknown>>) || [];
      return {
        id: o.id,
        order_id: o.order_number || o.id,
        customer_name: (addr?.name as string) || 'Customer',
        customer_mobile: (addr?.phone as string) || '',
        pincode: (addr?.pincode as string) || '',
        district: (addr?.city as string) || '',
        items: items.map(i => ({
          product_id: '',
          name: (i.product_name as string) || '',
          quantity: Number(i.quantity) || 1,
          price: Number(i.unit_price) || 0,
          size: '',
        })),
        total: Number(o.subtotal || 0) + Number(o.shipping_charge || 0),
        status: o.status || 'pending',
        payment_mode: o.payment_method || 'cod',
        created_at: o.created_at,
        updated_at: o.updated_at,
      };
    });

    // Flatten payments
    const flatPayments = payments.map((p: Record<string, unknown>) => ({
      id: p.id,
      order_id: p.order_id || '',
      amount: Number(p.seller_earning) || 0,
      commission: Number(p.commission_amount) || 0,
      seller_payout: Number(p.seller_earning) || 0,
      status: p.payment_status === 'completed' ? 'settled' : 'pending',
      payment_mode: 'online',
      created_at: p.order_date,
      seller_name: p.item_name || '',
    }));

    // Revenue chart — aggregate by day
    const revenueByDay: Record<string, { revenue: number; orders: number }> = {};
    (weekRevenueRes.data || []).forEach((r: Record<string, unknown>) => {
      const day = String(r.order_date || '').slice(0, 10);
      if (!revenueByDay[day]) revenueByDay[day] = { revenue: 0, orders: 0 };
      revenueByDay[day].revenue += Number(r.seller_earning) || 0;
      revenueByDay[day].orders += 1;
    });
    const revenueChart = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
        revenue: Math.round(data.revenue),
        orders: data.orders,
      }));

    // Category-wise analytics
    const catMap: Record<string, { units: number; revenue: number }> = {};
    flatProducts.forEach((p: Record<string, unknown>) => {
      const cat = (p.category as string) || 'Other';
      if (!catMap[cat]) catMap[cat] = { units: 0, revenue: 0 };
      catMap[cat].units += 1;
      catMap[cat].revenue += Number(p.price) || 0;
    });
    const topCategories = Object.entries(catMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const analytics = {
      revenue: { today: todayRevenue, week: revenueChart.reduce((s, r) => s + r.revenue, 0), month: totalRevenue },
      orders: {
        pending: orders.filter((o: Record<string, unknown>) => o.status === 'pending').length,
        shipped: orders.filter((o: Record<string, unknown>) => o.status === 'shipped').length,
        delivered: deliveredOrders,
        returned: returnedOrders,
      },
      topCategories,
      revenueChart,
    };

    // ── Store all keys in Redis in parallel ─────────────────────────────

    await Promise.all([
      redisSetex(adminKey('stats'),     TTL, JSON.stringify(stats)),
      redisSetex(adminKey('orders'),    TTL, JSON.stringify(flatOrders)),
      redisSetex(adminKey('products'),  TTL, JSON.stringify(flatProducts)),
      redisSetex(adminKey('payments'),  TTL, JSON.stringify(flatPayments)),
      redisSetex(adminKey('sellers'),   TTL, JSON.stringify(sellers)),
      redisSetex(adminKey('customers'), TTL, JSON.stringify({ count: customersRes.count || 0 })),
      redisSetex(adminKey('analytics'), TTL, JSON.stringify(analytics)),
    ]);

    console.log(`[AdminCache]  Migrated 7 keys to Redis (TTL: ${TTL}s)`);
  } catch (err) {
    // Never block login — fail silently
    console.error('[AdminCache]  Migration failed:', err);
  }
}

// ─── Cache-first fetch helper ───────────────────────────────────────────────

/**
 * Checks Redis first; on miss, calls fetcher(), stores result, returns data.
 */
export async function adminCacheFirst<T>(
  type: AdminCacheKey,
  fetcher: () => Promise<T>,
): Promise<T> {
  // 1. Try cache
  const cached = await adminCacheGet<T>(type);
  if (cached !== null) {
    console.log(`[AdminCache] HIT  admin:${type}`);
    return cached;
  }

  // 2. Cache miss — fetch from DB
  console.log(`[AdminCache] MISS admin:${type} — fetching from DB`);
  const fresh = await fetcher();

  // 3. Store in cache (background write)
  adminCacheSet(type, fresh).catch(() => {});

  return fresh;
}
