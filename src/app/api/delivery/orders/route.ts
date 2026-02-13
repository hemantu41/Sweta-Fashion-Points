import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - List delivery partner's assigned orders
export async function GET(request: NextRequest) {
  try {
    const partnerId = request.nextUrl.searchParams.get('partnerId');
    const status = request.nextUrl.searchParams.get('status');

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('spf_order_deliveries')
      .select(`
        *,
        order:spf_payment_orders(
          id,
          order_number,
          amount,
          items,
          delivery_address,
          created_at,
          payment_completed_at
        )
      `)
      .eq('delivery_partner_id', partnerId)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: deliveries, error } = await query;

    if (error) {
      console.error('[Delivery Orders API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deliveries: deliveries || [],
    });
  } catch (error: any) {
    console.error('[Delivery Orders API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
