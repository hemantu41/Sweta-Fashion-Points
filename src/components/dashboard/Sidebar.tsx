'use client';

import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, CreditCard,
  BarChart3, HeadphonesIcon, TrendingUp, Settings,
  ChevronLeft, ChevronRight, ClipboardCheck, LogOut,
  AlertTriangle, Users, RotateCcw, ChevronDown, Store, FolderTree,
} from 'lucide-react';
import { useAdminLang } from './LanguageContext';
import type { AdminPage } from '@/types/admin';

interface SidebarProps {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  ndrCount?: number;
}

type NavItem = { page: AdminPage; icon: typeof LayoutDashboard; labelKey: string; badge?: boolean; children?: NavItem[] };

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { page: 'orders', icon: ShoppingCart, labelKey: 'nav.orders' },
  { page: 'ndr', icon: AlertTriangle, labelKey: 'nav.ndr', badge: true },
  { page: 'catalogue', icon: Package, labelKey: 'nav.catalogue' },
  { page: 'payments', icon: CreditCard, labelKey: 'nav.payments' },
  { page: 'analytics', icon: BarChart3, labelKey: 'nav.analytics' },
  { page: 'support', icon: HeadphonesIcon, labelKey: 'nav.support' },
  { page: 'growth', icon: TrendingUp, labelKey: 'nav.growth' },
  {
    page: 'settings', icon: Settings, labelKey: 'nav.settings',
    children: [
      { page: 'sellers', icon: Store, labelKey: 'nav.sellers' },
      { page: 'users', icon: Users, labelKey: 'nav.users' },
      { page: 'returns', icon: RotateCcw, labelKey: 'nav.returns' },
      { page: 'categories', icon: FolderTree, labelKey: 'nav.categories' },
    ],
  },
];

// Mobile bottom nav items (subset)
const MOBILE_NAV: { page: AdminPage; icon: typeof LayoutDashboard; labelKey: string }[] = [
  { page: 'dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { page: 'orders', icon: ShoppingCart, labelKey: 'nav.orders' },
  { page: 'catalogue', icon: Package, labelKey: 'nav.catalogue' },
  { page: 'analytics', icon: BarChart3, labelKey: 'nav.analytics' },
  { page: 'settings', icon: Settings, labelKey: 'nav.settings' },
];

const SETTINGS_CHILDREN_PAGES: AdminPage[] = ['settings', 'sellers', 'users', 'returns', 'categories'];

export default function Sidebar({ activePage, onNavigate, ndrCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(SETTINGS_CHILDREN_PAGES.includes(activePage));
  const { t } = useAdminLang();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-screen bg-[#1F0E17] border-r border-[rgba(196,154,60,0.08)] z-40
          flex-col transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-[rgba(196,154,60,0.08)]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B1A3A] to-[#7A2350] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">IF</span>
          </div>
          {!collapsed && (
            <span className="ml-3 font-semibold text-white text-sm whitespace-nowrap">
              Insta Fashion Points
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ page, icon: Icon, labelKey, badge, children }) => {
            const hasChildren = children && children.length > 0;
            const isParentActive = hasChildren && SETTINGS_CHILDREN_PAGES.includes(activePage);
            const isActive = activePage === page;
            const showBadge = badge && ndrCount > 0;

            if (hasChildren) {
              return (
                <div key={page}>
                  {/* Parent: Settings */}
                  <button
                    onClick={() => {
                      if (collapsed) {
                        onNavigate(page);
                      } else {
                        setSettingsOpen(o => !o);
                        if (!settingsOpen) onNavigate(page);
                      }
                    }}
                    title={collapsed ? t(labelKey) : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative
                      ${isActive || isParentActive
                        ? 'bg-[rgba(196,154,60,0.1)] text-white border-l-2 border-[#C49A3C]'
                        : 'text-[rgba(255,255,255,0.45)] hover:bg-[rgba(196,154,60,0.06)] hover:text-[rgba(255,255,255,0.75)]'
                      }`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{t(labelKey)}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''} ${isActive || isParentActive ? 'text-white/70' : 'text-[rgba(255,255,255,0.35)]'}`}
                        />
                      </>
                    )}
                  </button>
                  {/* Children */}
                  {!collapsed && settingsOpen && (
                    <div className="mt-0.5 ml-4 pl-3 border-l-2 border-[rgba(196,154,60,0.15)] space-y-0.5">
                      {children.map(({ page: childPage, icon: ChildIcon, labelKey: childLabelKey }) => {
                        const isChildActive = activePage === childPage;
                        return (
                          <button
                            key={childPage}
                            onClick={() => onNavigate(childPage)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all
                              ${isChildActive
                                ? 'bg-[rgba(196,154,60,0.12)] text-[#DDB868]'
                                : 'text-[rgba(255,255,255,0.4)] hover:bg-[rgba(196,154,60,0.06)] hover:text-[rgba(255,255,255,0.65)]'
                              }`}
                          >
                            <ChildIcon size={16} className="flex-shrink-0" />
                            <span>{t(childLabelKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                title={collapsed ? t(labelKey) : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative
                  ${isActive
                    ? 'bg-[rgba(196,154,60,0.1)] text-white border-l-2 border-[#C49A3C]'
                    : 'text-[rgba(255,255,255,0.45)] hover:bg-[rgba(196,154,60,0.06)] hover:text-[rgba(255,255,255,0.75)]'
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
                      <span className="ml-auto bg-[#C49A3C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
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
              text-[rgba(255,255,255,0.45)] hover:bg-[rgba(196,154,60,0.06)] hover:text-[rgba(255,255,255,0.75)] transition-all"
            title={collapsed ? t('nav.qc') : undefined}
          >
            <ClipboardCheck size={20} className="flex-shrink-0" />
            {!collapsed && <span>{t('nav.qc')}</span>}
          </a>
        </nav>

        {/* Collapse toggle + Logout */}
        <div className="p-2 border-t border-[rgba(196,154,60,0.08)] space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[rgba(255,255,255,0.45)] hover:bg-[rgba(196,154,60,0.06)] hover:text-[rgba(255,255,255,0.7)] transition-all"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1F0E17] border-t border-[rgba(196,154,60,0.15)] z-40 flex">
        {MOBILE_NAV.map(({ page, icon: Icon, labelKey }) => {
          const isActive = activePage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors
                ${isActive ? 'text-[#C49A3C]' : 'text-[rgba(255,255,255,0.4)]'}`}
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
