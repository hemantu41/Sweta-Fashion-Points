-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Add category FK columns to spf_productdetails + product count trigger
-- Run AFTER 001 and 002.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add L1/L2/L3 FK columns (safe to re-run)
ALTER TABLE spf_productdetails
  ADD COLUMN IF NOT EXISTS category_l1_id UUID REFERENCES spf_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_l2_id UUID REFERENCES spf_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_l3_id UUID REFERENCES spf_categories(id) ON DELETE SET NULL;

-- 2. Indexes for FK lookups
CREATE INDEX IF NOT EXISTS idx_products_category_l1 ON spf_productdetails(category_l1_id);
CREATE INDEX IF NOT EXISTS idx_products_category_l2 ON spf_productdetails(category_l2_id);
CREATE INDEX IF NOT EXISTS idx_products_category_l3 ON spf_productdetails(category_l3_id);

-- 3. Product count sync function
CREATE OR REPLACE FUNCTION sync_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
  -- ── INSERT: increment counts ──
  IF TG_OP = 'INSERT' THEN
    IF NEW.category_l1_id IS NOT NULL THEN
      UPDATE spf_categories SET product_count = product_count + 1 WHERE id = NEW.category_l1_id;
    END IF;
    IF NEW.category_l2_id IS NOT NULL THEN
      UPDATE spf_categories SET product_count = product_count + 1 WHERE id = NEW.category_l2_id;
    END IF;
    IF NEW.category_l3_id IS NOT NULL THEN
      UPDATE spf_categories SET product_count = product_count + 1 WHERE id = NEW.category_l3_id;
    END IF;

  -- ── DELETE: decrement counts (floor at 0) ──
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.category_l1_id IS NOT NULL THEN
      UPDATE spf_categories SET product_count = GREATEST(product_count - 1, 0) WHERE id = OLD.category_l1_id;
    END IF;
    IF OLD.category_l2_id IS NOT NULL THEN
      UPDATE spf_categories SET product_count = GREATEST(product_count - 1, 0) WHERE id = OLD.category_l2_id;
    END IF;
    IF OLD.category_l3_id IS NOT NULL THEN
      UPDATE spf_categories SET product_count = GREATEST(product_count - 1, 0) WHERE id = OLD.category_l3_id;
    END IF;

  -- ── UPDATE: adjust on category change ──
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.category_l1_id IS DISTINCT FROM NEW.category_l1_id THEN
      IF OLD.category_l1_id IS NOT NULL THEN
        UPDATE spf_categories SET product_count = GREATEST(product_count - 1, 0) WHERE id = OLD.category_l1_id;
      END IF;
      IF NEW.category_l1_id IS NOT NULL THEN
        UPDATE spf_categories SET product_count = product_count + 1 WHERE id = NEW.category_l1_id;
      END IF;
    END IF;

    IF OLD.category_l2_id IS DISTINCT FROM NEW.category_l2_id THEN
      IF OLD.category_l2_id IS NOT NULL THEN
        UPDATE spf_categories SET product_count = GREATEST(product_count - 1, 0) WHERE id = OLD.category_l2_id;
      END IF;
      IF NEW.category_l2_id IS NOT NULL THEN
        UPDATE spf_categories SET product_count = product_count + 1 WHERE id = NEW.category_l2_id;
      END IF;
    END IF;

    IF OLD.category_l3_id IS DISTINCT FROM NEW.category_l3_id THEN
      IF OLD.category_l3_id IS NOT NULL THEN
        UPDATE spf_categories SET product_count = GREATEST(product_count - 1, 0) WHERE id = OLD.category_l3_id;
      END IF;
      IF NEW.category_l3_id IS NOT NULL THEN
        UPDATE spf_categories SET product_count = product_count + 1 WHERE id = NEW.category_l3_id;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to spf_productdetails
DROP TRIGGER IF EXISTS trg_sync_category_product_count ON spf_productdetails;
CREATE TRIGGER trg_sync_category_product_count
  AFTER INSERT OR UPDATE OR DELETE ON spf_productdetails
  FOR EACH ROW EXECUTE FUNCTION sync_category_product_count();

-- 5. Backfill product_count for existing rows (one-time)
--    Run this ONLY once after adding the columns and populating category_l1/2/3 IDs.
--    Uncomment when you're ready:
--
-- UPDATE spf_categories c
-- SET product_count = (
--   SELECT COUNT(*) FROM spf_productdetails p
--   WHERE p.category_l1_id = c.id
--      OR p.category_l2_id = c.id
--      OR p.category_l3_id = c.id
-- );

-- Verify
SELECT
  column_name, data_type
FROM information_schema.columns
WHERE table_name = 'spf_productdetails'
  AND column_name LIKE 'category_%'
ORDER BY column_name;
