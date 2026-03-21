'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AnalyticsData {
  revenue: number;
  orders: number;
  productsSold: number;
  returnRate: number;
  avgOrderValue: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByDay: { date: string; orders: number }[];
  topProducts: { id: string; name: string; unitsSold: number; revenue: number }[];
}

function CSSBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-end gap-1 h-16">
      <div className="flex-1 flex flex-col items-center justify-end gap-1">
        <div className="w-full rounded-t-sm transition-all" style={{ height: `${pct}%`, background: color, minHeight: pct > 0 ? 4 : 0 }} />
      </div>
    </div>
  );
}

const METRICS = [
  { key: 'fulfillment', label: 'Order Fulfillment', value: 87, target: 90, unit: '%', good: (v: number) => v >= 90 },
  { key: 'dispatch', label: 'On-time Dispatch', value: 82, target: 85, unit: '%', good: (v: number) => v >= 85 },
  { key: 'return', label: 'Return Rate', value: 4.2, target: 5, unit: '%', good: (v: number) => v <= 5, invert: true },
  { key: 'cancel', label: 'Cancellation Rate', value: 1.8, target: 3, unit: '%', good: (v: number) => v <= 3, invert: true },
  { key: 'rating', label: 'Avg Customer Rating', value: 4.3, target: 4.5, unit: '/5', good: (v: number) => v >= 4.5, max: 5 },
  { key: 'listing', label: 'Listing Quality', value: 68, target: 80, unit: '%', good: (v: number) => v >= 80 },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [sellerId, setSellerId] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      try {
        const sellerRes = await fetch(`/api/sellers/me?userId=${user.id}`).then(r => r.json());
        const sid = sellerRes.seller?.id;
        if (!sid) return;
        setSellerId(sid);
        const res = await fetch(`/api/sellers/${sid}/analytics?days=${days}`).then(r => r.json());
        setData(res);
      } finally { setLoading(false); }
    })();
  }, [user?.id, days]);

  const healthScore = 72;
  const tier = healthScore >= 86 ? 'Gold' : healthScore >= 61 ? 'Silver' : 'Bronze';
  const tierColor = healthScore >= 86 ? '#B8860B' : healthScore >= 61 ? '#6B7280' : '#92400E';
  const nextTier = healthScore < 61 ? 'Silver' : healthScore < 86 ? 'Gold' : null;
  const pointsToNext = healthScore < 61 ? 61 - healthScore : healthScore < 86 ? 86 - healthScore : 0;

  const revData = data?.revenueByDay || [];
  const ordData = data?.ordersByDay || [];
  const maxRev = Math.max(...revData.map(d => d.revenue), 1);
  const maxOrd = Math.max(...ordData.map(d => d.orders), 1);

  return (
    <div className="space-y-5" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>

      {/* Period selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Showing last {days} days</p>
        <div className="flex gap-1.5">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${days === d ? 'text-white' : 'text-gray-500 hover:bg-gray-100 bg-white border border-gray-200'}`}
              style={days === d ? { background: '#8B1A1A' } : {}}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: data?.orders ?? 0 },
              { label: 'Revenue', value: '₹' + (data?.revenue ?? 0).toLocaleString('en-IN') },
              { label: 'Return Rate', value: `${data?.returnRate ?? 0}%` },
              { label: 'Avg Order Value', value: '₹' + (data?.avgOrderValue ?? 0).toLocaleString('en-IN') },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                <p className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-playfair)' }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue chart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Revenue (Last {days} days)</h3>
              {revData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <div className="flex items-end gap-1 h-24">
                  {revData.slice(-14).map((d, i) => {
                    const pct = (d.revenue / maxRev) * 100;
                    return (
                      <div key={i} title={`${d.date}: ₹${d.revenue}`}
                        className="flex-1 rounded-t-sm transition-all hover:opacity-80 cursor-pointer"
                        style={{ height: `${Math.max(pct, 2)}%`, background: '#8B1A1A', minHeight: d.revenue > 0 ? 4 : 0 }} />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Orders chart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Orders (Last {days} days)</h3>
              {ordData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <div className="flex items-end gap-1 h-24">
                  {ordData.slice(-14).map((d, i) => {
                    const pct = (d.orders / maxOrd) * 100;
                    return (
                      <div key={i} title={`${d.date}: ${d.orders} orders`}
                        className="flex-1 rounded-t-sm transition-all hover:opacity-80 cursor-pointer"
                        style={{ height: `${Math.max(pct, 2)}%`, background: '#1A3D6B', minHeight: d.orders > 0 ? 4 : 0 }} />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top products */}
          {(data?.topProducts?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Top Products</h3>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">#</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Product</th>
                  <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500 hidden sm:table-cell">Units</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Revenue</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 hidden lg:table-cell w-32">Performance</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {(data?.topProducts || []).map((p, i) => {
                    const maxRev2 = Math.max(...(data?.topProducts || []).map(x => x.revenue), 1);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800 truncate max-w-[160px]">{p.name}</td>
                        <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">{p.unitsSold}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800" style={{ fontFamily: 'var(--font-playfair)' }}>
                          ₹{p.revenue.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-24">
                            <div className="h-full rounded-full" style={{ width: `${(p.revenue / maxRev2) * 100}%`, background: '#8B1A1A' }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Seller Health Score */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Seller Health Score</h3>
            <p className="text-xs text-gray-400 mt-0.5">Updated daily based on your performance</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold" style={{ color: tierColor, fontFamily: 'var(--font-playfair)' }}>{healthScore}</p>
            <p className="text-xs text-gray-400">/100</p>
            <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold mt-1" style={{ background: `${tierColor}20`, color: tierColor }}>{tier}</span>
          </div>
        </div>

        {/* Tier bar */}
        <div className="relative h-3 rounded-full bg-gray-100 mb-1 overflow-hidden">
          <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${healthScore}%`, background: `linear-gradient(90deg, #92400E, #B8860B)` }} />
          {[61, 86].map(t => (
            <div key={t} className="absolute top-0 bottom-0 w-0.5 bg-white/80" style={{ left: `${t}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mb-5">
          <span>Bronze (0–60)</span><span>Silver (61–85)</span><span>Gold (86–100)</span>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {METRICS.map(m => {
            const isGood = m.good(m.value);
            const color = isGood ? '#1A6B3A' : m.invert ? '#8B1A1A' : '#B8860B';
            const bg = isGood ? '#EBF7EF' : m.invert ? '#FDF3F3' : '#FEF7EA';
            const barPct = m.max ? (m.value / m.max) * 100 : m.invert ? Math.max(0, 100 - (m.value / m.target) * 100 * 0.5) : Math.min((m.value / (m.target * 1.2)) * 100, 100);
            return (
              <div key={m.key} className="rounded-xl p-4 border" style={{ background: bg, borderColor: `${color}25` }}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-gray-600 leading-tight">{m.label}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${color}20`, color }}>{isGood ? '✓ Good' : '⚡ Improve'}</span>
                </div>
                <p className="text-xl font-bold mb-2" style={{ color, fontFamily: 'var(--font-playfair)' }}>{m.value}{m.unit}</p>
                <div className="h-1 rounded-full bg-white/60">
                  <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: color }} />
                </div>
                <p className="text-[10px] mt-1" style={{ color }}>Target: {m.target}{m.unit}</p>
              </div>
            );
          })}
        </div>

        {/* Tip */}
        {nextTier && (
          <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: '#FEFCE8', borderColor: '#FDE68A' }}>
            <span className="text-lg">💡</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">You need {pointsToNext} more points to reach {nextTier} Tier</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Focus on improving your <strong>On-time Dispatch Rate</strong> (currently 82%, target 85%) to boost your score fastest.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
