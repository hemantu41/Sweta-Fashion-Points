/**
 * GET /api/orders?sellerId=  — seller order list
 * GET /api/orders?userId=    — buyer order history
 *
 * Reads from spf_orders via Supabase (no Prisma/DATABASE_URL needed).
 * Returns data shaped like the old spf_payment_orders format so the
 * seller dashboard page works without changes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// Map spf_orders status (Prisma enum string) → old spf_payment_orders status
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

    // Build query — include items via foreign key relationship
    let query = supabaseAdmin
      .from('spf_orders')
      .select(`
        id, order_number, seller_id, customer_id, status,
        subtotal, shipping_charge,
        acceptance_sla_deadline, packing_sla_deadline,
        packed_at, picked_up_at, delivered_at,
        shipping_address, created_at,
        awb_number, courier_partner, tracking_url,
        spf_order_items (
          id, product_id, seller_id, product_name,
          variant_details, sku, quantity, unit_price, total_price
        )
      `)
      .order('created_at', { ascending: false });

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    } else {
      query = query.eq('customer_id', userId!);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Orders API] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 },
      );
    }

    // Transform to old spf_payment_orders shape
    const orders = (data || []).map((o: any) => ({
      id:               o.id,
      order_number:     o.order_number,
      seller_id:        o.seller_id,
      user_id:          o.customer_id,
      status:           mapStatus(o.status),
      // amount in paise (× 100) so existing fmtAmount helper works
      amount:           Math.round((Number(o.subtotal) + Number(o.shipping_charge)) * 100),
      sla_deadline:     o.acceptance_sla_deadline ?? null,
      packing_deadline: o.packing_sla_deadline    ?? null,
      packed_at:        o.packed_at    ?? null,
      shipped_at:       o.picked_up_at ?? null,
      created_at:       o.created_at,
      // shipping_address stored as { name, phone, house, area, city, state, pincode }
      delivery_address: o.shipping_address,
      items: (o.spf_order_items || []).map((item: any) => ({
        id:              item.id,
        product_id:      item.product_id,
        seller_id:       item.seller_id,
        product_name:    item.product_name,
        name:            item.product_name,
        variant_details: item.variant_details,
        sku:             item.sku,
        quantity:        item.quantity,
        unit_price:      Number(item.unit_price),
        total_price:     Number(item.total_price),
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
