-- ============================================
-- ADD DELIVERY PARTNER COLUMNS TO SPF_USERS
-- ============================================
-- This migration adds columns to link users with delivery partners

-- Add columns to spf_users table
ALTER TABLE spf_users
  ADD COLUMN IF NOT EXISTS is_delivery_partner BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_partner_id UUID,
  ADD COLUMN IF NOT EXISTS delivery_partner_status VARCHAR(20);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'spf_users_delivery_partner_id_fkey'
  ) THEN
    ALTER TABLE spf_users
      ADD CONSTRAINT spf_users_delivery_partner_id_fkey
      FOREIGN KEY (delivery_partner_id)
      REFERENCES spf_delivery_partners(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_delivery_partner_id ON spf_users(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_users_is_delivery_partner ON spf_users(is_delivery_partner);

-- Verify columns were added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'spf_users'
  AND column_name IN ('is_delivery_partner', 'delivery_partner_id', 'delivery_partner_status')
ORDER BY column_name;
