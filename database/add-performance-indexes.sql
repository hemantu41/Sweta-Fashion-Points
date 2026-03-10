-- Performance indexes for scale: 100 sellers × 1,000 products
-- Run this in Supabase SQL Editor before going live

-- Products table — filters used on every page load
CREATE INDEX IF NOT EXISTS idx_products_is_active        ON spf_productdetails(is_active);
CREATE INDEX IF NOT EXISTS idx_products_approval_status  ON spf_productdetails(approval_status);
CREATE INDEX IF NOT EXISTS idx_products_category         ON spf_productdetails(category);
CREATE INDEX IF NOT EXISTS idx_products_seller_id        ON spf_productdetails(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at       ON spf_productdetails(deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller   ON spf_productdetails(is_best_seller);
CREATE INDEX IF NOT EXISTS idx_products_is_new_arrival   ON spf_productdetails(is_new_arrival);
CREATE INDEX IF NOT EXISTS idx_products_created_at       ON spf_productdetails(created_at DESC);

-- Composite index for the most common storefront query: active + approved products by category
CREATE INDEX IF NOT EXISTS idx_products_active_approved_category
  ON spf_productdetails(is_active, approval_status, category)
  WHERE deleted_at IS NULL;

-- Orders table
CREATE INDEX IF NOT EXISTS idx_orders_status      ON spf_payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON spf_payment_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id     ON spf_payment_orders(user_id);

-- Delivery table
CREATE INDEX IF NOT EXISTS idx_deliveries_partner_id  ON spf_order_deliveries(partner_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status      ON spf_order_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id    ON spf_order_deliveries(order_id);

-- Sellers table
CREATE INDEX IF NOT EXISTS idx_sellers_status   ON spf_sellers(status);
CREATE INDEX IF NOT EXISTS idx_sellers_user_id  ON spf_sellers(user_id);

-- Delivery partners table
CREATE INDEX IF NOT EXISTS idx_delivery_partners_status              ON spf_delivery_partners(status);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_availability_status ON spf_delivery_partners(availability_status);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_user_id             ON spf_delivery_partners(user_id);
