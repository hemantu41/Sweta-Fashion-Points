import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/tracking/[awb]
// Public endpoint — no auth required (anyone with AWB can track)
//
// Strategy:
//   1. Query spf_shipments by awb_number — has full tracking history
//   2. Fallback: query spf_orders by awb_number — covers orders without a shipment row
//
// Always enriches with spf_order_status_history to build per-step timestamps
// for the progress bar.

// Map spf_orders.status → progress step key
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

// Numeric rank — higher = further along in the journey
const STATUS_RANK: Record<string, number> = {
  label_generated:  0,
  pickup_scheduled: 1,
  picked_up:        2,
  in_transit:       3,
  out_for_delivery: 4,
  delivered:        5,
  cancelled:        -1,
  returned:         -1,
};

// Which IFP enum values map to each progress step
const IFP_STATUS_TO_STEP: Record<string, string> = {
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
};

export type StepTimestamps = {
  label_generated:  string | null;
  pickup_scheduled: string | null;
  in_transit:       string | null;
  out_for_delivery: string | null;
  delivered:        string | null;
};

/**
 * Fetch spf_order_status_history for an order and build a map of
 * step key → earliest timestamp when that step was reached.
 * Falls back to order column timestamps (created_at, picked_up_at, delivered_at).
 */
async function fetchStepTimestamps(
  orderId: string,
  order: { created_at: string; picked_up_at?: string | null; delivered_at?: string | null },
): Promise<StepTimestamps> {
  const timestamps: StepTimestamps = {
    label_generated:  order.created_at,
    pickup_scheduled: null,
    in_transit:       order.picked_up_at ?? null,
    out_for_delivery: null,
    delivered:        order.delivered_at ?? null,
  };

  // Fetch full status history, oldest first
  const { data: history } = await supabaseAdmin
    .from('spf_order_status_history')
    .select('to_status, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  for (const entry of history || []) {
    const step = IFP_STATUS_TO_STEP[entry.to_status as string];
    if (step && step in timestamps) {
      const key = step as keyof StepTimestamps;
      // Only set the earliest occurrence
      if (!timestamps[key]) {
        timestamps[key] = entry.created_at as string;
      }
    }
  }

  return timestamps;
}

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
    let orderInfo: { id: string; status: string } | null = null;
    let resolvedStatus: string = (shipment as any).status;
    let stepTimestamps: StepTimestamps | null = null;

    if ((shipment as any).order_id) {
      const { data: ord } = await supabaseAdmin
        .from('spf_orders')
        .select('id, status, created_at, picked_up_at, delivered_at')
        .eq('id', (shipment as any).order_id)
        .maybeSingle();

      if (ord) {
        orderInfo = { id: ord.id, status: ord.status };

        // Use spf_orders status if it's further along (fixes spf_shipments lag)
        const orderMapped = ORDER_TO_SHIPMENT_STATUS[ord.status];
        if (
          orderMapped &&
          (STATUS_RANK[orderMapped] ?? -1) > (STATUS_RANK[resolvedStatus] ?? -1)
        ) {
          resolvedStatus = orderMapped;
        }

        // Build step timestamps from status history
        stepTimestamps = await fetchStepTimestamps(ord.id, ord as any);
      }
    }

    const { order_id: _oid, ...rest } = shipment as any;
    return NextResponse.json({
      success: true,
      shipment: { ...rest, status: resolvedStatus, order: orderInfo, stepTimestamps },
    });
  }

  // ── 2. Fallback: check spf_orders by awb_number ─────────────────────────
  const { data: order } = await supabaseAdmin
    .from('spf_orders')
    .select('id, status, awb_number, courier_partner, created_at, updated_at, picked_up_at, delivered_at')
    .eq('awb_number', awb)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
  }

  const shipmentStatus = ORDER_TO_SHIPMENT_STATUS[order.status] || 'label_generated';
  const stepTimestamps = await fetchStepTimestamps(order.id, order as any);

  const syntheticShipment = {
    awb_number:         order.awb_number,
    courier_name:       order.courier_partner || null,
    status:             shipmentStatus,
    estimated_delivery: null,
    picked_up_at:       (order as any).picked_up_at || null,
    shipped_at:         null,
    delivered_at:       (order as any).delivered_at || null,
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
    order:         { id: order.id, status: order.status },
    stepTimestamps,
  };

  return NextResponse.json({ success: true, shipment: syntheticShipment });
}
