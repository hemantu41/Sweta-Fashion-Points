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
                <a
                  href="https://wa.me/919608063673?text=Hi!%20I%20want%20to%20see%20your%20sarees%20collection"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-7 py-3.5 border-2 border-white/50 text-white font-semibold rounded-full hover:bg-white/10 hover:border-white transition-all duration-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp Inquiry
                </a>
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
