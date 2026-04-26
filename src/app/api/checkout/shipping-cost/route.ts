import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/shiprocket';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/checkout/shipping-cost
 *
 * Calculates Shiprocket shipping cost for each seller in the cart and returns
 * a per-seller breakdown plus the total charge.
 *
 * Query params:
 *   deliveryPincode  — customer's 6-digit pincode (required)
 *   declaredValue    — order value in ₹ for insurance (optional)
 *   sellerWeights    — comma-separated "sellerId:weightKg" pairs
 *                      e.g. "uuid1:0.5,uuid2:1.00"
 *                      If omitted, falls back to single-call with env-var pincode.
 *
 * Response (single-seller or fallback):
 *   { serviceable, shippingCost, deliveryDays, courierName, isFreeShipping? }
 *
 * Response (multi-seller):
 *   { serviceable, shippingCost, deliveryDays, courierName, sellerBreakdown[] }
 *   sellerBreakdown item:
 *     { sellerId, sellerName, shippingCost, deliveryDays, courierName,
 *       serviceable, noPincode? }
 *
 * Graceful fallback: Shiprocket env vars missing → shippingCost: 0 so checkout
 * still works in dev/staging.
 */

interface SellerRecord {
  id: string;
  business_name: string;
  pincode: string | null;
  pickup_pincode: string | null;
}

interface SellerBreakdownItem {
  sellerId: string;
  sellerName: string;
  shippingCost: number;
  deliveryDays: string;
  courierName: string;
  serviceable: boolean;
  noPincode?: boolean;
}

async function getShippingForSeller(
  pickupPincode: string,
  deliveryPincode: string,
  weight: number,
  declaredValue?: number,
): Promise<{ shippingCost: number; deliveryDays: string; courierName: string; serviceable: boolean }> {
  const result = await shiprocketService.getServiceability({
    pickup_postcode:   pickupPincode,
    delivery_postcode: deliveryPincode,
    weight,
    cod:           0,
    declared_value: declaredValue,
  });

  if (!result.success || !result.couriers || result.couriers.length === 0) {
    return { shippingCost: 0, deliveryDays: '3–5', courierName: '', serviceable: false };
  }

  const best = result.recommendedCourier ?? result.couriers[0];
  return {
    shippingCost: Math.round(best.freight_charge ?? best.rate ?? 0),
    deliveryDays: String(best.estimated_delivery_days ?? '3–5').replace('-', '–'),
    courierName:  best.courier_name,
    serviceable:  true,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const deliveryPincode  = searchParams.get('deliveryPincode') ?? '';
  const declaredValue    = parseFloat(searchParams.get('declaredValue') ?? '0') || undefined;
  const sellerWeightsRaw = searchParams.get('sellerWeights') ?? '';

  if (!/^\d{6}$/.test(deliveryPincode)) {
    return NextResponse.json({ error: 'Invalid pincode' }, { status: 400 });
  }

  // ── Parse sellerWeights ───────────────────────────────────────────────────
  const sellerWeightPairs: { sellerId: string; weight: number }[] = [];
  if (sellerWeightsRaw) {
    sellerWeightsRaw.split(',').forEach(pair => {
      const [sid, w] = pair.trim().split(':');
      if (sid) sellerWeightPairs.push({ sellerId: sid, weight: Math.max(0.1, parseFloat(w) || 0.5) });
    });
  }

  // ── Graceful fallback: Shiprocket not configured ──────────────────────────
  if (!process.env.SHIPROCKET_EMAIL) {
    return NextResponse.json({
      serviceable:    true,
      shippingCost:   0,
      deliveryDays:   '3–5',
      courierName:    'Standard Delivery',
      isFreeShipping: true,
    });
  }

  // ── No seller info → single call with env-var pincode ────────────────────
  if (sellerWeightPairs.length === 0) {
    const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE ?? '';
    if (!pickupPincode) {
      return NextResponse.json({ serviceable: true, shippingCost: 0, deliveryDays: '3–5', courierName: 'Standard Delivery', isFreeShipping: true });
    }
    try {
      const totalWeight = 0.5;
      const res = await getShippingForSeller(pickupPincode, deliveryPincode, totalWeight, declaredValue);
      if (!res.serviceable) return NextResponse.json({ serviceable: false, error: 'Delivery is not available to this pincode yet.' });
      return NextResponse.json({ serviceable: true, shippingCost: res.shippingCost, deliveryDays: res.deliveryDays, courierName: res.courierName });
    } catch (err: any) {
      console.error('[checkout/shipping-cost]', err.message);
      return NextResponse.json({ serviceable: true, shippingCost: 0, deliveryDays: '3–5', courierName: 'Standard Delivery', isFreeShipping: true });
    }
  }

  // ── Fetch seller records ──────────────────────────────────────────────────
  const sellerIds = sellerWeightPairs.map(p => p.sellerId);
  let sellers: SellerRecord[] = [];
  try {
    const { data } = await supabaseAdmin
      .from('spf_sellers')
      .select('id, business_name, pincode, pickup_pincode')
      .in('id', sellerIds);
    sellers = (data as SellerRecord[]) ?? [];
  } catch (err) {
    console.error('[checkout/shipping-cost] Failed to fetch sellers:', err);
  }

  const sellerMap = new Map<string, SellerRecord>(sellers.map(s => [s.id, s]));
  const platformPincode = process.env.SHIPROCKET_PICKUP_PINCODE ?? '';

  // ── Per-seller Shiprocket calls (parallel) ────────────────────────────────
  const breakdown: SellerBreakdownItem[] = await Promise.all(
    sellerWeightPairs.map(async ({ sellerId, weight }) => {
      const seller = sellerMap.get(sellerId);
      const sellerName = seller?.business_name ?? 'Seller';
      const pickupPincode = seller?.pickup_pincode || seller?.pincode || platformPincode;

      if (!pickupPincode) {
        return {
          sellerId, sellerName,
          shippingCost: 0, deliveryDays: '3–5', courierName: '',
          serviceable: true, noPincode: true,
        };
      }

      try {
        const res = await getShippingForSeller(pickupPincode, deliveryPincode, weight, declaredValue);
        return { sellerId, sellerName, ...res };
      } catch {
        return {
          sellerId, sellerName,
          shippingCost: 0, deliveryDays: '3–5', courierName: 'Standard',
          serviceable: true,
        };
      }
    })
  );

  const totalShippingCost = breakdown.reduce((s, b) => s + b.shippingCost, 0);
  const anyNotServiceable = breakdown.some(b => !b.serviceable);

  if (anyNotServiceable) {
    return NextResponse.json({
      serviceable: false,
      error: 'Delivery is not available to this pincode from one or more sellers.',
      sellerBreakdown: breakdown,
    });
  }

  // Overall delivery days = max across sellers
  const maxDays = breakdown.reduce((max, b) => {
    const d = parseInt(String(b.deliveryDays).split('–')[1] || b.deliveryDays) || 5;
    return d > max ? d : max;
  }, 0);

  const dominantCourier = breakdown.find(b => b.courierName)?.courierName ?? 'Standard Delivery';

  return NextResponse.json({
    serviceable:      true,
    shippingCost:     totalShippingCost,
    deliveryDays:     String(maxDays),
    courierName:      dominantCourier,
    sellerBreakdown:  breakdown.length > 1 ? breakdown : undefined,
  });
}
