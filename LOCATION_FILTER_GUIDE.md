# Location-Based Product Visibility Guide

## Overview

Users only see products from sellers within **35 km** of their location (based on GPS coordinates captured from the browser).
If a user has not set their location, all products are shown along with a dismissible banner prompting them to add it in their profile.

---

## How It Works

```
User visits /mens (or any category page)
    ↓
AuthContext loads → user.latitude / user.longitude read from localStorage
    ↓
Category page appends &userLat=XX.XXXX&userLng=YY.YYYY to API request
    ↓
/api/products receives userLat + userLng params
    ↓
For each product: read seller.latitude and seller.longitude (stored in DB)
    ↓
Haversine distance calculated between user & seller (synchronous, no API call)
    ↓
Only products ≤ 35 km returned
    ↓
Page renders filtered results + Location Banner (if no location set)
```

No external APIs required — all distance calculations happen in-process using the Haversine formula.

---

## Database Setup (Run Once in Supabase)

### 1. Add coordinates to users table
File: `database/add-user-coordinates.sql`
```sql
ALTER TABLE spf_users
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);
```

### 2. Add coordinates to sellers table
File: `database/add-seller-coordinates.sql`
```sql
ALTER TABLE spf_sellers
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);
```

Run both SQL files in the Supabase SQL Editor. No other database setup required.

---

## No Environment Variable Required

Unlike the previous pincode-based approach, **no Google Maps API key is needed**. The browser's built-in `navigator.geolocation` API is used to capture coordinates directly — completely free and accurate.

---

## Files Changed / Created

### New SQL Migrations

| File | Purpose |
|---|---|
| `database/add-user-coordinates.sql` | Adds latitude/longitude columns to spf_users |
| `database/add-seller-coordinates.sql` | Adds latitude/longitude columns to spf_sellers |

### Core Utility

| File | Purpose |
|---|---|
| `src/lib/pincode-distance.ts` | Haversine distance + synchronous product filtering |
| `src/components/PincodeBanner.tsx` | Dismissible banner shown when user has no location set |

### Modified Files

| File | What Changed |
|---|---|
| `src/app/api/products/route.ts` | Accepts `userLat`/`userLng` params; seller join uses `latitude`/`longitude`; calls synchronous filter |
| `src/app/api/user/profile/route.ts` | GET/POST now include `latitude`/`longitude` fields |
| `src/app/api/sellers/me/route.ts` | GET returns seller `latitude`/`longitude`; PATCH endpoint saves seller location |
| `src/context/AuthContext.tsx` | Added `latitude?: number; longitude?: number` to User interface |
| `src/app/profile/page.tsx` | "Use My Location" geolocation button replaces pincode input |
| `src/app/seller/dashboard/page.tsx` | "Set Shop Location" card with geolocation button |
| `src/app/sarees/page.tsx` | Sends `userLat`/`userLng` in fetch URL |
| `src/app/mens/page.tsx` | Same as above |
| `src/app/womens/page.tsx` | Same as above |
| `src/app/kids/page.tsx` | Same as above |
| `src/app/footwear/page.tsx` | Same as above |
| `src/app/makeup/page.tsx` | Same as above |
| `src/app/search/page.tsx` | Same as above (inside SearchResults inner component) |

---

## Core Utility: `src/lib/pincode-distance.ts`

### `haversineDistance(lat1, lng1, lat2, lng2)`
```typescript
haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number
```
- Returns distance in kilometers using the great-circle formula

### `filterProductsByDistance(products, userLat, userLng, maxKm = 35)`
```typescript
filterProductsByDistance(products: any[], userLat: number, userLng: number, maxKm?: number): any[]
```
- **Synchronous** — no async, no DB calls, no external APIs
- Filters products where seller distance ≤ maxKm
- **Safe fallbacks:**
  - Seller has no lat/lng stored → product is always included

---

## Products API Changes (`src/app/api/products/route.ts`)

```typescript
// New params
const userLat = searchParams.get('userLat');
const userLng = searchParams.get('userLng');

// Cache bypassed when user coords are present (results are user-specific)
const useCache = !search && !(userLat && userLng);

// Seller join now includes latitude/longitude
seller:spf_sellers!...(id, business_name, ..., latitude, longitude)

// After fetch, apply synchronous distance filter
if (userLat && userLng) {
  const lat = parseFloat(userLat);
  const lng = parseFloat(userLng);
  if (!isNaN(lat) && !isNaN(lng)) {
    products = filterProductsByDistance(products, lat, lng);
  }
}
```

---

## Category Page Pattern

All 6 category pages + search page follow the same pattern:

```typescript
'use client';
import { useAuth } from '@/context/AuthContext';
import PincodeBanner from '@/components/PincodeBanner';

export default function CategoryPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Wait for auth to load before fetching (so coordinates are available)
  useEffect(() => {
    if (authLoading) return;
    fetchProducts();
  }, [authLoading]);

  const fetchProducts = async () => {
    const coords = user?.latitude && user?.longitude
      ? `&userLat=${user.latitude}&userLng=${user.longitude}`
      : '';
    const response = await fetch(`/api/products?category=X${coords}`, { cache: 'no-store' });
    // ...
  };

  return (
    <div>
      <PincodeBanner />  {/* Shows only if logged in + no location set */}
      {/* rest of page */}
    </div>
  );
}
```

---

## PincodeBanner Component (`src/components/PincodeBanner.tsx`)

Renders **null** (hidden) when any of these are true:
- Auth is still loading
- User is not logged in
- `user.latitude` **and** `user.longitude` are both set
- Banner was dismissed this session (stored in `sessionStorage` key: `pincodeBannerDismissed`)

Shows when:
- User is logged in but has no location set

---

## User Flow

### First Visit (No Location Set)
1. User visits `/mens`
2. Auth loads → no coordinates → fetch runs without `userLat`/`userLng`
3. All products shown
4. Location Banner appears: *"Enable your location to discover products from sellers near you → Set in Profile"*

### Setting Location (Customer)
1. User goes to `/profile` → clicks **"Use My Location"** button → browser asks for permission → allow
2. Coordinates captured and saved to profile → AuthContext updated
3. Visits `/mens` again
4. Auth loads → coordinates present → fetch runs with `&userLat=XX.XXXX&userLng=YY.YYYY`
5. API filters products to ≤ 35 km — only nearby products shown, no banner

### Setting Location (Seller)
1. Seller goes to `/seller/dashboard`
2. Sees "Shop Location" card → clicks **"Set Shop Location"** button → browser asks for permission → allow
3. Coordinates saved to `spf_sellers.latitude` / `spf_sellers.longitude` via PATCH `/api/sellers/me`
4. Their products now appear in nearby customer searches

### Dismissing the Banner
- User clicks **✕** → banner hidden for current browser session
- On next session (new tab/browser restart) → banner appears again until location is set

---

## Testing Checklist

- [ ] Run both SQL migrations in Supabase SQL Editor
- [ ] Log in → go to `/profile` → click "Use My Location" → allow browser permission → Save profile
- [ ] Visit `/mens` → check DevTools Network → confirm `userLat=XX&userLng=YY` in API request URL
- [ ] Check terminal logs: `[Products API] Location filter (XX,YY): X → Y products`
- [ ] Go to `/seller/dashboard` → click "Set Shop Location" → allow permission → confirm success
- [ ] Visit `/mens` again — only products from sellers within 35 km should appear
- [ ] Remove location: set `latitude`/`longitude` to NULL in Supabase for test user → banner reappears
- [ ] Dismiss banner → navigate away → come back → banner stays hidden (same session)
- [ ] Open new tab → banner reappears (new session)

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `userLat`/`userLng` missing from API URL | Auth not loaded or location not saved | Check that profile page "Use My Location" saved successfully |
| All products still show after setting location | Sellers have no lat/lng in DB | Sellers need to click "Set Shop Location" in their dashboard |
| Geolocation button shows error | Browser location access denied | Allow location in browser settings for this site |
| Banner not showing | User not logged in, location already set, or dismissed | Check all three conditions |
| Banner keeps reappearing on same session | sessionStorage not persisting | Check browser settings (private mode clears sessionStorage) |

---

## Configuration

| Setting | Value | Location |
|---|---|---|
| Max distance | 35 km | `src/lib/pincode-distance.ts` → `filterProductsByDistance` default param |
| Banner dismiss storage | `sessionStorage['pincodeBannerDismissed']` | `src/components/PincodeBanner.tsx` |
| Seller location API | `PATCH /api/sellers/me` | `src/app/api/sellers/me/route.ts` |
| User location API | `POST /api/user/profile` | `src/app/api/user/profile/route.ts` |

To change the distance limit (e.g., to 50 km), update `filterProductsByDistance` in `src/lib/pincode-distance.ts`:
```typescript
export function filterProductsByDistance(
  products: any[],
  userLat: number,
  userLng: number,
  maxKm: number = 50  // ← change here
)
```

---

## Version History

| Version | Date | Change |
|---|---|---|
| v1.0.0 | March 2026 | Initial implementation — 35 km filter, Google Maps geocoding (pincode-based), DB cache, PincodeBanner |
| v2.0.0 | March 2026 | Replaced pincode geocoding with direct browser GPS coordinates — no API key needed, synchronous, more accurate |
