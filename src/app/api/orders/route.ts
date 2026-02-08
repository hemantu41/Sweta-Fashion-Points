import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('[Orders API] Fetching orders for user:', userId);

    // TEMPORARY: Fetch ALL orders (no user filter) for testing
    const { data: orders, error } = await supabase
      .from('spf_payment_orders')
      .select('*')
      // .eq('user_id', userId)  // TEMPORARILY DISABLED
      .order('created_at', { ascending: false});

    if (error) {
      console.error('[Orders API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Orders API] Found orders for user:', orders?.length || 0);

    // Debug: Also fetch ALL orders to see if they exist
    const { data: allOrders } = await supabase
      .from('spf_payment_orders')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('[Orders API] Total orders in database:', allOrders?.length || 0);
    console.log('[Orders API] Sample order:', orders?.[0] || allOrders?.[0]);

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
