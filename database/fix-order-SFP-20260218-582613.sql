-- Manual Fix for Order SFP-20260218-582613
-- Product: mens_shirts_232179
-- Seller: 0b9054a0-be24-4821-94de-80dba07defd7

-- Create seller earnings for this order
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
  (po.items->0->>'sellerId')::UUID as seller_id,
  po.id as order_id,
  pd.id as product_id,
  (po.items->0->>'name') as item_name,
  (po.items->0->>'quantity')::INTEGER as quantity,
  (po.items->0->>'price')::DECIMAL as unit_price,
  (po.items->0->>'price')::DECIMAL * (po.items->0->>'quantity')::INTEGER as total_item_price,
  COALESCE(s.commission_percentage, 10.0) as commission_percentage,
  ((po.items->0->>'price')::DECIMAL * (po.items->0->>'quantity')::INTEGER) * (COALESCE(s.commission_percentage, 10.0) / 100) as commission_amount,
  ((po.items->0->>'price')::DECIMAL * (po.items->0->>'quantity')::INTEGER) - (((po.items->0->>'price')::DECIMAL * (po.items->0->>'quantity')::INTEGER) * (COALESCE(s.commission_percentage, 10.0) / 100)) as seller_earning,
  'pending' as payment_status,
  COALESCE(po.payment_completed_at, po.created_at) as order_date,
  po.order_number
FROM spf_payment_orders po
JOIN spf_productdetails pd ON pd.product_id = 'mens_shirts_232179'
JOIN spf_sellers s ON s.id = pd.seller_id
WHERE po.order_number = 'SFP-20260218-582613'
ON CONFLICT (order_id, product_id, item_name) DO NOTHING;

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
WHERE se.order_number = 'SFP-20260218-582613';
