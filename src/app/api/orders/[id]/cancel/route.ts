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
import Razorpay from 'razorpay';
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
        subtotal, shipping_charge, payment_method, transaction_id
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

    const isPrepaid   = (order.payment_method || '').toUpperCase() !== 'COD';
    const orderTotal  = Number(order.subtotal || 0) + Number(order.shipping_charge || 0);
    const amountPaise = Math.round(orderTotal * 100);

    // ── Trigger Razorpay refund for prepaid orders ─────────────────────────────
    // Policy: full refund (subtotal + shipping) for ANY cancellable status —
    // the courier has not picked up the parcel yet at any of these stages.
    let razorpayRefundId: string | null = null;
    let refundError:      string | null = null;

    if (isPrepaid && (order as any).transaction_id && amountPaise > 0) {
      const keyId     = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (keyId && keySecret) {
        try {
          const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
          const rzRefund = await razorpay.payments.refund((order as any).transaction_id, {
            amount: amountPaise,
          });
          razorpayRefundId = rzRefund.id;
          console.log(`[Order Cancel] Refund initiated: ${rzRefund.id} for order ${order.order_number}`);
        } catch (rzErr: any) {
          refundError = rzErr?.error?.description || rzErr?.message || 'Razorpay refund failed';
          console.error('[Order Cancel] Razorpay refund error:', refundError);
        }
      } else {
        refundError = 'Razorpay credentials not configured';
        console.error('[Order Cancel] Cannot refund — Razorpay keys missing');
      }
    }

    // Update order status (+ payment_status on refund success)
    const orderUpdate: Record<string, unknown> = { status: 'CANCELLED', updated_at: now };
    if (razorpayRefundId) orderUpdate.payment_status = 'refund_initiated';

    const { error: updateErr } = await supabaseAdmin
      .from('spf_orders')
      .update(orderUpdate)
      .eq('id', orderId);

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }

    const historyNote = razorpayRefundId
      ? `Customer cancelled the order. Reason: ${reason.trim()}. Refund initiated (${razorpayRefundId}).`
      : refundError
        ? `Customer cancelled the order. Reason: ${reason.trim()}. Refund could not be auto-initiated: ${refundError}.`
        : `Customer cancelled the order. Reason: ${reason.trim()}.`;

    // Record in history
    await supabaseAdmin.from('spf_order_status_history').insert({
      order_id:    orderId,
      from_status: currentStatus,
      to_status:   'CANCELLED',
      actor_type:  'CUSTOMER',
      actor_id:    customerId,
      note:        historyNote,
      created_at:  now,
    });

    // Fire notifications (non-blocking)
    void (async () => {
      try {
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
            ? notifyCustomerSelfCancelled(customer.email, order.order_number, reason.trim(), isPrepaid, orderTotal, razorpayRefundId)
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
      success:       true,
      message:       'Order cancelled successfully.',
      cancellable:   true,
      refundWarning: isPrepaid && !razorpayRefundId
        ? (refundError || 'Refund could not be initiated automatically. Our team will process it manually.')
        : undefined,
    });
  } catch (err: any) {
    console.error('[cancel POST] Error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong: ' + err?.message }, { status: 500 });
  }
}
