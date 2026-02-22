'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface BeautyCategory {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  link: string;
  bgGradient: string;
  bgImage?: string;
}

const beautyCategories: BeautyCategory[] = [
  {
    id: 'skincare',
    name: 'Skincare',
    nameHi: 'स्किनकेयर',
    description: 'Glow & Radiance',
    descriptionHi: 'चमक और निखार',
    link: '/makeup?category=skincare',
    bgGradient: 'from-pink-100 via-rose-100 to-pink-200',
    bgImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'makeup',
    name: 'Makeup',
    nameHi: 'मेकअप',
    description: 'Beauty Essentials',
    descriptionHi: 'ब्यूटी एसेंशियल',
    link: '/makeup?category=makeup',
    bgGradient: 'from-purple-100 via-fuchsia-100 to-purple-200',
    bgImage: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'fragrance',
    name: 'Fragrance',
    nameHi: 'फ्रेगरेंस',
    description: 'Signature Scents',
    descriptionHi: 'खास सुगंध',
    link: '/makeup?category=fragrance',
    bgGradient: 'from-violet-100 via-indigo-100 to-violet-200',
    bgImage: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'haircare',
    name: 'Hair Care',
    nameHi: 'हेयर केयर',
    description: 'Healthy & Shiny',
    descriptionHi: 'स्वस्थ और चमकदार',
    link: '/makeup?category=haircare',
    bgGradient: 'from-teal-100 via-cyan-100 to-teal-200',
    bgImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
];

export default function BeautyMakeupCollectionSection() {
  const { language } = useLanguage();

  return (
    <section className="relative py-20 bg-white overflow-hidden">
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
            {language === 'hi' ? 'ब्यूटी और मेकअप' : 'Beauty & Makeup'}
          </h2>

          <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
            {language === 'hi'
              ? 'अपनी खूबसूरती को निखारें'
              : 'Enhance your natural beauty'
            }
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {beautyCategories.map((category, index) => (
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
            href="/makeup"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#722F37] text-white font-semibold rounded-full hover:bg-[#5A252C] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="tracking-wide">
              {language === 'hi' ? 'सभी ब्यूटी उत्पाद देखें' : 'View All Beauty Products'}
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
