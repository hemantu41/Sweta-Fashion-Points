-- Simple Earnings Fix for Order SFP-20260218-764992
-- Run this in Supabase SQL Editor

-- Insert earnings for all items in the order
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
)
SELECT
  s.id as seller_id,
  po.id as order_id,
  pd.id as product_id,
  item->>'name' as item_name,
  (item->>'quantity')::INTEGER as quantity,
  (item->>'price')::DECIMAL as unit_price,
  (item->>'price')::DECIMAL * (item->>'quantity')::INTEGER as total_item_price,
  COALESCE(s.commission_percentage, 10.0) as commission_percentage,
  ((item->>'price')::DECIMAL * (item->>'quantity')::INTEGER) * (COALESCE(s.commission_percentage, 10.0) / 100) as commission_amount,
  ((item->>'price')::DECIMAL * (item->>'quantity')::INTEGER) - (((item->>'price')::DECIMAL * (item->>'quantity')::INTEGER) * (COALESCE(s.commission_percentage, 10.0) / 100)) as seller_earning,
  'pending' as payment_status,
  COALESCE(po.payment_completed_at, NOW()) as order_date,
  po.order_number
FROM spf_payment_orders po
CROSS JOIN LATERAL jsonb_array_elements(po.items) as item
JOIN spf_sellers s ON s.id = (item->>'sellerId')::UUID
LEFT JOIN spf_productdetails pd ON pd.product_id = item->>'productId'
WHERE po.order_number = 'SFP-20260218-764992'
  AND po.status = 'captured'
  AND item->>'sellerId' IS NOT NULL
ON CONFLICT (order_id, product_id, item_name) DO NOTHING;

-- Verify the results
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
WHERE se.order_number = 'SFP-20260218-764992';
