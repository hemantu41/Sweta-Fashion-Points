/**
 * Shiprocket webhook handler — modular, testable, Prisma-backed.
 *
 * Signature verification:
 *   Shiprocket signs payloads with HMAC-SHA256 using SHIPROCKET_WEBHOOK_SECRET.
 *   The digest is sent in the X-Shiprocket-Hmac header (hex, optionally prefixed "sha256=").
 *
 * On DELIVERED:
 *   startPaymentSettlementTimer() creates a SellerPayout record in spf_seller_payouts
 *   with payout_date = delivered_at + T7 (or T5 for premium sellers).
 */

import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { syncTrackingStatus } from './tracking';

// ─────────────────────────────────────────────────────────────────────────────
// HMAC verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the raw request body matches the Shiprocket HMAC signature.
 * Skips verification when SHIPROCKET_WEBHOOK_SECRET is not configured (dev mode).
 */
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

  // Support both "abc123…" and "sha256=abc123…" formats
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
// Payout settlement timer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a pending SellerPayout row when an order is delivered.
 * Called after syncTrackingStatus confirms DELIVERED.
 * Idempotent — safe to re-run for the same orderId.
 */
export async function startPaymentSettlementTimer(orderId: string): Promise<void> {
  // Check if already created
  const existing = await prisma.sellerPayout.findUnique({
    where:  { orderId },
    select: { id: true },
  });
  if (existing) return; // Already scheduled

  const order = await prisma.order.findUnique({
    where:  { id: orderId },
    select: {
      id:                true,
      sellerId:          true,
      sellerPayoutAmount: true,
      pgFee:             true,
      deliveredAt:       true,
    },
  });

  if (!order?.deliveredAt) {
    console.warn(`[SR:webhook] startPaymentSettlementTimer: order ${orderId} has no deliveredAt`);
    return;
  }

  // Determine payout cycle — try to read from seller record (column may not exist yet)
  let payoutCycleDays = 7; // Default T7
  try {
    const { data: seller } = await import('@/lib/supabase-admin').then((m) =>
      m.supabaseAdmin
        .from('spf_sellers')
        .select('payout_cycle')
        .eq('id', order.sellerId)
        .maybeSingle(),
    );
    if ((seller as any)?.payout_cycle === 'T5') payoutCycleDays = 5;
  } catch { /* fallback to T7 */ }

  const payoutDate = new Date(order.deliveredAt);
  payoutDate.setDate(payoutDate.getDate() + payoutCycleDays);

  const grossAmount = Number(order.sellerPayoutAmount);
  const pgFeeDeduct = Number(order.pgFee);
  const netPayout   = grossAmount; // Gross already excludes platform fee; pg deduction logged separately

  await prisma.sellerPayout.create({
    data: {
      sellerId:          order.sellerId,
      orderId,
      grossAmount,
      pgFeeDeduction:    pgFeeDeduct,
      netPayout,
      payoutCycle:       payoutCycleDays === 5 ? 'T5' as any : 'T7' as any,
      status:            'PENDING' as any,
      payoutDate,
    },
  });

  console.log(
    `[SR:webhook] Payout scheduled: orderId=${orderId} ₹${netPayout} on ${payoutDate.toISOString().split('T')[0]} (T${payoutCycleDays})`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook payload type
// ─────────────────────────────────────────────────────────────────────────────

export interface ShiprocketWebhookPayload {
  awb?:                     string;
  awb_number?:              string;
  current_status?:          string;
  current_status_description?: string;
  courier_name?:            string;
  etd?:                     string;
  scans?:                   unknown[];
  tracking_data?:           unknown;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────

export interface WebhookHandlerResult {
  processed: boolean;
  orderId?:  string;
  newStatus?: string;
  skipped?:  string;
  error?:    string;
}

/**
 * Process one Shiprocket webhook delivery.
 *
 * @param rawBody   Raw request body Buffer — needed for HMAC verification.
 * @param signature Value of X-Shiprocket-Hmac header.
 * @param payload   Parsed JSON body.
 */
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

  // ── 3. Look up order by AWB in spf_orders (new Prisma table) ─────────────
  const order = await prisma.order.findFirst({
    where:  { awbNumber },
    select: { id: true, status: true },
  });

  if (!order) {
    // AWB might belong to legacy spf_payment_orders — handled by the route layer
    return { processed: false, skipped: `AWB ${awbNumber} not found in spf_orders` };
  }

  // ── 4. Sync tracking status ───────────────────────────────────────────────
  const syncResult = await syncTrackingStatus(order.id);

  if (syncResult.error) {
    return { processed: false, orderId: order.id, error: syncResult.error };
  }

  // ── 5. Post-delivery actions ─────────────────────────────────────────────
  if (syncResult.newStatus === 'DELIVERED') {
    // Fire-and-forget — payout scheduling must not block the 200 response
    startPaymentSettlementTimer(order.id).catch((err) =>
      console.error('[SR:webhook] startPaymentSettlementTimer error:', err?.message),
    );
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
