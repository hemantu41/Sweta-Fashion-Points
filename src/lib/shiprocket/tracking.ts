/**
 * Shiprocket tracking sync — pulls live status for an IFP order by AWB
 * and mirrors it into spf_orders + spf_order_status_history.
 *
 * Uses supabaseAdmin directly (no Prisma / DATABASE_URL needed).
 *
 * Status mapping (Shiprocket string → IFP OrderStatus):
 *   Pickup Scheduled   → PICKUP_SCHEDULED
 *   Picked Up          → IN_TRANSIT
 *   In Transit         → IN_TRANSIT
 *   Out for Delivery   → OUT_FOR_DELIVERY
 *   Delivered          → DELIVERED
 *   RTO Initiated      → RETURN_INITIATED
 *   Return / Returned  → RETURNED
 *   Cancelled / Lost   → CANCELLED
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { shiprocketClient } from './client';
import { invalidateSellerKeys } from '@/lib/sellerCache';

// ─── Shiprocket → IFP status map ─────────────────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  'pickup scheduled':   'PICKUP_SCHEDULED',
  'picked up':          'IN_TRANSIT',
  'in transit':         'IN_TRANSIT',
  'out for delivery':   'OUT_FOR_DELIVERY',
  'delivered':          'DELIVERED',
  'rto initiated':      'RETURN_INITIATED',
  'rto':                'RETURN_INITIATED',
  'return':             'RETURNED',
  'returned':           'RETURNED',
  'cancelled':          'CANCELLED',
  'shipment cancelled': 'CANCELLED',
  'lost':               'CANCELLED',
};

// ─── Shiprocket tracking response shape ──────────────────────────────────────

interface TrackingActivity {
  date?:            string;
  activity?:        string;
  location?:        string;
  sr_status_label?: string;
}

interface TrackingData {
  awb_code?:                   string;
  courier_name?:               string;
  current_status?:             string;
  delivered_date?:             string;
  edd?:                        string;
  shipment_track?:             TrackingActivity[];
  shipment_track_activities?:  TrackingActivity[];
}

interface TrackResponse {
  tracking_data: TrackingData;
}

export interface SyncResult {
  updated:    boolean;
  newStatus?: string;
  error?:     string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch latest tracking from Shiprocket and apply it to the IFP order.
 * Idempotent — safe to call multiple times for the same event.
 */
export async function syncTrackingStatus(orderId: string): Promise<SyncResult> {
  // ── Fetch order from spf_orders ──────────────────────────────────────────
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('spf_orders')
    .select('id, status, awb_number, seller_id, picked_up_at')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return { updated: false, error: `Order ${orderId} not found` };
  }

  const o = order as any;

  if (!o.awb_number) {
    return { updated: false, error: `Order ${orderId} has no AWB yet` };
  }

  // ── Fetch tracking from Shiprocket ────────────────────────────────────────
  let trackData: TrackingData;
  try {
    const res = await shiprocketClient.request<TrackResponse>(
      'GET',
      `/courier/track/awb/${encodeURIComponent(o.awb_number)}`,
    );
    trackData = res.tracking_data;
  } catch (err: any) {
    console.error(`[SR:tracking] fetch failed for AWB ${o.awb_number}:`, err.message);
    return { updated: false, error: err.message };
  }

  const rawStatus = (trackData.current_status ?? '').toLowerCase().trim();
  const newStatus = STATUS_MAP[rawStatus];

  if (!newStatus) {
    console.log(`[SR:tracking] AWB ${o.awb_number} status "${rawStatus}" has no IFP mapping — skipped`);
    return { updated: false };
  }

  if (o.status === newStatus) {
    return { updated: false }; // already up-to-date
  }

  // ── Build update payload ──────────────────────────────────────────────────
  const now = new Date().toISOString();
  const patch: Record<string, any> = { status: newStatus, updated_at: now };

  if (newStatus === 'IN_TRANSIT' && !o.picked_up_at) {
    patch.picked_up_at = now;
  }
  if (newStatus === 'OUT_FOR_DELIVERY') {
    // no extra timestamp column for this status
  }
  if (newStatus === 'DELIVERED') {
    const deliveredAt = trackData.delivered_date
      ? new Date(trackData.delivered_date).toISOString()
      : now;
    patch.delivered_at            = deliveredAt;
    patch.return_window_closes_at = new Date(
      new Date(deliveredAt).getTime() + 7 * 24 * 3600 * 1000,
    ).toISOString();
  }
  if (newStatus === 'RETURN_INITIATED' || newStatus === 'RETURNED') {
    patch.notes = `RTO: ${trackData.current_status}`;
  }

  // ── Latest scan for history note ──────────────────────────────────────────
  const activities: TrackingActivity[] =
    trackData.shipment_track_activities ??
    trackData.shipment_track           ??
    [];
  const latestScan = activities[0];
  const historyNote = [
    trackData.current_status,
    latestScan?.location ? `@ ${latestScan.location}` : '',
    latestScan?.activity ?? latestScan?.sr_status_label ?? '',
  ]
    .filter(Boolean)
    .join(' | ');

  // ── Persist: update spf_orders + insert status history ───────────────────
  const [updateResult] = await Promise.all([
    supabaseAdmin.from('spf_orders').update(patch).eq('id', orderId),
    supabaseAdmin.from('spf_order_status_history').insert({
      order_id:   orderId,
      from_status: o.status,
      to_status:   newStatus,
      actor_type:  'COURIER',
      actor_id:    trackData.courier_name ?? null,
      note:        historyNote || null,
      created_at:  now,
    }),
  ]);

  if (updateResult.error) {
    console.error(`[SR:tracking] DB update failed for ${orderId}:`, updateResult.error.message);
    return { updated: false, error: updateResult.error.message };
  }

  // Invalidate seller's Redis order cache so dashboard shows fresh status
  if (o.seller_id) {
    invalidateSellerKeys(o.seller_id, 'orders').catch(() => {});
  }

  console.log(
    `[SR:tracking] orderId=${orderId} AWB=${o.awb_number} ${o.status} → ${newStatus}`,
  );

  return { updated: true, newStatus };
}
