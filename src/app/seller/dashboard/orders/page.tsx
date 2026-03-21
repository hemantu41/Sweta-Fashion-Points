'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

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

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  new: { label: 'New', bg: '#FEF7EA', color: '#8B5E0A' },
  captured: { label: 'New', bg: '#FEF7EA', color: '#8B5E0A' },
  packed: { label: 'Packed', bg: '#EBF2FB', color: '#1A3D6B' },
  shipped: { label: 'Shipped', bg: '#F3EBF7', color: '#6B1A8B' },
  delivered: { label: 'Delivered', bg: '#EBF7EF', color: '#1A6B3A' },
  returned: { label: 'Returned', bg: '#FDF3F3', color: '#8B1A1A' },
  cancelled: { label: 'Cancelled', bg: '#F3F4F6', color: '#6B7280' },
};

const STATUSES = ['All', 'new', 'packed', 'shipped', 'delivered', 'returned', 'cancelled'];

function deadlineUrgency(deadline?: string) {
  if (!deadline) return 'text-gray-400';
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return 'text-red-600 font-semibold';
  if (diff < 2 * 3600 * 1000) return 'text-red-500 font-semibold';
  return 'text-amber-600';
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [packingIds, setPackingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.sellerId) return;
    fetch(`/api/orders?sellerId=${user.sellerId}`)
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : d.orders || []))
      .finally(() => setLoading(false));
  }, [user?.sellerId]);

  async function markPacked(orderId: string) {
    setPackingIds(s => new Set(s).add(orderId));
    try {
      await fetch(`/api/orders/${orderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'packed' }) });
      setOrders(os => os.map(o => o.id === orderId ? { ...o, status: 'packed' } : o));
    } finally { setPackingIds(s => { const n = new Set(s); n.delete(orderId); return n; }); }
  }

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    if (q && !o.order_number?.toLowerCase().includes(q) && !(o.customer_name || '').toLowerCase().includes(q)) return false;
    if (statusFilter !== 'All') {
      const s = o.status || 'new';
      const mapped = s === 'captured' ? 'new' : s;
      if (mapped !== statusFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by order ID or customer…"
          className="flex-1 min-w-48 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#8B1A1A]/30"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : STATUS_CONFIG[s]?.label || s}</option>)}
        </select>
        <p className="self-center text-sm text-gray-400">{filtered.length} orders</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg>
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Customer</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Amount</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Pack By</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(order => {
                  const rawStatus = order.status || 'new';
                  const s = rawStatus === 'captured' ? 'new' : rawStatus;
                  const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.new;
                  const deadline = order.packing_deadline || order.sla_deadline;
                  const isPacking = packingIds.has(order.id);

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800">#{order.order_number}</td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                        {order.customer_name || order.delivery_address?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">{order.items?.length || 0}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800 hidden md:table-cell" style={{ fontFamily: 'var(--font-playfair)' }}>
                        {order.total_amount ? `₹${order.total_amount.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-center text-xs hidden lg:table-cell ${deadlineUrgency(deadline)}`}>
                        {deadline ? new Date(deadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(s === 'new') && (
                          <button
                            onClick={() => markPacked(order.id)}
                            disabled={isPacking}
                            className="px-3 py-1 text-xs font-semibold text-white rounded-lg disabled:opacity-60"
                            style={{ background: '#8B1A1A' }}
                          >
                            {isPacking ? '…' : 'Mark Packed'}
                          </button>
                        )}
                        {(s === 'packed' || s === 'shipped') && (
                          <button className="px-3 py-1 text-xs font-semibold border border-[#1A3D6B] text-[#1A3D6B] rounded-lg hover:bg-blue-50">Track</button>
                        )}
                        {s === 'delivered' && (
                          <button className="px-3 py-1 text-xs font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Details</button>
                        )}
                        {s === 'returned' && (
                          <button className="px-3 py-1 text-xs font-semibold border border-[#8B1A1A] text-[#8B1A1A] rounded-lg hover:bg-red-50">Review</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
