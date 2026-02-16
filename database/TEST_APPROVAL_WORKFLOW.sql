-- ==========================================
-- TEST SCRIPT: Verify Approval Workflow
-- ==========================================
-- Run this AFTER running CRITICAL_RUN_FIRST.sql
-- This will help you verify the approval workflow is working

-- ==========================================
-- TEST 1: Check if approval_status column exists
-- ==========================================
SELECT 'TEST 1: approval_status column' as test_name;

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'spf_productdetails'
  AND column_name IN ('approval_status', 'approved_by', 'approved_at', 'rejected_at', 'rejection_reason')
ORDER BY column_name;

-- EXPECTED: Should show 5 rows with the approval columns
-- If you see 0 rows, the migration didn't run!

-- ==========================================
-- TEST 2: Check current product statuses
-- ==========================================
SELECT 'TEST 2: Current product statuses' as test_name;

SELECT
  approval_status,
  is_active,
  COUNT(*) as product_count
FROM spf_productdetails
GROUP BY approval_status, is_active
ORDER BY approval_status, is_active;

-- EXPECTED:
-- - All existing products should be 'approved' and 'active'
-- - New seller products will be 'pending' and 'inactive'

-- ==========================================
-- TEST 3: Check indexes (for performance)
-- ==========================================
SELECT 'TEST 3: Performance indexes' as test_name;

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'spf_productdetails'
  AND indexname LIKE '%approval%'
ORDER BY indexname;

-- EXPECTED: Should show approval-related indexes
-- This ensures fast queries

-- ==========================================
-- TEST 4: Simulate seller creating product
-- ==========================================
-- This simulates what happens when a seller creates a product
-- You should see approval_status = 'pending' and is_active = false

SELECT 'TEST 4: Simulating seller product creation' as test_name;

-- Check if there are any pending products
SELECT
  product_id,
  name,
  approval_status,
  is_active,
  seller_id,
  created_at
FROM spf_productdetails
WHERE approval_status = 'pending'
ORDER BY created_at DESC
LIMIT 5;

-- EXPECTED:
-- - If a seller just created a product, it should appear here
-- - approval_status should be 'pending'
-- - is_active should be false

-- ==========================================
-- TEST 5: Check customer-facing query
-- ==========================================
-- This simulates what customers see
-- Only approved AND active products should appear

SELECT 'TEST 5: Customer view (approved products only)' as test_name;

SELECT COUNT(*) as customer_visible_products
FROM spf_productdetails
WHERE approval_status = 'approved'
  AND is_active = true;

-- EXPECTED:
-- - Should show count of products customers can see
-- - This should NOT include pending products

-- ==========================================
-- TEST 6: Check seller earnings table
-- ==========================================
SELECT 'TEST 6: Seller earnings table' as test_name;

SELECT
  table_name,
  (SELECT COUNT(*) FROM spf_seller_earnings) as total_earnings
FROM information_schema.tables
WHERE table_name = 'spf_seller_earnings';

-- EXPECTED:
-- - Table exists
-- - May have 0 earnings if no payments completed yet

-- ==========================================
-- TROUBLESHOOTING: If tests fail
-- ==========================================

-- If TEST 1 fails (no columns):
-- → You MUST run CRITICAL_RUN_FIRST.sql first!

-- If TEST 2 shows NULL or empty approval_status:
-- → Run the UPDATE statement from CRITICAL_RUN_FIRST.sql

-- If TEST 4 shows no pending products but seller created one:
-- → Check application logs for errors
-- → Verify API is setting approval_status correctly

-- If TEST 5 shows pending products:
-- → Customer query is not filtering correctly
-- → Check API code for approval_status filter

-- ==========================================
-- QUICK FIX: Reset all products to approved
-- ==========================================
-- Run this if you want to reset everything to approved
-- (Useful for testing)

/*
UPDATE spf_productdetails
SET
  approval_status = 'approved',
  is_active = true,
  approved_at = NOW()
WHERE approval_status IS NULL OR approval_status = '';
*/
