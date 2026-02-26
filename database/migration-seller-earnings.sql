-- Migration: Seller Earnings Tracking
-- Description: Creates spf_seller_earnings table for commission-based earnings tracking
-- Date: February 2024

-- Create seller earnings table
CREATE TABLE IF NOT EXISTS spf_seller_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES spf_sellers(id),
  order_id UUID NOT NULL REFERENCES spf_payment_orders(id),
  product_id UUID REFERENCES spf_productdetails(id),

  -- Order item details
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_item_price DECIMAL(10,2) NOT NULL,

  -- Commission calculation
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  seller_earning DECIMAL(10,2) NOT NULL,

  -- Payment tracking
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed')),
  payment_date DATE,
  payment_reference VARCHAR(100),
  payment_notes TEXT,

  -- Metadata
  order_date TIMESTAMP WITH TIME ZONE NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one earning record per order item
  UNIQUE(order_id, product_id, item_name)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller
  ON spf_seller_earnings(seller_id);

CREATE INDEX IF NOT EXISTS idx_seller_earnings_order
  ON spf_seller_earnings(order_id);

CREATE INDEX IF NOT EXISTS idx_seller_earnings_payment_status
  ON spf_seller_earnings(payment_status);

CREATE INDEX IF NOT EXISTS idx_seller_earnings_order_date
  ON spf_seller_earnings(order_date DESC);

-- Add table comment for documentation
COMMENT ON TABLE spf_seller_earnings IS 'Tracks seller earnings per order item with commission calculation. Created automatically when payment is completed.';
COMMENT ON COLUMN spf_seller_earnings.total_item_price IS 'Total price for this item (unit_price * quantity)';
COMMENT ON COLUMN spf_seller_earnings.commission_amount IS 'Platform commission (total_item_price * commission_percentage / 100)';
COMMENT ON COLUMN spf_seller_earnings.seller_earning IS 'Seller revenue after commission (total_item_price - commission_amount)';
