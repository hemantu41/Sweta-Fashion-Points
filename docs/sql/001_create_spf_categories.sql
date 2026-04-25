-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001: Create spf_categories table
-- Run this in Supabase SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS spf_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  name_hindi      VARCHAR(100),
  slug            VARCHAR(120) NOT NULL UNIQUE,
  parent_id       UUID REFERENCES spf_categories(id) ON DELETE SET NULL,
  level           INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  icon            VARCHAR(50),
  image_url       VARCHAR(500),
  display_order   INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_occasion     BOOLEAN NOT NULL DEFAULT false,
  product_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent        ON spf_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level         ON spf_categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_active        ON spf_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug          ON spf_categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON spf_categories(parent_id, display_order);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_categories_updated_at ON spf_categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON spf_categories
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
