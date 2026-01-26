'use client';

import { useState } from 'react';
import { ProductCard } from '@/components';
import { getProductsByCategory, mensSubCategories } from '@/data/products';
import { useLanguage } from '@/context/LanguageContext';

export default function MensPage() {
  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const allProducts = getProductsByCategory('mens');

  const filteredProducts = activeCategory
    ? allProducts.filter((p) => p.subCategory === activeCategory)
    : allProducts;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#722F37] to-[#5A252C] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="text-6xl">👔</span>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {language === 'hi' ? 'पुरुषों का कलेक्शन' : "Men's Collection"}
              </h1>
              <p className="text-lg opacity-90">
                {language === 'hi'
                  ? 'कैजुअल, फॉर्मल और एथनिक वियर'
                  : 'Casual, Formal & Ethnic Wear for Every Occasion'}
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
          {mensSubCategories.map((cat) => (
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
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">👔</span>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {language === 'hi' ? 'जल्द आ रहा है!' : 'Coming Soon!'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'hi'
                ? 'नए प्रोडक्ट्स जल्द जोड़े जाएंगे'
                : 'New products will be added soon'}
            </p>
            <a
              href="https://wa.me/919608063673?text=Hi!%20I%20want%20to%20see%20men's%20collection"
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

        {/* WhatsApp CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#722F37] to-[#5A252C] rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">
            {language === 'hi' ? 'और विकल्प चाहिए?' : 'Want More Options?'}
          </h3>
          <p className="opacity-90 mb-6">
            {language === 'hi'
              ? 'WhatsApp पर संपर्क करें या स्टोर पर आएं'
              : 'Contact us on WhatsApp or visit our store for more variety'}
          </p>
          <a
            href="https://wa.me/919608063673?text=Hi!%20I%20want%20to%20see%20more%20men's%20collection"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-white text-[#722F37] font-semibold rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {t('contact.whatsapp')}
          </a>
        </div>
      </div>
    </div>
  );
}
