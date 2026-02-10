import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - List all orders (Admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, fetch all orders

    const { data: orders, error } = await supabase
      .from('spf_payment_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Orders API] Database error:', error);
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
    console.error('[Admin Orders API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
