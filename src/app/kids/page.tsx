'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components';
import { kidsSubCategories } from '@/data/products';
import { useLanguage } from '@/context/LanguageContext';

export default function KidsPage() {
  const { language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?category=kids', { cache: 'no-store' });
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
            <span className="text-6xl mb-4 block">👶</span>
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
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-white text-[#722F37] font-semibold rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {language === 'hi' ? 'स्टोर पर आएं' : 'Visit Store'}
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
