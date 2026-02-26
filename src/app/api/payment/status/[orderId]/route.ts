import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get payment order from database
    const { data: paymentOrder, error: dbError } = await supabase
      .from('spf_payment_orders')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .single();

    if (dbError || !paymentOrder) {
      console.error('[Payment Status] Order not found:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // If payment is already completed, return cached status
    if (paymentOrder.status === 'captured' || paymentOrder.status === 'failed') {
      return NextResponse.json({
        success: true,
        status: paymentOrder.status === 'captured' ? 'success' : 'failed',
        orderNumber: paymentOrder.order_number,
        paymentId: paymentOrder.razorpay_payment_id,
      });
    }

    // Check with Razorpay for latest status
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[Payment Status] Missing Razorpay credentials');
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    try {
      // Fetch order from Razorpay
      const razorpayOrder = await razorpay.orders.fetch(orderId);

      console.log('[Payment Status] Razorpay order status:', razorpayOrder.status);

      let newStatus = 'pending';
      let paymentStatus = 'pending';

      if (razorpayOrder.status === 'paid') {
        newStatus = 'captured';
        paymentStatus = 'success';

        // Fetch payment details
        const payments = await razorpay.orders.fetchPayments(orderId);

        if (payments.items && payments.items.length > 0) {
          const payment = payments.items[0];

          // Update database with payment details
          await supabase
            .from('spf_payment_orders')
            .update({
              razorpay_payment_id: payment.id,
              status: 'captured',
              payment_method: payment.method,
              payment_method_details: payment,
              payment_completed_at: new Date().toISOString(),
            })
            .eq('razorpay_order_id', orderId);

          // Send success notifications
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
          } catch (notifError) {
            console.error('[Payment Status] Notification error:', notifError);
          }
        }
      } else if (razorpayOrder.status === 'attempted') {
        newStatus = 'pending';
        paymentStatus = 'pending';
      }

      return NextResponse.json({
        success: true,
        status: paymentStatus,
        orderNumber: paymentOrder.order_number,
        razorpayStatus: razorpayOrder.status,
      });
    } catch (razorpayError: any) {
      console.error('[Payment Status] Razorpay API error:', razorpayError);

      // If Razorpay API fails, return database status
      return NextResponse.json({
        success: true,
        status: paymentOrder.status === 'captured' ? 'success' : 'pending',
        orderNumber: paymentOrder.order_number,
      });
    }
  } catch (error: any) {
    console.error('[Payment Status] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check payment status',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
