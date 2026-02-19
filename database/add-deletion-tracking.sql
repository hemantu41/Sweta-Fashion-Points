-- Add Deletion Tracking to Products
-- This allows soft-deletion with comments instead of hard-deletion

-- Add deletion tracking columns
ALTER TABLE spf_productdetails
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES spf_users(id),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Create index for filtering deleted products
CREATE INDEX IF NOT EXISTS idx_productdetails_deleted_at
  ON spf_productdetails(deleted_at);

-- Comments for documentation
COMMENT ON COLUMN spf_productdetails.deleted_at IS 'Timestamp when product was soft-deleted by seller';
COMMENT ON COLUMN spf_productdetails.deleted_by IS 'User ID of who deleted the product';
COMMENT ON COLUMN spf_productdetails.deletion_reason IS 'Reason provided by seller for deletion';
