-- Seller Verification OTPs Table
-- Stores OTPs for verifying business email and phone during seller registration

CREATE TABLE IF NOT EXISTS seller_verification_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'phone')),
  value VARCHAR(255) NOT NULL, -- email address or phone number
  otp VARCHAR(6) NOT NULL,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for quick OTP lookup
CREATE INDEX IF NOT EXISTS idx_seller_verification_otps_lookup
ON seller_verification_otps(type, value, otp, is_used, expires_at);

-- Index for cleanup of old OTPs
CREATE INDEX IF NOT EXISTS idx_seller_verification_otps_expires
ON seller_verification_otps(expires_at);

-- Add verification status to sellers table
ALTER TABLE spf_sellers
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;

COMMENT ON TABLE seller_verification_otps IS 'Stores OTPs for verifying business email and phone during seller registration';
COMMENT ON COLUMN seller_verification_otps.type IS 'Type of verification: email or phone';
COMMENT ON COLUMN seller_verification_otps.value IS 'Email address or phone number being verified';
COMMENT ON COLUMN seller_verification_otps.otp IS '6-digit OTP code';
COMMENT ON COLUMN seller_verification_otps.is_used IS 'Whether this OTP has been used';
COMMENT ON COLUMN seller_verification_otps.expires_at IS 'When this OTP expires (10 minutes from creation)';
