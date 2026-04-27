import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/tracking/[awb]
// Public endpoint — no auth required (anyone with AWB can track)
//
// Strategy:
//   1. Query spf_shipments by awb_number — has full tracking history
//   2. Fallback: query spf_orders by awb_number — covers orders created
//      before the spf_shipments FK bug was fixed (those never got a shipment row)

// Map spf_orders.status → spf_shipments.status equivalents
const ORDER_TO_SHIPMENT_STATUS: Record<string, string> = {
  CONFIRMED:        'label_generated',
  SELLER_NOTIFIED:  'label_generated',
  ACCEPTED:         'label_generated',
  LABEL_GENERATED:  'label_generated',
  PACKED:           'pickup_scheduled',
  PICKUP_SCHEDULED: 'pickup_scheduled',
  READY_TO_SHIP:    'pickup_scheduled',
  IN_TRANSIT:       'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED:        'delivered',
  CANCELLED:        'cancelled',
  REJECTED:         'cancelled',
  RETURNED:         'returned',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ awb: string }> }
) {
  const { awb } = await params;

  if (!awb) {
    return NextResponse.json({ success: false, error: 'AWB is required' }, { status: 400 });
  }

  // ── 1. Try spf_shipments first ──────────────────────────────────────────
  const { data: shipment } = await supabaseAdmin
    .from('spf_shipments')
    .select(`
      awb_number,
      courier_name,
      status,
      estimated_delivery,
      picked_up_at,
      shipped_at,
      delivered_at,
      is_rto,
      label_url,
      order_id,
      tracking:spf_shipment_tracking(id, status, location, description, created_at)
    `)
    .eq('awb_number', awb)
    .maybeSingle();

  if (shipment) {
    // Enrich with order status from spf_orders (not the old spf_payment_orders)
    let orderInfo: { id: string; status: string } | null = null;
    if ((shipment as any).order_id) {
      const { data: ord } = await supabaseAdmin
        .from('spf_orders')
        .select('id, status')
        .eq('id', (shipment as any).order_id)
        .maybeSingle();
      if (ord) orderInfo = { id: ord.id, status: ord.status };
    }

    const { order_id: _oid, ...rest } = shipment as any;
    return NextResponse.json({
      success: true,
      shipment: { ...rest, order: orderInfo },
    });
  }

  // ── 2. Fallback: check spf_orders by awb_number ─────────────────────────
  // Covers orders where the spf_shipments row was never written (pre-FK-fix)
  const { data: order } = await supabaseAdmin
    .from('spf_orders')
    .select('id, status, awb_number, courier_partner, created_at, updated_at')
    .eq('awb_number', awb)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
  }

  const shipmentStatus = ORDER_TO_SHIPMENT_STATUS[order.status] || 'label_generated';

  // Build a synthetic shipment response from order data
  const syntheticShipment = {
    awb_number:         order.awb_number,
    courier_name:       order.courier_partner || null,
    status:             shipmentStatus,
    estimated_delivery: null,
    picked_up_at:       null,
    shipped_at:         null,
    delivered_at:       null,
    is_rto:             false,
    label_url:          null,
    tracking: [
      {
        id:          order.id,
        status:      shipmentStatus,
        location:    null,
        description: `Order ${order.status.replace(/_/g, ' ').toLowerCase()}`,
        created_at:  order.updated_at || order.created_at,
      },
    ],
    order: { id: order.id, status: order.status },
  };

  return NextResponse.json({ success: true, shipment: syntheticShipment });
}
