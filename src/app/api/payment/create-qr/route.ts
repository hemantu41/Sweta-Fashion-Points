import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

interface CreateQRRequest {
  orderId: string;
  amount: number; // in paise
  customerName?: string;
  customerContact?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateQRRequest = await request.json();
    const { orderId, amount, customerName, customerContact } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, amount' },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[Create QR] Missing Razorpay credentials');
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Create Razorpay QR Code
    const qrCode = await razorpay.qrCode.create({
      type: 'upi_qr',
      name: 'Sweta Fashion Points',
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: amount,
      description: `Order ${orderId}`,
      customer_id: customerContact || undefined,
      close_by: Math.floor(Date.now() / 1000) + 180, // Expires in 3 minutes
      notes: {
        order_id: orderId,
        customer_name: customerName || '',
      },
    });

    console.log('[Create QR] QR Code created:', qrCode.id);

    return NextResponse.json({
      success: true,
      qrCodeId: qrCode.id,
      qrCodeUrl: qrCode.image_url,
      shortUrl: qrCode.short_url,
    });
  } catch (error: any) {
    console.error('[Create QR] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create QR code',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
