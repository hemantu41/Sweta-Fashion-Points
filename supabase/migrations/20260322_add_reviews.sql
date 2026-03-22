-- ─── Reviews & Seller Responses ─────────────────────────────────────────────
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS spf_reviews (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id        TEXT UNIQUE NOT NULL,
  seller_id       TEXT NOT NULL,
  product_id      TEXT,
  buyer_name      TEXT NOT NULL,
  buyer_email     TEXT NOT NULL,
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  product_name    TEXT NOT NULL,
  verified        BOOLEAN DEFAULT false,
  helpful_count   INTEGER DEFAULT 0,
  review_token    TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS spf_seller_responses (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  review_id       TEXT UNIQUE NOT NULL REFERENCES spf_reviews(id) ON DELETE CASCADE,
  response_text   TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Helpful votes tracking (one vote per IP per review)
CREATE TABLE IF NOT EXISTS spf_review_helpful_votes (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  review_id       TEXT NOT NULL REFERENCES spf_reviews(id) ON DELETE CASCADE,
  voter_ip        TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, voter_ip)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON spf_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON spf_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON spf_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_responses_review_id ON spf_seller_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON spf_review_helpful_votes(review_id);
