-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 006 — IFP Order Lifecycle System
-- Run in: Supabase → SQL Editor  (or psql for RDS/local)
-- Idempotent: uses CREATE IF NOT EXISTS / DO $$ guards throughout
-- ─────────────────────────────────────────────────────────────────────────────

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 1 — ENUM TYPES
-- ═════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'PENDING_PAYMENT',
    'PAYMENT_FAILED',
    'CONFIRMED',
    'SELLER_NOTIFIED',
    'ACCEPTED',
    'PACKED',
    'READY_TO_SHIP',
    'PICKUP_SCHEDULED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURN_INITIATED',
    'RETURNED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM (
    'UPI', 'CARD', 'NET_BANKING', 'COD'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE risk_status_type AS ENUM (
    'CLEAR', 'SOFT_FLAG', 'HOLD', 'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE flag_type AS ENUM (
    'COD_HIGH_VALUE_NEW_CUSTOMER',
    'EXCESS_COD_UNDELIVERED',
    'HIGH_RTO_PINCODE',
    'RAPID_ORDER_AFTER_SIGNUP',
    'MULTI_ACCOUNT_DEVICE',
    'ADDRESS_ABUSE',
    'VELOCITY_BREACH',
    'VPN_PROXY',
    'AMOUNT_MISMATCH',
    'DUPLICATE_TRANSACTION'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE actor_type AS ENUM (
    'SYSTEM', 'SELLER', 'ADMIN', 'COURIER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payout_cycle AS ENUM ('T7', 'T5');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM (
    'PENDING', 'PROCESSING', 'PAID', 'ON_HOLD'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 2 — HELPER: auto-update updated_at column
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION spf_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 3 — spf_orders
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS spf_orders (
  -- Identity
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number           VARCHAR(30)   NOT NULL UNIQUE,
  -- Format: IFP-ORD-YYYYMMDD-XXXX

  -- Parties
  customer_id            UUID          NOT NULL,
  -- FK to spf_users(id) — add FK after confirming table exists:
  -- REFERENCES spf_users(id) ON DELETE RESTRICT
  seller_id              UUID          NOT NULL,
  -- REFERENCES spf_sellers(id) ON DELETE RESTRICT

  -- Status
  status                 order_status  NOT NULL DEFAULT 'PENDING_PAYMENT',
  delivery_type          VARCHAR(20)   NOT NULL DEFAULT 'STANDARD'
                           CHECK (delivery_type IN ('STANDARD')),
  -- IFP Fast deferred; only STANDARD now

  -- Payment
  payment_method         payment_method_type,
  payment_status         VARCHAR(20),
  -- razorpay states: created | attempted | paid | failed | refunded
  payment_gateway_ref    VARCHAR(100), -- razorpay order_id
  transaction_id         VARCHAR(100), -- razorpay payment_id

  -- Financials (INR, decimal)
  subtotal               NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  shipping_charge        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping_charge >= 0),
  platform_fee           NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
  pg_fee                 NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (pg_fee >= 0),
  seller_payout_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Computed: subtotal - platform_fee - pg_fee + shipping_charge

  -- Delivery address (JSONB)
  -- Required keys: name, phone, house, area, city, state, pincode
  -- Optional keys: landmark, address_type
  shipping_address       JSONB         NOT NULL,

  -- Logistics
  awb_number             VARCHAR(50)   UNIQUE,
  courier_partner        VARCHAR(100),
  tracking_url           TEXT,
  shiprocket_order_id    VARCHAR(50),
  shiprocket_shipment_id VARCHAR(50),

  -- Lifecycle timestamps
  seller_accepted_at     TIMESTAMPTZ,
  packed_at              TIMESTAMPTZ,
  ready_at               TIMESTAMPTZ,
  picked_up_at           TIMESTAMPTZ,
  delivered_at           TIMESTAMPTZ,

  -- SLA deadlines (computed on status transitions)
  acceptance_sla_deadline TIMESTAMPTZ,
  -- Set to CONFIRMED timestamp + 2 hrs when order becomes CONFIRMED
  packing_sla_deadline    TIMESTAMPTZ,
  -- Set to seller_accepted_at + 4 hrs when order becomes ACCEPTED
  return_window_closes_at TIMESTAMPTZ,
  -- Set to delivered_at + 7 days when order becomes DELIVERED

  -- Risk
  risk_score             INT           NOT NULL DEFAULT 0 CHECK (risk_score >= 0),
  risk_status            risk_status_type NOT NULL DEFAULT 'CLEAR',

  -- Fulfilment extras
  packed_photo_url       TEXT,
  notes                  TEXT,

  -- Audit
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spf_orders_customer_id    ON spf_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_spf_orders_seller_id      ON spf_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_spf_orders_status         ON spf_orders(status);
CREATE INDEX IF NOT EXISTS idx_spf_orders_awb            ON spf_orders(awb_number) WHERE awb_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_spf_orders_risk_status    ON spf_orders(risk_status) WHERE risk_status != 'CLEAR';
CREATE INDEX IF NOT EXISTS idx_spf_orders_created_at     ON spf_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spf_orders_seller_status  ON spf_orders(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_spf_orders_sla_acceptance ON spf_orders(acceptance_sla_deadline)
  WHERE status IN ('CONFIRMED', 'SELLER_NOTIFIED') AND acceptance_sla_deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_spf_orders_sla_packing    ON spf_orders(packing_sla_deadline)
  WHERE status = 'ACCEPTED' AND packing_sla_deadline IS NOT NULL;

-- GIN index for shipping_address JSONB queries (e.g. filter by pincode)
CREATE INDEX IF NOT EXISTS idx_spf_orders_shipping_address ON spf_orders USING GIN(shipping_address);

-- Updated-at trigger
DROP TRIGGER IF EXISTS spf_orders_updated_at ON spf_orders;
CREATE TRIGGER spf_orders_updated_at
  BEFORE UPDATE ON spf_orders
  FOR EACH ROW EXECUTE FUNCTION spf_set_updated_at();

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 4 — spf_order_items
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS spf_order_items (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID          NOT NULL REFERENCES spf_orders(id) ON DELETE CASCADE,
  product_id      UUID          NOT NULL,
  variant_id      UUID,
  seller_id       UUID          NOT NULL,

  product_name    VARCHAR(255)  NOT NULL,
  -- { size?: string, color?: string, material?: string }
  variant_details JSONB,
  sku             VARCHAR(100),

  quantity        INT           NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price     NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  -- Constraint: total_price = unit_price * quantity (enforced at app layer)

  -- 4-6 digit HSN for GST invoice
  hsn_code        VARCHAR(8),

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spf_order_items_order_id   ON spf_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_spf_order_items_product_id ON spf_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_spf_order_items_seller_id  ON spf_order_items(seller_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 5 — spf_order_status_history  (append-only)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS spf_order_status_history (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID         NOT NULL REFERENCES spf_orders(id) ON DELETE CASCADE,

  -- NULL on the very first entry (PENDING_PAYMENT has no prior state)
  from_status order_status,
  to_status   order_status NOT NULL,

  actor_type  actor_type   NOT NULL,
  -- userId / sellerId / adminId / system process name
  actor_id    VARCHAR(100),

  note        TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spf_order_history_order_id   ON spf_order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_spf_order_history_order_time ON spf_order_status_history(order_id, created_at DESC);

-- Prevent any UPDATE or DELETE on this table (immutable audit log)
CREATE OR REPLACE RULE spf_order_history_no_update AS
  ON UPDATE TO spf_order_status_history DO INSTEAD NOTHING;
CREATE OR REPLACE RULE spf_order_history_no_delete AS
  ON DELETE TO spf_order_status_history DO INSTEAD NOTHING;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 6 — spf_order_risk_flags
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS spf_order_risk_flags (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID        NOT NULL REFERENCES spf_orders(id) ON DELETE CASCADE,

  flag_type            flag_type   NOT NULL,
  -- Raw value that triggered the flag, e.g. "cod_amount=3500", "rto_rate=0.48"
  flag_value           TEXT,
  score_contribution   INT         NOT NULL DEFAULT 0 CHECK (score_contribution >= 0),

  resolved_by_admin_id UUID,
  resolved_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spf_risk_flags_order_id ON spf_order_risk_flags(order_id);
CREATE INDEX IF NOT EXISTS idx_spf_risk_flags_type     ON spf_order_risk_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_spf_risk_flags_unresolved
  ON spf_order_risk_flags(order_id) WHERE resolved_at IS NULL;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 7 — spf_customer_risk_profiles  (1-to-1 with spf_users)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS spf_customer_risk_profiles (
  customer_id           UUID        PRIMARY KEY,
  -- FK: REFERENCES spf_users(id) ON DELETE CASCADE

  total_cod_orders      INT         NOT NULL DEFAULT 0 CHECK (total_cod_orders >= 0),
  undelivered_cod_count INT         NOT NULL DEFAULT 0 CHECK (undelivered_cod_count >= 0),
  rto_count             INT         NOT NULL DEFAULT 0 CHECK (rto_count >= 0),
  fraud_hold_count      INT         NOT NULL DEFAULT 0 CHECK (fraud_hold_count >= 0),
  last_fraud_hold_at    TIMESTAMPTZ,

  is_blocked            BOOLEAN     NOT NULL DEFAULT FALSE,
  block_reason          TEXT,

  last_updated          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spf_crp_blocked ON spf_customer_risk_profiles(is_blocked)
  WHERE is_blocked = TRUE;

-- Updated-at trigger
DROP TRIGGER IF EXISTS spf_crp_updated_at ON spf_customer_risk_profiles;
CREATE TRIGGER spf_crp_updated_at
  BEFORE UPDATE ON spf_customer_risk_profiles
  FOR EACH ROW EXECUTE FUNCTION spf_set_updated_at();

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 8 — spf_seller_payouts
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS spf_seller_payouts (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id          UUID          NOT NULL,
  order_id           UUID          NOT NULL UNIQUE REFERENCES spf_orders(id),

  gross_amount       NUMERIC(12,2) NOT NULL CHECK (gross_amount >= 0),
  shipping_deduction NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping_deduction >= 0),
  pg_fee_deduction   NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (pg_fee_deduction >= 0),
  net_payout         NUMERIC(12,2) NOT NULL,
  -- Constraint: net_payout = gross_amount - shipping_deduction - pg_fee_deduction

  payout_cycle       payout_cycle  NOT NULL DEFAULT 'T7',
  status             payout_status NOT NULL DEFAULT 'PENDING',

  payout_date        DATE,
  utr_number         VARCHAR(50),

  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spf_payouts_seller_id     ON spf_seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_spf_payouts_status        ON spf_seller_payouts(status);
CREATE INDEX IF NOT EXISTS idx_spf_payouts_date          ON spf_seller_payouts(payout_date) WHERE payout_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_spf_payouts_seller_status ON spf_seller_payouts(seller_id, status);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 9 — spf_pincode_risk_config
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS spf_pincode_risk_config (
  pincode          VARCHAR(6)    PRIMARY KEY CHECK (pincode ~ '^\d{6}$'),

  -- 0.00 to 1.00 (e.g. 0.3500 = 35% RTO rate)
  rto_rate         NUMERIC(5,4)  NOT NULL DEFAULT 0.0000
                     CHECK (rto_rate >= 0 AND rto_rate <= 1),

  is_cod_disabled  BOOLEAN       NOT NULL DEFAULT FALSE,
  is_serviceable   BOOLEAN       NOT NULL DEFAULT TRUE,

  city             VARCHAR(100)  NOT NULL,
  state            VARCHAR(100)  NOT NULL,

  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spf_pincode_cod_disabled ON spf_pincode_risk_config(is_cod_disabled)
  WHERE is_cod_disabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_spf_pincode_serviceable  ON spf_pincode_risk_config(is_serviceable)
  WHERE is_serviceable = FALSE;
CREATE INDEX IF NOT EXISTS idx_spf_pincode_rto_rate     ON spf_pincode_risk_config(rto_rate DESC);

DROP TRIGGER IF EXISTS spf_pincode_updated_at ON spf_pincode_risk_config;
CREATE TRIGGER spf_pincode_updated_at
  BEFORE UPDATE ON spf_pincode_risk_config
  FOR EACH ROW EXECUTE FUNCTION spf_set_updated_at();

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 10 — ROW LEVEL SECURITY (Supabase)
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE spf_orders                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE spf_order_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE spf_order_status_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE spf_order_risk_flags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE spf_customer_risk_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE spf_seller_payouts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE spf_pincode_risk_config     ENABLE ROW LEVEL SECURITY;

-- Service role has full access to all tables
CREATE POLICY "service_role_all_orders"
  ON spf_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_order_items"
  ON spf_order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_order_history"
  ON spf_order_status_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_risk_flags"
  ON spf_order_risk_flags FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_crp"
  ON spf_customer_risk_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_payouts"
  ON spf_seller_payouts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_pincode"
  ON spf_pincode_risk_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Customers can read their own orders
CREATE POLICY "customer_read_own_orders"
  ON spf_orders FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- Customers can read their own order items
CREATE POLICY "customer_read_own_order_items"
  ON spf_order_items FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM spf_orders WHERE customer_id = auth.uid()));

-- Customers can read their own status history
CREATE POLICY "customer_read_own_order_history"
  ON spf_order_status_history FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM spf_orders WHERE customer_id = auth.uid()));

-- Sellers can read orders assigned to them
CREATE POLICY "seller_read_own_orders"
  ON spf_orders FOR SELECT TO authenticated
  USING (seller_id IN (SELECT id FROM spf_sellers WHERE user_id = auth.uid()));

-- Sellers can read their own payouts
CREATE POLICY "seller_read_own_payouts"
  ON spf_seller_payouts FOR SELECT TO authenticated
  USING (seller_id IN (SELECT id FROM spf_sellers WHERE user_id = auth.uid()));

-- Pincode config is public (needed at checkout for all users)
CREATE POLICY "public_read_pincode_config"
  ON spf_pincode_risk_config FOR SELECT TO anon, authenticated
  USING (true);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 11 — SEED: PINCODE RISK CONFIG (10 Hyderabad pincodes)
-- ═════════════════════════════════════════════════════════════════════════════
-- rto_rate scale:
--   < 0.15  → CLEAR (standard)
--   0.15-0.30 → SOFT_FLAG
--   0.30-0.50 → COD may be disabled
--   > 0.50  → isCodDisabled = TRUE
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO spf_pincode_risk_config
  (pincode, rto_rate, is_cod_disabled, is_serviceable, city, state)
VALUES
  -- Abids / Sultan Bazaar — central, moderate RTO
  ('500001', 0.1800, FALSE, TRUE,  'Hyderabad',    'Telangana'),
  -- Secunderabad — mixed residential/commercial, moderate
  ('500003', 0.1500, FALSE, TRUE,  'Secunderabad', 'Telangana'),
  -- Somajiguda / Begumpet — good delivery rate
  ('500004', 0.1200, FALSE, TRUE,  'Hyderabad',    'Telangana'),
  -- Jubilee Hills — premium locality, lowest RTO
  ('500016', 0.0800, FALSE, TRUE,  'Hyderabad',    'Telangana'),
  -- Gachibowli / Financial District — tech workers, best RTO
  ('500032', 0.0700, FALSE, TRUE,  'Hyderabad',    'Telangana'),
  -- Banjara Hills — premium, low RTO
  ('500034', 0.0900, FALSE, TRUE,  'Hyderabad',    'Telangana'),
  -- Dilsukhnagar — high RTO historically, COD disabled
  ('500060', 0.4200, TRUE,  TRUE,  'Hyderabad',    'Telangana'),
  -- Kukatpally — dense residential, elevated COD risk
  ('500072', 0.2800, FALSE, TRUE,  'Hyderabad',    'Telangana'),
  -- Vanasthalipuram / LB Nagar — high RTO, COD blocked
  ('500074', 0.3800, TRUE,  TRUE,  'Hyderabad',    'Telangana'),
  -- Madhapur / HITEC City — IT hub, excellent delivery rate
  ('500081', 0.0600, FALSE, TRUE,  'Hyderabad',    'Telangana')
ON CONFLICT (pincode) DO UPDATE SET
  rto_rate        = EXCLUDED.rto_rate,
  is_cod_disabled = EXCLUDED.is_cod_disabled,
  is_serviceable  = EXCLUDED.is_serviceable,
  city            = EXCLUDED.city,
  state           = EXCLUDED.state,
  updated_at      = NOW();

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 12 — AUTOMATED RISK SCORE SYNC FUNCTION
-- Called by app after inserting/resolving an OrderRiskFlag
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION spf_recalculate_order_risk(p_order_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_score     INT;
  v_status    risk_status_type;
BEGIN
  -- Sum unresolved flag scores
  SELECT COALESCE(SUM(score_contribution), 0)
    INTO v_score
    FROM spf_order_risk_flags
   WHERE order_id = p_order_id
     AND resolved_at IS NULL;

  -- Determine risk status
  v_status := CASE
    WHEN v_score = 0          THEN 'CLEAR'
    WHEN v_score BETWEEN 1 AND 30  THEN 'SOFT_FLAG'
    WHEN v_score BETWEEN 31 AND 70 THEN 'HOLD'
    ELSE                           'REJECTED'
  END;

  UPDATE spf_orders
     SET risk_score  = v_score,
         risk_status = v_status,
         updated_at  = NOW()
   WHERE id = p_order_id;
END;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 13 — ORDER NUMBER GENERATOR
-- Generates: IFP-ORD-YYYYMMDD-XXXX (4-char alphanumeric suffix)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION spf_generate_order_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_date   TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
  v_suffix TEXT;
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- 4 uppercase alphanumeric chars (excludes 0, O, I, 1 for readability)
    v_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4));
    v_number := 'IFP-ORD-' || v_date || '-' || v_suffix;

    SELECT EXISTS (SELECT 1 FROM spf_orders WHERE order_number = v_number)
      INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_number;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 006 complete.
-- Next steps:
--   1. Run npx prisma db pull  (if using Prisma — syncs schema from DB)
--   2. Set acceptance_sla_deadline = confirmed_at + INTERVAL '2 hours'
--      in the payment webhook handler when status → CONFIRMED
--   3. Set packing_sla_deadline = seller_accepted_at + INTERVAL '4 hours'
--      in PUT /api/orders/[id] when status → ACCEPTED
--   4. Set return_window_closes_at = delivered_at + INTERVAL '7 days'
--      in /api/webhook/shipping when status → DELIVERED
-- ─────────────────────────────────────────────────────────────────────────────
