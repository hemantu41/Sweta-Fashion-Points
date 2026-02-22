'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface WomensCategory {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  link: string;
  bgGradient: string;
  bgImage?: string;
}

const womensCategories: WomensCategory[] = [
  {
    id: 'daily',
    name: 'Daily Wear',
    nameHi: 'डेली वियर',
    description: 'Everyday Essentials',
    descriptionHi: 'रोजमर्रा की आवश्यकताएं',
    link: '/womens?category=daily',
    bgGradient: 'from-pink-100 via-rose-100 to-pink-200',
    bgImage: 'https://images.unsplash.com/photo-1583391733981-5df2f8db5eff?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'party',
    name: 'Party Wear',
    nameHi: 'पार्टी वियर',
    description: 'Glamorous & Stylish',
    descriptionHi: 'ग्लैमरस और स्टाइलिश',
    link: '/womens?category=party',
    bgGradient: 'from-purple-100 via-violet-100 to-purple-200',
    bgImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'ethnic',
    name: 'Ethnic Wear',
    nameHi: 'एथनिक वियर',
    description: 'Traditional Elegance',
    descriptionHi: 'पारंपरिक सुंदरता',
    link: '/womens?category=ethnic',
    bgGradient: 'from-teal-100 via-cyan-100 to-teal-200',
    bgImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'seasonal',
    name: 'Seasonal Collections',
    nameHi: 'सीज़नल कलेक्शन',
    description: 'Trending Now',
    descriptionHi: 'अभी ट्रेंडिंग',
    link: '/womens?category=seasonal',
    bgGradient: 'from-orange-100 via-amber-100 to-orange-200',
    bgImage: 'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
];

export default function WomensCollectionSection() {
  const { language } = useLanguage();

  return (
    <section className="relative py-20 bg-[#FAF7F2] overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #722F37 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D2D2D] mb-3 tracking-tight" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            {language === 'hi' ? 'महिलाओं के लिए फैशन' : 'Fashion for Women'}
          </h2>

          <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
            {language === 'hi'
              ? 'आधुनिक महिलाओं के लिए शैली और आराम'
              : 'Style and comfort for the modern woman'
            }
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {womensCategories.map((category, index) => (
            <Link
              key={category.id}
              href={category.link}
              className="group flex flex-col items-center"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Circular Card Container */}
              <div className="relative w-48 h-48 md:w-64 md:h-64 mb-4">
                {/* Gradient Background Circle */}
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${category.bgGradient} transition-all duration-300 group-hover:scale-105`}></div>

                {/* Image Container */}
                <div className="absolute inset-0 rounded-full overflow-hidden p-2">
                  {category.bgImage && (
                    <div
                      className="w-full h-full bg-cover bg-center rounded-full transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundImage: `url(${category.bgImage})` }}
                    ></div>
                  )}
                </div>

                {/* Hover Ring Effect */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent group-hover:border-[#722F37] transition-all duration-300"></div>
              </div>

              {/* Category Label */}
              <h3 className="text-base md:text-lg font-semibold text-[#2D2D2D] text-center transition-colors duration-300 group-hover:text-[#722F37]">
                {language === 'hi' ? category.nameHi : category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
