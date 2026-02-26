import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * GET /api/shiprocket/serviceability
 * Check available couriers and rates for a route
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const pickupPincode = searchParams.get('pickupPincode');
    const deliveryPincode = searchParams.get('deliveryPincode');
    const weight = searchParams.get('weight');
    const cod = searchParams.get('cod') === 'true' ? 1 : 0;
    const declaredValue = searchParams.get('declaredValue');

    if (!pickupPincode || !deliveryPincode || !weight) {
      return NextResponse.json(
        { error: 'Missing required parameters: pickupPincode, deliveryPincode, weight' },
        { status: 400 }
      );
    }

    const result = await shiprocketService.getServiceability({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: parseFloat(weight),
      cod,
      declared_value: declaredValue ? parseFloat(declaredValue) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      couriers: result.couriers,
      recommendedCourier: result.recommendedCourier,
    });
  } catch (error: any) {
    console.error('[Shiprocket Serviceability API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check serviceability' },
      { status: 500 }
    );
  }
}
