-- Phase 2 DB Migrations for Insta Fashion Points Seller Dashboard
-- Run this in your Supabase SQL editor.
-- All changes are additive (non-destructive).

-- =============================================
-- Module 1: QC Tracker — feedback thread table
-- =============================================

CREATE TABLE IF NOT EXISTS spf_product_qc_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL,
  message       TEXT NOT NULL,
  author_type   VARCHAR(10) NOT NULL CHECK (author_type IN ('admin', 'seller')),
  author_name   VARCHAR(100) NOT NULL DEFAULT 'Unknown',
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qc_feedback_product_id ON spf_product_qc_feedback(product_id);
CREATE INDEX IF NOT EXISTS idx_qc_feedback_created_at ON spf_product_qc_feedback(created_at DESC);

-- Optional: Add qc_stage tracking to products table (for future use)
-- ALTER TABLE spf_products ADD COLUMN IF NOT EXISTS qc_stage VARCHAR(30) DEFAULT 'submitted';
-- ALTER TABLE spf_products ADD COLUMN IF NOT EXISTS rejection_count INT NOT NULL DEFAULT 0;

-- =============================================
-- Module 4: Notifications table
-- =============================================

CREATE TABLE IF NOT EXISTS spf_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     UUID NOT NULL REFERENCES spf_sellers(id) ON DELETE CASCADE,
  type          VARCHAR(20) NOT NULL CHECK (type IN ('order', 'qc', 'payment', 'alert')),
  title         VARCHAR(200) NOT NULL,
  message       TEXT NOT NULL,
  link          VARCHAR(300),
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_seller_id ON spf_notifications(seller_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON spf_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON spf_notifications(seller_id, is_read);

-- Enable RLS (optional — if you use Supabase row-level security)
-- ALTER TABLE spf_notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE spf_product_qc_feedback ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Verify tables were created
-- =============================================
SELECT 'spf_product_qc_feedback' AS table_name, COUNT(*) AS rows FROM spf_product_qc_feedback
UNION ALL
SELECT 'spf_notifications', COUNT(*) FROM spf_notifications;
