/**
 * Shiprocket webhook handler — Supabase-backed (no Prisma / DATABASE_URL needed).
 *
 * Signature verification:
 *   Shiprocket signs payloads with HMAC-SHA256 using SHIPROCKET_WEBHOOK_SECRET.
 *   Digest is sent in the X-Shiprocket-Hmac header (hex, optionally "sha256=" prefixed).
 *
 * On DELIVERED:
 *   Sets delivered_at + return_window_closes_at on spf_orders.
 *   Invalidates seller Redis cache.
 */

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { syncTrackingStatus } from './tracking';

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
  scans?:                      unknown[];
  tracking_data?:              unknown;
  [key: string]: unknown;
}

export interface WebhookHandlerResult {
  processed: boolean;
  orderId?:  string;
  newStatus?: string;
  skipped?:  string;
  error?:    string;
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
  const awbNumber = payload.awb ?? payload.awb_number ?? null;
  if (!awbNumber) {
    return { processed: false, skipped: 'No AWB in payload — likely a test ping' };
  }

  // ── 3. Look up order by AWB in spf_orders (supabaseAdmin, no Prisma) ─────
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
    // AWB belongs to legacy spf_payment_orders — route layer will call handleLegacyWebhook
    return { processed: false, skipped: `AWB ${awbNumber} not found in spf_orders` };
  }

  // ── 4. Sync tracking status ───────────────────────────────────────────────
  const syncResult = await syncTrackingStatus(order.id);

  if (syncResult.error) {
    return { processed: false, orderId: order.id, error: syncResult.error };
  }

  console.log(
    `[SR:webhook] AWB=${awbNumber} orderId=${order.id} updated=${syncResult.updated} status=${syncResult.newStatus ?? 'unchanged'}`,
  );

  return {
    processed: true,
    orderId:   order.id,
    newStatus: syncResult.newStatus,
  };
}
