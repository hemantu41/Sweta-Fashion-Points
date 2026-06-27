'use client';

import {
  BannerCarousel,
  CollectionGrid,
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
    l1Kw: 'women',
    l2Kw: 'bottom',
    l3Kw: 'girl',
    fallbackHref: '/womens?category=jeans',
  },
  {
    id: 'night-suits',
    name: 'Night Suits',
    nameHi: 'नाइट सूट',
    desc: 'Comfort Meets Style',
    descHi: 'आराम और स्टाइल का मेल',
    img: '/banners/night-suits-card.jpg',
    pos: 'center top',
    l1Kw: 'women',
    l2Kw: 'inner',
    l3Kw: 'night',
    fallbackHref: '/womens?category=night-suits',
  },
  {
    id: 'mens-shirts',
    name: 'Shirts',
    nameHi: 'शर्ट',
    desc: 'Formal, Casual & More',
    descHi: 'फॉर्मल, कैजुअल और अधिक',
    img: '/banners/mens-shirts-card.jpg',
    pos: 'center top',
    l1Kw: 'men',
    l2Kw: 'top',
    fallbackHref: '/category/mens-top',
  },
  {
    id: 't-shirts',
    name: 'T-Shirts',
    nameHi: 'टी-शर्ट',
    desc: 'Casual & Everyday Comfort',
    descHi: 'कैजुअल और रोज़ाना आराम',
    img: '/banners/t-shirts-card.jpg',
    pos: 'center top',
    l1Kw: 'men',
    l2Kw: 'top',
    fallbackHref: '/category/mens-top',
  },
  {
    id: 'mens-ethnic',
    name: 'Ethnic Wear',
    nameHi: 'एथनिक वियर',
    desc: 'Kurta, Sherwani & More',
    descHi: 'कुर्ता, शेरवानी और अधिक',
    img: '/banners/ethnic-wear-card.jpg',
    pos: 'center top',
    l1Kw: 'men',
    l2Kw: 'ethnic wear',
    fallbackHref: '/category/men-ethnic',
  },
  {
    id: 'casual-wear',
    name: 'Casual Wear',
    nameHi: 'कैजुअल वियर',
    desc: 'Joggers, Tracks & More',
    descHi: 'जॉगर्स, ट्रैक्स और अधिक',
    img: '/banners/casual-wear-card.jpg',
    pos: 'center top',
    l1Kw: 'men',
    l2Kw: 'bottom wear',
    fallbackHref: '/category/men-bottom',
  },
  {
    id: 'girls-ethnic-wear',
    name: 'Ethnic Wear',
    nameHi: 'एथनिक वियर',
    desc: 'Kurtas, Lehengas & More',
    descHi: 'कुर्ता, लहंगा और अधिक',
    img: '/banners/girls-ethnic-wear-card.jpg',
    pos: 'center top',
    l1Kw: 'kid',
    l2Kw: 'ethnic',
    fallbackHref: '/kids?category=ethnic',
  },
  {
    id: 'girls-tops',
    name: 'Tops',
    nameHi: 'टॉप्स',
    desc: 'Trendy Tops for Girls',
    descHi: 'लड़कियों के लिए ट्रेंडी टॉप्स',
    img: '/banners/girls-top-card.jpg',
    pos: 'center top',
    l1Kw: 'kid',
    l2Kw: 'top',
    fallbackHref: '/kids?category=tops',
  },
  {
    id: 'party-wear',
    name: 'Party Wear',
    nameHi: 'पार्टी वियर',
    desc: 'Dresses & Gowns for Girls',
    descHi: 'लड़कियों के लिए ड्रेस और गाउन',
    img: '/banners/party-wear-card.jpg',
    pos: 'center top',
    l1Kw: 'kid',
    l2Kw: 'party',
    fallbackHref: '/kids?category=party-wear',
  },
  {
    id: 'girls-pants',
    name: 'Pants',
    nameHi: 'पैंट्स',
    desc: 'Casual Comfort for Girls',
    descHi: 'लड़कियों के लिए कैजुअल कम्फर्ट',
    img: '/banners/girls-pants-card.jpg',
    pos: 'center top',
    l1Kw: 'kid',
    l2Kw: 'bottom',
    fallbackHref: '/kids?category=bottomwear',
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

    </>
  );
}
