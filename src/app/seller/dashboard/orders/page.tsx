'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar, Clock, Truck, Tag, Search, X, ChevronDown, Eye,
  Package, CheckCircle, ExternalLink,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface Order {
  id: string;
  order_number: string;
  items: any[];
  amount?: number;
  status?: string;
  packing_deadline?: string;
  sla_deadline?: string;
  packed_at?: string;
  shipped_at?: string;
  created_at: string;
  delivery_address?: any;
}

interface Filters {
  period: string;
  periodFrom: string;
  periodTo: string;
  sla: string;
  orderDateFrom: string;
  orderDateTo: string;
  productId: string;
}

/* ─── Constants ──────────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'pending',       label: 'Pending',        statuses: ['captured'] },
  { key: 'ready',         label: 'Ready to Ship',  statuses: ['accepted', 'packed'] },
  { key: 'shipped',       label: 'Shipped',         statuses: ['shipped', 'out_for_delivery', 'delivered'] },
  { key: 'cancelled',     label: 'Cancelled',       statuses: ['cancelled', 'returned'] },
];

const DEFAULT_FILTERS: Filters = {
  period: '', periodFrom: '', periodTo: '',
  sla: 'all',
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

function fmtAmount(paise?: number) {
  if (!paise) return '—';
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 });
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
    <DropdownShell label={label} icon={<Calendar size={13} />} open={open} setOpen={setOpen} dropRef={ref} active={!!value}>
      <div className="p-2 space-y-0.5">
        {PERIOD_OPTIONS.map(opt => (
          <button key={opt.value}
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
              <input type="date" value={from} onChange={e => onChangeDates(e.target.value, to)}
                className="w-full px-2 py-1.5 text-xs border border-[#E5DDD5] rounded-lg focus:outline-none focus:border-[#5B1A3A]" />
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] mb-1">To</p>
              <input type="date" value={to} onChange={e => onChangeDates(from, e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-[#E5DDD5] rounded-lg focus:outline-none focus:border-[#5B1A3A]" />
            </div>
            <button onClick={() => setOpen(false)}
              className="w-full py-1.5 text-xs font-semibold text-white rounded-lg"
              style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>Apply</button>
          </div>
        )}
      </div>
      {value && (
        <div className="border-t border-[#F0EAE4] px-3 py-2">
          <button onClick={() => { onClear(); setOpen(false); }} className="text-[11px] text-[#6B7280] hover:text-[#5B1A3A]">Clear Filter</button>
        </div>
      )}
    </DropdownShell>
  );
}

function SlaDropdown({ value, onChange, onClear }: { value: string; onChange: (v: string) => void; onClear: () => void }) {
  const { open, setOpen, ref } = useDropdown();
  const options = [
    { value: 'all', label: 'All', dot: undefined },
    { value: 'breached', label: 'Breached', dot: '#DC2626' },
    { value: 'soon', label: 'Breaching Soon', dot: '#D97706' },
    { value: 'on_track', label: 'On Track', dot: '#16A34A' },
  ];
  return (
    <DropdownShell label={options.find(o => o.value === value)?.label || 'SLA Status'}
      icon={<Clock size={13} />} open={open} setOpen={setOpen} dropRef={ref} active={value !== 'all'}>
      <div className="p-2 space-y-0.5">
        {options.map(opt => (
          <button key={opt.value}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[#F5EDF2] transition-colors"
            style={{ color: value === opt.value ? '#5B1A3A' : '#374151', fontWeight: value === opt.value ? 600 : 400 }}
            onClick={() => { onChange(opt.value); setOpen(false); }}
          >
            <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${value === opt.value ? 'border-[#5B1A3A] bg-[#5B1A3A]' : 'border-[#D1C4BE]'}`} />
            <span className="flex items-center gap-1.5 flex-1">
              {opt.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: opt.dot }} />}
              {opt.label}
            </span>
          </button>
        ))}
      </div>
      {value !== 'all' && (
        <div className="border-t border-[#F0EAE4] px-3 py-2">
          <button onClick={() => { onClear(); setOpen(false); }} className="text-[11px] text-[#6B7280] hover:text-[#5B1A3A]">Clear Filter</button>
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
  return (
    <DropdownShell label={active ? `${fmtDate(from)} – ${fmtDate(to)}` : labelProp}
      icon={icon} open={open} setOpen={setOpen} dropRef={ref} active={active}>
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
        <button onClick={() => { onApply(localFrom, localTo); setOpen(false); }}
          className="w-full py-2 text-xs font-semibold text-white rounded-lg"
          style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>Apply</button>
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

/* ─── Ship Modal ──────────────────────────────────────────────────────────────── */

function ShipModal({
  order,
  sellerId,
  onClose,
  onSuccess,
}: {
  order: Order;
  sellerId: string;
  onClose: () => void;
  onSuccess: (awb: string, courierName: string, labelUrl?: string) => void;
}) {
  const [weight, setWeight] = useState('0.5');
  const [length, setLength] = useState('25');
  const [breadth, setBreadth] = useState('20');
  const [height, setHeight] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleShip() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/seller/orders/${order.id}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          weight: parseFloat(weight) || 0.5,
          length: parseFloat(length) || 25,
          breadth: parseFloat(breadth) || 20,
          height: parseFloat(height) || 10,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create shipment');
      onSuccess(data.data.awbNumber, data.data.courierName, data.data.labelUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DDD5]">
          <div>
            <h3 style={{ fontFamily: 'var(--font-playfair)', color: '#5B1A3A', fontSize: 18, fontWeight: 700 }}>
              Generate Shipping Label
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">#{order.order_number}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5EDF2]">
            <X size={16} className="text-[#6B7280]" />
          </button>
        </div>

        {/* Product summary */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-b border-[#E5DDD5]">
          <p className="text-xs text-[#6B7280]">
            {order.items?.length || 0} item(s) • {fmtAmount(order.amount)}
          </p>
          <p className="text-sm font-medium text-[#1F2937] truncate mt-0.5">
            {order.items?.[0]?.name || order.items?.[0]?.product_name || 'Product'}
            {(order.items?.length || 0) > 1 ? ` +${(order.items?.length || 1) - 1} more` : ''}
          </p>
        </div>

        {/* Dimensions */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Weight (kg)</label>
            <input
              type="number" step="0.1" min="0.1" value={weight}
              onChange={e => setWeight(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[#E5DDD5] rounded-lg focus:outline-none focus:border-[#5B1A3A]"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Length (cm)', val: length, set: setLength },
              { label: 'Breadth (cm)', val: breadth, set: setBreadth },
              { label: 'Height (cm)', val: height, set: setHeight },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">{label}</label>
                <input
                  type="number" step="1" min="1" value={val}
                  onChange={e => set(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5DDD5] rounded-lg focus:outline-none focus:border-[#5B1A3A]"
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold border rounded-xl text-[#374151] hover:bg-[#F5EDF2]"
            style={{ borderColor: '#E5DDD5' }}>
            Cancel
          </button>
          <button onClick={handleShip} disabled={loading}
            className="flex-2 flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <><Package size={14} /> Generate Label &amp; Schedule Pickup</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Success toast ───────────────────────────────────────────────────────────── */

function ShipSuccess({ awb, courierName, labelUrl, onClose }: {
  awb: string; courierName: string; labelUrl?: string; onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#DCFCE7' }}>
          <CheckCircle size={32} className="text-[#16A34A]" />
        </div>
        <h3 style={{ fontFamily: 'var(--font-playfair)', color: '#5B1A3A', fontSize: 20, fontWeight: 700 }}>
          Shipment Created!
        </h3>
        <p className="text-sm text-[#6B7280] mt-2">Pickup has been scheduled for tomorrow.</p>
        <div className="mt-4 p-3 bg-[#FAF8F5] rounded-xl text-left space-y-1">
          <p className="text-xs text-[#6B7280]">AWB Number</p>
          <p className="text-sm font-bold text-[#5B1A3A]">{awb}</p>
          <p className="text-xs text-[#6B7280] mt-1">Courier</p>
          <p className="text-sm font-medium text-[#1F2937]">{courierName}</p>
        </div>
        <div className="flex gap-2 mt-5">
          {labelUrl && (
            <a href={labelUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-1.5"
              style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
              <ExternalLink size={13} /> Print Label
            </a>
          )}
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold border rounded-xl text-[#374151] hover:bg-[#F5EDF2]"
            style={{ borderColor: '#E5DDD5' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────────────── */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="12" y="28" width="40" height="28" rx="3" fill="#F5EDF2" stroke="#E5DDD5" strokeWidth="1.5"/>
        <rect x="8" y="20" width="48" height="10" rx="3" fill="#F5EDF2" stroke="#E5DDD5" strokeWidth="1.5"/>
        <path d="M32 20V56" stroke="#C49A3C" strokeWidth="1.5" strokeDasharray="2 2"/>
        <path d="M8 25H56" stroke="#C49A3C" strokeWidth="1.5" strokeDasharray="2 2"/>
        <path d="M32 20C32 20 24 14 22 10C20 6 26 4 30 10L32 14" stroke="#C49A3C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M32 20C32 20 40 14 42 10C44 6 38 4 34 10L32 14" stroke="#C49A3C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="32" cy="14" r="3" fill="#C49A3C"/>
      </svg>
      <p className="text-sm font-semibold text-[#374151]">No orders found for the selected filters.</p>
      <p className="text-xs text-[#6B7280]">Try adjusting your filters or check a different tab.</p>
      <button onClick={onReset}
        className="mt-1 px-4 py-2 text-xs font-semibold rounded-lg border"
        style={{ borderColor: '#5B1A3A', color: '#5B1A3A' }}>
        Reset Filters
      </button>
    </div>
  );
}

/* ─── Orders table ───────────────────────────────────────────────────────────── */

function OrdersTable({
  orders,
  activeTab,
  sellerId,
  onAction,
}: {
  orders: Order[];
  activeTab: string;
  sellerId: string;
  onAction: (type: 'accepted' | 'ship', order: Order) => void;
}) {
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  async function acceptOrder(order: Order) {
    setBusyIds(s => new Set(s).add(order.id));
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted', sellerId }),
      });
      if (res.ok) onAction('accepted', order);
    } finally {
      setBusyIds(s => { const n = new Set(s); n.delete(order.id); return n; });
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5DDD5]" style={{ background: '#FAF7F4' }}>
            {['Order ID', 'Product', 'Customer City', 'Order Date', 'SLA / Dispatch', 'Amount', 'Action'].map((h, i) => (
              <th key={h}
                className={`px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] ${i === 2 ? 'hidden lg:table-cell' : i === 3 ? 'hidden md:table-cell' : ''}`}>
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
            const productName = firstItem?.name || firstItem?.product_name || 'Product';
            const extraItems = (order.items?.length || 1) - 1;
            const city = order.delivery_address?.city || order.delivery_address?.district || '—';
            const statusStr = order.status || 'captured';
            const busy = busyIds.has(order.id);

            return (
              <tr key={order.id}
                className="border-b border-[#F0EAE4] transition-colors hover:bg-[#FAF7F4]"
                style={{ background: idx % 2 === 0 ? 'white' : '#FAF7F4' }}>

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

                {/* SLA / Dispatch date */}
                <td className="px-4 py-3">
                  {slaCfg ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: slaCfg.bg, color: slaCfg.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: slaCfg.color }} />
                      {slaCfg.label}
                    </span>
                  ) : order.shipped_at ? (
                    <span className="text-xs text-[#6B7280]">{fmtDate(order.shipped_at)}</span>
                  ) : (
                    <span className="text-xs text-[#6B7280]">—</span>
                  )}
                </td>

                {/* Amount */}
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-[#1F2937]" style={{ fontFamily: 'var(--font-playfair)' }}>
                    {fmtAmount(order.amount)}
                  </span>
                </td>

                {/* Action */}
                <td className="px-4 py-3">
                  {statusStr === 'captured' && (
                    <button onClick={() => acceptOrder(order)} disabled={busy}
                      className="px-3 py-1.5 text-[11px] font-semibold text-white rounded-lg disabled:opacity-60 whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
                      {busy ? '…' : 'Accept Order'}
                    </button>
                  )}
                  {(statusStr === 'accepted' || statusStr === 'packed') && (
                    <button onClick={() => onAction('ship', order)}
                      className="px-3 py-1.5 text-[11px] font-semibold text-white rounded-lg whitespace-nowrap flex items-center gap-1"
                      style={{ background: 'linear-gradient(135deg,#C49A3C,#A07830)' }}>
                      <Package size={11} /> Generate Label
                    </button>
                  )}
                  {['shipped', 'out_for_delivery', 'delivered'].includes(statusStr) && (
                    <a
                      href={`/track/${order.items?.[0]?.awb || ''}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5B1A3A] hover:underline"
                    >
                      <Eye size={12} /> Track
                    </a>
                  )}
                  {['cancelled', 'returned'].includes(statusStr) && (
                    <span className="text-[11px] text-[#6B7280]">—</span>
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

  // Ship modal state
  const [shipOrder, setShipOrder] = useState<Order | null>(null);
  const [shipSuccess, setShipSuccess] = useState<{ awb: string; courierName: string; labelUrl?: string } | null>(null);

  const fetchOrders = useCallback(() => {
    if (!user?.sellerId) return;
    setLoading(true);
    fetch(`/api/orders?sellerId=${user.sellerId}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : d.orders || []))
      .finally(() => setLoading(false));
  }, [user?.sellerId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  function handleAction(type: 'accepted' | 'ship', order: Order) {
    if (type === 'accepted') {
      // Optimistically update and move to Ready to Ship
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'accepted' } : o));
      setActiveTab('ready');
    } else {
      setShipOrder(order);
    }
  }

  function handleShipSuccess(awb: string, courierName: string, labelUrl?: string) {
    setShipOrder(null);
    setShipSuccess({ awb, courierName, labelUrl });
    // Refresh orders after ship
    fetchOrders();
    setActiveTab('shipped');
  }

  /* Tab counts */
  const tabCounts = TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = orders.filter(o => tab.statuses.includes(o.status || 'captured')).length;
    return acc;
  }, {});

  /* Filter logic */
  const filtered = orders.filter(o => {
    const s = o.status || 'captured';
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
    !!filters.orderDateFrom || !!filters.productId.trim();

  const pidRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }} className="space-y-5 pb-8">

      {/* Ship modal */}
      {shipOrder && (
        <ShipModal
          order={shipOrder}
          sellerId={user?.sellerId || ''}
          onClose={() => setShipOrder(null)}
          onSuccess={handleShipSuccess}
        />
      )}

      {/* Ship success modal */}
      {shipSuccess && (
        <ShipSuccess
          awb={shipSuccess.awb}
          courierName={shipSuccess.courierName}
          labelUrl={shipSuccess.labelUrl}
          onClose={() => setShipSuccess(null)}
        />
      )}

      {/* Page title */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#5B1A3A', fontSize: '24px', fontWeight: 700, lineHeight: 1.2 }}>
          My Orders
        </h1>
        <p className="text-xs text-[#6B7280] mt-0.5">Accept, pack and ship your orders — just like Meesho</p>
      </div>

      {/* Flow steps banner */}
      <div className="flex items-center gap-0 bg-white rounded-xl border border-[#E5DDD5] overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {[
          { step: '1', label: 'New Order', sub: 'Accept it', color: '#5B1A3A' },
          { step: '2', label: 'Pack & Label', sub: 'Generate label', color: '#C49A3C' },
          { step: '3', label: 'Hand to Courier', sub: 'Pickup scheduled', color: '#16A34A' },
        ].map((s, i) => (
          <div key={s.step} className="flex-1 flex items-center gap-3 px-4 py-3" style={{ borderRight: i < 2 ? '1px solid #E5DDD5' : 'none' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: s.color }}>
              {s.step}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-[#1F2937]">{s.label}</p>
              <p className="text-[10px] text-[#6B7280]">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => {
          const cnt = tabCounts[tab.key] || 0;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150"
              style={active
                ? { background: '#5B1A3A', color: 'white', borderColor: '#5B1A3A', boxShadow: '0 2px 8px rgba(91,26,58,0.25)' }
                : { background: 'white', color: '#374151', borderColor: '#E5DDD5' }}>
              {tab.label}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-4"
                style={active
                  ? { background: 'rgba(196,154,60,0.35)', color: '#DDB868' }
                  : { background: cnt > 0 ? '#FEF3C7' : '#F3F4F6', color: cnt > 0 ? '#D97706' : '#6B7280' }}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-[#E5DDD5] px-4 py-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="flex flex-wrap items-center gap-2">

          <PeriodDropdown value={filters.period} from={filters.periodFrom} to={filters.periodTo}
            onChange={v => setFilter('period', v)}
            onChangeDates={(f, t) => setFilters(p => ({ ...p, periodFrom: f, periodTo: t }))}
            onClear={() => setFilters(p => ({ ...p, period: '', periodFrom: '', periodTo: '' }))} />

          <SlaDropdown value={filters.sla} onChange={v => setFilter('sla', v)} onClear={() => setFilter('sla', 'all')} />

          <DateRangeDropdown label="Order Date" icon={<Calendar size={13} />}
            from={filters.orderDateFrom} to={filters.orderDateTo}
            onApply={(f, t) => setFilters(p => ({ ...p, orderDateFrom: f, orderDateTo: t }))}
            onClear={() => setFilters(p => ({ ...p, orderDateFrom: '', orderDateTo: '' }))}
            active={!!filters.orderDateFrom} />

          <div className="flex items-center gap-1.5 px-3 py-2 text-xs border rounded-lg bg-white"
            style={{ borderColor: filters.productId ? '#5B1A3A' : '#E5DDD5' }}>
            <Tag size={13} className="text-[#6B7280] flex-shrink-0" />
            <input ref={pidRef} value={filters.productId} onChange={e => setFilter('productId', e.target.value)}
              placeholder="Enter Product ID"
              className="outline-none text-xs w-36 text-[#374151] bg-transparent placeholder:text-[#B0A8A4]" />
            {filters.productId
              ? <button onClick={() => setFilter('productId', '')}><X size={12} className="text-[#6B7280] hover:text-[#5B1A3A]" /></button>
              : <Search size={12} className="text-[#6B7280]" />}
          </div>

          {hasActive && (
            <button onClick={() => setFilters(DEFAULT_FILTERS)} className="ml-auto text-xs font-medium text-[#5B1A3A] hover:underline">
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6B7280]">
          Showing <span className="font-semibold text-[#374151]">{filtered.length}</span> order{filtered.length !== 1 ? 's' : ''}
        </p>
        <button onClick={fetchOrders} className="text-xs text-[#5B1A3A] hover:underline font-medium">
          Refresh
        </button>
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
          <OrdersTable
            orders={filtered}
            activeTab={activeTab}
            sellerId={user?.sellerId || ''}
            onAction={handleAction}
          />
        )}
      </div>

    </div>
  );
}
