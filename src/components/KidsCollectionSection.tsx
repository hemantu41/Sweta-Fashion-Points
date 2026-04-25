'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCategories, type CategoryNode } from '@/hooks/useCategories';

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
    id: '0-3',
    name: 'Age 0-3 Years',
    nameHi: '0-3 वर्ष',
    description: 'Infants & Toddlers',
    descriptionHi: 'शिशु और छोटे बच्चे',
    link: '/kids?category=0-3',
    bgGradient: 'from-blue-100 via-sky-100 to-blue-200',
    bgImage: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: '4-7',
    name: 'Age 4-7 Years',
    nameHi: '4-7 वर्ष',
    description: 'Pre-School Kids',
    descriptionHi: 'प्री-स्कूल बच्चे',
    link: '/kids?category=4-7',
    bgGradient: 'from-green-100 via-lime-100 to-green-200',
    bgImage: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: '8-12',
    name: 'Age 8-12 Years',
    nameHi: '8-12 वर्ष',
    description: 'School Going Kids',
    descriptionHi: 'स्कूल के बच्चे',
    link: '/kids?category=8-12',
    bgGradient: 'from-indigo-100 via-purple-100 to-indigo-200',
    bgImage: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
  {
    id: 'all-ages',
    name: 'All Ages',
    nameHi: 'सभी उम्र',
    description: 'Universal Collection',
    descriptionHi: 'सार्वभौमिक संग्रह',
    link: '/kids',
    bgGradient: 'from-orange-100 via-amber-100 to-orange-200',
    bgImage: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e5?w=1600&h=1200&q=90&auto=format&fit=crop',
  },
];

function resolveLink(tree: CategoryNode[], l1Kw: string, subKw: string, fallback: string): string {
  if (tree.length === 0) return fallback;
  const l1 = tree.find(n => n.name.toLowerCase().includes(l1Kw.toLowerCase()));
  if (!l1) return fallback;
  if (subKw) {
    const l2 = (l1.children || []).find(n => n.name.toLowerCase().includes(subKw.toLowerCase()));
    if (l2) return `/category/${l2.slug}`;
  }
  return `/category/${l1.slug}`;
}

export default function KidsCollectionSection() {
  const { language } = useLanguage();
  const { tree } = useCategories();
  const subKeywords: Record<string, string> = { '0-3': 'infant', '4-7': 'pre', '8-12': 'school', 'all-ages': '' };

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {kidsCategories.map((category, index) => (
            <Link
              key={category.id}
              href={resolveLink(tree, 'kid', subKeywords[category.id] || '', category.link)}
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
