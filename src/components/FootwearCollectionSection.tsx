'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCategories, type CategoryNode } from '@/hooks/useCategories';

interface FootwearCategory {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  icon: string;
  link: string;
  bgGradient: string;
  bgImage?: string;
}

const footwearCategories: FootwearCategory[] = [
  {
    id: 'sport-shoes',
    name: 'Sport Shoes',
    nameHi: 'स्पोर्ट शूज़',
    description: 'Performance & Comfort',
    descriptionHi: 'प्रदर्शन और आराम',
    icon: '',
    link: '/footwear?category=sport-shoes',
    bgGradient: 'from-blue-50 to-cyan-100',
    bgImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&q=90&auto=format&fit=crop',
  },
  {
    id: 'sneakers',
    name: 'Sneakers',
    nameHi: 'स्नीकर्स',
    description: 'Street Style',
    descriptionHi: 'स्ट्रीट स्टाइल',
    icon: '',
    link: '/footwear?category=sneakers',
    bgGradient: 'from-purple-50 to-pink-100',
    bgImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&q=90&auto=format&fit=crop',
  },
  {
    id: 'formal-shoes',
    name: 'Formal Shoes',
    nameHi: 'फॉर्मल शूज़',
    description: 'Elegant & Professional',
    descriptionHi: 'सुरुचिपूर्ण और पेशेवर',
    icon: '',
    link: '/footwear?category=formal-shoes',
    bgGradient: 'from-gray-50 to-slate-100',
    bgImage: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&h=800&q=90&auto=format&fit=crop',
  },
  {
    id: 'slippers',
    name: 'Slippers',
    nameHi: 'चप्पल',
    description: 'Casual & Comfortable',
    descriptionHi: 'आरामदायक और कैजुअल',
    icon: '',
    link: '/footwear?category=slippers',
    bgGradient: 'from-orange-50 to-amber-100',
    bgImage: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=800&q=90&auto=format&fit=crop',
  },
];

function resolveLink(tree: CategoryNode[], l1Kw: string, subKw: string, fallback: string): string {
  if (tree.length === 0) return fallback;
  const kw = l1Kw.toLowerCase();
  const l1 = tree.find(n => n.name.toLowerCase().startsWith(kw) || n.slug.toLowerCase().startsWith(kw));
  if (!l1) return fallback;
  if (subKw) {
    const l2 = (l1.children || []).find(n => n.name.toLowerCase().includes(subKw.toLowerCase()));
    if (l2) return `/category/${l2.slug}`;
  }
  return `/category/${l1.slug}`;
}

export default function FootwearCollectionSection() {
  const { language } = useLanguage();
  const { tree } = useCategories();
  const subKeywords: Record<string, string> = { 'sport-shoes': 'sport', sneakers: 'sneaker', 'formal-shoes': 'formal', slippers: 'slipper' };

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
          <h2 
            className="text-4xl md:text-5xl font-bold text-[#722F37] mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {language === 'hi' ? 'फुटवियर कलेक्शन' : 'Footwear Collection'}
          </h2>
          <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
            {language === 'hi'
              ? 'हर कदम पर स्टाइल और आराम'
              : 'Style and comfort for every step'
            }
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {footwearCategories.map((category, index) => (
            <Link
              key={category.id}
              href={resolveLink(tree, 'footwear', subKeywords[category.id] || '', category.link)}
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
