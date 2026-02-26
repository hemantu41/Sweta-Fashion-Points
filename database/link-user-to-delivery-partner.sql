-- ============================================
-- LINK USER TO DELIVERY PARTNER
-- ============================================
-- This script helps you link an existing user account to a delivery partner
-- so they can access the delivery partner dashboard from the navbar

-- Step 1: First, find the user you want to make a delivery partner
SELECT
  id as user_id,
  name,
  email,
  phone
FROM spf_users
WHERE email = 'your-email@example.com';  -- Replace with actual email

-- Step 2: Find or create the delivery partner
SELECT
  id as partner_id,
  name,
  mobile,
  status,
  availability_status
FROM spf_delivery_partners
WHERE mobile = '9876543210';  -- Replace with actual mobile number

-- Step 3: Add columns to spf_users if they don't exist
ALTER TABLE spf_users
ADD COLUMN IF NOT EXISTS is_delivery_partner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_partner_id UUID REFERENCES spf_delivery_partners(id),
ADD COLUMN IF NOT EXISTS delivery_partner_status VARCHAR(20);

-- Step 4: Link the user to delivery partner
-- IMPORTANT: Replace these IDs with actual values from steps 1 and 2
UPDATE spf_users
SET
  is_delivery_partner = true,
  delivery_partner_id = 'PASTE_PARTNER_ID_HERE',  -- From step 2
  delivery_partner_status = 'active'
WHERE id = 'PASTE_USER_ID_HERE';  -- From step 1

-- Step 5: Verify the link
SELECT
  u.id,
  u.name as user_name,
  u.email,
  u.is_delivery_partner,
  dp.id as partner_id,
  dp.name as partner_name,
  dp.mobile,
  dp.status,
  dp.availability_status
FROM spf_users u
LEFT JOIN spf_delivery_partners dp ON u.delivery_partner_id = dp.id
WHERE u.is_delivery_partner = true;

-- ============================================
-- QUICK EXAMPLE: Link Rajesh Kumar's User Account
-- ============================================

-- If you want to create a user account for Rajesh Kumar (delivery partner):

-- Option 1: If user already exists, just link them
-- UPDATE spf_users
-- SET
--   is_delivery_partner = true,
--   delivery_partner_id = (SELECT id FROM spf_delivery_partners WHERE mobile = '9876543210'),
--   delivery_partner_status = 'active'
-- WHERE email = 'rajesh@example.com';

-- Option 2: Create new user for Rajesh (if doesn't exist)
-- INSERT INTO spf_users (name, email, phone, password_hash, is_delivery_partner, delivery_partner_id, delivery_partner_status)
-- VALUES (
--   'Rajesh Kumar',
--   'rajesh.delivery@example.com',
--   '9876543210',
--   '$2a$10$YourHashedPasswordHere',  -- Use bcrypt to generate
--   true,
--   (SELECT id FROM spf_delivery_partners WHERE mobile = '9876543210'),
--   'active'
-- );

-- ============================================
-- UNLINK A USER FROM DELIVERY PARTNER
-- ============================================

-- To remove delivery partner access from a user:
-- UPDATE spf_users
-- SET
--   is_delivery_partner = false,
--   delivery_partner_id = NULL,
--   delivery_partner_status = NULL
-- WHERE email = 'user@example.com';
