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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {beautyCategories.map((category, index) => (
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
