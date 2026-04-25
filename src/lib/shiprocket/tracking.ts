/**
 * Shiprocket tracking sync — pulls live status for an IFP order by AWB
 * and mirrors it into spf_orders + spf_order_status_history.
 *
 * Status mapping (Shiprocket string → IFP OrderStatus enum):
 *   Picked Up          → IN_TRANSIT
 *   In Transit         → IN_TRANSIT
 *   Out for Delivery   → OUT_FOR_DELIVERY
 *   Delivered          → DELIVERED
 *   RTO Initiated      → RETURN_INITIATED
 *   Return             → RETURNED
 *   Cancelled          → CANCELLED
 *   (anything else)    → no update (silently skipped)
 */

import prisma from '@/lib/prisma';
import { shiprocketClient } from './client';

// ─── Shiprocket → IFP status map ─────────────────────────────────────────────
// Keys are lowercase-trimmed Shiprocket `current_status` strings.

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

// ─── Shiprocket tracking response shape (minimal) ────────────────────────────

interface TrackingActivity {
  date?:           string;
  activity?:       string;
  location?:       string;
  sr_status_label?: string;
}

interface TrackingData {
  awb_code?:        string;
  courier_name?:    string;
  current_status?:  string;
  delivered_date?:  string;
  edd?:             string; // estimated delivery date
  shipment_track?:  TrackingActivity[];
  shipment_track_activities?: TrackingActivity[];
}

interface TrackResponse {
  tracking_data: TrackingData;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported function
// ─────────────────────────────────────────────────────────────────────────────

export interface SyncResult {
  updated:    boolean;
  newStatus?: string;
  error?:     string;
}

/**
 * Fetch latest tracking from Shiprocket and apply it to the IFP order.
 * Idempotent — safe to call multiple times for the same event.
 */
export async function syncTrackingStatus(orderId: string): Promise<SyncResult> {
  // ── Fetch order + current AWB ──────────────────────────────────────────────
  const order = await prisma.order.findUnique({
    where:  { id: orderId },
    select: { id: true, status: true, awbNumber: true, sellerId: true },
  });

  if (!order) return { updated: false, error: `Order ${orderId} not found` };

  if (!order.awbNumber) {
    return { updated: false, error: `Order ${orderId} has no AWB yet` };
  }

  // ── Fetch tracking from Shiprocket ────────────────────────────────────────
  let trackData: TrackingData;
  try {
    const res = await shiprocketClient.request<TrackResponse>(
      'GET',
      `/courier/track/awb/${encodeURIComponent(order.awbNumber)}`,
    );
    trackData = res.tracking_data;
  } catch (err: any) {
    console.error(`[SR:tracking] fetch failed for AWB ${order.awbNumber}:`, err.message);
    return { updated: false, error: err.message };
  }

  const rawStatus = (trackData.current_status ?? '').toLowerCase().trim();
  const newStatus  = STATUS_MAP[rawStatus];

  // No mapping → nothing to update
  if (!newStatus) {
    console.log(`[SR:tracking] AWB ${order.awbNumber} status "${rawStatus}" has no IFP mapping — skipped`);
    return { updated: false };
  }

  // Already at this status → skip (idempotent)
  if ((order.status as string) === newStatus) {
    return { updated: false };
  }

  // ── Build order update payload ────────────────────────────────────────────
  const now        = new Date();
  const orderPatch: Record<string, any> = { status: newStatus as any };

  if (newStatus === 'IN_TRANSIT' && !(order as any).pickedUpAt) {
    orderPatch.pickedUpAt = now;
  }
  if (newStatus === 'DELIVERED') {
    const deliveredAt              = trackData.delivered_date
      ? new Date(trackData.delivered_date)
      : now;
    orderPatch.deliveredAt          = deliveredAt;
    // Customer has 7 days to initiate a return
    orderPatch.returnWindowClosesAt = new Date(
      deliveredAt.getTime() + 7 * 24 * 3600 * 1000,
    );
  }
  if (newStatus === 'RETURN_INITIATED' || newStatus === 'RETURNED') {
    orderPatch.notes = `RTO: ${trackData.current_status}`;
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

  // ── Persist atomically ────────────────────────────────────────────────────
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data:  orderPatch,
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus:   newStatus     as any,
        actorType:  'COURIER'     as any,
        actorId:    trackData.courier_name ?? null,
        note:       historyNote  || null,
      },
    }),
  ]);

  console.log(
    `[SR:tracking] orderId=${orderId} AWB=${order.awbNumber} ${order.status} → ${newStatus}`,
  );

  return { updated: true, newStatus };
}
