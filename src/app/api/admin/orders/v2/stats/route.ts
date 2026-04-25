/**
 * GET /api/admin/orders/v2/stats
 * Returns summary counts for the admin orders header stat cards.
 * Uses Supabase directly (no Prisma/DATABASE_URL needed).
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now        = new Date().toISOString();
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const warnCutoff = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const [
      { count: totalToday },
      { count: pendingAcceptance },
      { count: slaAtRisk },
      { count: fraudHold },
      { count: deliveredToday },
    ] = await Promise.all([
      supabaseAdmin
        .from('spf_orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart),
      supabaseAdmin
        .from('spf_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'SELLER_NOTIFIED'),
      supabaseAdmin
        .from('spf_orders')
        .select('*', { count: 'exact', head: true })
        .or(
          `and(status.eq.SELLER_NOTIFIED,acceptance_sla_deadline.gt.${now},acceptance_sla_deadline.lte.${warnCutoff}),and(status.eq.ACCEPTED,packing_sla_deadline.gt.${now},packing_sla_deadline.lte.${warnCutoff})`
        ),
      supabaseAdmin
        .from('spf_orders')
        .select('*', { count: 'exact', head: true })
        .eq('risk_status', 'HOLD'),
      supabaseAdmin
        .from('spf_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'DELIVERED')
        .gte('delivered_at', todayStart),
    ]);

    return NextResponse.json({
      totalToday:        totalToday        ?? 0,
      pendingAcceptance: pendingAcceptance ?? 0,
      slaAtRisk:         slaAtRisk         ?? 0,
      fraudHold:         fraudHold         ?? 0,
      deliveredToday:    deliveredToday    ?? 0,
    });
  } catch (err: any) {
    console.error('[admin/orders/v2/stats] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
