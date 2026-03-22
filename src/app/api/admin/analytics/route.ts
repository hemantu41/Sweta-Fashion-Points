import { NextResponse } from 'next/server';

// GET /api/admin/analytics — returns mock analytics data
// Shape matches the spec for easy swap to real DB later

export async function GET() {
  try {
    const data = {
      revenue: { today: 4500, week: 28000, month: 112000 },
      orders: { pending: 12, shipped: 34, delivered: 89, returned: 5 },
      topCategories: [
        { name: 'Sarees', units: 45, revenue: 56000 },
        { name: "Men's wear", units: 38, revenue: 41000 },
        { name: 'Kids', units: 22, revenue: 18000 },
        { name: "Women's wear", units: 31, revenue: 48000 },
        { name: 'Footwear', units: 12, revenue: 9600 },
      ],
      deliveryZones: [
        { pincode: '823001', district: 'Gaya City', orders: 34, avgDeliveryHrs: 4 },
        { pincode: '824219', district: 'Amas', orders: 28, avgDeliveryHrs: 6 },
        { pincode: '824232', district: 'Bodhgaya', orders: 22, avgDeliveryHrs: 8 },
        { pincode: '824125', district: 'Aurangabad', orders: 12, avgDeliveryHrs: 18 },
        { pincode: '805121', district: 'Nawada', orders: 9, avgDeliveryHrs: 22 },
        { pincode: '824233', district: 'Sherghati', orders: 15, avgDeliveryHrs: 14 },
      ],
      returnReasons: [
        { reason: 'Wrong size', count: 12 },
        { reason: 'Color mismatch', count: 8 },
        { reason: 'Damaged in transit', count: 5 },
        { reason: 'Not as described', count: 3 },
        { reason: 'Changed mind', count: 7 },
      ],
    };

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
