'use client';

import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import {
  ShoppingCart, IndianRupee, Package, Users, TrendingUp,
  RotateCcw, ClipboardCheck, Eye, PackageCheck, Truck, MessageCircle,
  Send, Plus, X, Search, CheckCircle, Upload, Clock, MapPin,
  Shield, Smartphone, Mail, Bell as BellIcon, Globe, Save,
  Printer, FileText, Download, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { AdminLanguageProvider, useAdminLang } from '@/components/dashboard/LanguageContext';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import StatCard from '@/components/dashboard/StatCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import OrdersTable from '@/components/dashboard/OrdersTable';
import DeliveryHeatmap from '@/components/dashboard/DeliveryHeatmap';
import GrowthSuggestions from '@/components/dashboard/GrowthSuggestions';
import WhatsAppNotifPanel from '@/components/dashboard/WhatsAppNotifPanel';
import SupportTicketWidget from '@/components/dashboard/SupportTicketWidget';
import AccountHealthWidget from '@/components/dashboard/AccountHealthWidget';
import GSTExportPanel from '@/components/payments/GSTExportPanel';
import ReconciliationTable from '@/components/payments/ReconciliationTable';
import { StatCardSkeleton, ChartSkeleton, TableSkeleton, CardSkeleton } from '@/components/dashboard/Skeleton';
import { formatINR, formatNumber, ORDER_STATUS_COLORS, getDistanceBadge } from '@/lib/admin/constants';
import {
  MOCK_STATS, MOCK_REVENUE, MOCK_ORDERS, MOCK_PRODUCTS,
  MOCK_PAYMENTS, MOCK_TICKETS, MOCK_WA_LOGS, MOCK_ANALYTICS,
  MOCK_GROWTH_SUGGESTIONS,
} from '@/lib/admin/mockData';
import NDRActionModal from '@/components/ndr/NDRActionModal';
import CODVerificationBadge from '@/components/ndr/CODVerificationBadge';
import BulkUploadPanel from '@/components/catalogue/BulkUploadPanel';
import UserManagement from '@/components/user-management/UserManagement';
import ReturnAnalytics from '@/components/return-analytics/ReturnAnalytics';
import SellerManagement from '@/components/seller-management/SellerManagement';
import CategoryManagement from '@/components/admin/CategoryManagement';
import type { AdminPage, Order, NDRRecord } from '@/types/admin';

// ─── Module 1: Dashboard Home ───────────────────────────────────────────────

function DashboardHome() {
  const { t } = useAdminLang();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(MOCK_STATS);
  const [revenueData, setRevenueData] = useState(MOCK_REVENUE);
  const [orders, setOrders] = useState(MOCK_ORDERS);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch(`/api/admin/dashboard/stats?adminUserId=${user.id}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/admin/dashboard/orders?adminUserId=${user.id}`).then(r => r.ok ? r.json() : null),
        ]);
        if (statsRes && !statsRes.error) setStats(statsRes);
        if (ordersRes && Array.isArray(ordersRes) && ordersRes.length > 0) setOrders(ordersRes);
      } catch {
        // Fallback to mock data — already set as default
      }
      setLoading(false);
    };
    loadData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 0% Commission banner */}
      <div className="p-4 bg-gradient-to-r from-[#F5EDF2] to-[#FAF7F8] border border-[#E8E0E4] rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#F5EDF2] flex items-center justify-center text-[#5B1A3A] font-bold text-lg">₹0</div>
        <div>
          <p className="text-sm font-semibold text-[#3D0E2A]">{t('dash.commission')}</p>
          <p className="text-xs text-[#5B1A3A]">{t('dash.commissionDesc')}</p>
        </div>
      </div>

      {/* Row 1: 4 StatCards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={t('dash.totalOrders')} value={formatNumber(stats.totalOrders)} change={12} icon={<ShoppingCart size={20} />} color="#5B1A3A" />
        <StatCard title={t('dash.totalRevenue')} value={formatINR(stats.totalRevenue)} change={15} icon={<IndianRupee size={20} />} color="#C49A3C" />
        <StatCard title={t('dash.pendingApprovals')} value={String(stats.pendingApprovals)} icon={<ClipboardCheck size={20} />} color="#f59e0b" />
        <StatCard title={t('dash.returnRate')} value={`${stats.returnRate}%`} change={-1.5} icon={<RotateCcw size={20} />} color="#ef4444" />
      </div>

      {/* Account Health Score — full width */}
      <AccountHealthWidget />

      {/* Row 2: RevenueChart + GrowthSuggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </div>
        <GrowthSuggestions />
      </div>

      {/* Row 3: Recent orders + DeliveryHeatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">{t('dash.recentOrders')}</h3>
            <button className="text-xs text-[#C49A3C] font-medium hover:underline">{t('dash.viewAll')}</button>
          </div>
          <OrdersTable orders={orders} compact />
        </div>
        <DeliveryHeatmap />
      </div>

      {/* Row 4: WhatsApp + Support */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WhatsAppNotifPanel />
        <SupportTicketWidget />
      </div>
    </div>
  );
}

// ─── Module 2: Orders ───────────────────────────────────────────────────────

function OrdersPage() {
  const { t } = useAdminLang();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/admin/dashboard/orders?adminUserId=${user.id}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setOrders(data);
      } catch {
        // Fallback to mock
      }
      setLoading(false);
    };
    loadOrders();
  }, [user?.id]);

  const statuses = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(o => o.id)));
  };

  const bulkUpdate = (newStatus: string) => {
    setOrders(prev => prev.map(o =>
      selected.has(o.id) ? { ...o, status: newStatus as Order['status'] } : o
    ));
    toast.success(`${selected.size} orders marked as ${newStatus}`);
    setSelected(new Set());
  };

  const markOrder = (id: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as Order['status'] } : o));
    toast.success(`Order marked as ${newStatus}`);
  };

  const sendWA = (order: Order) => {
    toast.success(`WhatsApp sent to ${order.customer_name}`);
  };

  const printLabel = (orderId: string) => {
    window.open(`/api/orders/${orderId}/label`, '_blank');
  };

  const downloadInvoice = (orderId: string) => {
    window.open(`/api/orders/${orderId}/invoice`, '_blank');
  };

  const [bulkDownloading, setBulkDownloading] = useState(false);
  const bulkPrintLabels = async () => {
    if (selected.size === 0) return;
    setBulkDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const ids = Array.from(selected);
      for (let i = 0; i < ids.length; i++) {
        const order = orders.find(o => o.id === ids[i]);
        const res = await fetch(`/api/orders/${ids[i]}/label`);
        if (res.ok) {
          const blob = await res.blob();
          zip.file(`label-${order?.order_id || ids[i]}.pdf`, blob);
        }
        toast.loading(`Generating ${i + 1}/${ids.length}...`, { id: 'bulk-label' });
      }
      toast.dismiss('bulk-label');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shipping-labels-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${ids.length} labels downloaded as ZIP`);
    } catch {
      toast.error('Failed to generate labels');
    }
    setBulkDownloading(false);
  };

  if (loading) return <TableSkeleton rows={8} />;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('orders.title')}</h2>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === s ? 'bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t(`orders.${s}`)}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-2 p-3 bg-[#F5EDF2] border border-[#E8E0E4] rounded-lg">
          <span className="text-sm font-medium text-[#3D0E2A]">{selected.size} selected</span>
          <button onClick={() => bulkUpdate('confirmed')} className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600">
            <PackageCheck size={12} className="inline mr-1" />{t('orders.confirmed')}
          </button>
          <button onClick={() => bulkUpdate('shipped')} className="px-3 py-1 bg-indigo-500 text-white rounded-md text-xs font-medium hover:bg-indigo-600">
            <Truck size={12} className="inline mr-1" />{t('orders.shipped')}
          </button>
          <button onClick={bulkPrintLabels} disabled={bulkDownloading}
            className="px-3 py-1 bg-amber-500 text-white rounded-md text-xs font-medium hover:bg-amber-600 disabled:opacity-50">
            {bulkDownloading ? <Loader2 size={12} className="inline mr-1 animate-spin" /> : <Printer size={12} className="inline mr-1" />}
            {t('orders.printAllLabels')}
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-700">Clear</button>
        </div>
      )}

      {/* Orders table with checkboxes and actions */}
      <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAF7F8] border-b border-[rgba(196,154,60,0.06)]">
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={selectAll} className="rounded border-gray-300 text-[#C49A3C] focus:ring-[#C49A3C]" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.orderId')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.customer')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pincode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.amount')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.status')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.action')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const statusColor = ORDER_STATUS_COLORS[order.status] || '#6b7280';
                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)}
                        className="rounded border-gray-300 text-[#C49A3C] focus:ring-[#C49A3C]" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{order.order_id}</td>
                    <td className="px-4 py-3 text-gray-700">{order.customer_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{order.items[0]?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{order.pincode}</span>
                      {order.distance_km !== undefined && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ ...(() => { const b = getDistanceBadge(order.distance_km!); return { backgroundColor: b.bg, color: b.color }; })() }}>
                          {order.distance_km} km
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatINR(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: statusColor + '18', color: statusColor }}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {order.status === 'pending' && (
                          <button onClick={() => markOrder(order.id, 'confirmed')} title="Mark Packed"
                            className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            <PackageCheck size={14} />
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button onClick={() => markOrder(order.id, 'shipped')} title="Mark Shipped"
                            className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                            <Truck size={14} />
                          </button>
                        )}
                        <button onClick={() => sendWA(order)} title="Send WhatsApp"
                          className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                          <MessageCircle size={14} />
                        </button>
                        <button onClick={() => printLabel(order.id)} title={t('orders.printLabel')}
                          className="p-1.5 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
                          <Printer size={14} />
                        </button>
                        <button onClick={() => downloadInvoice(order.id)} title={t('orders.downloadInvoice')}
                          className="p-1.5 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors">
                          <FileText size={14} />
                        </button>
                        <button title="View" className="p-1.5 rounded-md bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Module 3: Catalogue ────────────────────────────────────────────────────

function CataloguePage() {
  const { t, lang } = useAdminLang();
  const { user } = useAuth();
  const [catTab, setCatTab] = useState<'products' | 'bulk'>('products');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productIdSearch, setProductIdSearch] = useState('');
  const [sellerSearch, setSellerSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [liveCategories, setLiveCategories] = useState<{ id: string; name: string }[]>([]);
  const [mrp, setMrp] = useState('');
  const [gstSlab, setGstSlab] = useState('5');
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?includeAllStatuses=true');
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch active L1 categories from the category tree
  useEffect(() => {
    fetch('/api/categories?level=1&active=true')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          const cats = d.data.map((c: any) => ({ id: c.id, name: c.name }));
          setLiveCategories(cats);
          if (!newProductCategory && cats.length > 0) setNewProductCategory(cats[0].name);
        }
      })
      .catch(() => {/* silent */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter(p => {
    const catMatch = catFilter === 'all' || p.category === catFilter;
    const statusMatch = statusFilter === 'all' || p.approvalStatus === statusFilter;
    const pidMatch = !productIdSearch.trim() ||
      (p.productId || '').toLowerCase().includes(productIdSearch.trim().toLowerCase());
    const sellerMatch = !sellerSearch.trim() ||
      (p.seller?.businessName || '').toLowerCase().includes(sellerSearch.trim().toLowerCase());
    return catMatch && statusMatch && pidMatch && sellerMatch;
  });

  const gstAmount = mrp ? (parseFloat(mrp) * parseFloat(gstSlab) / 100).toFixed(2) : '0';
  const sellingPrice = mrp ? (parseFloat(mrp) + parseFloat(gstAmount)).toFixed(0) : '0';

  async function handleAddProduct() {
    if (!newProductName.trim() || !mrp) {
      toast.error('Product name and price are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          product: {
            productId: `ADMIN-${Date.now()}`,
            name: newProductName,
            category: newProductCategory,
            price: parseFloat(sellingPrice) || parseFloat(mrp),
            originalPrice: parseFloat(mrp) || undefined,
            isActive: true,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add product');
      toast.success('Product added and live!');
      setShowModal(false);
      setNewProductName('');
      setMrp('');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add product');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{t('cat.title')}</h2>
        {catTab === 'products' && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
            <Plus size={16} />{t('cat.addProduct')}
          </button>
        )}
      </div>

      {/* Sub-tabs: Products | Bulk Upload */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['products', 'bulk'] as const).map(tab => (
          <button key={tab} onClick={() => setCatTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${catTab === tab ? 'bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab === 'products' ? t('cat.products') : t('cat.bulkUpload')}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {catTab === 'products' && (
        <>
          {/* Category filter — only active categories from the tree */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button onClick={() => setCatFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${catFilter === 'all' ? 'bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t('cat.all')}
            </button>
            {liveCategories.map(c => (
              <button key={c.id} onClick={() => setCatFilter(c.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${catFilter === c.name ? 'bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {c.name}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {[
              { key: 'all',      label: 'All Status',  cls: 'bg-gray-700 text-white border-gray-700' },
              { key: 'approved', label: 'Approved',    cls: 'bg-green-600 text-white border-green-600' },
              { key: 'pending',  label: 'Pending',     cls: 'bg-amber-500 text-white border-amber-500' },
              { key: 'rejected', label: 'Rejected',    cls: 'bg-red-500 text-white border-red-500' },
            ].map(s => (
              <button key={s.key} onClick={() => setStatusFilter(s.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                  ${statusFilter === s.key ? s.cls : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                {s.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400">{filtered.length} products</span>
          </div>

          {/* Search by Product ID + Seller Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Search by Product ID</label>
              <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus-within:border-[#C49A3C] focus-within:ring-2 focus-within:ring-[#C49A3C]/20 transition-all">
                <Search size={13} className="text-gray-400 flex-shrink-0" />
                <input
                  value={productIdSearch}
                  onChange={e => setProductIdSearch(e.target.value)}
                  placeholder="e.g. PRD-001, ADMIN-123…"
                  className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent"
                />
                {productIdSearch && (
                  <button onClick={() => setProductIdSearch('')} className="text-gray-400 hover:text-gray-700">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Search by Seller Name</label>
              <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus-within:border-[#C49A3C] focus-within:ring-2 focus-within:ring-[#C49A3C]/20 transition-all">
                <Search size={13} className="text-gray-400 flex-shrink-0" />
                <input
                  value={sellerSearch}
                  onChange={e => setSellerSearch(e.target.value)}
                  placeholder="e.g. Ravi Textiles…"
                  className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent"
                />
                {sellerSearch && (
                  <button onClick={() => setSellerSearch('')} className="text-gray-400 hover:text-gray-700">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product card grid */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-12 text-center">
              <Package size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(p => (
                <div key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] overflow-hidden hover:shadow-md hover:border-[rgba(196,154,60,0.25)] transition-all cursor-pointer">
                  {p.mainImage ? (
                    <img src={p.mainImage} alt={p.name} className="w-full h-36 object-cover" />
                  ) : (
                    <div className="h-36 bg-gray-100 flex items-center justify-center text-gray-400">
                      <Package size={40} />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{lang === 'hi' && p.nameHi ? p.nameHi : p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.category}{p.subCategory ? ` › ${p.subCategory}` : ''}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-base font-bold text-gray-900">{formatINR(p.price)}</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-xs text-gray-400 line-through">{formatINR(p.originalPrice)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${p.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                          p.approvalStatus === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-600'}`}>
                        {p.approvalStatus}
                      </span>
                      <span className="text-xs text-gray-400">Stock: {p.stockQuantity ?? 0}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{p.seller?.businessName || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Product Detail Modal */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedProduct(null)}>
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                  <h3 className="text-base font-semibold text-gray-800 line-clamp-1">{selectedProduct.name}</h3>
                  <button onClick={() => setSelectedProduct(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <X size={18} className="text-gray-500" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Image gallery */}
                  {(selectedProduct.images?.length > 0 || selectedProduct.mainImage) ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {(selectedProduct.images?.length > 0 ? selectedProduct.images : [selectedProduct.mainImage]).map((img: string, i: number) => (
                        <img key={i} src={img} alt={`img-${i}`}
                          className={`rounded-xl object-cover flex-shrink-0 ${i === 0 ? 'w-48 h-48' : 'w-24 h-24'}`} />
                      ))}
                    </div>
                  ) : (
                    <div className="h-36 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300">
                      <Package size={48} />
                    </div>
                  )}

                  {/* Status + active badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                      ${selectedProduct.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                        selectedProduct.approvalStatus === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-600'}`}>
                      {selectedProduct.approvalStatus}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                      ${selectedProduct.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {selectedProduct.isActive ? 'Live' : 'Inactive'}
                    </span>
                    {selectedProduct.isNewArrival && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">New Arrival</span>
                    )}
                    {selectedProduct.isBestSeller && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Best Seller</span>
                    )}
                  </div>

                  {/* Core details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Product ID</p>
                      <p className="text-xs font-mono text-gray-700">{selectedProduct.productId || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Category</p>
                      <p className="text-xs text-gray-700">
                        {selectedProduct.category}{selectedProduct.subCategory ? ` › ${selectedProduct.subCategory}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Selling Price</p>
                      <p className="text-sm font-bold text-gray-900">{formatINR(selectedProduct.price)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">MRP</p>
                      <p className="text-sm text-gray-600">
                        {selectedProduct.originalPrice ? formatINR(selectedProduct.originalPrice) : '—'}
                        {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                          <span className="ml-1.5 text-[10px] text-green-600 font-semibold">
                            {Math.round((1 - selectedProduct.price / selectedProduct.originalPrice) * 100)}% off
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Stock</p>
                      <p className={`text-xs font-semibold ${selectedProduct.stockQuantity === 0 ? 'text-red-600' : selectedProduct.stockQuantity <= 10 ? 'text-amber-600' : 'text-gray-800'}`}>
                        {selectedProduct.stockQuantity ?? 0} units
                        {selectedProduct.stockQuantity === 0 && ' · Out of Stock'}
                        {selectedProduct.stockQuantity > 0 && selectedProduct.stockQuantity <= 10 && ' · Low Stock'}
                      </p>
                    </div>
                    {selectedProduct.fabric && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Fabric</p>
                        <p className="text-xs text-gray-700">{selectedProduct.fabric}</p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Description</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{selectedProduct.description}</p>
                    </div>
                  )}

                  {/* Sizes */}
                  {selectedProduct.sizes?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Sizes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.sizes.map((s: string) => (
                          <span key={s} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colors */}
                  {selectedProduct.colors?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Colors</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.colors.map((c: any, i: number) => {
                          const name = typeof c === 'string' ? c : c?.name || '';
                          const hex  = typeof c === 'object' ? c?.hex : undefined;
                          return (
                            <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                              {hex && <span className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0" style={{ background: hex }} />}
                              <span className="text-xs text-gray-700">{name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {selectedProduct.rejectionReason && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-[10px] text-red-500 uppercase tracking-wide mb-0.5">Rejection Reason</p>
                      <p className="text-xs text-red-700">{selectedProduct.rejectionReason}</p>
                    </div>
                  )}

                  {/* Seller info */}
                  {selectedProduct.seller && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Seller</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedProduct.seller.businessName || '—'}</p>
                      {(selectedProduct.seller.city || selectedProduct.seller.state) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[selectedProduct.seller.city, selectedProduct.seller.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {selectedProduct.seller.businessPhone && (
                        <p className="text-xs text-gray-400 mt-0.5">{selectedProduct.seller.businessPhone}</p>
                      )}
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Created</p>
                      <p className="text-xs text-gray-500">
                        {selectedProduct.createdAt
                          ? new Date(selectedProduct.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Seller ID</p>
                      <p className="text-xs font-mono text-gray-400">{selectedProduct.sellerId || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Product Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">{t('cat.addProduct')}</h3>
                  <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <input
                  placeholder="Product Name *"
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20"
                />
                <select
                  value={newProductCategory}
                  onChange={e => setNewProductCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20">
                  {liveCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>

                {/* GST auto-calculator */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">MRP (₹) *</label>
                    <input type="number" value={mrp} onChange={e => setMrp(e.target.value)} placeholder="999"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">GST Slab</label>
                    <select value={gstSlab} onChange={e => setGstSlab(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20">
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Selling Price</label>
                    <div className="px-3 py-2 bg-[#F5EDF2] border border-[#E8E0E4] rounded-lg text-sm font-semibold text-[#5B1A3A]">
                      ₹{sellingPrice}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">GST: ₹{gstAmount} ({gstSlab}%)</p>
                <p className="text-[10px] text-blue-500">Admin-created products go live immediately — no QC queue.</p>

                <button
                  className="w-full py-2.5 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
                  onClick={handleAddProduct}
                  disabled={saving}>
                  {saving ? 'Adding…' : t('cat.addProduct')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {catTab === 'bulk' && <BulkUploadPanel />}
    </div>
  );
}

// ─── Module 4: Payments ─────────────────────────────────────────────────────

function PaymentsPage() {
  const { t } = useAdminLang();
  const [loading, setLoading] = useState(true);
  const [payTab, setPayTab] = useState<'settlements' | 'gst' | 'reconciliation'>('settlements');

  useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

  const totalCollected = MOCK_PAYMENTS.reduce((s, p) => s + p.amount, 0);
  const gstCollected = Math.round(totalCollected * 0.05);
  const pendingAmount = MOCK_PAYMENTS.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  if (loading) return <div className="space-y-4"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}</div><TableSkeleton /></div>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('pay.title')}</h2>

      {/* 0% commission banner */}
      <div className="mb-4 p-4 bg-gradient-to-r from-[#F5EDF2] to-[#FAF7F8] border border-[#E8E0E4] rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#F5EDF2] flex items-center justify-center text-[#5B1A3A] font-bold text-lg">₹0</div>
        <div>
          <p className="text-sm font-semibold text-[#3D0E2A]">{t('dash.commission')}</p>
          <p className="text-xs text-[#5B1A3A]">{t('dash.commissionDesc')}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard title={t('pay.totalCollected')} value={formatINR(totalCollected)} icon={<IndianRupee size={20} />} color="#C49A3C" />
        <StatCard title={t('pay.sellerPayouts')} value={formatINR(totalCollected)} icon={<Users size={20} />} color="#5B1A3A" />
        <StatCard title="GST Collected" value={formatINR(gstCollected)} icon={<ClipboardCheck size={20} />} color="#6366f1" />
        <StatCard title={t('pay.pendingSettlement')} value={formatINR(pendingAmount)} icon={<Clock size={20} />} color="#f59e0b" />
      </div>

      {/* Sub-tabs: Settlements | GST Export | Reconciliation */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['settlements', 'gst', 'reconciliation'] as const).map(tab => (
          <button key={tab} onClick={() => setPayTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${payTab === tab ? 'bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab === 'settlements' ? t('pay.settlements') :
             tab === 'gst' ? t('pay.gstExport') : t('pay.reconciliation')}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {payTab === 'settlements' && (
        <>
          {/* Settlement table */}
          <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAF7F8] border-b border-[rgba(196,154,60,0.06)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.date')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.orderId')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Seller</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Gross</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.commission')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Net</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.status')}</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PAYMENTS.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.order_id}</td>
                    <td className="px-4 py-3 text-gray-600">{p.seller_name}</td>
                    <td className="px-4 py-3 font-semibold">{formatINR(p.amount)}</td>
                    <td className="px-4 py-3 text-[#C49A3C] font-medium">₹0</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatINR(p.seller_payout)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium
                        ${p.status === 'settled' ? 'bg-green-100 text-green-700' :
                          p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-600'}`}>
                        {t(`pay.${p.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <button className="px-4 py-2 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
              onClick={() => toast.success('Razorpay payout initiated (sandbox)')}>
              Razorpay Payout (Sandbox)
            </button>
            <button className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
              onClick={() => toast('Dispute ticket opened', { icon: '📝' })}>
              Raise Dispute
            </button>
          </div>
        </>
      )}

      {payTab === 'gst' && <GSTExportPanel />}

      {payTab === 'reconciliation' && (
        <ReconciliationTable
          onRaiseDispute={(stl) => {
            toast.success(`Dispute raised for ${stl.order_id} — shortfall ${formatINR(stl.difference)}`);
          }}
        />
      )}
    </div>
  );
}

// ─── Module 5: Analytics ────────────────────────────────────────────────────

function AnalyticsPage() {
  const { t } = useAdminLang();
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

  const RETURN_COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#8b5cf6', '#64748b'];

  if (loading) return <div className="space-y-6"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><ChartSkeleton /><ChartSkeleton /></div><TableSkeleton /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{t('analytics.title')}</h2>
        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${period === p ? 'bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t(`analytics.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue trend line chart */}
      <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('analytics.revenue')}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_REVENUE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#C49A3C" strokeWidth={2} dot={{ fill: '#C49A3C', r: 4 }} />
              <Line type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category horizontal bar chart */}
        <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('analytics.categoryWise')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_ANALYTICS.topCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={90} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#C49A3C" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Returns donut chart */}
        <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Returns Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={MOCK_ANALYTICS.returnReasons} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                  paddingAngle={3} dataKey="count" nameKey="reason">
                  {MOCK_ANALYTICS.returnReasons.map((_, i) => <Cell key={i} fill={RETURN_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Delivery zone table */}
      <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('delivery.title')}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Pincode</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">District</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">{t('analytics.orders')}</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Avg Delivery</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">{t('orders.status')}</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ANALYTICS.deliveryZones.map(z => (
              <tr key={z.pincode} className="border-b border-gray-50">
                <td className="px-3 py-2 font-medium">{z.pincode}</td>
                <td className="px-3 py-2 text-gray-600">{z.district}</td>
                <td className="px-3 py-2">{z.orders}</td>
                <td className="px-3 py-2">{z.avgDeliveryHrs}h</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                    ${z.avgDeliveryHrs <= 8 ? 'bg-green-100 text-green-700' :
                      z.avgDeliveryHrs <= 16 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-600'}`}>
                    {z.avgDeliveryHrs <= 8 ? 'Fast' : z.avgDeliveryHrs <= 16 ? 'Slow' : 'Very Slow'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Module 6: Support ──────────────────────────────────────────────────────

function SupportPage() {
  const { t } = useAdminLang();
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

  const getSLAProgress = (createdAt: string) => {
    const hoursElapsed = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return Math.min(100, (hoursElapsed / 24) * 100);
  };

  if (loading) return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><CardSkeleton /><div className="lg:col-span-2"><TableSkeleton /></div></div>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('support.title')}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Raise ticket form */}
        <div>
          <SupportTicketWidget />
        </div>

        {/* Ticket list with SLA */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('support.ticketList')}</h3>
            <div className="space-y-3">
              {MOCK_TICKETS.map(ticket => {
                const slaPercent = getSLAProgress(ticket.created_at);
                const slaColor = slaPercent >= 80 ? '#ef4444' : slaPercent >= 50 ? '#f59e0b' : '#22c55e';
                return (
                  <div key={ticket.id} className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0
                          ${ticket.priority === 'high' ? 'bg-red-500' :
                            ticket.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                        <p className="text-sm font-medium text-gray-800">{ticket.subject}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                        ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                          ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'}`}>
                        {ticket.status === 'in_progress' ? t('support.inProgress') :
                         ticket.status === 'open' ? t('support.open') : t('support.resolved')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{ticket.id} · {ticket.category} · {ticket.user_name}</p>

                    {/* SLA progress bar */}
                    {ticket.status !== 'resolved' && (
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-gray-400" />
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${slaPercent}%`, backgroundColor: slaColor }} />
                        </div>
                        <span className="text-[10px] font-medium" style={{ color: slaColor }}>
                          {Math.round(24 - (slaPercent / 100 * 24))}h left
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Module 7: Growth ───────────────────────────────────────────────────────

function GrowthPage() {
  const { t, lang } = useAdminLang();
  const [newPincode, setNewPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<{ valid: boolean; district?: string; state?: string } | null>(null);
  const [discount, setDiscount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

  const validatePincode = async () => {
    if (!/^\d{6}$/.test(newPincode)) { toast.error('Enter valid 6-digit pincode'); return; }
    try {
      const res = await fetch(`/api/admin/pincode?code=${newPincode}`);
      const data = await res.json();
      setPincodeResult(data);
      if (data.valid) toast.success(`${data.district}, ${data.state} — valid!`);
      else toast.error('Invalid pincode');
    } catch { toast.error('Failed to validate pincode'); }
  };

  if (loading) return <div className="space-y-6"><CardSkeleton /><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><CardSkeleton /><CardSkeleton /></div></div>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('growth.title')}</h2>

      {/* Countdown banner */}
      <div className="mb-6 p-5 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] rounded-xl text-white">
        <p className="text-xs font-medium opacity-80 uppercase tracking-wide">{t('growth.countdown')}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-4xl font-bold">14</span>
          <span className="text-lg">{t('growth.daysLeft')}</span>
        </div>
        <p className="text-sm mt-2 opacity-90">Stock up on sarees, ethnic wear & festive collections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <GrowthSuggestions />
        <WhatsAppNotifPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seasonal Offers */}
        <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Seasonal Offers</h3>
          <div className="space-y-3">
            <input type="number" placeholder="Discount %" value={discount} onChange={e => setDiscount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20" />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20" />
              <input type="date" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20" />
            </div>
            <button className="w-full py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
              onClick={() => toast.success(`${discount}% discount offer created!`)}>
              Create Offer
            </button>
          </div>
        </div>

        {/* Pincode expansion */}
        <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Pincode Expansion</h3>
          <div className="flex gap-2 mb-3">
            <input placeholder="Enter 6-digit pincode" value={newPincode} onChange={e => setNewPincode(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20" />
            <button onClick={validatePincode}
              className="px-4 py-2 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
              <Search size={14} className="inline mr-1" />Validate
            </button>
          </div>
          {pincodeResult && (
            <div className={`p-3 rounded-lg text-sm ${pincodeResult.valid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {pincodeResult.valid ? (
                <div className="flex items-center justify-between">
                  <div>
                    <CheckCircle size={14} className="inline mr-1" />
                    {pincodeResult.district}, {pincodeResult.state}
                  </div>
                  <button className="px-3 py-1 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-md text-xs font-medium"
                    onClick={() => { toast.success('Zone added!'); setPincodeResult(null); setNewPincode(''); }}>
                    Add Zone
                  </button>
                </div>
              ) : 'Invalid pincode — not found in India Post database'}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">Validates via India Post API. New zones appear in Delivery Intelligence.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Module 8: Settings ─────────────────────────────────────────────────────

function SettingsPage() {
  const { t, lang } = useAdminLang();
  const [gstin, setGstin] = useState('');
  const [gstVerified, setGstVerified] = useState<boolean | null>(null);
  const [gstBusiness, setGstBusiness] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [notifPrefs, setNotifPrefs] = useState({ wa: true, sms: false, email: true });

  const verifyGST = async () => {
    if (!gstin) { toast.error('Enter GSTIN'); return; }
    try {
      const res = await fetch(`/api/admin/gst?gstin=${gstin}`);
      const data = await res.json();
      setGstVerified(data.verified);
      setGstBusiness(data.businessName || '');
      if (data.verified) toast.success(`Verified: ${data.businessName}`);
      else toast.error(data.message || 'GSTIN not verified');
    } catch { toast.error('GST verification failed'); }
  };

  const testWA = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: 'hello_world', recipient: waPhone }),
      });
      const data = await res.json();
      if (data.success) toast.success(data.mock ? 'WA not configured — logged locally' : 'Test message sent!');
      else toast.error('Send failed');
    } catch { toast.error('WhatsApp test failed'); }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-6">{t('settings.title')}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Profile */}
        <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">{t('settings.profile')}</h3>
          <input placeholder="Business Name" defaultValue="Insta Fashion Points"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20" />

          {/* GSTIN with verification */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">GSTIN</label>
            <div className="flex gap-2">
              <input placeholder="22AAAAA0000A1Z5" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20" />
              <button onClick={verifyGST}
                className="px-3 py-2 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-lg text-xs font-medium hover:opacity-90">
                Verify
              </button>
            </div>
            {gstVerified !== null && (
              <div className={`mt-1.5 flex items-center gap-1.5 text-xs ${gstVerified ? 'text-green-600' : 'text-red-500'}`}>
                {gstVerified ? <><Shield size={12} /> Verified: {gstBusiness}</> : 'Not verified'}
              </div>
            )}
          </div>

          <input placeholder="PAN Number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20" />
          <input placeholder="Address" defaultValue="Amas, Gaya, Bihar 824219"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20" />
          <button className="px-4 py-2 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
            onClick={() => toast.success('Profile saved!')}>
            <Save size={14} className="inline mr-1.5" />{t('common.save')}
          </button>
        </div>

        {/* WhatsApp Config */}
        <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">WhatsApp Configuration</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phone Number</label>
            <input placeholder="+91 82941xxxxx" value={waPhone} onChange={e => setWaPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20" />
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-xs text-gray-600">Connection: Not configured</span>
          </div>
          <button onClick={testWA}
            className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            <Send size={14} className="inline mr-1.5" />Send Test Message
          </button>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">{t('settings.notifications')}</h3>
          {[
            { key: 'wa', icon: MessageCircle, label: 'WhatsApp', color: 'text-green-600' },
            { key: 'sms', icon: Smartphone, label: 'SMS (Fast2SMS)', color: 'text-blue-600' },
            { key: 'email', icon: Mail, label: 'Email (Resend)', color: 'text-purple-600' },
          ].map(({ key, icon: Icon, label, color }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon size={16} className={color} />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
              <button
                onClick={() => setNotifPrefs(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                className={`w-10 h-5 rounded-full transition-colors relative
                  ${notifPrefs[key as keyof typeof notifPrefs] ? 'bg-[#C49A3C]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all
                  ${notifPrefs[key as keyof typeof notifPrefs] ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Language preference */}
        <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Language Preference</h3>
          <div className="flex gap-3">
            {[
              { code: 'en', label: 'English', flag: '🇬🇧' },
              { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
            ].map(({ code, label, flag }) => (
              <button key={code}
                className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-all
                  ${lang === code ? 'border-[#C49A3C] bg-[#F5EDF2] text-[#5B1A3A]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <span className="text-lg mr-2">{flag}</span>{label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Module 9: NDR Management ────────────────────────────────────────────────

function NDRPage() {
  const { t, lang } = useAdminLang();
  const [ndrList, setNdrList] = useState<NDRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNDR, setSelectedNDR] = useState<NDRRecord | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/ndr')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setNdrList(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleActionComplete = (ndrId: string, action: string) => {
    setNdrList(prev => prev.map(n => {
      if (n.id !== ndrId) return n;
      if (action === 'rto') return { ...n, status: 'rto_initiated' };
      if (action === 'fake_order') return { ...n, status: 'fake' };
      if (action === 'retry' || action === 'update_address') return { ...n, status: 'retry_scheduled' };
      return n;
    }));
  };

  const filtered = filter === 'all' ? ndrList : ndrList.filter(n => n.status === filter);
  const statusFilters = ['all', 'pending', 'rto_initiated', 'resolved'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'bg-amber-100', text: 'text-amber-700', label: t('ndr.pending') };
      case 'rto_initiated': return { bg: 'bg-red-100', text: 'text-red-600', label: t('ndr.rtoInitiated') };
      case 'resolved': case 'retry_scheduled': return { bg: 'bg-green-100', text: 'text-green-700', label: t('ndr.resolved') };
      case 'fake': return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Fake' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
    }
  };

  if (loading) return <TableSkeleton rows={6} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{t('ndr.title')}</h2>
        <span className="text-xs text-gray-400">{ndrList.filter(n => n.status === 'pending').length} {t('ndr.pending')}</span>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusFilters.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === s ? 'bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? t('orders.all') : s === 'pending' ? t('ndr.pending') : s === 'rto_initiated' ? t('ndr.rtoInitiated') : t('ndr.resolved')}
          </button>
        ))}
      </div>

      {/* NDR Table */}
      <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAF7F8] border-b border-[rgba(196,154,60,0.06)]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('ndr.orderId')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('ndr.customer')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('ndr.mobile')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('ndr.pincode')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('ndr.failureReason')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('ndr.attempts')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('ndr.lastAttempt')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">COD</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.status')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('ndr.action')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-sm">
                    {t('ndr.noRecords')}
                  </td>
                </tr>
              ) : (
                filtered.map(ndr => {
                  const badge = getStatusBadge(ndr.status);
                  return (
                    <tr key={ndr.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{ndr.order_id}</td>
                      <td className="px-4 py-3 text-gray-700">{ndr.customer_name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono">{ndr.mobile}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-800">{ndr.pincode}</div>
                        <div className="text-[10px] text-gray-400">{ndr.district}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-red-600 max-w-[160px]">
                        {lang === 'hi' ? ndr.failure_reason_hi : ndr.failure_reason}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold
                          ${ndr.attempt_count >= 3 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                          {ndr.attempt_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(ndr.last_attempt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        <CODVerificationBadge
                          orderId={ndr.order_id}
                          phone={ndr.mobile}
                          paymentMode={ndr.payment_mode}
                          verified={ndr.cod_verified}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedNDR(ndr)}
                          disabled={ndr.status !== 'pending'}
                          className="px-3 py-1.5 bg-[#F5EDF2] text-[#5B1A3A] rounded-lg text-xs font-medium hover:bg-[#EDE0E8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {t('ndr.action')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NDR Action Modal */}
      {selectedNDR && (
        <NDRActionModal
          ndr={selectedNDR}
          onClose={() => setSelectedNDR(null)}
          onActionComplete={handleActionComplete}
        />
      )}
    </div>
  );
}

// ─── Main Dashboard Shell ───────────────────────────────────────────────────

function DashboardContent() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [ndrCount, setNdrCount] = useState(0);

  // Fetch NDR pending count for sidebar badge
  useEffect(() => {
    fetch('/api/ndr')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setNdrCount(data.filter((n: NDRRecord) => n.status === 'pending').length);
        }
      })
      .catch(() => {});
  }, []);

  // Trigger Redis cache warmup on admin login (fire-and-forget)
  useEffect(() => {
    if (user?.id && user?.isAdmin) {
      fetch('/api/admin/dashboard/warmup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: user.id }),
      }).catch(() => {}); // silent — never block UI
    }
  }, [user?.id, user?.isAdmin]);

  useEffect(() => {
    const checkSidebar = () => {
      if (window.innerWidth < 768) {
        setSidebarWidth(0);
      } else {
        const sidebar = document.querySelector('aside');
        setSidebarWidth(sidebar ? sidebar.offsetWidth : 240);
      }
    };
    checkSidebar();
    window.addEventListener('resize', checkSidebar);

    const observer = new MutationObserver(checkSidebar);
    const sidebar = document.querySelector('aside');
    if (sidebar) observer.observe(sidebar, { attributes: true });

    return () => {
      window.removeEventListener('resize', checkSidebar);
      observer.disconnect();
    };
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'orders': return <OrdersPage />;
      case 'catalogue': return <CataloguePage />;
      case 'payments': return <PaymentsPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'support': return <SupportPage />;
      case 'growth': return <GrowthPage />;
      case 'ndr': return <NDRPage />;
      case 'sellers': return <SellerManagement />;
      case 'users': return <UserManagement />;
      case 'returns': return <ReturnAnalytics />;
      case 'categories': return <CategoryManagement />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F8]">
      <Sidebar activePage={activePage} onNavigate={setActivePage} ndrCount={ndrCount} />
      <TopBar sidebarWidth={sidebarWidth} />
      <main
        className="pt-20 pb-20 md:pb-8 px-4 md:px-6 transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        {renderPage()}
      </main>
    </div>
  );
}

// ─── Page export ────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  return (
    <AdminLanguageProvider>
      <Toaster position="top-right" toastOptions={{
        style: { fontSize: '13px', borderRadius: '10px' },
      }} />
      <DashboardContent />
    </AdminLanguageProvider>
  );
}
