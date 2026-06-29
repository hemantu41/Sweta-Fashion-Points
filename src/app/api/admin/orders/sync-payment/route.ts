/**
 * POST /api/admin/orders/sync-payment
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-only: manually sync a captured spf_payment_orders record into
 * spf_orders when the automatic sync silently failed (e.g. key mismatch,
 * network error, or first-time live Razorpay setup).
 *
 * Body: { orderNumber: "SFP-20260629-XXXXXX", adminUserId: "<uuid>" }
 *
 * Also supports bulk reconciliation: omit orderNumber to sync ALL captured
 * spf_payment_orders entries that have no matching spf_orders record.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { syncPaymentOrderToSpfOrders } from '@/app/api/payment/verify/route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, adminUserId } = body as { orderNumber?: string; adminUserId?: string };

    // Verify admin
    if (!adminUserId) {
      return NextResponse.json({ error: 'adminUserId is required' }, { status: 400 });
    }
    const { data: admin } = await supabaseAdmin
      .from('spf_users')
      .select('is_admin')
      .eq('id', adminUserId)
      .maybeSingle();
    if (!admin?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // ── Single order sync ────────────────────────────────────────────────────
    if (orderNumber) {
      const { data: po, error: poErr } = await supabaseAdmin
        .from('spf_payment_orders')
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (poErr || !po) {
        return NextResponse.json({ error: `Order ${orderNumber} not found in spf_payment_orders` }, { status: 404 });
      }

      if (po.status !== 'captured') {
        return NextResponse.json({
          error: `Order status is "${po.status}" — only captured orders can be synced. Payment may not have completed.`,
          status: po.status,
        }, { status: 422 });
      }

      // Check if already in spf_orders
      const { data: existing } = await supabaseAdmin
        .from('spf_orders')
        .select('id, order_number')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          message: 'Order already exists in spf_orders — no action needed.',
          orderId: existing.id,
          orderNumber: existing.order_number,
          alreadySynced: true,
        });
      }

      await syncPaymentOrderToSpfOrders(po, po.razorpay_order_id, po.razorpay_payment_id);

      // Confirm insertion
      const { data: synced } = await supabaseAdmin
        .from('spf_orders')
        .select('id, order_number, status')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (!synced) {
        return NextResponse.json({
          error: 'Sync attempted but order still not found in spf_orders — check server logs for details.',
        }, { status: 500 });
      }

      return NextResponse.json({
        message: `Order ${orderNumber} successfully synced to spf_orders.`,
        orderId: synced.id,
        orderNumber: synced.order_number,
        status: synced.status,
      });
    }

    // ── Bulk reconciliation: all captured orders missing from spf_orders ─────
    const { data: allCaptured, error: fetchErr } = await supabaseAdmin
      .from('spf_payment_orders')
      .select('*')
      .eq('status', 'captured')
      .order('payment_completed_at', { ascending: false })
      .limit(100);

    if (fetchErr || !allCaptured) {
      return NextResponse.json({ error: 'Failed to fetch payment orders' }, { status: 500 });
    }

    const results: { orderNumber: string; result: string }[] = [];

    for (const po of allCaptured) {
      const { data: existing } = await supabaseAdmin
        .from('spf_orders')
        .select('id')
        .eq('order_number', po.order_number)
        .maybeSingle();

      if (existing) {
        results.push({ orderNumber: po.order_number, result: 'already_synced' });
        continue;
      }

      try {
        await syncPaymentOrderToSpfOrders(po, po.razorpay_order_id, po.razorpay_payment_id);
        results.push({ orderNumber: po.order_number, result: 'synced' });
      } catch (err: any) {
        results.push({ orderNumber: po.order_number, result: `failed: ${err?.message}` });
      }
    }

    const synced  = results.filter(r => r.result === 'synced').length;
    const skipped = results.filter(r => r.result === 'already_synced').length;
    const failed  = results.filter(r => r.result.startsWith('failed')).length;

    return NextResponse.json({
      message: `Bulk reconciliation complete: ${synced} synced, ${skipped} already existed, ${failed} failed.`,
      synced, skipped, failed,
      details: results,
    });

  } catch (err: any) {
    console.error('[AdminOrderSync] Error:', err?.message);
    return NextResponse.json({ error: 'Internal error', details: err?.message }, { status: 500 });
  }
}
