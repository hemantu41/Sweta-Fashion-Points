-- ==========================================
-- CRITICAL: RUN THIS FIRST IN SUPABASE
-- ==========================================
-- This script MUST be run before the approval workflow will work
-- Go to: Supabase Dashboard > SQL Editor > New Query
-- Copy and paste this entire file, then click RUN

-- ==========================================
-- STEP 1: Add approval columns to products
-- ==========================================

-- Add approval_status column with default 'pending'
ALTER TABLE spf_productdetails
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approval metadata columns
ALTER TABLE spf_productdetails
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES spf_users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for FAST filtering (critical for performance)
CREATE INDEX IF NOT EXISTS idx_productdetails_approval_status
  ON spf_productdetails(approval_status);

-- Create composite index for customer queries (approval + active)
CREATE INDEX IF NOT EXISTS idx_productdetails_approval_active
  ON spf_productdetails(approval_status, is_active)
  WHERE approval_status = 'approved' AND is_active = true;

-- Create index for seller queries
CREATE INDEX IF NOT EXISTS idx_productdetails_seller_approval
  ON spf_productdetails(seller_id, approval_status);

-- Add column comments
COMMENT ON COLUMN spf_productdetails.approval_status IS 'Product approval status: pending (awaiting review), approved (live on site), rejected (not approved)';
COMMENT ON COLUMN spf_productdetails.rejection_reason IS 'Admin explanation when product is rejected';

-- ==========================================
-- STEP 2: Set existing products to approved
-- (BACKWARD COMPATIBILITY)
-- ==========================================

-- Set ALL existing products to approved so they stay live
UPDATE spf_productdetails
SET
  approval_status = 'approved',
  is_active = true,
  approved_at = COALESCE(created_at, NOW())
WHERE approval_status IS NULL
   OR approval_status = '';

-- ==========================================
-- STEP 3: Create seller earnings table
-- ==========================================

CREATE TABLE IF NOT EXISTS spf_seller_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES spf_sellers(id),
  order_id UUID NOT NULL REFERENCES spf_payment_orders(id),
  product_id UUID REFERENCES spf_productdetails(id),

  -- Order item details
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_item_price DECIMAL(10,2) NOT NULL,

  -- Commission calculation
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  seller_earning DECIMAL(10,2) NOT NULL,

  -- Payment tracking
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed')),
  payment_date DATE,
  payment_reference VARCHAR(100),
  payment_notes TEXT,

  -- Metadata
  order_date TIMESTAMP WITH TIME ZONE NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one earning record per order item
  UNIQUE(order_id, product_id, item_name)
);

-- Create indexes for FAST queries
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller ON spf_seller_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_order ON spf_seller_earnings(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_payment_status ON spf_seller_earnings(payment_status);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_order_date ON spf_seller_earnings(order_date DESC);

-- Composite index for seller dashboard queries
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller_date ON spf_seller_earnings(seller_id, order_date DESC);

COMMENT ON TABLE spf_seller_earnings IS 'Tracks seller earnings per order item with commission calculation. Created automatically when payment is completed.';

-- ==========================================
-- STEP 4: Verify the setup
-- ==========================================

-- Check approval_status column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'spf_productdetails'
  AND column_name = 'approval_status';

-- Check product statuses
SELECT
  approval_status,
  is_active,
  COUNT(*) as count
FROM spf_productdetails
GROUP BY approval_status, is_active
ORDER BY approval_status;

-- Check if seller_earnings table exists
SELECT COUNT(*) as earnings_table_exists
FROM information_schema.tables
WHERE table_name = 'spf_seller_earnings';

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
-- If you see results from the verification queries above,
-- the setup is complete!
--
-- Expected results:
-- 1. approval_status column exists with default 'pending'
-- 2. All existing products have approval_status = 'approved'
-- 3. spf_seller_earnings table exists
-- ==========================================
