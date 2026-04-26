/**
 * POST /api/orders/[id]/cancel
 * Body: { customerId: string, reason: string }
 *
 * Customer-initiated order cancellation.
 *
 * Business rules:
 * - Customer can cancel ONLY before the order is handed to the courier.
 * - Cancellable statuses: captured, SELLER_NOTIFIED, CONFIRMED, ACCEPTED, LABEL_GENERATED
 * - NOT cancellable once status is PACKED, READY_TO_SHIP, shipped, out_for_delivery, delivered
 * - Reason is required and stored in spf_order_status_history for seller & admin reference.
 * - Customer receives a cancellation confirmation email.
 * - Seller receives a notification to stop packing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  notifyCustomerSelfCancelled,
  notifySellerCustomerCancelled,
} from '@/lib/notifications/sellerNotify';

// Statuses where the courier has already been engaged — no cancellation allowed
const NON_CANCELLABLE = ['packed', 'PACKED', 'ready_to_ship', 'READY_TO_SHIP', 'shipped', 'SHIPPED', 'out_for_delivery', 'OUT_FOR_DELIVERY', 'delivered', 'DELIVERED'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const { customerId, reason } = body as { customerId?: string; reason?: string };

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }
    if (!reason?.trim()) {
      return NextResponse.json({ error: 'A cancellation reason is required' }, { status: 400 });
    }

    // Fetch order with seller info
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('spf_orders')
      .select(`
        id, order_number, status, customer_id, seller_id,
        subtotal, shipping_charge, payment_method
      `)
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify the customer owns this order
    if (order.customer_id !== customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Business rule: cannot cancel once courier has been engaged
    const currentStatus = order.status || 'captured';
    if (NON_CANCELLABLE.includes(currentStatus)) {
      return NextResponse.json(
        {
          error: `Your order cannot be cancelled at this stage (${currentStatus}). The parcel has already been handed to the courier. Please raise a return request after delivery.`,
          cancellable: false,
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update order status
    const { error: updateErr } = await supabaseAdmin
      .from('spf_orders')
      .update({ status: 'CANCELLED', updated_at: now })
      .eq('id', orderId);

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }

    // Record in history
    await supabaseAdmin.from('spf_order_status_history').insert({
      order_id:    orderId,
      from_status: currentStatus,
      to_status:   'CANCELLED',
      actor_type:  'CUSTOMER',
      actor_id:    customerId,
      note:        `Customer cancelled the order. Reason: ${reason.trim()}`,
      created_at:  now,
    });

    // Fire notifications (non-blocking)
    void (async () => {
      try {
        const total     = (Number(order.subtotal || 0) + Number(order.shipping_charge || 0));
        const isPrepaid = (order.payment_method || '').toUpperCase() !== 'COD';

        // Fetch customer email
        const { data: customer } = await supabaseAdmin
          .from('spf_users')
          .select('email')
          .eq('id', customerId)
          .maybeSingle();

        // Fetch seller email & business name
        const { data: seller } = await supabaseAdmin
          .from('spf_sellers')
          .select('business_email, business_name')
          .eq('id', order.seller_id)
          .maybeSingle();

        await Promise.allSettled([
          customer?.email
            ? notifyCustomerSelfCancelled(customer.email, order.order_number, reason.trim(), isPrepaid, total)
            : Promise.resolve(),
          seller?.business_email
            ? notifySellerCustomerCancelled(seller.business_email, seller.business_name, order.order_number, reason.trim())
            : Promise.resolve(),
        ]);
      } catch (e: any) {
        console.error('[cancel] Notification error:', e?.message);
      }
    })();

    return NextResponse.json({
      success:     true,
      message:     'Order cancelled successfully.',
      cancellable: true,
    });
  } catch (err: any) {
    console.error('[cancel POST] Error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong: ' + err?.message }, { status: 500 });
  }
}
