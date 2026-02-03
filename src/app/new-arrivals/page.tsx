'use client';

import { ProductCard } from '@/components';
import { getNewArrivals } from '@/data/products';
import { useLanguage } from '@/context/LanguageContext';

export default function NewArrivalsPage() {
  const { language } = useLanguage();
  const newArrivals = getNewArrivals();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="text-6xl">✨</span>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {t('nav.newArrivals')}
              </h1>
              <p className="text-lg opacity-90">
                {language === 'hi'
                  ? 'हमारे नवीनतम स्टाइल्स और ट्रेंड्स देखें'
                  : 'Check out our latest styles and trends'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Products Grid */}
        {newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">✨</span>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {language === 'hi' ? 'नए प्रोडक्ट्स जल्द आ रहे हैं!' : 'New Products Coming Soon!'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'hi'
                ? 'नए arrivals की जानकारी के लिए स्टोर पर आएं'
                : 'Visit our store to see new arrivals'}
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

        {/* Visit Store Banner */}
        <div className="mt-12 bg-gradient-to-r from-[#722F37] to-[#8B3D47] rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">
            {language === 'hi' ? 'नए arrivals की जानकारी पाएं!' : 'Get Notified About New Arrivals!'}
          </h3>
          <p className="opacity-90 mb-6 max-w-xl mx-auto">
            {language === 'hi'
              ? 'हमारे स्टोर पर आएं और नए collection को सबसे पहले देखें'
              : 'Visit our store to be the first to see new collections'}
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-white text-[#722F37] font-semibold rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {language === 'hi' ? 'स्टोर का पता देखें' : 'Get Store Location'}
          </a>
        </div>
      </div>
    </div>
  );
}
