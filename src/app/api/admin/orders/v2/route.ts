/**
 * GET /api/admin/orders/v2
 * Admin orders list — Supabase-based (spf_orders table).
 *
 * Query params:
 *   tab      all | pending | accepted | ready | in-transit | delivered | sla-breach | sla-at-risk | flagged
 *   search   order number substring
 *   page     1-based page number (default 1)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const PAGE_SIZE = 20;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab    = searchParams.get('tab')  ?? 'all';
    const search = (searchParams.get('search') ?? '').trim();
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const now    = new Date().toISOString();
    const warnCutoff = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const offset = (page - 1) * PAGE_SIZE;

    // Build base queries
    let countQ = supabaseAdmin
      .from('spf_orders')
      .select('*', { count: 'exact', head: true });

    let dataQ = supabaseAdmin
      .from('spf_orders')
      .select(`
        id, order_number, status, risk_status, risk_score,
        customer_id, seller_id, payment_method, subtotal, shipping_charge,
        acceptance_sla_deadline, packing_sla_deadline,
        awb_number, courier_partner, created_at,
        spf_order_items(id)
      `);

    // Tab filtering
    switch (tab) {
      case 'pending':
        countQ = countQ.in('status', ['CONFIRMED', 'SELLER_NOTIFIED']);
        dataQ  = dataQ.in('status',  ['CONFIRMED', 'SELLER_NOTIFIED']);
        break;
      case 'accepted':
        countQ = countQ.eq('status', 'ACCEPTED');
        dataQ  = dataQ.eq('status',  'ACCEPTED');
        break;
      case 'ready':
        countQ = countQ.in('status', ['PACKED', 'READY_TO_SHIP', 'PICKUP_SCHEDULED']);
        dataQ  = dataQ.in('status',  ['PACKED', 'READY_TO_SHIP', 'PICKUP_SCHEDULED']);
        break;
      case 'in-transit':
        countQ = countQ.in('status', ['IN_TRANSIT', 'OUT_FOR_DELIVERY']);
        dataQ  = dataQ.in('status',  ['IN_TRANSIT', 'OUT_FOR_DELIVERY']);
        break;
      case 'delivered':
        countQ = countQ.eq('status', 'DELIVERED');
        dataQ  = dataQ.eq('status',  'DELIVERED');
        break;
      case 'sla-breach': {
        const f = `and(status.eq.SELLER_NOTIFIED,acceptance_sla_deadline.lte.${now}),and(status.eq.ACCEPTED,packing_sla_deadline.lte.${now})`;
        countQ = countQ.or(f);
        dataQ  = dataQ.or(f);
        break;
      }
      case 'sla-at-risk': {
        const f = `and(status.eq.SELLER_NOTIFIED,acceptance_sla_deadline.gt.${now},acceptance_sla_deadline.lte.${warnCutoff}),and(status.eq.ACCEPTED,packing_sla_deadline.gt.${now},packing_sla_deadline.lte.${warnCutoff})`;
        countQ = countQ.or(f);
        dataQ  = dataQ.or(f);
        break;
      }
      case 'flagged':
        countQ = countQ.in('risk_status', ['HOLD', 'SOFT_FLAG']);
        dataQ  = dataQ.in('risk_status',  ['HOLD', 'SOFT_FLAG']);
        break;
    }

    // Search filter
    if (search) {
      countQ = countQ.ilike('order_number', `%${search}%`);
      dataQ  = dataQ.ilike('order_number',  `%${search}%`);
    }

    // Execute in parallel
    const [countResult, dataResult] = await Promise.all([
      countQ,
      dataQ
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1),
    ]);

    if (dataResult.error) throw dataResult.error;

    const total  = countResult.count ?? 0;
    const orders = dataResult.data ?? [];

    // Batch-fetch customer names
    const customerIds = [...new Set(orders.map((o: any) => o.customer_id))].filter(Boolean);
    const { data: customers } = customerIds.length
      ? await supabaseAdmin.from('spf_users').select('id, full_name, email').in('id', customerIds)
      : { data: [] };

    const customerMap = new Map((customers ?? []).map((c: any) => [c.id, c]));

    const rows = orders.map((o: any) => ({
      id:                    o.id,
      orderNumber:           o.order_number,
      status:                o.status,
      riskStatus:            o.risk_status,
      riskScore:             o.risk_score ?? 0,
      customerId:            o.customer_id,
      customerName:          customerMap.get(o.customer_id)?.full_name ?? '—',
      customerEmail:         customerMap.get(o.customer_id)?.email ?? '—',
      paymentMethod:         o.payment_method,
      subtotal:              Number(o.subtotal),
      shippingCharge:        Number(o.shipping_charge),
      total:                 Number(o.subtotal) + Number(o.shipping_charge),
      acceptanceSlaDeadline: o.acceptance_sla_deadline,
      packingSlaDeadline:    o.packing_sla_deadline,
      awbNumber:             o.awb_number,
      courierPartner:        o.courier_partner,
      createdAt:             o.created_at,
      itemCount:             Array.isArray(o.spf_order_items) ? o.spf_order_items.length : 0,
    }));

    return NextResponse.json({
      orders: rows,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err: any) {
    console.error('[admin/orders/v2] GET error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
