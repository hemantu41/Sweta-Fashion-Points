/**
 * POST /api/webhook/shipping
 * ─────────────────────────────────────────────────────────────────────────────
 * Shiprocket delivery-status webhook endpoint.
 *
 * NOTE ON PATH: Shiprocket's SSRF/loop prevention blocks webhook URLs that
 * contain the word "shiprocket" in the path. This route intentionally uses
 * "/shipping" instead of "/shiprocket". The Shiprocket dashboard is configured
 * to POST to https://www.instafashionpoints.com/api/webhook/shipping.
 *
 * Processing strategy:
 *   1. Read raw body (needed for HMAC verification).
 *   2. Return HTTP 200 immediately — process webhook asynchronously to prevent
 *      Shiprocket from retrying on slow DB writes.
 *   3. For orders in spf_orders (new Prisma lifecycle): handleShiprocketWebhook()
 *   4. For orders in spf_payment_orders (legacy flow): existing Supabase path.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import {
  handleShiprocketWebhook,
  type ShiprocketWebhookPayload,
} from '@/lib/shiprocket/webhook';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Legacy status maps (kept for spf_payment_orders fallback) ─────────────────

const LEGACY_STATUS_MAP: Record<string, string> = {
  '1': 'pickup_scheduled', '2': 'pickup_scheduled', '3': 'picked_up',
  '4': 'picked_up',  '5': 'in_transit',  '6': 'out_for_delivery',
  '7': 'delivered',  '8': 'cancelled',   '9': 'rto_initiated',
  '10': 'rto_delivered', '12': 'lost',   '14': 'rto_in_transit',
  '15': 'rto_out_for_delivery', '17': 'pickup_scheduled',
  '18': 'in_transit', '19': 'out_for_delivery', '20': 'delivery_failed',
  '21': 'undelivered', '22': 'shipped',  '38': 'in_transit',
  '39': 'pickup_error', '40': 'rto_acknowledged', '41': 'cancelled',
  '44': 'in_transit',
};

const LEGACY_ORDER_STATUS_MAP: Record<string, string> = {
  pickup_scheduled: 'confirmed',   picked_up:        'shipped',
  in_transit:       'shipped',     out_for_delivery: 'out_for_delivery',
  delivered:        'delivered',   delivery_failed:  'delivery_failed',
  cancelled:        'cancelled',   rto_initiated:    'return_in_transit',
  rto_delivered:    'returned',    lost:             'lost',
};

// ── GET — verification ping ───────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status:    'active',
    message:   'IFP Shiprocket webhook endpoint is live',
    timestamp: new Date().toISOString(),
  });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── 1. Read raw body (required for HMAC) — do this before anything else ───
  let rawBuffer: ArrayBuffer;
  try {
    rawBuffer = await request.arrayBuffer();
  } catch {
    return NextResponse.json({ success: true }); // malformed body — ignore
  }
  const rawBody = Buffer.from(rawBuffer);

  // ── 2. Return 200 immediately, process async ──────────────────────────────
  //    Shiprocket retries if it doesn't get 200 within ~5 s. We must not block.
  processWebhook(rawBody, request.headers.get('x-shiprocket-hmac') ?? '').catch(
    (err) => console.error('[webhook/shipping] Unhandled async error:', err?.message),
  );

  return NextResponse.json({ success: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Async processing (runs after 200 is already returned)
// ─────────────────────────────────────────────────────────────────────────────

async function processWebhook(rawBody: Buffer, signature: string): Promise<void> {
  // Parse JSON
  let payload: ShiprocketWebhookPayload;
  try {
    payload = JSON.parse(rawBody.toString('utf-8'));
  } catch {
    console.warn('[webhook/shipping] Could not parse JSON body');
    return;
  }

  console.log('[webhook/shipping] Payload:', JSON.stringify(payload));

  const awbNumber =
    payload.awb ?? payload.awb_number ?? (payload as any).tracking_number ?? null;

  if (!awbNumber) {
    console.log('[webhook/shipping] No AWB — test ping, skipped');
    return;
  }

  // ── Try new Prisma path first (spf_orders) ───────────────────────────────
  const newResult = await handleShiprocketWebhook(rawBody, signature, payload);

  if (newResult.processed) {
    // Handled by new pipeline — done
    return;
  }

  // ── Fall back to legacy Supabase path (spf_payment_orders + spf_shipments) ─
  if (!newResult.skipped?.includes('not found in spf_orders')) {
    // Signature failure or genuine error — log and bail
    console.warn('[webhook/shipping] New handler error:', newResult.error);
    return;
  }

  await handleLegacyWebhook(payload, awbNumber as string);
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy handler — spf_payment_orders + spf_shipments (unchanged behaviour)
// ─────────────────────────────────────────────────────────────────────────────

async function handleLegacyWebhook(
  payload:   ShiprocketWebhookPayload,
  awbNumber: string,
): Promise<void> {
  const statusCode = String(
    (payload as any).current_status ??
    (payload as any).status_code    ??
    (payload as any).shipment_status ?? '',
  );
  const statusDescription =
    (payload as any).current_status_description ??
    (payload as any).status                     ??
    (payload as any).status_description         ?? '';
  const etd         = (payload as any).etd ?? (payload as any).estimated_delivery_date ?? null;
  const courierName = (payload as any).courier_name ?? (payload as any).courier ?? null;
  const scans: any[] =
    (payload as any).scans ??
    (payload as any).tracking_data?.shipment_track_activities ?? [];

  const ifpStatus = LEGACY_STATUS_MAP[statusCode] ?? 'in_transit';

  const { data: shipment } = await supabase
    .from('spf_shipments')
    .select('id, order_id, seller_id, status, picked_up_at, shipped_at')
    .eq('awb_number', awbNumber)
    .single();

  if (!shipment) {
    console.warn(`[webhook/shipping] Legacy: AWB ${awbNumber} not in spf_shipments`);
    return;
  }

  if (shipment.status === ifpStatus) return; // unchanged

  const shipmentUpdate: Record<string, any> = {
    status:     ifpStatus,
    updated_at: new Date().toISOString(),
  };
  if (ifpStatus === 'picked_up'  && !shipment.picked_up_at) shipmentUpdate.picked_up_at  = new Date().toISOString();
  if (ifpStatus === 'in_transit' && !shipment.shipped_at)   shipmentUpdate.shipped_at    = new Date().toISOString();
  if (ifpStatus === 'delivered')                             shipmentUpdate.delivered_at  = new Date().toISOString();
  if (ifpStatus === 'rto_initiated' || ifpStatus === 'rto_delivered') {
    shipmentUpdate.is_rto     = true;
    shipmentUpdate.rto_reason = statusDescription || null;
  }
  if (etd)         shipmentUpdate.estimated_delivery = etd;
  if (courierName) shipmentUpdate.courier_name       = courierName;

  await supabase.from('spf_shipments').update(shipmentUpdate).eq('id', shipment.id);

  const latestScan = scans[0] ?? {};
  await supabase.from('spf_shipment_tracking').insert({
    shipment_id: shipment.id,
    status:      statusDescription || ifpStatus,
    location:    latestScan.location ?? latestScan.city ?? null,
    description: latestScan.activity ?? latestScan.sr_status_label ?? statusDescription ?? null,
  });

  const newOrderStatus = LEGACY_ORDER_STATUS_MAP[ifpStatus];
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

  console.log(`[webhook/shipping] Legacy: AWB ${awbNumber} → ${ifpStatus}`);
}
