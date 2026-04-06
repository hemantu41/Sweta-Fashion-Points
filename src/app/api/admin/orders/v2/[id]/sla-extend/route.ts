/**
 * POST /api/admin/orders/v2/[id]/sla-extend
 * Extends the active SLA deadline by 1 hour.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where:  { id },
      select: { status: true, acceptanceSlaDeadline: true, packingSlaDeadline: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let updates: Record<string, Date> = {};

    if (order.status === 'SELLER_NOTIFIED' && order.acceptanceSlaDeadline) {
      updates.acceptanceSlaDeadline = new Date(
        order.acceptanceSlaDeadline.getTime() + ONE_HOUR_MS,
      );
    } else if (order.status === 'ACCEPTED' && order.packingSlaDeadline) {
      updates.packingSlaDeadline = new Date(
        order.packingSlaDeadline.getTime() + ONE_HOUR_MS,
      );
    } else {
      return NextResponse.json(
        { error: 'No active SLA deadline to extend for this order status' },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.order.update({ where: { id }, data: updates }),
      prisma.orderStatusHistory.create({
        data: {
          orderId:    id,
          fromStatus: order.status as any,
          toStatus:   order.status as any,
          actorType:  'ADMIN',
          note:       'Admin extended SLA deadline by 1 hour',
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[admin/orders/v2/sla-extend] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
