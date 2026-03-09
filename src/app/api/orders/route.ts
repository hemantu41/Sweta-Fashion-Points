import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    let query = supabase
      .from('spf_payment_orders')
      .select('id, order_number, status, delivery_address, items, packing_deadline, sla_deadline, packed_at, created_at, payment_completed_at')
      .order('created_at', { ascending: false });

    if (sellerId) {
      // Seller wants to see their orders to pack:
      // captured payment, not yet packed, items contain this seller_id
      query = query
        .eq('status', 'captured')
        .is('packed_at', null)
        .contains('items', [{ seller_id: sellerId }]);
    } else {
      // Buyer order history
      query = query.eq('user_id', userId!);
    }

    // Fetch orders for the specific user only
    const { data: orders, error } = await query;

    if (error) {
      console.error('[Orders API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });
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
