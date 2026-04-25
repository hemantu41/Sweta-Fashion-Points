/**
 * POST /api/admin/orders/v2/[id]/cancel
 * Admin cancels an order. Body: { reason?: string }
 * Uses Supabase directly (no Prisma/DATABASE_URL needed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { invalidateSellerKeys } from '@/lib/sellerCache';

const NON_CANCELLABLE = ['DELIVERED', 'RETURNED', 'CANCELLED'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body   = await req.json().catch(() => ({}));
    const reason = (body.reason as string | undefined)?.trim() || undefined;

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('spf_orders')
      .select('status, seller_id')
      .eq('id', id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (NON_CANCELLABLE.includes((order as any).status)) {
      return NextResponse.json(
        { error: `Cannot cancel an order with status ${(order as any).status}` },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    await Promise.all([
      supabaseAdmin
        .from('spf_orders')
        .update({ status: 'CANCELLED', updated_at: now })
        .eq('id', id),
      supabaseAdmin
        .from('spf_order_status_history')
        .insert({
          order_id:    id,
          from_status: (order as any).status,
          to_status:   'CANCELLED',
          actor_type:  'ADMIN',
          note:        reason ? `Admin cancelled: ${reason}` : 'Cancelled by admin',
          created_at:  now,
        }),
    ]);

    // Invalidate seller's orders cache so they see the cancellation immediately
    invalidateSellerKeys((order as any).seller_id, 'orders').catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[admin/orders/v2/cancel] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
