/**
 * On-demand backfill: creates spf_seller_earnings rows for any DELIVERED
 * spf_orders that don't already have a matching earnings record.
 *
 * Covers two gaps:
 *  1. Razorpay webhook didn't fire at payment time
 *  2. Order was delivered before the tracking.ts auto-create fix was deployed
 *
 * Idempotency: matches by order_number (not order_id) because the Razorpay
 * webhook stores spf_payment_orders.id as order_id, whereas tracking.ts uses
 * spf_orders.id — both values appear as order_number consistently.
 */

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function backfillDeliveredEarnings(sellerId: string): Promise<boolean> {
  try {
    // All DELIVERED orders for this seller
    const { data: deliveredOrders } = await supabaseAdmin
      .from('spf_orders')
      .select('id, order_number, delivered_at, created_at')
      .eq('seller_id', sellerId)
      .eq('status', 'DELIVERED');

    if (!deliveredOrders || deliveredOrders.length === 0) return false;

    // order_numbers already in spf_seller_earnings for this seller
    const { data: existingEarnings } = await supabaseAdmin
      .from('spf_seller_earnings')
      .select('order_number')
      .eq('seller_id', sellerId);

    const existingOrderNums = new Set(
      (existingEarnings || []).map((e: any) => e.order_number).filter(Boolean)
    );

    // Orders with no earnings record yet
    const missing = deliveredOrders.filter(
      (o: any) => o.order_number && !existingOrderNums.has(o.order_number)
    );

    if (missing.length === 0) return false;

    console.log(`[EarningsBackfill] ${missing.length} delivered order(s) missing earnings for seller ${sellerId}`);

    // Seller commission rate
    const { data: seller } = await supabaseAdmin
      .from('spf_sellers')
      .select('commission_percentage')
      .eq('id', sellerId)
      .maybeSingle();
    const commissionPct = (seller as any)?.commission_percentage ?? 0;

    const earningRows: any[] = [];

    for (const order of missing) {
      const { data: items } = await supabaseAdmin
        .from('spf_order_items')
        .select('product_id, product_name, quantity, unit_price')
        .eq('order_id', (order as any).id);

      if (!items || items.length === 0) {
        console.warn(`[EarningsBackfill] No items for ${(order as any).order_number} — skipping`);
        continue;
      }

      const orderDate = (order as any).delivered_at || (order as any).created_at || new Date().toISOString();

      for (const item of items) {
        const totalItemPrice   = Number(item.unit_price) * Number(item.quantity);
        const commissionAmount = totalItemPrice * (commissionPct / 100);
        earningRows.push({
          seller_id:             sellerId,
          order_id:              (order as any).id,
          product_id:            item.product_id || null,
          item_name:             item.product_name || 'Product',
          quantity:              Number(item.quantity) || 1,
          unit_price:            Number(item.unit_price),
          total_item_price:      totalItemPrice,
          commission_percentage: commissionPct,
          commission_amount:     commissionAmount,
          seller_earning:        totalItemPrice - commissionAmount,
          payment_status:        'pending',
          order_date:            orderDate,
          order_number:          (order as any).order_number,
        });
      }
    }

    if (earningRows.length === 0) return false;

    const { error } = await supabaseAdmin.from('spf_seller_earnings').insert(earningRows);
    if (error) {
      console.error('[EarningsBackfill] Insert error:', error.message);
      return false;
    }

    console.log(`[EarningsBackfill] Created ${earningRows.length} row(s) for seller ${sellerId}`);
    return true;
  } catch (e: any) {
    console.error('[EarningsBackfill] Error:', e?.message);
    return false;
  }
}
