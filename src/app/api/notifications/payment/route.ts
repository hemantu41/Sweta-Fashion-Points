import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendPaymentNotification } from '@/lib/notifications';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface PaymentNotificationRequest {
  userId: string;
  orderNumber: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  paymentMethod: 'upi' | 'card';
  items: OrderItem[];
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentNotificationRequest = await request.json();
    const { userId, orderNumber, amount, status, items } = body;

    // Validate required fields
    if (!userId || !orderNumber || !amount || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, orderNumber, amount, status' },
        { status: 400 }
      );
    }

    // Fetch user details from database
    const { data: user, error: userError } = await supabase
      .from('spf_users')
      .select('id, name, email, mobile')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('[Notification API] User fetch error:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate user has phone number
    if (!user.mobile) {
      console.warn('[Notification API] User has no mobile number');
      return NextResponse.json(
        { error: 'User mobile number not found', sms: false, whatsapp: false },
        { status: 200 }
      );
    }

    console.log(`[Notification API] Sending notifications for order ${orderNumber} to ${user.mobile}`);

    // Send notifications
    const result = await sendPaymentNotification({
      phone: user.mobile,
      email: user.email,
      name: user.name,
      orderNumber,
      amount,
      status,
      items,
    });

    console.log(`[Notification API] Results - SMS: ${result.sms}, WhatsApp: ${result.whatsapp}`);

    return NextResponse.json({
      success: true,
      sms: result.sms,
      whatsapp: result.whatsapp,
      message: 'Notifications sent',
    });
  } catch (error) {
    console.error('[Notification API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications', details: String(error) },
      { status: 500 }
    );
  }
}
