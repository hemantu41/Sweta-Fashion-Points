'use client';

import { useState } from 'react';
import { ProductCard } from '@/components';
import { getProductsByCategory, kidsSubCategories } from '@/data/products';
import { useLanguage } from '@/context/LanguageContext';

export default function KidsPage() {
  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const allProducts = getProductsByCategory('kids');

  const filteredProducts = activeCategory
    ? allProducts.filter((p) => p.subCategory === activeCategory)
    : allProducts;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="text-6xl">👶</span>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {language === 'hi' ? 'बच्चों का कलेक्शन' : "Kids' Collection"}
              </h1>
              <p className="text-lg opacity-90">
                {language === 'hi'
                  ? 'आरामदायक और स्टाइलिश कपड़े'
                  : 'Comfortable & Stylish Clothing for Little Ones'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Age Group Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {kidsSubCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`p-6 rounded-xl text-center transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#722F37] text-white'
                  : 'bg-white text-gray-900 hover:shadow-lg'
              }`}
            >
              <span className="text-5xl block mb-3">
                {cat.id === '0-3' && '👶'}
                {cat.id === '4-7' && '🧒'}
                {cat.id === '8-12' && '🧑'}
              </span>
              <h3 className="text-xl font-semibold mb-1">
                {language === 'hi' ? cat.nameHi : cat.name}
              </h3>
              <p className={`text-sm ${activeCategory === cat.id ? 'opacity-90' : 'text-gray-600'}`}>
                {cat.id === '0-3' && (language === 'hi' ? 'शिशु और छोटे बच्चे' : 'Infants & Toddlers')}
                {cat.id === '4-7' && (language === 'hi' ? 'प्री-स्कूल बच्चे' : 'Pre-School Kids')}
                {cat.id === '8-12' && (language === 'hi' ? 'स्कूल के बच्चे' : 'School Going Kids')}
              </p>
            </button>
          ))}
        </div>

        {/* Key Features */}
        <div className="bg-gradient-to-r from-[#FAF7F2] to-[#F5F0E8] rounded-2xl p-6 mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            {language === 'hi' ? 'माता-पिता के लिए महत्वपूर्ण' : 'What Parents Care About'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <span className="text-3xl block mb-2">🧵</span>
              <h4 className="font-medium text-gray-900">
                {language === 'hi' ? 'मुलायम कपड़े' : 'Soft Fabrics'}
              </h4>
              <p className="text-xs text-gray-600">
                {language === 'hi' ? 'त्वचा के अनुकूल' : 'Skin-friendly'}
              </p>
            </div>
            <div className="text-center p-4">
              <span className="text-3xl block mb-2">💪</span>
              <h4 className="font-medium text-gray-900">
                {language === 'hi' ? 'टिकाऊ' : 'Durable'}
              </h4>
              <p className="text-xs text-gray-600">
                {language === 'hi' ? 'लंबे समय तक चलने वाला' : 'Long-lasting'}
              </p>
            </div>
            <div className="text-center p-4">
              <span className="text-3xl block mb-2">😊</span>
              <h4 className="font-medium text-gray-900">
                {language === 'hi' ? 'आरामदायक' : 'Comfortable'}
              </h4>
              <p className="text-xs text-gray-600">
                {language === 'hi' ? 'पूरे दिन पहनने योग्य' : 'All-day wear'}
              </p>
            </div>
            <div className="text-center p-4">
              <span className="text-3xl block mb-2">🎨</span>
              <h4 className="font-medium text-gray-900">
                {language === 'hi' ? 'रंगीन' : 'Colorful'}
              </h4>
              <p className="text-xs text-gray-600">
                {language === 'hi' ? 'बच्चों की पसंद' : 'Kids love it'}
              </p>
            </div>
          </div>
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
            <span className="text-6xl mb-4 block">👶</span>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {language === 'hi' ? 'जल्द आ रहा है!' : 'Coming Soon!'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'hi'
                ? 'नए प्रोडक्ट्स जल्द जोड़े जाएंगे'
                : 'New products will be added soon'}
            </p>
            <a
              href="https://wa.me/919608063673?text=Hi!%20I%20want%20to%20see%20kids%20collection"
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

        {/* Bundle Offers */}
        <div className="mt-12 bg-gradient-to-r from-[#722F37] to-[#8B3D47] rounded-2xl p-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                Special Offer
              </span>
              <h3 className="text-2xl font-bold mb-2">
                {language === 'hi' ? 'फैमिली बंडल ऑफर!' : 'Family Bundle Offers!'}
              </h3>
              <p className="opacity-90 mb-4">
                {language === 'hi'
                  ? 'बच्चों के कपड़ों पर विशेष छूट जब आप पूरे परिवार के लिए खरीदारी करें'
                  : 'Special discounts on kids wear when you shop for the whole family'}
              </p>
              <a
                href="https://wa.me/919608063673?text=Hi!%20I%20want%20to%20know%20about%20family%20bundle%20offers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-white text-[#722F37] font-semibold rounded-full hover:bg-gray-100 transition-colors"
              >
                Enquire Now
              </a>
            </div>
            <div className="text-center">
              <span className="text-8xl">👨‍👩‍👧‍👦</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
