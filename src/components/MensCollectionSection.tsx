'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCategories, type CategoryNode } from '@/hooks/useCategories';

interface MensCategory {
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

const mensCategories: MensCategory[] = [
  {
    id: 'shirts',
    name: 'Shirts',
    nameHi: 'शर्ट',
    description: 'Formal & Casual Shirts',
    descriptionHi: 'फॉर्मल और कैजुअल शर्ट',
    icon: '',
    link: '/mens?category=shirts',
    bgGradient: 'from-blue-50 to-cyan-100',
    bgImage: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=800&q=90&auto=format&fit=crop',
  },
  {
    id: 'tshirts',
    name: 'T-Shirts',
    nameHi: 'टी-शर्ट',
    description: 'Trendy & Comfortable',
    descriptionHi: 'ट्रेंडी और आरामदायक',
    icon: '',
    link: '/mens?category=tshirts',
    bgGradient: 'from-pink-50 to-purple-100',
    bgImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&q=90&auto=format&fit=crop',
  },
  {
    id: 'jeans',
    name: 'Jeans',
    nameHi: 'जींस',
    description: 'Denim Perfection',
    descriptionHi: 'डेनिम परफेक्शन',
    icon: '',
    link: '/mens?category=jeans',
    bgGradient: 'from-pink-50 to-purple-100',
    bgImage: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&q=90&auto=format&fit=crop',
  },
  {
    id: 'shorts',
    name: 'Shorts & Trousers',
    nameHi: 'शॉर्ट्स और ट्राउज़र',
    description: 'Comfortable & Stylish',
    descriptionHi: 'आरामदायक और स्टाइलिश',
    icon: '',
    link: '/mens?category=shorts',
    bgGradient: 'from-purple-50 to-indigo-100',
    bgImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=800&q=90&auto=format&fit=crop',
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

export default function MensCollectionSection() {
  const { language } = useLanguage();
  const { tree } = useCategories();
  const subKeywords: Record<string, string> = { shirts: 'shirt', tshirts: 'shirt', jeans: 'jean', shorts: 'short' };

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
            {language === 'hi' ? 'पुरुषों के लिए फैशन' : 'Fashion for Men'}
          </h2>

          <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
            {language === 'hi'
              ? 'आधुनिक पुरुषों के लिए स्टाइल और आराम'
              : 'Style and comfort for the modern man'
            }
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {mensCategories.map((category, index) => (
            <Link
              key={category.id}
              href={resolveLink(tree, 'men', subKeywords[category.id] || '', category.link)}
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
