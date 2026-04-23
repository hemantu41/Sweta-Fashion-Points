/**
 * SLA Monitor — scans active orders every 15 minutes (via /api/cron/sla-check).
 *
 * SLA rules:
 *   ACCEPTANCE SLA: Seller must accept within 24 hrs of order CONFIRMATION.
 *                   Status tracked: SELLER_NOTIFIED → acceptance_sla_deadline
 *   PACKING SLA:    Seller must pack within 48 hrs of order placement.
 *                   Status tracked: ACCEPTED        → packing_sla_deadline
 *
 * Actions:
 *   30 min before deadline  → send warning (once, guarded by Redis flag)
 *   Deadline passed         → auto-cancel, notify seller + customer, refund if prepaid
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { redisGet, redisSetex } from '@/lib/redis';
import {
  notifySellerSlaWarning,
  notifySellerSlaBreached,
  notifyCustomerOrderCancelled,
} from '@/lib/notifications/sellerNotify';

// ── Constants ─────────────────────────────────────────────────────────────────
const WARN_WINDOW_MS = 30 * 60 * 1000;       // 30 min before deadline
const WARN_KEY_TTL   = 3600;                  // Redis TTL for "already warned" flag (1 hr)

type SlaType = 'ACCEPTANCE' | 'PACKING';

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export interface SlaCheckResult {
  checked:  number;
  warned:   number;
  breached: number;
}

/**
 * Scan all orders with active SLA deadlines and take appropriate action.
 * Safe to call multiple times — Redis flags prevent duplicate warnings.
 */
export async function checkAllActiveSLAs(): Promise<SlaCheckResult> {
  const now        = new Date();
  const warnCutoff = new Date(now.getTime() + WARN_WINDOW_MS); // now + 30 min

  let warned   = 0;
  let breached = 0;

  // ── Acceptance SLA: warning window ────────────────────────────────────────
  const { data: acceptWarn } = await supabaseAdmin
    .from('spf_orders')
    .select('id, order_number, acceptance_sla_deadline')
    .eq('status', 'SELLER_NOTIFIED')
    .gt('acceptance_sla_deadline', now.toISOString())
    .lte('acceptance_sla_deadline', warnCutoff.toISOString());

  // ── Acceptance SLA: breached ──────────────────────────────────────────────
  const { data: acceptBreach } = await supabaseAdmin
    .from('spf_orders')
    .select('id, order_number, customer_id, transaction_id, payment_method, subtotal, shipping_charge')
    .eq('status', 'SELLER_NOTIFIED')
    .lte('acceptance_sla_deadline', now.toISOString());

  // ── Packing SLA: warning window ───────────────────────────────────────────
  const { data: packWarn } = await supabaseAdmin
    .from('spf_orders')
    .select('id, order_number, packing_sla_deadline')
    .eq('status', 'ACCEPTED')
    .gt('packing_sla_deadline', now.toISOString())
    .lte('packing_sla_deadline', warnCutoff.toISOString());

  // ── Packing SLA: breached ─────────────────────────────────────────────────
  const { data: packBreach } = await supabaseAdmin
    .from('spf_orders')
    .select('id, order_number, customer_id, transaction_id, payment_method, subtotal, shipping_charge')
    .eq('status', 'ACCEPTED')
    .lte('packing_sla_deadline', now.toISOString());

  const totalChecked =
    (acceptWarn?.length ?? 0) + (acceptBreach?.length ?? 0) +
    (packWarn?.length   ?? 0) + (packBreach?.length   ?? 0);

  // ── Send warnings ─────────────────────────────────────────────────────────
  for (const order of acceptWarn ?? []) {
    const sent = await sendWarningOnce(order.id, 'ACCEPTANCE');
    if (sent) warned++;
  }
  for (const order of packWarn ?? []) {
    const sent = await sendWarningOnce(order.id, 'PACKING');
    if (sent) warned++;
  }

  // ── Handle breaches ───────────────────────────────────────────────────────
  for (const order of acceptBreach ?? []) {
    await handleSlaBreached(order as BreachOrder, 'ACCEPTANCE');
    breached++;
  }
  for (const order of packBreach ?? []) {
    await handleSlaBreached(order as BreachOrder, 'PACKING');
    breached++;
  }

  console.log(
    `[SLAMonitor] checked=${totalChecked} warned=${warned} breached=${breached}`,
  );

  return { checked: totalChecked, warned, breached };
}

// ─────────────────────────────────────────────────────────────────────────────
// Warning — send once, guarded by Redis flag
// ─────────────────────────────────────────────────────────────────────────────

async function sendWarningOnce(orderId: string, slaType: SlaType): Promise<boolean> {
  const flagKey = `ifp:sla:warned:${orderId}:${slaType}`;
  const already  = await redisGet(flagKey);
  if (already)   return false; // warning already sent

  await notifySellerSlaWarning(orderId, slaType);
  await redisSetex(flagKey, WARN_KEY_TTL, '1');
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Breach handler
// ─────────────────────────────────────────────────────────────────────────────

interface BreachOrder {
  id:             string;
  order_number:   string;
  customer_id:    string;
  transaction_id: string | null;
  payment_method: string | null;
  subtotal:       any;
  shipping_charge:any;
}

async function handleSlaBreached(order: BreachOrder, slaType: SlaType): Promise<void> {
  // Guard against processing the same breach twice (race conditions)
  const breachKey = `ifp:sla:breached:${order.id}:${slaType}`;
  const alreadyBreached = await redisGet(breachKey);
  if (alreadyBreached) return;
  await redisSetex(breachKey, 86400, '1'); // lock for 24 hrs

  console.log(`[SLAMonitor] SLA BREACH orderId=${order.id} type=${slaType}`);

  const note = slaType === 'ACCEPTANCE'
    ? 'Auto-cancelled: seller did not accept within 24-hour SLA window'
    : 'Auto-cancelled: seller did not pack within 48-hour SLA window';

  // ── 1. Cancel the order ────────────────────────────────────────────────────
  await supabaseAdmin
    .from('spf_orders')
    .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
    .eq('id', order.id);

  // ── 2. Write status history ────────────────────────────────────────────────
  await supabaseAdmin.from('spf_order_status_history').insert({
    order_id:    order.id,
    from_status: slaType === 'ACCEPTANCE' ? 'SELLER_NOTIFIED' : 'ACCEPTED',
    to_status:   'CANCELLED',
    actor_type:  'SYSTEM',
    note,
  });

  // ── 3. Notify seller ────────────────────────────────────────────────────────
  await notifySellerSlaBreached(order.id, slaType);

  // ── 4. Notify customer + trigger refund ────────────────────────────────────
  const isPrepaid  = order.payment_method !== null && order.payment_method !== 'COD';
  const orderTotal = Number(order.subtotal) + Number(order.shipping_charge);

  const customerEmail = await getCustomerEmail(order.customer_id);
  if (customerEmail) {
    await notifyCustomerOrderCancelled(
      order.id,
      customerEmail,
      order.order_number,
      orderTotal,
      isPrepaid,
    );
  }

  if (isPrepaid && order.transaction_id) {
    await triggerPgRefund(order.transaction_id, Math.round(orderTotal * 100));
  }

  // ── 5. Increment seller penalty count ─────────────────────────────────────
  await incrementSellerPenalty(order.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getCustomerEmail(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('spf_users')
    .select('email')
    .eq('id', customerId)
    .maybeSingle();
  return (data as any)?.email ?? null;
}

async function triggerPgRefund(paymentId: string, amountPaise: number): Promise<void> {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('[SLAMonitor] Razorpay keys not configured — refund skipped');
    return;
  }

  try {
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          speed:  'optimum',
          notes:  { reason: 'IFP SLA breach — seller did not respond in time' },
        }),
      },
    );

    if (res.ok) {
      const data = await res.json();
      console.log(`[SLAMonitor] Refund initiated: paymentId=${paymentId} refundId=${data.id}`);
    } else {
      const err = await res.text();
      console.error(`[SLAMonitor] Razorpay refund failed (${res.status}):`, err);
    }
  } catch (err: any) {
    console.error('[SLAMonitor] Razorpay refund exception:', err?.message);
  }
}

async function incrementSellerPenalty(orderId: string): Promise<void> {
  try {
    const { data: order } = await supabaseAdmin
      .from('spf_orders')
      .select('seller_id')
      .eq('id', orderId)
      .single();

    if (!order) return;
    const sellerId = (order as any).seller_id;

    await supabaseAdmin
      .rpc('increment_seller_penalty', { p_seller_id: sellerId })
      .then(({ error }) => {
        if (error) {
          // RPC not found → fall back to raw increment
          return supabaseAdmin
            .from('spf_sellers')
            .update({ penalty_count: supabaseAdmin.rpc('coalesce_plus', {} as any) } as any)
            .eq('id', sellerId);
        }
      })
      .catch(() => {
        console.warn(`[SLAMonitor] Could not increment penalty for seller ${sellerId} (column may not exist yet)`);
      });
  } catch (err: any) {
    console.warn('[SLAMonitor] incrementSellerPenalty:', err?.message);
  }
}
