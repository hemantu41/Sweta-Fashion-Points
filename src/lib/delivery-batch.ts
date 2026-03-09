/** Delivery batch utility — nearest-neighbour grouping & route optimisation.
 *  No external API required: all calculations use the Haversine formula. */

const AVG_SPEED_KMH = 20;   // conservative average speed for SLA estimation
const MAX_BATCH_SIZE = 5;    // maximum orders per delivery trip
const MAX_GROUP_DIST_KM = 3; // deliveries must be within 3 km of each other to batch

// ─── Haversine great-circle distance ──────────────────────────────────────────
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface DeliveryStop {
  id: string;          // order_delivery ID
  lat: number;
  lng: number;
  slaDeadline: Date;
}

// ─── Nearest-neighbour TSP route optimisation ──────────────────────────────────
/** Given a pickup point and a set of delivery stops, returns the stop IDs in
 *  the order that minimises total travel distance (greedy nearest-neighbour). */
export function optimizeRoute(
  pickupLat: number,
  pickupLng: number,
  stops: Pick<DeliveryStop, 'id' | 'lat' | 'lng'>[]
): string[] {
  if (stops.length === 0) return [];
  if (stops.length === 1) return [stops[0].id];

  const remaining = [...stops];
  const route: string[] = [];
  let curLat = pickupLat;
  let curLng = pickupLng;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    remaining.forEach((stop, idx) => {
      const dist = haversineDistance(curLat, curLng, stop.lat, stop.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });

    const chosen = remaining.splice(nearestIdx, 1)[0];
    route.push(chosen.id);
    curLat = chosen.lat;
    curLng = chosen.lng;
  }

  return route;
}

// ─── SLA feasibility check ─────────────────────────────────────────────────────
/** Returns true if a partner at (partnerLat, partnerLng) can visit all stops in
 *  the optimised order and still meet every SLA deadline.
 *  Assumes AVG_SPEED_KMH average speed. */
export function canMeetSla(
  partnerLat: number,
  partnerLng: number,
  stops: DeliveryStop[]
): boolean {
  if (stops.length === 0) return true;

  const ordered = optimizeRoute(partnerLat, partnerLng, stops);
  let curLat = partnerLat;
  let curLng = partnerLng;
  let elapsedHours = 0;

  for (const id of ordered) {
    const stop = stops.find((s) => s.id === id)!;
    const dist = haversineDistance(curLat, curLng, stop.lat, stop.lng);
    elapsedHours += dist / AVG_SPEED_KMH;

    const estimatedArrival = new Date(Date.now() + elapsedHours * 3_600_000);
    if (estimatedArrival > stop.slaDeadline) return false;

    curLat = stop.lat;
    curLng = stop.lng;
  }

  return true;
}

// ─── Proximity clustering ──────────────────────────────────────────────────────
/** Groups delivery stops where every stop is within MAX_GROUP_DIST_KM of at
 *  least one other stop in the same cluster.  Returns arrays of stop IDs.
 *  Each cluster has at most MAX_BATCH_SIZE members. */
export function groupNearbyDeliveries(stops: DeliveryStop[]): string[][] {
  if (stops.length === 0) return [];

  const used = new Set<string>();
  const clusters: string[][] = [];

  for (const seed of stops) {
    if (used.has(seed.id)) continue;

    const cluster: DeliveryStop[] = [seed];
    used.add(seed.id);

    for (const candidate of stops) {
      if (used.has(candidate.id)) continue;
      if (cluster.length >= MAX_BATCH_SIZE) break;

      // Accept if within range of ANY stop already in the cluster
      const nearby = cluster.some(
        (s) => haversineDistance(s.lat, s.lng, candidate.lat, candidate.lng) <= MAX_GROUP_DIST_KM
      );
      if (nearby) {
        cluster.push(candidate);
        used.add(candidate.id);
      }
    }

    clusters.push(cluster.map((s) => s.id));
  }

  return clusters;
}

// ─── Distance scoring for partner selection ────────────────────────────────────
/** Returns 0–30 points based on partner distance from the seller pickup point. */
export function distanceScore(distanceKm: number): number {
  if (distanceKm <= 2)  return 30;
  if (distanceKm <= 5)  return 20;
  if (distanceKm <= 10) return 10;
  return 0;
}
