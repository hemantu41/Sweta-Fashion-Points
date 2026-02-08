# Seller Management System - Implementation Guide

## Overview

This multi-vendor seller management system allows multiple sellers to register, get approved by admin, and manage their own products on the Sweta Fashion Points platform.

## Key Features

✅ **Seller Registration** - Public registration form for new sellers
✅ **Admin Approval Workflow** - Pending → Approved/Rejected/Suspended states
✅ **Seller Dashboard** - Sellers can view and manage only their products
✅ **Product Ownership** - Each product linked to its seller
✅ **Commission Tracking** - Platform commission per seller
✅ **Bank Details Management** - For payment processing
✅ **Role-Based Access Control** - Admin, Seller, Customer roles

---

## Database Setup

### Step 1: Run the SQL Schema

Execute the SQL file to create necessary tables and columns:

```bash
# Option 1: Using Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of database/schema-sellers.sql
3. Execute the SQL

# Option 2: Using psql command line
psql -h <your-supabase-host> -U postgres -d postgres -f database/schema-sellers.sql
```

### Tables Created:

1. **`spf_sellers`** - Stores seller business information
   - Business details (name, GSTIN, PAN)
   - Contact information
   - Address
   - Bank details
   - Status (pending/approved/rejected/suspended)
   - Commission percentage

2. **`spf_users` (modified)** - Adds user_type column
   - `user_type`: 'customer' | 'seller' | 'admin'

3. **`spf_productdetails` (modified)** - Adds seller_id column
   - `seller_id`: Links product to seller

---

## User Flow

### For New Sellers:

1. **Register as Seller**
   - Visit `/seller/register`
   - Fill business details, contact info, bank details
   - Submit registration
   - Status: `pending` (awaiting admin approval)

2. **Wait for Approval**
   - Admin reviews application
   - Admin can approve/reject
   - Seller receives status update

3. **Start Selling** (After Approval)
   - Access seller dashboard at `/seller/dashboard`
   - Add products via `/seller/products/new`
   - Manage existing products

### For Admin:

1. **Review Seller Applications**
   - Visit `/admin/sellers`
   - See all pending applications
   - View seller details

2. **Approve/Reject Sellers**
   - Click on seller to view full details
   - Approve: Seller can start adding products
   - Reject: Provide reason
   - Suspend: Temporarily disable seller

3. **Manage Sellers**
   - Set commission percentage
   - Add internal notes
   - Monitor product count per seller

---

## API Endpoints

### Seller Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/sellers/register` | Register as new seller | User (logged in) |
| GET | `/api/sellers` | List all sellers | Admin only |
| GET | `/api/sellers/me` | Get current user's seller profile | Seller |
| GET | `/api/sellers/[id]` | Get seller details | Admin or Seller (own) |
| PUT | `/api/sellers/[id]` | Update seller, approve/reject | Admin or Seller (own) |
| DELETE | `/api/sellers/[id]` | Soft delete seller | Admin only |

### Products (Updated)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products?sellerId=xxx` | Get products by seller | Public |
| POST | `/api/products` | Create product | Admin or Approved Seller |
| PUT | `/api/products/[id]` | Update product | Admin or Product Owner |
| DELETE | `/api/products/[id]` | Delete product | Admin or Product Owner |

---

## Routes/Pages

### Public Routes:

- `/seller/register` - Seller registration form

### Seller Routes:

- `/seller/dashboard` - Seller dashboard (shows their products)
- `/seller/products/new` - Add new product (reuses admin form)
- `/seller/products/edit/[id]` - Edit product (reuses admin form)

### Admin Routes:

- `/admin/sellers` - Seller management list
- `/admin/sellers/[id]` - Seller detail view
- `/admin/products` - All products (can filter by seller)

---

## Implementation Steps

### ✅ Step 1: Database Setup

Run the SQL schema:
```bash
database/schema-sellers.sql
```

### ✅ Step 2: API Routes

All API routes created:
- `src/app/api/sellers/register/route.ts`
- `src/app/api/sellers/route.ts`
- `src/app/api/sellers/[id]/route.ts`
- `src/app/api/sellers/me/route.ts`
- Updated: `src/app/api/products/route.ts`
- Updated: `src/app/api/products/[id]/route.ts`

### ✅ Step 3: Admin UI

Admin pages created:
- `src/app/(admin)/admin/sellers/page.tsx` - List all sellers
- `src/app/(admin)/admin/sellers/[id]/page.tsx` - Seller details

### ✅ Step 4: Seller UI

Seller pages created:
- `src/app/seller/register/page.tsx` - Registration form
- `src/app/seller/dashboard/page.tsx` - Seller dashboard

### Step 5: Update AuthContext (TODO)

Add seller status to AuthContext:
```typescript
interface User {
  // ... existing fields
  userType?: 'customer' | 'seller' | 'admin';
  sellerId?: string;
  sellerStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
}
```

### Step 6: Add Navigation Links (TODO)

Update `src/components/Navbar.tsx`:
- Show "Seller Dashboard" link for approved sellers
- Show "Become a Seller" link for customers
- Show "Admin" → "Manage Sellers" for admins

### Step 7: Test the Flow

1. Create test user account
2. Register as seller
3. Login as admin
4. Approve seller
5. Login as seller
6. Add product
7. Verify product shows on website

---

## Security & Authorization

### Role-Based Access:

1. **Admin**
   - Can approve/reject sellers
   - Can edit any product
   - Can view all sellers
   - Can set commission rates

2. **Seller (Approved)**
   - Can add new products
   - Can edit own products only
   - Can delete own products only
   - Cannot edit commission rate

3. **Customer**
   - Can register as seller
   - Cannot access admin or seller dashboards

### Product Ownership:

- When seller creates product, `seller_id` is automatically set
- Sellers can only edit/delete products where `seller_id` matches their seller account
- Admin can edit/delete any product

---

## Commission System

- Each seller has a `commission_percentage` (default: 10%)
- This represents platform fee on sales
- Admin can customize per seller
- Future: Implement commission calculation in order processing

---

## Future Enhancements

### Phase 1 (Current):
- ✅ Seller registration
- ✅ Admin approval workflow
- ✅ Seller dashboard
- ✅ Product ownership

### Phase 2 (TODO):
- [ ] Email notifications on approval/rejection
- [ ] Seller analytics (sales, revenue)
- [ ] Commission payout tracking
- [ ] Seller order management
- [ ] Seller product reviews

### Phase 3 (TODO):
- [ ] Bulk product upload (CSV/Excel)
- [ ] Seller inventory alerts
- [ ] Multi-location support
- [ ] Seller rating system
- [ ] Automated commission payouts

---

## Testing Checklist

### Seller Registration:
- [ ] Register with valid details
- [ ] Validation works (required fields)
- [ ] Cannot register twice with same user
- [ ] Status starts as 'pending'

### Admin Approval:
- [ ] Admin can see pending sellers
- [ ] Approve button works
- [ ] Reject with reason works
- [ ] Seller status updates correctly

### Seller Dashboard:
- [ ] Approved seller can access dashboard
- [ ] Pending seller redirected
- [ ] Shows only seller's products
- [ ] Product stats accurate

### Product Management:
- [ ] Seller can add product
- [ ] Product.seller_id set correctly
- [ ] Seller can edit own product
- [ ] Seller CANNOT edit other seller's product
- [ ] Admin can edit any product

---

## Database Relationships

```
spf_users (user_type: 'customer' | 'seller' | 'admin')
    ↓ (one-to-one)
spf_sellers (status: 'pending' | 'approved' | 'rejected' | 'suspended')
    ↓ (one-to-many)
spf_productdetails (seller_id references spf_sellers.id)
```

---

## Sample Data

### Creating First Admin:

```sql
UPDATE spf_users
SET user_type = 'admin'
WHERE email = 'your-admin-email@example.com';
```

### Sample Seller Application:

```json
{
  "businessName": "Fashion Store",
  "businessEmail": "store@example.com",
  "businessPhone": "1234567890",
  "city": "Mumbai",
  "state": "Maharashtra",
  "gstin": "27AAAAA0000A1Z5"
}
```

---

## Troubleshooting

### Issue: "Seller profile not found"
**Solution**: Check if spf_sellers table exists and user has seller record

### Issue: "Cannot access seller dashboard"
**Solution**: Check seller status is 'approved'

### Issue: "Product seller_id is null"
**Solution**: Ensure seller is approved before creating products

### Issue: "Foreign key violation"
**Solution**: Run migrations in correct order (users → sellers → products)

---

## Support

For questions or issues:
1. Check this documentation
2. Review database schema
3. Check API response errors
4. Contact admin

---

## Quick Start Commands

```bash
# 1. Run database migrations
psql -h <host> -U postgres -f database/schema-sellers.sql

# 2. Create admin user
UPDATE spf_users SET user_type = 'admin' WHERE email = 'admin@example.com';

# 3. Start development server
npm run dev

# 4. Visit seller registration
http://localhost:3000/seller/register

# 5. Visit admin panel
http://localhost:3000/admin/sellers
```

---

## License

Part of Sweta Fashion Points platform. Proprietary software.

---

**Last Updated**: February 2026
**Version**: 1.0.0
