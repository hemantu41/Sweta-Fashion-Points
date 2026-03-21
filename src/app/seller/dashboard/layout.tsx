'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DM_Sans } from 'next/font/google';
import { useAuth } from '@/context/AuthContext';
import SellerSidebar from '@/components/seller/SellerSidebar';
import SellerTopbar from '@/components/seller/SellerTopbar';
import NotificationsPanel from '@/components/seller/NotificationsPanel';
import SellerAuthGuard from '@/components/SellerAuthGuard';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/seller/dashboard': { title: 'Dashboard', subtitle: 'Overview of your store performance' },
  '/seller/dashboard/orders': { title: 'Orders', subtitle: 'Manage and fulfil customer orders' },
  '/seller/dashboard/products': { title: 'Products', subtitle: 'Manage your product listings' },
  '/seller/dashboard/qc': { title: 'QC Status', subtitle: 'Track your products through approval pipeline' },
  '/seller/dashboard/add': { title: 'Add Product', subtitle: 'List a new product on Insta Fashion Points' },
  '/seller/dashboard/earnings': { title: 'Earnings', subtitle: 'Track your payouts and revenue' },
  '/seller/dashboard/analytics': { title: 'Analytics', subtitle: 'Performance insights for your store' },
  '/seller/dashboard/health': { title: 'Seller Health', subtitle: 'Your seller performance score' },
  '/seller/dashboard/settings': { title: 'Settings', subtitle: 'Manage your seller account' },
};

interface DashboardData {
  sellerName: string;
  sellerId: string;
  healthScore: number;
  orderBadge: number;
  productBadge: number;
  qcBadge: number;
}

const DEMO_NOTIFICATIONS = [
  { id: '1', type: 'order' as const, text: 'New order #ORD-1042 received. Pack by 5:00 PM today.', time: '10 min ago', read: false },
  { id: '2', type: 'qc' as const, text: 'Product "Red Silk Saree" approved and is now live.', time: '2 hrs ago', read: false },
  { id: '3', type: 'payment' as const, text: '₹2,340 credited to your bank account.', time: 'Yesterday', read: true },
  { id: '4', type: 'alert' as const, text: 'Low stock alert: "Blue Kurta XL" has only 2 units left.', time: '2 days ago', read: true },
];

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<DashboardData>({
    sellerName: user?.name || 'Seller',
    sellerId: user?.sellerId || '',
    healthScore: 72,
    orderBadge: 0,
    productBadge: 0,
    qcBadge: 0,
  });
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [sellerRes, productsRes, ordersRes] = await Promise.allSettled([
          fetch(`/api/sellers/me?userId=${user.id}`),
          fetch(`/api/products?sellerId=${user.sellerId}&isActive=all`),
          fetch(`/api/orders?sellerId=${user.sellerId}`),
        ]);

        if (sellerRes.status === 'fulfilled' && sellerRes.value.ok) {
          const d = await sellerRes.value.json();
          if (d.seller) {
            setData(prev => ({ ...prev, sellerName: d.seller.businessName || user?.name || 'Seller', sellerId: d.seller.id }));
          }
        }
        if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
          const d = await productsRes.value.json();
          const prods: any[] = d.products || [];
          setData(prev => ({
            ...prev,
            productBadge: prods.length,
            qcBadge: prods.filter((p: any) => p.approvalStatus === 'pending' || p.approvalStatus === 'under_review').length,
          }));
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
          const d = await ordersRes.value.json();
          const orders = d.orders || d || [];
          setData(prev => ({ ...prev, orderBadge: Array.isArray(orders) ? orders.length : 0 }));
        }
      } catch {/* silent */}
    })();
  }, [user?.id, user?.sellerId, user?.name]);

  const pathKey = Object.keys(PAGE_TITLES).find(k => k === pathname || (k !== '/seller/dashboard' && pathname?.startsWith(k)));
  const { title, subtitle } = PAGE_TITLES[pathKey || '/seller/dashboard'];

  const initials = data.sellerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const hasUnread = notifications.some(n => !n.read);

  return (
    <SellerAuthGuard>
      <div className={`${dmSans.variable} flex h-screen bg-[#F8F6F3] overflow-hidden`} style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
        {/* Sidebar */}
        <SellerSidebar
          sellerName={data.sellerName}
          healthScore={data.healthScore}
          orderBadge={data.orderBadge}
          productBadge={data.productBadge}
          qcBadge={data.qcBadge}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <SellerTopbar
            pageTitle={title}
            pageSubtitle={subtitle}
            sellerInitials={initials}
            hasUnread={hasUnread}
            onMenuToggle={() => setSidebarOpen(o => !o)}
            onNotificationsClick={() => setNotifOpen(o => !o)}
            searchValue={search}
            onSearchChange={setSearch}
          />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>

        {/* Notifications panel */}
        <NotificationsPanel
          isOpen={notifOpen}
          onClose={() => setNotifOpen(false)}
          notifications={notifications}
          onMarkAllRead={() => setNotifications(ns => ns.map(n => ({ ...n, read: true })))}
        />
      </div>
    </SellerAuthGuard>
  );
}
