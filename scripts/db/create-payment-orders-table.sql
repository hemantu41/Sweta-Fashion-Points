-- Create payment orders table for tracking Razorpay payments
-- This table stores all payment transactions and their statuses

CREATE TABLE IF NOT EXISTS spf_payment_orders (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Order Information
  order_number VARCHAR(50) UNIQUE NOT NULL,  -- SFP-YYYYMMDD-XXXXXX
  user_id UUID REFERENCES spf_users(id) NOT NULL,

  -- Razorpay Details
  razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,  -- order_xxxxx from Razorpay
  razorpay_payment_id VARCHAR(100),  -- pay_xxxxx from Razorpay
  razorpay_signature VARCHAR(255),  -- Payment signature for verification

  -- Payment Details
  amount INTEGER NOT NULL,  -- Amount in paise (₹100 = 10000 paise)
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50),  -- 'upi', 'card', 'netbanking', etc.
  payment_method_details JSONB,  -- Additional payment method info

  -- Order Items
  items JSONB NOT NULL,  -- Array of order items

  -- Delivery Address
  address_id UUID REFERENCES spf_addresses(id),
  delivery_address JSONB NOT NULL,  -- Snapshot of address at time of order

  -- Payment Status
  status VARCHAR(20) DEFAULT 'created' NOT NULL,
  -- Possible values: 'created', 'pending', 'authorized', 'captured', 'failed', 'refunded'

  -- Additional Info
  notes JSONB,  -- Any additional notes or metadata
  error_code VARCHAR(50),  -- Error code if payment failed
  error_description TEXT,  -- Error description

  -- UPI Details (if applicable)
  upi_id VARCHAR(100),  -- Saved UPI ID used for payment

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  payment_attempted_at TIMESTAMP,
  payment_completed_at TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON spf_payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON spf_payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_number ON spf_payment_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_payment_orders_razorpay_order_id ON spf_payment_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON spf_payment_orders(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER payment_orders_updated_at
BEFORE UPDATE ON spf_payment_orders
FOR EACH ROW
EXECUTE FUNCTION update_payment_orders_updated_at();

-- Grant permissions (adjust as needed for your security setup)
-- ALTER TABLE spf_payment_orders ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE spf_payment_orders IS 'Stores payment order information and Razorpay transaction details';
COMMENT ON COLUMN spf_payment_orders.amount IS 'Amount in paise (₹1 = 100 paise)';
COMMENT ON COLUMN spf_payment_orders.status IS 'Payment status: created, pending, authorized, captured, failed, refunded';
