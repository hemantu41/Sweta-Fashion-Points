'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components';
import { womensSubCategories } from '@/data/products';
import { useLanguage } from '@/context/LanguageContext';

export default function WomensPage() {
  const { language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?category=womens', { cache: 'no-store' });
      const data = await response.json();
      setAllProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = activeCategory
    ? allProducts.filter((p) => p.subCategory === activeCategory)
    : allProducts;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="text-6xl">👗</span>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {language === 'hi' ? 'महिलाओं का कलेक्शन' : "Women's Collection"}
              </h1>
              <p className="text-lg opacity-90">
                {language === 'hi'
                  ? 'डेली, पार्टी और एथनिक वियर'
                  : 'Daily, Party & Ethnic Wear for Every Woman'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === null
                ? 'bg-[#722F37] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {language === 'hi' ? 'सभी' : 'All'}
          </button>
          {womensSubCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[#722F37] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {language === 'hi' ? cat.nameHi : cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">👗</span>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {language === 'hi' ? 'जल्द आ रहा है!' : 'Coming Soon!'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'hi'
                ? 'नए प्रोडक्ट्स जल्द जोड़े जाएंगे। अभी स्टोर पर आएं!'
                : 'New products will be added soon. Visit our store!'}
            </p>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-[#722F37] text-white font-semibold rounded-full hover:bg-[#5a252c] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {language === 'hi' ? 'स्टोर पर आएं' : 'Visit Store'}
            </a>
          </div>
        )}

        {/* Mix & Match Ideas Banner */}
        <div className="mt-12 bg-gradient-to-r from-[#FAF7F2] to-[#F5F0E8] rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {language === 'hi' ? 'मिक्स एंड मैच आइडियाज' : 'Mix & Match Ideas'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'hi'
                  ? 'हमारे स्टोर पर आएं और देखें कैसे एक outfit को multiple ways में style करें'
                  : 'Visit our store to see how to style one outfit in multiple ways'}
              </p>
              <a
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-[#722F37] text-white font-semibold rounded-full hover:bg-[#5a252c] transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {language === 'hi' ? 'स्टोर पर आएं' : 'Visit Store'}
              </a>
            </div>
            <div className="text-center">
              <span className="text-8xl">✨👗✨</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
