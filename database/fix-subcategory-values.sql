-- Migration: Fix subcategory values to match category page tab filters
-- Problem: Seller add-product form used different subcategory strings than
--          what the category pages filter by, so products appeared in "All"
--          but not in the correct subcategory tab.
-- Date: 2026-03-07
-- Safe to run multiple times (idempotent)

-- ============================================================
-- STEP 1: PREVIEW — Run this first to see what will be changed
-- ============================================================

SELECT
  category,
  sub_category,
  COUNT(*) AS product_count
FROM spf_productdetails
WHERE
  deleted_at IS NULL
  AND sub_category IN (
    -- Sarees mismatches
    'daily-wear', 'party-wear', 'seasonal', 'ethnic-wear',
    -- Womens mismatches
    'casual-wear', 'wedding', 'festival',
    -- Mens mismatches
    'shorts-trousers', 'ethnic'
  )
GROUP BY category, sub_category
ORDER BY category, sub_category;

-- ============================================================
-- STEP 2: FIX SAREES subcategories
-- Sarees page tabs: daily | party | wedding | festival
-- ============================================================

-- 'daily-wear' → 'daily'
UPDATE spf_productdetails
SET sub_category = 'daily', updated_at = NOW()
WHERE category = 'sarees' AND sub_category = 'daily-wear';

-- 'party-wear' → 'party'
UPDATE spf_productdetails
SET sub_category = 'party', updated_at = NOW()
WHERE category = 'sarees' AND sub_category = 'party-wear';

-- 'seasonal' → 'festival' (no seasonal tab on sarees page; festival is closest)
UPDATE spf_productdetails
SET sub_category = 'festival', updated_at = NOW()
WHERE category = 'sarees' AND sub_category = 'seasonal';

-- 'ethnic-wear' → 'festival' (no ethnic tab on sarees page; festival is closest)
UPDATE spf_productdetails
SET sub_category = 'festival', updated_at = NOW()
WHERE category = 'sarees' AND sub_category = 'ethnic-wear';

-- ============================================================
-- STEP 3: FIX WOMENS subcategories
-- Womens page tabs: daily | party | ethnic | seasonal
-- ============================================================

-- 'daily-wear' → 'daily'
UPDATE spf_productdetails
SET sub_category = 'daily', updated_at = NOW()
WHERE category = 'womens' AND sub_category = 'daily-wear';

-- 'party-wear' → 'party'
UPDATE spf_productdetails
SET sub_category = 'party', updated_at = NOW()
WHERE category = 'womens' AND sub_category = 'party-wear';

-- 'ethnic-wear' → 'ethnic'
UPDATE spf_productdetails
SET sub_category = 'ethnic', updated_at = NOW()
WHERE category = 'womens' AND sub_category = 'ethnic-wear';

-- 'casual-wear' → 'daily' (no casual tab; daily is closest)
UPDATE spf_productdetails
SET sub_category = 'daily', updated_at = NOW()
WHERE category = 'womens' AND sub_category = 'casual-wear';

-- 'wedding' → 'ethnic' (no wedding tab on womens page; ethnic is closest)
UPDATE spf_productdetails
SET sub_category = 'ethnic', updated_at = NOW()
WHERE category = 'womens' AND sub_category = 'wedding';

-- 'festival' → 'seasonal' (no festival tab on womens page; seasonal is closest)
UPDATE spf_productdetails
SET sub_category = 'seasonal', updated_at = NOW()
WHERE category = 'womens' AND sub_category = 'festival';

-- ============================================================
-- STEP 4: FIX MENS subcategories
-- Mens page tabs: shirts | tshirts | jeans | shorts
-- ============================================================

-- 'shorts-trousers' → 'shorts'
UPDATE spf_productdetails
SET sub_category = 'shorts', updated_at = NOW()
WHERE category = 'mens' AND sub_category = 'shorts-trousers';

-- 'ethnic' → 'shirts' (mens page has no ethnic tab; was incorrectly added
--  by old seller edit form — review these products manually if needed)
UPDATE spf_productdetails
SET sub_category = 'shirts', updated_at = NOW()
WHERE category = 'mens' AND sub_category = 'ethnic';

-- ============================================================
-- STEP 5: FIX KIDS subcategories
-- Kids page tabs: 0-3 | 4-7 | 8-12 (age-based only)
-- NOTE: Kids products with clothing-type subcategories (daily-wear,
--       party-wear etc.) cannot be automatically mapped to age groups.
--       Run the SELECT below to review these products manually,
--       then update each with the correct age group (0-3, 4-7, or 8-12).
-- ============================================================

-- Preview kids products that still have non-age subcategories:
SELECT
  id,
  product_id,
  name,
  sub_category,
  created_at
FROM spf_productdetails
WHERE
  category = 'kids'
  AND sub_category NOT IN ('0-3', '4-7', '8-12')
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- ============================================================
-- STEP 6: VERIFY — Run after applying fixes
-- All rows should show expected subcategory values only
-- ============================================================

SELECT
  category,
  sub_category,
  COUNT(*) AS product_count
FROM spf_productdetails
WHERE deleted_at IS NULL
GROUP BY category, sub_category
ORDER BY category, sub_category;
