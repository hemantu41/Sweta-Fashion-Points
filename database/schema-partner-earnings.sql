-- ============================================
-- DELIVERY PARTNER EARNINGS TRACKING
-- ============================================

-- Table: Partner Earnings
CREATE TABLE IF NOT EXISTS spf_delivery_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  delivery_partner_id UUID NOT NULL REFERENCES spf_delivery_partners(id) ON DELETE CASCADE,
  order_delivery_id UUID NOT NULL REFERENCES spf_order_deliveries(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES spf_payment_orders(id) ON DELETE CASCADE,

  -- Earning Details
  delivery_charge DECIMAL(10,2) NOT NULL, -- Amount earned for this delivery
  distance_km DECIMAL(10,2), -- Distance traveled (optional)
  bonus_amount DECIMAL(10,2) DEFAULT 0.00, -- Any bonus/incentive
  penalty_amount DECIMAL(10,2) DEFAULT 0.00, -- Deductions for late/failed delivery
  total_earning DECIMAL(10,2) NOT NULL, -- delivery_charge + bonus - penalty

  -- Payment Status
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'on_hold')),
  payment_date DATE,
  payment_reference VARCHAR(100), -- Transaction ID or reference
  payment_method VARCHAR(50), -- 'bank_transfer', 'upi', 'cash', etc.

  -- Delivery Details (for reference)
  delivery_date DATE,
  delivery_status VARCHAR(30), -- Copy of order delivery status

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  processed_by UUID REFERENCES spf_users(id) -- Admin who processed payment
);

-- Table: Partner Payment Batches (for bulk payments)
CREATE TABLE IF NOT EXISTS spf_partner_payment_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  batch_number VARCHAR(50) UNIQUE NOT NULL,
  delivery_partner_id UUID NOT NULL REFERENCES spf_delivery_partners(id),

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Summary
  total_deliveries INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  total_bonuses DECIMAL(10,2) DEFAULT 0.00,
  total_penalties DECIMAL(10,2) DEFAULT 0.00,
  net_amount DECIMAL(10,2) DEFAULT 0.00,

  -- Payment
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  payment_date DATE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),

  -- Processing
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  paid_at TIMESTAMP,
  approved_by UUID REFERENCES spf_users(id),
  paid_by UUID REFERENCES spf_users(id),

  notes TEXT
);

-- Link earnings to payment batches
ALTER TABLE spf_delivery_earnings
ADD COLUMN IF NOT EXISTS payment_batch_id UUID REFERENCES spf_partner_payment_batches(id);

-- Indexes
CREATE INDEX idx_earnings_partner ON spf_delivery_earnings(delivery_partner_id);
CREATE INDEX idx_earnings_order_delivery ON spf_delivery_earnings(order_delivery_id);
CREATE INDEX idx_earnings_payment_status ON spf_delivery_earnings(payment_status);
CREATE INDEX idx_earnings_delivery_date ON spf_delivery_earnings(delivery_date);

CREATE INDEX idx_payment_batches_partner ON spf_partner_payment_batches(delivery_partner_id);
CREATE INDEX idx_payment_batches_status ON spf_partner_payment_batches(status);
CREATE INDEX idx_payment_batches_period ON spf_partner_payment_batches(period_start, period_end);

-- Function to auto-create earning record when delivery is completed
CREATE OR REPLACE FUNCTION create_earning_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  base_charge DECIMAL(10,2);
  partner_id UUID;
BEGIN
  -- Only create earning when status changes to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN

    -- Get partner ID
    partner_id := NEW.delivery_partner_id;

    -- Calculate base delivery charge (you can customize this logic)
    -- Example: ₹50 base + ₹5 per km + 2% of order value
    base_charge := 50.00; -- Base charge

    -- Add distance charge if available
    IF NEW.distance_km IS NOT NULL THEN
      base_charge := base_charge + (NEW.distance_km * 5.00);
    END IF;

    -- Insert earning record
    INSERT INTO spf_delivery_earnings (
      delivery_partner_id,
      order_delivery_id,
      order_id,
      delivery_charge,
      distance_km,
      total_earning,
      delivery_date,
      delivery_status
    ) VALUES (
      partner_id,
      NEW.id,
      NEW.order_id,
      base_charge,
      NEW.distance_km,
      base_charge, -- Initially no bonus or penalty
      CURRENT_DATE,
      'delivered'
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create earnings
CREATE TRIGGER trigger_create_earning_on_delivery
AFTER INSERT OR UPDATE ON spf_order_deliveries
FOR EACH ROW
EXECUTE FUNCTION create_earning_on_delivery();

-- Function to generate batch number
CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS VARCHAR(50) AS $$
BEGIN
  RETURN 'BATCH' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE spf_delivery_earnings IS 'Individual earning records for each delivery';
COMMENT ON TABLE spf_partner_payment_batches IS 'Bulk payment batches for partners';
COMMENT ON COLUMN spf_delivery_earnings.total_earning IS 'Final amount = delivery_charge + bonus - penalty';
COMMENT ON COLUMN spf_delivery_earnings.payment_status IS 'Status of payment for this earning';

-- Default earning rates configuration (optional)
CREATE TABLE IF NOT EXISTS spf_delivery_earning_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rate Configuration
  rate_name VARCHAR(100) NOT NULL,
  base_charge DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  per_km_charge DECIMAL(10,2) DEFAULT 5.00,
  per_order_percentage DECIMAL(5,2) DEFAULT 0.00, -- % of order value

  -- Distance-based tiers
  distance_tiers JSONB DEFAULT '[]', -- [{"from": 0, "to": 5, "rate": 50}, {"from": 5, "to": 10, "rate": 75}]

  -- Time-based multipliers
  weekend_multiplier DECIMAL(3,2) DEFAULT 1.00,
  night_multiplier DECIMAL(3,2) DEFAULT 1.00, -- For deliveries after 8 PM

  -- Bonuses
  on_time_bonus DECIMAL(10,2) DEFAULT 10.00,
  high_rating_bonus DECIMAL(10,2) DEFAULT 5.00, -- For 5-star ratings

  -- Status
  is_active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES spf_users(id)
);

COMMENT ON TABLE spf_delivery_earning_rates IS 'Configurable earning rates for delivery partners';
