import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { schedulePickup } from '@/lib/shiprocket';
import { notifySellerPickupScheduled } from '@/lib/notifications/sellerNotify';

/**
 * POST /api/orders/[id]/packing-status
 * Body: { sellerId: string }
 *
 * Called when the seller clicks "Packing Completed".
 * - Verifies the order has a label already (status = LABEL_GENERATED)
 * - Schedules Shiprocket pickup for tomorrow
 * - Sets order status to PACKED (Ready for courier collection)
 * - Logs to spf_order_status_history
 * - Notifies seller by email about the scheduled pickup
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const { sellerId } = body as { sellerId?: string };

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId is required' }, { status: 400 });
    }

    // Fetch order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('spf_orders')
      .select('id, order_number, status, seller_id, awb_number, courier_partner')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.seller_id !== sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Must have a label generated already
    const packableStatuses = ['label_generated', 'LABEL_GENERATED'];
    if (!packableStatuses.includes(order.status || '')) {
      return NextResponse.json(
        { error: `Cannot confirm packing — order status is "${order.status}". Generate the shipping label first.` },
        { status: 400 }
      );
    }

    if (!order.awb_number) {
      return NextResponse.json(
        { error: 'No AWB found for this order. Please generate the shipping label first.' },
        { status: 400 }
      );
    }

    // Fetch shipment_id from spf_shipments (needed for schedulePickup)
    const { data: shipment } = await supabaseAdmin
      .from('spf_shipments')
      .select('id, shipment_id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (!shipment?.shipment_id) {
      return NextResponse.json(
        { error: 'Shipment record not found. Please regenerate the shipping label.' },
        { status: 404 }
      );
    }

    // Schedule pickup with Shiprocket
    await schedulePickup(shipment.shipment_id);

    const now = new Date().toISOString();

    // Update order status → PACKED
    await supabaseAdmin
      .from('spf_orders')
      .update({ status: 'PACKED', packed_at: now, updated_at: now })
      .eq('id', orderId);

    // Log history
    await supabaseAdmin.from('spf_order_status_history').insert({
      order_id:    orderId,
      from_status: order.status,
      to_status:   'PACKED',
      actor_type:  'SELLER',
      actor_id:    sellerId,
      note:        'Seller confirmed packing completed. Shiprocket pickup scheduled for tomorrow.',
      created_at:  now,
    });

    // Update spf_shipments record
    await supabaseAdmin
      .from('spf_shipments')
      .update({ status: 'pickup_scheduled', picked_up_at: now })
      .eq('id', shipment.id);

    // Notify seller about scheduled pickup — fire and forget
    void notifySellerPickupScheduled(orderId);

    return NextResponse.json({
      success:   true,
      message:   'Packing confirmed. Pickup scheduled for tomorrow.',
      packedAt:  now,
    });
  } catch (err: any) {
    console.error('[packing-status POST] Error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong: ' + err?.message }, { status: 500 });
  }
}

/**
 * GET /api/orders/[id]/packing-status
 * Returns current packing/SLA deadline info for an order.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const { data: order, error } = await supabaseAdmin
      .from('spf_orders')
      .select('id, order_number, packing_sla_deadline, packed_at, status, awb_number')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      orderId:          order.id,
      orderNumber:      order.order_number,
      status:           order.status,
      packingDeadline:  order.packing_sla_deadline,
      packedAt:         order.packed_at,
      isPacked:         !!order.packed_at,
      hasLabel:         !!order.awb_number,
      isOverdue:        order.packing_sla_deadline
        ? !order.packed_at && new Date(order.packing_sla_deadline) < new Date()
        : false,
    });
  } catch (err: any) {
    console.error('[packing-status GET] Error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
