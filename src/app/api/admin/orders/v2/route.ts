/**
 * GET /api/admin/orders/v2
 * Admin orders list — Prisma-based (spf_orders table).
 *
 * Query params:
 *   tab      all | pending | accepted | ready | in-transit | delivered | sla-breach | flagged
 *   search   order number substring
 *   page     1-based page number (default 1)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Prisma } from '@prisma/client';

const PAGE_SIZE = 20;

function tabWhere(tab: string, now: Date): Prisma.OrderWhereInput {
  const warnCutoff = new Date(now.getTime() + 30 * 60 * 1000); // now + 30 min
  switch (tab) {
    case 'pending':
      return { status: { in: ['CONFIRMED', 'SELLER_NOTIFIED'] as any } };
    case 'accepted':
      return { status: 'ACCEPTED' as any };
    case 'ready':
      return { status: { in: ['PACKED', 'READY_TO_SHIP', 'PICKUP_SCHEDULED'] as any } };
    case 'in-transit':
      return { status: { in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'] as any } };
    case 'delivered':
      return { status: 'DELIVERED' as any };
    case 'sla-breach':
      return {
        OR: [
          { status: 'SELLER_NOTIFIED' as any, acceptanceSlaDeadline: { lte: now } },
          { status: 'ACCEPTED' as any,        packingSlaDeadline:    { lte: now } },
        ],
      };
    case 'sla-at-risk':
      return {
        OR: [
          { status: 'SELLER_NOTIFIED' as any, acceptanceSlaDeadline: { gt: now, lte: warnCutoff } },
          { status: 'ACCEPTED' as any,        packingSlaDeadline:    { gt: now, lte: warnCutoff } },
        ],
      };
    case 'flagged':
      return { riskStatus: { in: ['HOLD', 'SOFT_FLAG'] as any } };
    default:
      return {};
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab    = searchParams.get('tab')  ?? 'all';
    const search = (searchParams.get('search') ?? '').trim();
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const now    = new Date();

    const where: Prisma.OrderWhereInput = {
      ...tabWhere(tab, now),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: 'insensitive' } },
              { customerId:  { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * PAGE_SIZE,
        take:    PAGE_SIZE,
        select: {
          id:                    true,
          orderNumber:           true,
          status:                true,
          riskStatus:            true,
          riskScore:             true,
          customerId:            true,
          sellerId:              true,
          paymentMethod:         true,
          subtotal:              true,
          shippingCharge:        true,
          acceptanceSlaDeadline: true,
          packingSlaDeadline:    true,
          awbNumber:             true,
          courierPartner:        true,
          createdAt:             true,
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    // Batch-fetch customer names from Supabase
    const customerIds = [...new Set(orders.map(o => o.customerId))];
    const { data: customers } = await supabaseAdmin
      .from('spf_users')
      .select('id, full_name, email')
      .in('id', customerIds.length ? customerIds : ['__none__']);

    const customerMap = new Map((customers ?? []).map((c: any) => [c.id, c]));

    const rows = orders.map(o => ({
      id:                    o.id,
      orderNumber:           o.orderNumber,
      status:                o.status,
      riskStatus:            o.riskStatus,
      riskScore:             o.riskScore,
      customerId:            o.customerId,
      customerName:          customerMap.get(o.customerId)?.full_name ?? '—',
      customerEmail:         customerMap.get(o.customerId)?.email ?? '—',
      paymentMethod:         o.paymentMethod,
      subtotal:              Number(o.subtotal),
      shippingCharge:        Number(o.shippingCharge),
      total:                 Number(o.subtotal) + Number(o.shippingCharge),
      acceptanceSlaDeadline: o.acceptanceSlaDeadline,
      packingSlaDeadline:    o.packingSlaDeadline,
      awbNumber:             o.awbNumber,
      courierPartner:        o.courierPartner,
      createdAt:             o.createdAt,
      itemCount:             o._count.items,
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
