import { NextRequest, NextResponse } from 'next/server';
import { checkServiceability } from '@/lib/shiprocket';

// GET /api/shipping/serviceability?pincode=500001&seller_pincode=400001&weight=0.5&cod=false
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deliveryPincode = searchParams.get('pincode');
  const sellerPincode   = searchParams.get('seller_pincode');
  const weight          = parseFloat(searchParams.get('weight') || '0.5');
  const cod             = searchParams.get('cod') === 'true';

  if (!deliveryPincode || !sellerPincode) {
    return NextResponse.json(
      { success: false, error: 'pincode and seller_pincode are required' },
      { status: 400 }
    );
  }

  if (!/^\d{6}$/.test(deliveryPincode) || !/^\d{6}$/.test(sellerPincode)) {
    return NextResponse.json(
      { success: false, error: 'Pincodes must be 6 digits' },
      { status: 400 }
    );
  }

  try {
    const result = await checkServiceability(sellerPincode, deliveryPincode, weight, cod);

    return NextResponse.json({
      success: true,
      data: {
        deliverable:   result.serviceable,
        estimatedDays: result.estimatedDays,
        shippingCost:  result.shippingCost,
        codAvailable:  result.codAvailable,
        freeDelivery:  (result.shippingCost ?? 0) <= 50,
      },
    });
  } catch (err: any) {
    console.error('[Serviceability API]', err?.message);
    return NextResponse.json(
      { success: false, error: 'Failed to check serviceability' },
      { status: 500 }
    );
  }
}
