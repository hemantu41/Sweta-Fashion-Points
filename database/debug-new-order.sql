-- Debug Script for New Order Earnings Issue
-- Replace 'YOUR_ORDER_NUMBER' with the actual order number

-- STEP 1: Find the most recent order
SELECT
  order_number,
  id,
  status,
  created_at,
  payment_completed_at
FROM spf_payment_orders
ORDER BY created_at DESC
LIMIT 5;

-- STEP 2: Check the order items structure (replace with your order number)
SELECT
  order_number,
  jsonb_pretty(items) as items_structure
FROM spf_payment_orders
WHERE order_number = 'YOUR_ORDER_NUMBER';

-- STEP 3: Extract item fields to see if productId and sellerId are present
SELECT
  po.order_number,
  item->>'name' as item_name,
  item->>'id' as id,
  item->>'productId' as product_id,
  item->>'sellerId' as seller_id,
  item->>'price' as price,
  item->>'quantity' as quantity
FROM spf_payment_orders po
CROSS JOIN LATERAL jsonb_array_elements(po.items) as item
WHERE po.order_number = 'YOUR_ORDER_NUMBER';

-- STEP 4: Check if product exists and has sellerId
-- (Replace 'kids_4-7_395743' with the actual product_id from STEP 3)
SELECT
  product_id,
  name,
  seller_id,
  approval_status,
  is_active
FROM spf_productdetails
WHERE product_id = 'YOUR_PRODUCT_ID';

-- STEP 5: Check if any earnings were created for this order
SELECT
  se.order_number,
  se.item_name,
  se.seller_earning,
  se.commission_amount,
  se.payment_status,
  s.business_name
FROM spf_seller_earnings se
LEFT JOIN spf_sellers s ON s.id = se.seller_id
WHERE se.order_number = 'YOUR_ORDER_NUMBER';

-- STEP 6: Check webhook logs (if you have them)
-- If no earnings were created, check if the webhook was called by looking at payment order status
SELECT
  order_number,
  status,
  payment_completed_at,
  updated_at
FROM spf_payment_orders
WHERE order_number = 'YOUR_ORDER_NUMBER';
