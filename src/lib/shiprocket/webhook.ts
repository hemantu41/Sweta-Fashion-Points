/**
 * Shiprocket webhook handler — Supabase-backed (no Prisma / DATABASE_URL needed).
 *
 * KEY DESIGN: the webhook applies the status DIRECTLY from the Shiprocket
 * payload without making any extra API calls back to Shiprocket. This makes
 * webhook processing reliable and fast regardless of Shiprocket API availability.
 *
 * Signature verification:
 *   Shiprocket signs payloads with HMAC-SHA256 using SHIPROCKET_WEBHOOK_SECRET.
 *   Digest is sent in the X-Shiprocket-Hmac header (hex, optionally "sha256=" prefixed).
 */

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { applyStatusFromPayload, STATUS_MAP } from './tracking';

// ─────────────────────────────────────────────────────────────────────────────
// HMAC verification
// ─────────────────────────────────────────────────────────────────────────────

export function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[SR:webhook] SHIPROCKET_WEBHOOK_SECRET not set — skipping HMAC check');
    return true;
  }
  if (!signature) return false;

  const computed = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const provided = signature.replace(/^sha256=/, '').toLowerCase();

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(provided,  'hex'),
    );
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload type
// ─────────────────────────────────────────────────────────────────────────────

export interface ShiprocketWebhookPayload {
  awb?:                        string;
  awb_number?:                 string;
  current_status?:             string;
  current_status_description?: string;
  courier_name?:               string;
  etd?:                        string;
  delivered_date?:             string;
  scans?:                      any[];
  tracking_data?:              any;
  [key: string]: unknown;
}

export interface WebhookHandlerResult {
  processed:  boolean;
  orderId?:   string;
  newStatus?: string;
  skipped?:   string;
  error?:     string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────

export async function handleShiprocketWebhook(
  rawBody:   Buffer,
  signature: string,
  payload:   ShiprocketWebhookPayload,
): Promise<WebhookHandlerResult> {
  // ── 1. Verify signature ───────────────────────────────────────────────────
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[SR:webhook] HMAC verification failed — payload rejected');
    return { processed: false, error: 'Invalid signature' };
  }

  // ── 2. Extract AWB ────────────────────────────────────────────────────────
  const awbNumber =
    payload.awb ??
    payload.awb_number ??
    (payload as any).tracking_number ??
    null;

  if (!awbNumber) {
    return { processed: false, skipped: 'No AWB in payload — likely a test ping' };
  }

  // ── 3. Resolve IFP status directly from the payload ───────────────────────
  // Shiprocket sends current_status as a readable string (e.g. "Delivered").
  // We map it directly — NO extra Shiprocket API call here.
  const rawStatus = (
    payload.current_status ??
    payload.current_status_description ??
    ''
  ).toLowerCase().trim();

  const newStatus = STATUS_MAP[rawStatus];

  if (!newStatus) {
    console.log(`[SR:webhook] AWB=${awbNumber} status "${rawStatus}" has no IFP mapping — skipped`);
    return { processed: false, skipped: `Unmapped status: "${rawStatus}"` };
  }

  console.log(`[SR:webhook] AWB=${awbNumber} resolved status: ${rawStatus} → ${newStatus}`);

  // ── 4. Look up order by AWB in spf_orders ────────────────────────────────
  const { data: order, error: lookupErr } = await supabaseAdmin
    .from('spf_orders')
    .select('id, status')
    .eq('awb_number', awbNumber)
    .maybeSingle();

  if (lookupErr) {
    console.error('[SR:webhook] DB lookup error:', lookupErr.message);
    return { processed: false, error: lookupErr.message };
  }

  if (!order) {
    // AWB belongs to legacy spf_payment_orders — route layer calls handleLegacyWebhook
    return { processed: false, skipped: `AWB ${awbNumber} not found in spf_orders` };
  }

  // ── 5. Extract scan metadata from payload ─────────────────────────────────
  const scans: any[] =
    payload.scans ??
    (payload as any).tracking_data?.shipment_track_activities ??
    [];
  const latestScan = scans[0] ?? {};

  const deliveredAt =
    payload.delivered_date ??
    (payload as any).etd ??
    null;

  const description = [
    payload.current_status_description ?? payload.current_status,
    latestScan?.activity ?? latestScan?.sr_status_label ?? '',
  ].filter(Boolean).join(' — ') || null;

  // ── 6. Apply status to DB — using payload data, no extra API call ─────────
  const result = await applyStatusFromPayload(order.id, newStatus, {
    courierName: payload.courier_name ?? null,
    deliveredAt: deliveredAt,
    location:    latestScan?.location ?? null,
    description,
    note: description,
  });

  if (result.error) {
    return { processed: false, orderId: order.id, error: result.error };
  }

  console.log(
    `[SR:webhook] AWB=${awbNumber} orderId=${order.id} → ${newStatus} (updated=${result.updated})`,
  );

  return { processed: true, orderId: order.id, newStatus };
}
