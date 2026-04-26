/**
 * PUT /api/orders/[id]
 * Body: { status: 'accepted' | 'rejected' | 'cancelled', sellerId: string, reason?: string }
 *
 * Called by the seller dashboard to accept, reject, or cancel an order.
 * Reads/writes spf_orders via Supabase (no Prisma/DATABASE_URL needed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyCustomerOrderRejected } from '@/lib/notifications/sellerNotify';

const PACKING_SLA_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const { status, sellerId, reason } = body as { status?: string; sellerId?: string; reason?: string };

    if (!status || !sellerId) {
      return NextResponse.json(
        { error: 'status and sellerId are required' },
        { status: 400 },
      );
    }

    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition to status "${status}" via this endpoint` },
        { status: 400 },
      );
    }

    // Fetch current order
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('spf_orders')
      .select('id, status, seller_id, customer_id, order_number, subtotal, shipping_charge, payment_method')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.seller_id !== sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date().toISOString();

    // ── ACCEPT ────────────────────────────────────────────────────────────────
    if (status === 'accepted') {
      const acceptable = ['SELLER_NOTIFIED', 'CONFIRMED', 'captured'];
      if (!acceptable.map(s => s.toLowerCase()).includes((order.status || '').toLowerCase())) {
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
        console.error('[Order PUT] Accept update error:', updateErr.message);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
      }

      await supabaseAdmin.from('spf_order_status_history').insert({
        order_id:    orderId,
        from_status: order.status,
        to_status:   'ACCEPTED',
        actor_type:  'SELLER',
        actor_id:    sellerId,
        note:        'Seller accepted the order',
        created_at:  now,
      });
    }

    // ── REJECT ────────────────────────────────────────────────────────────────
    if (status === 'rejected') {
      if (!reason?.trim()) {
        return NextResponse.json({ error: 'A rejection reason is required' }, { status: 400 });
      }

      const rejectable = ['captured', 'SELLER_NOTIFIED', 'CONFIRMED', 'ACCEPTED'];
      if (!rejectable.map(s => s.toLowerCase()).includes((order.status || '').toLowerCase())) {
        return NextResponse.json(
          { error: `Order cannot be rejected — current status: ${order.status}` },
          { status: 400 },
        );
      }

      const { error: updateErr } = await supabaseAdmin
        .from('spf_orders')
        .update({ status: 'REJECTED', updated_at: now })
        .eq('id', orderId);

      if (updateErr) {
        return NextResponse.json({ error: 'Failed to reject order' }, { status: 500 });
      }

      await supabaseAdmin.from('spf_order_status_history').insert({
        order_id:    orderId,
        from_status: order.status,
        to_status:   'REJECTED',
        actor_type:  'SELLER',
        actor_id:    sellerId,
        note:        `Seller rejected the order. Reason: ${reason.trim()}`,
        created_at:  now,
      });

      // Notify customer — fire and forget
      void (async () => {
        try {
          const { data: customer } = await supabaseAdmin
            .from('spf_users')
            .select('email')
            .eq('id', order.customer_id)
            .maybeSingle();

          if (customer?.email) {
            const total     = (Number(order.subtotal || 0) + Number(order.shipping_charge || 0));
            const isPrepaid = (order.payment_method || '').toUpperCase() !== 'COD';
            await notifyCustomerOrderRejected(
              customer.email,
              order.order_number,
              reason.trim(),
              isPrepaid,
              total,
            );
          }
        } catch (e: any) {
          console.error('[Order PUT] Rejection notification error:', e?.message);
        }
      })();
    }

    // ── CANCEL (seller-initiated) ──────────────────────────────────────────────
    if (status === 'cancelled') {
      const cancellable = ['CONFIRMED', 'SELLER_NOTIFIED', 'ACCEPTED', 'captured'];
      if (!cancellable.map(s => s.toLowerCase()).includes((order.status || '').toLowerCase())) {
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
        order_id:    orderId,
        from_status: order.status,
        to_status:   'CANCELLED',
        actor_type:  'SELLER',
        actor_id:    sellerId,
        note:        reason?.trim() ? `Seller cancelled the order. Reason: ${reason.trim()}` : 'Seller cancelled the order',
        created_at:  now,
      });
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error('[Order PUT] Error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
