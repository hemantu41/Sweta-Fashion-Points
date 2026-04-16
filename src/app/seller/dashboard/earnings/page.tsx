'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { buildCyclesFromEarnings, getNextPayoutDate, formatDate, SettlementCycle } from '@/lib/settlement';

interface Earning {
  id: string;
  order_id?: string;
  order_number?: string;
  item_name?: string;
  seller_earning: number;
  commission_amount?: number;
  payment_status: string;
  order_date?: string;
}

interface Summary { total: number; pending: number; paid: number; commission: number; }

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'Pending', bg: '#FEF7EA', color: '#C49A3C' },
  processing: { label: 'Processing', bg: '#EBF2FB', color: '#1565C0' },
  settled: { label: 'Settled', bg: '#EBF7EF', color: '#2E7D32' },
  paid: { label: 'Paid', bg: '#EBF7EF', color: '#2E7D32' },
};

const CYCLE_STATUS_CFG = {
  paid: { label: 'Paid', bg: '#EBF7EF', color: '#2E7D32', icon: '✓' },
  processing: { label: 'Processing', bg: '#EBF2FB', color: '#1565C0', icon: '↻' },
  pending: { label: 'Upcoming', bg: '#FEF7EA', color: '#C49A3C', icon: '⏳' },
  on_hold: { label: 'On Hold', bg: '#FDF3F3', color: '#C62828', icon: '⚠' },
};

const fmt = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

function CycleRow({ cycle, isFirst }: { cycle: SettlementCycle; isFirst: boolean }) {
  const [open, setOpen] = useState(isFirst);
  const cfg = CYCLE_STATUS_CFG[cycle.status] || CYCLE_STATUS_CFG.pending;

  return (
    <div className={`rounded-xl border overflow-hidden ${isFirst ? 'border-[#5B1A3A]/20' : 'border-[#E8E0E4]'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#C49A3C]/5 text-left"
        style={isFirst ? { background: '#F5EDF2' } : {}}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.icon}</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {formatDate(cycle.periodStart)} – {formatDate(cycle.periodEnd)}
            </p>
            <p className="text-xs text-gray-400">{cycle.orderCount} orders · Payout {formatDate(cycle.payoutDate || '')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: '#2E7D32', fontFamily: 'var(--font-playfair)' }}>{fmt(cycle.netAmount)}</p>
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-50 px-4 py-3 bg-gray-50/30">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: 'Gross Revenue', value: fmt(cycle.grossAmount), color: '#2E7D32' },
              { label: 'Platform Fee (0%)', value: `– ${fmt(cycle.commissionAmount)}`, color: '#5B1A3A' },
              { label: 'Net Payout', value: fmt(cycle.netAmount), color: '#1565C0' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className="text-[10px] text-gray-500 mb-0.5">{item.label}</p>
                <p className="text-sm font-bold" style={{ color: item.color, fontFamily: 'var(--font-playfair)' }}>{item.value}</p>
              </div>
            ))}
          </div>
          {cycle.paymentReference && (
            <p className="text-[10px] text-gray-400 text-center">Ref: {cycle.paymentReference}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function EarningsPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [cycles, setCycles] = useState<SettlementCycle[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, pending: 0, paid: 0, commission: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'transactions' | 'settlements'>('settlements');

  const nextPayout = getNextPayoutDate();

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const sellerRes = await fetch(`/api/sellers/me?userId=${user.id}`).then(r => r.json());
        const sid = sellerRes.seller?.id;
        if (!sid) return;
        const res = await fetch(`/api/sellers/${sid}/earnings?limit=200`).then(r => r.json());
        const list: Earning[] = res.earnings || [];
        setEarnings(list);

        // Build settlement cycles from earnings
        const cycleList = buildCyclesFromEarnings(list);
        setCycles(cycleList);

        setSummary({
          total: list.reduce((s, e) => s + parseFloat(e.seller_earning?.toString() || '0'), 0),
          pending: list.filter(e => e.payment_status === 'pending')
            .reduce((s, e) => s + parseFloat(e.seller_earning?.toString() || '0'), 0),
          paid: list.filter(e => ['paid', 'settled'].includes(e.payment_status))
            .reduce((s, e) => s + parseFloat(e.seller_earning?.toString() || '0'), 0),
          commission: list.reduce((s, e) => s + parseFloat(e.commission_amount?.toString() || '0'), 0),
        });
      } finally { setLoading(false); }
    })();
  }, [user?.id]);

  const filtered = filter === 'all' ? earnings : earnings.filter(e => e.payment_status === filter);

  function downloadCSV() {
    const rows = [
      ['Date', 'Product', 'Order #', 'Amount', 'Commission', 'Status'],
      ...filtered.map(e => [
        e.order_date ? new Date(e.order_date).toLocaleDateString('en-IN') : '',
        e.item_name || '',
        e.order_number || '',
        Math.round(parseFloat(e.seller_earning?.toString() || '0')),
        Math.round(parseFloat(e.commission_amount?.toString() || '0')),
        e.payment_status,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = 'earnings.csv'; a.click();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>

      {/* Summary sidebar */}
      <div className="space-y-4">
        <div className="rounded-xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }}>
          <p className="text-xs text-white/70 uppercase tracking-wide mb-2">Total Lifetime Earnings</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>{fmt(summary.total)}</p>
          <p className="text-xs text-white/60 mt-1">After {fmt(summary.commission)} platform fees</p>
        </div>

        {[
          { label: 'Net Paid Out', value: summary.paid, bg: 'bg-white border border-[#E8E0E4]', tc: '#2E7D32' },
          { label: 'Pending Payout', value: summary.pending, bg: 'bg-amber-50 border border-amber-100', tc: '#C49A3C', note: `Next: ${formatDate(nextPayout)}` },
          { label: 'Commission Deducted', value: summary.commission, bg: 'bg-red-50 border border-red-100', tc: '#5B1A3A', note: '0% platform fee' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 shadow-sm ${c.bg}`}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-xl font-bold" style={{ color: c.tc, fontFamily: 'var(--font-playfair)' }}>{fmt(c.value)}</p>
            {c.note && <p className="text-[10px] mt-1" style={{ color: c.tc }}>{c.note}</p>}
          </div>
        ))}

        {/* Next payout countdown */}
        <div className="rounded-xl p-4 border border-[#E8E0E4] bg-white">
          <p className="text-xs text-gray-500 mb-2">Next Payout Date</p>
          <p className="text-base font-bold text-gray-800">{formatDate(nextPayout)}</p>
          <p className="text-[10px] text-gray-400 mt-1">Payouts are processed every Monday</p>
          <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            {(() => {
              const today = new Date();
              const day = today.getDay();
              const pct = day === 0 ? 100 : (day / 7) * 100;
              return <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }} />;
            })()}
          </div>
          <div className="flex justify-between text-[9px] text-gray-400 mt-1">
            <span>Mon</span><span>Sun</span>
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div className="lg:col-span-2 space-y-4">

        {/* View toggle */}
        <div className="flex items-center gap-2">
          {(['settlements', 'transactions'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${view === v ? 'text-white' : 'text-gray-500 hover:bg-gray-100 bg-white border border-gray-200'}`}
              style={view === v ? { background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' } : {}}>
              {v === 'settlements' ? 'Settlement Cycles' : 'Transactions'}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={downloadCSV} className="text-xs text-[#5B1A3A] hover:underline font-medium flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download CSV
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#5B1A3A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === 'settlements' ? (
          /* Settlement cycles view */
          <div className="space-y-3">
            {cycles.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm flex flex-col items-center py-12 text-gray-400 gap-2">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                <p className="text-sm">No settlement cycles yet</p>
              </div>
            ) : (
              cycles.map((cycle, i) => (
                <CycleRow key={cycle.id} cycle={cycle} isFirst={i === 0} />
              ))
            )}
          </div>
        ) : (
          /* Transactions view */
          <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 flex-wrap gap-2">
              <div className="flex gap-1.5">
                {['all', 'pending', 'processing', 'paid'].map(s => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${filter === s ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    style={filter === s ? { background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' } : {}}>
                    {s === 'all' ? 'All' : STATUS_CFG[s]?.label || s}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5EDF2] border-b border-[#E8E0E4]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Product</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Net</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(e => {
                    const cfg = STATUS_CFG[e.payment_status] || STATUS_CFG.pending;
                    return (
                      <tr key={e.id} className="hover:bg-[#C49A3C]/5">
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {e.order_date ? new Date(e.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 hidden sm:table-cell text-xs truncate max-w-[180px]">
                          {e.item_name || `Order #${e.order_number || 'N/A'}`}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-xs" style={{ color: '#2E7D32', fontFamily: 'var(--font-playfair)' }}>
                          +{fmt(parseFloat(e.seller_earning?.toString() || '0'))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
