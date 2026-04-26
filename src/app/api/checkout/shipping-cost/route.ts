import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * GET /api/checkout/shipping-cost
 *
 * Checks Shiprocket serviceability for a customer's delivery pincode and
 * returns the recommended courier's rate and estimated delivery days.
 *
 * The platform pickup pincode is read from the SHIPROCKET_PICKUP_PINCODE
 * environment variable and never exposed to the browser.
 *
 * Query params:
 *   deliveryPincode  — customer's 6-digit pincode (required)
 *   weight           — total shipment weight in kg (default: 0.5)
 *   declaredValue    — order value in ₹ for insurance (optional)
 *
 * Graceful fallback: if Shiprocket is not configured (no env vars set),
 * returns serviceable=true with shippingCost=0 so checkout still works
 * in dev/staging environments.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const deliveryPincode = searchParams.get('deliveryPincode') ?? '';
  const weight         = Math.max(0.1, parseFloat(searchParams.get('weight')        ?? '0.5'));
  const declaredValue  = parseFloat(searchParams.get('declaredValue') ?? '0') || undefined;

  // Basic pincode validation
  if (!/^\d{6}$/.test(deliveryPincode)) {
    return NextResponse.json({ error: 'Invalid pincode' }, { status: 400 });
  }

  const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE ?? '';

  // ── Graceful fallback when Shiprocket is not configured ───────────────────
  if (!pickupPincode || !process.env.SHIPROCKET_EMAIL) {
    return NextResponse.json({
      serviceable:    true,
      shippingCost:   0,
      deliveryDays:   '3–5',
      courierName:    'Standard Delivery',
      isFreeShipping: true,
    });
  }

  try {
    const result = await shiprocketService.getServiceability({
      pickup_postcode:   pickupPincode,
      delivery_postcode: deliveryPincode,
      weight,
      cod:           0,           // prepaid only at checkout
      declared_value: declaredValue,
    });

    // No couriers available → pincode not serviceable
    if (!result.success || !result.couriers || result.couriers.length === 0) {
      return NextResponse.json({
        serviceable: false,
        error:       'Delivery is not available to this pincode yet.',
      });
    }

    // Use recommendedCourier (cheapest with best SLA) returned by Shiprocket
    const best = result.recommendedCourier ?? result.couriers[0];

    // Parse estimated days — Shiprocket returns strings like "2-3" or "3"
    const rawDays   = String(best.estimated_delivery_days ?? '3–5').replace('-', '–');
    const freightAmt = Math.round(best.freight_charge ?? best.rate ?? 0);

    return NextResponse.json({
      serviceable:  true,
      shippingCost: freightAmt,
      deliveryDays: rawDays,
      courierName:  best.courier_name,
    });

  } catch (error: any) {
    console.error('[checkout/shipping-cost]', error.message);

    // If credentials are wrong/missing, degrade gracefully
    if (
      error.message?.includes('not configured') ||
      error.message?.includes('credentials') ||
      error.message?.includes('auth')
    ) {
      return NextResponse.json({
        serviceable:    true,
        shippingCost:   0,
        deliveryDays:   '3–5',
        courierName:    'Standard Delivery',
        isFreeShipping: true,
      });
    }

    return NextResponse.json(
      { serviceable: false, error: 'Unable to check delivery at the moment. Please try again.' },
      { status: 500 }
    );
  }
}
