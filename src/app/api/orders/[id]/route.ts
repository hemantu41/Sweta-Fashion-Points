/**
 * PUT /api/orders/[id]
 * Body: { status: 'accepted' | 'cancelled', sellerId: string }
 *
 * Called by the seller dashboard to accept or cancel an order.
 * Reads from / writes to spf_orders (Prisma).
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const PACKING_SLA_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const { status, sellerId } = body as { status?: string; sellerId?: string };

    if (!status || !sellerId) {
      return NextResponse.json(
        { error: 'status and sellerId are required' },
        { status: 400 },
      );
    }

    if (!['accepted', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition to status "${status}" via this endpoint` },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, sellerId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.sellerId !== sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate state transitions (using Prisma enum values)
    if (status === 'accepted') {
      if (order.status !== 'SELLER_NOTIFIED') {
        return NextResponse.json(
          { error: `Order cannot be accepted — current status: ${order.status}` },
          { status: 400 },
        );
      }
      const now = new Date();
      const packingSlaDeadline = new Date(now.getTime() + PACKING_SLA_MS);

      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: {
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
    }

    if (status === 'cancelled') {
      const cancellableStatuses = ['CONFIRMED', 'SELLER_NOTIFIED', 'ACCEPTED'];
      if (!cancellableStatuses.includes(order.status)) {
        return NextResponse.json(
          { error: `Order cannot be cancelled — current status: ${order.status}` },
          { status: 400 },
        );
      }
      const prevStatus = order.status;
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data:  { status: 'CANCELLED' as any },
        }),
        prisma.orderStatusHistory.create({
          data: {
            orderId,
            fromStatus: prevStatus as any,
            toStatus:   'CANCELLED' as any,
            actorType:  'SELLER',
            actorId:    sellerId,
            note:       'Seller cancelled the order',
          },
        }),
      ]);
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error('[Order Status PUT] Error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
