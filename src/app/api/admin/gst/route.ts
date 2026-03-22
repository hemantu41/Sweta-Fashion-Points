import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/gst?gstin=22AAAAA0000A1Z5
// Verifies GSTIN via public GST Search API

export async function GET(request: NextRequest) {
  try {
    const gstin = request.nextUrl.searchParams.get('gstin');

    if (!gstin || !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[A-Z]{1}\d{1}$/.test(gstin.toUpperCase())) {
      return NextResponse.json(
        { error: 'Valid 15-character GSTIN required', verified: false },
        { status: 400 }
      );
    }

    const res = await fetch(`https://gstsearch.in/api/v1/gstin/${gstin.toUpperCase()}`);

    if (!res.ok) {
      // API might be down or rate-limited — return unverified gracefully
      return NextResponse.json({
        verified: false,
        gstin: gstin.toUpperCase(),
        message: 'GST verification service unavailable — please try later',
      });
    }

    const data = await res.json();

    if (data.error || !data.taxpayerInfo) {
      return NextResponse.json({
        verified: false,
        gstin: gstin.toUpperCase(),
        message: 'GSTIN not found or invalid',
      });
    }

    const info = data.taxpayerInfo;

    return NextResponse.json({
      verified: true,
      gstin: gstin.toUpperCase(),
      businessName: info.tradeNam || info.lgnm || '',
      legalName: info.lgnm || '',
      state: info.pradr?.addr?.stcd || '',
      registrationDate: info.rgdt || '',
      status: info.sts || '',
      type: info.dty || '',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[GST] Verification error:', message);
    return NextResponse.json({
      verified: false,
      error: message,
    }, { status: 500 });
  }
}
