/**
 * POST /api/admin/returns/[id]/refund
 * Body: { refundAmount?: number }  — amount in rupees (not paise).
 *                                    Defaults to full order total if omitted.
 *
 * Triggers a Razorpay refund for an approved prepaid return request.
 *
 * Flow:
 *  1. Fetch the return request — must be APPROVED, not already refunded
 *  2. Fetch the linked spf_order to get transaction_id (razorpay payment_id)
 *  3. Call Razorpay POST /v1/payments/{payment_id}/refund  (amount in paise)
 *  4. Store razorpay_refund_id + update status to REFUND_INITIATED
 *  5. Fire-and-forget: notify customer via email
 *
 * Note: COD orders cannot be refunded via Razorpay.
 */

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: returnRequestId } = await params;
    const body = await request.json().catch(() => ({}));
    const { refundAmount } = body as { refundAmount?: number };

    // Validate Razorpay credentials
    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    console.log('[return/refund] keyId prefix:', keyId?.slice(0, 8), '| keySecret present:', !!keySecret);
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay credentials not configured.' }, { status: 500 });
    }

    // Fetch return request
    const { data: returnReq, error: fetchErr } = await supabaseAdmin
      .from('spf_return_requests')
      .select('id, order_id, customer_id, status, refund_status, razorpay_refund_id')
      .eq('id', returnRequestId)
      .single();

    if (fetchErr || !returnReq) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    const rr = returnReq as any;

    // Must be APPROVED
    if (rr.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Return must be APPROVED before issuing a refund. Current status: ${rr.status}` },
        { status: 400 },
      );
    }

    // Prevent double-refund
    if (rr.razorpay_refund_id) {
      return NextResponse.json(
        { error: `Refund already initiated. Razorpay refund ID: ${rr.razorpay_refund_id}` },
        { status: 409 },
      );
    }

    // Fetch the linked order for payment details
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('spf_orders')
      .select('id, order_number, transaction_id, payment_method, subtotal, shipping_charge, customer_id')
      .eq('id', rr.order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const o = order as any;

    // COD orders cannot be refunded via Razorpay
    if ((o.payment_method || '').toUpperCase() === 'COD') {
      return NextResponse.json(
        { error: 'COD orders cannot be refunded via Razorpay. Please process the refund manually.' },
        { status: 400 },
      );
    }

    if (!o.transaction_id) {
      return NextResponse.json(
        { error: 'No Razorpay payment ID found for this order. Cannot process refund.' },
        { status: 400 },
      );
    }

    // Calculate amount
    const orderTotal    = Number(o.subtotal || 0) + Number(o.shipping_charge || 0);
    const amountRupees  = refundAmount && refundAmount > 0 ? Math.min(refundAmount, orderTotal) : orderTotal;
    const amountPaise   = Math.round(amountRupees * 100);

    // Call Razorpay using the SDK (same as other payment routes)
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    let rzRefund: any;
    try {
      rzRefund = await razorpay.payments.refund(o.transaction_id, { amount: amountPaise });
    } catch (rzErr: any) {
      const msg = rzErr?.error?.description || rzErr?.message || 'Razorpay refund failed';
      console.error('[return/refund] Razorpay error:', msg);
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const now = new Date().toISOString();

    // Update return request with refund info
    await supabaseAdmin
      .from('spf_return_requests')
      .update({
        status:              'REFUND_INITIATED',
        refund_amount:       amountRupees,
        razorpay_refund_id:  rzRefund.id,
        refund_status:       'initiated',
        refund_initiated_at: now,
        updated_at:          now,
      })
      .eq('id', returnRequestId);

    // Fire-and-forget: notify customer
    void (async () => {
      try {
        const { data: customer } = await supabaseAdmin
          .from('spf_users')
          .select('email')
          .eq('id', rr.customer_id)
          .maybeSingle();

        if (customer?.email) {
          const { notifyCustomerRefundProcessed } = await import('@/lib/notifications/sellerNotify');
          await notifyCustomerRefundProcessed(customer.email, o.order_number, amountRupees, rzRefund.id);
        }
      } catch (e: any) {
        console.error('[return/refund] notification error:', e?.message);
      }
    })();

    return NextResponse.json({
      success:          true,
      razorpayRefundId: rzRefund.id,
      refundAmount:     amountRupees,
      message:          `Refund of ₹${amountRupees.toLocaleString('en-IN')} initiated. Razorpay refund ID: ${rzRefund.id}`,
    });
  } catch (err: any) {
    console.error('[return/refund] error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
