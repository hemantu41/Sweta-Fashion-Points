-- Seed data: 10 sample reviews for Insta Fashion Points
-- Run after 20260322_add_reviews.sql migration

INSERT INTO spf_reviews (id, order_id, seller_id, buyer_name, buyer_email, rating, title, body, product_name, verified, helpful_count, created_at)
VALUES
  ('rev_001', 'ORD-20260301-001', 'seller_demo_01', 'Priya Sharma', 'priya@example.com', 5,
   'Absolutely stunning saree!',
   'The Banarasi silk saree exceeded my expectations. The zari work is intricate and the color is exactly as shown. Delivery was quick and the packaging was excellent. Will definitely order again!',
   'Banarasi Silk Saree - Red', true, 12, '2026-03-05T10:30:00Z'),

  ('rev_002', 'ORD-20260302-002', 'seller_demo_01', 'Anjali Verma', 'anjali@example.com', 4,
   'Beautiful fabric, minor delay',
   'The Chanderi cotton suit is lovely — soft fabric and beautiful block print. Took 2 extra days to arrive but the quality makes up for it. Happy with my purchase.',
   'Chanderi Cotton Suit Set', true, 8, '2026-03-07T14:15:00Z'),

  ('rev_003', 'ORD-20260303-003', 'seller_demo_01', 'Meera Patel', 'meera@example.com', 5,
   'Perfect wedding outfit',
   'Ordered this lehenga for my sister''s wedding and it was perfect. The embroidery is gorgeous and the fit was spot on. The dupatta had beautiful lace detailing. Highly recommend!',
   'Embroidered Lehenga Set', true, 15, '2026-03-08T09:45:00Z'),

  ('rev_004', 'ORD-20260304-004', 'seller_demo_01', 'Kavita Nair', 'kavita@example.com', 2,
   'Color was different from photos',
   'The saree color looks much darker in person compared to the website photos. The maroon shade I ordered looked almost brown. Fabric quality is okay but the color mismatch is disappointing.',
   'Mysore Silk Saree - Maroon', true, 3, '2026-03-10T16:20:00Z'),

  ('rev_005', 'ORD-20260305-005', 'seller_demo_01', 'Deepa Gupta', 'deepa@example.com', 3,
   'Average quality for the price',
   'The kurta material is decent but I expected better quality at this price point. The stitching on the sleeves could be better. It''s wearable but not as premium as described.',
   'Lucknowi Chikan Kurta', true, 5, '2026-03-11T11:00:00Z'),

  ('rev_006', 'ORD-20260306-006', 'seller_demo_01', 'Ritu Singh', 'ritu@example.com', 5,
   'Best online shopping experience!',
   'This is my third order from this seller and every time the quality has been consistent. The Kanjivaram saree is museum-worthy. The pallu design is breathtaking. Five stars all the way!',
   'Kanjivaram Silk Saree', true, 20, '2026-03-12T08:30:00Z'),

  ('rev_007', 'ORD-20260307-007', 'seller_demo_01', 'Sunita Joshi', 'sunita@example.com', 1,
   'Very disappointed',
   'Received a completely different product than what I ordered. I ordered an organza dupatta but received a plain chiffon one. Customer service was unresponsive for 3 days. Need a refund.',
   'Organza Embroidered Dupatta', true, 7, '2026-03-13T19:10:00Z'),

  ('rev_008', 'ORD-20260308-008', 'seller_demo_01', 'Lakshmi Iyer', 'lakshmi@example.com', 4,
   'Lovely palazzo set',
   'The cotton palazzo set is comfortable and great for daily wear. The print is vibrant and hasn''t faded after two washes. Sizing runs slightly large — order one size down.',
   'Printed Cotton Palazzo Set', true, 6, '2026-03-15T13:45:00Z'),

  ('rev_009', 'ORD-20260309-009', 'seller_demo_01', 'Neha Agarwal', 'neha@example.com', 5,
   'Gorgeous Anarkali!',
   'The georgette Anarkali is absolutely gorgeous. The flowy fabric and the golden embroidery make it look very expensive. Got so many compliments at a family gathering. Worth every rupee!',
   'Georgette Anarkali Suit', true, 11, '2026-03-17T10:00:00Z'),

  ('rev_010', 'ORD-20260310-010', 'seller_demo_01', 'Pooja Reddy', 'pooja@example.com', 4,
   'Good saree, great packaging',
   'The Tussar silk saree has a nice natural texture and the hand-painted border is unique. Packaging was premium with a nice box. Only giving 4 stars because the blouse piece was slightly smaller than expected.',
   'Tussar Silk Hand-Painted Saree', true, 4, '2026-03-19T15:30:00Z');

-- Add seller responses for 2 reviews (1 negative, 1 positive)
INSERT INTO spf_seller_responses (id, review_id, response_text, created_at)
VALUES
  ('resp_001', 'rev_004',
   'Dear Kavita, we sincerely apologize for the color discrepancy. We are updating our product photos to better reflect the actual colors under natural lighting. We would like to offer you a free exchange or a 15% discount on your next order. Please reach out to our support team.',
   '2026-03-11T09:00:00Z'),

  ('resp_002', 'rev_006',
   'Thank you so much Ritu! We truly appreciate your continued trust in our products. Our weavers in Kanchipuram put their heart into every saree. We are delighted that you love the collection. Looking forward to serving you again!',
   '2026-03-12T14:00:00Z');

-- Add some helpful votes
INSERT INTO spf_review_helpful_votes (review_id, voter_ip, created_at)
VALUES
  ('rev_001', '192.168.1.1', '2026-03-06T12:00:00Z'),
  ('rev_001', '192.168.1.2', '2026-03-06T14:00:00Z'),
  ('rev_003', '192.168.1.3', '2026-03-09T10:00:00Z'),
  ('rev_006', '192.168.1.4', '2026-03-13T08:00:00Z'),
  ('rev_006', '192.168.1.5', '2026-03-13T09:00:00Z'),
  ('rev_006', '192.168.1.6', '2026-03-14T11:00:00Z');
