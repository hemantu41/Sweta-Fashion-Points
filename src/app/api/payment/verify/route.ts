import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

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
