-- Check Webhook Status for Order SFP-20260218-582613

-- 1. Check order status and payment details
SELECT
  order_number,
  status,
  payment_completed_at,
  razorpay_payment_id,
  payment_method,
  created_at
FROM spf_payment_orders
WHERE order_number = 'SFP-20260218-582613';

-- 2. Check if ANY earnings exist for this order
SELECT COUNT(*) as earnings_count
FROM spf_seller_earnings
WHERE order_number = 'SFP-20260218-582613';

-- 3. Get full earnings details if they exist
SELECT *
FROM spf_seller_earnings
WHERE order_number = 'SFP-20260218-582613';

-- 4. If no earnings, create them manually NOW
-- First, get all the data we need
SELECT
  po.id as order_id,
  po.order_number,
  po.payment_completed_at,
  (po.items->0->>'name') as item_name,
  (po.items->0->>'productId') as product_id_from_order,
  (po.items->0->>'sellerId')::UUID as seller_id_from_order,
  (po.items->0->>'price')::DECIMAL as price,
  (po.items->0->>'quantity')::INTEGER as quantity,
  pd.id as product_db_id,
  s.commission_percentage,
  (po.items->0->>'price')::DECIMAL * (po.items->0->>'quantity')::INTEGER as total_price
FROM spf_payment_orders po
LEFT JOIN spf_productdetails pd ON pd.product_id = (po.items->0->>'productId')
LEFT JOIN spf_sellers s ON s.id = (po.items->0->>'sellerId')::UUID
WHERE po.order_number = 'SFP-20260218-582613';
