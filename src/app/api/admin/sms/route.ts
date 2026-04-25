import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/sms
// SMS fallback via Fast2SMS (India, free tier 50/day)
// Env: FAST2SMS_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { message, numbers } = await request.json();

    if (!message || !numbers) {
      return NextResponse.json(
        { error: 'message and numbers are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
      console.warn('[SMS] FAST2SMS_API_KEY not set — skipping send');
      return NextResponse.json({
        success: true,
        mock: true,
        message: 'SMS not configured — message logged locally',
      });
    }

    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'v3',
        sender_id: 'TXTIND',
        message,
        language: 'unicode',
        numbers: numbers.replace(/[^0-9,]/g, ''),
      }),
    });

    const data = await res.json();

    if (!res.ok || data.return === false) {
      return NextResponse.json(
        { error: 'SMS send failed', details: data },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SMS] Send error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
