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

      const SELECT_COLS = 'id, order_number, status, delivery_address, items, amount, packing_deadline, sla_deadline, packed_at, shipped_at, created_at, payment_completed_at, seller_id';
      const ACTIVE_STATUSES = ['captured', 'accepted', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'on_hold'];

      // Query 1: orders where top-level seller_id matches
      const { data: d1 } = await supabase
        .from('spf_payment_orders')
        .select(SELECT_COLS)
        .eq('seller_id', sellerId)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false });

      // Query 2: orders where items JSONB contains seller_id
      const { data: d2, error: err2 } = await supabase
        .from('spf_payment_orders')
        .select(SELECT_COLS)
        .contains('items', [{ seller_id: sellerId }])
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false });

      error = err2;

      // Merge and deduplicate
      const all = [...(d1 || []), ...(d2 || [])];
      const seen = new Set<string>();
      data = all.filter(o => seen.has(o.id) ? false : !!seen.add(o.id));
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
