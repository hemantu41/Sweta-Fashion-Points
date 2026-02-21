'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryCard, ProductCard, WhyChooseUs, LocationSection, CollectionSection, BannerCarousel } from '@/components';
import { categories } from '@/data/products';
import { useLanguage } from '@/context/LanguageContext';

export default function Home() {
  const { t, language } = useLanguage();
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const [newArrivalsRes, bestSellersRes] = await Promise.all([
        fetch('/api/products?isNewArrival=true', { cache: 'no-store' }),
        fetch('/api/products?isBestSeller=true', { cache: 'no-store' }),
      ]);

      const newArrivalsData = await newArrivalsRes.json();
      const bestSellersData = await bestSellersRes.json();

      setNewArrivals(newArrivalsData.products || []);
      setBestSellers(bestSellersData.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Banner Carousel - Sliding banners for all collections */}
      <BannerCarousel />

      {/* Collection Section - Shows all 5 collections with representative photos */}
      <CollectionSection />

      {/* New Arrivals Section - Premium Design */}
      {newArrivals.length > 0 && (
        <section className="relative py-24 bg-gradient-to-b from-white to-[#FAF7F2] overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, #722F37 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex items-center justify-between mb-12">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md mb-4 border border-[#E8E2D9]">
                  <div className="w-2 h-2 rounded-full bg-[#722F37] animate-pulse"></div>
                  <span className="text-xs font-medium text-[#722F37] tracking-wide">
                    {language === 'hi' ? 'नया आगमन' : 'FRESH ARRIVALS'}
                  </span>
                </div>
                <h2 className="text-4xl font-bold text-[#2D2D2D] tracking-tight" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                  {t('nav.newArrivals')}
                </h2>
                <p className="text-[#6B6B6B] mt-2 text-lg">Fresh styles curated for you</p>
              </div>
              <Link
                href="/new-arrivals"
                className="hidden sm:inline-flex items-center gap-2 px-6 py-3 bg-[#722F37] text-white font-medium rounded-full hover:bg-[#5A252C] transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {t('product.viewAll')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers Section - Premium Design */}
      {bestSellers.length > 0 && (
        <section className="relative py-24 bg-gradient-to-b from-[#FAF7F2] to-white overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, #C9A962 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md mb-4 border border-[#E8E2D9]">
                <svg className="w-4 h-4 text-[#C9A962]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-medium text-[#722F37] tracking-wide">
                  {language === 'hi' ? 'बेस्ट सेलर्स' : 'CUSTOMER FAVORITES'}
                </span>
              </div>

              <h2 className="text-4xl font-bold text-[#2D2D2D] tracking-tight mb-3" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                {t('product.bestSeller')}s
              </h2>
              <p className="text-[#6B6B6B] text-lg max-w-2xl mx-auto">
                {language === 'hi' ? 'ग्राहकों की पसंदीदा' : 'Most loved by our customers'}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {bestSellers.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Location Section */}
      <LocationSection />
    </>
  );
}
