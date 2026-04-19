/**
 * GET /api/admin/sellers/health-summary
 * Computes account health scores for ALL approved sellers from real order data.
 * Returns the average score and a list of sellers whose score is below 50.
 *
 * Score formula (0–100):
 *   Start at 100.
 *   Cancellation rate > 2%: −5 pts per % above target
 *   Return rate > 8%: −2 pts per % above target
 *   Clamped to [0, 100].
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

function computeScore(cancellationRate: number, returnRate: number): number {
  const cancPenalty   = Math.max(0, cancellationRate - 2) * 5;
  const returnPenalty = Math.max(0, returnRate - 8) * 2;
  return Math.max(0, Math.min(100, Math.round(100 - cancPenalty - returnPenalty)));
}

export async function GET(request: NextRequest) {
  try {
    const adminUserId = request.nextUrl.searchParams.get('adminUserId');
    if (!adminUserId) {
      return NextResponse.json({ error: 'adminUserId required' }, { status: 400 });
    }
    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all approved sellers
    const { data: sellers, error: sellersErr } = await supabaseAdmin
      .from('spf_sellers')
      .select('id, business_name')
      .eq('status', 'approved');

    if (sellersErr) throw sellersErr;
    if (!sellers?.length) {
      return NextResponse.json({ averageScore: 100, sellersBelow50: [], totalSellers: 0, sellerScores: [] });
    }

    // Fetch all orders with seller_id and status (lightweight)
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('spf_orders')
      .select('seller_id, status');

    if (ordersErr) throw ordersErr;

    const ordersBySeller = new Map<string, { total: number; cancelled: number; returned: number }>();
    for (const o of orders || []) {
      if (!o.seller_id) continue;
      if (!ordersBySeller.has(o.seller_id)) {
        ordersBySeller.set(o.seller_id, { total: 0, cancelled: 0, returned: 0 });
      }
      const s = ordersBySeller.get(o.seller_id)!;
      s.total++;
      if (o.status === 'CANCELLED') s.cancelled++;
      if (o.status === 'RETURNED')  s.returned++;
    }

    const sellerScores = sellers.map(seller => {
      const counts = ordersBySeller.get(seller.id) ?? { total: 0, cancelled: 0, returned: 0 };
      const { total, cancelled, returned } = counts;

      if (total === 0) {
        return { id: seller.id, name: seller.business_name, score: 100, totalOrders: 0, cancellationRate: 0, returnRate: 0 };
      }

      const cancellationRate = Math.round((cancelled / total) * 1000) / 10;
      const returnRate       = Math.round((returned  / total) * 1000) / 10;
      const score            = computeScore(cancellationRate, returnRate);

      return { id: seller.id, name: seller.business_name, score, totalOrders: total, cancellationRate, returnRate };
    });

    const averageScore = Math.round(
      sellerScores.reduce((s, r) => s + r.score, 0) / sellerScores.length
    );

    const sellersBelow50 = sellerScores
      .filter(s => s.score < 50)
      .sort((a, b) => a.score - b.score);

    return NextResponse.json({
      averageScore,
      sellersBelow50,
      totalSellers: sellers.length,
      sellerScores,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : (err as any)?.message ?? 'Unknown error';
    console.error('[admin/sellers/health-summary]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
