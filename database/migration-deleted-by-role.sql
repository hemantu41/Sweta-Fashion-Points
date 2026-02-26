-- Migration: Add deleted_by_role column to spf_productdetails table
-- Purpose: Track whether a product was deleted by an admin or seller
-- Date: 2026-02-12

-- Add deleted_by_role column to spf_productdetails table
ALTER TABLE spf_productdetails
ADD COLUMN IF NOT EXISTS deleted_by_role VARCHAR(20) CHECK (deleted_by_role IN ('admin', 'seller', 'unknown'));

-- Add comment for documentation
COMMENT ON COLUMN spf_productdetails.deleted_by_role IS 'Role of the user who deleted the product: admin, seller, or unknown';

-- Update existing soft-deleted products with 'unknown' role if not set
UPDATE spf_productdetails
SET deleted_by_role = 'unknown'
WHERE deleted_at IS NOT NULL
  AND deleted_by_role IS NULL;

-- Create index for filtering by deletion role
CREATE INDEX IF NOT EXISTS idx_productdetails_deleted_by_role
  ON spf_productdetails(deleted_by_role)
  WHERE deleted_at IS NOT NULL;

-- Verification query (run this after migration to verify)
-- SELECT
--   deleted_by_role,
--   COUNT(*) as product_count
-- FROM spf_productdetails
-- WHERE deleted_at IS NOT NULL
-- GROUP BY deleted_by_role;
