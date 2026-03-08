-- Migration: Add pincode field to users
-- Run this in Supabase SQL Editor

ALTER TABLE spf_users ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);

SELECT 'pincode column added to spf_users' AS result;
