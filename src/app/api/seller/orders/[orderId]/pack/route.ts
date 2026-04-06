/**
 * POST /api/seller/orders/[orderId]/pack
 * Seller marks an order as packed: ACCEPTED → PACKED
 * Body: { sellerId: string; photoUrl?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const body        = await request.json().catch(() => ({}));
    const { sellerId, photoUrl } = body as { sellerId?: string; photoUrl?: string };

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

    if (order.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: `Order cannot be packed — current status: ${order.status}` },
        { status: 400 },
      );
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data:  {
          status:        'PACKED' as any,
          packedAt:      now,
          ...(photoUrl ? { packedPhotoUrl: photoUrl } : {}),
        },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: 'ACCEPTED' as any,
          toStatus:   'PACKED'    as any,
          actorType:  'SELLER',
          actorId:    sellerId,
          note:       photoUrl
            ? 'Order packed — photo uploaded'
            : 'Order packed and ready for label generation',
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[seller/orders/pack] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
