-- Add latitude and longitude to spf_sellers for browser-based geolocation
-- Run this in Supabase SQL Editor

ALTER TABLE spf_sellers
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);
