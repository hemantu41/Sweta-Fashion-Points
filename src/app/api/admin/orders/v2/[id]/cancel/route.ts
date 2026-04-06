/**
 * POST /api/admin/orders/v2/[id]/cancel
 * Admin cancels an order. Body: { reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const NON_CANCELLABLE = ['DELIVERED', 'RETURNED', 'CANCELLED'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body   = await req.json().catch(() => ({}));
    const reason = (body.reason as string | undefined)?.trim() || undefined;

    const order = await prisma.order.findUnique({
      where:  { id },
      select: { status: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (NON_CANCELLABLE.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot cancel an order with status ${order.status}` },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data:  { status: 'CANCELLED' as any },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId:    id,
          fromStatus: order.status as any,
          toStatus:   'CANCELLED' as any,
          actorType:  'ADMIN',
          note:       reason ? `Admin cancelled: ${reason}` : 'Cancelled by admin',
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[admin/orders/v2/cancel] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
