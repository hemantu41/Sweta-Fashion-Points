-- Fast delivery: packing deadline (30 min), SLA deadline (4 hr), batch delivery
-- Run this in Supabase SQL Editor

-- 1. Packing and SLA tracking columns on orders
ALTER TABLE spf_payment_orders
  ADD COLUMN IF NOT EXISTS packing_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_deadline     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS packed_at        TIMESTAMPTZ;

-- 2. 30-minute status-update tracking + batch grouping on delivery records
ALTER TABLE spf_order_deliveries
  ADD COLUMN IF NOT EXISTS last_status_update_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS batch_id              UUID;

-- 3. Batch delivery table (groups nearby orders assigned to the same partner)
CREATE TABLE IF NOT EXISTS spf_delivery_batches (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID    REFERENCES spf_delivery_partners(id) ON DELETE CASCADE,
  status      VARCHAR(20)  NOT NULL DEFAULT 'active',  -- active | completed | cancelled
  order_ids   JSONB   NOT NULL DEFAULT '[]',            -- array of order_delivery IDs in this batch
  route_order JSONB            DEFAULT '[]',            -- optimised delivery sequence (order_delivery IDs)
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PostgreSQL trigger: auto-set packing_deadline and sla_deadline when payment captured
CREATE OR REPLACE FUNCTION set_delivery_deadlines()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'captured' AND (OLD.status IS NULL OR OLD.status != 'captured') THEN
    NEW.packing_deadline = NOW() + INTERVAL '30 minutes';
    NEW.sla_deadline     = NOW() + INTERVAL '4 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_delivery_deadlines ON spf_payment_orders;
CREATE TRIGGER trigger_set_delivery_deadlines
  BEFORE UPDATE ON spf_payment_orders
  FOR EACH ROW EXECUTE FUNCTION set_delivery_deadlines();
