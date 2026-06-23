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
    pos: 'center 10%',
    catKeyword: 'saree',
    fallbackHref: '/sarees',
  },
  {
    id: 'kurti',
    name: 'Kurti',
    nameHi: 'कुर्ती',
    desc: 'Elegant Ethnic Wear',
    descHi: 'सुंदर एथनिक परिधान',
    img: '/banners/salwar-banner.jpg',
    pos: 'center top',
    catKeyword: 'kurti',
    fallbackHref: '/womens',
  },
  {
    id: 'jeans',
    name: 'Jeans',
    nameHi: 'जींस',
    desc: 'Denim for Every Mood',
    descHi: 'हर मूड के लिए डेनिम',
    img: '/banners/jeans-card.jpg',
    pos: 'center top',
    catKeyword: 'jean',
    fallbackHref: '/womens?category=jeans',
  },
  {
    id: 'kids',
    name: 'Kids Fashion',
    nameHi: 'बच्चों का फैशन',
    desc: 'Playful & Vibrant',
    descHi: 'खिलंदड़ा और रंगीन',
    img: '/kids-collection.jpg',
    pos: 'center top',
    catKeyword: 'kid',
    fallbackHref: '/kids',
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
