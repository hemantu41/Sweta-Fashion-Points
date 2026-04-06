/**
 * GET /api/seller/orders
 * Seller-scoped order list + stats.
 *
 * Query params:
 *   sellerId  required — verified against order.seller_id
 *   tab       pending | accepted | ready | shipped | delivered | cancelled  (default: pending)
 *   page      1-based (default 1)
 *   stats     "true" → return tab counts only (for stats row)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

function tabWhere(tab: string, sellerId: string): Prisma.OrderWhereInput {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const base = { sellerId };
  switch (tab) {
    case 'pending':
      return { ...base, status: 'SELLER_NOTIFIED' as any };
    case 'accepted':
      return { ...base, status: 'ACCEPTED' as any };
    case 'ready':
      return { ...base, status: { in: ['PACKED', 'READY_TO_SHIP', 'PICKUP_SCHEDULED'] as any } };
    case 'shipped':
      return { ...base, status: { in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'] as any } };
    case 'delivered':
      return { ...base, status: 'DELIVERED' as any, deliveredAt: { gte: thirtyDaysAgo } };
    case 'cancelled':
      return { ...base, status: { in: ['CANCELLED', 'RETURN_INITIATED', 'RETURNED'] as any } };
    default:
      return base;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId') ?? '';
    const tab      = searchParams.get('tab') ?? 'pending';
    const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const wantStats = searchParams.get('stats') === 'true';

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId required' }, { status: 400 });
    }

    // ── Stats mode ────────────────────────────────────────────────────────────
    if (wantStats) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const [newOrders, pendingAction, packed, inTransit, deliveredMonth] =
        await Promise.all([
          prisma.order.count({ where: { sellerId, status: 'SELLER_NOTIFIED' as any } }),
          prisma.order.count({ where: { sellerId, status: { in: ['SELLER_NOTIFIED', 'ACCEPTED'] as any } } }),
          prisma.order.count({ where: { sellerId, status: { in: ['PACKED', 'READY_TO_SHIP', 'PICKUP_SCHEDULED'] as any } } }),
          prisma.order.count({ where: { sellerId, status: { in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'] as any } } }),
          prisma.order.count({ where: { sellerId, status: 'DELIVERED' as any, deliveredAt: { gte: thirtyDaysAgo } } }),
        ]);
      return NextResponse.json({ newOrders, pendingAction, packed, inTransit, deliveredMonth });
    }

    // ── List mode ─────────────────────────────────────────────────────────────
    const where = tabWhere(tab, sellerId);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * PAGE_SIZE,
        take:    PAGE_SIZE,
        include: {
          items: {
            select: {
              id: true, productId: true, productName: true,
              variantDetails: true, quantity: true,
              unitPrice: true, totalPrice: true, sku: true,
            },
          },
          payout: {
            select: { status: true, payoutDate: true, netPayout: true, grossAmount: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    // Fetch product images from Supabase in batch
    const productIds = [...new Set(orders.flatMap(o => o.items.map(i => i.productId)))];
    const { data: products } = await supabaseAdmin
      .from('spf_productdetails')
      .select('id, main_image')
      .in('id', productIds.length ? productIds : ['__none__']);

    const imgMap = new Map((products ?? []).map((p: any) => [p.id, p.main_image]));

    const rows = orders.map(o => {
      const addr = o.shippingAddress as any;
      return {
        id:                    o.id,
        orderNumber:           o.orderNumber,
        status:                o.status,
        riskStatus:            o.riskStatus,
        paymentMethod:         o.paymentMethod,
        subtotal:              Number(o.subtotal),
        shippingCharge:        Number(o.shippingCharge),
        total:                 Number(o.subtotal) + Number(o.shippingCharge),
        acceptanceSlaDeadline: o.acceptanceSlaDeadline,
        packingSlaDeadline:    o.packingSlaDeadline,
        deliveredAt:           o.deliveredAt,
        awbNumber:             o.awbNumber,
        courierPartner:        o.courierPartner,
        trackingUrl:           o.trackingUrl,
        createdAt:             o.createdAt,
        // Delivery city + pincode only (not full address for privacy)
        deliveryCity:    addr?.city    ?? '',
        deliveryPincode: addr?.pincode ?? '',
        items: o.items.map(i => ({
          id:             i.id,
          productId:      i.productId,
          productName:    i.productName,
          variantDetails: i.variantDetails,
          quantity:       i.quantity,
          unitPrice:      Number(i.unitPrice),
          totalPrice:     Number(i.totalPrice),
          sku:            i.sku,
          imageUrl:       imgMap.get(i.productId) ?? null,
        })),
        payout: o.payout
          ? {
              status:     o.payout.status,
              payoutDate: o.payout.payoutDate,
              netPayout:  Number(o.payout.netPayout),
              grossAmount:Number(o.payout.grossAmount),
            }
          : null,
      };
    });

    return NextResponse.json({
      orders: rows,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err: any) {
    console.error('[seller/orders] GET error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
