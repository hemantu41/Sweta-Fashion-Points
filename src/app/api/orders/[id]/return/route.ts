/**
 * POST /api/orders/[id]/return
 * Body: { customerId, reasonCategory, reasonDetail?, itemCondition? }
 *
 * Customer-initiated return request.
 *
 * Business rules:
 * - Only delivered orders can be returned (status = 'DELIVERED' or 'delivered')
 * - Return must be within the 7-day window (return_window_closes_at)
 * - One return request per order (DB unique constraint)
 * - Creates a row in spf_return_requests, appends status history
 * - Notifications to customer + seller are fire-and-forget (non-blocking)
 *
 * Performance target: ≤ 50 ms  (all slow work is fire-and-forget)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const VALID_CATEGORIES = [
  'damaged',
  'wrong_item',
  'size_issue',
  'quality_issue',
  'not_as_described',
  'changed_mind',
  'other',
];

const VALID_CONDITIONS = ['unopened', 'opened_unused', 'used', 'damaged'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const t0 = Date.now();
  try {
    const { id: orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const { customerId, reasonCategory, reasonDetail, itemCondition } = body as {
      customerId?: string;
      reasonCategory?: string;
      reasonDetail?: string;
      itemCondition?: string;
    };

    // ── Fast validation (no DB) ───────────────────────────────────────────────
    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }
    if (!reasonCategory || !VALID_CATEGORIES.includes(reasonCategory)) {
      return NextResponse.json(
        { error: `reasonCategory must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 },
      );
    }
    if (itemCondition && !VALID_CONDITIONS.includes(itemCondition)) {
      return NextResponse.json(
        { error: `itemCondition must be one of: ${VALID_CONDITIONS.join(', ')}` },
        { status: 400 },
      );
    }

    // ── Single DB read: order + return window ─────────────────────────────────
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('spf_orders')
      .select('id, order_number, status, customer_id, seller_id, return_window_closes_at, payment_method, subtotal, shipping_charge')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Ownership check
    if (order.customer_id !== customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Must be delivered
    const status = (order.status || '').toUpperCase();
    if (status !== 'DELIVERED') {
      return NextResponse.json(
        { error: 'Returns can only be requested for delivered orders.' },
        { status: 400 },
      );
    }

    // Enforce 7-day return window
    if (order.return_window_closes_at) {
      const windowEnd = new Date(order.return_window_closes_at);
      if (Date.now() > windowEnd.getTime()) {
        const closedOn = windowEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        return NextResponse.json(
          { error: `The 7-day return window for this order closed on ${closedOn}. Returns are no longer accepted.` },
          { status: 400 },
        );
      }
    }

    // ── Insert return request (critical path — we await this) ─────────────────
    const { data: returnRequest, error: insertErr } = await supabaseAdmin
      .from('spf_return_requests')
      .insert({
        order_id:        orderId,
        customer_id:     customerId,
        seller_id:       order.seller_id,
        return_type:     'CUSTOMER_RETURN',
        reason_category: reasonCategory,
        reason_detail:   reasonDetail?.trim() || null,
        item_condition:  itemCondition || null,
        status:          'PENDING',
      })
      .select('id')
      .single();

    if (insertErr) {
      // Unique constraint violation = duplicate request
      if (insertErr.code === '23505') {
        return NextResponse.json(
          { error: 'A return request for this order has already been submitted. Our team will review it shortly.' },
          { status: 409 },
        );
      }
      console.error('[return] insert error:', insertErr.message);
      return NextResponse.json({ error: 'Failed to submit return request. Please try again.' }, { status: 500 });
    }

    // ── Fire-and-forget: status history + order status update + notifications ─
    void (async () => {
      try {
        const now = new Date().toISOString();

        // Append to order status history
        await supabaseAdmin.from('spf_order_status_history').insert({
          order_id:    orderId,
          from_status: order.status,
          to_status:   'RETURN_INITIATED',
          actor_type:  'CUSTOMER',
          actor_id:    customerId,
          note:        `Customer requested return. Reason: ${reasonCategory}${reasonDetail ? ` — ${reasonDetail.trim()}` : ''}`,
          created_at:  now,
        });

        // Update order status to RETURN_INITIATED
        await supabaseAdmin
          .from('spf_orders')
          .update({ status: 'RETURN_INITIATED', updated_at: now })
          .eq('id', orderId);

        // Fetch emails for notifications
        const [{ data: customer }, { data: seller }] = await Promise.all([
          supabaseAdmin.from('spf_users').select('email, name').eq('id', customerId).maybeSingle(),
          supabaseAdmin.from('spf_sellers').select('business_email, business_name').eq('id', order.seller_id).maybeSingle(),
        ]);

        const { notifyCustomerReturnInitiated, notifySellerReturnInitiated } = await import('@/lib/notifications/sellerNotify');
        const total = Number(order.subtotal || 0) + Number(order.shipping_charge || 0);
        const isPrepaid = (order.payment_method || '').toUpperCase() !== 'COD';

        await Promise.allSettled([
          customer?.email
            ? notifyCustomerReturnInitiated(customer.email, order.order_number, reasonCategory, isPrepaid, total)
            : Promise.resolve(),
          seller?.business_email
            ? notifySellerReturnInitiated(seller.business_email, seller.business_name, order.order_number, reasonCategory)
            : Promise.resolve(),
        ]);
      } catch (e: any) {
        console.error('[return] background tasks error:', e?.message);
      }
    })();

    console.log(`[return] request created in ${Date.now() - t0}ms`);

    return NextResponse.json({
      success:        true,
      returnRequestId: returnRequest.id,
      message:        'Return request submitted successfully. Our team will review it within 24–48 hours.',
    });
  } catch (err: any) {
    console.error('[return POST] Error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
