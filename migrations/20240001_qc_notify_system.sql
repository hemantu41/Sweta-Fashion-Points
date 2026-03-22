-- ═══════════════════════════════════════════════════════════════════════════
-- QC Notify System Migration
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Extend spf_productdetails ────────────────────────────────────────────
ALTER TABLE spf_productdetails
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- ─── 2. spf_notifications ────────────────────────────────────────────────────
-- Stores in-app bell notifications for sellers.
-- Sellers can only read their own rows (RLS).
-- Service role has full access for server-side writes.

CREATE TABLE IF NOT EXISTS spf_notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    UUID NOT NULL REFERENCES spf_sellers(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,          -- 'order' | 'qc' | 'payment' | 'alert'
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  product_id   UUID REFERENCES spf_productdetails(id) ON DELETE SET NULL,
  product_name TEXT,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_spf_notifications_unread
  ON spf_notifications (seller_id, is_read)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_spf_notifications_seller_time
  ON spf_notifications (seller_id, created_at DESC);

-- Enable RLS
ALTER TABLE spf_notifications ENABLE ROW LEVEL SECURITY;

-- Sellers can only SELECT their own notifications
DROP POLICY IF EXISTS "sellers_read_own_notifications" ON spf_notifications;
CREATE POLICY "sellers_read_own_notifications"
  ON spf_notifications
  FOR SELECT
  USING (seller_id = auth.uid());

-- Service role bypass (Supabase service_role key bypasses RLS automatically)
-- No additional policy needed — service_role ignores RLS by default.

-- ─── 3. spf_notify_event_log ─────────────────────────────────────────────────
-- Audit log of every notify.* event fired by the QC system.
-- Service role only — no seller/user access.

CREATE TABLE IF NOT EXISTS spf_notify_event_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event        TEXT NOT NULL,           -- 'notify.product.approved' etc.
  product_id   UUID REFERENCES spf_productdetails(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  seller_id    UUID REFERENCES spf_sellers(id) ON DELETE SET NULL,
  detail       TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'sent'
                 CHECK (status IN ('sent', 'pending', 'failed')),
  error        TEXT,                    -- error message if status = 'failed'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spf_notify_log_time
  ON spf_notify_event_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_spf_notify_log_seller_time
  ON spf_notify_event_log (seller_id, created_at DESC);

-- Enable RLS — service_role only (no public access)
ALTER TABLE spf_notify_event_log ENABLE ROW LEVEL SECURITY;

-- Block all authenticated/anon access — service role bypasses RLS automatically
DROP POLICY IF EXISTS "block_all_notify_log" ON spf_notify_event_log;
CREATE POLICY "block_all_notify_log"
  ON spf_notify_event_log
  FOR ALL
  USING (false);

-- ─── 4. spf_qc_queue VIEW ────────────────────────────────────────────────────
-- Convenience view joining products with seller info for the QC admin panel.

CREATE OR REPLACE VIEW spf_qc_queue AS
SELECT
  p.id,
  p.product_id,
  p.name,
  p.name_hi,
  p.category,
  p.sub_category,
  p.price,
  p.original_price,
  p.main_image,
  p.images,
  p.approval_status,
  p.is_active,
  p.rejection_reason,
  p.admin_note,
  p.seller_id,
  p.approved_by,
  p.approved_at,
  p.created_at,
  p.updated_at,
  p.deleted_at,
  s.business_name AS seller_name,
  s.email         AS seller_email,
  -- SLA bucket computed in SQL (for dashboards/reporting)
  CASE
    WHEN EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600 >= 24 THEN 'urgent'
    WHEN EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600 >= 12 THEN 'warning'
    ELSE 'ok'
  END AS sla_class,
  ROUND(
    EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600, 1
  ) AS hours_waiting
FROM spf_productdetails p
LEFT JOIN spf_sellers s ON s.id = p.seller_id
WHERE p.deleted_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- Run this file once. Safe to re-run (all statements are idempotent).
-- After running:
--   1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local
--   2. (Optional) Add RESEND_API_KEY to .env.local for email notifications
--   3. Set admin user app_metadata: { "role": "admin" } in Supabase Auth dashboard
--      OR ensure spf_users.is_admin = true for the admin user
-- ═══════════════════════════════════════════════════════════════════════════
