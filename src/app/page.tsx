'use client';

import Link from 'next/link';
import { HeroSection, CategoryCard, ProductCard, WhyChooseUs, LocationSection } from '@/components';
import { categories, getNewArrivals, getBestSellers } from '@/data/products';
import { useLanguage } from '@/context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const newArrivals = getNewArrivals();
  const bestSellers = getBestSellers();

  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D2D2D] mb-4" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
              Shop by Category
            </h2>
            <p className="text-[#6B6B6B] max-w-2xl mx-auto">
              Explore our wide range of collections for the entire family
            </p>
            <div className="section-divider mt-6"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="py-20 bg-[#FAF7F2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-[#2D2D2D]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>{t('nav.newArrivals')}</h2>
                <p className="text-[#6B6B6B] mt-2">Fresh styles just for you</p>
              </div>
              <Link
                href="/new-arrivals"
                className="hidden sm:flex items-center text-[#722F37] font-medium hover:text-[#5A252C] transition-colors"
              >
                {t('product.viewAll')}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/new-arrivals"
                className="inline-flex items-center text-[#722F37] font-medium"
              >
                {t('product.viewAll')}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Sarees Highlight Banner */}
      <section className="py-20 bg-gradient-to-r from-[#722F37] via-[#8B3D47] to-[#722F37] text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full border-2 border-white"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full border-2 border-white"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center px-4 py-1.5 bg-[#C9A962] rounded-full text-sm font-medium mb-6">
                <span className="mr-2">✦</span> Special Collection
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                Exquisite Sarees Collection
              </h2>
              <p className="text-lg opacity-90 mb-8 leading-relaxed">
                From daily wear to bridal, discover our handpicked sarees for every occasion.
                Premium quality at prices that suit your budget.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/sarees"
                  className="inline-flex items-center px-7 py-3.5 bg-white text-[#722F37] font-semibold rounded-full hover:bg-[#FAF7F2] transition-all duration-300 hover:shadow-lg"
                >
                  Explore Sarees
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/sarees?category=wedding"
                  className="inline-flex items-center px-7 py-3.5 border-2 border-white/50 text-white font-semibold rounded-full hover:bg-white/10 hover:border-white transition-all duration-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Wedding Collection
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                <div className="w-64 h-64 rounded-full border-2 border-[#C9A962]/30 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border-2 border-[#C9A962]/50 flex items-center justify-center">
                    <span className="text-8xl">🥻</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-[#2D2D2D]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>{t('product.bestSeller')}s</h2>
                <p className="text-[#6B6B6B] mt-2">Customer favorites you&apos;ll love</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
