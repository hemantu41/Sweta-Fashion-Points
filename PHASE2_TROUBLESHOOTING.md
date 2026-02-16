# Phase 2 Troubleshooting Guide

## Issue: Products Not Going Through Approval Workflow

If seller products are still going live without admin approval, follow these steps:

---

## Step 1: Verify Database Schema

Run this in **Supabase SQL Editor**:

```sql
-- Check if approval_status column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'spf_productdetails'
  AND column_name = 'approval_status';
```

**Expected Result:**
- `column_name`: approval_status
- `data_type`: character varying
- `column_default`: 'pending'::character varying

**If column doesn't exist:** Run the migration again from [database/migration-product-approval.sql](database/migration-product-approval.sql)

---

## Step 2: Check Existing Products

Run this in **Supabase SQL Editor**:

```sql
SELECT
  product_id,
  name,
  approval_status,
  is_active,
  seller_id,
  created_at
FROM spf_productdetails
ORDER BY created_at DESC
LIMIT 10;
```

**Check:**
- Do products have `approval_status` column?
- Are new seller products showing `approval_status = 'pending'`?
- Are they showing `is_active = false`?

---

## Step 3: Fix Existing Products

If existing products don't have proper approval_status, run:

```sql
-- Set all existing products to approved (backward compatibility)
UPDATE spf_productdetails
SET
  approval_status = 'approved',
  is_active = true,
  approved_at = COALESCE(approved_at, created_at)
WHERE approval_status IS NULL OR approval_status = '';
```

---

## Step 4: Test Product Creation

### As Seller:
1. Login as seller
2. Create a new product
3. After submission, run this query:

```sql
SELECT product_id, name, approval_status, is_active
FROM spf_productdetails
WHERE product_id = 'YOUR_PRODUCT_ID';
```

**Expected:**
- `approval_status`: 'pending'
- `is_active`: false

### As Customer:
Visit the product category page - the new product should **NOT** appear

### As Admin:
1. Go to `/admin/products/review`
2. Should see the pending product
3. Click "Approve"
4. Product should now appear on customer site

---

## Step 5: Check API Response

Test the API directly:

```bash
# Get all products (customer view)
curl http://localhost:3000/api/products?category=mens

# Get seller products (seller view)
curl http://localhost:3000/api/products?sellerId=SELLER_ID
```

**Customer view should only return products with `approval_status = 'approved'`**

---

## Step 6: Clear Next.js Cache

```bash
cd "/Users/hemantkumar/VsCode_ Projects/Sweta Fashion Points/sweta-fashion-points"
rm -rf .next
npm run build
npm run dev
```

---

## Step 7: Verify Supabase RLS Policies

Run this in **Supabase SQL Editor**:

```sql
-- Check RLS policies on spf_productdetails
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'spf_productdetails';
```

If RLS policies are blocking the approval_status column, you may need to update them.

---

## Common Issues

### Issue 1: Column exists but products still go live
**Cause:** API not setting approval_status properly
**Solution:** Verify [src/app/api/products/route.ts](src/app/api/products/route.ts) line 214 sets `approval_status: userIsAdmin ? 'approved' : 'pending'`

### Issue 2: Products not appearing in admin review page
**Cause:** Admin API not filtering correctly
**Solution:** Verify [src/app/api/admin/products/review/route.ts](src/app/api/admin/products/review/route.ts) line 147 filters by `approval_status`

### Issue 3: Approved products not appearing on site
**Cause:** Customer query filtering by approval_status
**Solution:** Verify [src/app/api/products/route.ts](src/app/api/products/route.ts) lines 64-66 only filters when `!sellerId`

---

## Quick Fix Script

If nothing works, run this comprehensive fix:

```sql
-- 1. Ensure column exists with correct default
ALTER TABLE spf_productdetails
ALTER COLUMN approval_status SET DEFAULT 'pending';

-- 2. Fix all existing products
UPDATE spf_productdetails
SET
  approval_status = COALESCE(approval_status, 'approved'),
  is_active = CASE
    WHEN approval_status = 'approved' THEN true
    ELSE false
  END
WHERE approval_status IS NULL OR approval_status = '';

-- 3. Verify
SELECT approval_status, is_active, COUNT(*)
FROM spf_productdetails
GROUP BY approval_status, is_active;
```

---

## Need More Help?

Run the verification script:
```bash
# In Supabase SQL Editor, run:
```
[database/verify-schema.sql](database/verify-schema.sql)

This will show you the exact state of your database.
