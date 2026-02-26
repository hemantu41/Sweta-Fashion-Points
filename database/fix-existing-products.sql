-- Fix Existing Products Script
-- Run this AFTER the migrations to ensure existing products are set correctly

-- 1. Set all existing products without approval_status to 'approved'
UPDATE spf_productdetails
SET
  approval_status = 'approved',
  is_active = true,
  approved_at = created_at
WHERE approval_status IS NULL;

-- 2. Set all existing products with approval_status = 'pending' to 'approved'
--    (This handles products created before admin review was implemented)
UPDATE spf_productdetails
SET
  approval_status = 'approved',
  is_active = true,
  approved_at = created_at
WHERE approval_status = 'pending' AND seller_id IS NULL;

-- 3. Verify the update
SELECT
  approval_status,
  is_active,
  COUNT(*) as count
FROM spf_productdetails
GROUP BY approval_status, is_active;
