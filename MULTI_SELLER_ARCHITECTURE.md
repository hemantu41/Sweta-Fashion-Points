# Multi-Seller Architecture - Sweta Fashion Points

## Overview

The Sweta Fashion Points platform now supports a **database-driven multi-seller marketplace** where multiple sellers can add and manage their products. The system uses PostgreSQL (Supabase) as the single source of truth, with Cloudinary providing efficient image storage and delivery.

**Last Updated:** February 15, 2024
**Version:** 2.0

---

## Architecture Decision

### Database-Driven vs Folder-Based

We chose a **database-driven approach** over Cloudinary folder organization for the following reasons:

| Aspect | Database-Driven ✅ | Folder-Based ❌ |
|--------|-------------------|----------------|
| **Source of Truth** | PostgreSQL database | Cloudinary folders |
| **Scalability** | Works with unlimited sellers | Folder naming conflicts possible |
| **Flexibility** | Easy filtering by seller, category, status | Complex queries across folders |
| **Product Management** | Can approve, suspend, filter products | Limited control |
| **Seller Management** | Suspend seller = hide all products | Manual folder management |
| **Business Logic** | Controlled by database | Scattered across systems |
| **Performance** | Fast indexed queries | Multiple folder traversals |

---

## Implementation Details

### 1. Database Schema

**Products Table:** `spf_productdetails`
- `seller_id` column links products to sellers
- `NULL seller_id` = admin-added product
- `NOT NULL seller_id` = seller-added product

**Foreign Key Relationship:**
```sql
spf_productdetails.seller_id → spf_sellers.id
```

### 2. API Endpoints

#### GET /api/products
Fetches all products with seller information.

**Query:**
```typescript
supabase.from('spf_productdetails').select(`
  *,
  seller:spf_sellers!spf_productdetails_seller_id_fkey (
    id,
    business_name,
    business_name_hi,
    city,
    state,
    business_phone
  )
`)
```

**Response:**
```json
{
  "products": [
    {
      "id": "...",
      "name": "Product Name",
      "price": 1299,
      "sellerId": "seller-123",
      "seller": {
        "id": "seller-123",
        "businessName": "Fashion Store",
        "city": "Noida",
        "state": "Uttar Pradesh"
      }
    }
  ]
}
```

#### GET /api/products/[id]
Fetches single product with seller information (same structure as above).

#### POST /api/products
Creates new product (admin or approved seller).

**Authorization:**
- Admins can create products for any seller
- Approved sellers can only create products for themselves

---

### 3. Frontend Components

#### ProductCard Component
**File:** `src/components/ProductCard.tsx`

Displays seller information below price:
```tsx
{product.seller && (
  <div className="mt-2 pt-2 border-t border-[#F0EDE8]">
    <p className="text-xs text-[#6B6B6B] flex items-center gap-1">
      <svg>...</svg>
      <span>{product.seller.businessName}</span>
      {product.seller.city && <span>• {product.seller.city}</span>}
    </p>
  </div>
)}
```

**Display:**
- Shows seller name (with Hindi fallback)
- Shows city location
- Icon for visual clarity
- Only displays for seller products (not admin products)

#### Product Detail Page
**File:** `src/app/product/[id]/page.tsx`

Shows dedicated seller information card:
```tsx
{product.seller && (
  <div className="bg-white rounded-xl border border-[#E8E2D9] p-5">
    <h3>Sold By</h3>
    <p>{product.seller.businessName}</p>
    <p>{product.seller.city}, {product.seller.state}</p>
    <p>✓ Sold by a verified seller</p>
  </div>
)}
```

---

### 4. Cloudinary Organization

#### Image Upload with Tags
**File:** `src/app/api/upload/image/route.ts`

Cloudinary images are tagged for organization (not security):

```typescript
const tags = ['product'];
if (sellerId) tags.push(`seller:${sellerId}`);
if (category) tags.push(`category:${category}`);
if (productId) tags.push(`product:${productId}`);
```

#### Folder Structure
Images organized by category for better management:
```
sweta-fashion-points/
├── mens/
│   ├── product-image-1.jpg (tags: product, seller:123, category:mens)
│   └── product-image-2.jpg
├── womens/
├── sarees/
└── kids/
```

**Benefits:**
- Easy to filter images by seller via tags
- Category-based folders for visual organization
- Tags enable Cloudinary asset queries if needed
- No seller-specific folders (avoids naming conflicts)

---

## Customer Experience

### Product Listing Pages
**Files:** `src/app/mens/page.tsx`, `src/app/womens/page.tsx`, etc.

**Customer sees:**
1. Product card with image, name, price
2. Seller name and city below price
3. All products from all sellers in unified grid
4. Can filter by category, subcategory, price range

**SQL Query:**
```typescript
// Fetch all active products (admin + sellers)
SELECT * FROM spf_productdetails
WHERE is_active = true
AND category = 'mens'
ORDER BY created_at DESC
```

### Product Detail Page
**Customer sees:**
1. Full product information
2. "Sold By" card showing:
   - Seller business name
   - Location (city, state)
   - "Verified seller" badge
3. Same checkout experience regardless of seller

---

## Seller Experience

### Adding Products
**File:** `src/app/seller/dashboard/products/new/page.tsx`

**Workflow:**
1. Seller must be approved (`status = 'approved'`)
2. Shop information auto-filled from profile
3. Upload images with seller tags
4. Submit product for listing

**API Call:**
```typescript
POST /api/products
{
  userId: "user-id",
  sellerId: "seller-id",
  product: {
    productId: "unique-id",
    name: "Product Name",
    category: "mens",
    price: 1299,
    images: ["cloudinary-id-1", "cloudinary-id-2"]
  }
}
```

### Seller Dashboard
**File:** `src/app/seller/dashboard/page.tsx`

**Features:**
- View all own products
- Filter: `WHERE seller_id = {currentSellerId}`
- Add new products
- Edit/delete own products (future)

---

## Admin Experience

### Admin Dashboard
**File:** `src/app/(admin)/admin/orders/page.tsx`

**Capabilities:**
- View all products (admin + sellers)
- Filter by seller: `?sellerId={id}`
- Filter admin products: `WHERE seller_id IS NULL`
- Filter seller products: `WHERE seller_id IS NOT NULL`
- Approve/suspend sellers (affects all their products)

---

## Security & Authorization

### Product Creation
**File:** `src/app/api/products/route.ts`

```typescript
// Check if user is admin or approved seller
const userIsAdmin = await isAdmin(userId);

if (!userIsAdmin) {
  const { data: sellerData } = await supabase
    .from('spf_sellers')
    .select('id, status')
    .eq('user_id', userId)
    .single();

  if (!sellerData || sellerData.status !== 'approved') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
```

### Product Editing
**File:** `src/app/api/products/[id]/route.ts`

```typescript
// Sellers can only edit their own products
// Admins can edit any product
async function canEditProduct(userId, productId) {
  if (await isAdmin(userId)) return true;

  const { data: product } = await supabase
    .from('spf_productdetails')
    .select('seller_id')
    .eq('product_id', productId)
    .single();

  const { data: seller } = await supabase
    .from('spf_sellers')
    .select('user_id, status')
    .eq('id', product.seller_id)
    .single();

  return seller?.user_id === userId && seller?.status === 'approved';
}
```

---

## Querying Products

### All Active Products (Customer View)
```typescript
const { data } = await supabase
  .from('spf_productdetails')
  .select(`
    *,
    seller:spf_sellers(business_name, city, state)
  `)
  .eq('is_active', true);
```

### Admin Products Only
```typescript
const { data } = await supabase
  .from('spf_productdetails')
  .select('*')
  .is('seller_id', null);
```

### Seller Products Only
```typescript
const { data } = await supabase
  .from('spf_productdetails')
  .select('*')
  .not('seller_id', 'is', null);
```

### Specific Seller's Products
```typescript
const { data } = await supabase
  .from('spf_productdetails')
  .select('*')
  .eq('seller_id', sellerId);
```

### Products by Category with Seller Info
```typescript
const { data } = await supabase
  .from('spf_productdetails')
  .select(`
    *,
    seller:spf_sellers(business_name, city)
  `)
  .eq('category', 'mens')
  .eq('is_active', true);
```

---

## Future Enhancements

### Phase 1 (Current) ✅
- [x] Database-driven architecture
- [x] Seller product creation
- [x] Display seller info on product cards
- [x] Display seller info on product detail page
- [x] Cloudinary tagging for organization

### Phase 2 (Planned)
- [ ] Seller product approval workflow
- [ ] Seller earnings and commission tracking
- [ ] Seller ratings and reviews
- [ ] Seller dashboard analytics
- [ ] Bulk product upload for sellers
- [ ] Product inventory management

### Phase 3 (Future)
- [ ] Seller messaging system
- [ ] Return/refund management per seller
- [ ] Seller performance metrics
- [ ] Multi-warehouse support
- [ ] Seller subscription tiers

---

## Troubleshooting

### Issue: Products not showing seller information

**Check:**
1. Verify `seller_id` column exists in database
2. Ensure foreign key relationship is correct
3. Check API is joining with sellers table
4. Verify seller profile exists for seller_id

### Issue: Unauthorized error when creating product

**Check:**
1. User is logged in
2. Seller is approved (`status = 'approved'`)
3. `sellerId` matches user's seller account
4. User has `isSeller: true` in AuthContext

### Issue: Images not tagged in Cloudinary

**Check:**
1. `sellerId`, `category`, `productId` props passed to MultiImageUpload
2. Upload API receiving metadata in formData
3. Cloudinary config has tagging enabled
4. Check tags in Cloudinary dashboard

---

## Migration from Existing System

If you have existing products without `seller_id`:

```sql
-- These are admin products (seller_id = NULL)
SELECT * FROM spf_productdetails WHERE seller_id IS NULL;

-- Assign existing products to a seller
UPDATE spf_productdetails
SET seller_id = 'seller-id-here'
WHERE product_id IN ('product-1', 'product-2');
```

---

## Key Files Reference

### Backend
- `src/app/api/products/route.ts` - List/create products
- `src/app/api/products/[id]/route.ts` - Single product CRUD
- `src/app/api/upload/image/route.ts` - Cloudinary upload with tags
- `src/app/api/sellers/me/route.ts` - Get seller profile

### Frontend
- `src/components/ProductCard.tsx` - Product card with seller info
- `src/app/product/[id]/page.tsx` - Product detail page
- `src/components/MultiImageUpload.tsx` - Image upload component
- `src/app/seller/dashboard/products/new/page.tsx` - Add product page

### Documentation
- `SELLER_FLOW_GUIDE.md` - Seller registration and approval flow
- `MULTI_SELLER_ARCHITECTURE.md` - This document

---

## Technical Specifications

**Database:** Supabase (PostgreSQL)
**Image Storage:** Cloudinary
**Frontend:** Next.js 16 (App Router) + TypeScript
**Deployment:** Vercel
**Authentication:** Local storage + JWT (via Supabase)

---

## Support

For questions or issues:
1. Check troubleshooting section above
2. Review `SELLER_FLOW_GUIDE.md` for seller-specific issues
3. Check Supabase logs for database errors
4. Check Vercel deployment logs for API errors
5. Check browser console for frontend errors

---

**Maintained by:** Sweta Fashion Points Development Team
**Last Review:** February 15, 2024
