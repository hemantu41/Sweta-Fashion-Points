/**
 * POST /api/admin/orders/v2/[id]/sync-tracking
 *
 * Manually triggers a Shiprocket tracking sync for a single order.
 * Use this when a webhook was missed or an order status is stale.
 *
 * [id] is the internal spf_orders UUID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncTrackingStatus } from '@/lib/shiprocket/tracking';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;

    const result = await syncTrackingStatus(orderId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success:   true,
      updated:   result.updated,
      newStatus: result.newStatus ?? null,
      message:   result.updated
        ? `Order synced → ${result.newStatus}`
        : 'Order already up-to-date with Shiprocket.',
    });
  } catch (err: any) {
    console.error('[sync-tracking]', err?.message);
    return NextResponse.json({ error: err?.message || 'Sync failed' }, { status: 500 });
  }
}
