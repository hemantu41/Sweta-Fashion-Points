/**
 * PUT /api/orders/[id]
 * Body: { status: 'accepted' | 'cancelled', sellerId: string }
 *
 * Called by the seller dashboard to accept or cancel an order.
 * Reads/writes spf_orders via Supabase (no Prisma/DATABASE_URL needed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const PACKING_SLA_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const { status, sellerId } = body as { status?: string; sellerId?: string };

    if (!status || !sellerId) {
      return NextResponse.json(
        { error: 'status and sellerId are required' },
        { status: 400 },
      );
    }

    if (!['accepted', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition to status "${status}" via this endpoint` },
        { status: 400 },
      );
    }

    // Fetch current order
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('spf_orders')
      .select('id, status, seller_id')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.seller_id !== sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date().toISOString();

    if (status === 'accepted') {
      if (!['SELLER_NOTIFIED', 'CONFIRMED'].includes(order.status)) {
        return NextResponse.json(
          { error: `Order cannot be accepted — current status: ${order.status}` },
          { status: 400 },
        );
      }

      const packingSlaDeadline = new Date(Date.now() + PACKING_SLA_MS).toISOString();

      const { error: updateErr } = await supabaseAdmin
        .from('spf_orders')
        .update({
          status:               'ACCEPTED',
          seller_accepted_at:   now,
          packing_sla_deadline: packingSlaDeadline,
          updated_at:           now,
        })
        .eq('id', orderId);

      if (updateErr) {
        console.error('[Order PUT] Update error:', updateErr.message);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
      }

      // Write status history
      await supabaseAdmin.from('spf_order_status_history').insert({
        order_id:   orderId,
        from_status: order.status,
        to_status:  'ACCEPTED',
        actor_type: 'SELLER',
        actor_id:   sellerId,
        note:       'Seller accepted the order',
        created_at: now,
      });
    }

    if (status === 'cancelled') {
      const cancellable = ['CONFIRMED', 'SELLER_NOTIFIED', 'ACCEPTED'];
      if (!cancellable.includes(order.status)) {
        return NextResponse.json(
          { error: `Order cannot be cancelled — current status: ${order.status}` },
          { status: 400 },
        );
      }

      const { error: updateErr } = await supabaseAdmin
        .from('spf_orders')
        .update({ status: 'CANCELLED', updated_at: now })
        .eq('id', orderId);

      if (updateErr) {
        return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
      }

      await supabaseAdmin.from('spf_order_status_history').insert({
        order_id:   orderId,
        from_status: order.status,
        to_status:  'CANCELLED',
        actor_type: 'SELLER',
        actor_id:   sellerId,
        note:       'Seller cancelled the order',
        created_at: now,
      });
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error('[Order PUT] Error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
