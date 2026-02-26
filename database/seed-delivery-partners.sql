-- ============================================
-- SEED DELIVERY PARTNERS
-- ============================================
-- Run this to create sample delivery partners for testing

-- Partner 1: Bike Delivery (Fast, Local Areas)
INSERT INTO spf_delivery_partners (
  name,
  mobile,
  email,
  vehicle_type,
  vehicle_number,
  license_number,
  status,
  availability_status,
  service_pincodes,
  address_line1,
  city,
  state,
  pincode
) VALUES (
  'Rajesh Kumar',
  '9876543210',
  'rajesh.delivery@example.com',
  'bike',
  'BR01AB1234',
  'BR0120230001234',
  'active',
  'available',
  '["824219", "823001", "824101", "824201", "824001"]'::jsonb,
  'Near Railway Station',
  'Gaya',
  'Bihar',
  '824219'
);

-- Partner 2: Car Delivery (Medium Range)
INSERT INTO spf_delivery_partners (
  name,
  mobile,
  email,
  vehicle_type,
  vehicle_number,
  license_number,
  status,
  availability_status,
  service_pincodes,
  address_line1,
  city,
  state,
  pincode
) VALUES (
  'Suresh Yadav',
  '9876543211',
  'suresh.delivery@example.com',
  'car',
  'BR02CD5678',
  'BR0120230005678',
  'active',
  'available',
  '["824219", "824201", "824001", "823001", "824101", "824301"]'::jsonb,
  'Main Market Road',
  'Gaya',
  'Bihar',
  '824219'
);

-- Partner 3: Bike Delivery (Another area)
INSERT INTO spf_delivery_partners (
  name,
  mobile,
  email,
  vehicle_type,
  vehicle_number,
  license_number,
  status,
  availability_status,
  service_pincodes,
  address_line1,
  city,
  state,
  pincode
) VALUES (
  'Amit Singh',
  '9876543212',
  'amit.delivery@example.com',
  'bike',
  'BR03EF9012',
  'BR0120230009012',
  'active',
  'available',
  '["824219", "824101", "824001"]'::jsonb,
  'Bus Stand Area',
  'Gaya',
  'Bihar',
  '824219'
);

-- Partner 4: Van Delivery (Large Orders)
INSERT INTO spf_delivery_partners (
  name,
  mobile,
  email,
  vehicle_type,
  vehicle_number,
  license_number,
  status,
  availability_status,
  service_pincodes,
  address_line1,
  city,
  state,
  pincode
) VALUES (
  'Ramesh Sharma',
  '9876543213',
  'ramesh.delivery@example.com',
  'van',
  'BR04GH3456',
  'BR0120230003456',
  'active',
  'available',
  '["824219", "824201", "824001", "823001", "824101", "824301", "824401"]'::jsonb,
  'Industrial Area',
  'Gaya',
  'Bihar',
  '824219'
);

-- Partner 5: Bike Delivery (Busy Status - for testing)
INSERT INTO spf_delivery_partners (
  name,
  mobile,
  email,
  vehicle_type,
  vehicle_number,
  license_number,
  status,
  availability_status,
  service_pincodes,
  address_line1,
  city,
  state,
  pincode
) VALUES (
  'Vikash Kumar',
  '9876543214',
  'vikash.delivery@example.com',
  'bike',
  'BR05IJ7890',
  'BR0120230007890',
  'active',
  'busy',  -- This one is busy, won't be selected for auto-assign
  '["824219", "824101"]'::jsonb,
  'College Road',
  'Gaya',
  'Bihar',
  '824219'
);

-- Verify the partners were created
SELECT
  id,
  name,
  mobile,
  vehicle_type,
  status,
  availability_status,
  service_pincodes
FROM spf_delivery_partners
ORDER BY created_at DESC;

-- Show some useful info
SELECT
  'Total Partners Created' as info,
  COUNT(*) as count
FROM spf_delivery_partners
UNION ALL
SELECT
  'Available Partners',
  COUNT(*)
FROM spf_delivery_partners
WHERE status = 'active' AND availability_status = 'available';
