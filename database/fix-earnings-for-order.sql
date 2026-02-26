-- Fix Earnings for Specific Order
-- This will manually create earnings records if they're missing

-- STEP 1: First, ensure the spf_seller_earnings table exists
-- If you haven't run CRITICAL_RUN_FIRST.sql yet, run it first!

-- STEP 2: Check the order details
DO $$
DECLARE
  v_order RECORD;
  v_item JSONB;
  v_seller RECORD;
  v_commission_pct DECIMAL(5,2);
  v_total_price DECIMAL(10,2);
  v_commission DECIMAL(10,2);
  v_earning DECIMAL(10,2);
BEGIN
  -- Get the order
  SELECT * INTO v_order
  FROM spf_payment_orders
  WHERE order_number = 'SFP-20260218-764992'
  AND status = 'captured';

  IF NOT FOUND THEN
    RAISE NOTICE 'Order not found or not captured yet';
    RETURN;
  END IF;

  RAISE NOTICE 'Processing order: %', v_order.order_number;
  RAISE NOTICE 'Order items: %', v_order.items;

  -- Loop through each item in the order
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
  LOOP
    RAISE NOTICE 'Processing item: %', v_item->>'name';

    -- Skip if no sellerId
    IF v_item->>'sellerId' IS NULL THEN
      RAISE NOTICE 'Skipping item without sellerId: %', v_item->>'name';
      CONTINUE;
    END IF;

    -- Get seller info
    SELECT id, commission_percentage INTO v_seller
    FROM spf_sellers
    WHERE id = (v_item->>'sellerId')::UUID;

    IF NOT FOUND THEN
      RAISE NOTICE 'Seller not found for ID: %', v_item->>'sellerId';
      CONTINUE;
    END IF;

    v_commission_pct := COALESCE(v_seller.commission_percentage, 10.0);
    v_total_price := (v_item->>'price')::DECIMAL * (v_item->>'quantity')::INTEGER;
    v_commission := v_total_price * (v_commission_pct / 100);
    v_earning := v_total_price - v_commission;

    RAISE NOTICE 'Commission: % percent, Total: %, Earning: %',
      v_commission_pct, v_total_price, v_earning;

    -- Insert earning record (will skip if already exists due to UNIQUE constraint)
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
      v_seller.id,
      v_order.id,
      CASE WHEN v_item->>'productId' IS NOT NULL
        THEN (SELECT id FROM spf_productdetails WHERE product_id = v_item->>'productId')
        ELSE NULL
      END,
      v_item->>'name',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::DECIMAL,
      v_total_price,
      v_commission_pct,
      v_commission,
      v_earning,
      'pending',
      COALESCE(v_order.payment_completed_at, NOW()),
      v_order.order_number
    )
    ON CONFLICT (order_id, product_id, item_name) DO NOTHING;

    RAISE NOTICE 'Earning record created/already exists';
  END LOOP;

  RAISE NOTICE 'Done processing order';
END $$;

-- STEP 3: Verify the earnings were created
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
