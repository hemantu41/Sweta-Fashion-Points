/**
 * POST /api/admin/returns/[id]/review
 * Body: { action: 'approve' | 'reject', adminNotes?: string, sellerVerified?: boolean, reviewerId }
 *
 * Admin reviews a return request:
 * - Sets status to APPROVED or REJECTED
 * - Records reviewer, notes, seller_verified flag
 * - Fire-and-forget: email notifications to customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: returnRequestId } = await params;
    const body = await request.json().catch(() => ({}));
    const { action, adminNotes, sellerVerified, reviewerId } = body as {
      action?: string;
      adminNotes?: string;
      sellerVerified?: boolean;
      reviewerId?: string;
    };

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
    }

    // Fetch return request
    const { data: returnReq, error: fetchErr } = await supabaseAdmin
      .from('spf_return_requests')
      .select('id, order_id, customer_id, seller_id, status, reason_category, spf_orders(order_number, subtotal, shipping_charge, payment_method)')
      .eq('id', returnRequestId)
      .single();

    if (fetchErr || !returnReq) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    const rr = returnReq as any;

    // Only PENDING or UNDER_REVIEW can be reviewed
    if (!['PENDING', 'UNDER_REVIEW'].includes(rr.status)) {
      return NextResponse.json(
        { error: `Cannot review a return request with status "${rr.status}".` },
        { status: 400 },
      );
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const now = new Date().toISOString();

    // Update the return request
    const { error: updateErr } = await supabaseAdmin
      .from('spf_return_requests')
      .update({
        status:          newStatus,
        admin_notes:     adminNotes?.trim() || null,
        seller_verified: sellerVerified ?? false,
        reviewed_by:     reviewerId || null,
        reviewed_at:     now,
        updated_at:      now,
      })
      .eq('id', returnRequestId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Fire-and-forget background work
    void (async () => {
      try {
        // Update order status if rejected
        if (action === 'reject') {
          await supabaseAdmin
            .from('spf_orders')
            .update({ status: 'DELIVERED', updated_at: now })
            .eq('id', rr.order_id);
        }

        // Notify customer by email
        const { data: customer } = await supabaseAdmin
          .from('spf_users')
          .select('email')
          .eq('id', rr.customer_id)
          .maybeSingle();

        if (customer?.email) {
          const order = rr.spf_orders as any;
          const orderTotal = Number(order?.subtotal || 0) + Number(order?.shipping_charge || 0);
          const isPrepaid = (order?.payment_method || '').toUpperCase() !== 'COD';

          const { notifyCustomerReturnApproved, notifyCustomerReturnRejected } = await import('@/lib/notifications/sellerNotify');

          if (action === 'approve') {
            await notifyCustomerReturnApproved(customer.email, order?.order_number || '', isPrepaid, orderTotal);
          } else {
            await notifyCustomerReturnRejected(customer.email, order?.order_number || '', adminNotes?.trim() || '');
          }
        }
      } catch (e: any) {
        console.error('[return/review] background error:', e?.message);
      }
    })();

    return NextResponse.json({
      success: true,
      status:  newStatus,
      message: action === 'approve'
        ? 'Return request approved. Customer has been notified.'
        : 'Return request rejected. Customer has been notified.',
    });
  } catch (err: any) {
    console.error('[return/review] error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
