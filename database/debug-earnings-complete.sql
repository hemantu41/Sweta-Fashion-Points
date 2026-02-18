-- Complete Diagnostic for Earnings Issue
-- Run each section separately in Supabase SQL Editor

-- ========================================
-- SECTION 1: Check if table exists
-- ========================================
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'spf_seller_earnings'
) AS table_exists;

-- If FALSE, you need to run CRITICAL_RUN_FIRST.sql first!

-- ========================================
-- SECTION 2: Check the order exists and its structure
-- ========================================
SELECT
  id,
  order_number,
  status,
  amount,
  payment_completed_at,
  jsonb_pretty(items) as items_formatted
FROM spf_payment_orders
WHERE order_number = 'SFP-20260218-764992';

-- ========================================
-- SECTION 3: Extract and examine each item
-- ========================================
SELECT
  item->>'name' as item_name,
  item->>'productId' as product_id,
  item->>'sellerId' as seller_id,
  item->>'price' as price,
  item->>'quantity' as quantity,
  item
FROM spf_payment_orders po
CROSS JOIN LATERAL jsonb_array_elements(po.items) as item
WHERE po.order_number = 'SFP-20260218-764992';

-- ========================================
-- SECTION 4: Check if the product exists and has a seller
-- ========================================
SELECT
  product_id,
  name,
  seller_id,
  approval_status,
  is_active
FROM spf_productdetails
WHERE product_id = 'kids_4-7_395743';

-- ========================================
-- SECTION 5: Check if the seller exists
-- ========================================
SELECT
  s.id,
  s.business_name,
  s.commission_percentage,
  s.status,
  s.user_id
FROM spf_sellers s
WHERE EXISTS (
  SELECT 1 FROM spf_productdetails p
  WHERE p.product_id = 'kids_4-7_395743'
  AND p.seller_id = s.id
);

-- ========================================
-- SECTION 6: Check if ANY earnings exist
-- ========================================
SELECT COUNT(*) as total_earnings_count FROM spf_seller_earnings;

-- ========================================
-- SECTION 7: Check for THIS order's earnings
-- ========================================
SELECT * FROM spf_seller_earnings
WHERE order_number = 'SFP-20260218-764992';

-- ========================================
-- SECTION 8: Try to manually create ONE earning (for testing)
-- ========================================
-- This will show you the exact error if it fails
DO $$
DECLARE
  v_seller_id UUID;
  v_order_id UUID;
  v_product_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO v_order_id FROM spf_payment_orders WHERE order_number = 'SFP-20260218-764992';
  SELECT id INTO v_product_id FROM spf_productdetails WHERE product_id = 'kids_4-7_395743';
  SELECT seller_id INTO v_seller_id FROM spf_productdetails WHERE product_id = 'kids_4-7_395743';

  RAISE NOTICE 'Order ID: %', v_order_id;
  RAISE NOTICE 'Product ID: %', v_product_id;
  RAISE NOTICE 'Seller ID: %', v_seller_id;

  IF v_order_id IS NULL THEN
    RAISE NOTICE 'ERROR: Order not found!';
    RETURN;
  END IF;

  IF v_product_id IS NULL THEN
    RAISE NOTICE 'ERROR: Product not found!';
    RETURN;
  END IF;

  IF v_seller_id IS NULL THEN
    RAISE NOTICE 'ERROR: Product has no seller!';
    RETURN;
  END IF;

  -- Try to insert a test earning
  INSERT INTO spf_seller_earnings (
    seller_id,
    order_id,
    product_id,
    item_name,
    quantity,
    unit_price,
    total_item_price,
    commission_percentage,
    commission_amount,
    seller_earning,
    payment_status,
    order_date,
    order_number
  ) VALUES (
    v_seller_id,
    v_order_id,
    v_product_id,
    'Test Product',
    1,
    100.00,
    100.00,
    10.0,
    10.00,
    90.00,
    'pending',
    NOW(),
    'SFP-20260218-764992'
  );

  RAISE NOTICE 'SUCCESS: Test earning record created!';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: %', SQLERRM;
END $$;

-- Verify test record was created
SELECT * FROM spf_seller_earnings WHERE order_number = 'SFP-20260218-764992';
