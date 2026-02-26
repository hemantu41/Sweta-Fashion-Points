import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase } from '@/lib/supabase';

interface CreateOrderRequest {
  userId: string;
  amount: number; // in rupees
  items: any[];
  address: any;
  upiId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { userId, amount, items, address, upiId } = body;

    // Validate required fields
    if (!userId || !amount || !items || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, items, address' },
        { status: 400 }
      );
    }

    // Validate Razorpay credentials
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[Create Order] Missing Razorpay credentials');
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      );
    }

    if (keyId.includes('your_razorpay') || keySecret.includes('your_razorpay')) {
      console.error('[Create Order] Razorpay credentials not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please add your Razorpay credentials.' },
        { status: 500 }
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Generate order number
    const now = new Date();
    const orderNumber = `SFP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 900000 + 100000)}`;

    // Convert amount to paise (Razorpay uses paise)
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        order_number: orderNumber,
        user_id: userId,
      },
    });

    console.log('[Create Order] Razorpay order created:', razorpayOrder.id);

    // Save order to database
    const { data: paymentOrder, error: dbError } = await supabase
      .from('spf_payment_orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        razorpay_order_id: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        items: items,
        delivery_address: address,
        address_id: address.id,
        status: 'created',
        upi_id: upiId,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Create Order] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save order', details: dbError.message },
        { status: 500 }
      );
    }

    console.log('[Create Order] Order saved to database:', paymentOrder.id);

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      orderNumber: orderNumber,
      amount: amountInPaise,
      currency: 'INR',
      keyId: keyId, // Send to frontend for Razorpay checkout
    });
  } catch (error: any) {
    console.error('[Create Order] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment order',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
