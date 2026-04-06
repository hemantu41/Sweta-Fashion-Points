/**
 * POST /api/admin/orders/v2/[id]/approve-hold
 * Admin clears a HOLD risk status — allows the order to proceed normally.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where:  { id },
      select: { status: true, riskStatus: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.riskStatus !== 'HOLD') {
      return NextResponse.json(
        { error: `Order risk status is ${order.riskStatus}, not HOLD` },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data:  { riskStatus: 'CLEAR' as any },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId:    id,
          fromStatus: order.status as any,
          toStatus:   order.status as any,
          actorType:  'ADMIN',
          note:       'Admin approved: HOLD risk status cleared after manual review',
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[admin/orders/v2/approve-hold] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
