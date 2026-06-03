-- ─────────────────────────────────────────────────────────────────────────────
-- 007_return_requests.sql
-- Customer-initiated return request tracking for Insta Fashion Points
-- Run once in Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Return request table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS spf_return_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid        NOT NULL REFERENCES spf_orders(id) ON DELETE CASCADE,
  customer_id   uuid        NOT NULL REFERENCES spf_users(id),
  seller_id     uuid        NOT NULL,   -- denormalised for fast seller-dashboard queries

  -- Return classification
  return_type   text        NOT NULL DEFAULT 'CUSTOMER_RETURN',
  -- CUSTOMER_RETURN : customer has the item and wants to send it back
  -- RTO             : courier couldn't deliver; package going back to seller

  -- Reason (customer supplied)
  reason_category text      NOT NULL,
  -- damaged | wrong_item | size_issue | quality_issue | not_as_described | changed_mind | other

  reason_detail  text,      -- free-text elaboration (optional)
  item_condition text,      -- unopened | opened_unused | used | damaged

  -- Workflow status
  status         text        NOT NULL DEFAULT 'PENDING',
  -- PENDING → UNDER_REVIEW → APPROVED / REJECTED → REFUND_INITIATED → REFUNDED

  -- Admin review fields
  admin_notes    text,
  reviewed_by    uuid        REFERENCES spf_users(id),
  reviewed_at    timestamptz,
  seller_verified boolean    DEFAULT false,
  -- admin ticked "verified with seller" before approving

  -- Refund tracking
  refund_amount  numeric(12,2),
  razorpay_refund_id  text,
  refund_status  text,       -- initiated | processed | failed
  refund_initiated_at timestamptz,
  refund_completed_at timestamptz,

  -- Timestamps
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Indexes for fast look-ups ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_return_requests_order_id
  ON spf_return_requests (order_id);

CREATE INDEX IF NOT EXISTS idx_return_requests_customer_id
  ON spf_return_requests (customer_id);

CREATE INDEX IF NOT EXISTS idx_return_requests_seller_id
  ON spf_return_requests (seller_id);

CREATE INDEX IF NOT EXISTS idx_return_requests_status
  ON spf_return_requests (status);

CREATE INDEX IF NOT EXISTS idx_return_requests_created_at
  ON spf_return_requests (created_at DESC);

-- ── 3. One-return-per-order constraint ───────────────────────────────────────
-- Prevents duplicate return requests for the same order

ALTER TABLE spf_return_requests
  DROP CONSTRAINT IF EXISTS uq_return_per_order;

ALTER TABLE spf_return_requests
  ADD CONSTRAINT uq_return_per_order UNIQUE (order_id);

-- ── 4. updated_at auto-refresh trigger ───────────────────────────────────────

CREATE OR REPLACE FUNCTION set_return_request_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_return_request_updated_at ON spf_return_requests;

CREATE TRIGGER trg_return_request_updated_at
  BEFORE UPDATE ON spf_return_requests
  FOR EACH ROW EXECUTE FUNCTION set_return_request_updated_at();

-- ── 5. RLS — service-role bypasses; anon/user cannot touch directly ──────────
-- All mutations go through the API layer using supabaseAdmin (service role key)

ALTER TABLE spf_return_requests ENABLE ROW LEVEL SECURITY;

-- Public (anon) read: none
-- All access via service-role API routes only

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTES ON RETURN TYPES
-- ─────────────────────────────────────────────────────────────────────────────
-- CUSTOMER_RETURN
--   Customer received the parcel, has it in hand, wants to send it back.
--   Flow: Customer clicks "Request Return" → admin reviews → approves →
--         reverse pickup arranged → item reaches seller → refund issued.
--
-- RTO  (Return to Origin)
--   Courier could NOT deliver (customer unavailable / wrong address / refused).
--   Shiprocket auto-triggers this; a row is inserted by the shipping webhook
--   with return_type = 'RTO'. No customer action needed.
--   Flow: Shiprocket marks RETURN_INITIATED → RETURNED → admin confirms →
--         no refund for COD; prepaid refund issued.
-- ─────────────────────────────────────────────────────────────────────────────
