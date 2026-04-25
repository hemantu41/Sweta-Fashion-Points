-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: Seed Makeup & Beauty category (L1 + L2 + L3)
-- Safe to re-run — uses ON CONFLICT (slug) DO NOTHING
-- ─────────────────────────────────────────────────────────────────────────────

-- ── L1: Makeup & Beauty ──────────────────────────────────────────────────────
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active)
VALUES ('Makeup & Beauty', 'मेकअप और ब्यूटी', 'makeup-beauty', NULL, 1, 6, true)
ON CONFLICT (slug) DO NOTHING;

-- ── L2 subcategories ─────────────────────────────────────────────────────────
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Face Makeup',       'फेस मेकअप',      'face-makeup',       (SELECT id FROM spf_categories WHERE slug='makeup-beauty'), 2, 1, true),
  ('Eye Makeup',        'आई मेकअप',       'eye-makeup',        (SELECT id FROM spf_categories WHERE slug='makeup-beauty'), 2, 2, true),
  ('Lip Makeup',        'लिप मेकअप',      'lip-makeup',        (SELECT id FROM spf_categories WHERE slug='makeup-beauty'), 2, 3, true),
  ('Nail Care',         'नेल केयर',       'nail-care',         (SELECT id FROM spf_categories WHERE slug='makeup-beauty'), 2, 4, true),
  ('Skin Care',         'स्किन केयर',     'skin-care',         (SELECT id FROM spf_categories WHERE slug='makeup-beauty'), 2, 5, true),
  ('Hair Care',         'हेयर केयर',      'hair-care',         (SELECT id FROM spf_categories WHERE slug='makeup-beauty'), 2, 6, true),
  ('Fragrance',         'परफ्यूम',        'fragrance',         (SELECT id FROM spf_categories WHERE slug='makeup-beauty'), 2, 7, true),
  ('Beauty Tools',      'ब्यूटी टूल्स',   'beauty-tools',      (SELECT id FROM spf_categories WHERE slug='makeup-beauty'), 2, 8, true),
  ('Personal Hygiene',  'पर्सनल हाइजीन', 'personal-hygiene',  (SELECT id FROM spf_categories WHERE slug='makeup-beauty'), 2, 9, true),
  ('Mehendi & Bindi',   'मेहंदी और बिंदी', 'mehendi-bindi',    (SELECT id FROM spf_categories WHERE slug='makeup-beauty'), 2, 10, true)
ON CONFLICT (slug) DO NOTHING;

-- ── L3: Face Makeup ───────────────────────────────────────────────────────────
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Foundation',          'फाउंडेशन',         'foundation',           (SELECT id FROM spf_categories WHERE slug='face-makeup'), 3, 1, true),
  ('BB & CC Cream',       'बीबी और सीसी क्रीम','bb-cc-cream',          (SELECT id FROM spf_categories WHERE slug='face-makeup'), 3, 2, true),
  ('Concealer',           'कंसीलर',            'concealer',            (SELECT id FROM spf_categories WHERE slug='face-makeup'), 3, 3, true),
  ('Compact Powder',      'कॉम्पेक्ट पाउडर',  'compact-powder',       (SELECT id FROM spf_categories WHERE slug='face-makeup'), 3, 4, true),
  ('Blush & Bronzer',     'ब्लश और ब्रॉन्ज़र', 'blush-bronzer',        (SELECT id FROM spf_categories WHERE slug='face-makeup'), 3, 5, true),
  ('Highlighter',         'हाइलाइटर',          'highlighter',          (SELECT id FROM spf_categories WHERE slug='face-makeup'), 3, 6, true),
  ('Face Primer',         'फेस प्राइमर',       'face-primer',          (SELECT id FROM spf_categories WHERE slug='face-makeup'), 3, 7, true),
  ('Setting Spray',       'सेटिंग स्प्रे',     'setting-spray',        (SELECT id FROM spf_categories WHERE slug='face-makeup'), 3, 8, true),
  ('Contour',             'कंटूर',             'contour',              (SELECT id FROM spf_categories WHERE slug='face-makeup'), 3, 9, true)
ON CONFLICT (slug) DO NOTHING;

-- ── L3: Eye Makeup ────────────────────────────────────────────────────────────
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Kajal & Kohl',        'काजल और कोहल',     'kajal-kohl',           (SELECT id FROM spf_categories WHERE slug='eye-makeup'), 3, 1, true),
  ('Eyeliner',            'आईलाइनर',           'eyeliner',             (SELECT id FROM spf_categories WHERE slug='eye-makeup'), 3, 2, true),
  ('Eyeshadow',           'आईशैडो',            'eyeshadow',            (SELECT id FROM spf_categories WHERE slug='eye-makeup'), 3, 3, true),
  ('Mascara',             'मस्कारा',           'mascara',              (SELECT id FROM spf_categories WHERE slug='eye-makeup'), 3, 4, true),
  ('Eyebrow Pencil',      'आईब्रो पेंसिल',    'eyebrow-pencil',       (SELECT id FROM spf_categories WHERE slug='eye-makeup'), 3, 5, true),
  ('Eye Primer',          'आई प्राइमर',        'eye-primer',           (SELECT id FROM spf_categories WHERE slug='eye-makeup'), 3, 6, true),
  ('False Eyelashes',     'फॉल्स आईलैशेज',    'false-eyelashes',      (SELECT id FROM spf_categories WHERE slug='eye-makeup'), 3, 7, true),
  ('Eye Makeup Remover',  'आई मेकअप रिमूवर',  'eye-makeup-remover',   (SELECT id FROM spf_categories WHERE slug='eye-makeup'), 3, 8, true)
ON CONFLICT (slug) DO NOTHING;

-- ── L3: Lip Makeup ────────────────────────────────────────────────────────────
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Lipstick',            'लिपस्टिक',          'lipstick',             (SELECT id FROM spf_categories WHERE slug='lip-makeup'), 3, 1, true),
  ('Lip Gloss',           'लिप ग्लॉस',         'lip-gloss',            (SELECT id FROM spf_categories WHERE slug='lip-makeup'), 3, 2, true),
  ('Lip Liner',           'लिप लाइनर',         'lip-liner',            (SELECT id FROM spf_categories WHERE slug='lip-makeup'), 3, 3, true),
  ('Lip Balm',            'लिप बाम',            'lip-balm',             (SELECT id FROM spf_categories WHERE slug='lip-makeup'), 3, 4, true),
  ('Lip Plumper',         'लिप प्लम्पर',       'lip-plumper',          (SELECT id FROM spf_categories WHERE slug='lip-makeup'), 3, 5, true),
  ('Lip Stain',           'लिप स्टेन',         'lip-stain',            (SELECT id FROM spf_categories WHERE slug='lip-makeup'), 3, 6, true),
  ('Lip Palette',         'लिप पैलेट',         'lip-palette',          (SELECT id FROM spf_categories WHERE slug='lip-makeup'), 3, 7, true)
ON CONFLICT (slug) DO NOTHING;

-- ── L3: Nail Care ─────────────────────────────────────────────────────────────
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Nail Polish',         'नेल पॉलिश',         'nail-polish',          (SELECT id FROM spf_categories WHERE slug='nail-care'), 3, 1, true),
  ('Nail Art',            'नेल आर्ट',          'nail-art',             (SELECT id FROM spf_categories WHERE slug='nail-care'), 3, 2, true),
  ('Nail Extensions',     'नेल एक्सटेंशन',    'nail-extensions',      (SELECT id FROM spf_categories WHERE slug='nail-care'), 3, 3, true),
  ('Nail Polish Remover', 'नेल पॉलिश रिमूवर', 'nail-polish-remover',  (SELECT id FROM spf_categories WHERE slug='nail-care'), 3, 4, true),
  ('Cuticle Care',        'क्यूटिकल केयर',    'cuticle-care',         (SELECT id FROM spf_categories WHERE slug='nail-care'), 3, 5, true),
  ('Nail Strengthener',   'नेल स्ट्रेंथनर',   'nail-strengthener',    (SELECT id FROM spf_categories WHERE slug='nail-care'), 3, 6, true)
ON CONFLICT (slug) DO NOTHING;

-- ── L3: Skin Care ─────────────────────────────────────────────────────────────
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Face Wash',           'फेस वॉश',           'face-wash',            (SELECT id FROM spf_categories WHERE slug='skin-care'), 3, 1, true),
  ('Moisturizer',         'मॉइस्चराइज़र',      'moisturizer',          (SELECT id FROM spf_categories WHERE slug='skin-care'), 3, 2, true),
  ('Face Serum',          'फेस सीरम',          'face-serum',           (SELECT id FROM spf_categories WHERE slug='skin-care'), 3, 3, true),
  ('Face Mask & Pack',    'फेस मास्क',         'face-mask-pack',       (SELECT id FROM spf_categories WHERE slug='skin-care'), 3, 4, true),
  ('Sunscreen & SPF',     'सनस्क्रीन',         'sunscreen-spf',        (SELECT id FROM spf_categories WHERE slug='skin-care'), 3, 5, true),
  ('Toner',               'टोनर',              'toner',                (SELECT id FROM spf_categories WHERE slug='skin-care'), 3, 6, true),
  ('Eye Cream',           'आई क्रीम',          'eye-cream',            (SELECT id FROM spf_categories WHERE slug='skin-care'), 3, 7, true),
  ('Scrub & Exfoliator',  'स्क्रब',            'scrub-exfoliator',     (SELECT id FROM spf_categories WHERE slug='skin-care'), 3, 8, true),
  ('Night Cream',         'नाइट क्रीम',        'night-cream',          (SELECT id FROM spf_categories WHERE slug='skin-care'), 3, 9, true),
  ('Body Lotion',         'बॉडी लोशन',         'body-lotion',          (SELECT id FROM spf_categories WHERE slug='skin-care'), 3, 10, true),
  ('Lip Care',            'लिप केयर',          'lip-care-skin',        (SELECT id FROM spf_categories WHERE slug='skin-care'), 3, 11, true),
  ('Ubtan & Natural',     'उबटन',              'ubtan-natural',        (SELECT id FROM spf_categories WHERE slug='skin-care'), 3, 12, true)
ON CONFLICT (slug) DO NOTHING;

-- ── L3: Hair Care ─────────────────────────────────────────────────────────────
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Shampoo',             'शैम्पू',            'shampoo',              (SELECT id FROM spf_categories WHERE slug='hair-care'), 3, 1, true),
  ('Conditioner',         'कंडीशनर',           'conditioner',          (SELECT id FROM spf_categories WHERE slug='hair-care'), 3, 2, true),
  ('Hair Oil',            'बाल तेल',           'hair-oil',             (SELECT id FROM spf_categories WHERE slug='hair-care'), 3, 3, true),
  ('Hair Serum',          'हेयर सीरम',         'hair-serum',           (SELECT id FROM spf_categories WHERE slug='hair-care'), 3, 4, true),
  ('Hair Mask',           'हेयर मास्क',        'hair-mask',            (SELECT id FROM spf_categories WHERE slug='hair-care'), 3, 5, true),
  ('Hair Color & Dye',    'हेयर कलर',          'hair-color-dye',       (SELECT id FROM spf_categories WHERE slug='hair-care'), 3, 6, true),
  ('Hair Accessories',    'हेयर एक्सेसरीज',   'hair-accessories-care',(SELECT id FROM spf_categories WHERE slug='hair-care'), 3, 7, true),
  ('Dandruff Care',       'डैंड्रफ केयर',     'dandruff-care',        (SELECT id FROM spf_categories WHERE slug='hair-care'), 3, 8, true),
  ('Hair Growth',         'हेयर ग्रोथ',       'hair-growth',          (SELECT id FROM spf_categories WHERE slug='hair-care'), 3, 9, true),
  ('Dry Shampoo',         'ड्राई शैम्पू',     'dry-shampoo',          (SELECT id FROM spf_categories WHERE slug='hair-care'), 3, 10, true)
ON CONFLICT (slug) DO NOTHING;

-- ── L3: Fragrance ─────────────────────────────────────────────────────────────
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Eau de Parfum',       'ओ द परफ्यूम',      'eau-de-parfum',        (SELECT id FROM spf_categories WHERE slug='fragrance'), 3, 1, true),
  ('Eau de Toilette',     'ओ द टॉयलेट',       'eau-de-toilette',      (SELECT id FROM spf_categories WHERE slug='fragrance'), 3, 2, true),
  ('Attar / Itar',        'अत्तर / इत्र',     'attar-itar',           (SELECT id FROM spf_categories WHERE slug='fragrance'), 3, 3, true),
  ('Body Mist',           'बॉडी मिस्ट',       'body-mist',            (SELECT id FROM spf_categories WHERE slug='fragrance'), 3, 4, true),
  ('Deodorant',           'डिओडोरेंट',        'deodorant',            (SELECT id FROM spf_categories WHERE slug='fragrance'), 3, 5, true),
  ('Perfume Gift Set',    'परफ्यूम गिफ्ट सेट','perfume-gift-set',     (SELECT id FROM spf_categories WHERE slug='fragrance'), 3, 6, true)
ON CONFLICT (slug) DO NOTHING;

-- ── L3: Beauty Tools ──────────────────────────────────────────────────────────
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Makeup Brushes',      'मेकअप ब्रश',       'makeup-brushes',       (SELECT id FROM spf_categories WHERE slug='beauty-tools'), 3, 1, true),
  ('Makeup Sponge',       'मेकअप स्पंज',      'makeup-sponge',        (SELECT id FROM spf_categories WHERE slug='beauty-tools'), 3, 2, true),
  ('Eyelash Curler',      'आईलैश कर्लर',      'eyelash-curler',       (SELECT id FROM spf_categories WHERE slug='beauty-tools'), 3, 3, true),
  ('Tweezers',            'ट्वीज़र',           'tweezers',             (SELECT id FROM spf_categories WHERE slug='beauty-tools'), 3, 4, true),
  ('Face Roller',         'फेस रोलर',         'face-roller',          (SELECT id FROM spf_categories WHERE slug='beauty-tools'), 3, 5, true),
  ('Hair Dryer',          'हेयर ड्रायर',      'hair-dryer',           (SELECT id FROM spf_categories WHERE slug='beauty-tools'), 3, 6, true),
  ('Hair Straightener',   'हेयर स्ट्रेटनर',  'hair-straightener',    (SELECT id FROM spf_categories WHERE slug='beauty-tools'), 3, 7, true),
  ('Hair Curler',         'हेयर कर्लर',       'hair-curler',          (SELECT id FROM spf_categories WHERE slug='beauty-tools'), 3, 8, true),
  ('Nail Tools',          'नेल टूल्स',        'nail-tools',           (SELECT id FROM spf_categories WHERE slug='beauty-tools'), 3, 9, true),
  ('Makeup Organizer',    'मेकअप ऑर्गनाइज़र', 'makeup-organizer',     (SELECT id FROM spf_categories WHERE slug='beauty-tools'), 3, 10, true)
ON CONFLICT (slug) DO NOTHING;

-- ── L3: Personal Hygiene ──────────────────────────────────────────────────────
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Soap & Body Wash',    'साबुन और बॉडी वॉश', 'soap-body-wash',      (SELECT id FROM spf_categories WHERE slug='personal-hygiene'), 3, 1, true),
  ('Hand Sanitizer',      'हैंड सैनिटाइज़र',  'hand-sanitizer',       (SELECT id FROM spf_categories WHERE slug='personal-hygiene'), 3, 2, true),
  ('Intimate Hygiene',    'इंटिमेट हाइजीन',   'intimate-hygiene',     (SELECT id FROM spf_categories WHERE slug='personal-hygiene'), 3, 3, true),
  ('Dental Care',         'डेंटल केयर',        'dental-care',          (SELECT id FROM spf_categories WHERE slug='personal-hygiene'), 3, 4, true),
  ('Feminine Hygiene',    'फेमिनिन हाइजीन',   'feminine-hygiene',     (SELECT id FROM spf_categories WHERE slug='personal-hygiene'), 3, 5, true),
  ('Cotton & Wipes',      'कॉटन और वाइप्स',   'cotton-wipes',         (SELECT id FROM spf_categories WHERE slug='personal-hygiene'), 3, 6, true)
ON CONFLICT (slug) DO NOTHING;

-- ── L3: Mehendi & Bindi ───────────────────────────────────────────────────────
INSERT INTO spf_categories (name, name_hindi, slug, parent_id, level, display_order, is_active) VALUES
  ('Mehendi / Henna',     'मेहंदी / हेना',    'mehendi-henna',        (SELECT id FROM spf_categories WHERE slug='mehendi-bindi'), 3, 1, true),
  ('Bindi',               'बिंदी',             'bindi',                (SELECT id FROM spf_categories WHERE slug='mehendi-bindi'), 3, 2, true),
  ('Alta / Mahawar',      'आलता / महावर',      'alta-mahawar',         (SELECT id FROM spf_categories WHERE slug='mehendi-bindi'), 3, 3, true),
  ('Sindoor & Kumkum',    'सिंदूर और कुमकुम', 'sindoor-kumkum',       (SELECT id FROM spf_categories WHERE slug='mehendi-bindi'), 3, 4, true),
  ('Mehendi Accessories', 'मेहंदी एक्सेसरीज', 'mehendi-accessories',  (SELECT id FROM spf_categories WHERE slug='mehendi-bindi'), 3, 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Verify counts
SELECT level, COUNT(*) FROM spf_categories GROUP BY level ORDER BY level;
SELECT name, slug FROM spf_categories WHERE slug = 'makeup-beauty';
