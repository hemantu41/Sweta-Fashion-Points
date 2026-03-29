'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingDown, Package, Truck, RotateCcw, ChevronDown, X,
  Download, Search, Calendar, ArrowUpRight, AlertTriangle,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface Order {
  id: string;
  order_number: string;
  status?: string;
  items: any[];
  total_amount?: number;
  created_at: string;
  delivery_address?: any;
}

interface ReturnRow {
  awb: string;
  orderId: string;
  product: string;
  returnType: 'Customer Return' | 'Courier Return';
  createdOn: string;
  expectedDate: string;
  status: string;
}

/* ─── Constants ──────────────────────────────────────────────────────────────── */

const PERIOD_OPTS = [
  { value: '7d',  label: 'Last 7 Days' },
  { value: '1m',  label: 'Last 1 Month' },
  { value: '3m',  label: 'Last 3 Months' },
  { value: 'custom', label: 'Custom Range' },
];

const RETURN_RATE_OPTS = [
  { value: '',    label: 'All Rates' },
  { value: '0-5',   label: 'Under 5%' },
  { value: '5-10',  label: '5% – 10%' },
  { value: '10-20', label: '10% – 20%' },
  { value: '20-30', label: '20% – 30%' },
  { value: '30+',   label: 'Above 30%' },
];

const SORT_OPTS = [
  { value: 'recent',      label: 'Most Recent Order' },
  { value: 'rate-desc',   label: 'Return Rate: High to Low' },
  { value: 'rate-asc',    label: 'Return Rate: Low to High' },
  { value: 'vol-desc',    label: 'Order Volume: High to Low' },
  { value: 'vol-asc',     label: 'Order Volume: Low to High' },
];

const TRACKING_TABS = [
  { key: 'in_transit',     label: 'In Transit',        badge: 0, isNew: false },
  { key: 'out_delivery',   label: 'Out for Delivery',  badge: 0, isNew: false },
  { key: 'delivered',      label: 'Delivered',          badge: 0, isNew: false },
  { key: 'lost',           label: 'Lost',               badge: 0, isNew: false },
  { key: 'no_charge',      label: 'No Return Charge',  badge: 0, isNew: true },
  { key: 'disposed',       label: 'Disposed',           badge: 0, isNew: false },
];

const DATE_RANGE_OPTS = [
  { value: 'tomorrow',   label: 'Tomorrow' },
  { value: 'next3',      label: 'Next 3 Days' },
  { value: 'next7',      label: 'Next 1 Week' },
  { value: 'next14',     label: 'Next 2 Weeks' },
  { value: 'next30',     label: 'Next 1 Month' },
  { value: 'crossed',    label: 'Delivery Date Crossed' },
  { value: 'custom',     label: 'Custom Range' },
];

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getRateColor(rate: number) {
  if (rate < 10) return '#16A34A';
  if (rate <= 20) return '#D97706';
  return '#DC2626';
}

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);
  return { open, setOpen, ref };
}

/* ─── Shared dropdown shell ──────────────────────────────────────────────────── */

function DropdownShell({
  label, icon, open, setOpen, dropRef, active, children, minWidth = 200,
}: {
  label: string; icon?: React.ReactNode; open: boolean;
  setOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  dropRef: React.RefObject<HTMLDivElement | null>; active?: boolean;
  children: React.ReactNode; minWidth?: number;
}) {
  return (
    <div className="relative" ref={dropRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-all whitespace-nowrap"
        style={{
          background: active ? '#5B1A3A' : 'white',
          color: active ? 'white' : '#374151',
          borderColor: active ? '#5B1A3A' : open ? '#5B1A3A' : '#E5DDD5',
        }}
      >
        {icon && <span className={active ? 'text-[#DDB868]' : 'text-[#6B7280]'}>{icon}</span>}
        <span>{label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''} ${active ? 'text-[#DDB868]' : 'text-[#6B7280]'}`} />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 bg-white border border-[#E5DDD5] rounded-xl z-30"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function RadioDropdown({ label, icon, options, value, onChange, minWidth = 200 }: {
  label: string; icon?: React.ReactNode;
  options: { value: string; label: string }[];
  value: string; onChange: (v: string) => void; minWidth?: number;
}) {
  const { open, setOpen, ref } = useDropdown();
  const current = options.find(o => o.value === value)?.label || label;
  return (
    <DropdownShell label={current} icon={icon} open={open} setOpen={setOpen}
      dropRef={ref} active={!!value} minWidth={minWidth}>
      <div className="p-2 space-y-0.5">
        {options.map(opt => (
          <button key={opt.value}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[#F5EDF2] transition-colors text-left"
            style={{ color: value === opt.value ? '#5B1A3A' : '#374151', fontWeight: value === opt.value ? 600 : 400 }}
            onClick={() => { onChange(opt.value); setOpen(false); }}
          >
            <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${value === opt.value ? 'border-[#5B1A3A] bg-[#5B1A3A]' : 'border-[#D1C4BE]'}`} />
            {opt.label}
          </button>
        ))}
      </div>
      {value && (
        <div className="border-t border-[#F0EAE4] px-3 py-2">
          <button onClick={() => { onChange(''); setOpen(false); }}
            className="text-[11px] text-[#6B7280] hover:text-[#5B1A3A]">Clear Filter</button>
        </div>
      )}
    </DropdownShell>
  );
}

/* ─── Summary card ───────────────────────────────────────────────────────────── */

function SummaryCard({ orders, period, onPeriodChange }: {
  orders: Order[]; period: string; onPeriodChange: (v: string) => void;
}) {
  const { open, setOpen, ref } = useDropdown();

  const totalOrders = orders.length;
  const returned = orders.filter(o => o.status === 'returned');
  const totalReturns = returned.length;
  const customerReturns = totalReturns; // all counted as customer returns for now
  const courierReturns = 0; // RTO — no separate flag in current schema
  const returnRate = totalOrders > 0 ? ((totalReturns / totalOrders) * 100).toFixed(1) : '0.0';

  const stats = [
    { label: 'Total Returns',      value: totalReturns,     icon: <RotateCcw size={16} /> },
    { label: 'Customer Returns',   value: customerReturns,  icon: <Package size={16} /> },
    { label: 'Courier Returns (RTO)', value: courierReturns, icon: <Truck size={16} /> },
    { label: 'Return Rate',        value: `${returnRate}%`, icon: <TrendingDown size={16} /> },
  ];

  const periodLabel = PERIOD_OPTS.find(p => p.value === period)?.label || 'Last 7 Days';

  return (
    <div className="bg-white rounded-xl border border-[#E5DDD5] p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Return Summary</p>
          <p className="text-[10px] text-[#B0A8A4] mt-0.5">Based on orders in selected period</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Trend chip */}
          <button className="flex items-center gap-1 text-xs font-medium text-[#C49A3C] border border-[rgba(196,154,60,0.3)] bg-[rgba(196,154,60,0.06)] px-3 py-1.5 rounded-lg hover:bg-[rgba(196,154,60,0.12)] transition-colors">
            <ArrowUpRight size={12} />
            View Trend
          </button>
          {/* Period selector */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#E5DDD5] rounded-lg bg-white hover:border-[#5B1A3A]/30 transition-colors text-[#374151]"
            >
              <Calendar size={12} className="text-[#6B7280]" />
              {periodLabel}
              <ChevronDown size={11} className={`text-[#6B7280] transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E5DDD5] rounded-xl z-30" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 180 }}>
                <div className="p-2 space-y-0.5">
                  {PERIOD_OPTS.map(opt => (
                    <button key={opt.value}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[#F5EDF2] text-left"
                      style={{ color: period === opt.value ? '#5B1A3A' : '#374151', fontWeight: period === opt.value ? 600 : 400 }}
                      onClick={() => { onPeriodChange(opt.value); setOpen(false); }}
                    >
                      <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${period === opt.value ? 'border-[#5B1A3A] bg-[#5B1A3A]' : 'border-[#D1C4BE]'}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-[#FAF7F4] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#5B1A3A]/60">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-[#1F2937]" style={{ fontFamily: 'var(--font-playfair)' }}>
              {stat.value}
            </p>
            <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Product performance table ──────────────────────────────────────────────── */

interface ProductPerf {
  name: string;
  category: string;
  totalOrders: number;
  returns: number;
  returnRate: number;
  lastOrderDate: string;
}

function ProductPerformanceSection({ orders }: { orders: Order[] }) {
  const [rateFilter, setRateFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Derive product performance from orders
  const productMap = new Map<string, ProductPerf>();
  orders.forEach(o => {
    o.items?.forEach((item: any) => {
      const key = item.product_id || item.productId || item.name || 'Unknown';
      const existing = productMap.get(key);
      const isReturn = o.status === 'returned';
      if (existing) {
        existing.totalOrders += 1;
        if (isReturn) existing.returns += 1;
        existing.returnRate = existing.totalOrders > 0
          ? (existing.returns / existing.totalOrders) * 100 : 0;
        if (o.created_at > existing.lastOrderDate) existing.lastOrderDate = o.created_at;
      } else {
        productMap.set(key, {
          name: item.name || item.product_name || key,
          category: item.category || o.items?.[0]?.category || '—',
          totalOrders: 1,
          returns: isReturn ? 1 : 0,
          returnRate: isReturn ? 100 : 0,
          lastOrderDate: o.created_at,
        });
      }
    });
  });

  let products = Array.from(productMap.values());

  // Rate filter
  if (rateFilter) {
    products = products.filter(p => {
      if (rateFilter === '0-5')   return p.returnRate < 5;
      if (rateFilter === '5-10')  return p.returnRate >= 5 && p.returnRate < 10;
      if (rateFilter === '10-20') return p.returnRate >= 10 && p.returnRate < 20;
      if (rateFilter === '20-30') return p.returnRate >= 20 && p.returnRate < 30;
      if (rateFilter === '30+')   return p.returnRate >= 30;
      return true;
    });
  }

  // Category filter
  const categories = Array.from(new Set(Array.from(productMap.values()).map(p => p.category)));
  if (categoryFilter) {
    products = products.filter(p => p.category === categoryFilter);
  }

  // Sort
  products.sort((a, b) => {
    if (sortBy === 'rate-desc') return b.returnRate - a.returnRate;
    if (sortBy === 'rate-asc')  return a.returnRate - b.returnRate;
    if (sortBy === 'vol-desc')  return b.totalOrders - a.totalOrders;
    if (sortBy === 'vol-asc')   return a.totalOrders - b.totalOrders;
    return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
  });

  return (
    <div className="bg-white rounded-xl border border-[#E5DDD5]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="px-5 py-4 border-b border-[#F0EAE4]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-[#1F2937]">Product Performance</h2>
          <div className="flex flex-wrap items-center gap-2">
            <RadioDropdown
              label="Category" value={categoryFilter}
              options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c, label: c }))]}
              onChange={setCategoryFilter} minWidth={180}
            />
            <RadioDropdown
              label="Return Rate" value={rateFilter}
              options={RETURN_RATE_OPTS} onChange={setRateFilter} minWidth={180}
            />
            <RadioDropdown
              label="Sort by" value={sortBy}
              options={SORT_OPTS} onChange={setSortBy} minWidth={230}
            />
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F5EDF2] flex items-center justify-center">
            <RotateCcw size={20} className="text-[#5B1A3A]/40" />
          </div>
          <p className="text-sm text-[#6B7280]">No return data yet for this period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#FAF7F4' }} className="border-b border-[#F0EAE4]">
                {['Product', 'Category', 'Total Orders', 'Returns', 'Return Rate', 'Last Order Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.name} className="border-b border-[#F0EAE4] hover:bg-[#FAF7F4] transition-colors"
                  style={{ background: i % 2 === 0 ? 'white' : '#FAF7F4' }}>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-[#1F2937] max-w-[200px] truncate">{p.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[#6B7280]">{p.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-[#1F2937]">{p.totalOrders}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-[#1F2937]">{p.returns}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold" style={{ color: getRateColor(p.returnRate) }}>
                      {p.returnRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[#6B7280]">{fmtDate(p.lastOrderDate)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Return tracking table ──────────────────────────────────────────────────── */

function ReturnTable({ rows, searchQuery }: { rows: ReturnRow[]; searchQuery: string }) {
  const filtered = rows.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.awb.toLowerCase().includes(q) ||
           r.orderId.toLowerCase().includes(q) ||
           r.product.toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 gap-3">
        <div className="w-12 h-12 rounded-full bg-[#F5EDF2] flex items-center justify-center">
          <Truck size={20} className="text-[#5B1A3A]/40" />
        </div>
        <p className="text-sm text-[#6B7280]">
          {searchQuery ? 'No results match your search.' : 'No returns in this category.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: '#FAF7F4' }} className="border-b border-[#F0EAE4]">
            {['AWB Number', 'Order ID', 'Product', 'Return Type', 'Created On', 'Expected Date', 'Status'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, i) => (
            <tr key={row.awb} className="border-b border-[#F0EAE4] hover:bg-[#FAF7F4] transition-colors"
              style={{ background: i % 2 === 0 ? 'white' : '#FAF7F4' }}>
              <td className="px-4 py-3">
                <span className="text-xs font-mono font-semibold text-[#5B1A3A]">{row.awb}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-medium text-[#374151]">#{row.orderId}</span>
              </td>
              <td className="px-4 py-3">
                <p className="text-xs text-[#1F2937] max-w-[160px] truncate">{row.product}</p>
              </td>
              <td className="px-4 py-3">
                <span
                  className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={row.returnType === 'Customer Return'
                    ? { background: '#F5EDF2', color: '#5B1A3A' }
                    : { background: '#FEF3C7', color: '#D97706' }}
                >
                  {row.returnType}
                </span>
              </td>
              <td className="px-4 py-3"><span className="text-xs text-[#6B7280]">{fmtDate(row.createdOn)}</span></td>
              <td className="px-4 py-3"><span className="text-xs text-[#6B7280]">{fmtDate(row.expectedDate)}</span></td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DCFCE7] text-[#16A34A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />{row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Return tracking tab content ────────────────────────────────────────────── */

function InTransitFilters() {
  const [returnCreated, setReturnCreated] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [returnType, setReturnType] = useState('');
  return (
    <div className="flex flex-wrap items-center gap-2">
      <RadioDropdown label="Return Created" icon={<Calendar size={13} />}
        value={returnCreated} onChange={setReturnCreated}
        options={DATE_RANGE_OPTS} minWidth={210} />
      <RadioDropdown label="Expected Delivery" icon={<Calendar size={13} />}
        value={expectedDelivery} onChange={setExpectedDelivery}
        options={DATE_RANGE_OPTS} minWidth={210} />
      <RadioDropdown label="Return Type" icon={<RotateCcw size={13} />}
        value={returnType} onChange={setReturnType}
        options={[{ value: '', label: 'All Types' }, { value: 'customer', label: 'Customer Return' }, { value: 'courier', label: 'Courier Return' }]}
        minWidth={180} />
    </div>
  );
}

function OutForDeliveryFilters() {
  const { open, setOpen, ref } = useDropdown();
  const [status, setStatus] = useState('');
  const [attempt, setAttempt] = useState('');
  const [returnType, setReturnType] = useState('');
  const [returnCreated, setReturnCreated] = useState('');

  const hasFilter = status || attempt || returnType || returnCreated;

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-all"
          style={{
            background: hasFilter ? '#5B1A3A' : 'white',
            color: hasFilter ? 'white' : '#374151',
            borderColor: hasFilter ? '#5B1A3A' : '#E5DDD5',
          }}
        >
          <AlertTriangle size={13} className={hasFilter ? 'text-[#DDB868]' : 'text-[#6B7280]'} />
          All Filters
          {hasFilter && <span className="w-1.5 h-1.5 rounded-full bg-[#C49A3C]" />}
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1.5 bg-white border border-[#E5DDD5] rounded-xl z-30 p-4 space-y-4"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 260 }}>
            {/* Status */}
            <div>
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Status</p>
              {['Delivering Today', 'To Be Reattempted'].map(opt => (
                <label key={opt} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input type="radio" name="status" value={opt} checked={status === opt}
                    onChange={() => setStatus(opt)} className="w-3.5 h-3.5 accent-[#5B1A3A]" />
                  <span className="text-xs text-[#374151]">{opt}</span>
                </label>
              ))}
            </div>
            {/* Attempt */}
            <div>
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Attempt</p>
              {['1st Attempt', '2nd Attempt', 'Final Attempt'].map(opt => (
                <label key={opt} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input type="radio" name="attempt" value={opt} checked={attempt === opt}
                    onChange={() => setAttempt(opt)} className="w-3.5 h-3.5 accent-[#5B1A3A]" />
                  <span className="text-xs text-[#374151]">{opt}</span>
                </label>
              ))}
            </div>
            {/* Return type */}
            <div>
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Return Type</p>
              {['Customer Return', 'Courier Return'].map(opt => (
                <label key={opt} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input type="radio" name="rtype" value={opt} checked={returnType === opt}
                    onChange={() => setReturnType(opt)} className="w-3.5 h-3.5 accent-[#5B1A3A]" />
                  <span className="text-xs text-[#374151]">{opt}</span>
                </label>
              ))}
            </div>
            {/* Return Created */}
            <div>
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Return Created</p>
              <input type="date"
                className="w-full px-2 py-1.5 text-xs border border-[#E5DDD5] rounded-lg focus:outline-none focus:border-[#5B1A3A]"
                value={returnCreated} onChange={e => setReturnCreated(e.target.value)} />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-full py-2 text-xs font-semibold text-white rounded-lg"
              style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}
            >
              Apply
            </button>
            {hasFilter && (
              <button
                onClick={() => { setStatus(''); setAttempt(''); setReturnType(''); setReturnCreated(''); }}
                className="w-full text-center text-[11px] text-[#6B7280] hover:text-[#5B1A3A]"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SimpleFilters({ showReturnCreated = true, showLostDate = false }: {
  showReturnCreated?: boolean; showLostDate?: boolean;
}) {
  const [dateFilter, setDateFilter] = useState('');
  const [returnType, setReturnType] = useState('');
  return (
    <div className="flex flex-wrap items-center gap-2">
      <RadioDropdown
        label={showLostDate ? 'Lost Date' : 'Return Created'}
        icon={<Calendar size={13} />}
        value={dateFilter} onChange={setDateFilter}
        options={[{ value: '', label: 'All Dates' }, ...DATE_RANGE_OPTS]} minWidth={210} />
      <RadioDropdown label="Return Type" icon={<RotateCcw size={13} />}
        value={returnType} onChange={setReturnType}
        options={[{ value: '', label: 'All Types' }, { value: 'customer', label: 'Customer Return' }, { value: 'courier', label: 'Courier Return' }]}
        minWidth={180} />
    </div>
  );
}

/* ─── Return tracking section ────────────────────────────────────────────────── */

function ReturnTrackingSection({ orders }: { orders: Order[] }) {
  const [activeSubTab, setActiveSubTab] = useState('in_transit');
  const [searchQuery, setSearchQuery] = useState('');

  // Derive return rows from returned orders
  const returnRows: ReturnRow[] = orders
    .filter(o => o.status === 'returned')
    .map(o => ({
      awb: `AWB${o.id.slice(0, 8).toUpperCase()}`,
      orderId: o.order_number,
      product: o.items?.[0]?.name || o.items?.[0]?.product_name || 'Product',
      returnType: 'Customer Return' as const,
      createdOn: o.created_at,
      expectedDate: new Date(new Date(o.created_at).getTime() + 5 * 86400_000).toISOString(),
      status: 'In Transit',
    }));

  const tabCounts = TRACKING_TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.key] = t.key === 'in_transit' ? returnRows.length : 0;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Sub-tab chips — horizontally scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TRACKING_TABS.map(tab => {
          const isActive = activeSubTab === tab.key;
          const count = tabCounts[tab.key] || 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0"
              style={isActive
                ? { background: '#5B1A3A', color: 'white', borderColor: '#5B1A3A' }
                : { background: 'white', color: '#374151', borderColor: '#E5DDD5' }}
            >
              {tab.label}
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                style={isActive
                  ? { background: 'rgba(196,154,60,0.3)', color: '#DDB868' }
                  : { background: '#F3F4F6', color: '#6B7280' }}
              >
                {count}
              </span>
              {tab.isNew && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(196,154,60,0.2)', color: '#C49A3C' }}>
                  New
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-[#E5DDD5]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-[#F0EAE4] flex flex-wrap items-center gap-3">
          {/* Filters per sub-tab */}
          <div className="flex-1">
            {activeSubTab === 'in_transit'   && <InTransitFilters />}
            {activeSubTab === 'out_delivery' && <OutForDeliveryFilters />}
            {activeSubTab === 'delivered'    && <SimpleFilters />}
            {activeSubTab === 'lost'         && <SimpleFilters showLostDate />}
            {activeSubTab === 'no_charge'    && <SimpleFilters />}
            {activeSubTab === 'disposed'     && <SimpleFilters />}
          </div>

          {/* Right side: Search + Download */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 border border-[#E5DDD5] rounded-lg bg-white text-xs">
              <Search size={13} className="text-[#6B7280] flex-shrink-0" />
              <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Order ID, AWB or Product ID"
                className="outline-none text-xs bg-transparent text-[#374151] placeholder:text-[#B0A8A4] w-56"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}><X size={11} className="text-[#6B7280] hover:text-[#5B1A3A]" /></button>
              )}
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-colors"
              style={{ borderColor: '#5B1A3A', color: '#5B1A3A' }}
            >
              <Download size={13} />
              Download
              <span className="text-[10px] text-[#6B7280]">0/0</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <ReturnTable
          rows={activeSubTab === 'in_transit' ? returnRows : []}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */

export default function ReturnsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking'>('overview');
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    if (!user?.sellerId) return;
    fetch(`/api/orders?sellerId=${user.sellerId}`)
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : d.orders || []))
      .finally(() => setLoading(false));
  }, [user?.sellerId]);

  /* Filter by period */
  const periodOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    const now = new Date();
    const days = period === '7d' ? 7 : period === '1m' ? 30 : period === '3m' ? 90 : 7;
    return d >= new Date(now.getTime() - days * 86400_000);
  });

  return (
    <div style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }} className="space-y-6 pb-8">

      {/* Page title */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#5B1A3A', fontSize: '24px', fontWeight: 700, lineHeight: 1.2 }}>
          Returns &amp; RTO
        </h1>
        <p className="text-xs text-[#6B7280] mt-0.5">Monitor return trends and track return shipments</p>
      </div>

      {/* Top-level tabs — underline style */}
      <div className="flex gap-6 border-b border-[#E5DDD5]">
        {(['overview', 'tracking'] as const).map(tab => {
          const labels = { overview: 'Overview', tracking: 'Return Tracking' };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="pb-3 text-sm font-medium transition-all relative"
              style={{ color: isActive ? '#5B1A3A' : '#6B7280' }}
            >
              {labels[tab]}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#5B1A3A' }} />
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#5B1A3A', borderTopColor: 'transparent' }} />
        </div>
      ) : activeTab === 'overview' ? (
        <div className="space-y-5">
          <SummaryCard orders={periodOrders} period={period} onPeriodChange={setPeriod} />
          <ProductPerformanceSection orders={periodOrders} />
        </div>
      ) : (
        <ReturnTrackingSection orders={orders} />
      )}

    </div>
  );
}
