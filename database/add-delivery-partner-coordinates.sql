-- Add GPS coordinates to delivery partners so distance-based assignment works
-- Run this in Supabase SQL Editor

ALTER TABLE spf_delivery_partners
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);
