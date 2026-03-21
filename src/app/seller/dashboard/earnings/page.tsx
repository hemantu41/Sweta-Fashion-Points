'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Earning {
  id: string;
  orderId?: string;
  orderNumber?: string;
  description?: string;
  amount: number;
  commissionAmount?: number;
  paymentStatus: string;
  createdAt?: string;
}

interface Summary { total: number; pending: number; paid: number; commission: number; }

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'Pending', bg: '#FEF7EA', color: '#8B5E0A' },
  processing: { label: 'Processing', bg: '#EBF2FB', color: '#1A3D6B' },
  settled: { label: 'Settled', bg: '#EBF7EF', color: '#1A6B3A' },
  paid: { label: 'Paid', bg: '#EBF7EF', color: '#1A6B3A' },
};

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function EarningsPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, pending: 0, paid: 0, commission: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const sellerRes = await fetch(`/api/sellers/me?userId=${user.id}`).then(r => r.json());
        const sid = sellerRes.seller?.id;
        if (!sid) return;
        const res = await fetch(`/api/sellers/${sid}/earnings`).then(r => r.json());
        const list: Earning[] = res.earnings || [];
        setEarnings(list);
        setSummary({
          total: list.reduce((s, e) => s + (e.amount || 0), 0),
          pending: list.filter(e => e.paymentStatus === 'pending').reduce((s, e) => s + (e.amount || 0), 0),
          paid: list.filter(e => ['paid', 'settled'].includes(e.paymentStatus)).reduce((s, e) => s + (e.amount || 0), 0),
          commission: list.reduce((s, e) => s + (e.commissionAmount || 0), 0),
        });
      } finally { setLoading(false); }
    })();
  }, [user?.id]);

  const filtered = filter === 'all' ? earnings : earnings.filter(e => e.paymentStatus === filter);

  function downloadCSV() {
    const rows = [['Date', 'Description', 'Amount', 'Status'], ...filtered.map(e => [
      e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN') : '',
      e.description || `Order #${e.orderNumber || ''}`,
      e.amount, e.paymentStatus,
    ])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = 'earnings.csv'; a.click();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>

      {/* Summary cards */}
      <div className="space-y-4">
        <div className="rounded-xl p-5 text-white" style={{ background: '#8B1A1A' }}>
          <p className="text-xs text-white/70 uppercase tracking-wide mb-2">Total Lifetime Earnings</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>{fmt(summary.total)}</p>
        </div>
        {[
          { label: 'This Month (Paid)', value: summary.paid, bg: 'bg-white border border-gray-100', tc: '#1A6B3A' },
          { label: 'Pending Payout', value: summary.pending, bg: 'bg-amber-50 border border-amber-100', tc: '#8B5E0A', note: 'Paid every Monday' },
          { label: 'Commission Deducted', value: summary.commission, bg: 'bg-red-50 border border-red-100', tc: '#8B1A1A', note: '10% platform fee' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 shadow-sm ${c.bg}`}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-xl font-bold" style={{ color: c.tc, fontFamily: 'var(--font-playfair)' }}>{fmt(c.value)}</p>
            {c.note && <p className="text-[10px] mt-1" style={{ color: c.tc }}>{c.note}</p>}
          </div>
        ))}
      </div>

      {/* Transaction table */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 flex-wrap gap-2">
            <div className="flex gap-1.5">
              {['all', 'pending', 'processing', 'paid'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${filter === s ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  style={filter === s ? { background: '#8B1A1A' } : {}}>
                  {s === 'all' ? 'All' : STATUS_CFG[s]?.label || s}
                </button>
              ))}
            </div>
            <button onClick={downloadCSV} className="text-xs text-[#8B1A1A] hover:underline font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              Download CSV
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Description</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(e => {
                  const cfg = STATUS_CFG[e.paymentStatus] || STATUS_CFG.pending;
                  return (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500 text-xs">{e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                      <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">{e.description || `Order #${e.orderNumber || 'N/A'}`}</td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: '#1A6B3A', fontFamily: 'var(--font-playfair)' }}>+{fmt(e.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
