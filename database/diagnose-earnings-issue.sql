-- Diagnostic Query: Check why earnings are not being created
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if spf_seller_earnings table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'spf_seller_earnings'
) AS earnings_table_exists;

-- 2. Check the specific order and its items
SELECT
  id,
  order_number,
  status,
  amount,
  items,
  payment_completed_at,
  created_at
FROM spf_payment_orders
WHERE order_number = 'SFP-20260218-764992';

-- 3. Check if there are any earnings records for this order
SELECT * FROM spf_seller_earnings
WHERE order_number = 'SFP-20260218-764992';

-- 4. Check the product and its seller
SELECT
  product_id,
  name,
  seller_id,
  approval_status,
  is_active
FROM spf_productdetails
WHERE product_id = 'kids_4-7_395743';

-- 5. Check the seller and commission percentage
SELECT
  s.id,
  s.business_name,
  s.commission_percentage,
  s.status
FROM spf_sellers s
WHERE EXISTS (
  SELECT 1 FROM spf_productdetails p
  WHERE p.product_id = 'kids_4-7_395743'
  AND p.seller_id = s.id
);

-- 6. Count total earnings records (to see if any exist at all)
SELECT COUNT(*) as total_earnings_records FROM spf_seller_earnings;
