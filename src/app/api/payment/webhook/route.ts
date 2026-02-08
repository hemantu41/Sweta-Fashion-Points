import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

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
