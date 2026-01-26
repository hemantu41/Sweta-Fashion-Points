'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import type { Category } from '@/data/products';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const { language } = useLanguage();

  const emojis: Record<string, string> = {
    mens: '👔',
    womens: '👗',
    sarees: '🥻',
    kids: '👶',
  };

  return (
    <Link href={category.link}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FAF7F2] to-[#F5F0E8] card-hover group cursor-pointer h-72 border border-[#E8E2D9]">
        {/* Background Pattern */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-8xl opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500">
            {emojis[category.id]}
          </span>
        </div>

        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#722F37] via-[#C9A962] to-[#722F37] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-white via-white/80 to-transparent">
          <h3 className="text-xl font-bold text-[#2D2D2D] mb-1" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            {language === 'hi' ? category.nameHi : category.name}
          </h3>
          <p className="text-sm text-[#6B6B6B]">
            {language === 'hi' ? category.descriptionHi : category.description}
          </p>
          <div className="mt-4 flex items-center text-[#722F37] font-medium text-sm group-hover:translate-x-2 transition-transform duration-300">
            <span>Explore</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>

        {/* Highlight for Sarees */}
        {category.id === 'sarees' && (
          <div className="absolute top-4 right-4">
            <span className="bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
              Popular <span className="text-[#C9A962]">✦</span>
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
