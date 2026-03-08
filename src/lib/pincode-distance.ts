import { supabase } from '@/lib/supabase';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MAX_DISTANCE_KM = 35;

/** Haversine great-circle distance between two lat/lng points, returns km. */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Fetch lat/lng for an Indian pincode.
 *  Checks the DB cache first; on miss, calls Google Maps Geocoding API and caches the result.
 *  Returns null if geocoding fails. */
export async function geocodePincode(
  pincode: string
): Promise<{ lat: number; lng: number } | null> {
  if (!pincode || !/^\d{6}$/.test(pincode)) return null;

  // 1. Check DB cache
  const { data: cached } = await supabase
    .from('spf_pincode_coordinates')
    .select('latitude, longitude')
    .eq('pincode', pincode)
    .maybeSingle();

  if (cached) {
    return { lat: Number(cached.latitude), lng: Number(cached.longitude) };
  }

  // 2. Call Google Maps Geocoding API
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[PincodeDistance] GOOGLE_MAPS_API_KEY is not set in .env.local');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${pincode}|country:IN&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.status !== 'OK' || !json.results?.[0]) {
      console.warn(`[PincodeDistance] Geocoding failed for pincode ${pincode}: ${json.status}`);
      return null;
    }

    const { lat, lng } = json.results[0].geometry.location;

    // 3. Store in DB cache (fire-and-forget — don't block the response)
    supabase
      .from('spf_pincode_coordinates')
      .insert({ pincode, latitude: lat, longitude: lng })
      .then(({ error }) => {
        if (error && error.code !== '23505') { // ignore unique-violation on race
          console.error('[PincodeDistance] Cache insert error:', error.message);
        }
      });

    return { lat, lng };
  } catch (err) {
    console.error('[PincodeDistance] Geocoding request failed:', err);
    return null;
  }
}

/** Filter a product list to only include products from sellers within maxKm of userPincode.
 *  - If userPincode geocoding fails, all products are returned unchanged (safe fallback).
 *  - Products with no seller pincode are always included (safe fallback). */
export async function filterProductsByDistance(
  products: any[],
  userPincode: string,
  maxKm = MAX_DISTANCE_KM
): Promise<any[]> {
  const userCoords = await geocodePincode(userPincode);
  if (!userCoords) return products; // geocoding failed — show all

  // Collect unique non-null seller pincodes
  const sellerPincodes = [
    ...new Set(
      products
        .map((p) => p.seller?.pincode)
        .filter((pc): pc is string => !!pc && /^\d{6}$/.test(pc))
    ),
  ];

  if (sellerPincodes.length === 0) return products;

  // Geocode all seller pincodes in parallel (all DB-cached after first run)
  const coordEntries = await Promise.all(
    sellerPincodes.map(async (pc) => {
      const coords = await geocodePincode(pc);
      return [pc, coords] as const;
    })
  );

  const coordMap = new Map(coordEntries.filter(([, c]) => c !== null));

  return products.filter((product) => {
    const sellerPincode = product.seller?.pincode;
    if (!sellerPincode) return true; // no seller pincode → include (safe)

    const sellerCoords = coordMap.get(sellerPincode);
    if (!sellerCoords) return true; // geocoding failed for this seller → include (safe)

    const dist = haversineDistance(
      userCoords.lat, userCoords.lng,
      sellerCoords.lat, sellerCoords.lng
    );
    return dist <= maxKm;
  });
}
