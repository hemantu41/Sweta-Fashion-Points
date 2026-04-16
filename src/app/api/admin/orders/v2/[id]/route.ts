/**
 * GET /api/admin/orders/v2/[id]
 * Full order detail for the admin drawer — includes items, history, risk flags, payout.
 * Uses Supabase directly (no Prisma/DATABASE_URL needed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data: order, error } = await supabaseAdmin
      .from('spf_orders')
      .select(`
        id, order_number, status, risk_status, risk_score,
        customer_id, seller_id, payment_method, payment_status,
        subtotal, shipping_charge, platform_fee, pg_fee, seller_payout_amount,
        shipping_address, awb_number, courier_partner, tracking_url,
        notes, acceptance_sla_deadline, packing_sla_deadline,
        created_at, updated_at,
        spf_order_items(
          id, product_id, product_name, quantity, unit_price, total_price, sku, variant_details
        ),
        spf_order_status_history(
          id, from_status, to_status, actor_type, actor_id, note, created_at
        ),
        spf_order_risk_flags(
          id, flag_type, flag_value, score_contribution, created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch customer + seller info from Supabase
    const [{ data: customer }, { data: seller }] = await Promise.all([
      supabaseAdmin
        .from('spf_users')
        .select('full_name, email, mobile')
        .eq('id', (order as any).customer_id)
        .maybeSingle(),
      supabaseAdmin
        .from('spf_sellers')
        .select('business_name, business_email, business_phone')
        .eq('id', (order as any).seller_id)
        .maybeSingle(),
    ]);

    const o = order as any;

    const statusHistory = (o.spf_order_status_history ?? [])
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((h: any) => ({
        id:         h.id,
        fromStatus: h.from_status,
        toStatus:   h.to_status,
        actorType:  h.actor_type,
        actorId:    h.actor_id,
        note:       h.note,
        createdAt:  h.created_at,
      }));

    const riskFlags = (o.spf_order_risk_flags ?? [])
      .map((f: any) => ({
        id:                f.id,
        flagType:          f.flag_type,
        flagValue:         f.flag_value,
        scoreContribution: f.score_contribution,
        createdAt:         f.created_at,
      }));

    return NextResponse.json({
      order: {
        id:                    o.id,
        orderNumber:           o.order_number,
        status:                o.status,
        riskStatus:            o.risk_status,
        riskScore:             o.risk_score ?? 0,
        customerId:            o.customer_id,
        sellerId:              o.seller_id,
        paymentMethod:         o.payment_method,
        subtotal:              Number(o.subtotal),
        shippingCharge:        Number(o.shipping_charge),
        platformFee:           Number(o.platform_fee   || 0),
        pgFee:                 Number(o.pg_fee         || 0),
        sellerPayoutAmount:    Number(o.seller_payout_amount || 0),
        shippingAddress:       o.shipping_address,
        awbNumber:             o.awb_number,
        courierPartner:        o.courier_partner,
        trackingUrl:           o.tracking_url,
        notes:                 o.notes,
        acceptanceSlaDeadline: o.acceptance_sla_deadline,
        packingSlaDeadline:    o.packing_sla_deadline,
        createdAt:             o.created_at,
        items: (o.spf_order_items ?? []).map((i: any) => ({
          id:             i.id,
          productName:    i.product_name,
          quantity:       i.quantity,
          unitPrice:      Number(i.unit_price),
          totalPrice:     Number(i.total_price),
          sku:            i.sku,
          variantDetails: i.variant_details,
        })),
        statusHistory,
        riskFlags,
        payout: null, // populated when seller payout data exists
        customerName:  (customer as any)?.full_name      ?? '—',
        customerEmail: (customer as any)?.email           ?? '—',
        customerPhone: (customer as any)?.mobile          ?? '—',
        sellerName:    (seller as any)?.business_name     ?? '—',
        sellerEmail:   (seller as any)?.business_email    ?? '—',
        sellerPhone:   (seller as any)?.business_phone    ?? '—',
      },
    });
  } catch (err: any) {
    console.error('[admin/orders/v2/[id]] GET error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
