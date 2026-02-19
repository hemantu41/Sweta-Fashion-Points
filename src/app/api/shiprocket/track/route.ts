import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * GET /api/shiprocket/track?awb=XXX
 * Track shipment by AWB code
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const awbCode = searchParams.get('awb');

    if (!awbCode) {
      return NextResponse.json(
        { error: 'AWB code is required' },
        { status: 400 }
      );
    }

    const result = await shiprocketService.trackShipment(awbCode);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tracking: {
        awbCode: result.awbCode,
        courierName: result.courierName,
        currentStatus: result.currentStatus,
        deliveredDate: result.deliveredDate,
        estimatedDeliveryDate: result.estimatedDeliveryDate,
        trackingData: result.trackingData,
      },
    });
  } catch (error: any) {
    console.error('[Shiprocket Track API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track shipment' },
      { status: 500 }
    );
  }
}
