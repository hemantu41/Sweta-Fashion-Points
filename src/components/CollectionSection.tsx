'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface Collection {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  icon: string;
  link: string;
  bgGradient: string;
  accentColor: string;
}

const collections: Collection[] = [
  {
    id: 'mens',
    name: "Men's",
    nameHi: 'पुरुष',
    description: 'Sophisticated & Contemporary',
    descriptionHi: 'परिष्कृत और आधुनिक',
    icon: '👔',
    link: '/mens',
    bgGradient: 'from-slate-900 via-gray-800 to-slate-900',
    accentColor: '#60A5FA',
  },
  {
    id: 'womens',
    name: "Women's",
    nameHi: 'महिला',
    description: 'Elegant & Timeless',
    descriptionHi: 'सुरुचिपूर्ण और कालातीत',
    icon: '👗',
    link: '/womens',
    bgGradient: 'from-rose-900 via-pink-800 to-rose-900',
    accentColor: '#FB7185',
  },
  {
    id: 'kids',
    name: "Kids",
    nameHi: 'बच्चे',
    description: 'Playful & Comfortable',
    descriptionHi: 'खिलंड़ा और आरामदायक',
    icon: '👶',
    link: '/kids',
    bgGradient: 'from-amber-600 via-orange-600 to-amber-600',
    accentColor: '#FBBF24',
  },
  {
    id: 'sarees',
    name: 'Sarees',
    nameHi: 'साड़ी',
    description: 'Graceful & Traditional',
    descriptionHi: 'लावण्यमय और पारंपरिक',
    icon: '🥻',
    link: '/sarees',
    bgGradient: 'from-purple-900 via-violet-800 to-purple-900',
    accentColor: '#A78BFA',
  },
  {
    id: 'makeup',
    name: 'Beauty',
    nameHi: 'ब्यूटी',
    description: 'Radiant & Confident',
    descriptionHi: 'उज्ज्वल और आत्मविश्वासी',
    icon: '💄',
    link: '/makeup',
    bgGradient: 'from-red-800 via-pink-700 to-red-800',
    accentColor: '#F472B6',
  },
];

export default function CollectionSection() {
  const { language } = useLanguage();

  return (
    <section className="relative py-24 bg-gradient-to-b from-[#FAF7F2] to-white overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #722F37 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Premium Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-6 border border-[#E8E2D9]">
            <div className="w-2 h-2 rounded-full bg-[#722F37] animate-pulse"></div>
            <span className="text-sm font-medium text-[#722F37] tracking-wide">
              {language === 'hi' ? 'प्रीमियम कलेक्शन' : 'PREMIUM COLLECTIONS'}
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#2D2D2D] mb-4 tracking-tight" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            {language === 'hi' ? 'विशेष संग्रह' : 'Curated Collections'}
          </h2>

          <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto leading-relaxed">
            {language === 'hi'
              ? 'हर अवसर के लिए उत्कृष्ट शैली और गुणवत्ता'
              : 'Exquisite style and quality for every occasion'
            }
          </p>
        </div>

        {/* Premium Collection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {collections.map((collection, index) => (
            <Link
              key={collection.id}
              href={collection.link}
              className="group relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Card Container */}
              <div className="relative h-72 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3">
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${collection.bgGradient} transition-transform duration-500 group-hover:scale-110`}></div>

                {/* Glassmorphism Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>

                {/* Subtle Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 w-24 h-24 rounded-full border border-white"></div>
                  <div className="absolute bottom-4 left-4 w-32 h-32 rounded-full border border-white"></div>
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
                  {/* Icon */}
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {collection.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold mb-2 tracking-wide" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                    {language === 'hi' ? collection.nameHi : collection.name}
                  </h3>

                  {/* Divider */}
                  <div className="w-12 h-0.5 mb-3" style={{ backgroundColor: collection.accentColor }}></div>

                  {/* Description */}
                  <p className="text-sm text-white/90 text-center font-light tracking-wide">
                    {language === 'hi' ? collection.descriptionHi : collection.description}
                  </p>

                  {/* Hover Arrow */}
                  <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
