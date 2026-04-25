import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/whatsapp/send
// Sends a WhatsApp template message via Meta Cloud API
// Env: NEXT_PUBLIC_WA_PHONE_ID, WA_TOKEN

export async function POST(request: NextRequest) {
  try {
    const { template, recipient, language = 'hi' } = await request.json();

    if (!template || !recipient) {
      return NextResponse.json(
        { error: 'template and recipient are required' },
        { status: 400 }
      );
    }

    const phoneId = process.env.NEXT_PUBLIC_WA_PHONE_ID;
    const token = process.env.WA_TOKEN;

    if (!phoneId || !token) {
      // Graceful fallback — log but don't fail
      console.warn('[WhatsApp] Missing WA_TOKEN or PHONE_ID — skipping send');
      return NextResponse.json({
        success: true,
        mock: true,
        message: 'WhatsApp not configured — message logged locally',
      });
    }

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipient.replace(/[^0-9]/g, ''),
          type: 'template',
          template: {
            name: template,
            language: { code: language },
          },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('[WhatsApp] API error:', data);
      return NextResponse.json(
        { error: 'WhatsApp API error', details: data },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[WhatsApp] Send error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
