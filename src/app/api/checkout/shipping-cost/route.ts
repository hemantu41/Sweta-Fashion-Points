import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/shiprocket';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/checkout/shipping-cost
 *
 * Checks Shiprocket serviceability for a customer's delivery pincode and
 * returns the recommended courier's rate and estimated delivery days.
 *
 * The pickup pincode is resolved in this order:
 *   1. Seller's pickup_pincode / pincode from spf_sellers (via sellerIds param)
 *   2. SHIPROCKET_PICKUP_PINCODE env var (platform fallback)
 *
 * For multi-seller carts, the dominant seller (highest total quantity) is used
 * as the pickup location to avoid double-charging the customer.
 *
 * Query params:
 *   deliveryPincode  — customer's 6-digit pincode (required)
 *   weight           — total shipment weight in kg (default: 0.5)
 *   declaredValue    — order value in ₹ for insurance (optional)
 *   sellerIds        — comma-separated seller UUIDs from cart items (optional)
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
  const sellerIdsParam = searchParams.get('sellerIds') ?? '';

  // Basic pincode validation
  if (!/^\d{6}$/.test(deliveryPincode)) {
    return NextResponse.json({ error: 'Invalid pincode' }, { status: 400 });
  }

  // ── Resolve pickup pincode from seller(s) ────────────────────────────────
  let pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE ?? '';

  if (sellerIdsParam) {
    const sellerIds = sellerIdsParam
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (sellerIds.length > 0) {
      try {
        const { data: sellers } = await supabaseAdmin
          .from('spf_sellers')
          .select('id, pickup_pincode, pincode')
          .in('id', sellerIds);

        if (sellers && sellers.length > 0) {
          // For multi-seller carts, use the first seller that has a pincode.
          // sellerIds is ordered by dominant seller (most items) from the frontend.
          const dominant = sellers.find(s => s.pickup_pincode || s.pincode);
          if (dominant) {
            pickupPincode = dominant.pickup_pincode || dominant.pincode || pickupPincode;
          }
        }
      } catch (err) {
        console.error('[checkout/shipping-cost] Failed to fetch seller pincode:', err);
        // continue with env-var fallback
      }
    }
  }

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
