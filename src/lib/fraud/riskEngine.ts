/**
 * IFP Fraud & Risk Scoring Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Evaluates every order placement for fraud signals.
 * Returns a 0–100 score, risk status, and individual flags.
 *
 * Usage:
 *   import { runRiskChecks } from '@/lib/fraud/riskEngine';
 *   const result = await runRiskChecks(input);
 *
 * Score thresholds:
 *   0–29   → CLEAR       → AUTO_CONFIRM
 *   30–60  → SOFT_FLAG   → CONFIRM_WITH_WARNING
 *   61–99  → HOLD        → HOLD_FOR_REVIEW
 *   100    → REJECTED    → REJECT + trigger refund
 *
 * Uses Supabase (no Prisma/DATABASE_URL needed).
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { redisGet, redisSetex } from '@/lib/redis';
import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Score weights (one per rule)
// ─────────────────────────────────────────────────────────────────────────────

const W = {
  AMOUNT_MISMATCH:              100,
  DUPLICATE_TRANSACTION:        100,
  COD_HIGH_VALUE_NEW_CUSTOMER:   35,
  EXCESS_COD_UNDELIVERED:        50,
  HIGH_RTO_PINCODE:              25,
  RAPID_ORDER_AFTER_SIGNUP:      20,
  MULTI_ACCOUNT_DEVICE:          40,
  VELOCITY_BREACH:               30,
  ADDRESS_ABUSE:                 30,
  VPN_PROXY:                     15,
} as const;

// Redis TTLs (seconds)
const TTL = {
  COD_HISTORY:   30 * 60,   // 30 min
  PINCODE_RTO:   60 * 60,   // 60 min
  DEVICE_ACCTS:  60 * 60,   // 60 min
  VELOCITY:      24 * 3600, // 24 hrs
  ADDRESS_ACCTS: 24 * 3600, // 24 hrs
  VPN_LOOKUP:    60 * 60,   // 60 min
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING' | 'COD';
export type RiskStatus    = 'CLEAR' | 'SOFT_FLAG' | 'HOLD' | 'REJECTED';
export type RiskDecision  = 'AUTO_CONFIRM' | 'CONFIRM_WITH_WARNING' | 'HOLD_FOR_REVIEW' | 'REJECT';

export type FlagType =
  | 'AMOUNT_MISMATCH'
  | 'DUPLICATE_TRANSACTION'
  | 'COD_HIGH_VALUE_NEW_CUSTOMER'
  | 'EXCESS_COD_UNDELIVERED'
  | 'HIGH_RTO_PINCODE'
  | 'RAPID_ORDER_AFTER_SIGNUP'
  | 'MULTI_ACCOUNT_DEVICE'
  | 'VELOCITY_BREACH'
  | 'ADDRESS_ABUSE'
  | 'VPN_PROXY';

export interface RiskCheckInput {
  /** UUID of the order already written to spf_orders (risk_status=CLEAR by default) */
  orderId:          string;
  customerId:       string;
  paymentMethod:    PaymentMethod;
  /** Order value in INR (not paise) */
  orderValue:       number;
  /** Razorpay payment_id — used for dedup check */
  transactionId?:   string;
  /** Amount confirmed by payment gateway (INR) */
  pgAmount:         number;
  /** Amount stored in order record (INR) */
  dbAmount:         number;
  /** 10-digit mobile, no country code */
  customerPhone:    string;
  /** Normalized flat string: "house area city state pincode" */
  deliveryAddress:  string;
  /** 6-digit delivery pincode */
  pincode:          string;
  /** Browser/device fingerprint hash — undefined if not collected */
  deviceId?:        string;
  /** Customer IP at order placement */
  ipAddress:        string;
  accountCreatedAt: Date;
}

export interface RiskFlag {
  flagType:          FlagType;
  /** Human-readable evidence string — never contains full PII */
  flagValue:         string;
  scoreContribution: number;
}

export interface RiskResult {
  /** Final score, capped at 100 */
  score:    number;
  status:   RiskStatus;
  flags:    RiskFlag[];
  decision: RiskDecision;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal types
// ─────────────────────────────────────────────────────────────────────────────

interface PincodeCacheEntry { rto_rate: number; is_cod_disabled: boolean }
interface VpnCacheEntry     { is_vpn: boolean }
interface IpApiResponse     { status: string; proxy: boolean; hosting: boolean }

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

function scoreToStatus(score: number): RiskStatus {
  if (score <= 29)  return 'CLEAR';
  if (score <= 60)  return 'SOFT_FLAG';
  if (score <= 99)  return 'HOLD';
  return 'REJECTED';
}

function statusToDecision(s: RiskStatus): RiskDecision {
  switch (s) {
    case 'CLEAR':     return 'AUTO_CONFIRM';
    case 'SOFT_FLAG': return 'CONFIRM_WITH_WARNING';
    case 'HOLD':      return 'HOLD_FOR_REVIEW';
    case 'REJECTED':  return 'REJECT';
  }
}

/** Mask PII: show last 4 digits of phone only */
function maskPhone(phone: string): string {
  return `****${phone.slice(-4)}`;
}

/** Stable 12-char hash for address deduplication */
function addressHash(addr: string): string {
  return crypto
    .createHash('sha256')
    .update(addr.toLowerCase().replace(/\s+/g, ' ').trim())
    .digest('hex')
    .slice(0, 12);
}

/** Read a JSON-serialised value from Redis; returns null on miss/error */
async function rGet<T>(key: string): Promise<T | null> {
  const raw = await redisGet(key);
  if (raw === null) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

/** Write a JSON value to Redis with TTL */
async function rSet(key: string, ttl: number, value: unknown): Promise<void> {
  await redisSetex(key, ttl, JSON.stringify(value));
}

// ─────────────────────────────────────────────────────────────────────────────
// Check 1 — Amount mismatch (synchronous)
// ─────────────────────────────────────────────────────────────────────────────

function checkAmountMismatch(input: RiskCheckInput): RiskFlag | null {
  const diff = Math.abs(input.pgAmount - input.dbAmount);
  if (diff <= 1) return null; // ₹1 rounding tolerance

  return {
    flagType:          'AMOUNT_MISMATCH',
    flagValue:         `pg=₹${input.pgAmount.toFixed(2)},db=₹${input.dbAmount.toFixed(2)},diff=₹${diff.toFixed(2)}`,
    scoreContribution: W.AMOUNT_MISMATCH,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check 2 — Duplicate transaction_id
// ─────────────────────────────────────────────────────────────────────────────

async function checkDuplicateTransaction(input: RiskCheckInput): Promise<RiskFlag | null> {
  if (!input.transactionId) return null;

  const { count } = await supabaseAdmin
    .from('spf_orders')
    .select('id', { count: 'exact', head: true })
    .eq('transaction_id', input.transactionId)
    .neq('id', input.orderId);

  const dupeCount = count ?? 0;
  if (dupeCount === 0) return null;

  return {
    flagType:          'DUPLICATE_TRANSACTION',
    flagValue:         `transaction_id=${input.transactionId},duplicates=${dupeCount}`,
    scoreContribution: W.DUPLICATE_TRANSACTION,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check 3 — COD + first order + value > ₹1500
// ─────────────────────────────────────────────────────────────────────────────

async function checkCodNewCustomerHighValue(input: RiskCheckInput): Promise<RiskFlag | null> {
  if (input.paymentMethod !== 'COD' || input.orderValue <= 1500) return null;

  const { count } = await supabaseAdmin
    .from('spf_orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', input.customerId)
    .neq('id', input.orderId)
    .not('status', 'in', '(PENDING_PAYMENT,PAYMENT_FAILED,CANCELLED)');

  const priorOrders = count ?? 0;
  if (priorOrders > 0) return null;

  return {
    flagType:          'COD_HIGH_VALUE_NEW_CUSTOMER',
    flagValue:         `cod_value=₹${input.orderValue},prior_completed_orders=0`,
    scoreContribution: W.COD_HIGH_VALUE_NEW_CUSTOMER,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check 4 — 3+ undelivered COD orders (same phone, last 30 days)
//           Redis cache: ifp:risk:cod:{phone}  TTL 30 min
// ─────────────────────────────────────────────────────────────────────────────

async function checkExcessUndeliveredCod(input: RiskCheckInput): Promise<RiskFlag | null> {
  if (input.paymentMethod !== 'COD') return null;

  const cacheKey = `ifp:risk:cod:${input.customerPhone}`;
  let undeliveredCount = await rGet<number>(cacheKey);

  if (undeliveredCount === null) {
    const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    const { count } = await supabaseAdmin
      .from('spf_orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_method', 'COD')
      .in('status', ['CANCELLED', 'RETURN_INITIATED', 'RETURNED'])
      .gte('created_at', since30d)
      .filter('shipping_address->>phone', 'eq', input.customerPhone);

    undeliveredCount = count ?? 0;
    await rSet(cacheKey, TTL.COD_HISTORY, undeliveredCount);
  }

  if (undeliveredCount < 3) return null;

  return {
    flagType:          'EXCESS_COD_UNDELIVERED',
    flagValue:         `undelivered_cod_30d=${undeliveredCount},phone=${maskPhone(input.customerPhone)}`,
    scoreContribution: W.EXCESS_COD_UNDELIVERED,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check 5 — High-RTO pincode + COD
//           Redis cache: ifp:risk:pincode:{pincode}  TTL 60 min
// ─────────────────────────────────────────────────────────────────────────────

async function checkHighRtoPincode(input: RiskCheckInput): Promise<RiskFlag | null> {
  if (input.paymentMethod !== 'COD') return null;

  const cacheKey = `ifp:risk:pincode:${input.pincode}`;
  let cfg = await rGet<PincodeCacheEntry>(cacheKey);

  if (cfg === null) {
    const { data: row } = await supabaseAdmin
      .from('spf_pincode_risk_config')
      .select('rto_rate, is_cod_disabled')
      .eq('pincode', input.pincode)
      .maybeSingle();

    if (row) {
      cfg = {
        rto_rate:        parseFloat(String(row.rto_rate)),
        is_cod_disabled: (row as any).is_cod_disabled,
      };
    } else {
      cfg = { rto_rate: 0, is_cod_disabled: false };
    }
    await rSet(cacheKey, TTL.PINCODE_RTO, cfg);
  }

  if (cfg.rto_rate <= 0.30) return null;

  return {
    flagType:          'HIGH_RTO_PINCODE',
    flagValue:         `pincode=${input.pincode},rto_rate=${(cfg.rto_rate * 100).toFixed(1)}%,cod_disabled=${cfg.is_cod_disabled}`,
    scoreContribution: W.HIGH_RTO_PINCODE,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check 6 — Order placed < 2 minutes after account creation (synchronous)
// ─────────────────────────────────────────────────────────────────────────────

function checkRapidSignupOrder(input: RiskCheckInput): RiskFlag | null {
  const TWO_MIN_MS = 2 * 60 * 1000;
  const elapsed = Date.now() - input.accountCreatedAt.getTime();
  if (elapsed >= TWO_MIN_MS) return null;

  return {
    flagType:          'RAPID_ORDER_AFTER_SIGNUP',
    flagValue:         `elapsed_ms=${elapsed},threshold_ms=${TWO_MIN_MS}`,
    scoreContribution: W.RAPID_ORDER_AFTER_SIGNUP,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check 7 — Same device_id across 3+ distinct customer accounts (last 90 days)
//           Redis cache: ifp:risk:device:{deviceId}  TTL 60 min
// ─────────────────────────────────────────────────────────────────────────────

async function checkMultiAccountDevice(input: RiskCheckInput): Promise<RiskFlag | null> {
  if (!input.deviceId) return null;

  const cacheKey = `ifp:risk:device:${input.deviceId}`;
  let distinctAccounts = await rGet<number>(cacheKey);

  if (distinctAccounts === null) {
    const since90d = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();

    const { data: rows } = await supabaseAdmin
      .from('spf_orders')
      .select('customer_id')
      .like('notes', `%device:${input.deviceId}%`)
      .gte('created_at', since90d)
      .neq('id', input.orderId);

    distinctAccounts = new Set((rows ?? []).map((r: any) => r.customer_id)).size;
    await rSet(cacheKey, TTL.DEVICE_ACCTS, distinctAccounts);
  }

  if (distinctAccounts < 3) return null;

  return {
    flagType:          'MULTI_ACCOUNT_DEVICE',
    flagValue:         `device_id=${input.deviceId.slice(0, 8)}…,distinct_accounts=${distinctAccounts}`,
    scoreContribution: W.MULTI_ACCOUNT_DEVICE,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check 8 — 3+ orders from same phone in 24 hours
//           Redis cache: ifp:risk:velocity:{phone}  TTL 24 hrs
// ─────────────────────────────────────────────────────────────────────────────

async function checkOrderVelocity(input: RiskCheckInput): Promise<RiskFlag | null> {
  const cacheKey = `ifp:risk:velocity:${input.customerPhone}`;
  let orders24h = await rGet<number>(cacheKey);

  if (orders24h === null) {
    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const { count } = await supabaseAdmin
      .from('spf_orders')
      .select('id', { count: 'exact', head: true })
      .filter('shipping_address->>phone', 'eq', input.customerPhone)
      .gte('created_at', since24h)
      .not('status', 'in', '(PAYMENT_FAILED,CANCELLED)')
      .neq('id', input.orderId);

    orders24h = count ?? 0;
    await rSet(cacheKey, TTL.VELOCITY, orders24h);
  }

  if (orders24h < 3) return null;

  return {
    flagType:          'VELOCITY_BREACH',
    flagValue:         `orders_24h=${orders24h},phone=${maskPhone(input.customerPhone)}`,
    scoreContribution: W.VELOCITY_BREACH,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check 9 — 5+ distinct customer accounts using same delivery address (90 days)
//           Redis cache: ifp:risk:addr:{hash}  TTL 24 hrs
// ─────────────────────────────────────────────────────────────────────────────

async function checkAddressAbuse(input: RiskCheckInput): Promise<RiskFlag | null> {
  const addrH    = addressHash(input.deliveryAddress);
  const cacheKey = `ifp:risk:addr:${addrH}`;
  let distinctCustomers = await rGet<number>(cacheKey);

  if (distinctCustomers === null) {
    const since90d = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
    const normalizedInput = input.deliveryAddress.toLowerCase().trim().replace(/\s+/g, ' ');

    const { data: rows } = await supabaseAdmin
      .from('spf_orders')
      .select('customer_id, shipping_address')
      .filter('shipping_address->>pincode', 'eq', input.pincode)
      .gte('created_at', since90d)
      .neq('id', input.orderId);

    distinctCustomers = new Set(
      (rows ?? []).filter((r: any) => {
        const addr = r.shipping_address;
        if (!addr) return false;
        const rowAddr = `${addr.house ?? ''} ${addr.area ?? ''}`.toLowerCase().trim().replace(/\s+/g, ' ');
        return rowAddr === normalizedInput;
      }).map((r: any) => r.customer_id),
    ).size;

    await rSet(cacheKey, TTL.ADDRESS_ACCTS, distinctCustomers);
  }

  if (distinctCustomers < 5) return null;

  return {
    flagType:          'ADDRESS_ABUSE',
    flagValue:         `addr_hash=${addrH},distinct_customers=${distinctCustomers},pincode=${input.pincode}`,
    scoreContribution: W.ADDRESS_ABUSE,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check 10 — VPN / proxy IP detection (ip-api.com free tier)
//            Redis cache: ifp:risk:vpn:{ip}  TTL 60 min
// ─────────────────────────────────────────────────────────────────────────────

/** RFC-1918 / loopback / link-local — skip API call for these */
const PRIVATE_IP_RE =
  /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1$|localhost$|^$)/;

async function checkVpnProxy(input: RiskCheckInput): Promise<RiskFlag | null> {
  if (PRIVATE_IP_RE.test(input.ipAddress)) return null;

  const cacheKey = `ifp:risk:vpn:${input.ipAddress}`;
  let cached = await rGet<VpnCacheEntry>(cacheKey);

  if (cached === null) {
    let isVpn = false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3_000); // 3 s hard timeout

      const res = await fetch(
        `http://ip-api.com/json/${encodeURIComponent(input.ipAddress)}?fields=status,proxy,hosting`,
        { signal: controller.signal, cache: 'no-store' }
      );
      clearTimeout(timer);

      if (res.ok) {
        const data: IpApiResponse = await res.json();
        isVpn = data.status === 'success' && (data.proxy === true || data.hosting === true);
      }
    } catch {
      // Network error or timeout — fail open (do not penalise)
      isVpn = false;
    }
    cached = { is_vpn: isVpn };
    await rSet(cacheKey, TTL.VPN_LOOKUP, cached);
  }

  if (!cached.is_vpn) return null;

  return {
    flagType:          'VPN_PROXY',
    flagValue:         `ip=${input.ipAddress}`,
    scoreContribution: W.VPN_PROXY,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs all 10 fraud checks in parallel, sums scores (capped at 100),
 * persists flags + updates order + upserts customer risk profile.
 */
export async function runRiskChecks(input: RiskCheckInput): Promise<RiskResult> {
  // ── Run all checks in parallel (none depend on each other) ────────────────
  const results = await Promise.allSettled([
    Promise.resolve(checkAmountMismatch(input)),       // 0
    checkDuplicateTransaction(input),                  // 1
    checkCodNewCustomerHighValue(input),               // 2
    checkExcessUndeliveredCod(input),                  // 3
    checkHighRtoPincode(input),                        // 4
    Promise.resolve(checkRapidSignupOrder(input)),     // 5
    checkMultiAccountDevice(input),                    // 6
    checkOrderVelocity(input),                         // 7
    checkAddressAbuse(input),                          // 8
    checkVpnProxy(input),                              // 9
  ]);

  // Collect non-null flags; log any unexpected check failures
  const flags: RiskFlag[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value !== null) {
      flags.push(r.value);
    } else if (r.status === 'rejected') {
      console.error('[RiskEngine] check threw:', r.reason);
    }
  }

  // ── Score calculation ─────────────────────────────────────────────────────
  const rawScore = flags.reduce((sum, f) => sum + f.scoreContribution, 0);
  const score    = Math.min(rawScore, 100);
  const status   = scoreToStatus(score);
  const decision = statusToDecision(status);

  // ── Persist all writes (non-fatal — never block order flow) ───────────────
  try {
    // 1. Write one risk flag row per triggered signal
    if (flags.length > 0) {
      await supabaseAdmin.from('spf_order_risk_flags').insert(
        flags.map((f) => ({
          order_id:          input.orderId,
          flag_type:         f.flagType,
          flag_value:        f.flagValue,
          score_contribution: f.scoreContribution,
        })),
      );
    }

    // 2. Update order.risk_score + order.risk_status
    await supabaseAdmin
      .from('spf_orders')
      .update({
        risk_score:  score,
        risk_status: status,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', input.orderId);

    // 3. Upsert customer risk profile
    const isHoldOrReject = status === 'HOLD' || status === 'REJECTED';

    const { data: existingProfile } = await supabaseAdmin
      .from('spf_customer_risk_profiles')
      .select('total_cod_orders, fraud_hold_count, is_blocked, block_reason, last_fraud_hold_at')
      .eq('customer_id', input.customerId)
      .maybeSingle();

    if (existingProfile) {
      const updates: Record<string, any> = {
        last_updated: new Date().toISOString(),
      };
      if (input.paymentMethod === 'COD') {
        updates.total_cod_orders = (existingProfile.total_cod_orders ?? 0) + 1;
      }
      if (isHoldOrReject) {
        updates.fraud_hold_count  = (existingProfile.fraud_hold_count ?? 0) + 1;
        updates.last_fraud_hold_at = new Date().toISOString();
      }
      if (status === 'REJECTED') {
        updates.is_blocked   = true;
        updates.block_reason = `Auto-blocked at order placement: risk_score=${score}`;
      }
      await supabaseAdmin
        .from('spf_customer_risk_profiles')
        .update(updates)
        .eq('customer_id', input.customerId);
    } else {
      await supabaseAdmin
        .from('spf_customer_risk_profiles')
        .insert({
          customer_id:           input.customerId,
          total_cod_orders:      input.paymentMethod === 'COD' ? 1 : 0,
          undelivered_cod_count: 0,
          rto_count:             0,
          fraud_hold_count:      isHoldOrReject ? 1 : 0,
          last_fraud_hold_at:    isHoldOrReject ? new Date().toISOString() : null,
          is_blocked:            status === 'REJECTED',
          block_reason:          status === 'REJECTED'
            ? `Auto-blocked at order placement: risk_score=${score}`
            : null,
        });
    }
  } catch (persistErr: any) {
    console.error('[RiskEngine] Persist error (non-fatal):', persistErr?.message);
  }

  console.log(
    `[RiskEngine] orderId=${input.orderId} score=${score} status=${status} flags=[${flags.map(f => f.flagType).join(',')}]`
  );

  return { score, status, flags, decision };
}
