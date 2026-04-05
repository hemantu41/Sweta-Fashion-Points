import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Shiprocket status code → IFP internal status
const STATUS_MAP: Record<string, string> = {
  '1':  'pickup_scheduled',
  '2':  'pickup_scheduled',
  '3':  'picked_up',
  '4':  'picked_up',
  '5':  'in_transit',
  '6':  'out_for_delivery',
  '7':  'delivered',
  '8':  'cancelled',
  '9':  'returned',
  '10': 'returned',
  '17': 'in_transit',
  '18': 'in_transit',
  '19': 'out_for_delivery',
  '20': 'delivery_failed',
  '38': 'picked_up',
};

// IFP shipment status → spf_payment_orders status
const ORDER_STATUS_MAP: Record<string, string> = {
  picked_up:        'shipped',
  in_transit:       'shipped',
  out_for_delivery: 'out_for_delivery',
  delivered:        'delivered',
  returned:         'returned',
  cancelled:        'cancelled',
};

// POST /api/webhooks/shiprocket
// Configure this URL in Shiprocket → Settings → Webhooks
// Always returns 200 to prevent Shiprocket from retrying
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      awb:                         awbNumber,
      current_status:              statusCode,
      current_status_description:  statusDescription,
      etd:                         estimatedDelivery,
      scans,
    } = body;

    if (!awbNumber) {
      console.warn('[Shiprocket Webhook] Missing AWB in payload');
      return NextResponse.json({ success: true });
    }

    const ifpStatus = STATUS_MAP[String(statusCode)] || 'in_transit';

    // 1. Find shipment by AWB
    const { data: shipment } = await supabaseAdmin
      .from('spf_shipments')
      .select('id, order_id, seller_id, status')
      .eq('awb_number', awbNumber)
      .single();

    if (!shipment) {
      console.warn(`[Shiprocket Webhook] Shipment not found for AWB ${awbNumber}`);
      return NextResponse.json({ success: true }); // 200 to stop retries
    }

    // Skip if status hasn't progressed
    if (shipment.status === ifpStatus) {
      return NextResponse.json({ success: true });
    }

    // 2. Build shipment update
    const shipmentUpdate: any = {
      status:     ifpStatus,
      updated_at: new Date().toISOString(),
    };
    if (estimatedDelivery) shipmentUpdate.estimated_delivery = estimatedDelivery;
    if (ifpStatus === 'picked_up')    shipmentUpdate.picked_up_at    = new Date().toISOString();
    if (ifpStatus === 'in_transit')   shipmentUpdate.shipped_at      = new Date().toISOString();
    if (ifpStatus === 'delivered')    shipmentUpdate.delivered_at    = new Date().toISOString();
    if (ifpStatus === 'returned') {
      shipmentUpdate.is_rto    = true;
      shipmentUpdate.rto_reason = statusDescription ?? null;
    }

    await supabaseAdmin
      .from('spf_shipments')
      .update(shipmentUpdate)
      .eq('id', shipment.id);

    // 3. Append to tracking history
    const latestScan = scans?.[0] || {};
    await supabaseAdmin.from('spf_shipment_tracking').insert({
      shipment_id: shipment.id,
      status:      statusDescription || ifpStatus,
      location:    latestScan.location || null,
      description: latestScan.activity || statusDescription || null,
    });

    // 4. Mirror status to spf_payment_orders
    const orderStatus = ORDER_STATUS_MAP[ifpStatus];
    if (orderStatus) {
      const orderUpdate: any = { status: orderStatus };
      if (ifpStatus === 'delivered') orderUpdate.delivered_at = new Date().toISOString();
      await supabaseAdmin
        .from('spf_payment_orders')
        .update(orderUpdate)
        .eq('id', shipment.order_id);
    }

    // 5. Notifications (non-blocking) — uncomment when notification helpers are ready
    // if (ifpStatus === 'out_for_delivery') void notifyCustomerOutForDelivery(shipment.order_id, awbNumber);
    // if (ifpStatus === 'delivered')        void notifyCustomerDelivered(shipment.order_id);
    // if (ifpStatus === 'delivery_failed')  void notifyCustomerDeliveryFailed(shipment.order_id);

    console.log(`[Shiprocket Webhook] AWB ${awbNumber} → ${ifpStatus}`);
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[Shiprocket Webhook] Error:', err?.message);
    return NextResponse.json({ success: true }); // Always 200 — never retry-flood
  }
}
