-- Add reactivation request fields to spf_sellers
ALTER TABLE spf_sellers
  ADD COLUMN IF NOT EXISTS reactivation_request      TEXT,
  ADD COLUMN IF NOT EXISTS reactivation_requested_at TIMESTAMPTZ;
