-- Add suspension_reason column to spf_sellers
ALTER TABLE spf_sellers
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Seller status change history table
CREATE TABLE IF NOT EXISTS spf_seller_status_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    UUID NOT NULL REFERENCES spf_sellers(id) ON DELETE CASCADE,
  changed_by   UUID REFERENCES spf_users(id),
  from_status  VARCHAR(20),
  to_status    VARCHAR(20) NOT NULL,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_status_history_seller_id
  ON spf_seller_status_history(seller_id);
