# Location-Based Product Visibility Guide

## Overview

Users only see products from sellers within **35 km** of their location (based on pincode).
If a user has not set their pincode, all products are shown along with a dismissible banner prompting them to add it.

---

## How It Works

```
User visits /mens (or any category page)
    ↓
AuthContext loads → user.pincode read from localStorage
    ↓
Category page appends &userPincode=XXXXXX to API request
    ↓
/api/products receives userPincode param
    ↓
For each product: geocode seller's pincode (DB cache first, then Google Maps)
    ↓
Haversine distance calculated between user & seller
    ↓
Only products ≤ 35 km returned
    ↓
Page renders filtered results + PincodeBanner (if no pincode set)
```

---

## Database Setup (Run Once in Supabase)

### 1. Add pincode to users table
File: `database/add-user-pincode.sql`
```sql
ALTER TABLE spf_users ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
```

### 2. Create geocoding cache table
File: `database/pincode-coordinates-cache.sql`
```sql
CREATE TABLE IF NOT EXISTS spf_pincode_coordinates (
  pincode    VARCHAR(10)    PRIMARY KEY,
  latitude   DECIMAL(10, 7) NOT NULL,
  longitude  DECIMAL(10, 7) NOT NULL,
  cached_at  TIMESTAMPTZ    DEFAULT NOW()
);
```

Each Indian pincode is geocoded **once** via Google Maps and stored here. All future lookups read from this cache — no repeat API calls.

---

## Environment Variable Required

Add to `.env.local` (server-side only — no `NEXT_PUBLIC_` prefix):
```
GOOGLE_MAPS_API_KEY=AIzaSy...your-key-here
```

**How to get the key:**
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Library → Enable **Geocoding API**
3. APIs & Services → Credentials → Create API Key
4. Restrict the key to "Geocoding API" only

**Cost:** $200 free credit/month (~40,000 geocoding calls). Since each pincode is geocoded only once ever, actual usage is minimal.

---

## Files Changed / Created

### New Files

| File | Purpose |
|---|---|
| `database/add-user-pincode.sql` | SQL migration — adds pincode column to spf_users |
| `database/pincode-coordinates-cache.sql` | SQL migration — creates geocoding cache table |
| `src/lib/pincode-distance.ts` | Core utility: geocoding + Haversine distance + filtering |
| `src/components/PincodeBanner.tsx` | Dismissible banner shown when user has no pincode |

### Modified Files

| File | What Changed |
|---|---|
| `src/app/api/products/route.ts` | Accepts `userPincode` param; bypasses cache; calls distance filter |
| `src/app/api/user/profile/route.ts` | GET/POST now include `pincode` field with 6-digit validation |
| `src/context/AuthContext.tsx` | Added `pincode?: string` to User interface |
| `src/app/profile/page.tsx` | Added Pincode input field |
| `src/app/sarees/page.tsx` | useAuth + wait for auth + userPincode in fetch + PincodeBanner |
| `src/app/mens/page.tsx` | Same as above |
| `src/app/womens/page.tsx` | Same as above |
| `src/app/kids/page.tsx` | Same as above |
| `src/app/footwear/page.tsx` | Same as above |
| `src/app/makeup/page.tsx` | Same as above |
| `src/app/search/page.tsx` | Same as above (inside SearchResults inner component) |

---

## Core Utility: `src/lib/pincode-distance.ts`

### `geocodePincode(pincode)`
```typescript
geocodePincode(pincode: string): Promise<{ lat: number; lng: number } | null>
```
- Checks `spf_pincode_coordinates` table first (cache hit → no API call)
- On cache miss: calls Google Maps Geocoding API with `components=postal_code:${pincode}|country:IN`
- Stores result in cache for future use
- Returns `null` on failure (safe — products are not hidden if geocoding fails)

### `haversineDistance(lat1, lng1, lat2, lng2)`
```typescript
haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number
```
- Returns distance in kilometers using the great-circle formula

### `filterProductsByDistance(products, userPincode, maxKm = 35)`
```typescript
filterProductsByDistance(products: any[], userPincode: string, maxKm?: number): Promise<any[]>
```
- Geocodes user pincode + all unique seller pincodes in parallel (`Promise.all`)
- Filters products where seller distance ≤ maxKm
- **Safe fallbacks:**
  - User pincode geocoding fails → returns all products unchanged
  - Seller has no pincode → product is always included
  - Seller pincode geocoding fails → product is always included

---

## Products API Changes (`src/app/api/products/route.ts`)

```typescript
// New param
const userPincode = searchParams.get('userPincode');

// Cache bypassed when userPincode is present (results are user-specific)
const useCache = !search && !userPincode;

// Seller join now includes pincode
seller:spf_sellers!...(id, business_name, ..., pincode)

// After fetch, apply distance filter
if (userPincode) {
  products = await filterProductsByDistance(products, userPincode);
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

  // Wait for auth to load before fetching (so pincode is available)
  useEffect(() => {
    if (authLoading) return;
    fetchProducts();
  }, [authLoading]);

  const fetchProducts = async () => {
    const url = `/api/products?category=X${user?.pincode ? `&userPincode=${user.pincode}` : ''}`;
    const response = await fetch(url, { cache: 'no-store' });
    // ...
  };

  return (
    <div>
      <PincodeBanner />  {/* Shows only if logged in + no pincode set */}
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
- `user.pincode` is already set
- Banner was dismissed this session (stored in `sessionStorage` key: `pincodeBannerDismissed`)

Shows when:
- User is logged in but has no pincode set

---

## User Flow

### First Visit (No Pincode)
1. User visits `/mens`
2. Auth loads → no pincode → fetch runs without `userPincode`
3. All products shown
4. PincodeBanner appears: *"Set your pincode to discover products from sellers near you → Add in Profile"*

### After Setting Pincode
1. User goes to `/profile` → enters 6-digit pincode → Save
2. Visits `/mens` again
3. Auth loads → pincode present → fetch runs with `&userPincode=110001`
4. API geocodes user pincode + seller pincodes → filters to ≤ 35 km
5. Only nearby products shown, no banner

### Dismissing the Banner
- User clicks **✕** → banner hidden for current browser session
- On next session (new tab/browser restart) → banner appears again until pincode is set

---

## Seller Pincode Requirement

For the filter to work, sellers must have a pincode saved in `spf_sellers.pincode`.

**Products with no seller pincode are always shown** (safe fallback — they are never hidden).

To check which sellers have pincodes set:
```sql
SELECT id, business_name, pincode
FROM spf_sellers
WHERE status = 'active'
ORDER BY pincode NULLS LAST;
```

---

## Testing Checklist

- [ ] Run SQL migrations in Supabase SQL Editor
- [ ] Add `GOOGLE_MAPS_API_KEY` to `.env.local`
- [ ] Log in → go to `/profile` → set a valid 6-digit pincode → Save
- [ ] Visit `/mens` → check DevTools Network → confirm `userPincode=XXXXXX` in API call
- [ ] Check terminal logs: `[Products API] Distance filter: X products → Y products`
- [ ] Check Supabase: `SELECT * FROM spf_pincode_coordinates;` — rows should appear
- [ ] Clear pincode in profile → revisit `/mens` → all products shown + banner visible
- [ ] Dismiss banner → navigate away → come back → banner stays hidden (same session)
- [ ] Open new tab → banner reappears (new session)

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `userPincode` missing from API URL | Auth not loading or pincode not saved | Check profile save, check AuthContext pincode field |
| All products still show after setting pincode | Sellers have no pincode in DB | Sellers need to update their pincode in seller profile |
| Google Maps error in server logs | Wrong API key or Geocoding API not enabled | Verify key in Google Cloud Console → enable Geocoding API |
| `spf_pincode_coordinates` table doesn't exist | SQL migration not run | Run `database/pincode-coordinates-cache.sql` in Supabase |
| Banner not showing | User is not logged in, or pincode is already set, or dismissed | Check all three conditions |
| Banner keeps reappearing on same session | sessionStorage not persisting | Check browser settings (private mode clears sessionStorage) |

---

## Configuration

| Setting | Value | Location |
|---|---|---|
| Max distance | 35 km | `src/lib/pincode-distance.ts` → `filterProductsByDistance` default param |
| Geocoding country | India (IN) | `src/lib/pincode-distance.ts` → `geocodePincode` |
| Cache table | `spf_pincode_coordinates` | Supabase DB |
| Banner dismiss storage | `sessionStorage['pincodeBannerDismissed']` | `src/components/PincodeBanner.tsx` |
| Pincode validation | 6 digits (`/^\d{6}$/`) | `src/app/api/user/profile/route.ts` |

To change the distance limit (e.g., to 50 km), update `filterProductsByDistance` in `src/lib/pincode-distance.ts`:
```typescript
export async function filterProductsByDistance(
  products: any[],
  userPincode: string,
  maxKm: number = 50  // ← change here
)
```

---

## Version History

| Version | Date | Change |
|---|---|---|
| v1.0.0 | March 2026 | Initial implementation — 35 km filter, Google Maps geocoding, DB cache, PincodeBanner, 6 category pages + search |
