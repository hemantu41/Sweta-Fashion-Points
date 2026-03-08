-- Migration: Pincode coordinates cache
-- Run this in Supabase SQL Editor
-- Each Indian pincode is geocoded once via Google Maps and stored here.
-- All future distance calculations read from this table instead of calling the API.

CREATE TABLE IF NOT EXISTS spf_pincode_coordinates (
  pincode    VARCHAR(10)    PRIMARY KEY,
  latitude   DECIMAL(10, 7) NOT NULL,
  longitude  DECIMAL(10, 7) NOT NULL,
  cached_at  TIMESTAMPTZ    DEFAULT NOW()
);

SELECT 'spf_pincode_coordinates table created' AS result;
