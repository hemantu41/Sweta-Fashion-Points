/**
 * GET /api/seller/orders/[orderId]/label?sellerId=
 * Returns the Shiprocket shipping label URL for the order.
 * Falls back to a Shiprocket tracking URL if no label has been generated yet.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const sellerId    = request.nextUrl.searchParams.get('sellerId') ?? '';

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where:  { id: orderId },
      select: {
        sellerId:            true,
        awbNumber:           true,
        trackingUrl:         true,
        shiprocketOrderId:   true,
        shiprocketShipmentId:true,
        status:              true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.sellerId !== sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!order.awbNumber) {
      return NextResponse.json(
        { error: 'Shipping label not yet generated — assign AWB first via admin or wait for Shiprocket sync' },
        { status: 404 },
      );
    }

    // Construct Shiprocket label URL if shipmentId is available
    const labelUrl = order.shiprocketShipmentId
      ? `https://apiv2.shiprocket.in/v1/external/courier/generate/label?shipment_id[]=${order.shiprocketShipmentId}`
      : null;

    return NextResponse.json({
      awbNumber:    order.awbNumber,
      labelUrl,
      trackingUrl:  order.trackingUrl,
      shiprocketShipmentId: order.shiprocketShipmentId,
    });
  } catch (err: any) {
    console.error('[seller/orders/label] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
