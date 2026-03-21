'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BRAND = '#8B1A1A';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SellerSidebarProps {
  sellerName: string;
  healthScore: number;
  orderBadge: number;
  productBadge: number;
  qcBadge: number;
  isOpen: boolean;
  onClose: () => void;
}

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  orders: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0',
  products: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  qc: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  add: 'M12 5v14M5 12h14',
  earnings: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  analytics: 'M18 20V10M12 20V4M6 20v-6',
  health: 'M22 12h-4l-3 9L9 3l-3 9H2',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
};

export default function SellerSidebar({ sellerName, healthScore, orderBadge, productBadge, qcBadge, isOpen, onClose }: SellerSidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/seller/dashboard', icon: <Icon d={ICONS.dashboard} /> },
    { label: 'Orders', href: '/seller/dashboard/orders', icon: <Icon d={ICONS.orders} />, badge: orderBadge },
    { label: 'Products', href: '/seller/dashboard/products', icon: <Icon d={ICONS.products} />, badge: productBadge },
    { label: 'QC Status', href: '/seller/dashboard/qc', icon: <Icon d={ICONS.qc} />, badge: qcBadge },
    { label: 'Add Product', href: '/seller/dashboard/add', icon: <Icon d={ICONS.add} /> },
    { label: 'Earnings', href: '/seller/dashboard/earnings', icon: <Icon d={ICONS.earnings} /> },
    { label: 'Analytics', href: '/seller/dashboard/analytics', icon: <Icon d={ICONS.analytics} /> },
    { label: 'Seller Health', href: '/seller/dashboard/health', icon: <Icon d={ICONS.health} /> },
    { label: 'Settings', href: '/seller/dashboard/settings', icon: <Icon d={ICONS.settings} /> },
  ];

  const initials = sellerName ? sellerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'SP';

  const tierColor = healthScore >= 86 ? '#B8860B' : healthScore >= 61 ? '#6B7280' : '#92400E';
  const tierLabel = healthScore >= 86 ? 'Gold' : healthScore >= 61 ? 'Silver' : 'Bronze';

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-playfair)' }}>IF</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Insta Fashion</p>
            <p className="text-white/50 text-[10px] uppercase tracking-widest">Seller Portal</p>
          </div>
        </div>
      </div>

      {/* Seller info */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{sellerName || 'Seller'}</p>
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300 font-medium mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
              Approved Seller
            </span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/seller/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative ${
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
              )}
              <span className={isActive ? 'text-white' : 'text-white/60 group-hover:text-white/90'}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white min-w-[18px] text-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Health score */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white/60 text-xs">Seller Health</p>
          <span className="text-xs font-semibold" style={{ color: tierColor }}>{tierLabel}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${healthScore}%`, background: `linear-gradient(90deg, #C0392B, #8B1A1A)` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-white/40 text-[10px]">0</span>
          <span className="text-white/80 text-[10px] font-medium">{healthScore}/100</span>
          <span className="text-white/40 text-[10px]">100</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0"
        style={{ background: BRAND }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-60 flex flex-col"
            style={{ background: BRAND }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
