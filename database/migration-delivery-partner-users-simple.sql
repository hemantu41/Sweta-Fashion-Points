-- ============================================
-- SIMPLE MIGRATION: Add delivery partner columns to spf_users
-- ============================================
-- Run this in Supabase SQL Editor

-- Step 1: Add columns (safe, won't fail if already exists)
ALTER TABLE spf_users ADD COLUMN IF NOT EXISTS is_delivery_partner BOOLEAN DEFAULT false;
ALTER TABLE spf_users ADD COLUMN IF NOT EXISTS delivery_partner_id UUID;
ALTER TABLE spf_users ADD COLUMN IF NOT EXISTS delivery_partner_status VARCHAR(20);

-- Step 2: Verify columns were added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'spf_users'
  AND column_name IN ('is_delivery_partner', 'delivery_partner_id', 'delivery_partner_status')
ORDER BY column_name;

-- You should see 3 rows in the result
