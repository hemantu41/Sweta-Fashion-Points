-- Migration: Add address field to spf_users
-- Run this in Supabase SQL Editor

ALTER TABLE spf_users ADD COLUMN IF NOT EXISTS address TEXT;

SELECT 'address column added to spf_users' AS result;
