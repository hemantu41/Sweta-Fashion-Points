import { NextRequest, NextResponse } from 'next/server';

// POST /api/ndr/cod-verify
// Triggers COD verification OTP call via Fast2SMS.
// Body: { orderId, phone }

export async function POST(request: NextRequest) {
  try {
    const { orderId, phone } = await request.json();

    if (!orderId || !phone) {
      return NextResponse.json({ error: 'orderId and phone required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Invalid 10-digit phone number' }, { status: 400 });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
      console.warn(`[COD-Verify] FAST2SMS not configured — OTP ${otp} for order ${orderId} logged locally`);
      return NextResponse.json({
        success: true,
        mock: true,
        otp, // only in mock mode for testing
        message: 'Fast2SMS not configured — OTP logged locally',
      });
    }

    const smsMessage = `Your COD verification OTP for order ${orderId} is ${otp}. Please share with delivery partner. - Insta Fashion Points`;

    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'v3',
        sender_id: 'TXTIND',
        message: smsMessage,
        language: 'english',
        numbers: cleanPhone,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.return === false) {
      return NextResponse.json({ error: 'OTP send failed', details: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, message: 'COD verification OTP sent' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[COD-Verify] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
