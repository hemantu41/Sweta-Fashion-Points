'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface KidsCategory {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  link: string;
  bgGradient: string;
  bgImage?: string;
}

const kidsCategories: KidsCategory[] = [
  {
    id: 'tshirts',
    name: 'T-Shirts',
    nameHi: 'टी-शर्ट',
    description: 'Fun & Colorful',
    descriptionHi: 'मजेदार और रंगीन',
    link: '/kids?category=tshirts',
    bgGradient: 'from-blue-100 via-sky-100 to-blue-200',
    bgImage: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'shirts',
    name: 'Shirts',
    nameHi: 'शर्ट',
    description: 'Smart & Stylish',
    descriptionHi: 'स्मार्ट और स्टाइलिश',
    link: '/kids?category=shirts',
    bgGradient: 'from-green-100 via-lime-100 to-green-200',
    bgImage: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'jeans',
    name: 'Jeans',
    nameHi: 'जींस',
    description: 'Durable & Trendy',
    descriptionHi: 'टिकाऊ और ट्रेंडी',
    link: '/kids?category=jeans',
    bgGradient: 'from-indigo-100 via-purple-100 to-indigo-200',
    bgImage: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'casual',
    name: 'Casual Wear',
    nameHi: 'कैजुअल वियर',
    description: 'Playful & Comfy',
    descriptionHi: 'चंचल और आरामदायक',
    link: '/kids?category=casual',
    bgGradient: 'from-orange-100 via-amber-100 to-orange-200',
    bgImage: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e5?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
];

export default function KidsCollectionSection() {
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
            {language === 'hi' ? 'बच्चों के लिए फैशन' : 'Fashion for Kids'}
          </h2>

          <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
            {language === 'hi'
              ? 'आपके छोटे सितारों के लिए स्टाइल और आराम'
              : 'Style and comfort for your little stars'
            }
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {kidsCategories.map((category, index) => (
            <Link
              key={category.id}
              href={category.link}
              className="group relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Card Container */}
              <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                {/* Background Image or Gradient */}
                <div className="absolute inset-0">
                  {category.bgImage ? (
                    <>
                      {/* Background Image */}
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                        style={{ backgroundImage: `url(${category.bgImage})` }}
                      ></div>
                      {/* Enhanced Overlay for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/70 to-white/60"></div>
                    </>
                  ) : (
                    <>
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.bgGradient} transition-transform duration-500 group-hover:scale-110`}></div>
                      {/* Subtle Pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{
                          backgroundImage: 'radial-gradient(circle at 2px 2px, #722F37 1px, transparent 0)',
                          backgroundSize: '40px 40px'
                        }}></div>
                      </div>
                    </>
                  )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-3 right-3 w-16 h-16 rounded-full border border-[#722F37]"></div>
                  <div className="absolute bottom-3 left-3 w-20 h-20 rounded-full border border-[#722F37]"></div>
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  {/* Text Container with Background */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg">
                    {/* Title */}
                    <h3 className="text-xl md:text-2xl font-bold mb-3 tracking-wide text-center text-[#2D2D2D]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                      {language === 'hi' ? category.nameHi : category.name}
                    </h3>

                    {/* Divider */}
                    <div className="w-12 h-0.5 bg-[#722F37] mb-3 mx-auto"></div>

                    {/* Description */}
                    <p className="text-sm text-[#6B6B6B] text-center font-medium tracking-wide">
                      {language === 'hi' ? category.descriptionHi : category.description}
                    </p>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-5 h-5 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-10">
          <Link
            href="/kids"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#722F37] text-white font-semibold rounded-full hover:bg-[#5A252C] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="tracking-wide">
              {language === 'hi' ? 'सभी बच्चों के उत्पाद देखें' : 'View All Kids Products'}
            </span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
