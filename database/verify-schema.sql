-- Verification Script: Check if approval workflow columns exist
-- Run this in Supabase SQL Editor to verify the migration worked

-- 1. Check if approval_status column exists in spf_productdetails
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'spf_productdetails'
  AND column_name IN ('approval_status', 'approved_by', 'approved_at', 'rejected_at', 'rejection_reason')
ORDER BY column_name;

-- 2. Check if spf_seller_earnings table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'spf_seller_earnings';

-- 3. Check current approval_status values in products
SELECT
  approval_status,
  COUNT(*) as count
FROM spf_productdetails
GROUP BY approval_status;

-- 4. List recent products with their approval status
SELECT
  product_id,
  name,
  approval_status,
  is_active,
  seller_id,
  created_at
FROM spf_productdetails
ORDER BY created_at DESC
LIMIT 10;
