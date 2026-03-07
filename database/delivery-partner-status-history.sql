-- Migration: Delivery Partner Status History Tracking
-- Run this in Supabase SQL Editor

-- 1. Create the history table
CREATE TABLE IF NOT EXISTS spf_delivery_partner_status_history (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_partner_id UUID      NOT NULL REFERENCES spf_delivery_partners(id) ON DELETE CASCADE,
  from_status     VARCHAR(20),                      -- NULL on first action (e.g. first approval)
  to_status       VARCHAR(20)   NOT NULL,
  action          VARCHAR(50)   NOT NULL,            -- 'Approved', 'Rejected', 'Suspended', 'Deactivated', 'Reactivated'
  note            TEXT,                             -- Optional admin note / rejection reason
  changed_by      UUID,                             -- Admin user ID (nullable for system actions)
  changed_by_name VARCHAR(255),                     -- Denormalized name for easy display
  changed_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- 2. Index for fast per-partner lookups (newest first)
CREATE INDEX IF NOT EXISTS idx_dp_status_history_partner
  ON spf_delivery_partner_status_history(delivery_partner_id, changed_at DESC);

-- 3. Verify
SELECT 'spf_delivery_partner_status_history created successfully' AS result;
