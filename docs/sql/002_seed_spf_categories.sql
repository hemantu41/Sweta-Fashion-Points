-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Seed spf_categories with full IFP 3-level taxonomy
-- Run AFTER 001_create_spf_categories.sql
-- Parent IDs are resolved by slug — no hardcoded UUIDs needed.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── LEVEL 1: Main Categories ─────────────────────────────────────────────────

INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, icon, display_order, is_active) VALUES
  ('Women',        'महिला',        'women',        NULL, 1, '👩', 1, true),
  ('Men',          'पुरुष',        'men',          NULL, 1, '👨', 2, true),
  ('Kids',         'बच्चे',        'kids',         NULL, 1, '👧', 3, true),
  ('Accessories',  'एक्सेसरीज़',   'accessories',  NULL, 1, '💍', 4, true),
  ('Occasion Shop','अवसर शॉप',    'occasion-shop', NULL, 1, '🎉', 5, true)
ON CONFLICT (slug) DO NOTHING;


-- ── LEVEL 2: Women Subcategories ─────────────────────────────────────────────

INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, icon, display_order, is_active) VALUES
  ('Sarees',                'साड़ियाँ',        'sarees',               (SELECT id FROM spf_categories WHERE slug='women'), 2, '🥻', 1,  true),
  ('Kurtis & Kurta Sets',   'कुर्तियाँ',       'kurtis-kurta-sets',    (SELECT id FROM spf_categories WHERE slug='women'), 2, '👘', 2,  true),
  ('Salwar Suits',          'सलवार सूट',       'salwar-suits',         (SELECT id FROM spf_categories WHERE slug='women'), 2, '👗', 3,  true),
  ('Lehengas',              'लहंगे',           'lehengas',             (SELECT id FROM spf_categories WHERE slug='women'), 2, '✨', 4,  true),
  ('Dress Materials',       'ड्रेस मटेरियल',   'dress-materials',      (SELECT id FROM spf_categories WHERE slug='women'), 2, '🧵', 5,  true),
  ('Blouses',               'ब्लाउज',          'blouses',              (SELECT id FROM spf_categories WHERE slug='women'), 2, '👚', 6,  true),
  ('Dupattas & Stoles',     'दुपट्टे',          'dupattas-stoles',      (SELECT id FROM spf_categories WHERE slug='women'), 2, '🧣', 7,  true),
  ('Western Wear',          'वेस्टर्न वियर',    'western-wear-women',   (SELECT id FROM spf_categories WHERE slug='women'), 2, '👖', 8,  true),
  ('Bottom Wear',           'बॉटम वियर',        'bottom-wear-women',    (SELECT id FROM spf_categories WHERE slug='women'), 2, '👟', 9,  true),
  ('Innerwear & Loungewear','इनरवियर',          'innerwear-loungewear', (SELECT id FROM spf_categories WHERE slug='women'), 2, '🩱', 10, true),
  ('Winter Wear',           'विंटर वियर',       'winter-wear-women',    (SELECT id FROM spf_categories WHERE slug='women'), 2, '🧥', 11, true)
ON CONFLICT (slug) DO NOTHING;


-- ── LEVEL 2: Men Subcategories ────────────────────────────────────────────────

INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, icon, display_order, is_active) VALUES
  ('Ethnic Wear',          'एथनिक वियर',      'mens-ethnic',    (SELECT id FROM spf_categories WHERE slug='men'), 2, '👘', 1, true),
  ('Top Wear',             'टॉप वियर',         'mens-top',       (SELECT id FROM spf_categories WHERE slug='men'), 2, '👕', 2, true),
  ('Bottom Wear',          'बॉटम वियर',        'mens-bottom',    (SELECT id FROM spf_categories WHERE slug='men'), 2, '👖', 3, true),
  ('Innerwear',            'इनरवियर',          'mens-innerwear', (SELECT id FROM spf_categories WHERE slug='men'), 2, '🩲', 4, true),
  ('Sports & Active Wear', 'स्पोर्ट्स वियर',   'mens-sports',    (SELECT id FROM spf_categories WHERE slug='men'), 2, '🏋️', 5, true),
  ('Winter Wear',          'विंटर वियर',       'mens-winter',    (SELECT id FROM spf_categories WHERE slug='men'), 2, '🧥', 6, true),
  ('Night Wear',           'नाइट वियर',        'mens-nightwear', (SELECT id FROM spf_categories WHERE slug='men'), 2, '🌙', 7, true),
  ('Footwear',             'फुटवियर',          'mens-footwear',  (SELECT id FROM spf_categories WHERE slug='men'), 2, '👟', 8, true)
ON CONFLICT (slug) DO NOTHING;


-- ── LEVEL 2: Kids Subcategories ───────────────────────────────────────────────

INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, icon, display_order, is_active) VALUES
  ('Girls (2–14 yrs)', 'लड़कियाँ', 'girls',  (SELECT id FROM spf_categories WHERE slug='kids'), 2, '👧', 1, true),
  ('Boys (2–14 yrs)',  'लड़के',     'boys',   (SELECT id FROM spf_categories WHERE slug='kids'), 2, '👦', 2, true),
  ('Infant (0–2 yrs)', 'शिशु',     'infant', (SELECT id FROM spf_categories WHERE slug='kids'), 2, '🍼', 3, true)
ON CONFLICT (slug) DO NOTHING;


-- ── LEVEL 2: Accessories Subcategories ───────────────────────────────────────

INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, icon, display_order, is_active) VALUES
  ('Jewellery',       'ज्वेलरी',   'jewellery',   (SELECT id FROM spf_categories WHERE slug='accessories'), 2, '💎', 1, true),
  ('Bags & Clutches', 'बैग्स',     'bags',        (SELECT id FROM spf_categories WHERE slug='accessories'), 2, '👜', 2, true),
  ('Footwear',        'फुटवियर',   'acc-footwear',(SELECT id FROM spf_categories WHERE slug='accessories'), 2, '👡', 3, true),
  ('Watches',         'घड़ियाँ',    'watches',     (SELECT id FROM spf_categories WHERE slug='accessories'), 2, '⌚', 4, true),
  ('Others',          'अन्य',      'acc-others',  (SELECT id FROM spf_categories WHERE slug='accessories'), 2, '🎀', 5, true)
ON CONFLICT (slug) DO NOTHING;


-- ── LEVEL 2: Occasion Shop Subcategories ─────────────────────────────────────

INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, icon, display_order, is_active, is_occasion) VALUES
  ('Wedding Collection', 'वेडिंग',   'wedding-occ',  (SELECT id FROM spf_categories WHERE slug='occasion-shop'), 2, '💍', 1, true, true),
  ('Festival Collection','फेस्टिवल', 'festival-occ', (SELECT id FROM spf_categories WHERE slug='occasion-shop'), 2, '🪔', 2, true, true),
  ('Daily Wear',         'डेली',     'daily-occ',    (SELECT id FROM spf_categories WHERE slug='occasion-shop'), 2, '☀️', 3, true, true),
  ('Party Wear',         'पार्टी',   'party-occ',    (SELECT id FROM spf_categories WHERE slug='occasion-shop'), 2, '🎉', 4, true, true)
ON CONFLICT (slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- LEVEL 3: Product Types
-- ─────────────────────────────────────────────────────────────────────────────

-- Sarees →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Silk Sarees',        'सिल्क साड़ी',        'silk-sarees',        (SELECT id FROM spf_categories WHERE slug='sarees'), 3, 1,  true),
  ('Cotton Sarees',      'कॉटन साड़ी',         'cotton-sarees',      (SELECT id FROM spf_categories WHERE slug='sarees'), 3, 2,  true),
  ('Georgette Sarees',   'जॉर्जेट साड़ी',      'georgette-sarees',   (SELECT id FROM spf_categories WHERE slug='sarees'), 3, 3,  true),
  ('Banarasi Sarees',    'बनारसी साड़ी',        'banarasi-sarees',    (SELECT id FROM spf_categories WHERE slug='sarees'), 3, 4,  true),
  ('Chiffon Sarees',     'शिफॉन साड़ी',        'chiffon-sarees',     (SELECT id FROM spf_categories WHERE slug='sarees'), 3, 5,  true),
  ('Printed Sarees',     'प्रिंटेड साड़ी',      'printed-sarees',     (SELECT id FROM spf_categories WHERE slug='sarees'), 3, 6,  true),
  ('Embroidered Sarees', 'कढ़ाई साड़ी',         'embroidered-sarees', (SELECT id FROM spf_categories WHERE slug='sarees'), 3, 7,  true),
  ('Designer Sarees',    'डिज़ाइनर साड़ी',      'designer-sarees',    (SELECT id FROM spf_categories WHERE slug='sarees'), 3, 8,  true),
  ('Daily Wear Sarees',  'डेली वियर साड़ी',     'daily-sarees',       (SELECT id FROM spf_categories WHERE slug='sarees'), 3, 9,  true),
  ('Party Wear Sarees',  'पार्टी वियर साड़ी',   'party-sarees',       (SELECT id FROM spf_categories WHERE slug='sarees'), 3, 10, true)
ON CONFLICT (slug) DO NOTHING;

-- Kurtis & Kurta Sets →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Straight Kurtis',       'स्ट्रेट कुर्ती',    'straight-kurtis',    (SELECT id FROM spf_categories WHERE slug='kurtis-kurta-sets'), 3, 1,  true),
  ('Anarkali Kurtis',       'अनारकली कुर्ती',    'anarkali-kurtis',    (SELECT id FROM spf_categories WHERE slug='kurtis-kurta-sets'), 3, 2,  true),
  ('A-Line Kurtis',         'ए-लाइन कुर्ती',     'aline-kurtis',       (SELECT id FROM spf_categories WHERE slug='kurtis-kurta-sets'), 3, 3,  true),
  ('Kurti with Palazzo',    'कुर्ती पलाज़ो',     'kurti-palazzo',      (SELECT id FROM spf_categories WHERE slug='kurtis-kurta-sets'), 3, 4,  true),
  ('Kurti with Pant',       'कुर्ती पैंट',        'kurti-pant',         (SELECT id FROM spf_categories WHERE slug='kurtis-kurta-sets'), 3, 5,  true),
  ('Kurti with Dupatta',    'कुर्ती दुपट्टा',     'kurti-dupatta',      (SELECT id FROM spf_categories WHERE slug='kurtis-kurta-sets'), 3, 6,  true),
  ('Kurti Set (3-piece)',   '3 पीस कुर्ती सेट',   'kurti-set-3pc',      (SELECT id FROM spf_categories WHERE slug='kurtis-kurta-sets'), 3, 7,  true),
  ('Short Kurtis',          'शॉर्ट कुर्ती',      'short-kurtis',       (SELECT id FROM spf_categories WHERE slug='kurtis-kurta-sets'), 3, 8,  true),
  ('Long Kurtis',           'लॉन्ग कुर्ती',      'long-kurtis',        (SELECT id FROM spf_categories WHERE slug='kurtis-kurta-sets'), 3, 9,  true),
  ('Embroidered Kurtis',    'कढ़ाई कुर्ती',       'embroidered-kurtis', (SELECT id FROM spf_categories WHERE slug='kurtis-kurta-sets'), 3, 10, true)
ON CONFLICT (slug) DO NOTHING;

-- Salwar Suits →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Churidar Suits',      'चूड़ीदार सूट',    'churidar-suits',    (SELECT id FROM spf_categories WHERE slug='salwar-suits'), 3, 1, true),
  ('Patiala Suits',       'पटियाला सूट',     'patiala-suits',     (SELECT id FROM spf_categories WHERE slug='salwar-suits'), 3, 2, true),
  ('Anarkali Suits',      'अनारकली सूट',     'anarkali-suits',    (SELECT id FROM spf_categories WHERE slug='salwar-suits'), 3, 3, true),
  ('Pakistani Suits',     'पाकिस्तानी सूट',  'pakistani-suits',   (SELECT id FROM spf_categories WHERE slug='salwar-suits'), 3, 4, true),
  ('Unstitched Suits',    'अनस्टिचड सूट',    'unstitched-suits',  (SELECT id FROM spf_categories WHERE slug='salwar-suits'), 3, 5, true),
  ('Semi-Stitched Suits', 'सेमी स्टिचड',     'semi-stitched',     (SELECT id FROM spf_categories WHERE slug='salwar-suits'), 3, 6, true),
  ('Readymade Suits',     'रेडीमेड सूट',     'readymade-suits',   (SELECT id FROM spf_categories WHERE slug='salwar-suits'), 3, 7, true),
  ('Cotton Suits',        'कॉटन सूट',        'cotton-suits',      (SELECT id FROM spf_categories WHERE slug='salwar-suits'), 3, 8, true)
ON CONFLICT (slug) DO NOTHING;

-- Lehengas →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Bridal Lehengas',        'ब्राइडल लहंगा',    'bridal-lehengas',   (SELECT id FROM spf_categories WHERE slug='lehengas'), 3, 1, true),
  ('Party Wear Lehengas',    'पार्टी लहंगा',     'party-lehengas',    (SELECT id FROM spf_categories WHERE slug='lehengas'), 3, 2, true),
  ('Festival Lehengas',      'फेस्टिवल लहंगा',   'festival-lehengas', (SELECT id FROM spf_categories WHERE slug='lehengas'), 3, 3, true),
  ('Lehenga Choli Sets',     'लहंगा चोली',       'lehenga-choli',     (SELECT id FROM spf_categories WHERE slug='lehengas'), 3, 4, true),
  ('Half Saree / Langa Voni','हाफ साड़ी',         'half-saree',        (SELECT id FROM spf_categories WHERE slug='lehengas'), 3, 5, true),
  ('Designer Lehengas',      'डिज़ाइनर लहंगा',   'designer-lehengas', (SELECT id FROM spf_categories WHERE slug='lehengas'), 3, 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Dress Materials →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Cotton Dress Material',    'कॉटन',              'cotton-dm',       (SELECT id FROM spf_categories WHERE slug='dress-materials'), 3, 1, true),
  ('Silk Dress Material',      'सिल्क',             'silk-dm',         (SELECT id FROM spf_categories WHERE slug='dress-materials'), 3, 2, true),
  ('Georgette Dress Material', 'जॉर्जेट',           'georgette-dm',    (SELECT id FROM spf_categories WHERE slug='dress-materials'), 3, 3, true),
  ('Embroidered Material',     'कढ़ाई मटेरियल',     'embroidered-dm',  (SELECT id FROM spf_categories WHERE slug='dress-materials'), 3, 4, true),
  ('Printed Material',         'प्रिंटेड',           'printed-dm',      (SELECT id FROM spf_categories WHERE slug='dress-materials'), 3, 5, true),
  ('Churidar Material',        'चूड़ीदार मटेरियल',   'churidar-dm',     (SELECT id FROM spf_categories WHERE slug='dress-materials'), 3, 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Blouses →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Readymade Blouses',   'रेडीमेड ब्लाउज',  'readymade-blouses',   (SELECT id FROM spf_categories WHERE slug='blouses'), 3, 1, true),
  ('Blouse Pieces',       'ब्लाउज पीस',       'blouse-pieces',       (SELECT id FROM spf_categories WHERE slug='blouses'), 3, 2, true),
  ('Designer Blouses',    'डिज़ाइनर ब्लाउज',  'designer-blouses',    (SELECT id FROM spf_categories WHERE slug='blouses'), 3, 3, true),
  ('Padded Blouses',      'पैडेड ब्लाउज',     'padded-blouses',      (SELECT id FROM spf_categories WHERE slug='blouses'), 3, 4, true),
  ('Embroidered Blouses', 'कढ़ाई ब्लाउज',     'embroidered-blouses', (SELECT id FROM spf_categories WHERE slug='blouses'), 3, 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Dupattas & Stoles →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Silk Dupattas',       'सिल्क दुपट्टा',     'silk-dupattas',       (SELECT id FROM spf_categories WHERE slug='dupattas-stoles'), 3, 1, true),
  ('Cotton Dupattas',     'कॉटन दुपट्टा',      'cotton-dupattas',     (SELECT id FROM spf_categories WHERE slug='dupattas-stoles'), 3, 2, true),
  ('Embroidered Dupattas','कढ़ाई दुपट्टा',     'embroidered-dupattas',(SELECT id FROM spf_categories WHERE slug='dupattas-stoles'), 3, 3, true),
  ('Printed Dupattas',    'प्रिंटेड दुपट्टा',   'printed-dupattas',    (SELECT id FROM spf_categories WHERE slug='dupattas-stoles'), 3, 4, true),
  ('Bandhani Dupattas',   'बंधनी दुपट्टा',     'bandhani-dupattas',   (SELECT id FROM spf_categories WHERE slug='dupattas-stoles'), 3, 5, true),
  ('Phulkari Dupattas',   'फुलकारी दुपट्टा',   'phulkari-dupattas',   (SELECT id FROM spf_categories WHERE slug='dupattas-stoles'), 3, 6, true),
  ('Stoles & Shawls',     'स्टोल और शॉल',      'stoles',              (SELECT id FROM spf_categories WHERE slug='dupattas-stoles'), 3, 7, true)
ON CONFLICT (slug) DO NOTHING;

-- Western Wear (Women) →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Tops & Tunics', 'टॉप्स',     'tops-tunics',    (SELECT id FROM spf_categories WHERE slug='western-wear-women'), 3, 1, true),
  ('T-Shirts',      'टी-शर्ट',   'western-tshirts',(SELECT id FROM spf_categories WHERE slug='western-wear-women'), 3, 2, true),
  ('Jeans',         'जींस',       'western-jeans',  (SELECT id FROM spf_categories WHERE slug='western-wear-women'), 3, 3, true),
  ('Dresses',       'ड्रेसेज़',   'dresses',        (SELECT id FROM spf_categories WHERE slug='western-wear-women'), 3, 4, true),
  ('Crop Tops',     'क्रॉप टॉप',  'crop-tops',      (SELECT id FROM spf_categories WHERE slug='western-wear-women'), 3, 5, true),
  ('Jumpsuits',     'जंपसूट',     'jumpsuits',      (SELECT id FROM spf_categories WHERE slug='western-wear-women'), 3, 6, true),
  ('Shirts',        'शर्ट',       'western-shirts', (SELECT id FROM spf_categories WHERE slug='western-wear-women'), 3, 7, true)
ON CONFLICT (slug) DO NOTHING;

-- Bottom Wear (Women) →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Palazzos',         'पलाज़ो',       'palazzos',      (SELECT id FROM spf_categories WHERE slug='bottom-wear-women'), 3, 1, true),
  ('Leggings',         'लेगिंग्स',     'leggings',      (SELECT id FROM spf_categories WHERE slug='bottom-wear-women'), 3, 2, true),
  ('Pants & Trousers', 'पैंट',          'pants-trousers',(SELECT id FROM spf_categories WHERE slug='bottom-wear-women'), 3, 3, true),
  ('Skirts',           'स्कर्ट',        'skirts',        (SELECT id FROM spf_categories WHERE slug='bottom-wear-women'), 3, 4, true),
  ('Culottes',         'क्यूलोट्स',     'culottes',      (SELECT id FROM spf_categories WHERE slug='bottom-wear-women'), 3, 5, true),
  ('Jeggings',         'जेगिंग्स',     'jeggings',      (SELECT id FROM spf_categories WHERE slug='bottom-wear-women'), 3, 6, true),
  ('Sharara Pants',    'शरारा',         'sharara',       (SELECT id FROM spf_categories WHERE slug='bottom-wear-women'), 3, 7, true)
ON CONFLICT (slug) DO NOTHING;

-- Innerwear & Loungewear →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Bras',            'ब्रा',         'bras',       (SELECT id FROM spf_categories WHERE slug='innerwear-loungewear'), 3, 1, true),
  ('Panties',         'पैंटीज़',       'panties',    (SELECT id FROM spf_categories WHERE slug='innerwear-loungewear'), 3, 2, true),
  ('Nightgowns',      'नाइटगाउन',     'nightgowns', (SELECT id FROM spf_categories WHERE slug='innerwear-loungewear'), 3, 3, true),
  ('Night Suits',     'नाइट सूट',     'night-suits',(SELECT id FROM spf_categories WHERE slug='innerwear-loungewear'), 3, 4, true),
  ('Loungewear Sets', 'लाउंजवियर',    'loungewear', (SELECT id FROM spf_categories WHERE slug='innerwear-loungewear'), 3, 5, true),
  ('Camisoles',       'कैमीसोल',      'camisoles',  (SELECT id FROM spf_categories WHERE slug='innerwear-loungewear'), 3, 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Winter Wear (Women) →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Sweaters',      'स्वेटर',     'sweaters',       (SELECT id FROM spf_categories WHERE slug='winter-wear-women'), 3, 1, true),
  ('Shawls & Wraps','शॉल',        'shawls',         (SELECT id FROM spf_categories WHERE slug='winter-wear-women'), 3, 2, true),
  ('Jackets',       'जैकेट',      'jackets',        (SELECT id FROM spf_categories WHERE slug='winter-wear-women'), 3, 3, true),
  ('Thermals',      'थर्मल',      'thermals-women', (SELECT id FROM spf_categories WHERE slug='winter-wear-women'), 3, 4, true),
  ('Woolen Kurtis', 'ऊनी कुर्ती', 'woolen-kurtis',  (SELECT id FROM spf_categories WHERE slug='winter-wear-women'), 3, 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Men Ethnic Wear →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Kurtas',           'कुर्ता',        'kurtas',       (SELECT id FROM spf_categories WHERE slug='mens-ethnic'), 3, 1, true),
  ('Kurta Pajama Sets','कुर्ता पजामा',  'kurta-pajama', (SELECT id FROM spf_categories WHERE slug='mens-ethnic'), 3, 2, true),
  ('Nehru Jackets',    'नेहरू जैकेट',   'nehru-jackets',(SELECT id FROM spf_categories WHERE slug='mens-ethnic'), 3, 3, true),
  ('Sherwanis',        'शेरवानी',       'sherwanis',    (SELECT id FROM spf_categories WHERE slug='mens-ethnic'), 3, 4, true),
  ('Dhotis & Lungis',  'धोती लुंगी',    'dhotis',       (SELECT id FROM spf_categories WHERE slug='mens-ethnic'), 3, 5, true),
  ('Pathani Suits',    'पठानी सूट',     'pathani',      (SELECT id FROM spf_categories WHERE slug='mens-ethnic'), 3, 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Men Top Wear →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('T-Shirts',            'टी-शर्ट',     'mens-tshirts',  (SELECT id FROM spf_categories WHERE slug='mens-top'), 3, 1, true),
  ('Casual Shirts',       'कैजुअल शर्ट', 'casual-shirts', (SELECT id FROM spf_categories WHERE slug='mens-top'), 3, 2, true),
  ('Formal Shirts',       'फॉर्मल शर्ट', 'formal-shirts', (SELECT id FROM spf_categories WHERE slug='mens-top'), 3, 3, true),
  ('Polo T-Shirts',       'पोलो टी-शर्ट','polo-tshirts',  (SELECT id FROM spf_categories WHERE slug='mens-top'), 3, 4, true),
  ('Oversized T-Shirts',  'ओवरसाइज़',    'oversized',     (SELECT id FROM spf_categories WHERE slug='mens-top'), 3, 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Men Bottom Wear →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Jeans',             'जींस',             'mens-jeans',       (SELECT id FROM spf_categories WHERE slug='mens-bottom'), 3, 1, true),
  ('Casual Trousers',   'कैजुअल ट्राउज़र',  'casual-trousers',  (SELECT id FROM spf_categories WHERE slug='mens-bottom'), 3, 2, true),
  ('Formal Trousers',   'फॉर्मल ट्राउज़र',  'formal-trousers',  (SELECT id FROM spf_categories WHERE slug='mens-bottom'), 3, 3, true),
  ('Cargo Pants',       'कार्गो पैंट',       'cargo-pants',      (SELECT id FROM spf_categories WHERE slug='mens-bottom'), 3, 4, true),
  ('Track Pants',       'ट्रैक पैंट',        'mens-track',       (SELECT id FROM spf_categories WHERE slug='mens-bottom'), 3, 5, true),
  ('Shorts',            'शॉर्ट्स',           'shorts',           (SELECT id FROM spf_categories WHERE slug='mens-bottom'), 3, 6, true),
  ('Joggers',           'जॉगर्स',            'joggers',          (SELECT id FROM spf_categories WHERE slug='mens-bottom'), 3, 7, true)
ON CONFLICT (slug) DO NOTHING;

-- Men Innerwear →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Vests',   'बनियान',   'vests',   (SELECT id FROM spf_categories WHERE slug='mens-innerwear'), 3, 1, true),
  ('Briefs',  'ब्रीफ़्स',  'briefs',  (SELECT id FROM spf_categories WHERE slug='mens-innerwear'), 3, 2, true),
  ('Boxers',  'बॉक्सर्स', 'boxers',  (SELECT id FROM spf_categories WHERE slug='mens-innerwear'), 3, 3, true),
  ('Trunks',  'ट्रंक्स',  'trunks',  (SELECT id FROM spf_categories WHERE slug='mens-innerwear'), 3, 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Men Sports →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Track Pants',    'ट्रैक पैंट',        'sports-track',  (SELECT id FROM spf_categories WHERE slug='mens-sports'), 3, 1, true),
  ('Track Suits',    'ट्रैक सूट',         'track-suits',   (SELECT id FROM spf_categories WHERE slug='mens-sports'), 3, 2, true),
  ('Gym T-Shirts',   'जिम टी-शर्ट',       'gym-tshirts',   (SELECT id FROM spf_categories WHERE slug='mens-sports'), 3, 3, true),
  ('Sports Shorts',  'स्पोर्ट्स शॉर्ट्स', 'sports-shorts', (SELECT id FROM spf_categories WHERE slug='mens-sports'), 3, 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Men Winter Wear →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Jackets',     'जैकेट',    'mens-jackets',   (SELECT id FROM spf_categories WHERE slug='mens-winter'), 3, 1, true),
  ('Sweaters',    'स्वेटर',   'mens-sweaters',  (SELECT id FROM spf_categories WHERE slug='mens-winter'), 3, 2, true),
  ('Hoodies',     'हुडी',     'hoodies',        (SELECT id FROM spf_categories WHERE slug='mens-winter'), 3, 3, true),
  ('Sweatshirts', 'स्वेटशर्ट','sweatshirts',    (SELECT id FROM spf_categories WHERE slug='mens-winter'), 3, 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Men Night Wear →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Pyjamas',    'पजामा',   'pyjamas',        (SELECT id FROM spf_categories WHERE slug='mens-nightwear'), 3, 1, true),
  ('Night Suits','नाइट सूट','mens-nightsuit',  (SELECT id FROM spf_categories WHERE slug='mens-nightwear'), 3, 2, true)
ON CONFLICT (slug) DO NOTHING;

-- Men Footwear →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Casual Shoes',              'कैजुअल शूज़',              'casual-shoes',  (SELECT id FROM spf_categories WHERE slug='mens-footwear'), 3, 1, true),
  ('Formal Shoes',              'फॉर्मल शूज़',              'formal-shoes',  (SELECT id FROM spf_categories WHERE slug='mens-footwear'), 3, 2, true),
  ('Sports Shoes',              'स्पोर्ट्स शूज़',            'sports-shoes',  (SELECT id FROM spf_categories WHERE slug='mens-footwear'), 3, 3, true),
  ('Sandals & Slippers',        'सैंडल',                    'sandals',       (SELECT id FROM spf_categories WHERE slug='mens-footwear'), 3, 4, true),
  ('Ethnic Footwear (Juttis)',  'जूतियाँ',                  'juttis',        (SELECT id FROM spf_categories WHERE slug='mens-footwear'), 3, 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Girls →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Ethnic Wear',       'एथनिक वियर',  'girls-ethnic', (SELECT id FROM spf_categories WHERE slug='girls'), 3, 1, true),
  ('Dresses & Frocks',  'फ्रॉक',        'girls-dresses',(SELECT id FROM spf_categories WHERE slug='girls'), 3, 2, true),
  ('Tops & T-Shirts',   'टॉप्स',        'girls-tops',   (SELECT id FROM spf_categories WHERE slug='girls'), 3, 3, true),
  ('Pants & Leggings',  'पैंट',          'girls-pants',  (SELECT id FROM spf_categories WHERE slug='girls'), 3, 4, true),
  ('Sets & Combos',     'सेट',           'girls-sets',   (SELECT id FROM spf_categories WHERE slug='girls'), 3, 5, true),
  ('Party Wear',        'पार्टी वियर',   'girls-party',  (SELECT id FROM spf_categories WHERE slug='girls'), 3, 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Boys →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Ethnic Wear',       'एथनिक वियर',  'boys-ethnic',  (SELECT id FROM spf_categories WHERE slug='boys'), 3, 1, true),
  ('T-Shirts & Shirts', 'टी-शर्ट',     'boys-tshirts', (SELECT id FROM spf_categories WHERE slug='boys'), 3, 2, true),
  ('Pants & Shorts',    'पैंट',          'boys-pants',   (SELECT id FROM spf_categories WHERE slug='boys'), 3, 3, true),
  ('Sets & Combos',     'सेट',           'boys-sets',    (SELECT id FROM spf_categories WHERE slug='boys'), 3, 4, true),
  ('Party Wear',        'पार्टी वियर',   'boys-party',   (SELECT id FROM spf_categories WHERE slug='boys'), 3, 5, true),
  ('Winter Wear',       'विंटर वियर',    'boys-winter',  (SELECT id FROM spf_categories WHERE slug='boys'), 3, 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Infant →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Rompers & Onesies', 'रोम्पर्स',  'rompers',       (SELECT id FROM spf_categories WHERE slug='infant'), 3, 1, true),
  ('Sets',              'सेट',        'infant-sets',   (SELECT id FROM spf_categories WHERE slug='infant'), 3, 2, true),
  ('Dresses (Girls)',   'फ्रॉक',      'infant-dresses',(SELECT id FROM spf_categories WHERE slug='infant'), 3, 3, true),
  ('Kurta Sets (Boys)', 'कुर्ता',     'infant-kurta',  (SELECT id FROM spf_categories WHERE slug='infant'), 3, 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Jewellery →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Necklace Sets',        'नेकलेस सेट',        'necklace-sets',    (SELECT id FROM spf_categories WHERE slug='jewellery'), 3, 1, true),
  ('Earrings',             'इयररिंग्स',          'earrings',         (SELECT id FROM spf_categories WHERE slug='jewellery'), 3, 2, true),
  ('Bangles & Bracelets',  'चूड़ियाँ',            'bangles',          (SELECT id FROM spf_categories WHERE slug='jewellery'), 3, 3, true),
  ('Anklets (Payal)',      'पायल',               'anklets',          (SELECT id FROM spf_categories WHERE slug='jewellery'), 3, 4, true),
  ('Maang Tikka',          'मांग टीका',           'maang-tikka',      (SELECT id FROM spf_categories WHERE slug='jewellery'), 3, 5, true),
  ('Nose Rings',           'नथनी',               'nose-rings',       (SELECT id FROM spf_categories WHERE slug='jewellery'), 3, 6, true),
  ('Rings',                'अंगूठी',              'rings',            (SELECT id FROM spf_categories WHERE slug='jewellery'), 3, 7, true),
  ('Bridal Jewellery Sets','ब्राइडल ज्वेलरी',     'bridal-jewellery', (SELECT id FROM spf_categories WHERE slug='jewellery'), 3, 8, true)
ON CONFLICT (slug) DO NOTHING;

-- Bags & Clutches →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Handbags',           'हैंडबैग',    'handbags',  (SELECT id FROM spf_categories WHERE slug='bags'), 3, 1, true),
  ('Clutches',           'क्लच',       'clutches',  (SELECT id FROM spf_categories WHERE slug='bags'), 3, 2, true),
  ('Tote Bags',          'टोट बैग',    'tote-bags', (SELECT id FROM spf_categories WHERE slug='bags'), 3, 3, true),
  ('Sling Bags',         'स्लिंग बैग', 'sling-bags',(SELECT id FROM spf_categories WHERE slug='bags'), 3, 4, true),
  ('Potli Bags (Ethnic)','पोटली बैग',  'potli-bags',(SELECT id FROM spf_categories WHERE slug='bags'), 3, 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Accessories Footwear →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Women Sandals',       'सैंडल',      'women-sandals',(SELECT id FROM spf_categories WHERE slug='acc-footwear'), 3, 1, true),
  ('Women Heels',         'हील्स',      'women-heels',  (SELECT id FROM spf_categories WHERE slug='acc-footwear'), 3, 2, true),
  ('Women Flats',         'फ्लैट्स',    'women-flats',  (SELECT id FROM spf_categories WHERE slug='acc-footwear'), 3, 3, true),
  ('Juttis & Mojaris',    'जूतियाँ',    'juttis-women', (SELECT id FROM spf_categories WHERE slug='acc-footwear'), 3, 4, true),
  ('Kolhapuri Chappals',  'कोल्हापुरी', 'kolhapuri',    (SELECT id FROM spf_categories WHERE slug='acc-footwear'), 3, 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Watches →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Women Watches', 'महिला घड़ी',       'women-watches',(SELECT id FROM spf_categories WHERE slug='watches'), 3, 1, true),
  ('Men Watches',   'पुरुष घड़ी',       'men-watches',  (SELECT id FROM spf_categories WHERE slug='watches'), 3, 2, true),
  ('Kids Watches',  'बच्चों की घड़ी',   'kids-watches', (SELECT id FROM spf_categories WHERE slug='watches'), 3, 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Others (Accessories) →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Belts',            'बेल्ट',           'belts',            (SELECT id FROM spf_categories WHERE slug='acc-others'), 3, 1, true),
  ('Sunglasses',       'सनग्लासेज़',       'sunglasses',       (SELECT id FROM spf_categories WHERE slug='acc-others'), 3, 2, true),
  ('Hair Accessories', 'हेयर एक्सेसरीज़', 'hair-accessories', (SELECT id FROM spf_categories WHERE slug='acc-others'), 3, 3, true),
  ('Scarves & Stoles', 'स्कार्फ',          'scarves',          (SELECT id FROM spf_categories WHERE slug='acc-others'), 3, 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Wedding Collection →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active, is_occasion) VALUES
  ('Bridal Wear',            'ब्राइडल वियर',  'bridal-wear',    (SELECT id FROM spf_categories WHERE slug='wedding-occ'), 3, 1, true, true),
  ('Groom Wear',             'ग्रूम वियर',    'groom-wear',     (SELECT id FROM spf_categories WHERE slug='wedding-occ'), 3, 2, true, true),
  ('Guest Outfits (Women)',  'गेस्ट आउटफिट',  'wedding-guest-w',(SELECT id FROM spf_categories WHERE slug='wedding-occ'), 3, 3, true, true),
  ('Mehendi & Haldi Wear',   'मेहंदी हल्दी',  'mehendi-haldi',  (SELECT id FROM spf_categories WHERE slug='wedding-occ'), 3, 4, true, true),
  ('Sangeet Outfits',        'संगीत आउटफिट',  'sangeet',        (SELECT id FROM spf_categories WHERE slug='wedding-occ'), 3, 5, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Festival Collection →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active, is_occasion) VALUES
  ('Diwali Special',        'दिवाली',     'diwali',     (SELECT id FROM spf_categories WHERE slug='festival-occ'), 3, 1, true, true),
  ('Chhath Puja Special',   'छठ पूजा',    'chhath',     (SELECT id FROM spf_categories WHERE slug='festival-occ'), 3, 2, true, true),
  ('Eid Collection',        'ईद',         'eid-occ',    (SELECT id FROM spf_categories WHERE slug='festival-occ'), 3, 3, true, true),
  ('Navratri / Durga Puja', 'नवरात्रि',   'navratri-occ',(SELECT id FROM spf_categories WHERE slug='festival-occ'), 3, 4, true, true),
  ('Holi Special',          'होली',       'holi-occ',   (SELECT id FROM spf_categories WHERE slug='festival-occ'), 3, 5, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Daily Wear →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active, is_occasion) VALUES
  ('Office Wear (Women)', 'ऑफिस वियर', 'office-women',   (SELECT id FROM spf_categories WHERE slug='daily-occ'), 3, 1, true, true),
  ('Office Wear (Men)',   'ऑफिस वियर', 'office-men',     (SELECT id FROM spf_categories WHERE slug='daily-occ'), 3, 2, true, true),
  ('College / Campus',    'कॉलेज',      'college',        (SELECT id FROM spf_categories WHERE slug='daily-occ'), 3, 3, true, true),
  ('Casual Everyday',     'कैजुअल',     'casual-everyday',(SELECT id FROM spf_categories WHERE slug='daily-occ'), 3, 4, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Party Wear →
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active, is_occasion) VALUES
  ('Evening / Cocktail', 'इवनिंग',    'evening',    (SELECT id FROM spf_categories WHERE slug='party-occ'), 3, 1, true, true),
  ('Birthday Party',     'बर्थडे',    'birthday',   (SELECT id FROM spf_categories WHERE slug='party-occ'), 3, 2, true, true),
  ('Anniversary',        'एनिवर्सरी', 'anniversary',(SELECT id FROM spf_categories WHERE slug='party-occ'), 3, 3, true, true),
  ('Reception Wear',     'रिसेप्शन',  'reception',  (SELECT id FROM spf_categories WHERE slug='party-occ'), 3, 4, true, true)
ON CONFLICT (slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- Verify: count rows per level
-- ─────────────────────────────────────────────────────────────────────────────
SELECT level, COUNT(*) AS count FROM spf_categories GROUP BY level ORDER BY level;
