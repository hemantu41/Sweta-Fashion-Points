-- Migration: Product Approval Workflow
-- Description: Adds approval status workflow to spf_productdetails table
-- Date: February 2024

-- Add approval status column
ALTER TABLE spf_productdetails
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approval metadata columns
ALTER TABLE spf_productdetails
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES spf_users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for filtering pending products
CREATE INDEX IF NOT EXISTS idx_productdetails_approval_status
  ON spf_productdetails(approval_status);

-- Set existing products to approved for backward compatibility
UPDATE spf_productdetails
SET approval_status = 'approved',
    approved_at = created_at
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Add column comment for documentation
COMMENT ON COLUMN spf_productdetails.approval_status IS 'Product approval status: pending (awaiting review), approved (live on site), rejected (not approved)';
COMMENT ON COLUMN spf_productdetails.rejection_reason IS 'Admin explanation when product is rejected';
