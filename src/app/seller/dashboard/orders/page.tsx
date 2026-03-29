'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar, Clock, Truck, Tag, Search, X, ChevronDown, Eye, Package,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  items: any[];
  total_amount?: number;
  status?: string;
  packing_deadline?: string;
  sla_deadline?: string;
  created_at: string;
  delivery_address?: any;
}

interface Filters {
  period: string;
  periodFrom: string;
  periodTo: string;
  sla: string;
  dispatchFrom: string;
  dispatchTo: string;
  orderDateFrom: string;
  orderDateTo: string;
  productId: string;
}

/* ─── Constants ──────────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'on_hold',        label: 'On Hold',        statuses: ['on_hold'] },
  { key: 'pending',        label: 'Pending',         statuses: ['new', 'captured'] },
  { key: 'ready_to_ship',  label: 'Ready to Ship',   statuses: ['packed'] },
  { key: 'shipped',        label: 'Shipped',          statuses: ['shipped', 'delivered'] },
  { key: 'cancelled',      label: 'Cancelled',        statuses: ['cancelled'] },
];

const DEFAULT_FILTERS: Filters = {
  period: '', periodFrom: '', periodTo: '',
  sla: 'all',
  dispatchFrom: '', dispatchTo: '',
  orderDateFrom: '', orderDateTo: '',
  productId: '',
};

const PERIOD_OPTIONS = [
  { value: 'today',     label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days',     label: 'Last 7 Days' },
  { value: '30days',    label: 'Last 30 Days' },
  { value: 'custom',    label: 'Custom Range' },
];

const SLA_CFG = {
  breached: { label: 'Breached',       bg: '#FEE2E2', color: '#DC2626', dot: '#DC2626' },
  soon:     { label: 'Breaching Soon', bg: '#FEF3C7', color: '#D97706', dot: '#D97706' },
  on_track: { label: 'On Track',       bg: '#DCFCE7', color: '#16A34A', dot: '#16A34A' },
} as const;

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function getSla(deadline?: string): 'breached' | 'soon' | 'on_track' | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms < 0) return 'breached';
  if (ms < 4 * 3600_000) return 'soon';
  return 'on_track';
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function fmtTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ', ' +
         d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/* ─── Dropdown hook ──────────────────────────────────────────────────────────── */

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

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function DropdownShell({
  label, icon, open, setOpen, dropRef, active, children,
}: {
  label: string; icon: React.ReactNode; open: boolean;
  setOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  dropRef: React.RefObject<HTMLDivElement | null>; active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative" ref={dropRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-all"
        style={{
          background: active ? '#5B1A3A' : 'white',
          color: active ? 'white' : '#374151',
          borderColor: active ? '#5B1A3A' : open ? '#5B1A3A' : '#E5DDD5',
        }}
      >
        <span className={active ? 'text-[#DDB868]' : 'text-[#6B7280]'}>{icon}</span>
        <span>{label}</span>
        {active && <X size={12} className="ml-0.5" />}
        {!active && <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 bg-white border border-[#E5DDD5] rounded-xl z-30 min-w-[220px]"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function PeriodDropdown({ value, from, to, onChange, onChangeDates, onClear }: {
  value: string; from: string; to: string;
  onChange: (v: string) => void;
  onChangeDates: (from: string, to: string) => void;
  onClear: () => void;
}) {
  const { open, setOpen, ref } = useDropdown();
  const label = value
    ? (PERIOD_OPTIONS.find(p => p.value === value)?.label ?? 'Custom Range')
    : 'Order Period';
  return (
    <DropdownShell
      label={label} icon={<Calendar size={13} />}
      open={open} setOpen={setOpen} dropRef={ref} active={!!value}
    >
      <div className="p-2 space-y-0.5">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[#F5EDF2] transition-colors text-left"
            style={{ color: value === opt.value ? '#5B1A3A' : '#374151', fontWeight: value === opt.value ? 600 : 400 }}
            onClick={() => { onChange(opt.value); if (opt.value !== 'custom') setOpen(false); }}
          >
            <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${value === opt.value ? 'border-[#5B1A3A] bg-[#5B1A3A]' : 'border-[#D1C4BE]'}`} />
            {opt.label}
          </button>
        ))}
        {value === 'custom' && (
          <div className="pt-2 px-1 space-y-2 border-t border-[#F0EAE4] mt-1">
            <div>
              <p className="text-[10px] text-[#6B7280] mb-1">From</p>
              <input type="date" value={from}
                onChange={e => onChangeDates(e.target.value, to)}
                className="w-full px-2 py-1.5 text-xs border border-[#E5DDD5] rounded-lg focus:outline-none focus:border-[#5B1A3A]" />
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] mb-1">To</p>
              <input type="date" value={to}
                onChange={e => onChangeDates(from, e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-[#E5DDD5] rounded-lg focus:outline-none focus:border-[#5B1A3A]" />
            </div>
            <button onClick={() => setOpen(false)}
              className="w-full py-1.5 text-xs font-semibold text-white rounded-lg"
              style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
              Apply
            </button>
          </div>
        )}
      </div>
      {value && (
        <div className="border-t border-[#F0EAE4] px-3 py-2">
          <button onClick={() => { onClear(); setOpen(false); }} className="text-[11px] text-[#6B7280] hover:text-[#5B1A3A]">
            Clear Filter
          </button>
        </div>
      )}
    </DropdownShell>
  );
}

function SlaDropdown({ value, onChange, onClear }: {
  value: string; onChange: (v: string) => void; onClear: () => void;
}) {
  const { open, setOpen, ref } = useDropdown();
  const options = [
    { value: 'all',      label: 'All',            dot: undefined },
    { value: 'breached', label: 'Breached',        dot: '#DC2626' },
    { value: 'soon',     label: 'Breaching Soon',  dot: '#D97706' },
    { value: 'on_track', label: 'On Track',        dot: '#16A34A' },
  ];
  const label = options.find(o => o.value === value)?.label || 'SLA Status';
  return (
    <DropdownShell
      label={label} icon={<Clock size={13} />}
      open={open} setOpen={setOpen} dropRef={ref} active={value !== 'all'}
    >
      <div className="p-2 space-y-0.5">
        {options.map(opt => (
          <button
            key={opt.value}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[#F5EDF2] transition-colors"
            style={{ color: value === opt.value ? '#5B1A3A' : '#374151', fontWeight: value === opt.value ? 600 : 400 }}
            onClick={() => { onChange(opt.value); setOpen(false); }}
          >
            <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${value === opt.value ? 'border-[#5B1A3A] bg-[#5B1A3A]' : 'border-[#D1C4BE]'}`} />
            <span className="flex items-center gap-1.5 flex-1">
              {opt.dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: opt.dot }} />}
              {opt.label}
            </span>
          </button>
        ))}
      </div>
      {value !== 'all' && (
        <div className="border-t border-[#F0EAE4] px-3 py-2">
          <button onClick={() => { onClear(); setOpen(false); }} className="text-[11px] text-[#6B7280] hover:text-[#5B1A3A]">
            Clear Filter
          </button>
        </div>
      )}
    </DropdownShell>
  );
}

function DateRangeDropdown({ label: labelProp, icon, from, to, onApply, onClear, active }: {
  label: string; icon: React.ReactNode; from: string; to: string;
  onApply: (from: string, to: string) => void; onClear: () => void; active?: boolean;
}) {
  const { open, setOpen, ref } = useDropdown();
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);
  const displayLabel = active ? `${fmtDate(from)} – ${fmtDate(to)}` : labelProp;
  return (
    <DropdownShell
      label={displayLabel} icon={icon}
      open={open} setOpen={setOpen} dropRef={ref} active={active}
    >
      <div className="p-3 space-y-3">
        <div>
          <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">From</p>
          <input type="date" value={localFrom} onChange={e => setLocalFrom(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-[#E5DDD5] rounded-lg focus:outline-none focus:border-[#5B1A3A]" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">To</p>
          <input type="date" value={localTo} onChange={e => setLocalTo(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-[#E5DDD5] rounded-lg focus:outline-none focus:border-[#5B1A3A]" />
        </div>
        <button
          onClick={() => { onApply(localFrom, localTo); setOpen(false); }}
          className="w-full py-2 text-xs font-semibold text-white rounded-lg"
          style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}
        >
          Apply
        </button>
      </div>
      {active && (
        <div className="border-t border-[#F0EAE4] px-3 py-2">
          <button onClick={() => { onClear(); setLocalFrom(''); setLocalTo(''); setOpen(false); }}
            className="text-[11px] text-[#6B7280] hover:text-[#5B1A3A]">Clear Filter</button>
        </div>
      )}
    </DropdownShell>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────────────── */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 gap-3">
      {/* Gift-box style illustration */}
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="12" y="28" width="40" height="28" rx="3" fill="#F5EDF2" stroke="#E5DDD5" strokeWidth="1.5"/>
        <rect x="8" y="20" width="48" height="10" rx="3" fill="#F5EDF2" stroke="#E5DDD5" strokeWidth="1.5"/>
        <path d="M32 20V56" stroke="#C49A3C" strokeWidth="1.5" strokeDasharray="2 2"/>
        <path d="M8 25H56" stroke="#C49A3C" strokeWidth="1.5" strokeDasharray="2 2"/>
        {/* Ribbon loops */}
        <path d="M32 20C32 20 24 14 22 10C20 6 26 4 30 10L32 14" stroke="#C49A3C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M32 20C32 20 40 14 42 10C44 6 38 4 34 10L32 14" stroke="#C49A3C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="32" cy="14" r="3" fill="#C49A3C"/>
      </svg>
      <p className="text-sm font-semibold text-[#374151]">No orders found for the selected filters.</p>
      <p className="text-xs text-[#6B7280]">Try adjusting your filters or check a different tab.</p>
      <button
        onClick={onReset}
        className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg border"
        style={{ borderColor: '#5B1A3A', color: '#5B1A3A' }}
      >
        Reset Filters
      </button>
    </div>
  );
}

/* ─── Orders table ───────────────────────────────────────────────────────────── */

function OrdersTable({ orders }: { orders: Order[] }) {
  const [packingIds, setPackingIds] = useState<Set<string>>(new Set());

  async function markPacked(orderId: string) {
    setPackingIds(s => new Set(s).add(orderId));
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'packed' }),
      });
    } finally {
      setPackingIds(s => { const n = new Set(s); n.delete(orderId); return n; });
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5DDD5]" style={{ background: '#FAF7F4' }}>
            {['Order ID', 'Product', 'Customer City', 'Order Date', 'Dispatch By', 'SLA Status', 'Amount', 'Action'].map((h, i) => (
              <th key={h}
                className={`px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] ${
                  i === 2 ? 'hidden lg:table-cell' : i === 3 ? 'hidden md:table-cell' : ''
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order, idx) => {
            const sla = getSla(order.packing_deadline || order.sla_deadline);
            const slaCfg = sla ? SLA_CFG[sla] : null;
            const firstItem = order.items?.[0];
            const productName = firstItem?.name || firstItem?.product_name || `Product`;
            const extraItems = (order.items?.length || 1) - 1;
            const city = order.delivery_address?.city || order.delivery_address?.district || '—';
            const dispatchBy = order.packing_deadline || order.sla_deadline;

            return (
              <tr
                key={order.id}
                className="border-b border-[#F0EAE4] transition-colors hover:bg-[#FAF7F4]"
                style={{ background: idx % 2 === 0 ? 'white' : '#FAF7F4' }}
              >
                {/* Order ID */}
                <td className="px-4 py-3">
                  <span className="font-semibold text-[#5B1A3A] text-xs">#{order.order_number}</span>
                </td>
                {/* Product */}
                <td className="px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-[#1F2937] truncate max-w-[160px]">{productName}</p>
                    {extraItems > 0 && <p className="text-[10px] text-[#6B7280]">+{extraItems} more</p>}
                  </div>
                </td>
                {/* City */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-[#6B7280]">{city}</span>
                </td>
                {/* Order Date */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-[#6B7280]">{fmtTime(order.created_at)}</span>
                </td>
                {/* Dispatch By */}
                <td className="px-4 py-3">
                  {dispatchBy ? (
                    <span className={`text-xs font-medium ${
                      sla === 'breached' ? 'text-[#DC2626]' :
                      sla === 'soon' ? 'text-[#D97706]' : 'text-[#6B7280]'
                    }`}>
                      {fmtTime(dispatchBy)}
                    </span>
                  ) : (
                    <span className="text-xs text-[#6B7280]">—</span>
                  )}
                </td>
                {/* SLA Status */}
                <td className="px-4 py-3">
                  {slaCfg ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: slaCfg.bg, color: slaCfg.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: slaCfg.color }} />
                      {slaCfg.label}
                    </span>
                  ) : (
                    <span className="text-xs text-[#6B7280]">—</span>
                  )}
                </td>
                {/* Amount */}
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-[#1F2937]" style={{ fontFamily: 'var(--font-playfair)' }}>
                    {order.total_amount ? `₹${order.total_amount.toLocaleString('en-IN')}` : '—'}
                  </span>
                </td>
                {/* Action */}
                <td className="px-4 py-3">
                  {(['new', 'captured'].includes(order.status || '')) ? (
                    <button
                      onClick={() => markPacked(order.id)}
                      disabled={packingIds.has(order.id)}
                      className="px-3 py-1.5 text-[11px] font-semibold text-white rounded-lg disabled:opacity-60 whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}
                    >
                      {packingIds.has(order.id) ? '…' : 'Mark Packed'}
                    </button>
                  ) : (
                    <button className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5B1A3A] hover:underline">
                      <Eye size={12} /> View Details
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

/* ─── Main page ──────────────────────────────────────────────────────────────── */

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  useEffect(() => {
    if (!user?.sellerId) return;
    fetch(`/api/orders?sellerId=${user.sellerId}`)
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : d.orders || []))
      .finally(() => setLoading(false));
  }, [user?.sellerId]);

  /* Tab counts */
  const tabCounts = TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = orders.filter(o => tab.statuses.includes(o.status || 'new')).length;
    return acc;
  }, {});

  /* Filter logic */
  const filtered = orders.filter(o => {
    const s = o.status || 'new';
    const tab = TABS.find(t => t.key === activeTab);
    if (!tab?.statuses.includes(s)) return false;

    if (filters.period) {
      const d = new Date(o.created_at);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (filters.period === 'today' && d < today) return false;
      if (filters.period === 'yesterday') {
        const yd = new Date(today); yd.setDate(yd.getDate() - 1);
        if (d < yd || d >= today) return false;
      }
      if (filters.period === '7days') {
        const cut = new Date(today); cut.setDate(cut.getDate() - 7);
        if (d < cut) return false;
      }
      if (filters.period === '30days') {
        const cut = new Date(today); cut.setDate(cut.getDate() - 30);
        if (d < cut) return false;
      }
      if (filters.period === 'custom' && filters.periodFrom && filters.periodTo) {
        const from = new Date(filters.periodFrom);
        const to = new Date(filters.periodTo); to.setDate(to.getDate() + 1);
        if (d < from || d > to) return false;
      }
    }

    if (filters.sla !== 'all') {
      const sla = getSla(o.packing_deadline || o.sla_deadline);
      if (sla !== filters.sla) return false;
    }

    if (filters.orderDateFrom && filters.orderDateTo) {
      const d = new Date(o.created_at);
      const from = new Date(filters.orderDateFrom);
      const to = new Date(filters.orderDateTo); to.setDate(to.getDate() + 1);
      if (d < from || d > to) return false;
    }

    if (filters.productId.trim()) {
      const pid = filters.productId.toLowerCase();
      const match = o.items?.some((item: any) =>
        item.product_id?.toLowerCase().includes(pid) ||
        item.productId?.toLowerCase().includes(pid) ||
        item.name?.toLowerCase().includes(pid)
      );
      if (!match) return false;
    }

    return true;
  });

  function setFilter<K extends keyof Filters>(key: K, val: Filters[K]) {
    setFilters(prev => ({ ...prev, [key]: val }));
  }

  const hasActive = filters.period !== '' || filters.sla !== 'all' ||
    !!filters.dispatchFrom || !!filters.orderDateFrom || !!filters.productId.trim();

  /* Active filter chip labels */
  const activeChips: Array<{ label: string; onClear: () => void }> = [];
  if (filters.period) {
    const lbl = PERIOD_OPTIONS.find(p => p.value === filters.period)?.label || filters.period;
    activeChips.push({ label: lbl, onClear: () => setFilters(p => ({ ...p, period: '', periodFrom: '', periodTo: '' })) });
  }
  if (filters.sla !== 'all') {
    const lbl = filters.sla === 'soon' ? 'Breaching Soon' : filters.sla === 'breached' ? 'Breached' : 'On Track';
    activeChips.push({ label: lbl, onClear: () => setFilter('sla', 'all') });
  }
  if (filters.dispatchFrom) {
    activeChips.push({ label: `Dispatch: ${fmtDate(filters.dispatchFrom)}–${fmtDate(filters.dispatchTo)}`, onClear: () => setFilters(p => ({ ...p, dispatchFrom: '', dispatchTo: '' })) });
  }
  if (filters.orderDateFrom) {
    activeChips.push({ label: `Order: ${fmtDate(filters.orderDateFrom)}–${fmtDate(filters.orderDateTo)}`, onClear: () => setFilters(p => ({ ...p, orderDateFrom: '', orderDateTo: '' })) });
  }
  if (filters.productId.trim()) {
    activeChips.push({ label: `SKU: ${filters.productId}`, onClear: () => setFilter('productId', '') });
  }

  /* Product ID inline filter ref */
  const pidRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }} className="space-y-5 pb-8">

      {/* Page title */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#5B1A3A', fontSize: '24px', fontWeight: 700, lineHeight: 1.2 }}>
          My Orders
        </h1>
        <p className="text-xs text-[#6B7280] mt-0.5">Manage, pack and track all your orders in one place</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => {
          const cnt = tabCounts[tab.key] || 0;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150"
              style={active
                ? { background: '#5B1A3A', color: 'white', borderColor: '#5B1A3A', boxShadow: '0 2px 8px rgba(91,26,58,0.25)' }
                : { background: 'white', color: '#374151', borderColor: '#E5DDD5' }}
            >
              {tab.label}
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-4"
                style={active
                  ? { background: 'rgba(196,154,60,0.35)', color: '#DDB868' }
                  : { background: cnt > 0 ? '#FEF3C7' : '#F3F4F6', color: cnt > 0 ? '#D97706' : '#6B7280' }}
              >
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-[#E5DDD5] px-4 py-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="flex flex-wrap items-center gap-2">

          {/* 1. Period */}
          <PeriodDropdown
            value={filters.period} from={filters.periodFrom} to={filters.periodTo}
            onChange={v => setFilter('period', v)}
            onChangeDates={(f, t) => setFilters(p => ({ ...p, periodFrom: f, periodTo: t }))}
            onClear={() => setFilters(p => ({ ...p, period: '', periodFrom: '', periodTo: '' }))}
          />

          {/* 2. SLA Status */}
          <SlaDropdown
            value={filters.sla}
            onChange={v => setFilter('sla', v)}
            onClear={() => setFilter('sla', 'all')}
          />

          {/* 3. Dispatch Date */}
          <DateRangeDropdown
            label="Dispatch Date" icon={<Truck size={13} />}
            from={filters.dispatchFrom} to={filters.dispatchTo}
            onApply={(f, t) => setFilters(p => ({ ...p, dispatchFrom: f, dispatchTo: t }))}
            onClear={() => setFilters(p => ({ ...p, dispatchFrom: '', dispatchTo: '' }))}
            active={!!filters.dispatchFrom}
          />

          {/* 4. Order Date */}
          <DateRangeDropdown
            label="Order Date" icon={<Calendar size={13} />}
            from={filters.orderDateFrom} to={filters.orderDateTo}
            onApply={(f, t) => setFilters(p => ({ ...p, orderDateFrom: f, orderDateTo: t }))}
            onClear={() => setFilters(p => ({ ...p, orderDateFrom: '', orderDateTo: '' }))}
            active={!!filters.orderDateFrom}
          />

          {/* 5. Product ID */}
          <div className="flex items-center gap-1.5 px-3 py-2 text-xs border rounded-lg bg-white" style={{ borderColor: filters.productId ? '#5B1A3A' : '#E5DDD5' }}>
            <Tag size={13} className="text-[#6B7280] flex-shrink-0" />
            <input
              ref={pidRef}
              value={filters.productId}
              onChange={e => setFilter('productId', e.target.value)}
              placeholder="Enter Product ID"
              className="outline-none text-xs w-36 text-[#374151] bg-transparent placeholder:text-[#B0A8A4]"
            />
            {filters.productId ? (
              <button onClick={() => setFilter('productId', '')}><X size={12} className="text-[#6B7280] hover:text-[#5B1A3A]" /></button>
            ) : (
              <Search size={12} className="text-[#6B7280]" />
            )}
          </div>

          {/* Clear All */}
          {hasActive && (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="ml-auto text-xs font-medium text-[#5B1A3A] hover:underline"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-[#F0EAE4]">
            {activeChips.map(chip => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                style={{ background: '#5B1A3A' }}
              >
                {chip.label}
                <button onClick={chip.onClear} className="hover:text-[#DDB868]">
                  <X size={9} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6B7280]">
          Showing <span className="font-semibold text-[#374151]">{filtered.length}</span> order{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-[#E5DDD5] overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#5B1A3A', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onReset={() => setFilters(DEFAULT_FILTERS)} />
        ) : (
          <OrdersTable orders={filtered} />
        )}
      </div>

    </div>
  );
}
