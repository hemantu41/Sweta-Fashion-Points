/**
 * Shiprocket tracking — two modes:
 *
 *  1. applyStatusFromPayload(orderId, status, meta)
 *     Called by the webhook handler with data already in the payload.
 *     NO extra Shiprocket API call — reliable, fast, used on every webhook.
 *
 *  2. syncTrackingStatus(orderId)
 *     Calls the Shiprocket tracking API to pull the latest status.
 *     Used by the admin manual-sync endpoint only.
 *
 * Both write to spf_orders + spf_order_status_history + spf_shipments +
 * spf_shipment_tracking and invalidate the seller Redis cache.
 *
 * Uses supabaseAdmin directly (no Prisma / DATABASE_URL needed).
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { shiprocketClient } from './client';
import { invalidateSellerKeys } from '@/lib/sellerCache';

// ─── Shiprocket string → IFP OrderStatus ─────────────────────────────────────

export const STATUS_MAP: Record<string, string> = {
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

// IFP enum → legacy spf_shipments status
const LEGACY_STATUS_MAP: Record<string, string> = {
  PICKUP_SCHEDULED: 'pickup_scheduled',
  IN_TRANSIT:       'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED:        'delivered',
  RETURN_INITIATED: 'rto_initiated',
  RETURNED:         'rto_delivered',
  CANCELLED:        'cancelled',
};

export interface SyncResult {
  updated:    boolean;
  newStatus?: string;
  error?:     string;
}

interface ApplyMeta {
  courierName?:  string | null;
  deliveredAt?:  string | null;
  location?:     string | null;
  description?:  string | null;
  note?:         string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core DB writer — shared by both webhook and manual-sync paths
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply a resolved IFP status to spf_orders, log status history,
 * and keep spf_shipments in sync. Idempotent.
 */
export async function applyStatusFromPayload(
  orderId:   string,
  newStatus: string,
  meta:      ApplyMeta = {},
): Promise<SyncResult> {
  // Fetch current order state
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('spf_orders')
    .select('id, status, awb_number, seller_id, picked_up_at')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return { updated: false, error: `Order ${orderId} not found` };
  }

  const o = order as any;

  if (o.status === newStatus) {
    console.log(`[SR:tracking] orderId=${orderId} already at ${newStatus} — skipped`);
    return { updated: false };
  }

  const now = new Date().toISOString();

  // Build spf_orders update
  const patch: Record<string, any> = { status: newStatus, updated_at: now };

  if (newStatus === 'IN_TRANSIT' && !o.picked_up_at) {
    patch.picked_up_at = now;
  }
  if (newStatus === 'DELIVERED') {
    const deliveredAt = meta.deliveredAt
      ? new Date(meta.deliveredAt).toISOString()
      : now;
    patch.delivered_at            = deliveredAt;
    patch.return_window_closes_at = new Date(
      new Date(deliveredAt).getTime() + 7 * 24 * 3600 * 1000,
    ).toISOString();
  }
  if (newStatus === 'RETURN_INITIATED' || newStatus === 'RETURNED') {
    patch.notes = meta.note || `RTO: ${newStatus}`;
  }

  const historyNote = meta.note || [
    meta.description,
    meta.location ? `@ ${meta.location}` : '',
  ].filter(Boolean).join(' | ') || null;

  // Persist: update spf_orders + insert status history
  const [updateResult] = await Promise.all([
    supabaseAdmin.from('spf_orders').update(patch).eq('id', orderId),
    supabaseAdmin.from('spf_order_status_history').insert({
      order_id:    orderId,
      from_status: o.status,
      to_status:   newStatus,
      actor_type:  'COURIER',
      actor_id:    meta.courierName ?? null,
      note:        historyNote,
      created_at:  now,
    }),
  ]);

  if (updateResult.error) {
    console.error(`[SR:tracking] DB update failed for ${orderId}:`, updateResult.error.message);
    return { updated: false, error: updateResult.error.message };
  }

  // Also keep spf_shipments + spf_shipment_tracking in sync (fire-and-forget)
  void (async () => {
    try {
      if (!o.awb_number) return;
      const { data: legacyShipment } = await supabaseAdmin
        .from('spf_shipments')
        .select('id, status')
        .eq('awb_number', o.awb_number)
        .maybeSingle();

      if (!legacyShipment) return;

      const legacyNew = LEGACY_STATUS_MAP[newStatus];
      if (legacyNew && legacyNew !== (legacyShipment as any).status) {
        const shipPatch: Record<string, any> = { status: legacyNew, updated_at: now };
        if (newStatus === 'IN_TRANSIT') shipPatch.picked_up_at = now;
        if (newStatus === 'DELIVERED')  shipPatch.delivered_at = patch.delivered_at ?? now;
        await supabaseAdmin.from('spf_shipments').update(shipPatch).eq('id', (legacyShipment as any).id);
      }

      await supabaseAdmin.from('spf_shipment_tracking').insert({
        shipment_id: (legacyShipment as any).id,
        status:      newStatus,
        location:    meta.location   ?? null,
        description: historyNote,
        created_at:  now,
      });
    } catch (e: any) {
      console.warn('[SR:tracking] spf_shipments sync error (non-critical):', e?.message);
    }
  })();

  // On delivery: create spf_seller_earnings rows if the Razorpay webhook missed them (fire-and-forget)
  if (newStatus === 'DELIVERED') {
    void (async () => {
      try {
        // Idempotency: skip if earnings already exist for this order
        const { data: existing } = await supabaseAdmin
          .from('spf_seller_earnings')
          .select('id')
          .eq('order_id', orderId)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`[SR:tracking] Earnings already exist for order ${orderId} — skipped`);
          return;
        }

        // Fetch order with line items
        const { data: fullOrder } = await supabaseAdmin
          .from('spf_orders')
          .select(`
            id, order_number, seller_id,
            spf_order_items ( product_id, product_name, quantity, unit_price )
          `)
          .eq('id', orderId)
          .single();

        if (!fullOrder) return;

        const items: any[] = (fullOrder as any).spf_order_items || [];
        if (items.length === 0) {
          // Fallback: fetch items directly in case the join returned nothing
          const { data: directItems } = await supabaseAdmin
            .from('spf_order_items')
            .select('product_id, product_name, quantity, unit_price')
            .eq('order_id', orderId);
          items.push(...(directItems || []));
        }

        if (items.length === 0) {
          console.warn(`[SR:tracking] No items found for order ${orderId} — earnings skipped`);
          return;
        }

        // Fetch seller commission rate
        const { data: seller } = await supabaseAdmin
          .from('spf_sellers')
          .select('commission_percentage')
          .eq('id', (fullOrder as any).seller_id)
          .maybeSingle();

        const commissionPct = (seller as any)?.commission_percentage ?? 0;

        const earningRows = items.map((item: any) => {
          const totalItemPrice   = Number(item.unit_price) * Number(item.quantity);
          const commissionAmount = totalItemPrice * (commissionPct / 100);
          return {
            seller_id:             (fullOrder as any).seller_id,
            order_id:              orderId,
            product_id:            item.product_id || null,
            item_name:             item.product_name || 'Product',
            quantity:              Number(item.quantity) || 1,
            unit_price:            Number(item.unit_price),
            total_item_price:      totalItemPrice,
            commission_percentage: commissionPct,
            commission_amount:     commissionAmount,
            seller_earning:        totalItemPrice - commissionAmount,
            payment_status:        'pending',
            order_date:            now,
            order_number:          (fullOrder as any).order_number,
          };
        });

        const { error: earnErr } = await supabaseAdmin
          .from('spf_seller_earnings')
          .insert(earningRows);

        if (earnErr) {
          console.error(`[SR:tracking] Failed to create earnings for order ${orderId}:`, earnErr.message);
        } else {
          console.log(`[SR:tracking] Created ${earningRows.length} earning record(s) for order ${orderId}`);
        }
      } catch (e: any) {
        console.warn('[SR:tracking] Earnings creation error (non-critical):', e?.message);
      }
    })();
  }

  // Invalidate seller Redis cache — orders always; analytics on delivery (earnings changed)
  if (o.seller_id) {
    if (newStatus === 'DELIVERED') {
      invalidateSellerKeys(o.seller_id, 'orders', 'analytics').catch(() => {});
    } else {
      invalidateSellerKeys(o.seller_id, 'orders').catch(() => {});
    }
  }

  console.log(`[SR:tracking] orderId=${orderId} AWB=${o.awb_number} ${o.status} → ${newStatus}`);
  return { updated: true, newStatus };
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual sync — pulls live status from Shiprocket API (admin use only)
// ─────────────────────────────────────────────────────────────────────────────

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

export async function syncTrackingStatus(orderId: string): Promise<SyncResult> {
  // Fetch order to get AWB
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('spf_orders')
    .select('id, status, awb_number')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) return { updated: false, error: `Order ${orderId} not found` };

  const o = order as any;
  if (!o.awb_number) return { updated: false, error: `Order ${orderId} has no AWB yet` };

  // Pull latest tracking from Shiprocket API
  let trackData: TrackingData;
  try {
    const res = await shiprocketClient.request<TrackResponse>(
      'GET',
      `/courier/track/awb/${encodeURIComponent(o.awb_number)}`,
    );
    trackData = res.tracking_data;
  } catch (err: any) {
    console.error(`[SR:tracking] Shiprocket API fetch failed for AWB ${o.awb_number}:`, err.message);
    return { updated: false, error: err.message };
  }

  const rawStatus = (trackData.current_status ?? '').toLowerCase().trim();
  const newStatus = STATUS_MAP[rawStatus];

  if (!newStatus) {
    console.log(`[SR:tracking] AWB ${o.awb_number} status "${rawStatus}" has no IFP mapping — skipped`);
    return { updated: false };
  }

  const activities: TrackingActivity[] =
    trackData.shipment_track_activities ?? trackData.shipment_track ?? [];
  const latestScan = activities[0];

  return applyStatusFromPayload(orderId, newStatus, {
    courierName: trackData.courier_name  ?? null,
    deliveredAt: trackData.delivered_date ?? null,
    location:    latestScan?.location    ?? null,
    description: latestScan?.activity ?? latestScan?.sr_status_label ?? null,
    note: [
      trackData.current_status,
      latestScan?.location ? `@ ${latestScan.location}` : '',
      latestScan?.activity ?? latestScan?.sr_status_label ?? '',
    ].filter(Boolean).join(' | ') || null,
  });
}
