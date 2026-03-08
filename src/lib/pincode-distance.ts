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

/** Filter a product list to only include products from sellers within maxKm of the user.
 *  Uses direct lat/lng coordinates — no geocoding required.
 *  - Products with no seller coordinates are always included (safe fallback). */
export function filterProductsByDistance(
  products: any[],
  userLat: number,
  userLng: number,
  maxKm = MAX_DISTANCE_KM
): any[] {
  return products.filter((product) => {
    const sellerLat = product.seller?.latitude;
    const sellerLng = product.seller?.longitude;

    // No seller coordinates → include (safe fallback)
    if (sellerLat == null || sellerLng == null) return true;

    const dist = haversineDistance(
      userLat, userLng,
      Number(sellerLat), Number(sellerLng)
    );
    return dist <= maxKm;
  });
}
