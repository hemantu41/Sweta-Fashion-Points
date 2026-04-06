import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===== STATUS MAPPING: Shiprocket Status Code → IFP Status =====
const STATUS_MAP: Record<string, string> = {
  '1':  'pickup_scheduled',
  '2':  'pickup_scheduled',
  '3':  'picked_up',
  '4':  'picked_up',
  '5':  'in_transit',
  '6':  'out_for_delivery',
  '7':  'delivered',
  '8':  'cancelled',
  '9':  'rto_initiated',
  '10': 'rto_delivered',
  '12': 'lost',
  '14': 'rto_in_transit',
  '15': 'rto_out_for_delivery',
  '17': 'pickup_scheduled',
  '18': 'in_transit',
  '19': 'out_for_delivery',
  '20': 'delivery_failed',
  '21': 'undelivered',
  '22': 'shipped',
  '38': 'in_transit',
  '39': 'pickup_error',
  '40': 'rto_acknowledged',
  '41': 'cancelled',
  '42': 'self_fulfilled',
  '43': 'disposed_off',
  '44': 'in_transit',
};

// ===== Map IFP shipment status → spf_payment_orders status =====
const ORDER_STATUS_MAP: Record<string, string> = {
  pickup_scheduled:    'confirmed',
  picked_up:           'shipped',
  in_transit:          'shipped',
  out_for_delivery:    'out_for_delivery',
  delivered:           'delivered',
  delivery_failed:     'delivery_failed',
  cancelled:           'cancelled',
  rto_initiated:       'return_in_transit',
  rto_delivered:       'returned',
  lost:                'lost',
};

// ===================================================================
// GET — browser/verification ping
// ===================================================================
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Insta Fashion Points — Shiprocket webhook endpoint is live',
    timestamp: new Date().toISOString(),
  });
}

// ===================================================================
// POST — receives tracking updates from Shiprocket
// Always returns HTTP 200 to prevent Shiprocket retry flooding
// ===================================================================
export async function POST(request: NextRequest) {
  try {
    // 1. Optional secret validation
    const receivedSecret =
      request.headers.get('x-webhook-secret') ||
      request.headers.get('x-api-key') ||
      request.headers.get('authorization');
    const expectedSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;

    if (
      expectedSecret &&
      receivedSecret &&
      receivedSecret !== expectedSecret &&
      receivedSecret !== `Bearer ${expectedSecret}`
    ) {
      console.warn('[Shiprocket Webhook] Invalid secret:', receivedSecret);
      return NextResponse.json({ success: false, error: 'Unauthorized' });
    }

    // 2. Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: true });
    }

    console.log('[Shiprocket Webhook] Payload:', JSON.stringify(body));

    // 3. Extract fields (handle multiple payload formats)
    const awbNumber =
      body.awb || body.awb_number || body.tracking_number || null;
    const statusCode = String(
      body.current_status || body.status_code || body.shipment_status || ''
    );
    const statusDescription =
      body.current_status_description || body.status || body.status_description || '';
    const etd = body.etd || body.estimated_delivery_date || null;
    const courierName = body.courier_name || body.courier || null;
    const scans: any[] =
      body.scans || body.tracking_data?.shipment_track_activities || [];

    if (!awbNumber) {
      console.warn('[Shiprocket Webhook] No AWB — test ping, skipped');
      return NextResponse.json({ success: true, message: 'No AWB — skipped' });
    }

    // 4. Map to IFP status
    const ifpStatus = STATUS_MAP[statusCode] || 'in_transit';
    console.log(`[Shiprocket Webhook] AWB ${awbNumber} → ${statusCode} → ${ifpStatus}`);

    // 5. Find shipment
    const { data: shipment } = await supabase
      .from('spf_shipments')
      .select('id, order_id, seller_id, status, picked_up_at, shipped_at')
      .eq('awb_number', awbNumber)
      .single();

    if (!shipment) {
      console.warn(`[Shiprocket Webhook] AWB ${awbNumber} not in DB — skipped`);
      return NextResponse.json({ success: true, message: 'Shipment not found — skipped' });
    }

    // Skip if status unchanged
    if (shipment.status === ifpStatus) {
      return NextResponse.json({ success: true, message: 'Status unchanged — skipped' });
    }

    // 6. Build shipment update
    const shipmentUpdate: Record<string, any> = {
      status:     ifpStatus,
      updated_at: new Date().toISOString(),
    };
    if (ifpStatus === 'picked_up' && !shipment.picked_up_at)
      shipmentUpdate.picked_up_at = new Date().toISOString();
    if (ifpStatus === 'in_transit' && !shipment.shipped_at)
      shipmentUpdate.shipped_at = new Date().toISOString();
    if (ifpStatus === 'delivered')
      shipmentUpdate.delivered_at = new Date().toISOString();
    if (ifpStatus === 'rto_initiated' || ifpStatus === 'rto_delivered') {
      shipmentUpdate.is_rto    = true;
      shipmentUpdate.rto_reason = statusDescription || null;
    }
    if (etd)         shipmentUpdate.estimated_delivery = etd;
    if (courierName) shipmentUpdate.courier_name       = courierName;

    await supabase.from('spf_shipments').update(shipmentUpdate).eq('id', shipment.id);

    // 7. Append tracking event
    const latestScan = scans[0] || {};
    await supabase.from('spf_shipment_tracking').insert({
      shipment_id: shipment.id,
      status:      statusDescription || ifpStatus,
      location:    latestScan.location || latestScan.city || null,
      description: latestScan.activity || latestScan.sr_status_label || statusDescription || null,
    });

    // 8. Mirror to order status
    const newOrderStatus = ORDER_STATUS_MAP[ifpStatus];
    if (newOrderStatus) {
      const orderUpdate: Record<string, any> = {
        status:     newOrderStatus,
        updated_at: new Date().toISOString(),
      };
      if (newOrderStatus === 'delivered') orderUpdate.delivered_at = new Date().toISOString();
      if (newOrderStatus === 'shipped')   orderUpdate.shipped_at   = new Date().toISOString();

      await supabase
        .from('spf_payment_orders')
        .update(orderUpdate)
        .eq('id', shipment.order_id);
    }

    return NextResponse.json({
      success: true,
      message: `Webhook processed: AWB ${awbNumber} → ${ifpStatus}`,
    });

  } catch (err: any) {
    // Always 200 — never let Shiprocket retry-flood the server
    console.error('[Shiprocket Webhook] Error:', err?.message);
    return NextResponse.json({ success: true, error: 'Internal error logged' });
  }
}
