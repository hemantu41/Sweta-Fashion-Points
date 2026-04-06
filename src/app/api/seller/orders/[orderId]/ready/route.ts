/**
 * POST /api/seller/orders/[orderId]/ready
 * Seller marks order ready to ship: PACKED → READY_TO_SHIP
 * Triggers Shiprocket pickup scheduling on the backend.
 * Body: { sellerId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createShiprocketOrder } from '@/lib/shiprocket/orders';

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
      select: { status: true, sellerId: true, awbNumber: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.sellerId !== sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (order.status !== 'PACKED') {
      return NextResponse.json(
        { error: `Order is not in PACKED state — current status: ${order.status}` },
        { status: 400 },
      );
    }

    // Update status to READY_TO_SHIP
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data:  {
          status:   'READY_TO_SHIP' as any,
          readyAt:  new Date(),
        },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: 'PACKED'        as any,
          toStatus:   'READY_TO_SHIP' as any,
          actorType:  'SELLER',
          actorId:    sellerId,
          note:       'Seller marked order ready to ship',
        },
      }),
    ]);

    // Fire-and-forget: push to Shiprocket for pickup scheduling
    // (Only if AWB not already assigned)
    if (!order.awbNumber) {
      createShiprocketOrder(orderId).catch(err => {
        console.error(`[seller/ready] Shiprocket push failed for ${orderId}:`, err?.message);
      });
    }

    return NextResponse.json({
      ok:      true,
      message: 'Pickup scheduled. Courier will arrive by tomorrow.',
    });
  } catch (err: any) {
    console.error('[seller/orders/ready] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
