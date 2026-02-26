import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/admin/orders/[id]
 * Fetch a single order by ID with delivery information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch order from database
    const { data: order, error } = await supabaseAdmin
      .from('spf_payment_orders')
      .select(`
        *,
        delivery:spf_order_deliveries(
          delivery_type,
          delivery_partner_id,
          courier_company,
          courier_tracking_number,
          courier_tracking_url,
          status,
          assigned_at,
          picked_up_at,
          in_transit_at,
          out_for_delivery_at,
          delivered_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Admin Orders API] Error fetching order:', error);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Flatten delivery information into order object
    const orderWithDelivery = {
      ...order,
      delivery_type: order.delivery?.[0]?.delivery_type,
      courier_company: order.delivery?.[0]?.courier_company,
      courier_tracking_number: order.delivery?.[0]?.courier_tracking_number,
      courier_tracking_url: order.delivery?.[0]?.courier_tracking_url,
      delivery_status: order.delivery?.[0]?.status,
      assigned_at: order.delivery?.[0]?.assigned_at,
      picked_up_at: order.delivery?.[0]?.picked_up_at,
      in_transit_at: order.delivery?.[0]?.in_transit_at,
      out_for_delivery_at: order.delivery?.[0]?.out_for_delivery_at,
      delivered_at: order.delivery?.[0]?.delivered_at,
    };

    // Remove the nested delivery array
    delete orderWithDelivery.delivery;

    return NextResponse.json({ order: orderWithDelivery });
  } catch (error: any) {
    console.error('[Admin Orders API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
