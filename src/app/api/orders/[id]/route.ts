/**
 * GET  /api/orders/[id]  — full order detail: items + status history + return request
 * PUT  /api/orders/[id]  — accept / reject / cancel (seller dashboard)
 */

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyCustomerOrderRejected } from '@/lib/notifications/sellerNotify';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;

    const [orderRes, historyRes, returnRes] = await Promise.all([
      supabaseAdmin
        .from('spf_orders')
        .select(`
          id, order_number, status, subtotal, shipping_charge, payment_method,
          transaction_id, customer_id, seller_id, shipping_address,
          awb_number, courier_partner, tracking_url,
          created_at, updated_at, delivered_at, picked_up_at, packed_at,
          packing_sla_deadline,
          spf_order_items (
            id, product_id, seller_id, product_name,
            variant_details, sku, quantity, unit_price, total_price
          )
        `)
        .eq('id', orderId)
        .single(),
      supabaseAdmin
        .from('spf_order_status_history')
        .select('id, from_status, to_status, actor_type, note, created_at')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('spf_return_requests')
        .select('id, status, reverse_awb, reverse_courier, received_condition, refund_amount, razorpay_refund_id, created_at, updated_at')
        .eq('order_id', orderId)
        .maybeSingle(),
    ]);

    if (orderRes.error || !orderRes.data) {
      console.error('[Order GET] fetch error:', orderRes.error?.message);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const o = orderRes.data as any;

    // Fetch product images separately (not stored in spf_order_items)
    const productIds = (o.spf_order_items || []).map((i: any) => i.product_id).filter(Boolean);
    const productMap = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from('spf_productdetails')
        .select('id, main_image')
        .in('id', productIds);
      (products || []).forEach((p: any) => { if (p.main_image) productMap.set(p.id, p.main_image); });
    }

    // Normalise shipping_address → delivery_address (same shape as the list API)
    const sa = o.shipping_address || {};
    const delivery_address = {
      name:          sa.name          || '',
      phone:         sa.phone         || '',
      address_line1: sa.house         || sa.address_line1 || '',
      address_line2: sa.area          || sa.address_line2 || '',
      city:          sa.city          || '',
      state:         sa.state         || '',
      pincode:       sa.pincode       || '',
    };

    const items = (o.spf_order_items || []).map((item: any) => ({
      ...item,
      image_url: productMap.get(item.product_id) || null,
    }));

    return NextResponse.json({
      order:         { ...o, delivery_address, shipped_at: o.picked_up_at, spf_order_items: items },
      history:       historyRes.data || [],
      returnRequest: returnRes.data  || null,
    });
  } catch (err: any) {
    console.error('[Order GET] error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

const PACKING_SLA_MS = 24 * 60 * 60 * 1000; // 24 hours

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
      .select('id, status, seller_id, customer_id, order_number, subtotal, shipping_charge, payment_method, transaction_id')
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

      const isPrepaid   = (order.payment_method || '').toUpperCase() !== 'COD';
      const orderTotal  = Number(order.subtotal || 0) + Number(order.shipping_charge || 0);
      const amountPaise = Math.round(orderTotal * 100);

      // ── Trigger Razorpay refund for prepaid orders ───────────────────────────
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
            console.log(`[Order PUT] Refund initiated: ${rzRefund.id} for order ${order.order_number}`);
          } catch (rzErr: any) {
            refundError = rzErr?.error?.description || rzErr?.message || 'Razorpay refund failed';
            console.error('[Order PUT] Razorpay refund error:', refundError);
          }
        } else {
          refundError = 'Razorpay credentials not configured';
          console.error('[Order PUT] Cannot refund — Razorpay keys missing');
        }
      }

      // Update order: REJECTED + payment_status
      const orderUpdate: Record<string, unknown> = { status: 'REJECTED', updated_at: now };
      if (razorpayRefundId) orderUpdate.payment_status = 'refund_initiated';

      const { error: updateErr } = await supabaseAdmin
        .from('spf_orders')
        .update(orderUpdate)
        .eq('id', orderId);

      if (updateErr) {
        return NextResponse.json({ error: 'Failed to reject order' }, { status: 500 });
      }

      const historyNote = razorpayRefundId
        ? `Seller rejected the order. Reason: ${reason.trim()}. Refund initiated (${razorpayRefundId}).`
        : refundError
          ? `Seller rejected the order. Reason: ${reason.trim()}. Refund could not be auto-initiated: ${refundError}.`
          : `Seller rejected the order. Reason: ${reason.trim()}.`;

      await supabaseAdmin.from('spf_order_status_history').insert({
        order_id:    orderId,
        from_status: order.status,
        to_status:   'REJECTED',
        actor_type:  'SELLER',
        actor_id:    sellerId,
        note:        historyNote,
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
            await notifyCustomerOrderRejected(
              customer.email,
              order.order_number,
              reason.trim(),
              isPrepaid,
              orderTotal,
              razorpayRefundId,
            );
          }
        } catch (e: any) {
          console.error('[Order PUT] Rejection notification error:', e?.message);
        }
      })();

      // Surface refund failure in response so the seller UI can show a warning
      if (isPrepaid && !razorpayRefundId) {
        return NextResponse.json({
          success:      true,
          status,
          refundWarning: refundError || 'Refund could not be initiated automatically. Please trigger it manually from the admin panel.',
        });
      }
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
