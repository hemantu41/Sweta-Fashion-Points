/**
 * GET /api/orders?sellerId=  — seller order list
 * GET /api/orders?userId=    — buyer order history
 *
 * Reads from spf_orders (Prisma) and returns data shaped like the
 * old spf_payment_orders format so the seller dashboard page works
 * without any changes.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Map Prisma OrderStatus enum → old spf_payment_orders status strings
function mapStatus(status: string): string {
  switch (status) {
    case 'CONFIRMED':
    case 'SELLER_NOTIFIED':   return 'captured';
    case 'ACCEPTED':           return 'accepted';
    case 'PACKED':
    case 'READY_TO_SHIP':
    case 'PICKUP_SCHEDULED':   return 'packed';
    case 'IN_TRANSIT':         return 'shipped';
    case 'OUT_FOR_DELIVERY':   return 'out_for_delivery';
    case 'DELIVERED':          return 'delivered';
    case 'CANCELLED':          return 'cancelled';
    case 'RETURN_INITIATED':
    case 'RETURNED':           return 'returned';
    default:                   return status.toLowerCase();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId   = searchParams.get('userId');
    const sellerId = searchParams.get('sellerId');

    if (!userId && !sellerId) {
      return NextResponse.json(
        { error: 'User ID or Seller ID is required' },
        { status: 400 },
      );
    }

    // Build Prisma where clause; exclude unpaid/failed orders from dashboard
    const where = sellerId
      ? {
          sellerId,
          status: {
            notIn: ['PENDING_PAYMENT', 'PAYMENT_FAILED'] as any,
          },
        }
      : { customerId: userId! };

    const dbOrders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to old spf_payment_orders shape
    const orders = dbOrders.map(o => ({
      id:               o.id,
      order_number:     o.orderNumber,
      seller_id:        o.sellerId,
      user_id:          o.customerId,
      status:           mapStatus(o.status),
      // amount in paise (× 100) so existing fmtAmount helper works
      amount:           Math.round((Number(o.subtotal) + Number(o.shippingCharge)) * 100),
      // SLA deadlines
      sla_deadline:     o.acceptanceSlaDeadline?.toISOString() ?? null,
      packing_deadline: o.packingSlaDeadline?.toISOString()    ?? null,
      // Lifecycle timestamps
      packed_at:        o.packedAt?.toISOString()   ?? null,
      shipped_at:       o.pickedUpAt?.toISOString() ?? null,
      created_at:       o.createdAt.toISOString(),
      // Delivery address — shippingAddress JSON stored as { name, phone, house, area, city, state, pincode }
      delivery_address: o.shippingAddress,
      // Items
      items: o.items.map(item => ({
        id:              item.id,
        product_id:      item.productId,
        seller_id:       item.sellerId,
        product_name:    item.productName,
        name:            item.productName,   // alias used by some UI components
        variant_details: item.variantDetails,
        sku:             item.sku,
        quantity:        item.quantity,
        unit_price:      Number(item.unitPrice),
        total_price:     Number(item.totalPrice),
      })),
    }));

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    console.error('[Orders API] Error:', err?.message);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: err?.message },
      { status: 500 },
    );
  }
}
