'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavbarCategory } from '@/lib/navbar';
import NavDropdown from './NavDropdown';

// Icon map: category slug → SVG path data
const ICON_MAP: Record<string, React.ReactNode> = {
  women: (
    <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2a5 5 0 015 5c0 2.5-1.5 4.5-3.5 5.4V14h2l1 2H14v6h-4v-6H7.5l1-2h2v-1.6C8.5 11.5 7 9.5 7 7a5 5 0 015-5z" />
    </svg>
  ),
  men: (
    <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  kids: (
    <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2a3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3zm0 8c3.31 0 6 .9 6 2v1H6v-1c0-1.1 2.69-2 6-2zm-4 5h8v7H8v-7z" />
    </svg>
  ),
  sarees: (
    <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  ),
  accessories: (
    <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
    </svg>
  ),
  footwear: (
    <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 18l2-6 6-2 8 2 2 6H2z" />
    </svg>
  ),
  makeup: (
    <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.5 2a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-3 0v-1A1.5 1.5 0 019.5 2zM12 8v13M8 10c0-2.2 1.8-4 4-4s4 1.8 4 4" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

interface NavRow2Props {
  categories: NavbarCategory[];
}

export default function NavRow2({ categories }: NavRow2Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerExpanded, setDrawerExpanded] = useState<Record<string, boolean>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const openDropdown = useCallback((slug: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveSlug(slug);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveSlug(null), 150);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const closeDropdown = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveSlug(null);
  }, []);

  const isActive = (slug: string) =>
    pathname === `/category/${slug}` || pathname.startsWith(`/category/${slug}/`);

  const toggleDrawerGroup = (id: string) =>
    setDrawerExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      {/* ── Desktop Row 2 ── */}
      <div className="hidden md:flex w-full bg-white border-b-2 border-[#f7f0f3] h-[44px] px-8 items-center gap-0">
        {categories.map(cat => {
          const icon = cat.navbar_icon ? ICON_MAP[cat.navbar_icon] : ICON_MAP[cat.slug] ?? DEFAULT_ICON;
          const active = isActive(cat.slug);

          return (
            <div
              key={cat.id}
              className="relative h-full flex items-stretch"
              onMouseEnter={() => openDropdown(cat.slug)}
              onMouseLeave={scheduleClose}
            >
              <button
                className={`relative flex items-center gap-1.5 px-3 h-full text-[13px] font-medium transition-colors whitespace-nowrap
                  ${active || activeSlug === cat.slug
                    ? 'text-[#5B1A3A] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-[#5B1A3A] after:rounded-t'
                    : 'text-[#888] hover:text-[#5B1A3A]'
                  }`}
              >
                <span className="opacity-70">{icon}</span>
                <span>{cat.name}</span>
                {/* Chevron down */}
                <svg
                  className="w-[10px] h-[10px] opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Mega dropdown */}
              {activeSlug === cat.slug && (
                <div
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <NavDropdown category={cat} onClose={closeDropdown} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Mobile hamburger button (shown inside Row 2 area) ── */}
      <div className="flex md:hidden w-full bg-white border-b-2 border-[#f7f0f3] h-[44px] px-4 items-center">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 text-sm font-medium text-[#5B1A3A]"
          aria-label="Open categories menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Categories</span>
        </button>
      </div>

      {/* ── Mobile slide-in drawer ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-[150] md:hidden"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer panel */}
          <div className="fixed top-0 left-0 h-full w-[300px] bg-white z-[160] shadow-2xl flex flex-col md:hidden overflow-y-auto">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#f7f0f3]">
              <span className="text-[16px] font-semibold text-[#5B1A3A] font-[family-name:var(--font-playfair)]">
                Shop by Category
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-[#888] hover:text-[#5B1A3A] transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Category tree */}
            <div className="flex-1 py-2">
              {categories.map(cat => {
                const icon = cat.navbar_icon ? ICON_MAP[cat.navbar_icon] : ICON_MAP[cat.slug] ?? DEFAULT_ICON;
                const isExpanded = !!drawerExpanded[cat.id];

                return (
                  <div key={cat.id} className="border-b border-[#f7f0f3] last:border-0">
                    {/* L1 row */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <Link
                        href={`/category/${cat.slug}`}
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-2 text-sm font-medium text-[#333] flex-1"
                      >
                        <span className="text-[#5B1A3A] opacity-70">{icon}</span>
                        {cat.name}
                      </Link>
                      {cat.groups.length > 0 && (
                        <button
                          onClick={() => toggleDrawerGroup(cat.id)}
                          className="p-1 text-[#888]"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* L2 groups (expanded) */}
                    {isExpanded && cat.groups.map(group => (
                      <div key={group.id} className="bg-[#FAF8F5] px-6 pb-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C49A3C] pt-2 pb-1">
                          {group.name}
                        </p>
                        {group.items.map(item => (
                          <Link
                            key={item.id}
                            href={`/category/${item.slug}`}
                            onClick={() => setDrawerOpen(false)}
                            className="block py-1.5 text-xs text-[#666] hover:text-[#5B1A3A] transition-colors"
                          >
                            {item.name}
                          </Link>
                        ))}
                        {group.items.length === 0 && (
                          <Link
                            href={`/category/${group.slug}`}
                            onClick={() => setDrawerOpen(false)}
                            className="block py-1.5 text-xs text-[#5B1A3A] font-medium"
                          >
                            View all
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
