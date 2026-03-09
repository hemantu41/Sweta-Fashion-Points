import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/orders/[id]/packing-status — return packing/SLA deadline info
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const { data: order, error } = await supabase
      .from('spf_payment_orders')
      .select('id, order_number, packing_deadline, sla_deadline, packed_at, status')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      packingDeadline: order.packing_deadline,
      slaDeadline: order.sla_deadline,
      packedAt: order.packed_at,
      isPacked: !!order.packed_at,
      isOverdue: order.packing_deadline
        ? !order.packed_at && new Date(order.packing_deadline) < new Date()
        : false,
    });
  } catch (error) {
    console.error('[Packing Status GET] Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// POST /api/orders/[id]/packing-status — seller or admin marks order as packed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { sellerId, adminId } = body;

    if (!sellerId && !adminId) {
      return NextResponse.json(
        { error: 'sellerId or adminId is required' },
        { status: 400 }
      );
    }

    // Fetch the order to verify it exists and is in a packable state
    const { data: order, error: orderError } = await supabase
      .from('spf_payment_orders')
      .select('id, status, packed_at, items')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'captured') {
      return NextResponse.json(
        { error: 'Only paid orders can be marked as packed' },
        { status: 400 }
      );
    }

    if (order.packed_at) {
      return NextResponse.json({ error: 'Order is already marked as packed' }, { status: 400 });
    }

    // If a sellerId is provided, verify this seller owns at least one item in the order
    if (sellerId && !adminId) {
      const items: any[] = order.items || [];
      const sellerOwnsItem = items.some(
        (item: any) => item.sellerId === sellerId || item.seller_id === sellerId
      );

      if (!sellerOwnsItem) {
        // Fallback: check via spf_sellers → user_id
        const { data: seller } = await supabase
          .from('spf_sellers')
          .select('id')
          .eq('user_id', sellerId)
          .maybeSingle();

        if (!seller) {
          return NextResponse.json(
            { error: 'Seller not authorized for this order' },
            { status: 403 }
          );
        }
      }
    }

    // Mark as packed
    const { error: updateError } = await supabase
      .from('spf_payment_orders')
      .update({ packed_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Packing Status POST] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update packing status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order marked as packed',
      packedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Packing Status POST] Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
