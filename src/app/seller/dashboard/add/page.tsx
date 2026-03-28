'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, X, Check, ImagePlus, Tag, Package, Truck, AlertCircle } from 'lucide-react';

/* ─── Category Taxonomy (3 levels) ─────────────────────────────────────────── */

const L1_CATS = [
  { id: 'women',      name: 'Women',          nameHi: 'महिला',       icon: '👩' },
  { id: 'men',        name: 'Men',             nameHi: 'पुरुष',       icon: '👨' },
  { id: 'kids',       name: 'Kids',            nameHi: 'बच्चे',       icon: '👧' },
  { id: 'accessories',name: 'Accessories',     nameHi: 'एक्सेसरीज़',  icon: '💍' },
  { id: 'occasion',   name: 'Occasion Shop',   nameHi: 'अवसर शॉप',   icon: '🎉' },
];

const L2_CATS: Record<string, { id: string; name: string; nameHi: string; icon: string }[]> = {
  women: [
    { id: 'sarees',         name: 'Sarees',               nameHi: 'साड़ियाँ',        icon: '🥻' },
    { id: 'kurtis',         name: 'Kurtis & Kurta Sets',  nameHi: 'कुर्ती सेट',      icon: '👘' },
    { id: 'salwar-suits',   name: 'Salwar Suits',          nameHi: 'सलवार सूट',      icon: '👗' },
    { id: 'lehengas',       name: 'Lehengas',              nameHi: 'लहंगे',           icon: '✨' },
    { id: 'dress-materials',name: 'Dress Materials',       nameHi: 'ड्रेस मटेरियल',  icon: '🧵' },
    { id: 'blouses',        name: 'Blouses',               nameHi: 'ब्लाउज',          icon: '👚' },
    { id: 'dupattas',       name: 'Dupattas & Stoles',     nameHi: 'दुपट्टे',          icon: '🧣' },
    { id: 'western-wear',   name: 'Western Wear',          nameHi: 'वेस्टर्न वियर',   icon: '👖' },
    { id: 'bottom-wear',    name: 'Bottom Wear',           nameHi: 'बॉटम वियर',       icon: '👟' },
    { id: 'innerwear',      name: 'Innerwear & Loungewear',nameHi: 'इनरवियर',         icon: '🩱' },
    { id: 'winter-wear',    name: 'Winter Wear',           nameHi: 'विंटर वियर',      icon: '🧥' },
  ],
  men: [
    { id: 'mens-ethnic',    name: 'Ethnic Wear',           nameHi: 'एथनिक वियर',     icon: '👘' },
    { id: 'mens-top',       name: 'Top Wear',              nameHi: 'टॉप वियर',        icon: '👕' },
    { id: 'mens-bottom',    name: 'Bottom Wear',           nameHi: 'बॉटम वियर',       icon: '👖' },
    { id: 'mens-innerwear', name: 'Innerwear',             nameHi: 'इनरवियर',         icon: '🩲' },
    { id: 'mens-sports',    name: 'Sports & Active Wear',  nameHi: 'स्पोर्ट्स वियर',  icon: '🏋️' },
    { id: 'mens-winter',    name: 'Winter Wear',           nameHi: 'विंटर वियर',      icon: '🧥' },
    { id: 'mens-nightwear', name: 'Night Wear',            nameHi: 'नाइट वियर',       icon: '🌙' },
    { id: 'mens-footwear',  name: 'Footwear',              nameHi: 'फुटवियर',         icon: '👟' },
  ],
  kids: [
    { id: 'girls',   name: 'Girls (2–14 yrs)', nameHi: 'लड़कियाँ', icon: '👧' },
    { id: 'boys',    name: 'Boys (2–14 yrs)',  nameHi: 'लड़के',     icon: '👦' },
    { id: 'infant',  name: 'Infant (0–2 yrs)', nameHi: 'शिशु',     icon: '🍼' },
  ],
  accessories: [
    { id: 'jewellery',    name: 'Jewellery',        nameHi: 'ज्वेलरी',  icon: '💎' },
    { id: 'bags',         name: 'Bags & Clutches',  nameHi: 'बैग्स',    icon: '👜' },
    { id: 'acc-footwear', name: 'Footwear',         nameHi: 'फुटवियर',  icon: '👡' },
    { id: 'watches',      name: 'Watches',          nameHi: 'घड़ियाँ',   icon: '⌚' },
    { id: 'acc-others',   name: 'Others',           nameHi: 'अन्य',     icon: '🎀' },
  ],
  occasion: [
    { id: 'wedding-occ',  name: 'Wedding Collection', nameHi: 'वेडिंग',   icon: '💍' },
    { id: 'festival-occ', name: 'Festival Collection', nameHi: 'फेस्टिवल', icon: '🪔' },
    { id: 'daily-occ',    name: 'Daily Wear',          nameHi: 'डेली',     icon: '☀️' },
    { id: 'party-occ',    name: 'Party Wear',          nameHi: 'पार्टी',   icon: '🎉' },
  ],
};

const L3_CATS: Record<string, { id: string; name: string; nameHi: string }[]> = {
  sarees:         [{ id:'silk-sarees',name:'Silk Sarees',nameHi:'सिल्क साड़ी' },{ id:'cotton-sarees',name:'Cotton Sarees',nameHi:'कॉटन साड़ी' },{ id:'georgette-sarees',name:'Georgette Sarees',nameHi:'जॉर्जेट साड़ी' },{ id:'banarasi-sarees',name:'Banarasi Sarees',nameHi:'बनारसी साड़ी' },{ id:'chiffon-sarees',name:'Chiffon Sarees',nameHi:'शिफॉन साड़ी' },{ id:'printed-sarees',name:'Printed Sarees',nameHi:'प्रिंटेड साड़ी' },{ id:'embroidered-sarees',name:'Embroidered Sarees',nameHi:'कढ़ाई साड़ी' },{ id:'designer-sarees',name:'Designer Sarees',nameHi:'डिज़ाइनर साड़ी' },{ id:'daily-sarees',name:'Daily Wear Sarees',nameHi:'डेली वियर साड़ी' },{ id:'party-sarees',name:'Party Wear Sarees',nameHi:'पार्टी वियर साड़ी' }],
  kurtis:         [{ id:'straight-kurtis',name:'Straight Kurtis',nameHi:'स्ट्रेट कुर्ती' },{ id:'anarkali-kurtis',name:'Anarkali Kurtis',nameHi:'अनारकली कुर्ती' },{ id:'aline-kurtis',name:'A-Line Kurtis',nameHi:'ए-लाइन कुर्ती' },{ id:'kurti-palazzo',name:'Kurti with Palazzo',nameHi:'कुर्ती पलाज़ो' },{ id:'kurti-pant',name:'Kurti with Pant',nameHi:'कुर्ती पैंट' },{ id:'kurti-dupatta',name:'Kurti with Dupatta',nameHi:'कुर्ती दुपट्टा' },{ id:'kurti-set-3pc',name:'Kurti Set (3-piece)',nameHi:'3 पीस कुर्ती सेट' },{ id:'short-kurtis',name:'Short Kurtis',nameHi:'शॉर्ट कुर्ती' },{ id:'long-kurtis',name:'Long Kurtis',nameHi:'लॉन्ग कुर्ती' },{ id:'embroidered-kurtis',name:'Embroidered Kurtis',nameHi:'कढ़ाई कुर्ती' }],
  'salwar-suits': [{ id:'churidar-suits',name:'Churidar Suits',nameHi:'चूड़ीदार सूट' },{ id:'patiala-suits',name:'Patiala Suits',nameHi:'पटियाला सूट' },{ id:'anarkali-suits',name:'Anarkali Suits',nameHi:'अनारकली सूट' },{ id:'pakistani-suits',name:'Pakistani Suits',nameHi:'पाकिस्तानी सूट' },{ id:'unstitched-suits',name:'Unstitched Suits',nameHi:'अनस्टिचड सूट' },{ id:'semi-stitched',name:'Semi-Stitched Suits',nameHi:'सेमी स्टिचड' },{ id:'readymade-suits',name:'Readymade Suits',nameHi:'रेडीमेड सूट' },{ id:'cotton-suits',name:'Cotton Suits',nameHi:'कॉटन सूट' }],
  lehengas:       [{ id:'bridal-lehengas',name:'Bridal Lehengas',nameHi:'ब्राइडल लहंगा' },{ id:'party-lehengas',name:'Party Wear Lehengas',nameHi:'पार्टी लहंगा' },{ id:'festival-lehengas',name:'Festival Lehengas',nameHi:'फेस्टिवल लहंगा' },{ id:'lehenga-choli',name:'Lehenga Choli Sets',nameHi:'लहंगा चोली' },{ id:'half-saree',name:'Half Saree / Langa Voni',nameHi:'हाफ साड़ी' },{ id:'designer-lehengas',name:'Designer Lehengas',nameHi:'डिज़ाइनर लहंगा' }],
  'dress-materials':[{ id:'cotton-dm',name:'Cotton Dress Material',nameHi:'कॉटन' },{ id:'silk-dm',name:'Silk Dress Material',nameHi:'सिल्क' },{ id:'georgette-dm',name:'Georgette Dress Material',nameHi:'जॉर्जेट' },{ id:'embroidered-dm',name:'Embroidered Material',nameHi:'कढ़ाई मटेरियल' },{ id:'printed-dm',name:'Printed Material',nameHi:'प्रिंटेड' },{ id:'churidar-dm',name:'Churidar Material',nameHi:'चूड़ीदार मटेरियल' }],
  blouses:        [{ id:'readymade-blouses',name:'Readymade Blouses',nameHi:'रेडीमेड ब्लाउज' },{ id:'blouse-pieces',name:'Blouse Pieces',nameHi:'ब्लाउज पीस' },{ id:'designer-blouses',name:'Designer Blouses',nameHi:'डिज़ाइनर ब्लाउज' },{ id:'padded-blouses',name:'Padded Blouses',nameHi:'पैडेड ब्लाउज' },{ id:'embroidered-blouses',name:'Embroidered Blouses',nameHi:'कढ़ाई ब्लाउज' }],
  dupattas:       [{ id:'silk-dupattas',name:'Silk Dupattas',nameHi:'सिल्क दुपट्टा' },{ id:'cotton-dupattas',name:'Cotton Dupattas',nameHi:'कॉटन दुपट्टा' },{ id:'embroidered-dupattas',name:'Embroidered Dupattas',nameHi:'कढ़ाई दुपट्टा' },{ id:'printed-dupattas',name:'Printed Dupattas',nameHi:'प्रिंटेड दुपट्टा' },{ id:'bandhani-dupattas',name:'Bandhani Dupattas',nameHi:'बंधनी दुपट्टा' },{ id:'phulkari-dupattas',name:'Phulkari Dupattas',nameHi:'फुलकारी दुपट्टा' },{ id:'stoles',name:'Stoles & Shawls',nameHi:'स्टोल और शॉल' }],
  'western-wear': [{ id:'tops-tunics',name:'Tops & Tunics',nameHi:'टॉप्स' },{ id:'western-tshirts',name:'T-Shirts',nameHi:'टी-शर्ट' },{ id:'western-jeans',name:'Jeans',nameHi:'जींस' },{ id:'dresses',name:'Dresses',nameHi:'ड्रेसेज़' },{ id:'crop-tops',name:'Crop Tops',nameHi:'क्रॉप टॉप' },{ id:'jumpsuits',name:'Jumpsuits',nameHi:'जंपसूट' },{ id:'western-shirts',name:'Shirts',nameHi:'शर्ट' }],
  'bottom-wear':  [{ id:'palazzos',name:'Palazzos',nameHi:'पलाज़ो' },{ id:'leggings',name:'Leggings',nameHi:'लेगिंग्स' },{ id:'pants-trousers',name:'Pants & Trousers',nameHi:'पैंट' },{ id:'skirts',name:'Skirts',nameHi:'स्कर्ट' },{ id:'culottes',name:'Culottes',nameHi:'क्यूलोट्स' },{ id:'jeggings',name:'Jeggings',nameHi:'जेगिंग्स' },{ id:'sharara',name:'Sharara Pants',nameHi:'शरारा' }],
  innerwear:      [{ id:'bras',name:'Bras',nameHi:'ब्रा' },{ id:'panties',name:'Panties',nameHi:'पैंटीज़' },{ id:'nightgowns',name:'Nightgowns',nameHi:'नाइटगाउन' },{ id:'night-suits',name:'Night Suits',nameHi:'नाइट सूट' },{ id:'loungewear',name:'Loungewear Sets',nameHi:'लाउंजवियर' },{ id:'camisoles',name:'Camisoles',nameHi:'कैमीसोल' }],
  'winter-wear':  [{ id:'sweaters',name:'Sweaters',nameHi:'स्वेटर' },{ id:'shawls',name:'Shawls & Wraps',nameHi:'शॉल' },{ id:'jackets',name:'Jackets',nameHi:'जैकेट' },{ id:'thermals-women',name:'Thermals',nameHi:'थर्मल' },{ id:'woolen-kurtis',name:'Woolen Kurtis',nameHi:'ऊनी कुर्ती' }],
  'mens-ethnic':  [{ id:'kurtas',name:'Kurtas',nameHi:'कुर्ता' },{ id:'kurta-pajama',name:'Kurta Pajama Sets',nameHi:'कुर्ता पजामा' },{ id:'nehru-jackets',name:'Nehru Jackets',nameHi:'नेहरू जैकेट' },{ id:'sherwanis',name:'Sherwanis',nameHi:'शेरवानी' },{ id:'dhotis',name:'Dhotis & Lungis',nameHi:'धोती लुंगी' },{ id:'pathani',name:'Pathani Suits',nameHi:'पठानी सूट' }],
  'mens-top':     [{ id:'mens-tshirts',name:'T-Shirts',nameHi:'टी-शर्ट' },{ id:'casual-shirts',name:'Casual Shirts',nameHi:'कैजुअल शर्ट' },{ id:'formal-shirts',name:'Formal Shirts',nameHi:'फॉर्मल शर्ट' },{ id:'polo-tshirts',name:'Polo T-Shirts',nameHi:'पोलो टी-शर्ट' },{ id:'oversized',name:'Oversized T-Shirts',nameHi:'ओवरसाइज़' }],
  'mens-bottom':  [{ id:'mens-jeans',name:'Jeans',nameHi:'जींस' },{ id:'casual-trousers',name:'Casual Trousers',nameHi:'कैजुअल ट्राउज़र' },{ id:'formal-trousers',name:'Formal Trousers',nameHi:'फॉर्मल ट्राउज़र' },{ id:'cargo-pants',name:'Cargo Pants',nameHi:'कार्गो पैंट' },{ id:'mens-track',name:'Track Pants',nameHi:'ट्रैक पैंट' },{ id:'shorts',name:'Shorts',nameHi:'शॉर्ट्स' },{ id:'joggers',name:'Joggers',nameHi:'जॉगर्स' }],
  'mens-innerwear':[{ id:'vests',name:'Vests',nameHi:'बनियान' },{ id:'briefs',name:'Briefs',nameHi:'ब्रीफ़्स' },{ id:'boxers',name:'Boxers',nameHi:'बॉक्सर्स' },{ id:'trunks',name:'Trunks',nameHi:'ट्रंक्स' }],
  'mens-sports':  [{ id:'sports-track',name:'Track Pants',nameHi:'ट्रैक पैंट' },{ id:'track-suits',name:'Track Suits',nameHi:'ट्रैक सूट' },{ id:'gym-tshirts',name:'Gym T-Shirts',nameHi:'जिम टी-शर्ट' },{ id:'sports-shorts',name:'Sports Shorts',nameHi:'स्पोर्ट्स शॉर्ट्स' }],
  'mens-winter':  [{ id:'mens-jackets',name:'Jackets',nameHi:'जैकेट' },{ id:'mens-sweaters',name:'Sweaters',nameHi:'स्वेटर' },{ id:'hoodies',name:'Hoodies',nameHi:'हुडी' },{ id:'sweatshirts',name:'Sweatshirts',nameHi:'स्वेटशर्ट' }],
  'mens-nightwear':[{ id:'pyjamas',name:'Pyjamas',nameHi:'पजामा' },{ id:'mens-nightsuit',name:'Night Suits',nameHi:'नाइट सूट' }],
  'mens-footwear':[{ id:'casual-shoes',name:'Casual Shoes',nameHi:'कैजुअल शूज़' },{ id:'formal-shoes',name:'Formal Shoes',nameHi:'फॉर्मल शूज़' },{ id:'sports-shoes',name:'Sports Shoes',nameHi:'स्पोर्ट्स शूज़' },{ id:'sandals',name:'Sandals & Slippers',nameHi:'सैंडल' },{ id:'juttis',name:'Ethnic Footwear (Juttis)',nameHi:'जूतियाँ' }],
  girls:          [{ id:'girls-ethnic',name:'Ethnic Wear',nameHi:'एथनिक वियर' },{ id:'girls-dresses',name:'Dresses & Frocks',nameHi:'फ्रॉक' },{ id:'girls-tops',name:'Tops & T-Shirts',nameHi:'टॉप्स' },{ id:'girls-pants',name:'Pants & Leggings',nameHi:'पैंट' },{ id:'girls-sets',name:'Sets & Combos',nameHi:'सेट' },{ id:'girls-party',name:'Party Wear',nameHi:'पार्टी वियर' }],
  boys:           [{ id:'boys-ethnic',name:'Ethnic Wear',nameHi:'एथनिक वियर' },{ id:'boys-tshirts',name:'T-Shirts & Shirts',nameHi:'टी-शर्ट' },{ id:'boys-pants',name:'Pants & Shorts',nameHi:'पैंट' },{ id:'boys-sets',name:'Sets & Combos',nameHi:'सेट' },{ id:'boys-party',name:'Party Wear',nameHi:'पार्टी वियर' },{ id:'boys-winter',name:'Winter Wear',nameHi:'विंटर वियर' }],
  infant:         [{ id:'rompers',name:'Rompers & Onesies',nameHi:'रोम्पर्स' },{ id:'infant-sets',name:'Sets',nameHi:'सेट' },{ id:'infant-dresses',name:'Dresses (Girls)',nameHi:'फ्रॉक' },{ id:'infant-kurta',name:'Kurta Sets (Boys)',nameHi:'कुर्ता' }],
  jewellery:      [{ id:'necklace-sets',name:'Necklace Sets',nameHi:'नेकलेस सेट' },{ id:'earrings',name:'Earrings',nameHi:'इयररिंग्स' },{ id:'bangles',name:'Bangles & Bracelets',nameHi:'चूड़ियाँ' },{ id:'anklets',name:'Anklets (Payal)',nameHi:'पायल' },{ id:'maang-tikka',name:'Maang Tikka',nameHi:'मांग टीका' },{ id:'nose-rings',name:'Nose Rings',nameHi:'नथनी' },{ id:'rings',name:'Rings',nameHi:'अंगूठी' },{ id:'bridal-jewellery',name:'Bridal Jewellery Sets',nameHi:'ब्राइडल ज्वेलरी' }],
  bags:           [{ id:'handbags',name:'Handbags',nameHi:'हैंडबैग' },{ id:'clutches',name:'Clutches',nameHi:'क्लच' },{ id:'tote-bags',name:'Tote Bags',nameHi:'टोट बैग' },{ id:'sling-bags',name:'Sling Bags',nameHi:'स्लिंग बैग' },{ id:'potli-bags',name:'Potli Bags (Ethnic)',nameHi:'पोटली बैग' }],
  'acc-footwear': [{ id:'women-sandals',name:'Women Sandals',nameHi:'सैंडल' },{ id:'women-heels',name:'Women Heels',nameHi:'हील्स' },{ id:'women-flats',name:'Women Flats',nameHi:'फ्लैट्स' },{ id:'juttis-women',name:'Juttis & Mojaris',nameHi:'जूतियाँ' },{ id:'kolhapuri',name:'Kolhapuri Chappals',nameHi:'कोल्हापुरी' }],
  watches:        [{ id:'women-watches',name:'Women Watches',nameHi:'महिला घड़ी' },{ id:'men-watches',name:'Men Watches',nameHi:'पुरुष घड़ी' },{ id:'kids-watches',name:'Kids Watches',nameHi:'बच्चों की घड़ी' }],
  'acc-others':   [{ id:'belts',name:'Belts',nameHi:'बेल्ट' },{ id:'sunglasses',name:'Sunglasses',nameHi:'सनग्लासेज़' },{ id:'hair-accessories',name:'Hair Accessories',nameHi:'हेयर एक्सेसरीज़' },{ id:'scarves',name:'Scarves & Stoles',nameHi:'स्कार्फ' }],
  'wedding-occ':  [{ id:'bridal-wear',name:'Bridal Wear',nameHi:'ब्राइडल वियर' },{ id:'groom-wear',name:'Groom Wear',nameHi:'ग्रूम वियर' },{ id:'wedding-guest-w',name:'Guest Outfits (Women)',nameHi:'गेस्ट आउटफिट' },{ id:'mehendi-haldi',name:'Mehendi & Haldi Wear',nameHi:'मेहंदी हल्दी' },{ id:'sangeet',name:'Sangeet Outfits',nameHi:'संगीत आउटफिट' }],
  'festival-occ': [{ id:'diwali',name:'Diwali Special',nameHi:'दिवाली' },{ id:'chhath',name:'Chhath Puja Special',nameHi:'छठ पूजा' },{ id:'eid-occ',name:'Eid Collection',nameHi:'ईद' },{ id:'navratri-occ',name:'Navratri / Durga Puja',nameHi:'नवरात्रि' },{ id:'holi-occ',name:'Holi Special',nameHi:'होली' }],
  'daily-occ':    [{ id:'office-women',name:'Office Wear (Women)',nameHi:'ऑफिस वियर' },{ id:'office-men',name:'Office Wear (Men)',nameHi:'ऑफिस वियर' },{ id:'college',name:'College / Campus',nameHi:'कॉलेज' },{ id:'casual-everyday',name:'Casual Everyday',nameHi:'कैजुअल' }],
  'party-occ':    [{ id:'evening',name:'Evening / Cocktail',nameHi:'इवनिंग' },{ id:'birthday',name:'Birthday Party',nameHi:'बर्थडे' },{ id:'anniversary',name:'Anniversary',nameHi:'एनिवर्सरी' },{ id:'reception',name:'Reception Wear',nameHi:'रिसेप्शन' }],
};

/* ─── Occasion tags ─────────────────────────────────────────────────────────── */
const OCCASION_TAGS = [
  { id: 'wedding',        label: 'Wedding Season',   labelHi: 'वेडिंग सीज़न',   icon: '💍' },
  { id: 'chhath',         label: 'Chhath Puja',      labelHi: 'छठ पूजा',         icon: '🙏' },
  { id: 'diwali',         label: 'Diwali',            labelHi: 'दिवाली',           icon: '🪔' },
  { id: 'eid',            label: 'Eid',               labelHi: 'ईद',              icon: '🌙' },
  { id: 'navratri',       label: 'Navratri',          labelHi: 'नवरात्रि',         icon: '🎭' },
  { id: 'daily-office',   label: 'Daily Office',      labelHi: 'ऑफिस वियर',       icon: '👔' },
  { id: 'college',        label: 'College / Campus',  labelHi: 'कॉलेज',            icon: '🎓' },
  { id: 'party',          label: 'Party Wear',        labelHi: 'पार्टी वियर',      icon: '🎉' },
  { id: 'anniversary',    label: 'Anniversary',       labelHi: 'एनिवर्सरी',        icon: '💕' },
  { id: 'mehendi',        label: 'Mehendi / Haldi',   labelHi: 'मेहंदी/हल्दी',     icon: '🌸' },
  { id: 'sangeet',        label: 'Sangeet',           labelHi: 'संगीत',            icon: '🎵' },
  { id: 'raksha-bandhan', label: 'Raksha Bandhan',    labelHi: 'रक्षाबंधन',         icon: '🎀' },
  { id: 'karwa-chauth',   label: 'Karwa Chauth',      labelHi: 'करवाचौथ',           icon: '🌕' },
  { id: 'holi',           label: 'Holi',              labelHi: 'होली',             icon: '🎨' },
  { id: 'casual',         label: 'Casual Everyday',   labelHi: 'कैजुअल',           icon: '☀️' },
];

const COLORS_LIST = [
  { name: 'Red', hex: '#EF4444' },       { name: 'Maroon', hex: '#7F1D1D' },
  { name: 'Pink', hex: '#EC4899' },      { name: 'Orange', hex: '#F97316' },
  { name: 'Yellow', hex: '#EAB308' },    { name: 'Gold', hex: '#C49A3C' },
  { name: 'Green', hex: '#22C55E' },     { name: 'Teal', hex: '#14B8A6' },
  { name: 'Blue', hex: '#3B82F6' },      { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Purple', hex: '#A855F7' },    { name: 'Lavender', hex: '#C4B5FD' },
  { name: 'Black', hex: '#111827' },     { name: 'White', hex: '#F9FAFB' },
  { name: 'Beige', hex: '#D2B48C' },     { name: 'Brown', hex: '#92400E' },
  { name: 'Grey', hex: '#6B7280' },      { name: 'Cream', hex: '#FFFBEB' },
];

const SIZES_LIST   = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
const FABRIC_OPTS  = ['Cotton', 'Silk', 'Georgette', 'Chiffon', 'Polyester', 'Rayon', 'Linen', 'Net', 'Velvet', 'Wool', 'Blend', 'Other'];
const WORK_OPTS    = ['Embroidered', 'Printed', 'Woven', 'Zari', 'Sequin', 'Mirror Work', 'Handloom', 'Block Print', 'Bandhani', 'Chikankari', 'Kalamkari', 'Plain'];
const PATTERN_OPTS = ['Solid', 'Printed', 'Striped', 'Checked', 'Floral', 'Abstract', 'Geometric', 'Paisley'];
const WASH_OPTS    = ['Hand Wash', 'Machine Wash', 'Dry Clean Only', 'Gentle Wash'];
const GST_OPTS     = [{ label: 'Exempt (0%)', value: 0 }, { label: '5% (Cotton < ₹1000)', value: 5 }, { label: '12% (Synthetic / > ₹1000)', value: 12 }, { label: '18%', value: 18 }];

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function SectionCard({ title, titleHi, badge, children }: { title: string; titleHi?: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-[#333333]" style={{ fontFamily: 'var(--font-dm-sans,DM Sans,sans-serif)' }}>{title}</h3>
        {titleHi && <span className="text-xs italic text-[#C49A3C]">{titleHi}</span>}
        {badge}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-[#666666] mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const INPUT_CLS = 'w-full px-3 py-2 text-sm border border-[#E8E0E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 focus:border-[#C49A3C] bg-white text-[#333333] transition-colors';

/* ─── Main Page ─────────────────────────────────────────────────────────────── */

export default function AddProductPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [sellerId, setSellerId]   = useState('');
  const [sellerName, setSellerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  /* Category selection */
  const [l1, setL1] = useState('');
  const [l2, setL2] = useState('');
  const [l3, setL3] = useState('');
  const [catSearch, setCatSearch] = useState('');

  /* Product details */
  const [name, setName]         = useState('');
  const [nameHi, setNameHi]     = useState('');
  const [description, setDescription]   = useState('');
  const [brand, setBrand]       = useState('');
  const [tags, setTags]         = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  /* Photos */
  const [images, setImages]       = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');

  /* Pricing */
  const [mrp, setMrp]     = useState('');
  const [price, setPrice] = useState('');
  const [gst, setGst]     = useState(5);
  const [stock, setStock] = useState('');
  const [lowStockAlert, setLowStockAlert] = useState('10');

  /* Specs */
  const [fabric, setFabric]       = useState('');
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [colors, setColors]       = useState<string[]>([]);
  const [sizes, setSizes]         = useState<string[]>([]);
  const [pattern, setPattern]     = useState('');
  const [washCare, setWashCare]   = useState('');

  /* Occasion tags */
  const [occasionTags, setOccasionTags] = useState<string[]>([]);

  /* Shipping */
  const [weight, setWeight]           = useState('');
  const [dispatchTime, setDispatchTime] = useState('2');

  /* Declarations */
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/sellers/me?userId=${user.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.seller) {
          setSellerId(d.seller.id);
          setSellerName(d.seller.businessName || user.name || 'Seller');
        }
      });
  }, [user?.id]);

  /* Derived values */
  const discountPct = mrp && price && parseFloat(mrp) > parseFloat(price)
    ? Math.round((1 - parseFloat(price) / parseFloat(mrp)) * 100) : 0;
  const l1Label = L1_CATS.find(c => c.id === l1);
  const l2Label = (L2_CATS[l1] || []).find(c => c.id === l2);
  const l3Label = (L3_CATS[l2] || []).find(c => c.id === l3);

  /* Category search */
  const catSearchResults = useMemo(() => {
    if (!catSearch.trim() || catSearch.length < 2) return [];
    const q = catSearch.toLowerCase();
    const results: { l1Id: string; l1Name: string; l2Id: string; l2Name: string; l3Id: string; l3Name: string }[] = [];
    for (const [l2Id, l3List] of Object.entries(L3_CATS)) {
      const l2Cat = Object.values(L2_CATS).flat().find(c => c.id === l2Id);
      const l1Entry = Object.entries(L2_CATS).find(([, v]) => v.some(c => c.id === l2Id));
      if (!l2Cat || !l1Entry) continue;
      const l1Cat = L1_CATS.find(c => c.id === l1Entry[0]);
      if (!l1Cat) continue;
      for (const l3 of l3List) {
        if (l3.name.toLowerCase().includes(q) || l2Cat.name.toLowerCase().includes(q) || l1Cat.name.toLowerCase().includes(q)) {
          results.push({ l1Id: l1Cat.id, l1Name: l1Cat.name, l2Id, l2Name: l2Cat.name, l3Id: l3.id, l3Name: l3.name });
          if (results.length >= 8) return results;
        }
      }
    }
    return results;
  }, [catSearch]);

  function selectL1(id: string) { setL1(id); setL2(''); setL3(''); setCatSearch(''); }
  function selectL2(id: string) { setL2(id); setL3(''); }
  function selectL3(id: string) { setL3(id); }
  function resetCat() { setL1(''); setL2(''); setL3(''); }
  function toggleMulti(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }
  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) { setTags(p => [...p, t]); setTagInput(''); }
  }
  function addImage() {
    const url = imageInput.trim();
    if (url && !images.includes(url) && images.length < 8) { setImages(p => [...p, url]); setImageInput(''); }
  }

  const isValid = name && l3 && description && price && stock && checked1 && checked2 && sellerId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isValid) { setError('Please fill all required fields and check the declarations.'); return; }
    setSubmitting(true);
    try {
      const body = {
        sellerId, name, nameHi: nameHi || undefined,
        category: l1, subCategory: l2,
        productType: l3,
        description, brand: brand || undefined,
        tags,
        fabric: fabric || undefined,
        price: parseFloat(price),
        originalPrice: parseFloat(mrp) || parseFloat(price),
        gstRate: gst,
        stockQuantity: parseInt(stock),
        lowStockAlert: parseInt(lowStockAlert) || 10,
        sizes, colors: colors.map(c => ({ name: c, hex: COLORS_LIST.find(x => x.name === c)?.hex || '#000' })),
        workTypes, pattern: pattern || undefined, washCare: washCare || undefined,
        occasionTags,
        weight: weight ? parseInt(weight) : undefined,
        dispatchTime: parseInt(dispatchTime),
        images, mainImage: images[0] || undefined,
        approvalStatus: 'pending', isActive: false,
      };
      const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create product'); }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit product');
    } finally { setSubmitting(false); }
  }

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16" style={{ fontFamily: 'var(--font-dm-sans,DM Sans,sans-serif)' }}>
        <div className="w-16 h-16 rounded-full bg-[#F5EDF2] flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5B1A3A" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-xl font-semibold text-[#5B1A3A] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Product Submitted for Review!</h2>
        <p className="text-sm text-[#666] mb-1">Your product is now in the QC pipeline.</p>
        <p className="text-sm text-[#999] mb-6">Our team will approve it within 24 hours — you'll be notified.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSubmitted(false); setName(''); setDescription(''); setPrice(''); setMrp(''); setStock(''); setSizes([]); setColors([]); setImages([]); setL1(''); setL2(''); setL3(''); setOccasionTags([]); setChecked1(false); setChecked2(false); }}
            className="px-5 py-2.5 text-sm font-semibold border border-[#E8E0E4] rounded-lg text-[#5B1A3A] hover:bg-[#F5EDF2] transition-colors">
            Add Another Product
          </button>
          <button onClick={() => router.push('/seller/dashboard/qc')}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
            View QC Status
          </button>
        </div>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'var(--font-dm-sans,DM Sans,sans-serif)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ══ LEFT: Form (65%) ══ */}
        <div className="lg:col-span-3 space-y-5">

          {/* ── Section 1: Category ── */}
          <SectionCard title="Category Selection" titleHi="कैटेगरी चुनें">

            {/* Search */}
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
              <input value={catSearch} onChange={e => setCatSearch(e.target.value)}
                placeholder="Search category… e.g. Banarasi Saree, Kurta"
                className={`${INPUT_CLS} pl-8 text-xs`} />
              {catSearchResults.length > 0 && catSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E0E4] rounded-xl shadow-lg z-20 max-h-56 overflow-y-auto">
                  {catSearchResults.map(r => (
                    <button key={r.l3Id} type="button"
                      onClick={() => { selectL1(r.l1Id); selectL2(r.l2Id); selectL3(r.l3Id); setCatSearch(''); }}
                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-[#F5EDF2] transition-colors flex items-center gap-1.5 border-b border-[#E8E0E4]/50 last:border-0">
                      <span className="text-[#999]">{r.l1Name}</span>
                      <ChevronRight size={10} className="text-[#C49A3C]" />
                      <span className="text-[#666]">{r.l2Name}</span>
                      <ChevronRight size={10} className="text-[#C49A3C]" />
                      <span className="font-semibold text-[#5B1A3A]">{r.l3Name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected breadcrumb */}
            {l3 && l1Label && l2Label && l3Label ? (
              <div className="flex items-center justify-between p-3 bg-[#F5EDF2] border border-[rgba(196,154,60,0.15)] rounded-xl mb-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5B1A3A]">
                  <span>{l1Label.icon} {l1Label.name}</span>
                  <ChevronRight size={12} className="text-[#C49A3C]" />
                  <span>{l2Label.name}</span>
                  <ChevronRight size={12} className="text-[#C49A3C]" />
                  <span>{l3Label.name}</span>
                </div>
                <button type="button" onClick={resetCat} className="text-xs text-[#C49A3C] font-medium hover:underline">Change</button>
              </div>
            ) : (
              <>
                {/* Step 1: Main category */}
                <div className="mb-1">
                  <p className="text-xs font-medium text-[#666] mb-2">Step 1: Main Category <span className="text-red-500">*</span></p>
                  <div className="flex flex-wrap gap-2">
                    {L1_CATS.map(c => (
                      <button key={c.id} type="button" onClick={() => selectL1(c.id)}
                        className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-[14px] border transition-all duration-200 min-w-[80px]"
                        style={l1 === c.id
                          ? { borderColor: '#5B1A3A', borderWidth: '2px', background: '#F5EDF2', boxShadow: '0 4px 15px rgba(91,26,58,0.1)' }
                          : { borderColor: '#E8E0E4', background: 'white' }}>
                        <span className="text-xl">{c.icon}</span>
                        <span className="text-xs font-semibold text-[#333]">{c.name}</span>
                        <span className="text-[9px] italic text-[#C49A3C]">{c.nameHi}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Subcategory */}
                {l1 && (L2_CATS[l1] || []).length > 0 && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-medium text-[#666] mb-2">Step 2: Subcategory <span className="text-red-500">*</span></p>
                    <div className="flex flex-wrap gap-2">
                      {(L2_CATS[l1] || []).map(c => (
                        <button key={c.id} type="button" onClick={() => selectL2(c.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                          style={l2 === c.id
                            ? { background: '#5B1A3A', color: 'white', borderColor: '#5B1A3A', boxShadow: '0 2px 8px rgba(91,26,58,0.2)' }
                            : { background: 'white', color: '#555', borderColor: '#E8E0E4' }}>
                          <span>{c.icon}</span> {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Product type */}
                {l2 && (L3_CATS[l2] || []).length > 0 && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-medium text-[#666] mb-2">Step 3: Product Type <span className="text-red-500">*</span></p>
                    <div className="flex flex-wrap gap-2">
                      {(L3_CATS[l2] || []).map(c => (
                        <button key={c.id} type="button" onClick={() => selectL3(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs transition-all"
                          style={l3 === c.id
                            ? { borderColor: '#C49A3C', borderWidth: '2px', background: 'rgba(196,154,60,0.08)', color: '#5B1A3A', fontWeight: 700 }
                            : { background: 'white', color: '#666', borderColor: '#E8E0E4' }}>
                          {l3 === c.id && <Check size={10} />} {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </SectionCard>

          {/* ── Section 2: Product Details ── */}
          <SectionCard title="Product Details" titleHi="प्रोडक्ट जानकारी">
            <div className="space-y-4">
              <div>
                <FieldLabel required>Product Title (English)</FieldLabel>
                <input value={name} onChange={e => setName(e.target.value)} maxLength={120}
                  placeholder="e.g. Pure Banarasi Silk Saree with Zari Border"
                  className={INPUT_CLS} />
                <p className="text-[10px] text-[#999] mt-0.5 text-right">{name.length}/120</p>
              </div>
              <div>
                <FieldLabel>Product Title (Hindi) — ऐच्छिक</FieldLabel>
                <input value={nameHi} onChange={e => setNameHi(e.target.value)} maxLength={120}
                  placeholder="e.g. शुद्ध बनारसी सिल्क साड़ी ज़री बॉर्डर के साथ"
                  className={INPUT_CLS} />
              </div>
              <div>
                <FieldLabel required>Description</FieldLabel>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  placeholder="Describe the product — fabric, design, occasion, wash care, what's included…"
                  className={`${INPUT_CLS} resize-none`} />
                <p className="text-[10px] text-[#999] mt-0.5">{description.length}/2000 chars (min 50)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Brand Name</FieldLabel>
                  <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Leave blank if unbranded"
                    className={INPUT_CLS} />
                </div>
                <div>
                  <FieldLabel>Tags / Keywords</FieldLabel>
                  <div className="flex gap-2">
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="e.g. silk, wedding" className={`${INPUT_CLS} flex-1`} />
                    <button type="button" onClick={addTag}
                      className="px-3 py-2 text-xs font-semibold text-white rounded-lg" style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
                      <Tag size={12} />
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5EDF2] text-[#5B1A3A] text-[10px] rounded-full font-medium">
                          {t}
                          <button type="button" onClick={() => setTags(p => p.filter(x => x !== t))} className="text-[#999] hover:text-[#5B1A3A]"><X size={8} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── Section 3: Photos ── */}
          <SectionCard title="Photos & Videos" titleHi="फोटो और वीडियो">
            {/* Guidelines */}
            <div className="p-3 bg-[#F5EDF2] border border-[rgba(196,154,60,0.15)] rounded-xl mb-4 text-xs text-[#666] space-y-1">
              <p className="font-semibold text-[#5B1A3A] mb-1.5">📸 Photo Guidelines</p>
              {['Use white / plain background', 'Minimum 3 photos from different angles', 'Include close-up of fabric texture', 'No watermarks or text on images', 'Minimum resolution: 800×800px'].map(tip => (
                <p key={tip} className="flex items-center gap-1.5"><Check size={10} className="text-[#C49A3C]" />{tip}</p>
              ))}
            </div>

            {/* Image grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[0,1,2,3,4,5,6,7].map(i => (
                <div key={i} className="aspect-square relative">
                  {images[i] ? (
                    <div className="relative w-full h-full">
                      <img src={images[i]} alt="" className="w-full h-full object-cover rounded-xl border border-[#E8E0E4]" />
                      {i === 0 && <span className="absolute top-1 left-1 text-[8px] px-1.5 py-0.5 text-white rounded-md font-bold" style={{ background: '#5B1A3A' }}>Main ★</span>}
                      <button type="button" onClick={() => setImages(p => p.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center shadow">
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-full border-2 border-dashed border-[#E8E0E4] rounded-xl flex flex-col items-center justify-center gap-1 text-[#CCC] hover:border-[#C49A3C]/50 transition-colors cursor-pointer">
                      <ImagePlus size={16} />
                      {i === 0 && <span className="text-[8px] text-[#999]">Main</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input value={imageInput} onChange={e => setImageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                placeholder="Paste image URL here…"
                className={`${INPUT_CLS} flex-1 text-xs`} />
              <button type="button" onClick={addImage} disabled={images.length >= 8}
                className="px-4 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
                Add
              </button>
            </div>
            <p className="text-[10px] text-[#999] mt-1.5">{images.length}/8 photos {images.length < 3 ? `— ${3 - images.length} more required` : '✓'}</p>

            {/* Video callout */}
            <div className="mt-3 p-3 bg-[#FFFBEB] border border-[rgba(196,154,60,0.2)] rounded-xl text-xs text-[#5B1A3A] flex items-center gap-2">
              <span className="text-base">🌟</span>
              <span><strong>Products with videos get 3× more orders!</strong> <span className="text-[#999]">वीडियो वाले प्रोडक्ट को 3 गुना ज़्यादा ऑर्डर मिलते हैं।</span></span>
            </div>
          </SectionCard>

          {/* ── Section 4: Pricing ── */}
          <SectionCard title="Pricing & Stock" titleHi="कीमत और स्टॉक">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <FieldLabel required>MRP (₹)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#999]">₹</span>
                  <input type="number" value={mrp} onChange={e => setMrp(e.target.value)} min="0" placeholder="0"
                    className={`${INPUT_CLS} pl-7`} />
                </div>
              </div>
              <div>
                <FieldLabel required>Selling Price (₹)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#999]">₹</span>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} min="0" placeholder="0"
                    className={`${INPUT_CLS} pl-7`} />
                </div>
                {discountPct > 0 && <p className="text-[10px] text-green-600 mt-0.5 font-semibold">{discountPct}% off</p>}
              </div>
              <div>
                <FieldLabel required>GST Rate</FieldLabel>
                <select value={gst} onChange={e => setGst(Number(e.target.value))} className={INPUT_CLS}>
                  {GST_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel required>Stock Quantity</FieldLabel>
                <input type="number" value={stock} onChange={e => setStock(e.target.value)} min="0" placeholder="0"
                  className={INPUT_CLS} />
              </div>
              <div>
                <FieldLabel>Low Stock Alert (pieces)</FieldLabel>
                <input type="number" value={lowStockAlert} onChange={e => setLowStockAlert(e.target.value)} min="0"
                  className={INPUT_CLS} />
              </div>
            </div>

            {/* Pricing summary */}
            {price && (
              <div className="p-3 border border-[rgba(196,154,60,0.2)] rounded-xl bg-[#FFFBEB] text-xs space-y-1.5">
                <p className="font-semibold text-[#5B1A3A] mb-1">Price Breakdown</p>
                {[
                  { label: 'MRP', val: mrp ? `₹${parseFloat(mrp).toLocaleString('en-IN')}` : '—' },
                  { label: `Selling Price${discountPct > 0 ? ` (${discountPct}% off)` : ''}`, val: `₹${parseFloat(price).toLocaleString('en-IN')}`, highlight: true },
                  { label: `GST (${gst}%)`, val: `₹${(parseFloat(price) * gst / (100 + gst)).toFixed(0)}` },
                  { label: 'Customer Pays', val: `₹${parseFloat(price).toLocaleString('en-IN')}`, bold: true },
                  { label: 'You Receive (0% commission)', val: `₹${parseFloat(price).toLocaleString('en-IN')}`, bold: true, color: '#2E7D32' },
                ].map(r => (
                  <div key={r.label} className={`flex justify-between ${r.bold ? 'font-semibold border-t border-[rgba(196,154,60,0.1)] pt-1' : ''}`}>
                    <span className="text-[#666]">{r.label}</span>
                    <span style={{ color: r.color || (r.highlight ? '#5B1A3A' : '#333') }}>{r.val}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Section 5: Fabric & Specs ── */}
          <SectionCard title="Fabric & Specifications" titleHi="कपड़ा और विशेषताएं">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <FieldLabel>Fabric / Material</FieldLabel>
                <select value={fabric} onChange={e => setFabric(e.target.value)} className={INPUT_CLS}>
                  <option value="">Select fabric</option>
                  {FABRIC_OPTS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Pattern</FieldLabel>
                <select value={pattern} onChange={e => setPattern(e.target.value)} className={INPUT_CLS}>
                  <option value="">Select pattern</option>
                  {PATTERN_OPTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <FieldLabel>Wash Care</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {WASH_OPTS.map(w => (
                    <button key={w} type="button" onClick={() => setWashCare(washCare === w ? '' : w)}
                      className="px-3 py-1.5 rounded-full border text-xs transition-all"
                      style={washCare === w ? { background: '#5B1A3A', color: 'white', borderColor: '#5B1A3A' } : { background: 'white', color: '#666', borderColor: '#E8E0E4' }}>
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <FieldLabel>Work / Design (multi-select)</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {WORK_OPTS.map(w => (
                  <button key={w} type="button" onClick={() => toggleMulti(workTypes, setWorkTypes, w)}
                    className="px-2.5 py-1 rounded-full border text-xs transition-all"
                    style={workTypes.includes(w) ? { borderColor: '#C49A3C', borderWidth: '2px', background: 'rgba(196,154,60,0.08)', color: '#5B1A3A', fontWeight: 700 } : { background: 'white', color: '#666', borderColor: '#E8E0E4' }}>
                    {workTypes.includes(w) && '✓ '}{w}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <FieldLabel>Available Sizes</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {SIZES_LIST.map(s => (
                  <button key={s} type="button" onClick={() => toggleMulti(sizes, setSizes, s)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                    style={sizes.includes(s) ? { background: 'linear-gradient(135deg,#5B1A3A,#7A2350)', color: 'white', borderColor: '#5B1A3A' } : { background: 'white', color: '#555', borderColor: '#E8E0E4' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Colors</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {COLORS_LIST.map(c => (
                  <button key={c.name} type="button" onClick={() => toggleMulti(colors, setColors, c.name)} title={c.name}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{ background: c.hex, borderColor: colors.includes(c.name) ? '#5B1A3A' : 'transparent', transform: colors.includes(c.name) ? 'scale(1.15)' : 'scale(1)', boxShadow: colors.includes(c.name) ? '0 0 0 2px #F5EDF2' : 'none' }} />
                ))}
              </div>
              {colors.length > 0 && <p className="text-[10px] text-[#999] mt-1.5">Selected: {colors.join(', ')}</p>}
            </div>
          </SectionCard>

          {/* ── Section 6: Occasion Tags ── */}
          <SectionCard
            title="Occasion Tags"
            titleHi="अवसर टैग"
            badge={<span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg,#C49A3C,#DDB868)', color: 'white' }}>✨ IFP Special</span>}>
            <p className="text-xs text-[#666] mb-3">Tag occasions to appear in IFP's Occasion Shop — reaching more customers! <span className="italic text-[#C49A3C]">अवसर टैग से ज़्यादा ग्राहक मिलते हैं!</span></p>
            <div className="flex flex-wrap gap-2">
              {OCCASION_TAGS.map(t => (
                <button key={t.id} type="button" onClick={() => toggleMulti(occasionTags, setOccasionTags, t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all"
                  style={occasionTags.includes(t.id) ? { borderColor: '#C49A3C', borderWidth: '2px', background: 'rgba(196,154,60,0.08)', color: '#5B1A3A', fontWeight: 700 } : { background: 'white', color: '#666', borderColor: '#E8E0E4' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* ── Section 7: Shipping ── */}
          <SectionCard title="Shipping" titleHi="शिपिंग">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Package Weight (grams)</FieldLabel>
                <div className="relative">
                  <Package size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)} min="0" placeholder="500"
                    className={`${INPUT_CLS} pl-8`} />
                </div>
              </div>
              <div>
                <FieldLabel>Dispatch Time</FieldLabel>
                <div className="relative">
                  <Truck size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                  <select value={dispatchTime} onChange={e => setDispatchTime(e.target.value)} className={`${INPUT_CLS} pl-8`}>
                    <option value="0">Same day</option>
                    <option value="1">1 day</option>
                    <option value="2">2 days</option>
                    <option value="3">3 days</option>
                  </select>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── Declarations & Submit ── */}
          <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-5">
            <div className="space-y-3 mb-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={checked1} onChange={e => setChecked1(e.target.checked)} className="mt-0.5 accent-[#5B1A3A]" />
                <span className="text-xs text-[#666]">I confirm that all product information is accurate and the images are genuine product photos.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={checked2} onChange={e => setChecked2(e.target.checked)} className="mt-0.5 accent-[#5B1A3A]" />
                <span className="text-xs text-[#666]">I confirm this product is genuine and I have the right to sell it on Insta Fashion Points.</span>
              </label>
            </div>
            {error && (
              <div className="mb-4 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
            <button type="submit" disabled={submitting || !isValid}
              className="w-full py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
              {submitting ? 'Submitting…' : 'Submit Product for Approval'}
            </button>
            <p className="text-[10px] text-[#999] text-center mt-2">Product will be hidden from customers until approved (usually within 24 hours)</p>
          </div>
        </div>

        {/* ══ RIGHT: Live Preview (35%) ══ */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgba(196,154,60,0.08)] flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#5B1A3A]">Live Preview</p>
                  <p className="text-[9px] text-[#C49A3C] italic">ग्राहकों को ऐसा दिखेगा</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>

              {/* Product preview card */}
              <div className="p-4">
                {/* Image placeholder */}
                <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-[#F5EDF2] flex items-center justify-center">
                  {images[0] ? (
                    <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <ImagePlus size={32} className="text-[#C49A3C]/50 mx-auto mb-2" />
                      <p className="text-[10px] text-[#999]">Add photos above</p>
                    </div>
                  )}
                </div>

                {/* Category breadcrumb */}
                {l3Label && l2Label && (
                  <p className="text-[9px] text-[#999] mb-1">{l2Label.name} › {l3Label.name}</p>
                )}

                {/* Product name */}
                <p className="text-sm font-semibold text-[#333] line-clamp-2 mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {name || <span className="text-[#CCC]">Product title will appear here</span>}
                </p>
                {nameHi && <p className="text-xs text-[#999] italic mb-1">{nameHi}</p>}

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2">
                  {price ? (
                    <>
                      <span className="text-base font-bold text-[#5B1A3A]">₹{parseFloat(price).toLocaleString('en-IN')}</span>
                      {mrp && parseFloat(mrp) > parseFloat(price) && (
                        <>
                          <span className="text-xs text-[#999] line-through">₹{parseFloat(mrp).toLocaleString('en-IN')}</span>
                          <span className="text-[10px] font-bold text-green-600">{discountPct}% off</span>
                        </>
                      )}
                    </>
                  ) : <span className="text-sm text-[#CCC]">Price not set</span>}
                </div>

                {/* Seller info */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-4 h-4 rounded-full bg-[#5B1A3A] flex items-center justify-center text-[7px] text-white font-bold">
                    {sellerName.charAt(0)}
                  </div>
                  <span className="text-[10px] text-[#666]">{sellerName || 'Your Shop'}</span>
                </div>

                {/* Tags */}
                {occasionTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {occasionTags.slice(0, 3).map(tid => {
                      const t = OCCASION_TAGS.find(x => x.id === tid);
                      return t ? (
                        <span key={tid} className="text-[8px] px-1.5 py-0.5 rounded-full border border-[rgba(196,154,60,0.2)] text-[#C49A3C] bg-[rgba(196,154,60,0.06)]">
                          {t.icon} {t.label}
                        </span>
                      ) : null;
                    })}
                    {occasionTags.length > 3 && <span className="text-[8px] text-[#999]">+{occasionTags.length - 3} more</span>}
                  </div>
                )}

                {/* Specs */}
                <div className="text-[10px] text-[#999] space-y-0.5">
                  {fabric && <p>Fabric: <span className="text-[#666]">{fabric}</span></p>}
                  {sizes.length > 0 && <p>Sizes: <span className="text-[#666]">{sizes.join(', ')}</span></p>}
                  {colors.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>Colors:</span>
                      {colors.slice(0,5).map(c => (
                        <span key={c} title={c} className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ background: COLORS_LIST.find(x => x.name === c)?.hex }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Completeness */}
                <div className="mt-3 pt-3 border-t border-[rgba(196,154,60,0.08)]">
                  <p className="text-[10px] font-semibold text-[#666] mb-1.5">Listing Completeness</p>
                  <div className="h-1.5 bg-[#F5EDF2] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${[l3, name, description, price, stock, images.length > 0, fabric].filter(Boolean).length / 7 * 100}%`,
                      background: 'linear-gradient(90deg,#5B1A3A,#C49A3C)'
                    }} />
                  </div>
                  <p className="text-[9px] text-[#999] mt-1">
                    {Math.round([l3, name, description, price, stock, images.length > 0, fabric].filter(Boolean).length / 7 * 100)}% complete
                  </p>
                </div>
              </div>
            </div>

            {/* GST Calculator card */}
            <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-4">
              <p className="text-xs font-semibold text-[#5B1A3A] mb-3">💰 GST Price Calculator</p>
              {price ? (
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Base Price (ex-GST)', val: `₹${(parseFloat(price) / (1 + gst / 100)).toFixed(2)}` },
                    { label: `GST Amount (${gst}%)`, val: `₹${(parseFloat(price) - parseFloat(price) / (1 + gst / 100)).toFixed(2)}` },
                    { label: 'Customer Pays', val: `₹${parseFloat(price).toLocaleString('en-IN')}`, bold: true },
                    { label: 'Your Earnings (0% fee)', val: `₹${parseFloat(price).toLocaleString('en-IN')}`, bold: true, color: '#2E7D32' },
                  ].map(r => (
                    <div key={r.label} className={`flex justify-between py-1 ${r.bold ? 'border-t border-[rgba(196,154,60,0.1)] font-semibold' : ''}`}>
                      <span className="text-[#999]">{r.label}</span>
                      <span style={{ color: r.color || (r.bold ? '#333' : '#666') }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#CCC] text-center py-3">Enter selling price to see breakdown</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
