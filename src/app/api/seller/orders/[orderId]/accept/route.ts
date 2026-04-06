/**
 * POST /api/seller/orders/[orderId]/accept
 * Seller accepts an order: SELLER_NOTIFIED → ACCEPTED
 * Resets packing SLA deadline to now + 4 hours.
 * Body: { sellerId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const PACKING_SLA_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const body        = await request.json().catch(() => ({}));
    const { sellerId } = body as { sellerId?: string };

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where:  { id: orderId },
      select: { status: true, sellerId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.sellerId !== sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (order.status !== 'SELLER_NOTIFIED') {
      return NextResponse.json(
        { error: `Order cannot be accepted — current status: ${order.status}` },
        { status: 400 },
      );
    }

    const now               = new Date();
    const packingSlaDeadline = new Date(now.getTime() + PACKING_SLA_MS);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data:  {
          status:              'ACCEPTED' as any,
          sellerAcceptedAt:    now,
          packingSlaDeadline,
        },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: 'SELLER_NOTIFIED' as any,
          toStatus:   'ACCEPTED'         as any,
          actorType:  'SELLER',
          actorId:    sellerId,
          note:       'Seller accepted the order',
        },
      }),
    ]);

    return NextResponse.json({
      ok:               true,
      packingSlaDeadline: packingSlaDeadline.toISOString(),
    });
  } catch (err: any) {
    console.error('[seller/orders/accept] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
