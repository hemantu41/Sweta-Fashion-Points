import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { invalidateSellerKeys } from '@/lib/sellerCache';

// PUT /api/orders/[id]
// Body: { status: 'accepted' | 'cancelled', sellerId: string }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { status, sellerId } = body;

    if (!status || !sellerId) {
      return NextResponse.json(
        { error: 'status and sellerId are required' },
        { status: 400 }
      );
    }

    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      accepted:  ['captured'],
      cancelled: ['captured', 'accepted'],
    };

    if (!ALLOWED_TRANSITIONS[status]) {
      return NextResponse.json(
        { error: `Cannot transition to status "${status}" via this endpoint` },
        { status: 400 }
      );
    }

    // Fetch the order
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('spf_payment_orders')
      .select('id, status, seller_id, items')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify the current status allows this transition
    if (!ALLOWED_TRANSITIONS[status].includes(order.status)) {
      return NextResponse.json(
        { error: `Order is in "${order.status}" status — cannot transition to "${status}"` },
        { status: 400 }
      );
    }

    // Verify seller owns this order
    const items: any[] = order.items || [];
    const sellerOwns =
      order.seller_id === sellerId ||
      items.some((i: any) => i.seller_id === sellerId || i.sellerId === sellerId);

    if (!sellerOwns) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update status
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'accepted') updatePayload.accepted_at = new Date().toISOString();
    if (status === 'cancelled') updatePayload.cancelled_at = new Date().toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from('spf_payment_orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (updateErr) {
      console.error('[Order Status PUT] Update error:', updateErr);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    // Invalidate seller orders cache
    invalidateSellerKeys(sellerId, 'orders').catch(() => {});

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error('[Order Status PUT] Error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
