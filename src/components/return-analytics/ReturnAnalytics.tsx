'use client';

import { useState, useMemo, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────

type Role = 'admin' | 'seller';
type Period = '30d' | '90d' | '6m';
type ReasonFilter = 'All' | 'Size' | 'Quality' | 'Wrong Item' | 'Damage' | 'Other';
type Severity = 'Critical' | 'High' | 'Normal';
type ReturnStatus = 'Pending' | 'Approved' | 'Refunded' | 'Rejected' | 'Exchanged';
type SortDir = 'asc' | 'desc';

interface ReturnLog {
  id: string;
  orderId: string;
  sellerName: string;
  sellerId: string;
  productName: string;
  category: string;
  reason: ReasonFilter;
  amount: number;
  status: ReturnStatus;
  date: string;
}

interface SellerRow {
  id: string;
  name: string;
  totalReturns: number;
  returnRate: number;
  topReason: string;
  severity: Severity;
  revenue: number;
}

interface ProductRow {
  id: string;
  name: string;
  category: string;
  totalSold: number;
  totalReturns: number;
  returnRate: number;
  topReason: string;
}

interface ReasonData {
  reason: ReasonFilter;
  count: number;
  percentage: number;
  color: string;
}

interface TrendPoint {
  month: string;
  platformRate: number;
  sellerRate?: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const REASON_COLORS: Record<ReasonFilter, string> = {
  'All': '#6b7280',
  'Size': '#3b82f6',
  'Quality': '#ef4444',
  'Wrong Item': '#f59e0b',
  'Damage': '#8b5cf6',
  'Other': '#6b7280',
};

const SEVERITY_STYLES: Record<Severity, { bg: string; text: string; dot: string }> = {
  Critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  High: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Normal: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
};

const STATUS_STYLES: Record<ReturnStatus, { bg: string; text: string }> = {
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
  Approved: { bg: 'bg-blue-50', text: 'text-blue-700' },
  Refunded: { bg: 'bg-green-50', text: 'text-green-700' },
  Rejected: { bg: 'bg-red-50', text: 'text-red-700' },
  Exchanged: { bg: 'bg-purple-50', text: 'text-purple-700' },
};

const REASON_FILTERS: ReasonFilter[] = ['All', 'Size', 'Quality', 'Wrong Item', 'Damage', 'Other'];
const PERIODS: { key: Period; label: string }[] = [
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: '6m', label: '6 Months' },
];
const CATEGORIES = ['All', 'Sarees', "Men's Wear", "Women's Wear", "Kids' Wear", 'Accessories'];
const SEVERITY_OPTIONS: Severity[] = ['Critical', 'High', 'Normal'];

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_RETURN_LOGS: ReturnLog[] = [
  { id: 'R001', orderId: 'IFP-1036', sellerName: 'Silk House Gaya', sellerId: 's1', productName: 'Banarasi Silk Saree', category: 'Sarees', reason: 'Size', amount: 2499, status: 'Refunded', date: '2026-03-18' },
  { id: 'R002', orderId: 'IFP-1028', sellerName: 'Kumar Textiles', sellerId: 's2', productName: 'Cotton Kurta Set', category: "Men's Wear", reason: 'Quality', amount: 899, status: 'Approved', date: '2026-03-17' },
  { id: 'R003', orderId: 'IFP-1025', sellerName: 'Fashion Hub', sellerId: 's3', productName: 'Designer Lehenga', category: "Women's Wear", reason: 'Wrong Item', amount: 4599, status: 'Pending', date: '2026-03-16' },
  { id: 'R004', orderId: 'IFP-1022', sellerName: 'Silk House Gaya', sellerId: 's1', productName: 'Chanderi Saree', category: 'Sarees', reason: 'Damage', amount: 1899, status: 'Refunded', date: '2026-03-15' },
  { id: 'R005', orderId: 'IFP-1019', sellerName: 'Little Stars', sellerId: 's4', productName: 'Kids Party Dress', category: "Kids' Wear", reason: 'Size', amount: 649, status: 'Exchanged', date: '2026-03-14' },
  { id: 'R006', orderId: 'IFP-1015', sellerName: 'Ethnic Corner', sellerId: 's5', productName: 'Printed Palazzo Set', category: "Women's Wear", reason: 'Quality', amount: 799, status: 'Rejected', date: '2026-03-13' },
  { id: 'R007', orderId: 'IFP-1012', sellerName: 'Kumar Textiles', sellerId: 's2', productName: 'Formal Shirt', category: "Men's Wear", reason: 'Size', amount: 699, status: 'Refunded', date: '2026-03-12' },
  { id: 'R008', orderId: 'IFP-1010', sellerName: 'Craft Corner', sellerId: 's6', productName: 'Embroidered Dupatta', category: 'Accessories', reason: 'Other', amount: 399, status: 'Approved', date: '2026-03-11' },
  { id: 'R009', orderId: 'IFP-1008', sellerName: 'Silk House Gaya', sellerId: 's1', productName: 'Kanjivaram Silk Saree', category: 'Sarees', reason: 'Quality', amount: 5200, status: 'Pending', date: '2026-03-10' },
  { id: 'R010', orderId: 'IFP-1005', sellerName: 'Fashion Hub', sellerId: 's3', productName: 'Anarkali Suit', category: "Women's Wear", reason: 'Damage', amount: 2100, status: 'Refunded', date: '2026-03-09' },
  { id: 'R011', orderId: 'IFP-1003', sellerName: 'Little Stars', sellerId: 's4', productName: 'Kids Kurta Set', category: "Kids' Wear", reason: 'Wrong Item', amount: 550, status: 'Exchanged', date: '2026-03-08' },
  { id: 'R012', orderId: 'IFP-1001', sellerName: 'Kumar Textiles', sellerId: 's2', productName: 'Linen Shirt', category: "Men's Wear", reason: 'Size', amount: 1250, status: 'Refunded', date: '2026-03-07' },
  { id: 'R013', orderId: 'IFP-0998', sellerName: 'Silk House Gaya', sellerId: 's1', productName: 'Tussar Silk Saree', category: 'Sarees', reason: 'Other', amount: 1800, status: 'Approved', date: '2026-03-05' },
  { id: 'R014', orderId: 'IFP-0995', sellerName: 'Fashion Hub', sellerId: 's3', productName: 'Embroidered Kurti', category: "Women's Wear", reason: 'Size', amount: 950, status: 'Pending', date: '2026-03-03' },
  { id: 'R015', orderId: 'IFP-0990', sellerName: 'Ethnic Corner', sellerId: 's5', productName: 'Georgette Saree', category: 'Sarees', reason: 'Quality', amount: 1650, status: 'Refunded', date: '2026-03-01' },
];

const MOCK_SELLERS: SellerRow[] = [
  { id: 's1', name: 'Silk House Gaya', totalReturns: 18, returnRate: 8.2, topReason: 'Quality', severity: 'Critical', revenue: 156000 },
  { id: 's2', name: 'Kumar Textiles', totalReturns: 12, returnRate: 5.8, topReason: 'Size', severity: 'High', revenue: 98000 },
  { id: 's3', name: 'Fashion Hub', totalReturns: 9, returnRate: 4.1, topReason: 'Wrong Item', severity: 'High', revenue: 124000 },
  { id: 's4', name: 'Little Stars', totalReturns: 5, returnRate: 2.9, topReason: 'Size', severity: 'Normal', revenue: 45000 },
  { id: 's5', name: 'Ethnic Corner', totalReturns: 7, returnRate: 6.1, topReason: 'Quality', severity: 'High', revenue: 67000 },
  { id: 's6', name: 'Craft Corner', totalReturns: 2, returnRate: 1.5, topReason: 'Other', severity: 'Normal', revenue: 32000 },
];

const MOCK_SELLER_PRODUCTS: ProductRow[] = [
  { id: 'p1', name: 'Banarasi Silk Saree', category: 'Sarees', totalSold: 45, totalReturns: 6, returnRate: 13.3, topReason: 'Size' },
  { id: 'p2', name: 'Cotton Kurta Set', category: "Men's Wear", totalSold: 38, totalReturns: 4, returnRate: 10.5, topReason: 'Quality' },
  { id: 'p3', name: 'Designer Lehenga', category: "Women's Wear", totalSold: 22, totalReturns: 3, returnRate: 13.6, topReason: 'Wrong Item' },
  { id: 'p4', name: 'Kids Party Dress', category: "Kids' Wear", totalSold: 30, totalReturns: 2, returnRate: 6.7, topReason: 'Size' },
  { id: 'p5', name: 'Chanderi Saree', category: 'Sarees', totalSold: 28, totalReturns: 1, returnRate: 3.6, topReason: 'Damage' },
  { id: 'p6', name: 'Formal Shirt', category: "Men's Wear", totalSold: 55, totalReturns: 2, returnRate: 3.6, topReason: 'Size' },
];

const MOCK_TREND: TrendPoint[] = [
  { month: 'Oct', platformRate: 3.8, sellerRate: 5.2 },
  { month: 'Nov', platformRate: 4.1, sellerRate: 6.8 },
  { month: 'Dec', platformRate: 4.5, sellerRate: 7.1 },
  { month: 'Jan', platformRate: 3.9, sellerRate: 5.5 },
  { month: 'Feb', platformRate: 3.4, sellerRate: 4.8 },
  { month: 'Mar', platformRate: 3.2, sellerRate: 4.2 },
];

const FIX_SUGGESTIONS: Record<string, { title: string; desc: string }> = {
  Size: { title: 'Improve Size Guides', desc: 'Add detailed measurement charts with cm/inch for each product. Consider adding a "True to Size" indicator based on customer feedback.' },
  Quality: { title: 'Strengthen QC Process', desc: 'Implement pre-dispatch quality checks. Take photos of each item before shipping as proof of condition at dispatch.' },
  'Wrong Item': { title: 'Review Picking Process', desc: 'Double-check SKU labels before packing. Use barcode scanning to verify the correct item is being shipped.' },
  Damage: { title: 'Upgrade Packaging', desc: 'Use bubble wrap and rigid mailers for delicate items. Add "FRAGILE" stickers and consider insurance for high-value products.' },
  Other: { title: 'Enhance Product Descriptions', desc: 'Ensure product photos match actual items. Add multiple angles and accurate color representation to reduce unmet expectations.' },
};

// ─── Utility ────────────────────────────────────────────────────────────────

function formatINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

function downloadFile(data: string, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KPICard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-1">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

function SeverityPill({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLES[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {severity}
    </span>
  );
}

function StatusPill({ status }: { status: ReturnStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}>
      {status}
    </span>
  );
}

function ReasonPill({ reason }: { reason: string }) {
  const color = REASON_COLORS[reason as ReasonFilter] || '#6b7280';
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: color + '15', color }}>
      {reason}
    </span>
  );
}

function SortHeader({ label, sortKey, currentSort, currentDir, onSort }: {
  label: string; sortKey: string; currentSort: string; currentDir: SortDir; onSort: (key: string) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <th
      className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-3 cursor-pointer hover:text-gray-800 select-none whitespace-nowrap"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`text-[9px] ${active ? 'text-emerald-600' : 'text-gray-300'}`}>
          {active && currentDir === 'asc' ? '▲' : active && currentDir === 'desc' ? '▼' : '⇅'}
        </span>
      </span>
    </th>
  );
}

function ReasonBars({ data, selectedReason }: { data: ReasonData[]; selectedReason: ReasonFilter }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-3">
      {data.map(d => {
        const dimmed = selectedReason !== 'All' && d.reason !== selectedReason;
        return (
          <div key={d.reason} className={`transition-opacity duration-300 ${dimmed ? 'opacity-30' : 'opacity-100'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-sm text-gray-700 font-medium">{d.reason}</span>
              </div>
              <span className="text-sm font-semibold text-gray-800">{d.count} <span className="text-gray-400 font-normal text-xs">({d.percentage}%)</span></span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(d.count / max) * 100}%`, background: d.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ReturnAnalytics() {
  // State
  const [role, setRole] = useState<Role>('admin');
  const [period, setPeriod] = useState<Period>('30d');
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [sellerSort, setSellerSort] = useState({ key: 'returnRate', dir: 'desc' as SortDir });
  const [productSort, setProductSort] = useState({ key: 'returnRate', dir: 'desc' as SortDir });
  const [logSort, setLogSort] = useState({ key: 'date', dir: 'desc' as SortDir });

  // The seller for seller view (demo: Silk House Gaya)
  const currentSellerId = 's1';
  const currentSeller = MOCK_SELLERS.find(s => s.id === currentSellerId)!;

  // ─── Computed data ──────────────────────────────────────────────────────

  const reasonData: ReasonData[] = useMemo(() => {
    const logs = role === 'seller' ? MOCK_RETURN_LOGS.filter(l => l.sellerId === currentSellerId) : MOCK_RETURN_LOGS;
    const counts: Record<string, number> = { Size: 0, Quality: 0, 'Wrong Item': 0, Damage: 0, Other: 0 };
    logs.forEach(l => { if (l.reason !== 'All') counts[l.reason] = (counts[l.reason] || 0) + 1; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return (Object.entries(counts) as [ReasonFilter, number][]).map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / total) * 100),
      color: REASON_COLORS[reason],
    }));
  }, [role]);

  const filteredLogs = useMemo(() => {
    let logs = role === 'seller' ? MOCK_RETURN_LOGS.filter(l => l.sellerId === currentSellerId) : [...MOCK_RETURN_LOGS];
    if (reasonFilter !== 'All') logs = logs.filter(l => l.reason === reasonFilter);
    if (role === 'admin' && severityFilter !== 'All') {
      const sellerIds = MOCK_SELLERS.filter(s => s.severity === severityFilter).map(s => s.id);
      logs = logs.filter(l => sellerIds.includes(l.sellerId));
    }
    if (role === 'seller' && categoryFilter !== 'All') logs = logs.filter(l => l.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      logs = logs.filter(l =>
        l.orderId.toLowerCase().includes(q) ||
        l.sellerName.toLowerCase().includes(q) ||
        l.productName.toLowerCase().includes(q)
      );
    }
    // Sort
    logs.sort((a, b) => {
      const key = logSort.key as keyof ReturnLog;
      const va = a[key]; const vb = b[key];
      const cmp = typeof va === 'number' ? (va as number) - (vb as number) : String(va).localeCompare(String(vb));
      return logSort.dir === 'asc' ? cmp : -cmp;
    });
    return logs;
  }, [role, reasonFilter, severityFilter, categoryFilter, search, logSort]);

  const filteredSellers = useMemo(() => {
    let sellers = [...MOCK_SELLERS];
    if (severityFilter !== 'All') sellers = sellers.filter(s => s.severity === severityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      sellers = sellers.filter(s => s.name.toLowerCase().includes(q));
    }
    sellers.sort((a, b) => {
      const key = sellerSort.key as keyof SellerRow;
      const va = a[key]; const vb = b[key];
      const cmp = typeof va === 'number' ? (va as number) - (vb as number) : String(va).localeCompare(String(vb));
      return sellerSort.dir === 'asc' ? cmp : -cmp;
    });
    return sellers;
  }, [severityFilter, search, sellerSort]);

  const filteredProducts = useMemo(() => {
    let prods = [...MOCK_SELLER_PRODUCTS];
    if (categoryFilter !== 'All') prods = prods.filter(p => p.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      prods = prods.filter(p => p.name.toLowerCase().includes(q));
    }
    prods.sort((a, b) => {
      const key = productSort.key as keyof ProductRow;
      const va = a[key]; const vb = b[key];
      const cmp = typeof va === 'number' ? (va as number) - (vb as number) : String(va).localeCompare(String(vb));
      return productSort.dir === 'asc' ? cmp : -cmp;
    });
    return prods;
  }, [categoryFilter, search, productSort]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const toggleSort = useCallback((setter: (v: any) => void) => (key: string) => {
    setter((prev: { key: string; dir: SortDir }) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }
    );
  }, []);

  const exportCSV = useCallback(() => {
    const headers = ['Order ID', 'Seller', 'Product', 'Reason', 'Amount', 'Status', 'Date'];
    const rows = filteredLogs.map(l => [l.orderId, l.sellerName, l.productName, l.reason, l.amount, l.status, l.date]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    downloadFile(csv, `returns-${role}-${Date.now()}.csv`, 'text/csv');
    toast.success('CSV exported successfully');
  }, [filteredLogs, role]);

  const exportJSON = useCallback(() => {
    const json = JSON.stringify(filteredLogs, null, 2);
    downloadFile(json, `returns-${role}-${Date.now()}.json`, 'application/json');
    toast.success('JSON exported successfully');
  }, [filteredLogs, role]);

  // ─── Admin KPIs ─────────────────────────────────────────────────────────

  const adminKPIs = useMemo(() => {
    const totalReturns = MOCK_RETURN_LOGS.length;
    const activeSellers = MOCK_SELLERS.length;
    const returnRate = 3.2;
    const refundsIssued = MOCK_RETURN_LOGS.filter(l => l.status === 'Refunded').reduce((s, l) => s + l.amount, 0);
    return { totalReturns, activeSellers, returnRate, refundsIssued };
  }, []);

  // ─── Seller KPIs ────────────────────────────────────────────────────────

  const sellerKPIs = useMemo(() => {
    const myLogs = MOCK_RETURN_LOGS.filter(l => l.sellerId === currentSellerId);
    const totalReturns = myLogs.length;
    const myRefunds = myLogs.filter(l => l.status === 'Refunded').reduce((s, l) => s + l.amount, 0);
    return {
      totalReturns,
      returnRate: currentSeller.returnRate,
      platformAvg: 3.2,
      refundsIssued: myRefunds,
    };
  }, [currentSeller]);

  // ─── Action Items (Admin) ───────────────────────────────────────────────

  const actionItems = useMemo(() => {
    return MOCK_SELLERS
      .filter(s => s.severity !== 'Normal')
      .sort((a, b) => {
        const order: Record<Severity, number> = { Critical: 0, High: 1, Normal: 2 };
        return order[a.severity] - order[b.severity];
      })
      .map(s => ({
        seller: s.name,
        severity: s.severity,
        message: s.severity === 'Critical'
          ? `Return rate ${s.returnRate}% is critically high. Top issue: ${s.topReason}. Immediate review needed.`
          : `Return rate ${s.returnRate}% exceeds threshold. Primary cause: ${s.topReason}. Schedule seller call.`,
      }));
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
      <Toaster position="top-right" />

      {/* Role Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Return Reason Analytics</h2>
          <p className="text-xs text-gray-400 mt-0.5">Analyse return patterns and take corrective action</p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {(['admin', 'seller'] as Role[]).map(r => (
            <button
              key={r}
              onClick={() => { setRole(r); setSearch(''); setReasonFilter('All'); setSeverityFilter('All'); setCategoryFilter('All'); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                role === r ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === 'admin' ? 'Admin View' : 'Seller View'}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period */}
          <div className="flex items-center bg-gray-50 rounded-lg p-0.5">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p.key ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Reason chips */}
          <div className="flex flex-wrap gap-1.5">
            {REASON_FILTERS.map(r => (
              <button
                key={r}
                onClick={() => setReasonFilter(r)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                  reasonFilter === r
                    ? 'border-transparent text-white'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
                style={reasonFilter === r ? { background: REASON_COLORS[r] } : undefined}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Role-specific filter */}
          {role === 'admin' ? (
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Severity</option>
              {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search orders, sellers, products..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Export */}
          <div className="flex gap-1.5">
            <button onClick={exportCSV} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">
              Export CSV
            </button>
            <button onClick={exportJSON} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════ ADMIN VIEW ════════════════════════ */}
      {role === 'admin' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Returns" value={adminKPIs.totalReturns} sub={`in last ${period}`} color="#ef4444" />
            <KPICard label="Active Sellers" value={adminKPIs.activeSellers} sub="with returns" color="#3b82f6" />
            <KPICard label="Return Rate" value={`${adminKPIs.returnRate}%`} sub="platform average" color="#f59e0b" />
            <KPICard label="Refunds Issued" value={formatINR(adminKPIs.refundsIssued)} sub="total refunded" color="#059669" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Reason Breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Return Reason Breakdown</h3>
              <ReasonBars data={reasonData} selectedReason={reasonFilter} />
            </div>

            {/* 6-month Trend */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Return Rate Trend (6 Months)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={MOCK_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" domain={[0, 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="platformRate" name="Platform Avg" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Seller Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Sellers by Return Rate</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <SortHeader label="Seller" sortKey="name" currentSort={sellerSort.key} currentDir={sellerSort.dir} onSort={toggleSort(setSellerSort)} />
                    <SortHeader label="Returns" sortKey="totalReturns" currentSort={sellerSort.key} currentDir={sellerSort.dir} onSort={toggleSort(setSellerSort)} />
                    <SortHeader label="Rate" sortKey="returnRate" currentSort={sellerSort.key} currentDir={sellerSort.dir} onSort={toggleSort(setSellerSort)} />
                    <SortHeader label="Top Reason" sortKey="topReason" currentSort={sellerSort.key} currentDir={sellerSort.dir} onSort={toggleSort(setSellerSort)} />
                    <SortHeader label="Revenue" sortKey="revenue" currentSort={sellerSort.key} currentDir={sellerSort.dir} onSort={toggleSort(setSellerSort)} />
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-3">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSellers.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 text-sm font-medium text-gray-800">{s.name}</td>
                      <td className="py-3 px-3 text-sm text-gray-600">{s.totalReturns}</td>
                      <td className="py-3 px-3 text-sm font-semibold" style={{ color: s.returnRate > 6 ? '#ef4444' : s.returnRate > 4 ? '#f59e0b' : '#059669' }}>{s.returnRate}%</td>
                      <td className="py-3 px-3"><ReasonPill reason={s.topReason} /></td>
                      <td className="py-3 px-3 text-sm text-gray-600">{formatINR(s.revenue)}</td>
                      <td className="py-3 px-3"><SeverityPill severity={s.severity} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Return Log */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Return Log</h3>
              <span className="text-xs text-gray-400">{filteredLogs.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <SortHeader label="Order ID" sortKey="orderId" currentSort={logSort.key} currentDir={logSort.dir} onSort={toggleSort(setLogSort)} />
                    <SortHeader label="Seller" sortKey="sellerName" currentSort={logSort.key} currentDir={logSort.dir} onSort={toggleSort(setLogSort)} />
                    <SortHeader label="Product" sortKey="productName" currentSort={logSort.key} currentDir={logSort.dir} onSort={toggleSort(setLogSort)} />
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-3">Reason</th>
                    <SortHeader label="Amount" sortKey="amount" currentSort={logSort.key} currentDir={logSort.dir} onSort={toggleSort(setLogSort)} />
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-3">Status</th>
                    <SortHeader label="Date" sortKey="date" currentSort={logSort.key} currentDir={logSort.dir} onSort={toggleSort(setLogSort)} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLogs.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 text-sm font-mono text-gray-700">{l.orderId}</td>
                      <td className="py-3 px-3 text-sm text-gray-600">{l.sellerName}</td>
                      <td className="py-3 px-3 text-sm text-gray-600 max-w-[180px] truncate">{l.productName}</td>
                      <td className="py-3 px-3"><ReasonPill reason={l.reason} /></td>
                      <td className="py-3 px-3 text-sm font-medium text-gray-800">{formatINR(l.amount)}</td>
                      <td className="py-3 px-3"><StatusPill status={l.status} /></td>
                      <td className="py-3 px-3 text-sm text-gray-500">{l.date}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-sm text-gray-400">No returns match the current filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Action Items</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {actionItems.map((item, i) => (
                <div key={i} className="px-5 py-4 flex items-start gap-3">
                  <SeverityPill severity={item.severity} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.seller}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════ SELLER VIEW ════════════════════════ */}
      {role === 'seller' && (
        <>
          {/* KPIs with benchmark */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="My Returns" value={sellerKPIs.totalReturns} sub={`in last ${period}`} color="#ef4444" />
            <KPICard
              label="My Return Rate"
              value={`${sellerKPIs.returnRate}%`}
              sub={`Platform avg: ${sellerKPIs.platformAvg}%`}
              color={sellerKPIs.returnRate > sellerKPIs.platformAvg ? '#ef4444' : '#059669'}
            />
            <KPICard label="Platform Average" value={`${sellerKPIs.platformAvg}%`} sub="return rate" color="#3b82f6" />
            <KPICard label="My Refunds" value={formatINR(sellerKPIs.refundsIssued)} sub="total refunded" color="#f59e0b" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Reason Breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">My Return Reasons</h3>
              <ReasonBars data={reasonData} selectedReason={reasonFilter} />
            </div>

            {/* Trend: Seller vs Platform */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">My Rate vs Platform Average</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={MOCK_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" domain={[0, 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="sellerRate" name="My Rate" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="platformRate" name="Platform Avg" stroke="#059669" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Most-Returned Products */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Most-Returned Products</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <SortHeader label="Product" sortKey="name" currentSort={productSort.key} currentDir={productSort.dir} onSort={toggleSort(setProductSort)} />
                    <SortHeader label="Category" sortKey="category" currentSort={productSort.key} currentDir={productSort.dir} onSort={toggleSort(setProductSort)} />
                    <SortHeader label="Sold" sortKey="totalSold" currentSort={productSort.key} currentDir={productSort.dir} onSort={toggleSort(setProductSort)} />
                    <SortHeader label="Returns" sortKey="totalReturns" currentSort={productSort.key} currentDir={productSort.dir} onSort={toggleSort(setProductSort)} />
                    <SortHeader label="Rate" sortKey="returnRate" currentSort={productSort.key} currentDir={productSort.dir} onSort={toggleSort(setProductSort)} />
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-3">Top Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 text-sm font-medium text-gray-800">{p.name}</td>
                      <td className="py-3 px-3 text-xs text-gray-500">{p.category}</td>
                      <td className="py-3 px-3 text-sm text-gray-600">{p.totalSold}</td>
                      <td className="py-3 px-3 text-sm text-gray-600">{p.totalReturns}</td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{
                            background: p.returnRate > 10 ? '#fef2f2' : p.returnRate > 5 ? '#fffbeb' : '#ecfdf5',
                            color: p.returnRate > 10 ? '#dc2626' : p.returnRate > 5 ? '#d97706' : '#059669',
                          }}
                        >
                          {p.returnRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3"><ReasonPill reason={p.topReason} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Personal Return Log */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">My Return Log</h3>
              <span className="text-xs text-gray-400">{filteredLogs.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <SortHeader label="Order ID" sortKey="orderId" currentSort={logSort.key} currentDir={logSort.dir} onSort={toggleSort(setLogSort)} />
                    <SortHeader label="Product" sortKey="productName" currentSort={logSort.key} currentDir={logSort.dir} onSort={toggleSort(setLogSort)} />
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-3">Reason</th>
                    <SortHeader label="Amount" sortKey="amount" currentSort={logSort.key} currentDir={logSort.dir} onSort={toggleSort(setLogSort)} />
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-3">Status</th>
                    <SortHeader label="Date" sortKey="date" currentSort={logSort.key} currentDir={logSort.dir} onSort={toggleSort(setLogSort)} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLogs.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 text-sm font-mono text-gray-700">{l.orderId}</td>
                      <td className="py-3 px-3 text-sm text-gray-600 max-w-[180px] truncate">{l.productName}</td>
                      <td className="py-3 px-3"><ReasonPill reason={l.reason} /></td>
                      <td className="py-3 px-3 text-sm font-medium text-gray-800">{formatINR(l.amount)}</td>
                      <td className="py-3 px-3"><StatusPill status={l.status} /></td>
                      <td className="py-3 px-3 text-sm text-gray-500">{l.date}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-400">No returns match the current filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fix Suggestions */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Suggestions to Reduce Returns</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {reasonData
                .filter(d => d.count > 0)
                .sort((a, b) => b.count - a.count)
                .map(d => {
                  const fix = FIX_SUGGESTIONS[d.reason];
                  if (!fix) return null;
                  return (
                    <div key={d.reason} className="px-5 py-4 flex items-start gap-3">
                      <span className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ background: d.color }} />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-800">{fix.title}</p>
                          <ReasonPill reason={d.reason} />
                          <span className="text-xs text-gray-400">{d.count} returns</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{fix.desc}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
