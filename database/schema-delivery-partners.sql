-- ============================================
-- DELIVERY PARTNER MANAGEMENT SYSTEM
-- ============================================

-- Table 1: Delivery Partners
CREATE TABLE IF NOT EXISTS spf_delivery_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal Information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  mobile VARCHAR(15) NOT NULL UNIQUE,

  -- Documents
  vehicle_number VARCHAR(50),
  vehicle_type VARCHAR(50), -- 'bike', 'car', 'van', 'truck'
  license_number VARCHAR(50),
  aadhar_number VARCHAR(12),
  pan_number VARCHAR(10),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(6),

  -- Service Areas (JSON array of pincodes they can deliver to)
  service_pincodes JSONB DEFAULT '[]',

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval')),
  availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline')),

  -- Performance Metrics
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES spf_users(id),

  -- Login credentials (if they need app access)
  password_hash VARCHAR(255)
);

-- Table 2: Order Delivery Tracking
CREATE TABLE IF NOT EXISTS spf_order_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  order_id UUID NOT NULL REFERENCES spf_payment_orders(id) ON DELETE CASCADE,
  delivery_partner_id UUID REFERENCES spf_delivery_partners(id),
  assigned_by UUID REFERENCES spf_users(id), -- Admin who assigned

  -- Delivery Status
  status VARCHAR(30) DEFAULT 'pending_assignment' CHECK (status IN (
    'pending_assignment',
    'assigned',
    'accepted',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'failed',
    'returned',
    'cancelled'
  )),

  -- Timestamps for status changes
  assigned_at TIMESTAMP,
  accepted_at TIMESTAMP,
  picked_up_at TIMESTAMP,
  in_transit_at TIMESTAMP,
  out_for_delivery_at TIMESTAMP,
  delivered_at TIMESTAMP,

  -- Delivery Details
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  delivery_notes TEXT,
  delivery_proof_photo VARCHAR(500), -- Cloudinary URL

  -- Failed Delivery
  failed_reason TEXT,
  failed_attempts INTEGER DEFAULT 0,

  -- Customer Feedback
  customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
  customer_feedback TEXT,

  -- Location Tracking (optional)
  current_location JSONB, -- {lat, lng, timestamp}
  tracking_history JSONB DEFAULT '[]', -- Array of location updates

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 3: Delivery Status History (Audit Trail)
CREATE TABLE IF NOT EXISTS spf_delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_delivery_id UUID NOT NULL REFERENCES spf_order_deliveries(id) ON DELETE CASCADE,

  previous_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,

  changed_by UUID REFERENCES spf_users(id),
  changed_by_partner UUID REFERENCES spf_delivery_partners(id),

  notes TEXT,
  location JSONB, -- {lat, lng} at time of status change

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_delivery_partners_mobile ON spf_delivery_partners(mobile);
CREATE INDEX idx_delivery_partners_status ON spf_delivery_partners(status, availability_status);
CREATE INDEX idx_delivery_partners_pincode ON spf_delivery_partners USING GIN(service_pincodes);

CREATE INDEX idx_order_deliveries_order ON spf_order_deliveries(order_id);
CREATE INDEX idx_order_deliveries_partner ON spf_order_deliveries(delivery_partner_id);
CREATE INDEX idx_order_deliveries_status ON spf_order_deliveries(status);
CREATE INDEX idx_order_deliveries_date ON spf_order_deliveries(estimated_delivery_date, actual_delivery_date);

CREATE INDEX idx_delivery_history_order ON spf_delivery_status_history(order_delivery_id);
CREATE INDEX idx_delivery_history_created ON spf_delivery_status_history(created_at DESC);

-- Add delivery tracking to existing orders table
ALTER TABLE spf_payment_orders
ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(30) DEFAULT 'pending_assignment',
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(50) UNIQUE;

-- Function to auto-generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  new_tracking_number VARCHAR(50);
BEGIN
  new_tracking_number := 'SFP' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN new_tracking_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate tracking number when order delivery is created
CREATE OR REPLACE FUNCTION set_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NULL THEN
    NEW.tracking_number := generate_tracking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_tracking_number
BEFORE INSERT ON spf_payment_orders
FOR EACH ROW
EXECUTE FUNCTION set_tracking_number();

-- Comments for documentation
COMMENT ON TABLE spf_delivery_partners IS 'Delivery partners who fulfill orders';
COMMENT ON TABLE spf_order_deliveries IS 'Links orders to delivery partners with tracking';
COMMENT ON TABLE spf_delivery_status_history IS 'Audit trail of all delivery status changes';
COMMENT ON COLUMN spf_delivery_partners.service_pincodes IS 'JSON array of pincodes this partner can deliver to';
COMMENT ON COLUMN spf_order_deliveries.status IS 'Current delivery status of the order';
COMMENT ON COLUMN spf_order_deliveries.tracking_history IS 'JSON array of location updates with timestamps';
