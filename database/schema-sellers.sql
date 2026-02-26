-- ============================================
-- SELLER MANAGEMENT SYSTEM
-- Multi-vendor marketplace database schema
-- ============================================

-- Table 1: Sellers/Vendors Table
CREATE TABLE IF NOT EXISTS spf_sellers (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to User Account
  user_id UUID UNIQUE NOT NULL REFERENCES spf_users(id) ON DELETE CASCADE,

  -- Business Information
  business_name VARCHAR(255) NOT NULL,
  business_name_hi VARCHAR(255),
  gstin VARCHAR(15), -- GST Identification Number (optional for small sellers)
  pan VARCHAR(10), -- PAN card number

  -- Contact Information
  business_email VARCHAR(255),
  business_phone VARCHAR(15),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),

  -- Bank Details (for payments)
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_ifsc VARCHAR(11),
  bank_name VARCHAR(255),

  -- Status & Approval
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_by UUID REFERENCES spf_users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,

  -- Commission & Settings
  commission_percentage DECIMAL(5,2) DEFAULT 10.00, -- Platform commission (e.g., 10%)
  is_active BOOLEAN DEFAULT true,

  -- Verification Documents (store Cloudinary IDs)
  documents JSONB DEFAULT '[]', -- [{type: 'gst', url: '...'}, {type: 'pan', url: '...'}]

  -- Metadata
  notes TEXT, -- Admin notes about this seller
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: Update spf_users to add user_type
ALTER TABLE spf_users
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'customer'
CHECK (user_type IN ('customer', 'seller', 'admin'));

-- For existing users, set admins
UPDATE spf_users SET user_type = 'admin' WHERE is_admin = true;

-- Table 3: Update spf_productdetails to track seller
ALTER TABLE spf_productdetails
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES spf_sellers(id);

-- For existing products, set them to first seller or admin
-- (Run after creating first seller account)

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON spf_sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON spf_sellers(status);
CREATE INDEX IF NOT EXISTS idx_sellers_is_active ON spf_sellers(is_active);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON spf_productdetails(seller_id);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON spf_users(user_type);

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_sellers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sellers_updated_at
BEFORE UPDATE ON spf_sellers
FOR EACH ROW
EXECUTE FUNCTION update_sellers_updated_at();

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Get all pending seller applications
-- SELECT * FROM spf_sellers WHERE status = 'pending' ORDER BY created_at DESC;

-- Get seller with user details
-- SELECT s.*, u.name, u.email, u.phone_number
-- FROM spf_sellers s
-- JOIN spf_users u ON s.user_id = u.id
-- WHERE s.id = 'seller-uuid';

-- Get products by seller
-- SELECT * FROM spf_productdetails WHERE seller_id = 'seller-uuid' AND is_active = true;

-- Get seller sales stats
-- SELECT
--   s.business_name,
--   COUNT(p.id) as total_products,
--   SUM(CASE WHEN p.is_active THEN 1 ELSE 0 END) as active_products,
--   SUM(p.stock_quantity) as total_stock
-- FROM spf_sellers s
-- LEFT JOIN spf_productdetails p ON s.id = p.seller_id
-- WHERE s.status = 'approved'
-- GROUP BY s.id, s.business_name;
