'use client';

import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, CreditCard,
  BarChart3, HeadphonesIcon, TrendingUp, Settings,
  ChevronLeft, ChevronRight, ClipboardCheck, LogOut,
  AlertTriangle, Users,
} from 'lucide-react';
import { useAdminLang } from './LanguageContext';
import type { AdminPage } from '@/types/admin';

interface SidebarProps {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  ndrCount?: number;
}

const NAV_ITEMS: { page: AdminPage; icon: typeof LayoutDashboard; labelKey: string; badge?: boolean }[] = [
  { page: 'dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { page: 'orders', icon: ShoppingCart, labelKey: 'nav.orders' },
  { page: 'ndr', icon: AlertTriangle, labelKey: 'nav.ndr', badge: true },
  { page: 'catalogue', icon: Package, labelKey: 'nav.catalogue' },
  { page: 'payments', icon: CreditCard, labelKey: 'nav.payments' },
  { page: 'analytics', icon: BarChart3, labelKey: 'nav.analytics' },
  { page: 'support', icon: HeadphonesIcon, labelKey: 'nav.support' },
  { page: 'growth', icon: TrendingUp, labelKey: 'nav.growth' },
  { page: 'users', icon: Users, labelKey: 'nav.users' },
  { page: 'settings', icon: Settings, labelKey: 'nav.settings' },
];

// Mobile bottom nav items (subset)
const MOBILE_NAV: { page: AdminPage; icon: typeof LayoutDashboard; labelKey: string }[] = [
  { page: 'dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { page: 'orders', icon: ShoppingCart, labelKey: 'nav.orders' },
  { page: 'catalogue', icon: Package, labelKey: 'nav.catalogue' },
  { page: 'analytics', icon: BarChart3, labelKey: 'nav.analytics' },
  { page: 'settings', icon: Settings, labelKey: 'nav.settings' },
];

export default function Sidebar({ activePage, onNavigate, ndrCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useAdminLang();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40
          flex-col transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">IF</span>
          </div>
          {!collapsed && (
            <span className="ml-3 font-semibold text-gray-800 text-sm whitespace-nowrap">
              Insta Fashion Points
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ page, icon: Icon, labelKey, badge }) => {
            const isActive = activePage === page;
            const showBadge = badge && ndrCount > 0;
            return (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                title={collapsed ? t(labelKey) : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative
                  ${isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <div className="relative flex-shrink-0">
                  <Icon size={20} />
                  {showBadge && collapsed && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {ndrCount > 9 ? '9+' : ndrCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <>
                    <span>{t(labelKey)}</span>
                    {showBadge && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {ndrCount > 9 ? '9+' : ndrCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}

          {/* QC Review link */}
          <a
            href="/admin/qc"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
            title={collapsed ? t('nav.qc') : undefined}
          >
            <ClipboardCheck size={20} className="flex-shrink-0" />
            {!collapsed && <span>{t('nav.qc')}</span>}
          </a>
        </nav>

        {/* Collapse toggle + Logout */}
        <div className="p-2 border-t border-gray-100 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-all"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex">
        {MOBILE_NAV.map(({ page, icon: Icon, labelKey }) => {
          const isActive = activePage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors
                ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}
            >
              <Icon size={20} />
              <span>{t(labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
