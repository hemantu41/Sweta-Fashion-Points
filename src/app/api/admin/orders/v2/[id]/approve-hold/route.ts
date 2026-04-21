/**
 * POST /api/admin/orders/v2/[id]/approve-hold
 * Admin clears a HOLD risk status — allows the order to proceed normally.
 * Uses Supabase directly (no Prisma/DATABASE_URL needed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { invalidateSellerKeys } from '@/lib/sellerCache';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('spf_orders')
      .select('status, risk_status, seller_id')
      .eq('id', id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const o = order as any;
    if (o.risk_status !== 'HOLD') {
      return NextResponse.json(
        { error: `Order risk status is ${o.risk_status}, not HOLD` },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    await Promise.all([
      supabaseAdmin
        .from('spf_orders')
        .update({ risk_status: 'CLEAR', updated_at: now })
        .eq('id', id),
      supabaseAdmin
        .from('spf_order_status_history')
        .insert({
          order_id:    id,
          from_status: o.status,
          to_status:   o.status,
          actor_type:  'ADMIN',
          note:        'Admin approved: HOLD risk status cleared after manual review',
          created_at:  now,
        }),
    ]);

    // Invalidate seller's orders cache so they see the hold clearance immediately
    invalidateSellerKeys(o.seller_id, 'orders').catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[admin/orders/v2/approve-hold] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
