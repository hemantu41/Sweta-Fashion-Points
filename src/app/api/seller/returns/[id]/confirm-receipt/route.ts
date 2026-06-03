/**
 * POST /api/seller/returns/[id]/confirm-receipt
 * Body: { sellerId, receivedCondition, notes? }
 *
 * Seller confirms they received the returned product.
 * receivedCondition: 'good' | 'damaged' | 'wrong_item'
 *
 * Flow:
 *  1. Validate return request is RETURN_SHIPPED and belongs to this seller
 *  2. Update status → RETURN_RECEIVED, record condition + timestamp
 *  3. Update order status → RETURN_RECEIVED
 *  4. Notify customer that return received, refund is being processed
 *  5. Notify admin to trigger refund (via email)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const VALID_CONDITIONS = ['good', 'damaged', 'wrong_item'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: returnRequestId } = await params;
    const body = await request.json().catch(() => ({}));
    const { sellerId, receivedCondition, notes } = body as {
      sellerId?:          string;
      receivedCondition?: string;
      notes?:             string;
    };

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId is required' }, { status: 400 });
    }
    if (!receivedCondition || !VALID_CONDITIONS.includes(receivedCondition)) {
      return NextResponse.json(
        { error: `receivedCondition must be one of: ${VALID_CONDITIONS.join(', ')}` },
        { status: 400 },
      );
    }

    // Fetch the return request
    const { data: returnReq, error: fetchErr } = await supabaseAdmin
      .from('spf_return_requests')
      .select(`
        id, order_id, customer_id, seller_id, status,
        reverse_awb, reverse_courier,
        spf_orders ( order_number, subtotal, shipping_charge, payment_method )
      `)
      .eq('id', returnRequestId)
      .single();

    if (fetchErr || !returnReq) {
      return NextResponse.json({ error: 'Return request not found.' }, { status: 404 });
    }

    const rr = returnReq as any;

    // Seller ownership check
    if (rr.seller_id !== sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Must be RETURN_SHIPPED for seller to confirm receipt
    if (rr.status !== 'RETURN_SHIPPED') {
      return NextResponse.json(
        { error: `Cannot confirm receipt. Return status is "${rr.status}" — expected RETURN_SHIPPED.` },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    // Update return request
    const { error: updateErr } = await supabaseAdmin
      .from('spf_return_requests')
      .update({
        status:               'RETURN_RECEIVED',
        seller_received_at:   now,
        received_condition:   receivedCondition,
        seller_receive_notes: notes?.trim() || null,
        seller_verified:      true,
        updated_at:           now,
      })
      .eq('id', returnRequestId);

    if (updateErr) {
      console.error('[confirm-receipt] update error:', updateErr.message);
      return NextResponse.json({ error: 'Failed to confirm receipt.' }, { status: 500 });
    }

    // Fire-and-forget: status history + order update + notifications
    void (async () => {
      try {
        const order = rr.spf_orders as any;

        // Status history
        await supabaseAdmin.from('spf_order_status_history').insert({
          order_id:    rr.order_id,
          from_status: 'RETURN_SHIPPED',
          to_status:   'RETURN_RECEIVED',
          actor_type:  'SELLER',
          actor_id:    sellerId,
          note:        `Seller confirmed return received. Condition: ${receivedCondition}${notes?.trim() ? ` — ${notes.trim()}` : ''}`,
          created_at:  now,
        });

        // Update order status
        await supabaseAdmin
          .from('spf_orders')
          .update({ status: 'RETURN_RECEIVED', updated_at: now })
          .eq('id', rr.order_id);

        // Reverse seller earnings — mark as returned
        if (order?.order_number) {
          await supabaseAdmin
            .from('spf_seller_earnings')
            .update({ payment_status: 'returned', updated_at: now })
            .eq('order_number', order.order_number)
            .eq('seller_id', sellerId);
        }

        // Notify customer — return received, refund coming
        const { data: customer } = await supabaseAdmin
          .from('spf_users')
          .select('email')
          .eq('id', rr.customer_id)
          .maybeSingle();

        if (customer?.email) {
          const orderTotal = Number(order?.subtotal || 0) + Number(order?.shipping_charge || 0);
          const isPrepaid  = (order?.payment_method || '').toUpperCase() !== 'COD';
          const { notifyCustomerReturnReceived } = await import('@/lib/notifications/sellerNotify');
          await notifyCustomerReturnReceived(
            customer.email,
            order?.order_number || '',
            isPrepaid,
            orderTotal,
          );
        }
      } catch (e: any) {
        console.error('[confirm-receipt] background error:', e?.message);
      }
    })();

    return NextResponse.json({
      success: true,
      message: 'Return receipt confirmed. The customer has been notified and refund will be processed by the admin.',
      data: {
        status:             'RETURN_RECEIVED',
        receivedCondition,
        sellerReceivedAt:   now,
      },
    });
  } catch (err: any) {
    console.error('[confirm-receipt] error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
