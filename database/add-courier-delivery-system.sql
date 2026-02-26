-- Add Courier Delivery System
-- This extends the existing delivery partner system to support third-party courier deliveries

-- Add courier delivery fields to spf_order_deliveries table
ALTER TABLE spf_order_deliveries
ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(20) DEFAULT 'partner' CHECK (delivery_type IN ('partner', 'courier')),
ADD COLUMN IF NOT EXISTS courier_company VARCHAR(100),
ADD COLUMN IF NOT EXISTS courier_tracking_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS courier_tracking_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS courier_booking_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS courier_expected_delivery_date DATE,
ADD COLUMN IF NOT EXISTS courier_notes TEXT;

-- Create index for delivery type filtering
CREATE INDEX IF NOT EXISTS idx_order_deliveries_delivery_type
  ON spf_order_deliveries(delivery_type);

-- Create index for courier tracking number lookup
CREATE INDEX IF NOT EXISTS idx_order_deliveries_courier_tracking
  ON spf_order_deliveries(courier_tracking_number);

-- Update check constraint on delivery_partner_id to allow NULL for courier deliveries
-- (delivery_partner_id can be NULL if delivery_type is 'courier')

-- Comments for documentation
COMMENT ON COLUMN spf_order_deliveries.delivery_type IS 'Type of delivery: partner (local delivery partner) or courier (third-party courier service)';
COMMENT ON COLUMN spf_order_deliveries.courier_company IS 'Name of courier company (e.g., BlueDart, DTDC, India Post, Delhivery, etc.)';
COMMENT ON COLUMN spf_order_deliveries.courier_tracking_number IS 'AWB number or tracking number provided by courier company';
COMMENT ON COLUMN spf_order_deliveries.courier_tracking_url IS 'Direct URL to track the courier shipment';
COMMENT ON COLUMN spf_order_deliveries.courier_booking_date IS 'Date when the shipment was booked with courier';
COMMENT ON COLUMN spf_order_deliveries.courier_expected_delivery_date IS 'Expected delivery date provided by courier company';
COMMENT ON COLUMN spf_order_deliveries.courier_notes IS 'Additional notes about courier delivery';

-- Sample data update (set existing records to 'partner' type)
UPDATE spf_order_deliveries
SET delivery_type = 'partner'
WHERE delivery_type IS NULL OR delivery_type = 'partner';
