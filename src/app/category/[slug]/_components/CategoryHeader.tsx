'use client';

import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';

interface Crumb { id: string; name: string; slug: string }

interface Props {
  breadcrumb: Crumb[];
  category: { name: string; name_hindi?: string; icon?: string } | null;
  totalProducts: number;
  filteredTotal: number;
  currentPage: number;
  pageSize: number;
}

export default function CategoryHeader({
  breadcrumb, category, totalProducts, filteredTotal, currentPage, pageSize,
}: Props) {
  const from = filteredTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to   = Math.min(currentPage * pageSize, filteredTotal);

  return (
    <div className="mb-5" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
      {/* Breadcrumb */}
      <nav className="flex items-center flex-wrap gap-1 mb-3 text-[13px]">
        <Link href="/" className="flex items-center gap-1 text-gray-400 hover:text-[#5B1A3A] transition-colors">
          <Home size={11} /> Home
        </Link>
        {breadcrumb.map((crumb, i) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight size={11} className="text-gray-300" />
            {i === breadcrumb.length - 1 ? (
              <span className="font-semibold" style={{ color: '#5B1A3A' }}>{crumb.name}</span>
            ) : (
              <Link
                href={`/category/${crumb.slug}`}
                className="hover:underline transition-colors"
                style={{ color: '#5B1A3A' }}
              >
                {crumb.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Title row */}
      <div className="flex items-start gap-3">
        {category?.icon && (
          <span className="text-[26px] leading-none mt-0.5">{category.icon}</span>
        )}
        <div>
          <h1
            className="text-[28px] font-bold leading-tight"
            style={{
              fontFamily: 'var(--font-playfair, Playfair Display, serif)',
              color: '#1A1A1A',
            }}
          >
            {category?.name ?? ''}
          </h1>
          {category?.name_hindi && (
            <p
              className="text-[14px] italic mt-0.5"
              style={{ color: '#C49A3C', fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
            >
              {category.name_hindi}
            </p>
          )}
        </div>
      </div>

      {/* Product count */}
      <p className="text-[13px] text-gray-400 mt-2">
        {filteredTotal === 0 ? (
          'No products found'
        ) : filteredTotal < totalProducts ? (
          <>
            Showing <span className="font-semibold text-gray-700">{from}–{to}</span> of{' '}
            <span className="font-semibold text-gray-700">{filteredTotal}</span> filtered results
            {' '}
            <span className="text-gray-300">({totalProducts} total)</span>
          </>
        ) : (
          <>
            Showing <span className="font-semibold text-gray-700">{from}–{to}</span> of{' '}
            <span className="font-semibold text-gray-700">{filteredTotal}</span> products
          </>
        )}
      </p>
    </div>
  );
}
