'use client';

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  ShoppingCart, IndianRupee, Package, Users, UserCheck,
  ClipboardCheck, TrendingUp, RotateCcw,
} from 'lucide-react';
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
import { formatINR, formatNumber } from '@/lib/admin/constants';
import type { AdminPage, Order, RevenueDataPoint, DashboardStats } from '@/types/admin';

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
  totalOrders: 1247,
  todayOrders: 18,
  totalRevenue: 847500,
  todayRevenue: 12450,
  totalProducts: 342,
  activeProducts: 289,
  pendingApprovals: 7,
  totalSellers: 24,
  activeSellers: 19,
  totalCustomers: 856,
  avgOrderValue: 679,
  returnRate: 3.2,
};

const MOCK_REVENUE: RevenueDataPoint[] = [
  { date: 'Mon', revenue: 12400, orders: 15 },
  { date: 'Tue', revenue: 18200, orders: 22 },
  { date: 'Wed', revenue: 15600, orders: 19 },
  { date: 'Thu', revenue: 21300, orders: 28 },
  { date: 'Fri', revenue: 19800, orders: 25 },
  { date: 'Sat', revenue: 28500, orders: 35 },
  { date: 'Sun', revenue: 16700, orders: 21 },
];

const MOCK_ORDERS: Order[] = [
  { id: '1', order_id: 'IFP-1042', customer_name: 'Priya Kumari', customer_mobile: '+91 82941xxxxx', pincode: '823001', district: 'Gaya', items: [], total: 2450, status: 'confirmed', payment_mode: 'cod', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), distance_km: 0 },
  { id: '2', order_id: 'IFP-1041', customer_name: 'Rahul Singh', customer_mobile: '+91 73215xxxxx', pincode: '824232', district: 'Bodhgaya', items: [], total: 1890, status: 'shipped', payment_mode: 'upi', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString(), distance_km: 15 },
  { id: '3', order_id: 'IFP-1040', customer_name: 'Sunita Devi', customer_mobile: '+91 96342xxxxx', pincode: '824233', district: 'Sherghati', items: [], total: 3200, status: 'pending', payment_mode: 'cod', created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date().toISOString(), distance_km: 35 },
  { id: '4', order_id: 'IFP-1039', customer_name: 'Amit Kumar', customer_mobile: '+91 88214xxxxx', pincode: '805121', district: 'Nawada', items: [], total: 1250, status: 'delivered', payment_mode: 'online', created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date().toISOString(), distance_km: 45 },
  { id: '5', order_id: 'IFP-1038', customer_name: 'Kavita Sharma', customer_mobile: '+91 77825xxxxx', pincode: '824219', district: 'Amas', items: [], total: 4100, status: 'out_for_delivery', payment_mode: 'upi', created_at: new Date(Date.now() - 345600000).toISOString(), updated_at: new Date().toISOString(), distance_km: 12 },
];

// ─── Pages ──────────────────────────────────────────────────────────────────

function OrdersPage() {
  const { t } = useAdminLang();
  const [filter, setFilter] = useState('all');
  const statuses = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];

  const filtered = filter === 'all' ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.status === filter);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('orders.title')}</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === s ? 'bg-[#722F37] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t(`orders.${s}`)}
          </button>
        ))}
      </div>
      <OrdersTable orders={filtered} />
    </div>
  );
}

function CataloguePage() {
  const { t } = useAdminLang();
  const filters = ['all', 'active', 'inactive', 'pendingQC'];
  const [filter, setFilter] = useState('all');

  const MOCK_PRODUCTS = [
    { name: 'Banarasi Silk Saree', category: 'Sarees', price: 2499, status: 'approved', seller: 'Silk House Gaya' },
    { name: 'Cotton Kurta Set', category: "Men's Wear", price: 899, status: 'approved', seller: 'Kumar Textiles' },
    { name: 'Designer Lehenga', category: "Women's Wear", price: 4599, status: 'pending', seller: 'Fashion Hub' },
    { name: 'Kids Party Dress', category: "Kids' Wear", price: 649, status: 'approved', seller: 'Little Stars' },
    { name: 'Embroidered Dupatta', category: 'Accessories', price: 399, status: 'rejected', seller: 'Craft Corner' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{t('cat.title')}</h2>
        <button className="px-4 py-2 bg-[#722F37] text-white rounded-lg text-sm font-medium hover:bg-[#5A252C] transition-colors">
          + {t('cat.addProduct')}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === f ? 'bg-[#722F37] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t(`cat.${f}`)}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('cat.name')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('cat.category')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('cat.price')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('cat.status')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('cat.seller')}</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PRODUCTS.map((p, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.category}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{formatINR(p.price)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium
                    ${p.status === 'approved' ? 'bg-green-100 text-green-700' :
                      p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-600'}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{p.seller}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsPage() {
  const { t } = useAdminLang();

  const MOCK_PAYMENTS = [
    { order_id: 'IFP-1042', amount: 2450, commission: 0, payout: 2450, status: 'settled', date: '21 Mar', seller: 'Silk House' },
    { order_id: 'IFP-1041', amount: 1890, commission: 0, payout: 1890, status: 'settled', date: '20 Mar', seller: 'Kumar Textiles' },
    { order_id: 'IFP-1040', amount: 3200, commission: 0, payout: 3200, status: 'pending', date: '19 Mar', seller: 'Fashion Hub' },
    { order_id: 'IFP-1039', amount: 1250, commission: 0, payout: 1250, status: 'settled', date: '18 Mar', seller: 'Little Stars' },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('pay.title')}</h2>

      {/* Zero commission banner */}
      <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg">₹0</div>
        <div>
          <p className="text-sm font-semibold text-green-800">{t('dash.commission')}</p>
          <p className="text-xs text-green-600">{t('dash.commissionDesc')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard title={t('pay.totalCollected')} value={formatINR(847500)} icon={<IndianRupee size={20} />} color="#722F37" />
        <StatCard title={t('pay.sellerPayouts')} value={formatINR(847500)} icon={<Users size={20} />} color="#059669" />
        <StatCard title={t('pay.platformCommission')} value="₹0" icon={<TrendingUp size={20} />} color="#2563eb" />
        <StatCard title={t('pay.pendingSettlement')} value={formatINR(3200)} icon={<ClipboardCheck size={20} />} color="#f59e0b" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.orderId')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('cat.seller')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.amount')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.commission')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.payout')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.status')}</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PAYMENTS.map((p, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.order_id}</td>
                <td className="px-4 py-3 text-gray-600">{p.seller}</td>
                <td className="px-4 py-3 font-semibold">{formatINR(p.amount)}</td>
                <td className="px-4 py-3 text-green-600 font-medium">₹0</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{formatINR(p.payout)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium
                    ${p.status === 'settled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {t(`pay.${p.status}`)}
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

function AnalyticsPage() {
  const { t } = useAdminLang();
  const [period, setPeriod] = useState('week');

  const topProducts = [
    { name: 'Banarasi Silk Saree', sold: 45, revenue: 112455 },
    { name: 'Cotton Kurta Set', sold: 38, revenue: 34162 },
    { name: 'Designer Lehenga', sold: 22, revenue: 101178 },
    { name: 'Printed Palazzo Set', sold: 19, revenue: 15181 },
    { name: 'Kids Party Dress', sold: 17, revenue: 11033 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{t('analytics.title')}</h2>
        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${period === p ? 'bg-[#722F37] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t(`analytics.${p}`)}
            </button>
          ))}
        </div>
      </div>

      <RevenueChart data={MOCK_REVENUE} />

      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('analytics.topProducts')}</h3>
        <div className="space-y-3">
          {topProducts.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#722F37] rounded-full"
                    style={{ width: `${(p.sold / topProducts[0].sold) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{formatINR(p.revenue)}</p>
                <p className="text-xs text-gray-400">{p.sold} sold</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SupportPage() {
  const { t } = useAdminLang();

  const MOCK_TICKETS = [
    { id: 'TKT-001', subject: 'Order not delivered', category: 'delivery', status: 'open', priority: 'high', date: '22 Mar' },
    { id: 'TKT-002', subject: 'Payment not received', category: 'payment', status: 'in_progress', priority: 'medium', date: '21 Mar' },
    { id: 'TKT-003', subject: 'Product quality issue', category: 'product', status: 'resolved', priority: 'low', date: '20 Mar' },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('support.title')}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SupportTicketWidget />
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('support.ticketList')}</h3>
            <div className="space-y-3">
              {MOCK_TICKETS.map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0
                      ${ticket.priority === 'high' ? 'bg-red-500' :
                        ticket.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{ticket.subject}</p>
                      <p className="text-xs text-gray-400">{ticket.id} · {ticket.date}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                    ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'}`}
                  >
                    {ticket.status === 'in_progress' ? t('support.inProgress') :
                     ticket.status === 'open' ? t('support.open') : t('support.resolved')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GrowthPage() {
  const { t } = useAdminLang();

  // Days until Chhath Puja (approximate)
  const daysLeft = 14;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('growth.title')}</h2>

      {/* Countdown banner */}
      <div className="mb-6 p-5 bg-gradient-to-r from-[#722F37] to-[#C9A962] rounded-xl text-white">
        <p className="text-xs font-medium opacity-80 uppercase tracking-wide">{t('growth.countdown')}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-4xl font-bold">{daysLeft}</span>
          <span className="text-lg">{t('growth.daysLeft')}</span>
        </div>
        <p className="text-sm mt-2 opacity-90">Stock up on sarees, ethnic wear & festive collections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthSuggestions />
        <WhatsAppNotifPanel />
      </div>
    </div>
  );
}

function SettingsPage() {
  const { t } = useAdminLang();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Package size={32} className="text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-800">{t('settings.title')}</h2>
      <p className="text-sm text-gray-400 mt-1">{t('settings.comingSoon')}</p>
    </div>
  );
}

// ─── Main Dashboard Shell ───────────────────────────────────────────────────

function DashboardContent() {
  const { t } = useAdminLang();
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Detect sidebar collapse by checking sidebar width
  const sidebarWidth = sidebarCollapsed ? 68 : 240;

  // Listen for sidebar state (simple approach)
  useEffect(() => {
    const check = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        setSidebarCollapsed(sidebar.offsetWidth < 100);
      }
    };
    const observer = new MutationObserver(check);
    const sidebar = document.querySelector('aside');
    if (sidebar) observer.observe(sidebar, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'orders': return <OrdersPage />;
      case 'catalogue': return <CataloguePage />;
      case 'payments': return <PaymentsPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'support': return <SupportPage />;
      case 'growth': return <GrowthPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/80">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <TopBar sidebarWidth={sidebarWidth} />
      <main
        className="pt-20 pb-8 px-6 transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        {renderPage()}
      </main>
    </div>
  );
}

// Dashboard Home (default view)
function DashboardHome() {
  const { t } = useAdminLang();

  const stats = MOCK_STATS;

  return (
    <div className="space-y-6">
      {/* Zero commission banner */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg">₹0</div>
        <div>
          <p className="text-sm font-semibold text-green-800">{t('dash.commission')}</p>
          <p className="text-xs text-green-600">{t('dash.commissionDesc')}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard title={t('dash.totalOrders')} value={formatNumber(stats.totalOrders)} change={12} icon={<ShoppingCart size={20} />} color="#722F37" />
        <StatCard title={t('dash.todayOrders')} value={String(stats.todayOrders)} change={8} icon={<Package size={20} />} color="#2563eb" />
        <StatCard title={t('dash.totalRevenue')} value={formatINR(stats.totalRevenue)} change={15} icon={<IndianRupee size={20} />} color="#059669" />
        <StatCard title={t('dash.todayRevenue')} value={formatINR(stats.todayRevenue)} change={-3} icon={<TrendingUp size={20} />} color="#C9A962" />
        <StatCard title={t('dash.activeProducts')} value={formatNumber(stats.activeProducts)} icon={<Package size={20} />} color="#8b5cf6" />
        <StatCard title={t('dash.pendingApprovals')} value={String(stats.pendingApprovals)} icon={<ClipboardCheck size={20} />} color="#f59e0b" />
        <StatCard title={t('dash.totalSellers')} value={String(stats.totalSellers)} change={5} icon={<Users size={20} />} color="#0ea5e9" />
        <StatCard title={t('dash.returnRate')} value={`${stats.returnRate}%`} change={-1.5} icon={<RotateCcw size={20} />} color="#ef4444" />
      </div>

      {/* Revenue chart + Category split */}
      <RevenueChart data={MOCK_REVENUE} />

      {/* Recent orders + Growth suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">{t('dash.recentOrders')}</h3>
            <button className="text-xs text-[#722F37] font-medium hover:underline">{t('dash.viewAll')}</button>
          </div>
          <OrdersTable orders={MOCK_ORDERS} compact />
        </div>
        <div>
          <GrowthSuggestions />
        </div>
      </div>

      {/* Delivery heatmap + WhatsApp */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeliveryHeatmap />
        <WhatsAppNotifPanel />
      </div>
    </div>
  );
}

// ─── Page export with Provider ──────────────────────────────────────────────

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
