'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

interface AnalyticsData {
  revenue: number;
  orders: number;
  productsSold: number;
  returnRate: number;
  avgOrderValue: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByDay: { date: string; orders: number }[];
  topProducts: { id: string; name: string; unitsSold: number; revenue: number }[];
  categoryData: { name: string; value: number }[];
}

const PIE_COLORS = ['#5B1A3A', '#1565C0', '#2E7D32', '#C49A3C', '#7A2350', '#3D0E2A'];

const METRICS = [
  { key: 'fulfillment', label: 'Order Fulfillment', value: 87, target: 90, unit: '%', good: (v: number) => v >= 90 },
  { key: 'dispatch', label: 'On-time Dispatch', value: 82, target: 85, unit: '%', good: (v: number) => v >= 85 },
  { key: 'return', label: 'Return Rate', value: 4.2, target: 5, unit: '%', good: (v: number) => v <= 5, invert: true },
  { key: 'cancel', label: 'Cancellation Rate', value: 1.8, target: 3, unit: '%', good: (v: number) => v <= 3, invert: true },
  { key: 'rating', label: 'Avg Customer Rating', value: 4.3, target: 4.5, unit: '/5', good: (v: number) => v >= 4.5, max: 5 },
  { key: 'listing', label: 'Listing Quality', value: 68, target: 80, unit: '%', good: (v: number) => v >= 80 },
];

function fmt(n: number) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E0E4] rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-[#5B1A3A]">{fmt(payload[0]?.value || 0)}</p>
    </div>
  );
};

const OrdersTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E0E4] rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-[#1565C0]">{payload[0]?.value} orders</p>
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E0E4] rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700">{payload[0]?.name}</p>
      <p className="font-bold" style={{ color: payload[0]?.payload?.fill }}>{fmt(payload[0]?.value || 0)}</p>
    </div>
  );
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      try {
        const sellerRes = await fetch(`/api/sellers/me?userId=${user.id}`).then(r => r.json());
        const sid = sellerRes.seller?.id;
        if (!sid) return;
        const res = await fetch(`/api/sellers/${sid}/analytics?days=${days}`).then(r => r.json());
        setData(res);
      } finally { setLoading(false); }
    })();
  }, [user?.id, days]);

  const healthScore = 72;
  const tier = healthScore >= 86 ? 'Gold' : healthScore >= 61 ? 'Silver' : 'Bronze';
  const tierColor = healthScore >= 86 ? '#C49A3C' : healthScore >= 61 ? '#6B7280' : '#3D0E2A';
  const nextTier = healthScore < 86 ? (healthScore < 61 ? 'Silver' : 'Gold') : null;
  const pointsToNext = healthScore < 61 ? 61 - healthScore : healthScore < 86 ? 86 - healthScore : 0;

  const revData = (data?.revenueByDay || []).map(d => ({ ...d, label: fmtDate(d.date) }));
  const ordData = (data?.ordersByDay || []).map(d => ({ ...d, label: fmtDate(d.date) }));
  const catData = data?.categoryData || [];
  const maxTopRev = Math.max(...(data?.topProducts || []).map(p => p.revenue), 1);

  return (
    <div className="space-y-5" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>

      {/* Period selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Showing last <span className="font-semibold text-gray-700">{days} days</span></p>
        <div className="flex gap-1.5">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${days === d ? 'text-white' : 'text-gray-500 hover:bg-gray-100 bg-white border border-gray-200'}`}
              style={days === d ? { background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' } : {}}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#5B1A3A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: data?.orders ?? 0, sub: `Last ${days} days` },
              { label: 'Revenue', value: fmt(data?.revenue ?? 0), sub: `Last ${days} days` },
              { label: 'Return Rate', value: `${data?.returnRate ?? 0}%`, sub: 'Returned orders' },
              { label: 'Avg Order Value', value: fmt(data?.avgOrderValue ?? 0), sub: 'Per transaction' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-4">
                <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                <p className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-playfair)' }}>{k.value}</p>
                <p className="text-[10px] text-gray-400 mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue + Orders charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Revenue Area Chart */}
            <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Revenue Trend</h3>
              <p className="text-xs text-gray-400 mb-4">Last {days} days · {fmt(data?.revenue ?? 0)} total</p>
              {revData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm text-gray-400">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={revData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B1A3A" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#5B1A3A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip content={<RevenueTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#5B1A3A" strokeWidth={2}
                      fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#5B1A3A' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Orders Bar Chart */}
            <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Orders by Day</h3>
              <p className="text-xs text-gray-400 mb-4">Last {days} days · {data?.orders ?? 0} orders total</p>
              {ordData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm text-gray-400">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={ordData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<OrdersTooltip />} />
                    <Bar dataKey="orders" fill="#1565C0" radius={[3, 3, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category breakdown + Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Pie Chart */}
            <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Revenue by Category</h3>
              <p className="text-xs text-gray-400 mb-2">Last {days} days breakdown</p>
              {catData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm text-gray-400">No category data</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                      dataKey="value" nameKey="name" paddingAngle={2}>
                      {catData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend formatter={(v) => <span className="text-[10px] text-gray-600">{v}</span>} iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Products Table */}
            <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm overflow-hidden lg:col-span-3">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Top Products</h3>
                <p className="text-xs text-gray-400 mt-0.5">By revenue · last {days} days</p>
              </div>
              {(data?.topProducts?.length ?? 0) === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-gray-400">No sales yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F5EDF2] border-b border-[#E8E0E4]">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">#</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Product</th>
                      <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500 hidden sm:table-cell">Units</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Revenue</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-24 hidden lg:table-cell">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(data?.topProducts || []).map((p, i) => (
                      <tr key={p.id} className="hover:bg-[#C49A3C]/5">
                        <td className="px-4 py-3 text-gray-400 font-medium text-xs">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800 truncate max-w-[140px] text-xs">{p.name}</td>
                        <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell text-xs">{p.unitsSold}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800 text-xs"
                          style={{ fontFamily: 'var(--font-playfair)' }}>
                          {fmt(p.revenue)}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${(p.revenue / maxTopRev) * 100}%`, background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Insight cards */}
          {data && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl p-4 border border-blue-100 bg-blue-50">
                <p className="text-xs font-semibold text-blue-800 mb-1"> Avg orders / day</p>
                <p className="text-2xl font-bold text-blue-900" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {data.orders > 0 ? (data.orders / days).toFixed(1) : '0'}
                </p>
                <p className="text-[10px] text-blue-600 mt-1">Over {days} days</p>
              </div>
              <div className="rounded-xl p-4 border border-green-100 bg-green-50">
                <p className="text-xs font-semibold text-green-800 mb-1"> Revenue / order</p>
                <p className="text-2xl font-bold text-green-900" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {fmt(data.avgOrderValue)}
                </p>
                <p className="text-[10px] text-green-600 mt-1">Average basket size</p>
              </div>
              <div className={`rounded-xl p-4 border ${data.returnRate <= 3 ? 'border-green-100 bg-green-50' : data.returnRate <= 6 ? 'border-amber-100 bg-amber-50' : 'border-red-100 bg-red-50'}`}>
                <p className={`text-xs font-semibold mb-1 ${data.returnRate <= 3 ? 'text-green-800' : data.returnRate <= 6 ? 'text-amber-800' : 'text-red-800'}`}>
                  {data.returnRate <= 3 ? ' Excellent' : data.returnRate <= 6 ? ' Monitor' : '↑ High'} return rate
                </p>
                <p className={`text-2xl font-bold ${data.returnRate <= 3 ? 'text-green-900' : data.returnRate <= 6 ? 'text-amber-900' : 'text-red-900'}`}
                  style={{ fontFamily: 'var(--font-playfair)' }}>
                  {data.returnRate}%
                </p>
                <p className={`text-[10px] mt-1 ${data.returnRate <= 3 ? 'text-green-600' : data.returnRate <= 6 ? 'text-amber-600' : 'text-red-600'}`}>
                  Target: below 5%
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Seller Health Score */}
      <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-5">
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

        <div className="relative h-3 rounded-full bg-gray-100 mb-1 overflow-hidden">
          <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${healthScore}%`, background: `linear-gradient(90deg, #3D0E2A, #C49A3C)` }} />
          {[61, 86].map(t => (
            <div key={t} className="absolute top-0 bottom-0 w-0.5 bg-white/80" style={{ left: `${t}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mb-5">
          <span>Bronze (0–60)</span><span>Silver (61–85)</span><span>Gold (86–100)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {METRICS.map(m => {
            const isGood = m.good(m.value);
            const color = isGood ? '#2E7D32' : m.invert ? '#5B1A3A' : '#C49A3C';
            const bg = isGood ? '#EBF7EF' : m.invert ? '#FDF3F3' : '#FEF7EA';
            const barPct = m.max ? (m.value / m.max) * 100 : m.invert ? Math.max(0, 100 - (m.value / m.target) * 100 * 0.5) : Math.min((m.value / (m.target * 1.2)) * 100, 100);
            return (
              <div key={m.key} className="rounded-xl p-4 border" style={{ background: bg, borderColor: `${color}25` }}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-gray-600 leading-tight">{m.label}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${color}20`, color }}>{isGood ? ' Good' : ' Improve'}</span>
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

        {nextTier && (
          <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: '#FEFCE8', borderColor: '#FDE68A' }}>
            <span className="text-lg"></span>
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
