-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 005 — Shiprocket Logistics Integration
-- Run in: Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add Shiprocket pickup location column to sellers
ALTER TABLE spf_sellers
  ADD COLUMN IF NOT EXISTS shiprocket_pickup_location TEXT,
  ADD COLUMN IF NOT EXISTS pickup_pincode              TEXT;

-- 2. Shipments table (one row per order shipment)
CREATE TABLE IF NOT EXISTS spf_shipments (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID        NOT NULL REFERENCES spf_payment_orders(id) ON DELETE CASCADE,
  seller_id             UUID        NOT NULL REFERENCES spf_sellers(id)        ON DELETE CASCADE,

  -- Shiprocket identifiers
  shiprocket_order_id   BIGINT,
  shipment_id           BIGINT,
  awb_number            TEXT        UNIQUE,
  courier_name          TEXT,

  -- Status lifecycle
  status                TEXT        NOT NULL DEFAULT 'label_generated',
  -- label_generated | pickup_scheduled | picked_up | in_transit
  -- out_for_delivery | delivered | cancelled | returned | delivery_failed

  -- Timestamps
  label_generated_at    TIMESTAMPTZ,
  picked_up_at          TIMESTAMPTZ,
  shipped_at            TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  estimated_delivery    DATE,

  -- RTO
  is_rto                BOOLEAN     NOT NULL DEFAULT FALSE,
  rto_reason            TEXT,

  -- Package
  weight_kg             NUMERIC(6,3),
  dimensions_cm         TEXT,  -- "LxBxH"

  -- Label
  label_url             TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tracking events table (append-only log)
CREATE TABLE IF NOT EXISTS spf_shipment_tracking (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id   UUID        NOT NULL REFERENCES spf_shipments(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL,
  location      TEXT,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_spf_shipments_order_id   ON spf_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_spf_shipments_seller_id  ON spf_shipments(seller_id);
CREATE INDEX IF NOT EXISTS idx_spf_shipments_awb        ON spf_shipments(awb_number);
CREATE INDEX IF NOT EXISTS idx_spf_shipment_tracking_id ON spf_shipment_tracking(shipment_id);

-- 5. RLS — service role can do everything; anon cannot read shipment data directly
ALTER TABLE spf_shipments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE spf_shipment_tracking ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend) full access
CREATE POLICY "service_role_all_shipments"
  ON spf_shipments FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_tracking"
  ON spf_shipment_tracking FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated sellers to read their own shipments
CREATE POLICY "seller_read_own_shipments"
  ON spf_shipments FOR SELECT
  TO authenticated
  USING (seller_id IN (
    SELECT id FROM spf_sellers WHERE user_id = auth.uid()
  ));

CREATE POLICY "seller_read_own_tracking"
  ON spf_shipment_tracking FOR SELECT
  TO authenticated
  USING (shipment_id IN (
    SELECT id FROM spf_shipments
    WHERE seller_id IN (SELECT id FROM spf_sellers WHERE user_id = auth.uid())
  ));
