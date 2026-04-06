/**
 * SLA Monitor — scans active orders every 15 minutes (via /api/cron/sla-check).
 *
 * SLA rules:
 *   ACCEPTANCE SLA: Seller must accept within 2 hrs of order CONFIRMATION.
 *                   Status tracked: SELLER_NOTIFIED → acceptance_sla_deadline
 *   PACKING SLA:    Seller must pack within 4 hrs of acceptance.
 *                   Status tracked: ACCEPTED        → packing_sla_deadline
 *
 * Actions:
 *   30 min before deadline  → send warning (once, guarded by Redis flag)
 *   Deadline passed         → auto-cancel, notify seller + customer, refund if prepaid
 */

import prisma from '@/lib/prisma';
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
  const now         = new Date();
  const warnCutoff  = new Date(now.getTime() + WARN_WINDOW_MS); // now + 30 min

  let warned   = 0;
  let breached = 0;

  // ── Acceptance SLA: orders waiting for seller to accept ───────────────────
  const [acceptWarn, acceptBreach] = await Promise.all([
    // Warning window: deadline is within 30 min but hasn't passed yet
    prisma.order.findMany({
      where: {
        status:                'SELLER_NOTIFIED' as any,
        acceptanceSlaDeadline: { gt: now, lte: warnCutoff },
      },
      select: { id: true, orderNumber: true, acceptanceSlaDeadline: true },
    }),
    // Breached: deadline has already passed
    prisma.order.findMany({
      where: {
        status:                'SELLER_NOTIFIED' as any,
        acceptanceSlaDeadline: { lte: now },
      },
      select: {
        id: true, orderNumber: true, customerId: true,
        transactionId: true, paymentMethod: true,
        subtotal: true, shippingCharge: true,
      },
    }),
  ]);

  // ── Packing SLA: orders accepted but not yet packed ───────────────────────
  const [packWarn, packBreach] = await Promise.all([
    prisma.order.findMany({
      where: {
        status:              'ACCEPTED' as any,
        packingSlaDeadline:  { gt: now, lte: warnCutoff },
      },
      select: { id: true, orderNumber: true, packingSlaDeadline: true },
    }),
    prisma.order.findMany({
      where: {
        status:             'ACCEPTED' as any,
        packingSlaDeadline: { lte: now },
      },
      select: {
        id: true, orderNumber: true, customerId: true,
        transactionId: true, paymentMethod: true,
        subtotal: true, shippingCharge: true,
      },
    }),
  ]);

  const totalChecked =
    acceptWarn.length + acceptBreach.length +
    packWarn.length   + packBreach.length;

  // ── Send warnings ─────────────────────────────────────────────────────────
  for (const order of acceptWarn) {
    const sent = await sendWarningOnce(order.id, 'ACCEPTANCE');
    if (sent) warned++;
  }
  for (const order of packWarn) {
    const sent = await sendWarningOnce(order.id, 'PACKING');
    if (sent) warned++;
  }

  // ── Handle breaches ───────────────────────────────────────────────────────
  for (const order of acceptBreach) {
    await handleSlaBreached(order, 'ACCEPTANCE');
    breached++;
  }
  for (const order of packBreach) {
    await handleSlaBreached(order, 'PACKING');
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
  id:            string;
  orderNumber:   string;
  customerId:    string;
  transactionId: string | null;
  paymentMethod: string | null;
  subtotal:      any; // Prisma Decimal
  shippingCharge:any;
}

async function handleSlaBreached(order: BreachOrder, slaType: SlaType): Promise<void> {
  // Guard against processing the same breach twice (race conditions)
  const breachKey = `ifp:sla:breached:${order.id}:${slaType}`;
  const alreadyBreached = await redisGet(breachKey);
  if (alreadyBreached) return;
  await redisSetex(breachKey, 86400, '1'); // lock for 24 hrs

  console.log(`[SLAMonitor] SLA BREACH orderId=${order.id} type=${slaType}`);

  // ── 1. Cancel the order + write history ────────────────────────────────────
  const note = slaType === 'ACCEPTANCE'
    ? 'Auto-cancelled: seller did not accept within 2-hour SLA window'
    : 'Auto-cancelled: seller did not pack within 4-hour SLA window';

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data:  { status: 'CANCELLED' as any },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId:    order.id,
        fromStatus: slaType === 'ACCEPTANCE' ? 'SELLER_NOTIFIED' as any : 'ACCEPTED' as any,
        toStatus:   'CANCELLED' as any,
        actorType:  'SYSTEM'   as any,
        note,
      },
    }),
  ]);

  // ── 2. Notify seller ────────────────────────────────────────────────────────
  await notifySellerSlaBreached(order.id, slaType);

  // ── 3. Notify customer + trigger refund ────────────────────────────────────
  const isPrepaid = order.paymentMethod !== null && order.paymentMethod !== 'COD';
  const orderTotal = Number(order.subtotal) + Number(order.shippingCharge);

  const customerEmail = await getCustomerEmail(order.customerId);
  if (customerEmail) {
    await notifyCustomerOrderCancelled(
      order.id,
      customerEmail,
      order.orderNumber,
      orderTotal,
      isPrepaid,
    );
  }

  if (isPrepaid && order.transactionId) {
    await triggerPgRefund(order.transactionId, Math.round(orderTotal * 100));
  }

  // ── 4. Increment seller penalty count ─────────────────────────────────────
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
    // Using fetch directly (avoids Razorpay SDK import overhead in cron)
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
    // Fetch sellerId from the order
    const order = await prisma.order.findUnique({
      where:  { id: orderId },
      select: { sellerId: true },
    });
    if (!order) return;

    // Increment penalty_count on spf_sellers (column may not exist yet — graceful)
    await supabaseAdmin.rpc('increment_seller_penalty', { p_seller_id: order.sellerId })
      .then(({ error }) => {
        if (error) {
          // RPC not found → fall back to raw increment
          return supabaseAdmin
            .from('spf_sellers')
            .update({ penalty_count: supabaseAdmin.rpc('coalesce_plus', {} as any) } as any)
            .eq('id', order.sellerId);
        }
      })
      .catch(() => {
        // Column or RPC does not exist yet — log and move on
        console.warn(`[SLAMonitor] Could not increment penalty for seller ${order.sellerId} (column may not exist yet)`);
      });
  } catch (err: any) {
    console.warn('[SLAMonitor] incrementSellerPenalty:', err?.message);
  }
}
