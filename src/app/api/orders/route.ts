import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sellerCacheGet, sellerCacheSet } from '@/lib/sellerCache';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const sellerId = request.nextUrl.searchParams.get('sellerId');

    if (!userId && !sellerId) {
      return NextResponse.json(
        { error: 'User ID or Seller ID is required' },
        { status: 400 }
      );
    }

    // Fetch orders — split query by path to avoid selecting columns
    // (packing_deadline, sla_deadline, packed_at) that may not yet exist
    // if the fast-delivery SQL migration hasn't been applied.
    let data: any[] | null = null;
    let error: any = null;

    if (sellerId) {
      // ── Cache-first for seller orders ─────────────────────────────────
      const cachedOrders = await sellerCacheGet<any[]>(sellerId, 'orders');
      if (cachedOrders !== null) {
        return NextResponse.json(
          { success: true, orders: cachedOrders, fromCache: true },
          { headers: { 'X-Cache': 'HIT' } }
        );
      }

      // Seller packing queue: captured + unpacked + items contain this seller
      ({ data, error } = await supabase
        .from('spf_payment_orders')
        .select('id, order_number, status, delivery_address, items, packing_deadline, sla_deadline, packed_at, created_at, payment_completed_at')
        .eq('status', 'captured')
        .is('packed_at', null)
        .contains('items', [{ seller_id: sellerId }])
        .order('created_at', { ascending: false }));
    } else {
      // Buyer order history — use * to avoid hard-coding column names
      ({ data, error } = await supabase
        .from('spf_payment_orders')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false }));
    }

    const orders = data;

    if (error) {
      console.error('[Orders API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      );
    }

    // Cache seller orders after DB fetch (background)
    if (sellerId && orders) {
      sellerCacheSet(sellerId, 'orders', orders).catch(() => {});
    }

    return NextResponse.json(
      { success: true, orders: orders || [], fromCache: false },
      { headers: { 'X-Cache': 'MISS' } }
    );
  } catch (error: any) {
    console.error('[Orders API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
