'use client';

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
  const activeLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Newest';
  const from = filteredTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to   = Math.min(currentPage * pageSize, filteredTotal);

  return (
    <div
      className="sticky top-0 z-10 bg-white"
      style={{
        borderBottom: '1px solid #E5E7EB',
        fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
      }}
    >
      {/* ── Desktop: tab row ── */}
      <div className="hidden md:flex items-center">
        <span style={{ fontSize: 13, color: '#6B7280', padding: '0 14px', whiteSpace: 'nowrap' }}>
          Sort By
        </span>
        <div style={{ width: 1, height: 18, background: '#E5E7EB', flexShrink: 0 }} />
        {SORT_OPTIONS.map(opt => {
          const active = sort === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              style={{
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? '#5B1A3A' : '#374151',
                padding: '13px 18px',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid #5B1A3A' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color 150ms ease, border-color 150ms ease',
                whiteSpace: 'nowrap',
                marginBottom: -1, // sit flush on the container border
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#5B1A3A'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#374151'; }}
            >
              {opt.label}
            </button>
          );
        })}

        {/* Result count — pushed to right */}
        <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto', padding: '0 16px', whiteSpace: 'nowrap' }}>
          {filteredTotal === 0 ? 'No results' : (
            <>{from}–{to} of <strong style={{ color: '#6B7280' }}>{filteredTotal}</strong></>
          )}
        </span>
      </div>

      {/* ── Mobile: label + dropdown ── */}
      <div className="flex md:hidden items-center justify-between px-4 py-2.5">
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>
          {filteredTotal === 0 ? 'No results' : (
            <>{from}–{to} of <strong style={{ color: '#6B7280' }}>{filteredTotal}</strong></>
          )}
        </span>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 13, fontWeight: 600, color: '#5B1A3A',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 400 }}>Sort:</span>
            {activeLabel} ▾
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 4,
              background: '#fff', border: '1px solid #E5E7EB',
              borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              zIndex: 30, minWidth: 190, overflow: 'hidden',
            }}>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onSortChange(opt.value); setDropdownOpen(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '11px 16px', fontSize: 13, border: 'none',
                    background: sort === opt.value ? 'rgba(91,26,58,0.05)' : '#fff',
                    color: sort === opt.value ? '#5B1A3A' : '#374151',
                    fontWeight: sort === opt.value ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
