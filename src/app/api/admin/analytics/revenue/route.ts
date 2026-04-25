/**
 * GET /api/admin/analytics/revenue
 * Returns time-bucketed revenue + order count from spf_orders.
 *
 * Query params:
 *   adminUserId  — required
 *   period       — "week" (last 7 days, daily) | "month" (last 30 days, daily) | "quarter" (last 13 weeks, weekly)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

async function verifyAdmin(adminUserId: string) {
  const { data } = await supabaseAdmin
    .from('spf_users')
    .select('is_admin')
    .eq('id', adminUserId)
    .single();
  return !!data?.is_admin;
}

interface Bucket {
  label: string;
  startMs: number;
  endMs: number;
  revenue: number;
  orders: number;
}

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

    const now = new Date();

    // ── Build time buckets ──────────────────────────────────────────────────
    const buckets: Bucket[] = [];

    if (period === 'week') {
      // Last 7 days, one bucket per day
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const e = new Date(d);
        e.setHours(23, 59, 59, 999);
        buckets.push({
          label:   d.toLocaleDateString('en-IN', { weekday: 'short' }),
          startMs: d.getTime(),
          endMs:   e.getTime(),
          revenue: 0,
          orders:  0,
        });
      }
    } else if (period === 'month') {
      // Last 30 days, one bucket per day
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const e = new Date(d);
        e.setHours(23, 59, 59, 999);
        buckets.push({
          label:   d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          startMs: d.getTime(),
          endMs:   e.getTime(),
          revenue: 0,
          orders:  0,
        });
      }
    } else if (period === 'quarter') {
      // Last 13 weeks, one bucket per week (Mon–Sun)
      for (let i = 12; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - i * 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        buckets.push({
          label:   weekStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          startMs: weekStart.getTime(),
          endMs:   Math.min(weekEnd.getTime(), now.getTime()),
          revenue: 0,
          orders:  0,
        });
      }
    }

    if (buckets.length === 0) {
      return NextResponse.json({ data: [], summary: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 } });
    }

    const rangeStart = new Date(buckets[0].startMs).toISOString();
    const rangeEnd   = new Date(buckets[buckets.length - 1].endMs).toISOString();

    // ── Fetch orders in range (exclude CANCELLED) ───────────────────────────
    const { data: orders, error } = await supabaseAdmin
      .from('spf_orders')
      .select('created_at, subtotal, shipping_charge, status')
      .gte('created_at', rangeStart)
      .lte('created_at', rangeEnd)
      .neq('status', 'CANCELLED');

    if (error) throw error;

    // ── Assign each order to its bucket ────────────────────────────────────
    for (const o of orders || []) {
      const ts      = new Date(o.created_at).getTime();
      const revenue = Number(o.subtotal || 0) + Number(o.shipping_charge || 0);
      for (const bucket of buckets) {
        if (ts >= bucket.startMs && ts <= bucket.endMs) {
          bucket.revenue += revenue;
          bucket.orders  += 1;
          break;
        }
      }
    }

    const totalRevenue = buckets.reduce((s, b) => s + b.revenue, 0);
    const totalOrders  = buckets.reduce((s, b) => s + b.orders, 0);

    return NextResponse.json({
      data: buckets.map(b => ({
        date:    b.label,
        revenue: Math.round(b.revenue),
        orders:  b.orders,
      })),
      summary: {
        totalRevenue:  Math.round(totalRevenue),
        totalOrders,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[admin/analytics/revenue]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
