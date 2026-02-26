import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('[Webhook] Missing signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Webhook] Webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    console.log('[Webhook] Received event:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity, request);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity, request);
        break;

      default:
        console.log('[Webhook] Unhandled event:', event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any, request: NextRequest) {
  console.log('[Webhook] Payment captured:', payment.id);

  const orderId = payment.order_id;

  // Update payment order in database
  const { data: paymentOrder, error } = await supabase
    .from('spf_payment_orders')
    .update({
      razorpay_payment_id: payment.id,
      status: 'captured',
      payment_method: payment.method,
      payment_method_details: payment,
      payment_completed_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', orderId)
    .select()
    .single();

  if (error) {
    console.error('[Webhook] Database update error:', error);
    return;
  }

  console.log('[Webhook] Order updated:', paymentOrder.order_number);

  // Calculate seller earnings
  await calculateSellerEarnings(paymentOrder);

  // Send payment notifications
  try {
    await fetch(`${request.nextUrl.origin}/api/notifications/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: paymentOrder.user_id,
        orderNumber: paymentOrder.order_number,
        amount: paymentOrder.amount / 100,
        status: 'success',
        paymentMethod: payment.method,
        items: paymentOrder.items,
      }),
    });
    console.log('[Webhook] Notifications sent');
  } catch (notifError) {
    console.error('[Webhook] Notification error:', notifError);
  }
}

async function handlePaymentFailed(payment: any) {
  console.log('[Webhook] Payment failed:', payment.id);

  const orderId = payment.order_id;

  // Update payment order in database
  const { data: paymentOrder, error } = await supabase
    .from('spf_payment_orders')
    .update({
      razorpay_payment_id: payment.id,
      status: 'failed',
      payment_method: payment.method,
      error_code: payment.error_code,
      error_description: payment.error_description,
      payment_attempted_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', orderId)
    .select()
    .single();

  if (error) {
    console.error('[Webhook] Database update error:', error);
    return;
  }

  console.log('[Webhook] Order marked as failed:', paymentOrder.order_number);
}

async function handleOrderPaid(order: any, request: NextRequest) {
  console.log('[Webhook] Order paid:', order.id);

  // Similar to payment.captured but for order-level events
  await handlePaymentCaptured({ order_id: order.id, ...order }, request);
}

async function calculateSellerEarnings(paymentOrder: any) {
  try {
    const items = paymentOrder.items || [];
    console.log('[Webhook] Calculating seller earnings for', items.length, 'items');

    for (const item of items) {
      // Skip items without seller
      if (!item.sellerId) {
        console.log('[Webhook] Skipping item without sellerId:', item.name);
        continue;
      }

      // Fetch seller commission percentage
      const { data: seller } = await supabaseAdmin
        .from('spf_sellers')
        .select('commission_percentage, id')
        .eq('id', item.sellerId)
        .single();

      if (!seller) {
        console.log('[Webhook] Seller not found:', item.sellerId);
        continue;
      }

      const commissionPercentage = seller.commission_percentage || 10.0;
      const totalItemPrice = parseFloat(item.price) * item.quantity;
      const commissionAmount = totalItemPrice * (commissionPercentage / 100);
      const sellerEarning = totalItemPrice - commissionAmount;

      // Create earning record
      const { data, error } = await supabaseAdmin.from('spf_seller_earnings').insert({
        seller_id: item.sellerId,
        order_id: paymentOrder.id,
        product_id: item.productId || null,
        item_name: item.name || 'Unknown Product',
        quantity: item.quantity,
        unit_price: parseFloat(item.price),
        total_item_price: totalItemPrice,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        seller_earning: sellerEarning,
        payment_status: 'pending',
        order_date: paymentOrder.payment_completed_at || new Date().toISOString(),
        order_number: paymentOrder.order_number,
      });

      if (error) {
        console.error('[Webhook] Error creating earning record:', error);
      } else {
        console.log('[Webhook] Earning record created for seller:', item.sellerId, 'Amount:', sellerEarning);
      }
    }
  } catch (error) {
    console.error('[Webhook] Earnings calculation error:', error);
    // Don't fail the webhook if earnings calculation fails
  }
}
