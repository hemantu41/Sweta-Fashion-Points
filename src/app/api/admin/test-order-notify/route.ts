/**
 * POST /api/admin/test-order-notify
 * Fires any order lifecycle email notification directly using a real order ID.
 * TEMPORARY — delete this file after testing is complete.
 *
 * Body:
 *   orderId  : string  — UUID from spf_orders
 *   type     : 'new_order'
 *            | 'sla_warning_acceptance'
 *            | 'sla_warning_packing'
 *            | 'sla_breached_acceptance'
 *            | 'sla_breached_packing'
 *            | 'pickup_scheduled'
 *            | 'customer_cancelled'
 *
 *   // Only needed when type = 'customer_cancelled'
 *   customerEmail? : string
 *   isPrepaid?     : boolean  (default: false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  notifySellerNewOrder,
  notifySellerSlaWarning,
  notifySellerSlaBreached,
  notifySellerPickupScheduled,
  notifyCustomerOrderCancelled,
  notifyCustomerNewOrder,
} from '@/lib/notifications/sellerNotify';

const VALID_TYPES = [
  'new_order',
  'customer_new_order',
  'sla_warning_acceptance',
  'sla_warning_packing',
  'sla_breached_acceptance',
  'sla_breached_packing',
  'pickup_scheduled',
  'customer_cancelled',
] as const;

type NotifyType = typeof VALID_TYPES[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, type, customerEmail, isPrepaid = false } = body;

    if (!orderId) {
      return NextResponse.json({ error: '"orderId" is required' }, { status: 400 });
    }
    if (!VALID_TYPES.includes(type as NotifyType)) {
      return NextResponse.json(
        { error: `"type" must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    // Verify order exists
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('spf_orders')
      .select('id, order_number, subtotal, shipping_charge, customer_id, payment_method')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found in spf_orders' }, { status: 404 });
    }

    const o = order as any;

    switch (type as NotifyType) {
      case 'new_order':
        await notifySellerNewOrder(orderId);
        break;

      case 'customer_new_order':
        await notifyCustomerNewOrder(orderId);
        break;

      case 'sla_warning_acceptance':
        await notifySellerSlaWarning(orderId, 'ACCEPTANCE');
        break;

      case 'sla_warning_packing':
        await notifySellerSlaWarning(orderId, 'PACKING');
        break;

      case 'sla_breached_acceptance':
        await notifySellerSlaBreached(orderId, 'ACCEPTANCE');
        break;

      case 'sla_breached_packing':
        await notifySellerSlaBreached(orderId, 'PACKING');
        break;

      case 'pickup_scheduled':
        await notifySellerPickupScheduled(orderId);
        break;

      case 'customer_cancelled': {
        // Resolve customer email from DB if not provided in body
        let toEmail = customerEmail as string | undefined;
        if (!toEmail) {
          const { data: user } = await supabaseAdmin
            .from('spf_users')
            .select('email')
            .eq('id', o.customer_id)
            .single();
          toEmail = (user as any)?.email;
        }
        if (!toEmail) {
          return NextResponse.json(
            { error: 'Could not resolve customer email. Pass "customerEmail" in body or ensure the customer has an email in spf_users.' },
            { status: 400 },
          );
        }
        const orderTotal = Number(o.subtotal) + Number(o.shipping_charge);
        const prepaid    = isPrepaid ?? (o.payment_method !== null && o.payment_method !== 'COD');
        await notifyCustomerOrderCancelled(orderId, toEmail, o.order_number, orderTotal, prepaid);
        break;
      }
    }

    return NextResponse.json({ success: true, type, orderId, orderNumber: o.order_number });
  } catch (err: any) {
    console.error('[test-order-notify]', err?.message);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
