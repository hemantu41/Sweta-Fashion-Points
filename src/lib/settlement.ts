/**
 * Settlement cycle utilities for Insta Fashion Points seller payouts.
 * Payouts happen every Monday (weekly cycle).
 */

export interface SettlementCycle {
  id: string;
  sellerId: string;
  periodStart: string;   // YYYY-MM-DD
  periodEnd: string;     // YYYY-MM-DD
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  orderCount: number;
  status: 'pending' | 'processing' | 'paid' | 'on_hold';
  payoutDate: string | null;
  paymentReference: string | null;
  createdAt: string;
}

/** Returns the next Monday at midnight IST as a JS Date */
export function getNextPayoutDate(from: Date = new Date()): Date {
  const d = new Date(from);
  const day = d.getDay(); // 0=Sun, 1=Mon
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns the last Monday (start of current cycle) */
export function getCurrentCycleStart(from: Date = new Date()): Date {
  const d = new Date(from);
  const day = d.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysSinceMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Formats a date as DD Mon YYYY */
export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Commission rate — 10% platform fee */
export const COMMISSION_RATE = 0.10;

export function calculateSettlement(grossAmount: number) {
  const commissionAmount = Math.round(grossAmount * COMMISSION_RATE);
  const netAmount = grossAmount - commissionAmount;
  return { grossAmount, commissionAmount, netAmount };
}

/** Build settlement cycles from raw earnings rows (client-side aggregation fallback) */
export interface EarningRow {
  id: string;
  order_date: string;
  seller_earning: number | string;
  commission_amount: number | string;
  payment_status: string;
  order_number?: string;
}

export function buildCyclesFromEarnings(earnings: EarningRow[]): SettlementCycle[] {
  // Group by Monday-Sunday week
  const cycleMap: Record<string, {
    start: Date; end: Date; rows: EarningRow[];
  }> = {};

  for (const e of earnings) {
    const d = new Date(e.order_date);
    const day = d.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - daysSinceMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const key = monday.toISOString().split('T')[0];
    if (!cycleMap[key]) cycleMap[key] = { start: monday, end: sunday, rows: [] };
    cycleMap[key].rows.push(e);
  }

  return Object.entries(cycleMap)
    .sort(([a], [b]) => b.localeCompare(a)) // newest first
    .map(([key, cycle], i) => {
      const gross = cycle.rows.reduce((s, r) => s + parseFloat(r.seller_earning.toString()), 0);
      const commission = cycle.rows.reduce((s, r) => s + parseFloat((r.commission_amount || 0).toString()), 0);
      const net = gross - commission;
      const statuses = cycle.rows.map(r => r.payment_status);
      const status: SettlementCycle['status'] =
        statuses.every(s => s === 'paid' || s === 'settled') ? 'paid' :
        statuses.some(s => s === 'processing') ? 'processing' :
        'pending';

      const payoutDate = new Date(cycle.end);
      payoutDate.setDate(cycle.end.getDate() + 1); // next Monday after cycle end

      return {
        id: `cycle-${key}`,
        sellerId: '',
        periodStart: cycle.start.toISOString().split('T')[0],
        periodEnd: cycle.end.toISOString().split('T')[0],
        grossAmount: Math.round(gross),
        commissionAmount: Math.round(commission),
        netAmount: Math.round(net),
        orderCount: cycle.rows.length,
        status,
        payoutDate: status === 'paid' ? payoutDate.toISOString().split('T')[0] : getNextPayoutDate().toISOString().split('T')[0],
        paymentReference: null,
        createdAt: new Date().toISOString(),
      } as SettlementCycle;
    });
}
