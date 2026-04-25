/**
 * GET /api/admin/analytics/overview
 * Returns three datasets for the Analytics page (all period-filtered):
 *   categoryRevenue  — revenue + units per product category
 *   orderStatus      — order count per status (replaces mock returns donut)
 *   deliveryZones    — top pincodes by order count with revenue
 *
 * Query params:
 *   adminUserId — required
 *   period      — "week" | "month" | "quarter"  (same windows as revenue API)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

async function verifyAdmin(id: string) {
  const { data } = await supabaseAdmin
    .from('spf_users')
    .select('is_admin')
    .eq('id', id)
    .single();
  return !!data?.is_admin;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get('adminUserId');
    const period      = searchParams.get('period') || 'week';

    if (!adminUserId) {
      return NextResponse.json({ error: 'adminUserId required' }, { status: 400 });
    }
    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Date range (mirrors revenue API) ───────────────────────────────────
    const now   = new Date();
    const start = new Date(now);
    if (period === 'week')    start.setDate(now.getDate() - 6);
    else if (period === 'month')   start.setDate(now.getDate() - 29);
    else if (period === 'quarter') start.setDate(now.getDate() - 89);
    start.setHours(0, 0, 0, 0);

    // ── Fetch orders in period ──────────────────────────────────────────────
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('spf_orders')
      .select('id, status, subtotal, shipping_charge, shipping_address')
      .gte('created_at', start.toISOString())
      .lte('created_at', now.toISOString());

    if (ordersErr) throw ordersErr;
    if (!orders || orders.length === 0) {
      return NextResponse.json({
        categoryRevenue: [],
        orderStatus:     [],
        deliveryZones:   [],
      });
    }

    const orderIds = orders.map((o: any) => o.id);

    // ── 1. Category Revenue ─────────────────────────────────────────────────
    // Fetch line items for these orders
    const { data: items } = await supabaseAdmin
      .from('spf_order_items')
      .select('product_id, quantity, total_price')
      .in('order_id', orderIds);

    const catRevMap: Record<string, { name: string; revenue: number; units: number }> = {};

    if (items && items.length > 0) {
      // Unique product IDs
      const productIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))];

      // Fetch product category for those product_ids
      const { data: products } = await supabaseAdmin
        .from('spf_productdetails')
        .select('product_id, category')
        .in('product_id', productIds as string[]);

      // Build product_id → raw category map
      const prodCatMap: Record<string, string> = {};
      (products || []).forEach((p: any) => {
        if (p.product_id) prodCatMap[p.product_id] = p.category || 'Other';
      });

      // Resolve UUID categories → names
      const uuidCategoryIds = [
        ...new Set(
          Object.values(prodCatMap).filter((c) => UUID_RE.test(c))
        ),
      ];
      const catNameMap: Record<string, string> = {};
      if (uuidCategoryIds.length > 0) {
        const { data: cats } = await supabaseAdmin
          .from('spf_categories')
          .select('id, name')
          .in('id', uuidCategoryIds);
        (cats || []).forEach((c: any) => { catNameMap[c.id] = c.name; });
      }

      // Aggregate revenue + units by resolved category name
      for (const item of items) {
        const rawCat  = prodCatMap[item.product_id] || 'Other';
        const catName = UUID_RE.test(rawCat) ? (catNameMap[rawCat] || 'Other') : rawCat;
        const key     = catName || 'Other';
        if (!catRevMap[key]) catRevMap[key] = { name: key, revenue: 0, units: 0 };
        catRevMap[key].revenue += Number(item.total_price || 0);
        catRevMap[key].units   += Number(item.quantity || 1);
      }
    }

    const categoryRevenue = Object.values(catRevMap)
      .map((c) => ({ ...c, revenue: Math.round(c.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 7);

    // ── 2. Order Status breakdown ───────────────────────────────────────────
    const statusCount: Record<string, number> = {};
    for (const o of orders) {
      const s = (o.status as string) || 'UNKNOWN';
      statusCount[s] = (statusCount[s] || 0) + 1;
    }

    // Human-readable labels + brand colours
    const STATUS_META: Record<string, { label: string; color: string }> = {
      CONFIRMED:        { label: 'Confirmed',        color: '#3b82f6' },
      ACCEPTED:         { label: 'Accepted',          color: '#3b82f6' },
      PACKED:           { label: 'Packed',            color: '#8b5cf6' },
      PICKED_UP:        { label: 'Picked Up',         color: '#6366f1' },
      SHIPPED:          { label: 'Shipped',           color: '#6366f1' },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery',  color: '#f59e0b' },
      DELIVERED:        { label: 'Delivered',         color: '#22c55e' },
      CANCELLED:        { label: 'Cancelled',         color: '#ef4444' },
      RETURNED:         { label: 'Returned',          color: '#f97316' },
      PAYMENT_PENDING:  { label: 'Payment Pending',   color: '#94a3b8' },
    };

    const orderStatus = Object.entries(statusCount)
      .map(([status, count]) => ({
        status: STATUS_META[status]?.label ?? status,
        count,
        fill:   STATUS_META[status]?.color ?? '#94a3b8',
      }))
      .sort((a, b) => b.count - a.count);

    // ── 3. Delivery Zones ───────────────────────────────────────────────────
    const zoneMap: Record<string, { pincode: string; city: string; orders: number; revenue: number }> = {};
    for (const o of orders) {
      const addr    = (o.shipping_address as any) || {};
      const pincode = addr.pincode || '—';
      const city    = addr.city || addr.district || '—';
      const revenue = Number(o.subtotal || 0) + Number(o.shipping_charge || 0);

      if (!zoneMap[pincode]) zoneMap[pincode] = { pincode, city, orders: 0, revenue: 0 };
      zoneMap[pincode].orders  += 1;
      zoneMap[pincode].revenue += revenue;
    }

    const deliveryZones = Object.values(zoneMap)
      .map((z) => ({
        ...z,
        revenue:       Math.round(z.revenue),
        avgOrderValue: Math.round(z.revenue / z.orders),
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);

    return NextResponse.json({ categoryRevenue, orderStatus, deliveryZones });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[admin/analytics/overview]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
