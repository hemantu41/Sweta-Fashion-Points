/**
 * GET /api/seller/orders/[orderId]?sellerId=
 * Full order detail for the seller drawer.
 * Verifies order.sellerId === sellerId before returning.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
      where: { id: orderId },
      include: {
        items:         true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payout:        true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Seller ownership check
    if (order.sellerId !== sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch product images
    const productIds = [...new Set(order.items.map(i => i.productId))];
    const { data: products } = await supabaseAdmin
      .from('spf_productdetails')
      .select('id, main_image')
      .in('id', productIds.length ? productIds : ['__none__']);

    const imgMap = new Map((products ?? []).map((p: any) => [p.id, p.main_image]));

    const addr = order.shippingAddress as any;

    return NextResponse.json({
      order: {
        id:                    order.id,
        orderNumber:           order.orderNumber,
        status:                order.status,
        riskStatus:            order.riskStatus,
        paymentMethod:         order.paymentMethod,
        paymentStatus:         order.paymentStatus,
        subtotal:              Number(order.subtotal),
        shippingCharge:        Number(order.shippingCharge),
        platformFee:           Number(order.platformFee),
        pgFee:                 Number(order.pgFee),
        sellerPayoutAmount:    Number(order.sellerPayoutAmount),
        total:                 Number(order.subtotal) + Number(order.shippingCharge),
        acceptanceSlaDeadline: order.acceptanceSlaDeadline,
        packingSlaDeadline:    order.packingSlaDeadline,
        deliveredAt:           order.deliveredAt,
        awbNumber:             order.awbNumber,
        courierPartner:        order.courierPartner,
        trackingUrl:           order.trackingUrl,
        notes:                 order.notes,
        createdAt:             order.createdAt,
        // City + pincode only (customer privacy)
        deliveryCity:    addr?.city    ?? '',
        deliveryState:   addr?.state   ?? '',
        deliveryPincode: addr?.pincode ?? '',
        items: order.items.map(i => ({
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
        statusHistory: order.statusHistory.map(h => ({
          id:         h.id,
          fromStatus: h.fromStatus,
          toStatus:   h.toStatus,
          actorType:  h.actorType,
          note:       h.note,
          createdAt:  h.createdAt,
        })),
        payout: order.payout
          ? {
              status:            order.payout.status,
              payoutDate:        order.payout.payoutDate,
              grossAmount:       Number(order.payout.grossAmount),
              shippingDeduction: Number(order.payout.shippingDeduction),
              pgFeeDeduction:    Number(order.payout.pgFeeDeduction),
              netPayout:         Number(order.payout.netPayout),
            }
          : null,
      },
    });
  } catch (err: any) {
    console.error('[seller/orders/[orderId]] GET error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
