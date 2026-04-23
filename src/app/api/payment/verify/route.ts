import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifySellerNewOrder, notifyCustomerNewOrder } from '@/lib/notifications/sellerNotify';

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyPaymentRequest = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error('[Verify Payment] Missing Razorpay key secret');
      return NextResponse.json(
        { error: 'Payment verification failed - configuration error' },
        { status: 500 }
      );
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      console.error('[Verify Payment] Invalid signature');
      return NextResponse.json(
        { error: 'Payment verification failed - invalid signature' },
        { status: 400 }
      );
    }

    console.log('[Verify Payment] Signature verified successfully');

    // Update payment order in database
    const { data: paymentOrder, error: updateError } = await supabase
      .from('spf_payment_orders')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'captured',
        payment_completed_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select()
      .single();

    if (updateError) {
      console.error('[Verify Payment] Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment status', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[Verify Payment] Payment order updated:', paymentOrder.order_number);

    // Send payment notifications
    try {
      await fetch(`${request.nextUrl.origin}/api/notifications/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: paymentOrder.user_id,
          orderNumber: paymentOrder.order_number,
          amount: paymentOrder.amount / 100, // Convert paise to rupees
          status: 'success',
          paymentMethod: paymentOrder.payment_method || 'razorpay',
          items: paymentOrder.items,
        }),
      });
      console.log('[Verify Payment] Notifications sent');
    } catch (notifError) {
      console.error('[Verify Payment] Notification error:', notifError);
      // Don't fail verification if notification fails
    }

    // Sync to spf_orders so seller/buyer dashboards show this order
    try {
      const { data: existingOrder } = await supabaseAdmin
        .from('spf_orders')
        .select('id')
        .eq('transaction_id', razorpay_payment_id)
        .maybeSingle();

      if (!existingOrder) {
        const items: any[] = paymentOrder.items || [];
        const deliveryAddr: any = paymentOrder.delivery_address || {};
        const sellerId = items.find((i: any) => i.sellerId)?.sellerId ?? null;

        if (sellerId) {
          const subtotal = items.reduce(
            (sum: number, i: any) =>
              Math.round((sum + Number(i.price) * Number(i.quantity)) * 100) / 100,
            0,
          );
          const orderTotalInr  = paymentOrder.amount / 100;
          const shippingCharge = Math.max(0, Math.round((orderTotalInr - subtotal) * 100) / 100);

          const shippingAddress = {
            name:    deliveryAddr.name           || '',
            phone:   deliveryAddr.phone          || '',
            house:   deliveryAddr.address_line1  || '',
            area:    deliveryAddr.address_line2  || '',
            city:    deliveryAddr.city           || '',
            state:   deliveryAddr.state          || '',
            pincode: deliveryAddr.pincode        || '',
          };

          const payMethod = paymentOrder.upi_id ? 'UPI' : 'CARD';
          const now        = new Date();

          const { data: newOrder, error: orderInsertErr } = await supabaseAdmin
            .from('spf_orders')
            .insert({
              order_number:            paymentOrder.order_number,
              customer_id:             paymentOrder.user_id,
              seller_id:               sellerId,
              status:                  'CONFIRMED',
              payment_method:          payMethod,
              payment_status:          'captured',
              payment_gateway_ref:     razorpay_order_id,
              transaction_id:          razorpay_payment_id,
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

          if (orderInsertErr) {
            console.error('[Verify Payment] spf_orders insert error:', orderInsertErr.message);
          } else if (newOrder) {
            console.log('[Verify Payment] raw items from spf_payment_orders:', JSON.stringify(items));
            if (items.length > 0) {
              // item.id = p.id (UUID primary key of spf_productdetails)
              // item.productId = p.product_id (non-UUID short ID — do NOT use for FK)
              const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              const itemRows = items.map((item: any) => {
                // Prefer item.id (UUID PK), fall back to item.productId only if it's a UUID
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

              console.log('[Verify Payment] inserting item rows:', JSON.stringify(itemRows));

              const { error: itemsErr } = await supabaseAdmin
                .from('spf_order_items')
                .insert(itemRows);

              if (itemsErr) {
                console.error('[Verify Payment] spf_order_items insert error:', itemsErr.message);
              }
            }
            await supabaseAdmin.from('spf_order_status_history').insert({
              order_id:    newOrder.id,
              from_status: null,
              to_status:   'CONFIRMED',
              actor_type:  'SYSTEM',
              actor_id:    null,
              note:        'Payment captured via Razorpay',
            });

            // Email notifications to seller + customer — fire-and-forget
            void notifySellerNewOrder(newOrder.id);
            void notifyCustomerNewOrder(newOrder.id);
          }
        } else {
          console.warn('[Verify Payment] No sellerId in items — spf_orders insert skipped');
        }
      }
    } catch (orderSyncErr: any) {
      console.error('[Verify Payment] spf_orders sync failed (non-fatal):', orderSyncErr?.message);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      orderNumber: paymentOrder.order_number,
      status: 'success',
    });
  } catch (error: any) {
    console.error('[Verify Payment] Error:', error);
    return NextResponse.json(
      {
        error: 'Payment verification failed',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
