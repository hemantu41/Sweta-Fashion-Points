-- Manual Fix for Order SFP-20260218-764992
-- This order has items without productId/sellerId, so we fix it manually

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
  pd.seller_id,
  '63116b01-d7b8-4901-86fd-09c5f9272031'::UUID as order_id,
  pd.id as product_id,
  'kids' as item_name,
  1 as quantity,
  1.00 as unit_price,
  1.00 as total_item_price,
  COALESCE(s.commission_percentage, 10.0) as commission_percentage,
  1.00 * (COALESCE(s.commission_percentage, 10.0) / 100) as commission_amount,
  1.00 - (1.00 * (COALESCE(s.commission_percentage, 10.0) / 100)) as seller_earning,
  'pending' as payment_status,
  '2026-02-18 01:42:45.593'::TIMESTAMP WITH TIME ZONE as order_date,
  'SFP-20260218-764992' as order_number
FROM spf_productdetails pd
JOIN spf_sellers s ON s.id = pd.seller_id
WHERE pd.product_id = 'kids_4-7_395743';

-- Verify it was created
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
