'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components';
import { useLanguage } from '@/context/LanguageContext';

export default function MakeupPage() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(categoryFromUrl || 'all');

  const subCategories = [
    { id: 'all', name: 'All Products', nameHi: 'सभी प्रोडक्ट्स' },
    { id: 'skincare', name: 'Skincare', nameHi: 'स्किनकेयर' },
    { id: 'makeup', name: 'Makeup', nameHi: 'मेकअप' },
    { id: 'fragrance', name: 'Fragrance', nameHi: 'परफ्यूम' },
    { id: 'haircare', name: 'Hair Care', nameHi: 'हेयर केयर' },
  ];

  // Update category when URL changes
  useEffect(() => {
    if (categoryFromUrl && categoryFromUrl !== 'all') {
      setSelectedSubCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  useEffect(() => {
    fetchProducts();
  }, [selectedSubCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // For now, we'll fetch all products and filter by category later
      // In the future, update the API to support 'makeup' category
      const timestamp = Date.now();
      const response = await fetch(`/api/products?category=makeup&_t=${timestamp}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch makeup products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedSubCategory === 'all'
    ? products
    : products.filter(p => p.subCategory === selectedSubCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-white">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-red-400 via-pink-500 to-rose-500 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <span className="mr-2">💄</span>
              {language === 'hi' ? 'ब्यूटी कलेक्शन' : 'Beauty Collection'}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
              {language === 'hi' ? 'मेकअप और ब्यूटी' : 'Makeup & Beauty'}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
              {language === 'hi'
                ? 'प्रीमियम कॉस्मेटिक्स और ब्यूटी प्रोडक्ट्स - आपकी खूबसूरती बढ़ाने के लिए'
                : 'Premium Cosmetics & Beauty Products - Enhance Your Natural Beauty'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Sub-category Filter */}
      <section className="py-8 bg-white border-b border-[#E8E2D9] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {subCategories.map((subCat) => (
              <button
                key={subCat.id}
                onClick={() => setSelectedSubCategory(subCat.id)}
                className={`px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-all duration-300 ${
                  selectedSubCategory === subCat.id
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg'
                    : 'bg-[#F5F0E8] text-[#2D2D2D] hover:bg-[#E8E2D9]'
                }`}
              >
                {language === 'hi' ? subCat.nameHi : subCat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#6B6B6B]">
                  {language === 'hi' ? 'प्रोडक्ट्स लोड हो रहे हैं...' : 'Loading products...'}
                </p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-6">💄</div>
              <h3 className="text-2xl font-bold text-[#2D2D2D] mb-4">
                {language === 'hi' ? 'कोई प्रोडक्ट नहीं मिला' : 'No Products Found'}
              </h3>
              <p className="text-[#6B6B6B] mb-8">
                {language === 'hi'
                  ? 'जल्द ही नए मेकअप और ब्यूटी प्रोडक्ट्स जोड़े जाएंगे।'
                  : 'New makeup and beauty products coming soon.'}
              </p>
              <button
                onClick={() => setSelectedSubCategory('all')}
                className="px-8 py-3 bg-gradient-to-r from-red-400 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300"
              >
                {language === 'hi' ? 'सभी देखें' : 'View All'}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-[#2D2D2D]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                    {selectedSubCategory === 'all'
                      ? (language === 'hi' ? 'सभी प्रोडक्ट्स' : 'All Products')
                      : (language === 'hi'
                        ? subCategories.find(c => c.id === selectedSubCategory)?.nameHi
                        : subCategories.find(c => c.id === selectedSubCategory)?.name
                      )
                    }
                  </h2>
                  <p className="text-[#6B6B6B] mt-1">
                    {filteredProducts.length} {language === 'hi' ? 'प्रोडक्ट्स' : 'products'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Beauty Tips Section */}
      <section className="py-16 bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D2D2D] mb-4" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
              {language === 'hi' ? 'ब्यूटी टिप्स' : 'Beauty Tips'}
            </h2>
            <div className="section-divider"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-[#2D2D2D] mb-3">
                {language === 'hi' ? 'स्किन की देखभाल' : 'Skincare First'}
              </h3>
              <p className="text-[#6B6B6B]">
                {language === 'hi'
                  ? 'मेकअप से पहले अपनी स्किन की देखभाल करें। साफ और मॉइस्चराइज्ड स्किन मेकअप को बेहतर बनाती है।'
                  : 'Take care of your skin before makeup. Clean and moisturized skin makes makeup look better.'
                }
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">💅</div>
              <h3 className="text-xl font-bold text-[#2D2D2D] mb-3">
                {language === 'hi' ? 'सही शेड चुनें' : 'Choose Right Shade'}
              </h3>
              <p className="text-[#6B6B6B]">
                {language === 'hi'
                  ? 'अपनी स्किन टोन के अनुसार सही शेड चुनें। हमेशा प्राकृतिक रोशनी में टेस्ट करें।'
                  : 'Choose the right shade for your skin tone. Always test in natural light.'
                }
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-[#2D2D2D] mb-3">
                {language === 'hi' ? 'क्वालिटी मायने रखती है' : 'Quality Matters'}
              </h3>
              <p className="text-[#6B6B6B]">
                {language === 'hi'
                  ? 'हमेशा प्रीमियम क्वालिटी प्रोडक्ट्स खरीदें। आपकी स्किन को सबसे अच्छा मिलना चाहिए।'
                  : 'Always buy premium quality products. Your skin deserves the best.'
                }
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
