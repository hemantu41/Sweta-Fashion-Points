'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';
import {
  Search, PackagePlus, ChevronDown, ChevronRight, X, Upload,
  AlertTriangle, Pencil, Check, MoreVertical, ShieldAlert,
  MousePointerClick, Info, Pause, Trash2, Copy, Play,
  RefreshCw, ClipboardList,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface Product {
  id: string;
  productId: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  stockQuantity: number;
  approvalStatus?: string;
  rejectionReason?: string;
  isActive: boolean;
  images?: string[];
  mainImage?: string;
  sizes?: string[];
  colors?: Array<{ name: string; hex: string }>;
  description?: string;
  deletedAt?: string | null;
}

type MainTab = 'active' | 'under_review' | 'blocked' | 'paused';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

/* ─── Constants ──────────────────────────────────────────────────────────────── */

const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: 'active',       label: 'Active' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'blocked',      label: 'Blocked' },
  { key: 'paused',       label: 'Paused' },
];

const BLOCK_SUB_TABS = [
  { key: 'all',          label: 'All' },
  { key: 'duplicate',    label: 'Duplicate' },
  { key: 'low_quality',  label: 'Low Quality' },
  { key: 'verification', label: 'Verification Failed' },
  { key: 'account',      label: 'Account Issue' },
  { key: 'late_dispatch',label: 'Late Dispatch' },
  { key: 'other',        label: 'Other' },
];

const SORT_OPTS = [
  { value: 'recent',    label: 'Most Recent' },
  { value: 'velocity',  label: 'Highest Sales Velocity' },
  { value: 'low_stock', label: 'Low Stock First' },
  { value: 'alpha',     label: 'Alphabetical A–Z' },
];

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function seededNum(seed: string, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h) + seed.charCodeAt(i); h |= 0; }
  return (Math.abs(h) % (max * 10)) / 10;
}
function getEstOrders(id: string) { return parseFloat(seededNum(id, 30).toFixed(1)); }
function getDaysToStockout(stock: number, id: string): number {
  if (stock === 0) return 0;
  const d = getEstOrders(id);
  return d < 0.1 ? 999 : Math.round(stock / d);
}

function filterByTab(products: Product[], tab: MainTab): Product[] {
  return products.filter(p => {
    if (p.deletedAt) return false;
    if (tab === 'active')       return p.approvalStatus === 'approved' && p.isActive;
    if (tab === 'under_review') return p.approvalStatus === 'pending' || p.approvalStatus === 'under_review';
    if (tab === 'blocked')      return p.approvalStatus === 'rejected';
    if (tab === 'paused')       return p.approvalStatus === 'approved' && !p.isActive;
    return false;
  });
}

function getSkuRows(product: Product) {
  const sizes = product.sizes?.length ? product.sizes : ['One Size'];
  return sizes.map((size, i) => ({
    rowId: `${product.id}|${i}`,
    productId: product.id,
    thumbnail: product.images?.[i] || product.mainImage || '',
    description: product.description || product.name,
    sizeVariant: size,
    stock: product.stockQuantity,
  }));
}

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);
  return { open, setOpen, ref };
}

/* ─── Toast ──────────────────────────────────────────────────────────────────── */

function Toast({ state, onDismiss }: { state: ToastState; onDismiss: () => void }) {
  if (!state.show) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium"
      style={{ background: state.type === 'success' ? '#16A34A' : '#DC2626', color: 'white' }}
    >
      {state.type === 'success' ? <Check size={15} /> : <X size={15} />}
      {state.message}
      <button onClick={onDismiss} className="ml-1 opacity-70 hover:opacity-100"><X size={13} /></button>
    </div>
  );
}

/* ─── Dropdown Shell ─────────────────────────────────────────────────────────── */

function DropShell({
  label, icon, open, setOpen, dropRef, active, children, minWidth = 200,
}: {
  label: string; icon?: React.ReactNode; open: boolean;
  setOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  dropRef: React.RefObject<HTMLDivElement | null>; active?: boolean;
  children: React.ReactNode; minWidth?: number;
}) {
  return (
    <div className="relative" ref={dropRef}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-all whitespace-nowrap"
        style={{ background: active ? '#5B1A3A' : 'white', color: active ? 'white' : '#374151', borderColor: active ? '#5B1A3A' : open ? '#5B1A3A' : '#E5DDD5' }}>
        {icon && <span className={active ? 'text-[#DDB868]' : 'text-[#6B7280]'}>{icon}</span>}
        <span>{label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''} ${active ? 'text-[#DDB868]' : 'text-[#6B7280]'}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-[#E5DDD5] rounded-xl z-30"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth }}>
          {children}
        </div>
      )}
    </div>
  );
}

function RadioDrop({ label, options, value, onChange, minWidth = 180 }: {
  label: string; options: { value: string; label: string }[];
  value: string; onChange: (v: string) => void; minWidth?: number;
}) {
  const { open, setOpen, ref } = useDropdown();
  const current = options.find(o => o.value === value)?.label || label;
  return (
    <DropShell label={current} open={open} setOpen={setOpen} dropRef={ref} active={!!value} minWidth={minWidth}>
      <div className="p-2 space-y-0.5">
        {options.map(opt => (
          <button key={opt.value || '_all'}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[#F5EDF2] text-left transition-colors"
            style={{ color: value === opt.value ? '#5B1A3A' : '#374151', fontWeight: value === opt.value ? 600 : 400 }}
            onClick={() => { onChange(opt.value); setOpen(false); }}>
            <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${value === opt.value ? 'border-[#5B1A3A] bg-[#5B1A3A]' : 'border-[#D1C4BE]'}`} />
            {opt.label}
          </button>
        ))}
      </div>
      {value && (
        <div className="border-t border-[#F0EAE4] px-3 py-2">
          <button onClick={() => { onChange(''); setOpen(false); }} className="text-[11px] text-[#6B7280] hover:text-[#5B1A3A]">Clear Filter</button>
        </div>
      )}
    </DropShell>
  );
}

/* ─── Category Dropdown ──────────────────────────────────────────────────────── */

function CategoryDropdown({ selected, onApply, onClear }: {
  selected: Set<string>; onApply: (ids: Set<string>) => void; onClear: () => void;
}) {
  const { open, setOpen, ref } = useDropdown();
  const { tree, loading } = useCategories();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set(selected));

  useEffect(() => { if (!open) setPending(new Set(selected)); }, [open, selected]);

  const toggle = (id: string, childIds?: string[]) => {
    setPending(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); childIds?.forEach(c => n.delete(c)); }
      else           { n.add(id);    childIds?.forEach(c => n.add(c)); }
      return n;
    });
  };

  const shown = search
    ? tree.filter(l1 => l1.name.toLowerCase().includes(search.toLowerCase()) ||
        l1.children.some(l2 => l2.name.toLowerCase().includes(search.toLowerCase())))
    : tree;

  const label = selected.size > 0 ? `Category (${selected.size})` : 'Category';

  return (
    <DropShell label={label} open={open} setOpen={setOpen} dropRef={ref} active={selected.size > 0} minWidth={270}>
      <div className="p-3">
        <div className="flex items-center gap-1.5 px-2 py-1.5 border border-[#E5DDD5] rounded-lg mb-3">
          <Search size={12} className="text-[#6B7280] flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="flex-1 outline-none text-xs text-[#374151] placeholder:text-[#B0A8A4] bg-transparent" />
        </div>
        <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
          {loading ? (
            <p className="text-xs text-[#6B7280] px-2 py-3">Loading…</p>
          ) : shown.map(l1 => {
            const l2Ids = l1.children.map(c => c.id);
            const isExp = expanded.has(l1.id) || search.length > 0;
            const allChecked = l2Ids.length > 0 ? l2Ids.every(id => pending.has(id)) : pending.has(l1.id);
            return (
              <div key={l1.id}>
                <div className="flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-[#F5EDF2] transition-colors">
                  <button onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(l1.id) ? n.delete(l1.id) : n.add(l1.id); return n; })}
                    className="flex-shrink-0 text-[#6B7280]">
                    {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input type="checkbox" checked={allChecked}
                      onChange={() => toggle(l1.id, l2Ids)}
                      className="w-3.5 h-3.5 rounded" style={{ accentColor: '#5B1A3A' }} />
                    <span className="text-xs font-semibold text-[#374151]">{l1.name}</span>
                  </label>
                </div>
                {isExp && l1.children.map(l2 => (
                  <label key={l2.id} className="flex items-center gap-2 ml-7 px-1 py-1.5 rounded-lg hover:bg-[#F5EDF2] transition-colors cursor-pointer">
                    <input type="checkbox" checked={pending.has(l2.id)}
                      onChange={() => toggle(l2.id)}
                      className="w-3.5 h-3.5 rounded" style={{ accentColor: '#5B1A3A' }} />
                    <span className="text-xs text-[#374151]">{l2.name}</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-[#F0EAE4] px-3 py-2 flex items-center justify-between">
        <button onClick={() => { setPending(new Set()); onClear(); setOpen(false); }}
          className="text-[11px] text-[#6B7280] hover:text-[#5B1A3A]">Clear Filter</button>
        <button onClick={() => { onApply(new Set(pending)); setOpen(false); }}
          className="px-3 py-1.5 text-[11px] font-semibold text-white rounded-lg" style={{ background: '#5B1A3A' }}>
          Apply
        </button>
      </div>
    </DropShell>
  );
}

/* ─── Kebab Menu ─────────────────────────────────────────────────────────────── */

function KebabMenu({ onPause, onDelete }: { onPause: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);
  const items = [
    { icon: <Pause size={13} />,  label: 'Pause this listing',   action: onPause,  danger: false },
    { icon: <X size={13} />,      label: 'Mark as Out of Stock', action: () => {},  danger: false },
    { icon: <Copy size={13} />,   label: 'Duplicate listing',    action: () => {},  danger: false },
    { icon: <Trash2 size={13} />, label: 'Delete listing',       action: onDelete, danger: true  },
  ];
  return (
    <div className="relative" ref={ref}>
      <button onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1 rounded hover:bg-[#F5EDF2] transition-colors text-[#6B7280]">
        <MoreVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5DDD5] rounded-xl z-40"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 190 }}>
          {items.map(it => (
            <button key={it.label}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-[#F5EDF2] transition-colors first:rounded-t-xl last:rounded-b-xl"
              style={{ color: it.danger ? '#DC2626' : '#374151' }}
              onClick={e => { e.stopPropagation(); it.action(); setOpen(false); }}>
              {it.icon}{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Empty States ───────────────────────────────────────────────────────────── */

function EmptyActive({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 gap-3">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <rect x="16" y="22" width="40" height="32" rx="5" fill="#F5EDF2" stroke="#E5DDD5" strokeWidth="1.5"/>
        <path d="M16 36 Q36 28 56 36" stroke="#C49A3C" strokeWidth="1.5" fill="none" strokeDasharray="4 3"/>
        <rect x="42" y="14" width="18" height="14" rx="2.5" fill="white" stroke="#E5DDD5" strokeWidth="1.5"/>
        <circle cx="45" cy="21" r="2" fill="#5B1A3A"/>
        <line x1="49" y1="18" x2="58" y2="18" stroke="#E5DDD5" strokeWidth="1.2"/>
        <line x1="49" y1="21" x2="57" y2="21" stroke="#E5DDD5" strokeWidth="1.2"/>
        <line x1="49" y1="24" x2="55" y2="24" stroke="#E5DDD5" strokeWidth="1.2"/>
      </svg>
      <p className="text-sm font-semibold text-[#374151]">No listings yet</p>
      <p className="text-xs text-[#6B7280]">Start by adding your first product.</p>
      <button onClick={onAdd}
        className="mt-1 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg"
        style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
        <PackagePlus size={14} /> Add New Listing
      </button>
    </div>
  );
}
function EmptyOutOfStock() {
  return (
    <div className="flex flex-col items-center py-16 gap-3">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <rect x="10" y="40" width="52" height="8" rx="2.5" fill="#F5EDF2" stroke="#E5DDD5" strokeWidth="1.5"/>
        <rect x="14" y="22" width="14" height="18" rx="2" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5"/>
        <rect x="30" y="22" width="14" height="18" rx="2" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5"/>
        <rect x="46" y="22" width="14" height="18" rx="2" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5"/>
        <path d="M19 31l3 3 6-6" stroke="#16A34A" strokeWidth="2" strokeLinecap="round"/>
        <path d="M35 31l3 3 6-6" stroke="#16A34A" strokeWidth="2" strokeLinecap="round"/>
        <path d="M51 31l3 3 6-6" stroke="#16A34A" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p className="text-sm font-semibold text-[#374151]">All products are in stock</p>
      <p className="text-xs text-[#6B7280]">Great! You have no out-of-stock items.</p>
    </div>
  );
}
function EmptyLowStock() {
  return (
    <div className="flex flex-col items-center py-16 gap-3">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <rect x="18" y="44" width="36" height="9" rx="2" fill="#F5EDF2" stroke="#E5DDD5" strokeWidth="1.5"/>
        <rect x="22" y="33" width="28" height="9" rx="2" fill="#F5EDF2" stroke="#E5DDD5" strokeWidth="1.5"/>
        <rect x="26" y="22" width="20" height="9" rx="2" fill="#F5EDF2" stroke="#E5DDD5" strokeWidth="1.5"/>
        <circle cx="52" cy="22" r="9" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5"/>
        <path d="M47.5 22l3 3 5-5" stroke="#16A34A" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p className="text-sm font-semibold text-[#374151]">Stock levels look healthy</p>
      <p className="text-xs text-[#6B7280]">All products have adequate stock.</p>
    </div>
  );
}
function EmptyBlocked() {
  return (
    <div className="flex flex-col items-center py-16 gap-3">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <path d="M36 12L16 24v16c0 12 9 23 20 26 11-3 20-14 20-26V24L36 12z" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5"/>
        <path d="M29 38l4 4 9-9" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <p className="text-sm font-semibold text-[#374151]">No blocked listings</p>
      <p className="text-xs text-[#6B7280]">Your products meet all IFP guidelines.</p>
    </div>
  );
}
function EmptyPaused() {
  return (
    <div className="flex flex-col items-center py-16 gap-3">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <rect x="16" y="22" width="40" height="32" rx="5" fill="#F5EDF2" stroke="#E5DDD5" strokeWidth="1.5"/>
        <path d="M16 38 Q36 30 56 38" stroke="#C49A3C" strokeWidth="1.2" fill="none" strokeDasharray="3 2"/>
        <circle cx="36" cy="38" r="11" fill="white" stroke="#5B1A3A" strokeWidth="1.5"/>
        <path d="M33 34l8 4-8 4V34z" fill="#5B1A3A"/>
      </svg>
      <p className="text-sm font-semibold text-[#374151]">No paused listings</p>
      <p className="text-xs text-[#6B7280]">All active listings are live.</p>
    </div>
  );
}

/* ─── Catalog Card (left panel) ──────────────────────────────────────────────── */

function CatalogCard({ product, selected, onClick, tab }: {
  product: Product; selected: boolean; onClick: () => void; tab: MainTab;
}) {
  const img0 = product.mainImage || product.images?.[0] || '';
  const img1 = product.images?.[1] || '';

  let badge: { label: string; cls: string; icon?: React.ReactNode } | null = null;
  if (tab === 'under_review') {
    badge = product.approvalStatus === 'under_review'
      ? { label: 'Review Delayed', cls: 'bg-[#FEF3C7] text-[#D97706] border border-[#D97706]', icon: <RefreshCw size={9} /> }
      : { label: 'Review Pending', cls: 'border border-[#D97706] text-[#D97706]' };
  } else if (tab === 'blocked') {
    badge = { label: 'Blocked', cls: 'bg-[#FEE2E2] text-[#DC2626]' };
  } else if (tab === 'paused') {
    badge = { label: 'Paused', cls: 'bg-[#F3F4F6] text-[#6B7280]' };
  }

  return (
    <button onClick={onClick} className="w-full text-left p-3.5 rounded-xl border transition-all duration-150 hover:shadow-md"
      style={{
        background: selected ? '#FDF4F7' : 'white',
        borderColor: selected ? '#5B1A3A' : '#E5DDD5',
        borderLeftWidth: selected ? '3px' : '1px',
        boxShadow: selected ? '0 2px 8px rgba(91,26,58,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}>
      <div className="flex gap-3">
        <div className="flex gap-1 flex-shrink-0">
          {img0
            ? <img src={img0} alt="" className="w-10 h-10 rounded-md object-cover border border-[#E5DDD5]" />
            : <div className="w-10 h-10 rounded-md bg-[#F5EDF2] border border-[#E5DDD5] flex items-center justify-center"><ClipboardList size={14} className="text-[#5B1A3A]/30" /></div>
          }
          {img1
            ? <img src={img1} alt="" className="w-10 h-10 rounded-md object-cover border border-[#E5DDD5]" />
            : <div className="w-10 h-10 rounded-md bg-[#FAF7F4] border border-[#E5DDD5]" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#1F2937] line-clamp-2 leading-snug mb-1">{product.name}</p>
          <p className="text-[10px] text-[#6B7280] font-mono mb-1.5">{product.productId}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {product.category && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#D97706] font-medium">{product.category}</span>
            )}
            {badge && (
              <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${badge.cls}`}>
                {badge.icon}{badge.label}
              </span>
            )}
          </div>
          {tab === 'blocked' && product.rejectionReason && (
            <p className="text-[9px] text-[#6B7280] italic mt-1 truncate">{product.rejectionReason}</p>
          )}
          {tab === 'paused' && (
            <p className="text-[9px] text-[#6B7280] italic mt-1">Paused by you</p>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── Inline Stock Cell ──────────────────────────────────────────────────────── */

function StockCell({ stock, onSave }: { stock: number; onSave: (v: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(stock));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  async function save() {
    const n = parseInt(val);
    if (isNaN(n) || n < 0) { setVal(String(stock)); setEditing(false); return; }
    setSaving(true);
    await onSave(n);
    setSaving(false);
    setEditing(false);
  }

  if (saving) return <div className="w-4 h-4 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: '#5B1A3A', borderTopColor: 'transparent' }} />;

  if (editing) return (
    <div className="flex items-center gap-1 justify-center">
      <input ref={inputRef} type="number" min="0" value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(String(stock)); setEditing(false); } }}
        onBlur={save}
        className="w-20 text-center text-xs px-2 py-1 border rounded-lg focus:outline-none"
        style={{ borderColor: '#5B1A3A' }} />
      <button onClick={save} className="text-[#16A34A] hover:text-[#15803D]"><Check size={13} /></button>
      <button onClick={() => { setVal(String(stock)); setEditing(false); }} className="text-[#6B7280]"><X size={13} /></button>
    </div>
  );

  return (
    <div className="flex items-center gap-1 justify-center group/s">
      <span className="text-xs font-semibold text-[#1F2937]">{stock}</span>
      <button onClick={() => setEditing(true)}
        className="opacity-0 group-hover/s:opacity-100 transition-opacity text-[#6B7280] hover:text-[#5B1A3A]">
        <Pencil size={11} />
      </button>
    </div>
  );
}

/* ─── Days to Stockout Cell ──────────────────────────────────────────────────── */

function DaysCell({ days, stock }: { days: number; stock: number }) {
  if (stock === 0)  return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEE2E2] text-[#DC2626]">Out of Stock</span>;
  if (days > 30)    return <span className="text-xs font-semibold text-[#16A34A]">{days} days</span>;
  if (days >= 8)    return <span className="flex items-center justify-center gap-1 text-xs font-semibold text-[#D97706]"><AlertTriangle size={11} />{days} days</span>;
  return <span className="flex items-center justify-center gap-1 text-xs font-semibold text-[#DC2626]"><AlertTriangle size={11} />{days} days</span>;
}

/* ─── SKU Table ──────────────────────────────────────────────────────────────── */

function SkuTable({ product, tab, onStockSave, selectedRows, onToggleRow, onPause, onDelete }: {
  product: Product; tab: MainTab;
  onStockSave: (productId: string, val: number) => Promise<void>;
  selectedRows: Set<string>; onToggleRow: (rowId: string) => void;
  onPause: (id: string) => void; onDelete: (id: string) => void;
}) {
  const rows = getSkuRows(product);
  const editable = tab === 'active';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#F0EAE4]" style={{ background: '#FAF7F4' }}>
            {editable && <th className="px-3 py-2.5 w-8" />}
            <th className="px-3 py-2.5 w-14" />
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">Description</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">Size / Variant</th>
            {editable && <>
              <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">
                <span className="flex items-center justify-center gap-1">
                  Est. Orders/Day
                  <span className="relative group/tip cursor-help">
                    <Info size={10} className="text-[#6B7280]" />
                    <span className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-52 px-2 py-1.5 text-[10px] bg-[#1F2937] text-white rounded-lg opacity-0 group-hover/tip:opacity-100 transition-opacity text-center z-50 leading-relaxed">
                      Based on last 30 days of platform demand for this product type
                    </span>
                  </span>
                </span>
              </th>
              <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">Days to Stockout</th>
            </>}
            <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">{editable ? 'Current Stock' : 'Stock'}</th>
            {!editable && <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">Status</th>}
            <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const estOrders = getEstOrders(row.productId);
            const days = getDaysToStockout(row.stock, row.productId);
            const checked = selectedRows.has(row.rowId);
            return (
              <tr key={row.rowId} className="border-b border-[#F0EAE4] hover:bg-[#FAF7F4] transition-colors"
                style={{ background: idx % 2 === 0 ? 'white' : '#FAF7F4' }}>
                {editable && (
                  <td className="px-3 py-3 text-center">
                    <input type="checkbox" checked={checked} onChange={() => onToggleRow(row.rowId)}
                      className="w-3.5 h-3.5 rounded" style={{ accentColor: '#5B1A3A' }} />
                  </td>
                )}
                <td className="px-3 py-3">
                  {row.thumbnail
                    ? <img src={row.thumbnail} alt="" className="w-12 h-12 rounded-md object-cover border border-[#E5DDD5]" />
                    : <div className="w-12 h-12 rounded-md bg-[#F5EDF2] border border-[#E5DDD5] flex items-center justify-center"><ClipboardList size={16} className="text-[#5B1A3A]/30" /></div>
                  }
                </td>
                <td className="px-3 py-3 max-w-[180px]">
                  <p className="text-[11px] text-[#374151] line-clamp-3 leading-relaxed">{row.description}</p>
                </td>
                <td className="px-3 py-3">
                  <span className="px-2 py-0.5 border border-[#E5DDD5] rounded-full text-[10px] text-[#6B7280] whitespace-nowrap">{row.sizeVariant}</span>
                </td>
                {editable && <>
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs font-semibold text-[#374151]">{estOrders}</span>
                  </td>
                  <td className="px-3 py-3 text-center"><DaysCell days={days} stock={row.stock} /></td>
                </>}
                <td className="px-3 py-3 text-center">
                  {editable
                    ? <StockCell stock={row.stock} onSave={v => onStockSave(row.productId, v)} />
                    : <span className="text-xs font-semibold text-[#374151]">{row.stock}</span>
                  }
                </td>
                {!editable && (
                  <td className="px-3 py-3 text-center">
                    {tab === 'under_review' && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        product.approvalStatus === 'approved' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                        product.approvalStatus === 'rejected' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#FEF3C7] text-[#D97706]'
                      }`}>
                        {product.approvalStatus === 'approved' ? 'QC Passed' : product.approvalStatus === 'rejected' ? 'QC Rejected' : 'Awaiting QC'}
                      </span>
                    )}
                    {tab === 'blocked' && <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEE2E2] text-[#DC2626]">Blocked</span>}
                    {tab === 'paused'  && <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3F4F6] text-[#6B7280]">Paused</span>}
                  </td>
                )}
                <td className="px-3 py-3 text-center">
                  {tab === 'active' && (
                    <div className="flex items-center justify-center gap-1">
                      <button className="text-[11px] font-semibold text-[#5B1A3A] hover:underline">Edit</button>
                      <KebabMenu onPause={() => onPause(row.productId)} onDelete={() => onDelete(row.productId)} />
                    </div>
                  )}
                  {tab === 'under_review' && (
                    <div className="flex items-center justify-center gap-1.5">
                      <button className="text-[11px] font-semibold text-[#5B1A3A] hover:underline">View Details</button>
                      {product.approvalStatus === 'rejected' && (
                        <button className="text-[11px] font-semibold text-[#DC2626] hover:underline">View Reason</button>
                      )}
                    </div>
                  )}
                  {tab === 'blocked' && <button className="text-[11px] font-semibold text-[#5B1A3A] hover:underline">View Details</button>}
                  {tab === 'paused' && (
                    <button className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold border border-[#5B1A3A] text-[#5B1A3A] rounded-lg hover:bg-[#F5EDF2] mx-auto transition-colors">
                      <Play size={10} fill="#5B1A3A" /> Resume
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Block Reason Card ──────────────────────────────────────────────────────── */

function BlockReasonCard({ product, onAppeal }: { product: Product; onAppeal: () => void }) {
  return (
    <div className="mx-4 mb-4 p-4 rounded-xl border border-[#FEE2E2] bg-[#FFF5F5] flex-shrink-0">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
          <ShieldAlert size={16} className="text-[#DC2626]" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-[#DC2626] mb-0.5">Why was this blocked?</p>
          <p className="text-xs font-semibold text-[#374151] mb-1">{product.rejectionReason || 'Policy violation detected'}</p>
          <p className="text-[11px] text-[#6B7280] leading-relaxed">
            This listing was blocked as it did not meet IFP quality or policy guidelines.
            Review the reason and appeal if you believe this was an error.
          </p>
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <button onClick={onAppeal}
          className="px-3 py-1.5 text-[11px] font-semibold border rounded-lg transition-colors"
          style={{ borderColor: '#5B1A3A', color: '#5B1A3A' }}>
          Appeal This Decision
        </button>
      </div>
    </div>
  );
}

/* ─── Bulk Action Bar ────────────────────────────────────────────────────────── */

function BulkBar({ count, onClear, onPause, onDelete }: {
  count: number; onClear: () => void; onPause: () => void; onDelete: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 rounded-xl shadow-xl text-sm font-medium text-white"
      style={{ background: '#5B1A3A', boxShadow: '0 4px 24px rgba(91,26,58,0.35)' }}>
      <span className="font-bold">{count} item{count !== 1 ? 's' : ''} selected</span>
      <span className="w-px h-4 bg-white/30" />
      <button className="hover:text-[#DDB868] transition-colors">Update Stock</button>
      <button onClick={onPause} className="hover:text-[#DDB868] transition-colors">Pause</button>
      <button onClick={onDelete} className="hover:text-[#FEE2E2] transition-colors">Delete</button>
      <button onClick={onClear} className="ml-1 opacity-60 hover:opacity-100"><X size={16} /></button>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */

export default function InventoryPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [products, setProducts]           = useState<Product[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState<MainTab>('active');
  const [stockSubTab, setStockSubTab]     = useState<'all' | 'out_of_stock' | 'low_stock'>('all');
  const [blockedSubTab, setBlockedSubTab] = useState('all');
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedCats, setSelectedCats]   = useState<Set<string>>(new Set());
  const [stockStatus, setStockStatus]     = useState('');
  const [oosSince, setOosSince]           = useState('');
  const [sortBy, setSortBy]               = useState('recent');
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [selectedRows, setSelectedRows]   = useState<Set<string>>(new Set());
  const [toast, setToast]                 = useState<ToastState>({ show: false, message: '', type: 'success' });

  const showToast = useCallback((msg: string, type: ToastState['type'] = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }, []);

  useEffect(() => {
    if (!user?.sellerId) return;
    fetch(`/api/products?sellerId=${user.sellerId}&isActive=all`)
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d.products) ? d.products : Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [user?.sellerId]);

  // Clear selection on tab change
  useEffect(() => { setSelectedId(null); setSelectedRows(new Set()); }, [activeTab, stockSubTab]);

  /* ── Derived data ── */
  const tabProducts = filterByTab(products, activeTab);

  const filtered = tabProducts.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.productId.toLowerCase().includes(q) && !p.category?.toLowerCase().includes(q)) return false;
    }
    if (selectedCats.size > 0 && !selectedCats.has(p.category) && !selectedCats.has(p.subCategory || '')) return false;
    if (activeTab === 'active' && stockSubTab === 'out_of_stock' && p.stockQuantity !== 0) return false;
    if (activeTab === 'active' && stockSubTab === 'low_stock' && !(p.stockQuantity > 0 && p.stockQuantity <= 10)) return false;
    if (activeTab === 'active' && stockSubTab === 'all') {
      if (stockStatus === 'out'       && p.stockQuantity !== 0) return false;
      if (stockStatus === 'low_stock' && !(p.stockQuantity > 0 && p.stockQuantity <= 10)) return false;
      if (stockStatus === 'in_stock'  && p.stockQuantity <= 10) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'alpha')     return a.name.localeCompare(b.name);
    if (sortBy === 'low_stock') return a.stockQuantity - b.stockQuantity;
    if (sortBy === 'velocity')  return getEstOrders(b.id) - getEstOrders(a.id);
    return 0; // recent: keep API order
  });

  const tabCounts = {
    active:       filterByTab(products, 'active').length,
    under_review: filterByTab(products, 'under_review').length,
    blocked:      filterByTab(products, 'blocked').length,
    paused:       filterByTab(products, 'paused').length,
  };
  const allActive = filterByTab(products, 'active');
  const stockSubCounts = {
    all:          allActive.length,
    out_of_stock: allActive.filter(p => p.stockQuantity === 0).length,
    low_stock:    allActive.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 10).length,
  };

  // Auto-select first on load
  const selectedProduct = sorted.find(p => p.id === selectedId) ?? sorted[0] ?? null;

  /* ── Handlers ── */
  async function handleStockSave(productId: string, val: number) {
    const orig = products.find(p => p.id === productId);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stockQuantity: val } : p));
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: val }),
      });
      if (!res.ok) throw new Error();
      showToast(`Stock updated for ${orig?.name || 'product'}`);
    } catch {
      if (orig) setProducts(prev => prev.map(p => p.id === productId ? orig : p));
      showToast('Failed to update stock', 'error');
    }
  }

  async function handlePause(productId: string) {
    const orig = products.find(p => p.id === productId);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isActive: false } : p));
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      if (!res.ok) throw new Error();
      showToast('Listing paused successfully');
    } catch {
      if (orig) setProducts(prev => prev.map(p => p.id === productId ? orig : p));
      showToast('Failed to pause listing', 'error');
    }
  }

  async function handleDelete(productId: string) {
    const orig = products.find(p => p.id === productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (selectedId === productId) setSelectedId(null);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Listing deleted');
    } catch {
      if (orig) setProducts(prev => [...prev, orig]);
      showToast('Failed to delete listing', 'error');
    }
  }

  const emptyState = () => {
    if (activeTab === 'active') {
      if (stockSubTab === 'out_of_stock') return <EmptyOutOfStock />;
      if (stockSubTab === 'low_stock')    return <EmptyLowStock />;
      return <EmptyActive onAdd={() => router.push('/seller/dashboard/add')} />;
    }
    if (activeTab === 'blocked') return <EmptyBlocked />;
    if (activeTab === 'paused')  return <EmptyPaused />;
    return <div className="flex justify-center py-16 text-xs text-[#6B7280]">No products in this category.</div>;
  };

  return (
    <div style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }} className="flex flex-col gap-4 pb-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#5B1A3A', fontSize: '24px', fontWeight: 700, lineHeight: 1.2 }}>
            My Catalogue &amp; Stock
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">Manage your listings, variants and stock levels</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 border border-[#E5DDD5] rounded-lg bg-white" style={{ width: 280 }}>
            <Search size={13} className="text-[#6B7280] flex-shrink-0" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Product ID / Style ID / SKU"
              className="flex-1 outline-none text-xs text-[#374151] placeholder:text-[#B0A8A4] bg-transparent" />
            {searchQuery && <button onClick={() => setSearchQuery('')}><X size={11} className="text-[#6B7280] hover:text-[#5B1A3A]" /></button>}
          </div>
          <button onClick={() => router.push('/seller/dashboard/add')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
            <PackagePlus size={14} /> Add New Listing
          </button>
        </div>
      </div>

      {/* ── Top-level tabs (underline) ── */}
      <div className="flex gap-6 border-b border-[#E5DDD5]">
        {MAIN_TABS.map(tab => {
          const cnt = tabCounts[tab.key];
          const act = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="relative pb-3 flex items-center gap-2 text-sm transition-all"
              style={{ color: act ? '#5B1A3A' : '#6B7280', fontWeight: act ? 600 : 400 }}>
              {tab.label}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                style={{ background: act ? 'rgba(196,154,60,0.2)' : '#F3F4F6', color: act ? '#C49A3C' : '#6B7280' }}>
                {cnt}
              </span>
              {act && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#5B1A3A' }} />}
            </button>
          );
        })}
      </div>

      {/* ── Stock sub-tabs (Active) ── */}
      {activeTab === 'active' && (
        <div className="flex gap-2">
          {([
            { key: 'all' as const,          label: 'All Products', cnt: stockSubCounts.all },
            { key: 'out_of_stock' as const,  label: 'Out of Stock', cnt: stockSubCounts.out_of_stock },
            { key: 'low_stock' as const,     label: 'Low Stock',    cnt: stockSubCounts.low_stock },
          ]).map(sub => {
            const act = stockSubTab === sub.key;
            return (
              <button key={sub.key} onClick={() => setStockSubTab(sub.key)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={act ? { background: '#5B1A3A', color: 'white', borderColor: '#5B1A3A' } : { background: 'white', color: '#374151', borderColor: '#E5DDD5' }}>
                {sub.key === 'low_stock' && sub.cnt > 0 && <AlertTriangle size={11} className={act ? 'text-[#DDB868]' : 'text-[#D97706]'} />}
                {sub.label}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center"
                  style={act ? { background: 'rgba(196,154,60,0.3)', color: '#DDB868' } : { background: '#F3F4F6', color: '#6B7280' }}>
                  {sub.cnt}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Blocked sub-tabs ── */}
      {activeTab === 'blocked' && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {BLOCK_SUB_TABS.map(sub => {
            const act = blockedSubTab === sub.key;
            return (
              <button key={sub.key} onClick={() => setBlockedSubTab(sub.key)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0"
                style={act ? { background: '#5B1A3A', color: 'white', borderColor: '#5B1A3A' } : { background: 'white', color: '#374151', borderColor: '#E5DDD5' }}>
                {sub.label}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] min-w-[16px] text-center">0</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Filter + Action row ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryDropdown selected={selectedCats} onApply={setSelectedCats} onClear={() => setSelectedCats(new Set())} />
          {activeTab === 'active' && stockSubTab === 'all' && (
            <RadioDrop label="Stock Status" value={stockStatus} onChange={setStockStatus}
              options={[{ value: '', label: 'All' }, { value: 'in_stock', label: 'In Stock' }, { value: 'low_stock', label: 'Low Stock' }, { value: 'out', label: 'Out of Stock' }]}
              minWidth={180} />
          )}
          {activeTab === 'active' && stockSubTab === 'out_of_stock' && (
            <RadioDrop label="Out of Stock Since" value={oosSince} onChange={setOosSince}
              options={[{ value: '', label: 'All Time' }, { value: 'today', label: 'Today' }, { value: '3d', label: 'Last 3 Days' }, { value: '1w', label: 'Last 1 Week' }, { value: '1m', label: 'Last 1 Month' }]}
              minWidth={200} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <RadioDrop label="Sort by" value={sortBy} onChange={setSortBy} options={SORT_OPTS} minWidth={230} />
          {activeTab === 'active' && (
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-colors"
              style={{ borderColor: '#5B1A3A', color: '#5B1A3A' }}>
              <Upload size={13} /> Bulk Update Stock
            </button>
          )}
        </div>
      </div>

      {/* ── Split panel ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#5B1A3A', borderTopColor: 'transparent' }} />
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5DDD5]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {emptyState()}
        </div>
      ) : (
        <div className="flex gap-4" style={{ minHeight: 0 }}>

          {/* Left panel */}
          <div className="w-[35%] flex-shrink-0 flex flex-col gap-2 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 360px)', scrollbarWidth: 'thin', scrollbarColor: '#E5DDD5 transparent' }}>
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide px-0.5 mb-0.5 flex-shrink-0">
              Your Listings ({sorted.length})
            </p>
            {sorted.map(p => (
              <CatalogCard key={p.id} product={p} tab={activeTab}
                selected={selectedProduct?.id === p.id}
                onClick={() => { setSelectedId(p.id); setSelectedRows(new Set()); }} />
            ))}
          </div>

          {/* Right panel */}
          <div className="flex-1 bg-white rounded-xl border border-[#E5DDD5] flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 360px)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {!selectedProduct ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                <div className="w-14 h-14 rounded-full bg-[#F5EDF2] flex items-center justify-center">
                  <MousePointerClick size={22} className="text-[#5B1A3A]/50" />
                </div>
                <p className="text-sm font-medium text-[#374151]">Select a product from the left</p>
                <p className="text-xs text-[#6B7280] text-center max-w-[200px] leading-relaxed">to view and manage its SKUs and stock levels</p>
              </div>
            ) : (
              <>
                {/* Right panel header */}
                <div className="px-5 py-4 border-b border-[#F0EAE4] flex-shrink-0" style={{ background: '#FAF7F4' }}>
                  <h2 className="line-clamp-1" style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#1F2937', fontWeight: 700 }}>
                    {selectedProduct.name}
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    <span className="font-mono text-[#5B1A3A] font-semibold">{selectedProduct.productId}</span>
                    {selectedProduct.category && <> &nbsp;·&nbsp; {selectedProduct.category}</>}
                  </p>
                </div>
                {/* SKU table */}
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#E5DDD5 transparent' }}>
                  <SkuTable product={selectedProduct} tab={activeTab}
                    onStockSave={handleStockSave} selectedRows={selectedRows}
                    onToggleRow={rowId => setSelectedRows(prev => { const n = new Set(prev); n.has(rowId) ? n.delete(rowId) : n.add(rowId); return n; })}
                    onPause={handlePause} onDelete={handleDelete} />
                </div>
                {/* Block reason */}
                {activeTab === 'blocked' && (
                  <BlockReasonCard product={selectedProduct}
                    onAppeal={() => showToast('Appeal submitted — our team will review within 48 hours')} />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Bulk bar */}
      <BulkBar count={selectedRows.size}
        onClear={() => setSelectedRows(new Set())}
        onPause={() => { selectedRows.forEach(r => handlePause(r.split('|')[0])); setSelectedRows(new Set()); }}
        onDelete={() => setSelectedRows(new Set())} />

      <Toast state={toast} onDismiss={() => setToast(t => ({ ...t, show: false }))} />
    </div>
  );
}
