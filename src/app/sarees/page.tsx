'use client';

import { useState } from 'react';
import { ProductCard } from '@/components';
import { getProductsByCategory, sareesSubCategories } from '@/data/products';
import { useLanguage } from '@/context/LanguageContext';

type FilterType = 'occasion' | 'price';

export default function SareesPage() {
  const { language } = useLanguage();
  const [filterType, setFilterType] = useState<FilterType>('occasion');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const allProducts = getProductsByCategory('sarees');

  const filteredProducts = activeCategory
    ? allProducts.filter((p) => p.subCategory === activeCategory)
    : allProducts;

  const occasionCategories = sareesSubCategories.byOccasion;
  const priceCategories = sareesSubCategories.byPrice;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#722F37] via-[#8B3D47] to-[#722F37] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="text-6xl">🥻</span>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold">
                  {language === 'hi' ? 'साड़ी कलेक्शन' : 'Sarees Collection'}
                </h1>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Popular</span>
              </div>
              <p className="text-lg opacity-90">
                {language === 'hi'
                  ? 'हर अवसर के लिए पारंपरिक और डिज़ाइनर साड़ियां'
                  : 'Traditional & Designer Sarees for Every Occasion'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Type Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setFilterType('occasion');
              setActiveCategory(null);
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              filterType === 'occasion'
                ? 'bg-[#722F37] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('saree.byOccasion')}
          </button>
          <button
            onClick={() => {
              setFilterType('price');
              setActiveCategory(null);
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              filterType === 'price'
                ? 'bg-[#722F37] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('saree.byPrice')}
          </button>
        </div>

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
          {(filterType === 'occasion' ? occasionCategories : priceCategories).map((cat) => (
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

        {/* Special Occasion Cards */}
        {!activeCategory && filterType === 'occasion' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {occasionCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="bg-white rounded-xl p-6 text-center card-hover"
              >
                <span className="text-4xl block mb-3">
                  {cat.id === 'daily' && '🌸'}
                  {cat.id === 'party' && '🎉'}
                  {cat.id === 'wedding' && '💒'}
                  {cat.id === 'festival' && '🪔'}
                </span>
                <h3 className="font-semibold text-gray-900">
                  {language === 'hi' ? cat.nameHi : cat.name}
                </h3>
              </button>
            ))}
          </div>
        )}

        {/* Price Range Cards */}
        {!activeCategory && filterType === 'price' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {priceCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="bg-white rounded-xl p-6 text-center card-hover border-2 border-transparent hover:border-[#722F37]"
              >
                <span className="text-2xl font-bold text-[#722F37] block mb-2">
                  {language === 'hi' ? cat.nameHi : cat.name}
                </span>
                <p className="text-sm text-gray-600">
                  {cat.id === 'under1000' && (language === 'hi' ? 'बजट फ्रेंडली' : 'Budget Friendly')}
                  {cat.id === '1000to2500' && (language === 'hi' ? 'मिड रेंज' : 'Mid Range')}
                  {cat.id === '2500to5000' && (language === 'hi' ? 'प्रीमियम' : 'Premium')}
                  {cat.id === 'premium' && (language === 'hi' ? 'लक्ज़री' : 'Luxury')}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">🥻</span>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {language === 'hi' ? 'और साड़ियां जल्द आ रही हैं!' : 'More Sarees Coming Soon!'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'hi'
                ? 'पूरा कलेक्शन देखने के लिए स्टोर पर आएं'
                : 'Visit our store to see our full collection'}
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

        {/* Wedding Special Banner */}
        <div className="mt-12 bg-gradient-to-r from-[#FAF7F2] to-[#F5F0E8] rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-[#C9A962] text-white rounded-full text-sm font-medium mb-4">
                Wedding Special
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {language === 'hi' ? 'शादी का सीज़न आ गया!' : 'Wedding Season is Here!'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'hi'
                  ? 'दुल्हन के लिए exclusive Kanjivaram और Banarasi साड़ियां। पूरा कलेक्शन देखने स्टोर पर आएं।'
                  : 'Exclusive Kanjivaram and Banarasi sarees for brides. Visit our store to see the complete collection.'}
              </p>
              <div className="flex flex-wrap gap-3">
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
            </div>
            <div className="text-center">
              <span className="text-8xl">👰🥻✨</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
