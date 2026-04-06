/**
 * POST /api/admin/orders/v2/[id]/nudge-seller
 * Sends an SLA warning email to the seller (bypasses Redis dedup guard).
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifySellerSlaWarning } from '@/lib/notifications/sellerNotify';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where:  { id },
      select: { status: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const NUDGEABLE = ['CONFIRMED', 'SELLER_NOTIFIED', 'ACCEPTED'];
    if (!NUDGEABLE.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot nudge seller for order with status ${order.status}` },
        { status: 400 },
      );
    }

    const slaType = order.status === 'ACCEPTED' ? 'PACKING' : 'ACCEPTANCE';
    await notifySellerSlaWarning(id, slaType);

    // Log the nudge in status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId:   id,
        fromStatus: order.status as any,
        toStatus:   order.status as any,
        actorType: 'ADMIN',
        note:      `Admin manually sent seller nudge (${slaType} SLA reminder)`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[admin/orders/v2/nudge-seller] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
