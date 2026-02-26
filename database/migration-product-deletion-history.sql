-- Migration: Create product deletion history table
-- Purpose: Track complete history of product deletions (admin and seller)
-- Date: 2026-02-12

-- Create product deletion history table
CREATE TABLE IF NOT EXISTS spf_product_deletion_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255),
  deleted_by UUID REFERENCES spf_users(id),
  deleted_by_role VARCHAR(20) CHECK (deleted_by_role IN ('admin', 'seller', 'unknown')),
  deletion_reason TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key to product (note: using product_id string, not UUID id)
  CONSTRAINT fk_product FOREIGN KEY (product_id)
    REFERENCES spf_productdetails(product_id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_deletion_history_product_id
  ON spf_product_deletion_history(product_id);

CREATE INDEX IF NOT EXISTS idx_deletion_history_deleted_at
  ON spf_product_deletion_history(deleted_at DESC);

CREATE INDEX IF NOT EXISTS idx_deletion_history_deleted_by
  ON spf_product_deletion_history(deleted_by);

-- Add comment for documentation
COMMENT ON TABLE spf_product_deletion_history IS
  'Tracks complete history of product deletion attempts. Each deletion (by admin or seller) creates a new history entry, preserving the full audit trail.';

COMMENT ON COLUMN spf_product_deletion_history.product_id IS
  'Product ID (string format like SF-001) from spf_productdetails.product_id';

COMMENT ON COLUMN spf_product_deletion_history.deleted_by_role IS
  'Role of user who deleted: admin, seller, or unknown';

COMMENT ON COLUMN spf_product_deletion_history.deletion_reason IS
  'Reason provided by user for deleting the product';

COMMENT ON COLUMN spf_product_deletion_history.deleted_at IS
  'Timestamp when deletion occurred (may differ from created_at in edge cases)';

-- Example query to view deletion history for a product
-- SELECT
--   dh.*,
--   u.email as deleted_by_email
-- FROM spf_product_deletion_history dh
-- LEFT JOIN spf_users u ON dh.deleted_by = u.id
-- WHERE dh.product_id = 'SF-001'
-- ORDER BY dh.deleted_at DESC;
