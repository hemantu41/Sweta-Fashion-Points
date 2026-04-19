/**
 * GET /api/orders?sellerId=  — seller order list (cache-first via Redis)
 * GET /api/orders?userId=    — buyer order history
 *
 * Reads from spf_orders via Supabase (no Prisma/DATABASE_URL needed).
 * Returns data shaped like the old spf_payment_orders format so the
 * seller dashboard page works without changes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sellerCacheGet, sellerCacheSet } from '@/lib/sellerCache';

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

// Shared transform: raw spf_orders row → dashboard-compatible shape
function transformOrder(o: any) {
  return {
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
    awb_number:       o.awb_number   ?? null,
    courier_partner:  o.courier_partner ?? null,
    tracking_url:     o.tracking_url ?? null,
    // Map shipping_address → delivery_address
    delivery_address: o.shipping_address
      ? {
          name:          o.shipping_address.name    || '',
          phone:         o.shipping_address.phone   || '',
          address_line1: o.shipping_address.house   || o.shipping_address.address_line1 || '',
          address_line2: o.shipping_address.area    || o.shipping_address.address_line2 || '',
          city:          o.shipping_address.city    || '',
          state:         o.shipping_address.state   || '',
          pincode:       o.shipping_address.pincode || '',
        }
      : { name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '' },
    items: (o.spf_order_items || []).map((item: any) => ({
      id:              item.id,
      product_id:      item.product_id,
      seller_id:       item.seller_id,
      product_name:    item.product_name,
      name:            item.product_name || 'Product',
      nameHi:          '',
      image:           item.image_url || null,
      category:        item.category  || null,
      price:           Number(item.unit_price),
      size:            item.variant_details?.size || null,
      variant_details: item.variant_details,
      sku:             item.sku,
      quantity:        item.quantity,
      unit_price:      Number(item.unit_price),
      total_price:     Number(item.total_price),
    })),
  };
}

const ORDER_SELECT = `
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
`;

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

    // ── Seller query: cache-first via Redis ──────────────────────────────────
    if (sellerId) {
      const cached = await sellerCacheGet<any[]>(sellerId, 'orders');
      if (cached !== null) {
        console.log(`[Orders API] Redis cache HIT for seller ${sellerId}`);
        return NextResponse.json({
          success: true,
          orders: cached.map(transformOrder),
          fromCache: true,
        });
      }

      // Cache miss — fetch from DB
      const { data, error } = await supabaseAdmin
        .from('spf_orders')
        .select(ORDER_SELECT)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Orders API] Supabase error:', error.message);
        return NextResponse.json(
          { error: 'Failed to fetch orders', details: error.message },
          { status: 500 },
        );
      }

      // Populate cache (fire-and-forget)
      sellerCacheSet(sellerId, 'orders', data || []).catch(() => {});

      return NextResponse.json({
        success: true,
        orders: (data || []).map(transformOrder),
        fromCache: false,
      });
    }

    // ── Buyer query: always live (order history is personal, low traffic) ────
    const { data, error } = await supabaseAdmin
      .from('spf_orders')
      .select(ORDER_SELECT)
      .eq('customer_id', userId!)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Orders API] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, orders: (data || []).map(transformOrder) });

  } catch (err: any) {
    console.error('[Orders API] Error:', err?.message);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: err?.message },
      { status: 500 },
    );
  }
}
