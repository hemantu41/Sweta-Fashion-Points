/**
 * POST /api/orders/[id]/return/ship-back
 * Body: { customerId, awbNumber, courierName }
 *
 * Customer submits reverse shipment details after their return is approved.
 * Records the AWB + courier, moves status → RETURN_SHIPPED.
 * Notifies the seller to expect the package.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const { customerId, awbNumber, courierName } = body as {
      customerId?: string;
      awbNumber?:  string;
      courierName?: string;
    };

    if (!customerId)  return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    if (!awbNumber?.trim())   return NextResponse.json({ error: 'awbNumber is required' }, { status: 400 });
    if (!courierName?.trim()) return NextResponse.json({ error: 'courierName is required' }, { status: 400 });

    // Fetch the return request for this order
    const { data: returnReq, error: fetchErr } = await supabaseAdmin
      .from('spf_return_requests')
      .select('id, customer_id, seller_id, status, spf_orders(order_number, subtotal, shipping_charge, payment_method)')
      .eq('order_id', orderId)
      .maybeSingle();

    if (fetchErr || !returnReq) {
      return NextResponse.json({ error: 'No return request found for this order.' }, { status: 404 });
    }

    const rr = returnReq as any;

    // Ownership check
    if (rr.customer_id !== customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Must be APPROVED before customer can ship
    if (rr.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Return must be APPROVED before submitting shipment details. Current status: ${rr.status}` },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    // Update return request with shipment details
    const { error: updateErr } = await supabaseAdmin
      .from('spf_return_requests')
      .update({
        status:               'RETURN_SHIPPED',
        reverse_awb:          awbNumber.trim(),
        reverse_courier:      courierName.trim(),
        reverse_shipped_at:   now,
        updated_at:           now,
      })
      .eq('id', rr.id);

    if (updateErr) {
      console.error('[ship-back] update error:', updateErr.message);
      return NextResponse.json({ error: 'Failed to record shipment details.' }, { status: 500 });
    }

    // Fire-and-forget: update order status + notify seller
    void (async () => {
      try {
        // Append status history
        await supabaseAdmin.from('spf_order_status_history').insert({
          order_id:    orderId,
          from_status: 'RETURN_INITIATED',
          to_status:   'RETURN_SHIPPED',
          actor_type:  'CUSTOMER',
          actor_id:    customerId,
          note:        `Customer shipped return. Courier: ${courierName.trim()}, AWB: ${awbNumber.trim()}`,
          created_at:  now,
        });

        // Update order status
        await supabaseAdmin
          .from('spf_orders')
          .update({ status: 'RETURN_SHIPPED', updated_at: now })
          .eq('id', orderId);

        // Notify seller to expect the package
        const { data: seller } = await supabaseAdmin
          .from('spf_sellers')
          .select('business_email, business_name')
          .eq('id', rr.seller_id)
          .maybeSingle();

        const order = rr.spf_orders as any;

        if (seller?.business_email) {
          const { notifySellerReturnShipping } = await import('@/lib/notifications/sellerNotify');
          await notifySellerReturnShipping(
            seller.business_email,
            seller.business_name || 'Seller',
            order?.order_number || '',
            awbNumber.trim(),
            courierName.trim(),
          );
        }
      } catch (e: any) {
        console.error('[ship-back] background error:', e?.message);
      }
    })();

    return NextResponse.json({
      success: true,
      message: 'Shipment details recorded. The seller has been notified to expect your package.',
      data: {
        status:      'RETURN_SHIPPED',
        awbNumber:   awbNumber.trim(),
        courierName: courierName.trim(),
      },
    });
  } catch (err: any) {
    console.error('[ship-back] error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
