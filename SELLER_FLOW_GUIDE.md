# Seller Flow Guide - Sweta Fashion Points

Complete documentation for the seller registration, approval, and product management workflow.

---

## Table of Contents

1. [Overview](#overview)
2. [Seller Registration Flow](#seller-registration-flow)
3. [Admin Approval Process](#admin-approval-process)
4. [Seller Dashboard Access](#seller-dashboard-access)
5. [Adding Products](#adding-products)
6. [Managing Products](#managing-products)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)
9. [Authentication & Authorization](#authentication--authorization)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The seller system allows approved merchants to:
- Register as sellers with business information
- Get approved by administrators
- Access a seller dashboard
- Add and manage their products
- Track sales and inventory

**Key Features:**
- Email verification (mobile verification removed - optional)
- Admin approval required before selling
- Automatic status refresh on page load
- Shop information collection during product creation
- Cloudinary integration for product images

---

## Seller Registration Flow

### Step 1: User Signup
**Route:** `/signup`

1. User creates account with email
2. Email verification via OTP (6-digit code)
3. Mobile number is optional (no verification required)
4. Account created in `spf_users` table

### Step 2: Seller Registration
**Route:** `/seller/register`

**Prerequisites:**
- User must be logged in
- User account must exist in `spf_users`

**Required Information:**
- Business Name (English & Hindi)
- GSTIN (optional)
- PAN Card Number
- Business Email (with OTP verification)
- Business Phone (optional, no verification)
- Complete Address (line1, line2, city, state, pincode)
- Bank Details (account name, number, IFSC, bank name)

**Process:**
1. User fills registration form
2. Verifies business email via OTP
3. Submits form → Creates record in `spf_sellers` table
4. Status set to `pending`
5. User sees "Application Under Review" page

**API Endpoint:**
```http
POST /api/sellers/register
Content-Type: application/json

{
  "userId": "user-uuid",
  "businessName": "Shop Name",
  "businessNameHi": "दुकान का नाम",
  "gstin": "22AAAAA0000A1Z5",
  "pan": "ABCDE1234F",
  "businessEmail": "shop@example.com",
  "businessPhone": "9876543210",
  "addressLine1": "Shop Address",
  "city": "Delhi",
  "state": "Delhi",
  "pincode": "110001",
  "bankAccountName": "Shop Owner",
  "bankAccountNumber": "1234567890",
  "bankIfsc": "HDFC0001234",
  "bankName": "HDFC Bank"
}
```

**Database Record Created:**
```sql
-- spf_sellers table
{
  id: uuid,
  user_id: uuid,
  business_name: "Shop Name",
  status: "pending", -- pending, approved, rejected, suspended
  created_at: timestamp
}
```

---

## Admin Approval Process

### Admin Dashboard
**Route:** `/admin/sellers`

**Admin Actions:**
1. View all seller applications
2. Filter by status (pending, approved, rejected, suspended)
3. View seller details
4. Approve/Reject/Suspend sellers

### Approval API
```http
PUT /api/sellers/{seller-id}
Content-Type: application/json

{
  "userId": "admin-user-id",
  "action": "approve" // or "reject" or "suspend"
}
```

**On Approval:**
1. Seller status updated to `approved`
2. `approved_by` and `approved_at` fields set
3. Seller can now access dashboard and add products

**Status Refresh Logic:**
- When seller visits `/seller/register`, status is auto-fetched from database
- If status changed to `approved`, page auto-reloads after 500ms
- User context (localStorage) updated with new status
- Navbar shows "Seller Dashboard" link

---

## Seller Dashboard Access

### Accessing Dashboard
**Route:** `/seller/dashboard`

**Prerequisites:**
- User logged in
- User is registered as seller (`isSeller: true`)
- Seller status is `approved`
- Valid `sellerId` in user context

### Authentication Flow

```javascript
// 1. Page loads → useEffect runs
useEffect(() => {
  if (!user) {
    router.push('/login');
    return;
  }
  fetchSellerData();
}, [user]);

// 2. Fetch seller profile
const response = await fetch(`/api/sellers/me?userId=${user.id}`);

// 3. Check seller status
if (sellerData.seller.status !== 'approved') {
  alert('Your seller account is pending. Please wait for admin approval.');
  router.push('/');
  return;
}
```

### Dashboard Features
- View products added by seller
- Add new products
- Edit existing products
- View sales statistics (future feature)
- Manage inventory

### Navigation
**Navbar Dropdown Menu:**
```
Profile Details
Order Details
Payment Method
Address
─────────────────
Seller Dashboard  ← Only shown if isApprovedSeller === true
─────────────────
Manage Orders (Admin only)
Manage Products (Admin only)
```

---

## Adding Products

### Route
**Page:** `/seller/dashboard/products/new`

### Prerequisites
- Seller must be approved (`status: 'approved'`)
- Valid `sellerId` in user context

### Required Fields

#### 1. Shop Information (Mandatory)
These fields update the seller's profile:
- **Shop Name** → saved to `business_name`
- **Shop Mobile** (10 digits) → saved to `business_phone`
- **Shop Location** → saved to `address_line1`

#### 2. Product Information
- **Product ID** (unique identifier, e.g., `mens-jeans-6`)
- **Product Name** (English & Hindi)
- **Category** (mens, womens, sarees, kids)
- **Sub-Category** (varies by category)
- **Price** (₹)
- **Original Price** (₹, optional)
- **Price Range** (budget, mid, premium)
- **Description** (English & Hindi)
- **Fabric** (English & Hindi)
- **Stock Quantity**

#### 3. Product Images (Required)
- Upload via Cloudinary
- Minimum: 1 image
- Maximum: 5 images
- First image becomes main product image

### Form Validation

```javascript
// Shop Information
if (!shopName || !shopMobile || !shopLocation) {
  error: 'Please fill in all shop information fields';
}

if (shopMobile.length !== 10) {
  error: 'Shop mobile number must be 10 digits';
}

// Images
if (images.length === 0) {
  error: 'Please upload at least one product image';
}

// Product Details
required: productId, name, category, subCategory, price, stockQuantity
```

### API Request

```http
POST /api/products
Content-Type: application/json

{
  "userId": "user-uuid",
  "sellerId": "seller-uuid",
  "product": {
    "productId": "mens-jeans-6",
    "name": "Classic Blue Jeans",
    "nameHi": "क्लासिक ब्लू जींस",
    "category": "mens",
    "subCategory": "jeans",
    "price": 1299,
    "originalPrice": 2499,
    "priceRange": "mid",
    "description": "Comfortable cotton jeans",
    "fabric": "Cotton",
    "mainImage": "cloudinary-url-1",
    "images": ["cloudinary-url-1", "cloudinary-url-2"],
    "stockQuantity": 50,
    "shopName": "Sweta Fashion Store",
    "shopMobile": "9876543210",
    "shopLocation": "Sector 15, Noida"
  }
}
```

### Backend Process

1. **Validate Authorization**
   - Check if user is admin OR approved seller
   - If seller, verify status is `approved`

2. **Update Seller Profile**
   ```sql
   UPDATE spf_sellers
   SET business_name = 'Shop Name',
       business_phone = '9876543210',
       address_line1 = 'Shop Location'
   WHERE id = seller_id;
   ```

3. **Create Product**
   ```sql
   INSERT INTO spf_productdetails (
     product_id, name, category, price, seller_id, ...
   ) VALUES (...);
   ```

4. **Success Response**
   - Product created successfully
   - Redirect to `/seller/dashboard`

---

## Managing Products

### View Products
**API Endpoint:**
```http
GET /api/products?sellerId={seller-id}
```

Returns all products for the specified seller.

### Edit Product
**Route:** `/admin/products/edit/[id]`

**API Endpoint:**
```http
PUT /api/products/{product-id}
Content-Type: application/json

{
  "userId": "user-uuid",
  "product": { /* updated fields */ }
}
```

### Delete Product
**API Endpoint:**
```http
DELETE /api/products/{product-id}?userId={user-id}
```

---

## API Endpoints

### Seller Management

#### Register Seller
```http
POST /api/sellers/register
```

#### Get Seller Profile
```http
GET /api/sellers/me?userId={user-id}
```

#### Update Seller
```http
PUT /api/sellers/{seller-id}
```

#### Approve/Reject Seller (Admin)
```http
PUT /api/sellers/{seller-id}
Body: { "userId": "admin-id", "action": "approve" }
```

### Product Management

#### Create Product
```http
POST /api/products
Authorization: Admin OR Approved Seller
```

#### Get Products
```http
GET /api/products?sellerId={seller-id}
GET /api/products?category=mens
GET /api/products?isActive=true
```

#### Update Product
```http
PUT /api/products/{product-id}
```

#### Delete Product
```http
DELETE /api/products/{product-id}?userId={user-id}
```

### Authentication

#### Send OTP
```http
POST /api/sellers/send-verification-otp
Body: { "type": "email", "value": "email@example.com" }
```

#### Verify OTP
```http
POST /api/sellers/verify-otp
Body: { "type": "email", "value": "email@example.com", "otp": "123456" }
```

---

## Database Schema

### spf_sellers Table

```sql
CREATE TABLE spf_sellers (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to User
  user_id UUID UNIQUE NOT NULL REFERENCES spf_users(id),

  -- Business Information
  business_name VARCHAR(255) NOT NULL,
  business_name_hi VARCHAR(255),
  gstin VARCHAR(15),
  pan VARCHAR(10),

  -- Contact
  business_email VARCHAR(255),
  business_phone VARCHAR(15),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),

  -- Bank Details
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_ifsc VARCHAR(11),
  bank_name VARCHAR(255),

  -- Status
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_by UUID REFERENCES spf_users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,

  -- Settings
  commission_percentage DECIMAL(5,2) DEFAULT 10.00,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  documents JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### spf_productdetails Table

```sql
CREATE TABLE spf_productdetails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product Identification
  product_id VARCHAR(100) UNIQUE NOT NULL,

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  name_hi VARCHAR(255),
  category VARCHAR(50) NOT NULL,
  sub_category VARCHAR(50),

  -- Pricing
  price INTEGER NOT NULL,
  original_price INTEGER,
  price_range VARCHAR(20),

  -- Details
  description TEXT,
  description_hi TEXT,
  fabric VARCHAR(100),
  fabric_hi VARCHAR(100),

  -- Media
  main_image VARCHAR(500),
  images JSONB DEFAULT '[]',

  -- Variants
  colors JSONB DEFAULT '[]',
  sizes JSONB DEFAULT '[]',

  -- Inventory
  stock_quantity INTEGER DEFAULT 0,

  -- Flags
  is_new_arrival BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Seller Link
  seller_id UUID REFERENCES spf_sellers(id),

  -- Metadata
  created_by UUID REFERENCES spf_users(id),
  updated_by UUID REFERENCES spf_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Authentication & Authorization

### User Context (AuthContext)

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  isAdmin?: boolean;

  // Seller fields
  isSeller?: boolean;
  sellerId?: string;
  sellerStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
}

// Computed values
isApprovedSeller = user?.isSeller === true && user?.sellerStatus === 'approved'
```

### Status Refresh Logic

```typescript
// Runs on /seller/register page load
useEffect(() => {
  const refreshSellerStatus = async () => {
    if (!user) return;

    const response = await fetch(`/api/sellers/me?userId=${user.id}`);
    if (response.ok) {
      const data = await response.json();
      const latestStatus = data.seller?.status;

      // Update user context with latest status
      if (data.seller) {
        const updatedUser = {
          ...user,
          isSeller: true,
          sellerId: data.seller.id,
          sellerStatus: latestStatus,
        };
        login(updatedUser); // Updates localStorage

        // Force page reload if status changed to approved
        if (currentStatus !== 'approved' && latestStatus === 'approved') {
          setTimeout(() => window.location.reload(), 500);
        }
      }
    }
  };

  refreshSellerStatus();
}, [user?.id]);
```

### API Authorization

```typescript
// In /api/products POST endpoint
const userIsAdmin = await isAdmin(userId);
let userSellerId = sellerId;

if (!userIsAdmin) {
  // Check if user is an approved seller
  const { data: sellerData } = await supabase
    .from('spf_sellers')
    .select('id, status')
    .eq('user_id', userId)
    .single();

  if (!sellerData || sellerData.status !== 'approved') {
    return NextResponse.json(
      { error: 'Unauthorized. Only admins and approved sellers can create products.' },
      { status: 403 }
    );
  }

  userSellerId = sellerData.id;
}
```

---

## Troubleshooting

### Issue: "You are not registered as a seller. Please contact admin."

**Cause:** API `/api/sellers/me` returning 404

**Solutions:**
1. Check if seller record exists in database:
   ```sql
   SELECT * FROM spf_sellers WHERE user_id = 'user-uuid';
   ```

2. Check if API is using `supabaseAdmin` (not `supabase`):
   ```typescript
   import { supabaseAdmin } from '@/lib/supabase-admin'; // ✅ Correct
   ```

3. Check if column names match:
   ```typescript
   // Use 'mobile' not 'phone_number'
   user:spf_users!spf_sellers_user_id_fkey (
     id, name, email, mobile
   )
   ```

### Issue: Seller Dashboard not showing in navbar

**Cause:** `isApprovedSeller` is false

**Check:**
1. User is logged in: `user !== null`
2. User is seller: `user.isSeller === true`
3. Seller is approved: `user.sellerStatus === 'approved'`

**Debug:**
```javascript
console.log('User:', user);
console.log('Is Seller:', user?.isSeller);
console.log('Seller Status:', user?.sellerStatus);
console.log('Is Approved Seller:', isApprovedSeller);
```

### Issue: Status not updating after admin approval

**Solution:** Seller needs to refresh `/seller/register` page
- Status refresh logic runs on component mount
- If status changed to `approved`, page auto-reloads
- Navbar will show "Seller Dashboard" after reload

### Issue: Shop information not saving

**Check:**
1. Fields are filled: `shopName, shopMobile, shopLocation`
2. Mobile is 10 digits
3. API is updating seller profile:
   ```typescript
   await supabase
     .from('spf_sellers')
     .update({
       business_name: shopName,
       business_phone: shopMobile,
       address_line1: shopLocation
     })
     .eq('id', sellerId);
   ```

### Issue: Images not uploading

**Check:**
1. Cloudinary credentials configured
2. `MultiImageUpload` component imported correctly
3. Image IDs being passed to API:
   ```typescript
   images: formData.images, // Array of Cloudinary IDs
   mainImage: formData.images[0] // First image
   ```

---

## Important Notes

### RLS (Row Level Security)
- API routes use `supabaseAdmin` to bypass RLS
- Client-side code uses `supabase` (subject to RLS)
- Never use `supabaseAdmin` in client components

### Mobile Number Changes
- Mobile is now optional in all signup/registration forms
- No OTP verification for mobile numbers
- Only email verification is required
- Column name: `mobile` (not `phone_number`)

### Seller Status Flow
```
pending → approved → can add products
pending → rejected → cannot access dashboard
approved → suspended → cannot add new products
```

### Product Creation Authorization
```
Admin: Can create products (assigned to any seller or no seller)
Approved Seller: Can only create products for themselves
Pending/Rejected Seller: Cannot create products
```

---

## Complete User Flow Diagram

```
User Signup (/signup)
    ↓
Email Verification (OTP)
    ↓
Account Created (spf_users)
    ↓
Seller Registration (/seller/register)
    ↓
Business Email Verification (OTP)
    ↓
Seller Record Created (status: pending)
    ↓
Admin Reviews (/admin/sellers)
    ↓
Admin Approves (status: approved)
    ↓
Seller Refreshes Page
    ↓
Status Auto-Fetched from Database
    ↓
Page Reloads (if status changed)
    ↓
Navbar Shows "Seller Dashboard"
    ↓
Seller Accesses Dashboard (/seller/dashboard)
    ↓
Clicks "Add New Product"
    ↓
Fills Shop Info + Product Details
    ↓
Uploads Images (Cloudinary)
    ↓
Submits Form
    ↓
Seller Profile Updated (shop info)
    ↓
Product Created (seller_id linked)
    ↓
Redirect to Dashboard
    ↓
Product Visible in Seller's Product List
```

---

## API Response Examples

### Successful Seller Registration
```json
{
  "success": true,
  "message": "Seller registration submitted successfully",
  "seller": {
    "id": "seller-uuid",
    "userId": "user-uuid",
    "businessName": "Shop Name",
    "status": "pending",
    "createdAt": "2024-02-15T10:00:00Z"
  }
}
```

### Successful Product Creation
```json
{
  "message": "Product created successfully",
  "product": {
    "id": "product-uuid",
    "productId": "mens-jeans-6",
    "name": "Classic Blue Jeans",
    "category": "mens",
    "price": 1299,
    "sellerId": "seller-uuid",
    "createdAt": "2024-02-15T10:00:00Z"
  }
}
```

### Error: Unauthorized
```json
{
  "error": "Unauthorized. Only admins and approved sellers can create products.",
  "status": 403
}
```

---

## Maintenance Checklist

### Adding New Seller Fields
1. Update database schema (`spf_sellers`)
2. Update seller registration form (`/seller/register`)
3. Update API (`/api/sellers/register`)
4. Update seller profile page (if exists)
5. Update admin seller view (`/admin/sellers`)

### Adding New Product Fields
1. Update database schema (`spf_productdetails`)
2. Update admin add product form
3. Update seller add product form
4. Update API (`/api/products`)
5. Update product display pages

### Testing Checklist
- [ ] User can sign up
- [ ] User can register as seller
- [ ] Email verification works
- [ ] Admin can see pending sellers
- [ ] Admin can approve sellers
- [ ] Seller status refreshes on page visit
- [ ] Approved seller sees dashboard link in navbar
- [ ] Seller can access dashboard
- [ ] Seller can add product with shop info
- [ ] Images upload via Cloudinary
- [ ] Shop info saves to seller profile
- [ ] Product appears in seller's product list
- [ ] Product appears on main site

---

**Generated:** February 2024
**Version:** 1.0
**Project:** Sweta Fashion Points
**Framework:** Next.js 16 (App Router) + Supabase + Vercel
