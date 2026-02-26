'use client';

import { LocationSection, BannerCarousel, MensCollectionSection, WomensCollectionSection, SareesCollectionSection, KidsCollectionSection, BeautyMakeupCollectionSection, FootwearCollectionSection } from '@/components';

export default function Home() {
  return (
    <>
      {/* Banner Carousel - Sliding banners for all collections */}
      <BannerCarousel />

      {/* Men's Collection Section - Men's clothing categories */}
      <MensCollectionSection />

      {/* Women's Collection Section - Women's clothing categories */}
      <WomensCollectionSection />

      {/* Sarees Collection Section - Saree categories */}
      <SareesCollectionSection />

      {/* Kids Collection Section - Kids clothing categories */}
      <KidsCollectionSection />

      {/* Beauty & Makeup Collection Section - Beauty and makeup categories */}
      <BeautyMakeupCollectionSection />

      {/* Footwear Collection Section - Footwear categories */}
      <FootwearCollectionSection />

      {/* Location Section */}
      <LocationSection />
    </>
  );
}
