'use client';

import {
  BannerCarousel,
  CollectionGrid,
  MensCollectionSection,
  WomensCollectionSection,
  SareesCollectionSection,
  KidsCollectionSection,
  BeautyMakeupCollectionSection,
  FootwearCollectionSection,
} from '@/components';
import type { Collection } from '@/components';

const featuredCollections: Collection[] = [
  {
    id: 'sarees',
    name: 'Sarees',
    nameHi: 'साड़ियां',
    desc: 'Graceful & Traditional',
    descHi: 'सुंदर और पारंपरिक',
    img: '/banners/saree-banner.jpg',
    pos: 'center 30%',
    catKeyword: 'saree',
    fallbackHref: '/sarees',
  },
  {
    id: 'womens',
    name: "Women's Wear",
    nameHi: 'महिला परिधान',
    desc: 'Elegant & Festive',
    descHi: 'सुरुचिपूर्ण और उत्सवी',
    img: '/banners/salwar-banner.jpg',
    pos: 'center 20%',
    catKeyword: 'women',
    fallbackHref: '/womens',
  },
  {
    id: 'mens',
    name: "Men's Collection",
    nameHi: 'पुरुष संग्रह',
    desc: 'Sharp & Contemporary',
    descHi: 'स्टाइलिश और आधुनिक',
    img: '/mens-collection.jpg',
    catKeyword: 'men',
    fallbackHref: '/mens',
  },
  {
    id: 'kids',
    name: 'Kids Fashion',
    nameHi: 'बच्चों का फैशन',
    desc: 'Playful & Vibrant',
    descHi: 'खिलंदड़ा और रंगीन',
    img: '/kids-collection.jpg',
    catKeyword: 'kid',
    fallbackHref: '/kids',
  },
  {
    id: 'footwear',
    name: 'Footwear',
    nameHi: 'फुटवियर',
    desc: 'Step into Style',
    descHi: 'स्टाइल में कदम रखें',
    img: '/footwear-new.jpg',
    catKeyword: 'footwear',
    fallbackHref: '/footwear',
  },
];

export default function Home() {
  return (
    <>
      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Featured Collections Grid — new design system tile layout */}
      <CollectionGrid
        collections={featuredCollections}
        title="Shop by Category"
        titleHi="श्रेणी के अनुसार खरीदें"
      />

      {/* Detailed collection sections */}
      <MensCollectionSection />
      <WomensCollectionSection />
      <SareesCollectionSection />
      <KidsCollectionSection />
      <BeautyMakeupCollectionSection />
      <FootwearCollectionSection />
    </>
  );
}
