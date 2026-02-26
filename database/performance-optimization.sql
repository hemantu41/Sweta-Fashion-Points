-- Performance Optimization: Add indexes for faster queries
-- Run this in Supabase SQL Editor to improve seller dashboard loading speed

-- Index on seller_id for faster product filtering by seller
CREATE INDEX IF NOT EXISTS idx_productdetails_seller_id
  ON spf_productdetails(seller_id);

-- Index on seller_id + approval_status for even faster filtered queries
CREATE INDEX IF NOT EXISTS idx_productdetails_seller_approval
  ON spf_productdetails(seller_id, approval_status);

-- Index on created_at for faster sorting (products ordered by creation date)
CREATE INDEX IF NOT EXISTS idx_productdetails_created_at
  ON spf_productdetails(created_at DESC);

-- Composite index for customer-facing queries (active + approved products)
CREATE INDEX IF NOT EXISTS idx_productdetails_active_approved
  ON spf_productdetails(is_active, approval_status)
  WHERE is_active = true AND approval_status = 'approved';

-- Index on category for faster category filtering
CREATE INDEX IF NOT EXISTS idx_productdetails_category
  ON spf_productdetails(category);

-- Analyze the table to update query planner statistics
ANALYZE spf_productdetails;

-- Comment for documentation
COMMENT ON INDEX idx_productdetails_seller_id IS 'Speeds up seller dashboard product listing';
COMMENT ON INDEX idx_productdetails_seller_approval IS 'Speeds up filtered product queries by seller and status';
