# Shiprocket API Integration Setup Guide

## What is Shiprocket?

Shiprocket is a courier aggregator that gives you access to 17+ courier partners through a single API. Instead of opening accounts with each courier individually, you use Shiprocket's API to:

- Auto-generate AWB numbers
- Compare rates across multiple couriers
- Auto-select cheapest courier
- Schedule pickups
- Track shipments in real-time

## Benefits

✅ **No need to visit courier offices** - Everything via API
✅ **Auto AWB generation** - No manual entry needed
✅ **Cheapest rates** - Automatically selects best courier
✅ **Single account** - Access 17+ couriers
✅ **Real-time tracking** - Automated status updates

---

## Setup Steps

### 1. Create Shiprocket Account

#### A. Sign Up (FREE)
1. Go to: https://app.shiprocket.in/signup
2. Enter business details:
   - Business Name: Sweta Fashion Points
   - Business Email: your-email@example.com
   - Mobile Number: Your number
   - GST Number: Optional (not required initially)

3. Verify email and mobile
4. Complete KYC:
   - Upload Aadhaar/PAN
   - Business address proof
   - Bank account details (for refunds/settlements)

**Approval Time:** 24-48 hours

#### B. Add Pickup Location

Once approved:
1. Login to Shiprocket dashboard
2. Go to **Settings** → **Company Pickup Locations**
3. Click **Add Pickup Location**
4. Enter your warehouse/store details:
   - Pickup Location Name: "Primary" (or your location name)
   - Address: Your store/warehouse address
   - City, State, Pincode
   - Contact Person, Phone

**This pincode will be used for all shipments**

---

### 2. Get API Credentials

1. Login to Shiprocket dashboard
2. Go to **Settings** → **API**
3. Click **Generate Token** or view existing credentials

You'll need:
- **Email:** The email you used for registration
- **Password:** Your account password (used for API authentication)

**Note:** Shiprocket uses email/password for API authentication, not separate API keys.

---

### 3. Add Environment Variables

#### A. Local Development

Add to `.env.local`:

```env
# Shiprocket API Credentials
SHIPROCKET_EMAIL=your-email@example.com
SHIPROCKET_PASSWORD=your-shiprocket-password
```

#### B. Vercel Production

1. Go to Vercel Dashboard
2. Select your project: `sweta-fashion-points`
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `SHIPROCKET_EMAIL` | your-email@example.com | Production, Preview, Development |
| `SHIPROCKET_PASSWORD` | your-password | Production, Preview, Development |

5. **Redeploy** the application

---

### 4. Add Funds to Shiprocket Wallet (For Testing)

1. Go to **Wallet** → **Add Balance**
2. Add ₹500-1000 for testing
3. Payment via:
   - UPI
   - Credit/Debit Card
   - Net Banking

**Rates:** ₹30-45 per 500g shipment (varies by route)

---

## How to Use in Your System

### Option 1: Automatic Shipment Creation (Recommended)

When you click "Assign Partner" and select "Courier Service" in the admin panel:

1. **Click "Use Shiprocket" button** (we'll add this)
2. System will:
   - Create order in Shiprocket
   - Auto-select cheapest courier
   - Generate AWB number
   - Schedule pickup (optional)
   - Update database with tracking info
3. **Done!** Customer gets tracking link automatically

### Option 2: Manual AWB Entry

If you book courier outside the system:
1. Book shipment on Shiprocket dashboard manually
2. Copy AWB number
3. Paste in "Tracking Number" field in our system

---

## API Usage Examples

### Check Available Couriers & Rates

```typescript
// GET /api/shiprocket/serviceability
const response = await fetch('/api/shiprocket/serviceability?' + new URLSearchParams({
  pickupPincode: '302001',   // Jaipur
  deliveryPincode: '400001', // Mumbai
  weight: '0.5',             // 500g in kg
  cod: 'false',              // Prepaid order
  declaredValue: '999'       // Order value
}));

const data = await response.json();
// Returns:
{
  success: true,
  couriers: [
    {
      courier_name: "Delhivery Surface",
      freight_charge: 38,
      estimated_delivery_days: "3-4",
      rate: 38
    },
    {
      courier_name: "DTDC Express",
      freight_charge: 45,
      estimated_delivery_days: "2-3",
      rate: 45
    },
    // ... more couriers
  ],
  recommendedCourier: { ... } // Cheapest option
}
```

### Create Shipment (Auto AWB)

```typescript
// POST /api/shiprocket/create-shipment
const response = await fetch('/api/shiprocket/create-shipment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'uuid-of-order',
    weight: 0.5,              // in kg
    dimensions: {             // in cm
      length: 30,
      breadth: 20,
      height: 10
    },
    pickupDate: '2026-02-15'  // Optional
  })
});

const data = await response.json();
// Returns:
{
  success: true,
  awbCode: "DEL123456789",
  courierName: "Delhivery Surface",
  trackingUrl: "https://www.delhivery.com/track/package/DEL123456789",
  shipmentId: 12345
}
```

### Track Shipment

```typescript
// GET /api/shiprocket/track?awb=DEL123456789
const response = await fetch('/api/shiprocket/track?awb=DEL123456789');
const data = await response.json();
// Returns current status and tracking history
```

---

## Pricing

### Test Mode
- ✅ FREE account
- Add ₹500-1000 to wallet for testing
- Pay per shipment: ₹30-45 per 500g

### Production/Business Rates

| Volume/Month | Rate per 500g | Savings |
|--------------|---------------|---------|
| 0-50 | ₹40-50 | Base rate |
| 50-200 | ₹35-45 | 10-15% |
| 200-500 | ₹30-40 | 20-25% |
| 500+ | ₹25-35 | 30-40% |

**Volume Discounts:** Automatic based on monthly shipments

---

## Testing Workflow

### Step 1: Test Serviceability
1. Go to `/admin/orders`
2. Open any paid order
3. Click "Check Rates" (we'll add this button)
4. System shows available couriers and prices

### Step 2: Create Test Shipment
1. Select cheapest courier (auto-selected)
2. Click "Create Shipment via Shiprocket"
3. System:
   - Creates order in Shiprocket
   - Generates AWB
   - Updates database
4. AWB appears in order details

### Step 3: Track Shipment
1. Click tracking link
2. Opens courier's tracking page
3. Shows real-time status

### Step 4: Pickup
- Shiprocket automatically schedules pickup based on your pickup location
- Courier partner collects package from your address
- No need to drop at courier office

---

## Troubleshooting

### Error: "Authentication failed"
- Check `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` in environment variables
- Verify credentials by logging into Shiprocket dashboard
- Redeploy after updating variables

### Error: "No couriers available"
- Check if delivery pincode is serviceable
- Verify pickup location is added in Shiprocket dashboard
- Some remote areas may not be covered

### Error: "Insufficient wallet balance"
- Add funds to Shiprocket wallet
- Minimum ₹100 required to create shipments

### AWB not generated
- Check Shiprocket dashboard for error messages
- Verify all required fields (weight, dimensions, address)
- Ensure pickup location is approved

---

## Support

**Shiprocket Support:**
- Email: care@shiprocket.com
- Phone: 1800-274-7467 (Toll-free)
- Live Chat: Available in dashboard

**Business Hours:**
- Mon-Sat: 10 AM - 7 PM
- Sunday: Closed

---

## Next Steps

After setup:
1. ✅ Create Shiprocket account
2. ✅ Add environment variables
3. ✅ Add ₹500-1000 to wallet
4. ✅ Test with 1-2 orders
5. ✅ Review courier performance
6. ✅ Scale to production

Once comfortable with API, we can add:
- Auto-pickup scheduling
- Bulk shipment creation
- Return order management
- COD remittance tracking

---

## Comparison: Manual vs Shiprocket

| Feature | Manual Courier | Shiprocket API |
|---------|----------------|----------------|
| AWB Generation | Visit office | Automatic |
| Rate Comparison | Manual | Automatic |
| Courier Selection | One at a time | 17+ options |
| Pickup | Drop at office | Home pickup |
| Tracking | Manual entry | Automatic |
| Time per order | 30-60 min | 2-3 min |

**Time Saved:** ~90% reduction in effort
