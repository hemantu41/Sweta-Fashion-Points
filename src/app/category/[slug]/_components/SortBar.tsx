'use client';

import { ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'popular',    label: 'Popularity' },
  { value: 'price_low',  label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'discount',   label: 'Most Discount' },
];

interface Props {
  sort: string;
  onSortChange: (sort: string) => void;
  filteredTotal: number;
  currentPage: number;
  pageSize: number;
}

export default function SortBar({ sort, onSortChange, filteredTotal, currentPage, pageSize }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const from = filteredTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to   = Math.min(currentPage * pageSize, filteredTotal);
  const activeLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Newest';

  return (
    <div
      className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-gray-100"
      style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
    >
      {/* Left: count */}
      <span className="text-[13px] text-gray-400">
        {filteredTotal === 0 ? 'No results' : (
          <>
            Showing{' '}
            <strong className="text-gray-700">{from}–{to}</strong>
            {' '}of{' '}
            <strong className="text-gray-700">{filteredTotal}</strong>
            {' '}products
          </>
        )}
      </span>

      {/* Right: sort pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] text-gray-400 flex items-center gap-1">
          <ArrowUpDown size={11} /> Sort by:
        </span>

        {/* Mobile: dropdown */}
        <div className="relative md:hidden">
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold border"
            style={{ borderColor: '#5B1A3A', color: '#5B1A3A' }}
          >
            {activeLabel} ▾
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[180px] overflow-hidden">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onSortChange(opt.value); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-[13px] transition-colors"
                  style={{
                    background: sort === opt.value ? 'rgba(91,26,58,0.06)' : '#fff',
                    color: sort === opt.value ? '#5B1A3A' : '#374151',
                    fontWeight: sort === opt.value ? 600 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: pills */}
        <div className="hidden md:flex items-center gap-1.5 flex-wrap">
          {SORT_OPTIONS.map(opt => {
            const active = sort === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all"
                style={{
                  background: active ? '#5B1A3A' : '#fff',
                  color:      active ? '#fff'    : '#374151',
                  borderColor: active ? '#5B1A3A' : '#E5E7EB',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#FDF4F8'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
