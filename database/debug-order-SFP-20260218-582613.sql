-- Debug Order SFP-20260218-582613
-- Product: mens_shirts_232179

-- Step 1: Check the order and its items structure
SELECT
  order_number,
  status,
  payment_completed_at,
  jsonb_pretty(items) as items
FROM spf_payment_orders
WHERE order_number = 'SFP-20260218-582613';

-- Step 2: Check if items have productId and sellerId
SELECT
  po.order_number,
  po.status,
  po.payment_completed_at,
  item->>'name' as item_name,
  item->>'id' as id,
  item->>'productId' as product_id,
  item->>'sellerId' as seller_id,
  item->>'price' as price,
  item->>'quantity' as quantity
FROM spf_payment_orders po
CROSS JOIN LATERAL jsonb_array_elements(po.items) as item
WHERE po.order_number = 'SFP-20260218-582613';

-- Step 3: Check if the product exists and has a seller
SELECT
  product_id,
  name,
  seller_id,
  approval_status,
  is_active,
  created_at
FROM spf_productdetails
WHERE product_id = 'mens_shirts_232179';

-- Step 4: Check if any earnings were created for this order
SELECT
  se.id,
  se.order_number,
  se.item_name,
  se.seller_earning,
  se.commission_amount,
  se.payment_status,
  s.business_name
FROM spf_seller_earnings se
LEFT JOIN spf_sellers s ON s.id = se.seller_id
WHERE se.order_number = 'SFP-20260218-582613';

-- Step 5: Get all info we need to manually fix if needed
SELECT
  po.id as order_id,
  po.order_number,
  po.status,
  po.payment_completed_at,
  pd.id as product_db_id,
  pd.product_id,
  pd.seller_id,
  s.commission_percentage,
  (po.items->0->>'price')::DECIMAL as price,
  (po.items->0->>'quantity')::INTEGER as quantity
FROM spf_payment_orders po
LEFT JOIN spf_productdetails pd ON pd.product_id = 'mens_shirts_232179'
LEFT JOIN spf_sellers s ON s.id = pd.seller_id
WHERE po.order_number = 'SFP-20260218-582613';
