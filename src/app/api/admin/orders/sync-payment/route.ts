/**
 * POST /api/admin/orders/sync-payment
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-only: manually sync a spf_payment_orders record into spf_orders.
 * Does NOT delegate to syncPaymentOrderToSpfOrders (which swallows errors).
 * Every step returns a specific error message so the admin knows exactly
 * what went wrong.
 *
 * Body:
 *   { orderNumber: "SFP-20260629-XXXXXX", adminUserId: "<uuid>", force?: true }
 *   force=true  → sync even if status != 'captured' (e.g. still 'created')
 *   omit orderNumber → bulk reconcile all captured orders missing from spf_orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveSellerId(items: any[]): Promise<string | null> {
  // 1. Try directly from items payload
  const fromItems = items.find((i: any) => i.sellerId)?.sellerId ?? null;
  if (fromItems) return fromItems;

  // 2. Fallback: look up via product UUID in spf_productdetails
  const productUUIDs = items
    .map((i: any) => (UUID_RE.test(i.id) ? i.id : UUID_RE.test(i.productId) ? i.productId : null))
    .filter(Boolean) as string[];

  if (productUUIDs.length > 0) {
    const { data: products } = await supabaseAdmin
      .from('spf_productdetails')
      .select('id, seller_id')
      .in('id', productUUIDs)
      .limit(1);
    if (products?.[0]?.seller_id) return products[0].seller_id as string;
  }

  return null;
}

async function syncOne(po: any, force = false): Promise<{ ok: boolean; message: string; orderId?: string }> {
  // ── Guard: status ────────────────────────────────────────────────────────
  if (!force && po.status !== 'captured') {
    return {
      ok: false,
      message: `Payment status is "${po.status}" — not captured yet. If you know the payment succeeded in Razorpay, use force sync.`,
    };
  }

  // ── Guard: already in spf_orders ────────────────────────────────────────
  const { data: byOrderNum } = await supabaseAdmin
    .from('spf_orders')
    .select('id, order_number')
    .eq('order_number', po.order_number)
    .maybeSingle();
  if (byOrderNum) {
    return { ok: true, message: `Already in spf_orders (id: ${byOrderNum.id}) — no action needed.`, orderId: byOrderNum.id };
  }

  if (po.razorpay_payment_id) {
    const { data: byTxn } = await supabaseAdmin
      .from('spf_orders')
      .select('id, order_number')
      .eq('transaction_id', po.razorpay_payment_id)
      .maybeSingle();
    if (byTxn) {
      return { ok: true, message: `Already in spf_orders as ${byTxn.order_number} — no action needed.`, orderId: byTxn.id };
    }
  }

  // ── Resolve sellerId ─────────────────────────────────────────────────────
  const items: any[] = po.items || [];
  if (items.length === 0) {
    return { ok: false, message: 'Cannot sync — items array is empty in spf_payment_orders.' };
  }

  const sellerId = await resolveSellerId(items);
  if (!sellerId) {
    const itemSummary = items.map((i: any) => `id=${i.id} productId=${i.productId} sellerId=${i.sellerId}`).join(' | ');
    return {
      ok: false,
      message: `Cannot resolve sellerId. Items: [${itemSummary}]. Fix: ensure items have a valid product UUID or sellerId.`,
    };
  }

  // ── Build address ────────────────────────────────────────────────────────
  const addr: any = po.delivery_address || {};
  const shippingAddress = {
    name:    addr.name          || '',
    phone:   addr.phone         || '',
    house:   addr.address_line1 || addr.house || '',
    area:    addr.address_line2 || addr.area  || '',
    city:    addr.city          || '',
    state:   addr.state         || '',
    pincode: addr.pincode       || '',
  };

  const subtotal = items.reduce(
    (sum: number, i: any) => Math.round((sum + Number(i.price) * Number(i.quantity)) * 100) / 100,
    0,
  );
  const orderTotalInr  = (po.amount || 0) / 100;
  const shippingCharge = Math.max(0, Math.round((orderTotalInr - subtotal) * 100) / 100);
  const payMethod      = po.upi_id ? 'UPI' : 'CARD';
  const now            = new Date();

  // ── Insert into spf_orders ───────────────────────────────────────────────
  const { data: newOrder, error: orderErr } = await supabaseAdmin
    .from('spf_orders')
    .insert({
      order_number:            po.order_number,
      customer_id:             po.user_id,
      seller_id:               sellerId,
      status:                  'CONFIRMED',
      payment_method:          payMethod,
      payment_status:          'captured',
      payment_gateway_ref:     po.razorpay_order_id   ?? null,
      transaction_id:          po.razorpay_payment_id ?? null,
      subtotal,
      shipping_charge:         shippingCharge,
      platform_fee:            0,
      pg_fee:                  0,
      seller_payout_amount:    subtotal,
      shipping_address:        shippingAddress,
      acceptance_sla_deadline: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
      packing_sla_deadline:    new Date(now.getTime() + 48 * 3600 * 1000).toISOString(),
    })
    .select('id')
    .single();

  if (orderErr || !newOrder) {
    return {
      ok: false,
      message: `DB insert failed: ${orderErr?.message || 'unknown error'}. Code: ${orderErr?.code || '—'}`,
    };
  }

  // ── Insert order items ───────────────────────────────────────────────────
  const itemRows = items.map((item: any) => {
    const candidateId = UUID_RE.test(item.id) ? item.id
      : UUID_RE.test(item.productId) ? item.productId
      : null;
    return {
      order_id:        newOrder.id,
      product_id:      candidateId,
      seller_id:       item.sellerId || sellerId,
      product_name:    item.name     || 'Product',
      variant_details: item.size     ? { size: item.size } : null,
      quantity:        Number(item.quantity) || 1,
      unit_price:      Number(item.price)    || 0,
      total_price:     Math.round(Number(item.price) * Number(item.quantity) * 100) / 100,
    };
  }).filter((r: any) => r.product_id !== null);

  if (itemRows.length > 0) {
    const { error: itemsErr } = await supabaseAdmin.from('spf_order_items').insert(itemRows);
    if (itemsErr) {
      console.error('[AdminOrderSync] Items insert error (non-fatal):', itemsErr.message);
    }
  }

  // ── Status history ───────────────────────────────────────────────────────
  await supabaseAdmin.from('spf_order_status_history').insert({
    order_id:    newOrder.id,
    from_status: null,
    to_status:   'CONFIRMED',
    actor_type:  'ADMIN',
    actor_id:    null,
    note:        'Manually synced by admin via Order Recovery Tool',
  });

  return { ok: true, message: `Successfully synced to spf_orders (id: ${newOrder.id}).`, orderId: newOrder.id };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, adminUserId, force } = body as {
      orderNumber?: string;
      adminUserId?: string;
      force?: boolean;
    };

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
        .eq('order_number', orderNumber.trim().toUpperCase())
        .maybeSingle();

      if (poErr || !po) {
        // Also try case-insensitive search
        const { data: po2 } = await supabaseAdmin
          .from('spf_payment_orders')
          .select('*')
          .ilike('order_number', orderNumber.trim())
          .maybeSingle();

        if (!po2) {
          return NextResponse.json({
            error: `Order "${orderNumber}" not found in spf_payment_orders. Check the order number is correct.`,
          }, { status: 404 });
        }

        const result = await syncOne(po2, force);
        return NextResponse.json(result, { status: result.ok ? 200 : 422 });
      }

      const result = await syncOne(po, force);
      return NextResponse.json(result, { status: result.ok ? 200 : 422 });
    }

    // ── Bulk reconciliation ──────────────────────────────────────────────────
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
      const r = await syncOne(po, false);
      results.push({ orderNumber: po.order_number, result: r.ok ? (r.message.includes('no action') ? 'already_synced' : 'synced') : `failed: ${r.message}` });
    }

    const synced  = results.filter(r => r.result === 'synced').length;
    const skipped = results.filter(r => r.result === 'already_synced').length;
    const failed  = results.filter(r => r.result.startsWith('failed')).length;

    return NextResponse.json({
      ok: true,
      message: `Bulk reconciliation complete: ${synced} synced, ${skipped} already existed, ${failed} failed.`,
      synced, skipped, failed,
      details: results,
    });

  } catch (err: any) {
    console.error('[AdminOrderSync] Unhandled error:', err?.message);
    return NextResponse.json({ error: `Internal error: ${err?.message}` }, { status: 500 });
  }
}
