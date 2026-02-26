# Debugging Seller Earnings - Step-by-Step Guide

## Issue
Seller earnings are not being captured for new orders.

## Root Cause Fixed
✅ The checkout flow has been fixed to include `productId` and `sellerId` in order items.

## Debug Steps

### Step 1: Identify Your Test Order

Run this query to find your most recent order:

```sql
SELECT
  order_number,
  id,
  status,
  payment_completed_at,
  jsonb_pretty(items) as items
FROM spf_payment_orders
ORDER BY created_at DESC
LIMIT 3;
```

**Copy the `order_number` for the order you want to debug.**

---

### Step 2: Check Order Item Structure

Replace `YOUR_ORDER_NUMBER` with the actual order number from Step 1:

```sql
-- Check what fields are in the order items
SELECT
  po.order_number,
  po.status,
  item->>'name' as item_name,
  item->>'id' as id,
  item->>'productId' as product_id,
  item->>'sellerId' as seller_id,
  item->>'price' as price,
  item->>'quantity' as quantity
FROM spf_payment_orders po
CROSS JOIN LATERAL jsonb_array_elements(po.items) as item
WHERE po.order_number = 'YOUR_ORDER_NUMBER';
```

**Expected Result:**
- `product_id` should NOT be null
- `seller_id` should NOT be null (if it's a seller product)

**If `seller_id` is NULL:**
- This means the product doesn't have a seller assigned
- Only products created by sellers will have sellerId
- Admin/default products won't generate seller earnings

---

### Step 3: Verify Product Has Seller

If `product_id` from Step 2 was not null, check if that product has a seller:

```sql
-- Replace 'YOUR_PRODUCT_ID' with the product_id from Step 2
SELECT
  product_id,
  name,
  seller_id,
  approval_status,
  is_active
FROM spf_productdetails
WHERE product_id = 'YOUR_PRODUCT_ID';
```

**Expected Result:**
- `seller_id` should NOT be null
- `approval_status` should be 'approved'
- `is_active` should be true

---

### Step 4: Check if Earnings Were Created

```sql
-- Replace with your order number
SELECT
  se.id,
  se.order_number,
  se.item_name,
  se.total_item_price,
  se.commission_percentage,
  se.commission_amount,
  se.seller_earning,
  se.payment_status,
  s.business_name as seller_name
FROM spf_seller_earnings se
JOIN spf_sellers s ON s.id = se.seller_id
WHERE se.order_number = 'YOUR_ORDER_NUMBER';
```

**If NO rows returned:**
- Check webhook logs (next step)

**If rows ARE returned:**
- Earnings were created successfully! ✅
- Check seller dashboard to verify they're displayed

---

### Step 5: Check Webhook Execution

The webhook logs to console. Check your Vercel logs or local terminal for:

```
[Webhook] Calculating seller earnings for X items
[Webhook] Skipping item without sellerId: ITEM_NAME  ← This means no sellerId!
[Webhook] Earning record created for seller: SELLER_ID  ← This means success!
```

---

## Common Issues & Solutions

### Issue 1: seller_id is NULL in order items

**Cause:** The product doesn't have a seller assigned.

**Solution:** Make sure you're testing with a seller-created product:
1. Login as seller at `/seller/login`
2. Create product at `/seller/dashboard/products/new`
3. Admin must approve it (or manually set `approval_status = 'approved'` in database)
4. Order THAT product to test earnings

**Quick check:**
```sql
-- See which products have sellers
SELECT product_id, name, seller_id
FROM spf_productdetails
WHERE seller_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

---

### Issue 2: Order status is not 'captured'

**Cause:** Payment webhook hasn't been triggered or failed.

**Solution:**
- Check Razorpay webhook is configured correctly
- Verify `RAZORPAY_WEBHOOK_SECRET` is set in environment variables
- Test payment in test mode with Razorpay test credentials

---

### Issue 3: Product exists but still no earnings

**Cause:** Webhook might have failed silently or `item.sellerId` is not being read correctly.

**Solution:** Manually trigger earnings calculation:

```sql
-- Run the fix script for your specific order
-- Copy database/fix-order-SFP-20260218-764992.sql
-- Replace the order ID, product ID, and order number with yours
```

---

## Testing with Fresh Order (Recommended)

1. **Create seller product:**
   ```sql
   -- Verify you have seller products
   SELECT product_id, name, seller_id, approval_status
   FROM spf_productdetails
   WHERE seller_id IS NOT NULL AND approval_status = 'approved'
   LIMIT 5;
   ```

2. **Order the seller product:**
   - Add to cart
   - Complete checkout
   - Pay with Razorpay test card: `4111 1111 1111 1111`, CVV: `123`, Expiry: any future date

3. **Check immediately after payment:**
   ```sql
   -- Check if earnings were created
   SELECT *
   FROM spf_seller_earnings
   ORDER BY created_at DESC
   LIMIT 1;
   ```

---

## Need Help?

Share the output of Steps 1-4 and I can help diagnose the specific issue!
