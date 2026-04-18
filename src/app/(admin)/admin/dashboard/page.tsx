'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import {
  ShoppingCart, IndianRupee, Package, Users, TrendingUp,
  RotateCcw, ClipboardCheck, Eye, PackageCheck, Truck, MessageCircle,
  Send, Plus, X, Search, CheckCircle, Upload, Clock, MapPin,
  Shield, Smartphone, Mail, Bell as BellIcon, Globe, Save,
  Printer, FileText, Download, Loader2, AlertTriangle, Filter,
  ChevronRight, RefreshCw, Tag, Flag,
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
  MOCK_PAYMENTS, MOCK_WA_LOGS,
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
    // Products uploaded by sellers store category as UUID; admin/bulk uploads store it as name.
    // Check both so the filter works regardless of which format was used.
    const catId = liveCategories.find(c => c.name === catFilter)?.id;
    const catMatch = catFilter === 'all' || p.category === catFilter || p.category === catId;
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payTab, setPayTab] = useState<'settlements' | 'gst' | 'reconciliation'>('settlements');
  const [earnings, setEarnings] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalGross: 0, totalPending: 0, totalPaid: 0, totalDisputed: 0, count: 0 });
  const [statusFilter, setStatusFilter] = useState('all');

  // Payout modal state
  const [payoutRows, setPayoutRows] = useState<any[]>([]);
  const [utrInput, setUtrInput] = useState('');
  const [payDateInput, setPayDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Dispute modal state
  const [disputeRow, setDisputeRow] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  const fetchSettlements = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/settlements?adminUserId=${user.id}&status=${statusFilter}`);
      const data = await res.json();
      if (res.ok) {
        setEarnings(data.earnings || []);
        setStats(data.stats || { totalGross: 0, totalPending: 0, totalPaid: 0, totalDisputed: 0, count: 0 });
      }
    } catch { /* keep empty */ }
    finally { setLoading(false); }
  }, [user?.id, statusFilter]);

  useEffect(() => { fetchSettlements(); }, [fetchSettlements]);

  const tcsAmount = Math.round(stats.totalGross * 0.01);

  // Drilldown: which stat card is expanded
  type DrilldownType = 'collected' | 'payouts' | 'tcs' | 'pending';
  const [drilldown, setDrilldown] = useState<DrilldownType | null>(null);
  function toggleDrilldown(type: DrilldownType) {
    setDrilldown(prev => prev === type ? null : type);
  }

  // Seller-wise breakdown for whichever card is active
  const drilldownRows = useMemo(() => {
    if (!drilldown) return [];
    const map = new Map<string, { sellerName: string; count: number; amount: number }>();
    const filtered = drilldown === 'payouts'
      ? earnings.filter(e => ['paid', 'settled'].includes(e.payment_status || ''))
      : drilldown === 'pending'
        ? earnings.filter(e => e.payment_status === 'pending')
        : earnings; // collected + tcs use all rows
    filtered.forEach(e => {
      const key = e.seller_id || 'unknown';
      const row = map.get(key) ?? { sellerName: e.seller_name || '—', count: 0, amount: 0 };
      row.count += 1;
      row.amount += drilldown === 'collected'
        ? Number(e.total_item_price || 0)
        : drilldown === 'tcs'
          ? Number(e.total_item_price || 0) * 0.01
          : Number(e.seller_earning || 0);
      map.set(key, row);
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [drilldown, earnings]);

  async function handlePayout() {
    if (!utrInput.trim()) { toast.error('UTR number is required'); return; }
    if (!user?.id) return;
    setPayoutLoading(true);
    try {
      const res = await fetch('/api/admin/payments/settlements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user.id,
          earningIds: payoutRows.map(r => r.id),
          action: 'pay',
          utr: utrInput.trim(),
          paymentDate: payDateInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`${data.updated} earning(s) marked as paid (UTR: ${utrInput.trim()})`);
      setPayoutRows([]);
      setUtrInput('');
      fetchSettlements();
    } catch (err: any) {
      toast.error(err.message || 'Payout failed');
    } finally { setPayoutLoading(false); }
  }

  async function handleDispute() {
    if (!disputeRow || !disputeReason.trim()) { toast.error('Reason is required'); return; }
    if (!user?.id) return;
    setDisputeLoading(true);
    try {
      const res = await fetch('/api/admin/payments/settlements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user.id,
          earningIds: [disputeRow.id],
          action: 'dispute',
          reason: disputeReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Dispute raised — earning flagged for review');
      setDisputeRow(null);
      setDisputeReason('');
      fetchSettlements();
    } catch (err: any) {
      toast.error(err.message || 'Failed to raise dispute');
    } finally { setDisputeLoading(false); }
  }

  const statusBadge = (s: string) => {
    if (s === 'paid' || s === 'settled') return 'bg-green-100 text-green-700';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (s === 'disputed') return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-500';
  };

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

      {/* Stats row — real DB data, each card is clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
        <StatCard
          title={t('pay.totalCollected')}
          value={formatINR(stats.totalGross)}
          icon={<IndianRupee size={20} />}
          color="#C49A3C"
          onClick={() => toggleDrilldown('collected')}
          active={drilldown === 'collected'}
        />
        <StatCard
          title={t('pay.sellerPayouts')}
          value={formatINR(stats.totalPaid)}
          icon={<Users size={20} />}
          color="#5B1A3A"
          onClick={() => toggleDrilldown('payouts')}
          active={drilldown === 'payouts'}
        />
        <StatCard
          title="TCS (1%)"
          value={formatINR(tcsAmount)}
          icon={<ClipboardCheck size={20} />}
          color="#6366f1"
          onClick={() => toggleDrilldown('tcs')}
          active={drilldown === 'tcs'}
        />
        <StatCard
          title={t('pay.pendingSettlement')}
          value={formatINR(stats.totalPending)}
          icon={<Clock size={20} />}
          color="#f59e0b"
          onClick={() => toggleDrilldown('pending')}
          active={drilldown === 'pending'}
        />
      </div>

      {/* Drilldown panel — shown below cards when one is active */}
      {drilldown && (
        <div className="mb-4 bg-white rounded-xl border border-[rgba(196,154,60,0.12)] overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {drilldown === 'collected' && 'Total Collected — Seller Breakdown'}
                {drilldown === 'payouts' && 'Seller Payouts — Paid Settlements'}
                {drilldown === 'tcs' && 'TCS (1%) — Seller-wise Breakdown'}
                {drilldown === 'pending' && 'Pending Settlement — Seller Breakdown'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {drilldown === 'tcs'
                  ? `Total TCS to deposit to govt: ${formatINR(tcsAmount)} — file via GSTR-8`
                  : `${drilldownRows.length} seller(s)`}
              </p>
            </div>
            <button onClick={() => setDrilldown(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={16} />
            </button>
          </div>
          {drilldownRows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No data for this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Seller</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {drilldown === 'tcs' ? 'Gross Sales' : 'Items'}
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {drilldown === 'collected' ? 'Amount Collected'
                        : drilldown === 'payouts' ? 'Amount Paid'
                        : drilldown === 'tcs' ? 'TCS (1%)'
                        : 'Pending Amount'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drilldownRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{row.sellerName}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">
                        {drilldown === 'tcs'
                          ? formatINR(row.amount / 0.01)
                          : row.count}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{formatINR(Math.round(row.amount))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-2.5" />
                    <td className="px-4 py-2.5 text-right text-sm font-bold text-gray-800">
                      {formatINR(Math.round(drilldownRows.reduce((s, r) => s + r.amount, 0)))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-tabs */}
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

      {/* ── Settlements tab ── */}
      {payTab === 'settlements' && (
        <>
          {/* Status filter + payout action */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {['all', 'pending', 'paid', 'disputed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                  ${statusFilter === s
                    ? s === 'pending' ? 'bg-amber-500 text-white border-amber-500'
                    : s === 'paid' ? 'bg-green-600 text-white border-green-600'
                    : s === 'disputed' ? 'bg-red-500 text-white border-red-500'
                    : 'bg-gray-700 text-white border-gray-700'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400">{earnings.length} records</span>
            {payoutRows.length > 0 && (
              <button
                onClick={() => { setUtrInput(''); setPayDateInput(new Date().toISOString().split('T')[0]); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-lg text-xs font-medium hover:opacity-90 transition-colors">
                <Send size={13} />
                Record Payout ({payoutRows.length} selected)
              </button>
            )}
          </div>

          {/* Payout info banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-3 text-[11px] text-blue-700">
            <IndianRupee size={13} className="mt-0.5 flex-shrink-0" />
            <span>
              <strong>How to pay:</strong> Transfer the net amount to the seller&apos;s bank account via NEFT/IMPS/UPI.
              Then select the rows and click &quot;Record Payout&quot; to enter the UTR and mark them as paid.
            </span>
          </div>

          {/* Settlement table */}
          {earnings.length === 0 ? (
            <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-12 text-center">
              <IndianRupee size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No settlement records found</p>
            </div>
          ) : (
            <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#FAF7F8] border-b border-[rgba(196,154,60,0.06)]">
                      <th className="px-3 py-3 w-8">
                        <input type="checkbox"
                          checked={payoutRows.length === earnings.filter(e => e.payment_status === 'pending').length && earnings.some(e => e.payment_status === 'pending')}
                          onChange={e => setPayoutRows(e.target.checked ? earnings.filter(r => r.payment_status === 'pending') : [])}
                          className="accent-[#5B1A3A]" />
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.date')}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Seller</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Gross</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Commission</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Net Payout</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">UTR</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.status')}</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map(e => {
                      const isSelected = payoutRows.some(r => r.id === e.id);
                      return (
                        <tr key={e.id}
                          className={`border-b border-gray-50 transition-colors ${isSelected ? 'bg-[#F5EDF2]' : 'hover:bg-gray-50/50'}`}>
                          <td className="px-3 py-3">
                            {e.payment_status === 'pending' && (
                              <input type="checkbox" checked={isSelected}
                                onChange={ev => setPayoutRows(prev => ev.target.checked ? [...prev, e] : prev.filter(r => r.id !== e.id))}
                                className="accent-[#5B1A3A]" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {e.order_date ? new Date(e.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800 text-xs">{e.order_number || e.order_id?.slice(0, 8) || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{e.seller_name}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{e.item_name || '—'}</td>
                          <td className="px-4 py-3 text-right font-semibold text-xs">{formatINR(Number(e.total_item_price))}</td>
                          <td className="px-4 py-3 text-right text-[#C49A3C] text-xs">{formatINR(Number(e.commission_amount || 0))}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900 text-xs">{formatINR(Number(e.seller_earning))}</td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-400">
                            {e.payment_reference || <span className="text-gray-200">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge(e.payment_status)}`}>
                              {e.payment_status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {e.payment_status === 'pending' && (
                              <button
                                onClick={() => { setDisputeRow(e); setDisputeReason(''); }}
                                className="text-[10px] font-medium text-amber-600 hover:text-amber-800 whitespace-nowrap">
                                Raise Dispute
                              </button>
                            )}
                            {e.payment_status === 'disputed' && e.payment_notes && (
                              <span className="text-[10px] text-red-400 max-w-[120px] truncate block" title={e.payment_notes}>
                                {e.payment_notes}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Payout Modal ── */}
          {payoutRows.length > 0 && utrInput !== undefined && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
              onClick={() => setPayoutRows([])}>
              <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800">Record Manual Payout</h3>
                  <button onClick={() => setPayoutRows([])} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
                  <p><strong>{payoutRows.length}</strong> earning record(s) selected</p>
                  <p>Total net payout: <strong className="text-gray-900">{formatINR(payoutRows.reduce((s, r) => s + Number(r.seller_earning || 0), 0))}</strong></p>
                  <p className="text-gray-400 mt-1">Sellers: {[...new Set(payoutRows.map(r => r.seller_name))].join(', ')}</p>
                </div>

                {/* Bank details for single seller */}
                {[...new Set(payoutRows.map(r => r.seller_id))].length === 1 && payoutRows[0].bank_account_number && (
                  <div className="p-3 bg-[#F5EDF2] rounded-lg text-xs space-y-0.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Seller Bank Details</p>
                    <p className="font-medium text-gray-800">{payoutRows[0].bank_account_name || '—'}</p>
                    <p className="font-mono text-gray-700">{payoutRows[0].bank_account_number}</p>
                    <p className="text-gray-500">IFSC: {payoutRows[0].bank_ifsc || '—'}</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">UTR / Reference Number <span className="text-red-500">*</span></label>
                  <input value={utrInput} onChange={e => setUtrInput(e.target.value)}
                    placeholder="e.g. UTIBR2026041800001"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Payment Date</label>
                  <input type="date" value={payDateInput} onChange={e => setPayDateInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20" />
                </div>
                <button onClick={handlePayout} disabled={payoutLoading || !utrInput.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {payoutLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Confirm & Mark as Paid
                </button>
              </div>
            </div>
          )}

          {/* ── Dispute Modal ── */}
          {disputeRow && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
              onClick={() => setDisputeRow(null)}>
              <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800">Raise Dispute</h3>
                  <button onClick={() => setDisputeRow(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs space-y-0.5">
                  <p className="font-medium text-gray-800">{disputeRow.seller_name}</p>
                  <p className="text-gray-500">Order: {disputeRow.order_number || disputeRow.order_id?.slice(0, 8)}</p>
                  <p className="text-gray-500">Amount: <strong>{formatINR(Number(disputeRow.seller_earning))}</strong></p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Dispute Reason <span className="text-red-500">*</span></label>
                  <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} rows={3}
                    placeholder="e.g. COD collected by delivery partner but not remitted, amount mismatch…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 resize-none" />
                </div>
                <button onClick={handleDispute} disabled={disputeLoading || !disputeReason.trim()}
                  className="w-full py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {disputeLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                  Flag as Disputed
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {payTab === 'gst' && <GSTExportPanel earnings={earnings} />}

      {payTab === 'reconciliation' && (
        <ReconciliationTable
          earnings={earnings}
          adminUserId={user?.id}
          onRefresh={fetchSettlements}
        />
      )}
    </div>
  );
}

// ─── Module 5: Analytics ────────────────────────────────────────────────────

function AnalyticsPage() {
  const { t } = useAdminLang();
  const { user } = useAuth();
  const [period, setPeriod] = useState('week');

  // Revenue chart — real data
  const [revenueData, setRevenueData]       = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [revenueSummary, setRevenueSummary] = useState({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 });
  const [revenueLoading, setRevenueLoading] = useState(true);

  const fetchRevenue = useCallback(async (p: string) => {
    if (!user?.id) return;
    setRevenueLoading(true);
    try {
      const res  = await fetch(`/api/admin/analytics/revenue?adminUserId=${user.id}&period=${p}`);
      const data = await res.json();
      if (res.ok) {
        setRevenueData(data.data || []);
        setRevenueSummary(data.summary || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 });
      }
    } catch { /* keep empty */ }
    finally { setRevenueLoading(false); }
  }, [user?.id]);

  // Overview charts — category revenue, order status, delivery zones
  const [categoryRevenue, setCategoryRevenue] = useState<{ name: string; revenue: number; units: number }[]>([]);
  const [orderStatus,     setOrderStatus]     = useState<{ status: string; count: number; fill: string }[]>([]);
  const [deliveryZones,   setDeliveryZones]   = useState<{ pincode: string; city: string; orders: number; revenue: number; avgOrderValue: number }[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const fetchOverview = useCallback(async (p: string) => {
    if (!user?.id) return;
    setOverviewLoading(true);
    try {
      const res  = await fetch(`/api/admin/analytics/overview?adminUserId=${user.id}&period=${p}`);
      const data = await res.json();
      if (res.ok) {
        setCategoryRevenue(data.categoryRevenue || []);
        setOrderStatus(data.orderStatus || []);
        setDeliveryZones(data.deliveryZones || []);
      }
    } catch { /* keep empty */ }
    finally { setOverviewLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    fetchRevenue(period);
    fetchOverview(period);
  }, [fetchRevenue, fetchOverview, period]);

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

      {/* Revenue trend — real DB data */}
      <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5 mb-6">
        {/* Header with summary stats */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{t('analytics.revenue')}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {period === 'week' ? 'Last 7 days (daily)' : period === 'month' ? 'Last 30 days (daily)' : 'Last 13 weeks (weekly)'}
            </p>
          </div>
          <div className="flex gap-5">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Revenue</p>
              <p className="text-base font-bold text-gray-800">{revenueLoading ? '—' : formatINR(revenueSummary.totalRevenue)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Orders</p>
              <p className="text-base font-bold text-gray-800">{revenueLoading ? '—' : revenueSummary.totalOrders}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Avg Order</p>
              <p className="text-base font-bold text-gray-800">{revenueLoading ? '—' : formatINR(revenueSummary.avgOrderValue)}</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        {revenueLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        ) : revenueData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <p className="text-sm">No orders found for this period</p>
            <p className="text-xs mt-1">Orders will appear here once customers place them</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  interval={period === 'month' ? 4 : 0}
                />
                <YAxis
                  yAxisId="revenue"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                  width={52}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(v: number, name: string) =>
                    name === 'revenue'
                      ? [`₹${v.toLocaleString('en-IN')}`, 'Revenue']
                      : [v, 'Orders']
                  }
                />
                <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#C49A3C" strokeWidth={2.5} dot={{ fill: '#C49A3C', r: 3 }} activeDot={{ r: 5 }} name="revenue" />
                <Line yAxisId="orders"  type="monotone" dataKey="orders"  stroke="#5B1A3A" strokeWidth={2}   dot={{ fill: '#5B1A3A', r: 3 }} activeDot={{ r: 5 }} name="orders"  strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        {!revenueLoading && revenueData.length > 0 && (
          <div className="flex items-center gap-5 mt-3 justify-end">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-6 h-0.5 bg-[#C49A3C] rounded inline-block" /> Revenue (left axis)
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-6 h-0.5 bg-[#5B1A3A] rounded inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#5B1A3A 0,#5B1A3A 4px,transparent 4px,transparent 6px)' }} /> Orders (right axis)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Revenue — horizontal bar chart */}
        <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">{t('analytics.categoryWise')}</h3>
            {!overviewLoading && categoryRevenue.length > 0 && (
              <span className="text-[10px] text-gray-400">{categoryRevenue.length} categor{categoryRevenue.length === 1 ? 'y' : 'ies'}</span>
            )}
          </div>
          {overviewLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 size={22} className="animate-spin text-gray-300" />
            </div>
          ) : categoryRevenue.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">No sales data for this period</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryRevenue} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={95} />
                  <Tooltip formatter={(v: number, name: string) =>
                    name === 'revenue' ? [`₹${v.toLocaleString('en-IN')}`, 'Revenue'] : [v, 'Units sold']
                  } />
                  <Bar dataKey="revenue" fill="#C49A3C" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Order Status Breakdown — donut chart */}
        <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Order Status Breakdown</h3>
            {!overviewLoading && orderStatus.length > 0 && (
              <span className="text-[10px] text-gray-400">
                {orderStatus.reduce((s, r) => s + r.count, 0)} total orders
              </span>
            )}
          </div>
          {overviewLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 size={22} className="animate-spin text-gray-300" />
            </div>
          ) : orderStatus.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">No orders for this period</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatus}
                    cx="50%" cy="45%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                  >
                    {orderStatus.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [v, name]} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Zones — real data table */}
      <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{t('delivery.title')}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Top delivery zones by order volume</p>
          </div>
          {!overviewLoading && deliveryZones.length > 0 && (
            <span className="text-[10px] text-gray-400">{deliveryZones.length} zone(s)</span>
          )}
        </div>
        {overviewLoading ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : deliveryZones.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No delivery data for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Pincode</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">City</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Orders</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {deliveryZones.map((z, i) => (
                  <tr key={z.pincode} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono font-medium text-gray-800">{z.pincode}</td>
                    <td className="px-3 py-2.5 text-gray-600">{z.city}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-800">{z.orders}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-800">{formatINR(z.revenue)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500">{formatINR(z.avgOrderValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Module 6: Support ──────────────────────────────────────────────────────

// ─── Support: shared types ───────────────────────────────────────────────────

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  raised_by_type: string;
  raised_by_name: string;
  related_order_number: string | null;
  sla_deadline: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  sla_breached?: boolean;
}

interface TicketComment {
  id: string;
  ticket_id: string;
  author_type: string;
  author_name: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

// ─── Support: colour / label helpers ────────────────────────────────────────

const STATUS_META: Record<string, { label: string; cls: string }> = {
  open:              { label: 'Open',            cls: 'bg-blue-100 text-blue-700' },
  in_progress:       { label: 'In Progress',     cls: 'bg-yellow-100 text-yellow-700' },
  waiting_on_seller: { label: 'Waiting Seller',  cls: 'bg-purple-100 text-purple-700' },
  resolved:          { label: 'Resolved',         cls: 'bg-green-100 text-green-700' },
  closed:            { label: 'Closed',           cls: 'bg-gray-100 text-gray-600' },
};

const PRIORITY_META: Record<string, { dot: string; label: string }> = {
  low:      { dot: 'bg-gray-400',   label: 'Low' },
  medium:   { dot: 'bg-yellow-500', label: 'Medium' },
  high:     { dot: 'bg-red-500',    label: 'High' },
  critical: { dot: 'bg-red-700',    label: 'Critical' },
};

function slaProgressFn(createdAt: string, deadline: string) {
  const total   = new Date(deadline).getTime() - new Date(createdAt).getTime();
  const elapsed = Date.now()                   - new Date(createdAt).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function slaTimeLabelFn(deadline: string) {
  const diffMs  = new Date(deadline).getTime() - Date.now();
  const diffHrs = Math.abs(diffMs) / (1000 * 60 * 60);
  if (diffMs >= 0) return diffHrs < 1 ? `${Math.round(diffHrs * 60)}m left` : `${Math.round(diffHrs)}h left`;
  return diffHrs < 24 ? `${Math.round(diffHrs)}h overdue` : `${Math.round(diffHrs / 24)}d overdue`;
}

// ─── Support: ticket detail / comment modal ──────────────────────────────────

function TicketDetailModal({
  ticket, adminUserId, adminName, onClose, onRefresh,
}: {
  ticket: SupportTicket;
  adminUserId: string;
  adminName: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [comments, setComments]     = useState<TicketComment[]>([]);
  const [commentsLoading, setCL]    = useState(true);
  const [reply, setReply]           = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending]       = useState(false);
  const [statusChanging, setSC]     = useState(false);

  const fetchComments = useCallback(async () => {
    setCL(true);
    try {
      const res  = await fetch(`/api/admin/support/tickets/${ticket.id}/comments?adminUserId=${adminUserId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments(data.comments || []);
    } catch { /* silent */ }
    setCL(false);
  }, [ticket.id, adminUserId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, authorName: adminName, message: reply.trim(), isInternal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReply('');
      setComments(prev => [...prev, data.comment]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send');
    }
    setSending(false);
  };

  const changeStatus = async (status: string) => {
    setSC(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Status → ${STATUS_META[status]?.label}`);
      onRefresh();
      // Refresh comments to show system note
      fetchComments();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
    setSC(false);
  };

  const slaP = slaProgressFn(ticket.created_at, ticket.sla_deadline);
  const slaC = ticket.sla_breached ? '#ef4444' : slaP >= 70 ? '#f59e0b' : '#22c55e';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-gray-400">{ticket.ticket_number}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[ticket.status]?.cls}`}>
                {STATUS_META[ticket.status]?.label}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full inline-block ${PRIORITY_META[ticket.priority]?.dot}`} />
                {PRIORITY_META[ticket.priority]?.label}
              </span>
              {ticket.sla_breached && (
                <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertTriangle size={11} /> SLA Breached
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 truncate">{ticket.subject}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {ticket.raised_by_name} · {ticket.category} · {new Date(ticket.created_at).toLocaleDateString()}
              {ticket.related_order_number && ` · Order ${ticket.related_order_number}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* SLA bar */}
        {!['resolved', 'closed'].includes(ticket.status) && (
          <div className="px-5 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <Clock size={11} className="text-gray-400" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${slaP}%`, backgroundColor: slaC }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: slaC }}>
                {slaTimeLabelFn(ticket.sla_deadline)}
              </span>
            </div>
          </div>
        )}

        {/* Status actions */}
        {!['resolved', 'closed'].includes(ticket.status) && (
          <div className="px-5 pt-3 flex flex-wrap gap-2">
            {Object.entries(STATUS_META)
              .filter(([s]) => s !== ticket.status && s !== 'closed')
              .map(([s, meta]) => (
                <button
                  key={s}
                  disabled={statusChanging}
                  onClick={() => changeStatus(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                    ${meta.cls} border-current opacity-80 hover:opacity-100 disabled:opacity-40`}
                >
                  → {meta.label}
                </button>
              ))}
            <button
              disabled={statusChanging}
              onClick={() => changeStatus('closed')}
              className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              Close ticket
            </button>
          </div>
        )}

        {/* Comment thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No comments yet</p>
          ) : comments.map(c => (
            <div
              key={c.id}
              className={`flex gap-2 ${c.author_type === 'system' ? 'justify-center' : ''}`}
            >
              {c.author_type === 'system' ? (
                <span className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                  {c.message}
                </span>
              ) : (
                <div className={`max-w-[80%] ${c.author_type === 'admin' ? 'ml-auto' : ''}`}>
                  <div className={`px-3 py-2 rounded-xl text-sm
                    ${c.is_internal
                      ? 'bg-amber-50 border border-amber-200 text-amber-900'
                      : c.author_type === 'admin'
                        ? 'bg-[#5B1A3A] text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                    {c.message}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 px-1">
                    {c.author_name}
                    {c.is_internal && ' · internal note'}
                    · {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reply box */}
        {!['closed'].includes(ticket.status) && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-start gap-2">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type a reply…"
                rows={2}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 focus:border-[#C49A3C]/40"
              />
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={handleSend}
                  disabled={sending || !reply.trim()}
                  className="p-2.5 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-lg
                    hover:from-[#4A1530] hover:to-[#6A1E45] disabled:opacity-50 transition-colors"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
                <button
                  onClick={() => setIsInternal(p => !p)}
                  title="Toggle internal note"
                  className={`p-2.5 rounded-lg border transition-colors text-xs
                    ${isInternal ? 'bg-amber-100 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                >
                  <Flag size={14} />
                </button>
              </div>
            </div>
            {isInternal && (
              <p className="text-[10px] text-amber-600 mt-1">Internal note — not visible to seller</p>
            )}
            <p className="text-[10px] text-gray-400 mt-1">Ctrl+Enter to send</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Module 6: Support ───────────────────────────────────────────────────────

function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets]         = useState<SupportTicket[]>([]);
  const [stats, setStats]             = useState({ open: 0, inProgress: 0, slaBreached: 0, resolvedToday: 0, total: 0 });
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<SupportTicket | null>(null);
  const [showCreate, setShowCreate]   = useState(false);

  // Filters
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterBy,       setFilterBy]       = useState('all'); // raised_by_type
  const [search,         setSearch]         = useState('');

  const fetchTickets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ adminUserId: user.id });
      if (filterStatus   !== 'all') params.set('status',       filterStatus);
      if (filterCategory !== 'all') params.set('category',     filterCategory);
      if (filterPriority !== 'all') params.set('priority',     filterPriority);
      if (filterBy       !== 'all') params.set('raisedByType', filterBy);

      const res  = await fetch(`/api/admin/support/tickets?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(data.tickets || []);
      setStats(data.stats || { open: 0, inProgress: 0, slaBreached: 0, resolvedToday: 0, total: 0 });
    } catch { /* silent */ }
    setLoading(false);
  }, [user?.id, filterStatus, filterCategory, filterPriority, filterBy]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const displayed = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(t =>
      t.subject.toLowerCase().includes(q) ||
      t.ticket_number.toLowerCase().includes(q) ||
      t.raised_by_name.toLowerCase().includes(q) ||
      (t.related_order_number || '').toLowerCase().includes(q),
    );
  }, [tickets, search]);

  const adminName = user?.email || 'Admin';

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-800">Support Tickets</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchTickets}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowCreate(p => !p)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350]
              text-white rounded-lg text-sm font-medium hover:from-[#4A1530] hover:to-[#6A1E45] transition-colors"
          >
            <Plus size={14} /> New Ticket
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Open',          value: stats.open,          color: '#3b82f6', icon: <MessageCircle size={16} /> },
          { label: 'In Progress',   value: stats.inProgress,    color: '#f59e0b', icon: <Clock size={16} /> },
          { label: 'SLA Breached',  value: stats.slaBreached,   color: '#ef4444', icon: <AlertTriangle size={16} /> },
          { label: 'Resolved Today',value: stats.resolvedToday, color: '#22c55e', icon: <CheckCircle size={16} /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: create + filters */}
        <div className="space-y-4">
          {showCreate && (
            <SupportTicketWidget onTicketCreated={() => { setShowCreate(false); fetchTickets(); }} />
          )}

          {/* Filters */}
          <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
              <Filter size={13} /> Filters
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs
                  focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20"
              />
            </div>
            {[
              { label: 'Status', value: filterStatus, set: setFilterStatus,
                opts: ['all','open','in_progress','waiting_on_seller','resolved','closed'] },
              { label: 'Category', value: filterCategory, set: setFilterCategory,
                opts: ['all','order','payment','product','delivery','seller','other'] },
              { label: 'Priority', value: filterPriority, set: setFilterPriority,
                opts: ['all','low','medium','high','critical'] },
              { label: 'Raised by', value: filterBy, set: setFilterBy,
                opts: ['all','admin','seller'] },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[10px] text-gray-400 uppercase tracking-wide">{f.label}</label>
                <select
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  className="mt-0.5 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white
                    focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20"
                >
                  {f.opts.map(o => (
                    <option key={o} value={o}>
                      {o === 'all' ? 'All' : o.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button
              onClick={() => { setFilterStatus('all'); setFilterCategory('all'); setFilterPriority('all'); setFilterBy('all'); setSearch(''); }}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Right column: ticket list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Tickets
                <span className="ml-2 text-xs font-normal text-gray-400">({displayed.length})</span>
              </h3>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-[88px] bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tickets found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayed.map(ticket => {
                  const slaP = slaProgressFn(ticket.created_at, ticket.sla_deadline);
                  const slaC = ticket.sla_breached ? '#ef4444' : slaP >= 70 ? '#f59e0b' : '#22c55e';
                  const isDone = ['resolved', 'closed'].includes(ticket.status);

                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelected(ticket)}
                      className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-[#C49A3C]/30
                        hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_META[ticket.priority]?.dot}`} />
                          <p className="text-sm font-medium text-gray-800 truncate">{ticket.subject}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_META[ticket.status]?.cls}`}>
                            {STATUS_META[ticket.status]?.label}
                          </span>
                          <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                        <span className="font-mono">{ticket.ticket_number}</span>
                        <span>·</span>
                        <Tag size={10} />
                        <span>{ticket.category}</span>
                        <span>·</span>
                        <span>{ticket.raised_by_name}</span>
                        {ticket.related_order_number && (
                          <>
                            <span>·</span>
                            <span>{ticket.related_order_number}</span>
                          </>
                        )}
                      </div>

                      {!isDone && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${slaP}%`, backgroundColor: slaC }} />
                          </div>
                          <span className="text-[10px] font-medium flex-shrink-0" style={{ color: slaC }}>
                            {ticket.sla_breached
                              ? <span className="flex items-center gap-0.5"><AlertTriangle size={10} /> {slaTimeLabelFn(ticket.sla_deadline)}</span>
                              : slaTimeLabelFn(ticket.sla_deadline)
                            }
                          </span>
                        </div>
                      )}
                      {isDone && ticket.resolved_at && (
                        <p className="text-[11px] text-green-600">
                          Resolved {new Date(ticket.resolved_at).toLocaleDateString()}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selected && user?.id && (
        <TicketDetailModal
          ticket={selected}
          adminUserId={user.id}
          adminName={adminName}
          onClose={() => setSelected(null)}
          onRefresh={() => {
            fetchTickets();
            // Re-fetch the selected ticket so header badges update
            fetch(`/api/admin/support/tickets?adminUserId=${user.id}`)
              .then(r => r.json())
              .then(data => {
                const updated = (data.tickets || []).find((t: SupportTicket) => t.id === selected.id);
                if (updated) setSelected(updated);
              })
              .catch(() => {});
          }}
        />
      )}
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
