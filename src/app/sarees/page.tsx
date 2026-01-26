'use client';

import { useState } from 'react';
import { ProductCard } from '@/components';
import { getProductsByCategory, sareesSubCategories } from '@/data/products';
import { useLanguage } from '@/context/LanguageContext';

type FilterType = 'occasion' | 'price';

export default function SareesPage() {
  const { language, t } = useLanguage();
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
                ? 'WhatsApp पर संपर्क करें पूरा कलेक्शन देखने के लिए'
                : 'Contact us on WhatsApp to see our full collection'}
            </p>
            <a
              href="https://wa.me/919608063673?text=Hi!%20I%20want%20to%20see%20sarees%20collection"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('contact.whatsapp')}
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
                  href="https://wa.me/919608063673?text=Hi!%20I%20want%20to%20see%20bridal%20sarees%20collection"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-[#722F37] text-white font-semibold rounded-full hover:bg-[#b8366e] transition-colors"
                >
                  Book Appointment
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
