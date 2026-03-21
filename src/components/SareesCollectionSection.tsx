'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface SareeCategory {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  link: string;
  bgGradient: string;
  bgImage?: string;
}

const sareeCategories: SareeCategory[] = [
  {
    id: 'daily',
    name: 'Daily Wear Sarees',
    nameHi: 'डेली वियर साड़ी',
    description: 'Everyday Elegance',
    descriptionHi: 'रोजमर्रा की सुंदरता',
    link: '/sarees?category=daily',
    bgGradient: 'from-green-100 via-emerald-100 to-green-200',
    bgImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'party',
    name: 'Party Wear Sarees',
    nameHi: 'पार्टी वियर साड़ी',
    description: 'Glamorous & Stylish',
    descriptionHi: 'ग्लैमरस और स्टाइलिश',
    link: '/sarees?category=party',
    bgGradient: 'from-purple-100 via-pink-100 to-purple-200',
    bgImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e51f2?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'wedding',
    name: 'Wedding & Bridal Sarees',
    nameHi: 'शादी और दुल्हन साड़ी',
    description: 'Bridal Perfection',
    descriptionHi: 'दुल्हन की पूर्णता',
    link: '/sarees?category=wedding',
    bgGradient: 'from-red-100 via-rose-100 to-red-200',
    bgImage: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'festival',
    name: 'Festival Special Sarees',
    nameHi: 'त्योहार विशेष साड़ी',
    description: 'Festive Elegance',
    descriptionHi: 'उत्सव की सुंदरता',
    link: '/sarees?category=festival',
    bgGradient: 'from-amber-100 via-yellow-100 to-amber-200',
    bgImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
];

export default function SareesCollectionSection() {
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
            {language === 'hi' ? 'साड़ियों का संग्रह' : 'Sarees Collection'}
          </h2>

          <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
            {language === 'hi'
              ? 'भारतीय परंपरा और आधुनिक शैली का संगम'
              : 'Where tradition meets modern elegance'
            }
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {sareeCategories.map((category, index) => (
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
