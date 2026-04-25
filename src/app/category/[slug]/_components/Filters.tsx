'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterState {
  minPrice:    number | null;
  maxPrice:    number | null;
  sizes:       string[];
  fabrics:     string[];
  minRating:   number | null;
  cities:      string[];
  minDiscount: number | null;
}

export const DEFAULT_FILTERS: FilterState = {
  minPrice: null, maxPrice: null,
  sizes: [], fabrics: [],
  minRating: null, cities: [],
  minDiscount: null,
};

interface FilterProps {
  filters:          FilterState;
  onChange:         (patch: Partial<FilterState>) => void;
  onClear:          () => void;
  availableFabrics: string[];
  availableCities:  string[];
}

// ─── Static option lists ──────────────────────────────────────────────────────

const SIZES = [
  // Standard apparel
  'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL',
  // Numeric dress / bottom sizes
  '28', '30', '32', '34', '36', '38', '40', '42', '44', '46',
  // Kids / saree blouse / kids numeric
  '20', '22', '24', '26',
  // Footwear
  '5', '6', '7', '8', '9', '10', '11',
];
const ALL_FABRICS = [
  'Cotton', 'Pure Cotton', 'Silk', 'Pure Silk', 'Banarasi Silk', 'Kanjivaram Silk',
  'Chiffon', 'Georgette', 'Crepe', 'Satin', 'Net', 'Lace',
  'Rayon', 'Viscose', 'Polyester', 'Nylon',
  'Linen', 'Khadi', 'Handloom',
  'Velvet', 'Brocade', 'Jacquard', 'Organza', 'Chanderi', 'Tussar',
  'Denim', 'Wool', 'Fleece', 'Terry Cotton',
];

const DISCOUNT = [{ label: '10% or more', value: 10 }, { label: '25% or more', value: 25 }, { label: '50% or more', value: 50 }];
const RATINGS  = [{ label: '4 & above', value: 4 }, { label: '3 & above', value: 3 }];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Accordion({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3"
      >
        <span
          className="text-[12px] uppercase font-semibold tracking-[0.08em]"
          style={{ color: '#5B1A3A', fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
        >
          {title}
        </span>
        {open ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

function Checkbox({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="w-[15px] h-[15px] rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all"
      style={{
        background:   checked ? '#5B1A3A' : '#fff',
        borderColor:  checked ? '#5B1A3A' : '#D1D5DB',
      }}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function Radio({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all"
      style={{ borderColor: checked ? '#5B1A3A' : '#D1D5DB' }}
    >
      {checked && <div className="w-[7px] h-[7px] rounded-full" style={{ background: '#5B1A3A' }} />}
    </div>
  );
}

// ─── FilterContent — shared between sidebar and drawer ───────────────────────

function FilterContent({ filters, onChange, onClear, availableFabrics, availableCities }: FilterProps) {
  const [minInput, setMinInput] = useState(filters.minPrice?.toString() ?? '');
  const [maxInput, setMaxInput] = useState(filters.maxPrice?.toString() ?? '');

  // Keep inputs in sync when filters cleared externally
  useEffect(() => {
    if (filters.minPrice === null) setMinInput('');
    if (filters.maxPrice === null) setMaxInput('');
  }, [filters.minPrice, filters.maxPrice]);

  const activeCount = [
    filters.minPrice || filters.maxPrice,
    filters.sizes.length > 0,
    filters.fabrics.length > 0,
    filters.minRating,
    filters.cities.length > 0,
    filters.minDiscount,
  ].filter(Boolean).length;

  return (
    <div style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span
            className="text-[15px] font-bold"
            style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', color: '#1A1A1A' }}
          >
            FILTERS
          </span>
          {activeCount > 0 && (
            <span
              className="text-[10px] font-bold text-white w-[18px] h-[18px] rounded-full flex items-center justify-center"
              style={{ background: '#5B1A3A' }}
            >
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-[12px] font-semibold"
            style={{ color: '#C49A3C' }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* ── Active chips ── */}
      {activeCount > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-gray-100">
          {filters.sizes.map(s => (
            <button
              key={s}
              onClick={() => onChange({ sizes: filters.sizes.filter(x => x !== s) })}
              className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border"
              style={{ borderColor: '#5B1A3A', color: '#5B1A3A' }}
            >
              {s} <X size={9} style={{ color: '#C49A3C' }} />
            </button>
          ))}
          {filters.fabrics.map(f => (
            <button
              key={f}
              onClick={() => onChange({ fabrics: filters.fabrics.filter(x => x !== f) })}
              className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border"
              style={{ borderColor: '#5B1A3A', color: '#5B1A3A' }}
            >
              {f} <X size={9} style={{ color: '#C49A3C' }} />
            </button>
          ))}
          {(filters.minPrice || filters.maxPrice) && (
            <button
              onClick={() => { onChange({ minPrice: null, maxPrice: null }); setMinInput(''); setMaxInput(''); }}
              className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border"
              style={{ borderColor: '#5B1A3A', color: '#5B1A3A' }}
            >
              ₹{filters.minPrice ?? 0}–{filters.maxPrice ? `₹${filters.maxPrice}` : '∞'}
              <X size={9} style={{ color: '#C49A3C' }} />
            </button>
          )}
          {filters.minRating && (
            <button
              onClick={() => onChange({ minRating: null })}
              className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border"
              style={{ borderColor: '#5B1A3A', color: '#5B1A3A' }}
            >
              {filters.minRating}+ <X size={9} style={{ color: '#C49A3C' }} />
            </button>
          )}
          {filters.minDiscount && (
            <button
              onClick={() => onChange({ minDiscount: null })}
              className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border"
              style={{ borderColor: '#5B1A3A', color: '#5B1A3A' }}
            >
              {filters.minDiscount}%+ off <X size={9} style={{ color: '#C49A3C' }} />
            </button>
          )}
        </div>
      )}

      {/* ── Sections ── */}
      <div className="px-4">

        {/* Price Range */}
        <Accordion title="Price Range">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-gray-400 mb-1">MIN (₹)</label>
              <input
                type="number"
                value={minInput}
                onChange={e => setMinInput(e.target.value)}
                onBlur={() => onChange({ minPrice: minInput ? parseInt(minInput) : null })}
                onKeyDown={e => { if (e.key === 'Enter') onChange({ minPrice: minInput ? parseInt(minInput) : null }); }}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-[#5B1A3A]"
              />
            </div>
            <span className="text-gray-400 text-sm mb-2">—</span>
            <div className="flex-1">
              <label className="block text-[10px] text-gray-400 mb-1">MAX (₹)</label>
              <input
                type="number"
                value={maxInput}
                onChange={e => setMaxInput(e.target.value)}
                onBlur={() => onChange({ maxPrice: maxInput ? parseInt(maxInput) : null })}
                onKeyDown={e => { if (e.key === 'Enter') onChange({ maxPrice: maxInput ? parseInt(maxInput) : null }); }}
                placeholder="5000"
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-[#5B1A3A]"
              />
            </div>
          </div>
        </Accordion>

        {/* Size */}
        <Accordion title="Size">
          <div className="flex flex-wrap gap-1.5">
            {SIZES.map(size => {
              const active = filters.sizes.includes(size);
              return (
                <button
                  key={size}
                  onClick={() => onChange({ sizes: toggle(filters.sizes, size) })}
                  className="px-3 py-1 rounded-full text-[12px] font-medium border transition-all"
                  style={{
                    background:  active ? '#5B1A3A' : '#fff',
                    color:       active ? '#fff'    : '#374151',
                    borderColor: active ? '#5B1A3A' : '#E5E7EB',
                  }}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </Accordion>

        {/* Fabric */}
        <Accordion title="Fabric">
          <div className="space-y-2.5">
            {[...new Set([...availableFabrics, ...ALL_FABRICS])].map(fabric => (
              <label key={fabric} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={filters.fabrics.includes(fabric)}
                  onClick={() => onChange({ fabrics: toggle(filters.fabrics, fabric) })}
                />
                <span className="text-[13px] text-gray-600 group-hover:text-gray-900 transition-colors">{fabric}</span>
              </label>
            ))}
          </div>
        </Accordion>

        {/* Rating */}
        <Accordion title="Rating">
          <div className="space-y-2.5">
            {RATINGS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                <Radio
                  checked={filters.minRating === opt.value}
                  onClick={() => onChange({ minRating: filters.minRating === opt.value ? null : opt.value })}
                />
                <span className="text-[12px] text-gray-600">
                  <span style={{ color: '#F59E0B' }}></span>{' '}{opt.label}
                </span>
              </label>
            ))}
          </div>
        </Accordion>


        {/* Discount */}
        <Accordion title="Discount">
          <div className="space-y-2.5">
            {DISCOUNT.map(opt => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                <Radio
                  checked={filters.minDiscount === opt.value}
                  onClick={() => onChange({ minDiscount: filters.minDiscount === opt.value ? null : opt.value })}
                />
                <span className="text-[13px] text-gray-600 group-hover:text-gray-900 transition-colors">{opt.label}</span>
              </label>
            ))}
          </div>
        </Accordion>

      </div>
    </div>
  );
}

// ─── FilterSidebar — desktop sticky sidebar ───────────────────────────────────

export function FilterSidebar(props: FilterProps) {
  return (
    <aside
      className="hidden md:block flex-shrink-0 sticky"
      style={{ width: 260, top: 80, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', scrollbarWidth: 'thin' }}
    >
      <div
        className="bg-white rounded-xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}
      >
        <FilterContent {...props} />
      </div>
    </aside>
  );
}

// ─── FilterDrawer — mobile bottom sheet ──────────────────────────────────────

interface DrawerProps extends FilterProps {
  open:    boolean;
  onClose: () => void;
  onApply: () => void;
}

export function FilterDrawer({ open, onClose, onApply, ...rest }: DrawerProps) {
  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          <FilterContent {...rest} />
        </div>

        {/* Apply button */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
          <button
            onClick={onApply}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)', fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
          >
            Apply Filters {rest.filters.sizes.length + rest.filters.fabrics.length + rest.filters.cities.length > 0
              ? `(${rest.filters.sizes.length + rest.filters.fabrics.length + rest.filters.cities.length} active)`
              : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
