import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/pincode?code=823001
// Validates pincode via India Post API (free, no key needed)

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');

    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Valid 6-digit pincode required' },
        { status: 400 }
      );
    }

    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
    const data = await res.json();

    if (!data?.[0] || data[0].Status === 'Error') {
      return NextResponse.json(
        { error: 'Invalid pincode', valid: false },
        { status: 404 }
      );
    }

    const postOffices = data[0].PostOffice || [];
    const first = postOffices[0];

    // Calculate approximate distance from Gaya (24.7955, 84.9994)
    // Using simple estimation for Tier 2/3 Bihar pincodes
    const GAYA_LAT = 24.7955;
    const GAYA_LNG = 84.9994;

    return NextResponse.json({
      valid: true,
      pincode: code,
      district: first?.District || '',
      state: first?.State || '',
      taluka: first?.Taluk || first?.Block || '',
      postOffices: postOffices.map((po: Record<string, string>) => ({
        name: po.Name,
        type: po.BranchType,
        delivery: po.DeliveryStatus,
      })),
      region: first?.Region || '',
      division: first?.Division || '',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Pincode] Lookup error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
