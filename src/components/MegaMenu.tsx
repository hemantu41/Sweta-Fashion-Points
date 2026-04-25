'use client';

import Link from 'next/link';
import { useState, useRef, useCallback } from 'react';
import { useCategories, CategoryNode } from '@/hooks/useCategories';

export default function MegaMenu() {
  const { tree, loading } = useCategories();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = useCallback((slug: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveSlug(slug);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveSlug(null), 120);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const handleLinkClick = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveSlug(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 w-16 bg-[#E8E2D9] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const activeL1 = tree.find(c => c.slug === activeSlug) ?? null;

  return (
    <>
      {/* L1 nav tabs */}
      <div className="flex items-center space-x-0.5">
        {tree.map((l1: CategoryNode) => (
          <button
            key={l1.slug}
            onMouseEnter={() => openMenu(l1.slug)}
            onMouseLeave={scheduleClose}
            className={`px-4 py-2 text-sm font-bold tracking-wide transition-all duration-200 relative
              ${activeSlug === l1.slug
                ? 'text-[#722F37] after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-[#722F37] after:rounded-full'
                : 'text-[#2D2D2D] hover:text-[#722F37]'
              }`}
          >
            {l1.name}
          </button>
        ))}
      </div>

      {/* Flyout panel — fixed directly below the sticky nav (h-20 = 80px) */}
      {activeL1 && activeL1.children.length > 0 && (
        <div
          className="fixed inset-x-0 bg-white border-b border-[#E8E2D9] shadow-2xl z-40"
          style={{ top: '80px' }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {/* Coloured header bar */}
          <div className="bg-[#722F37]">
            <div className="max-w-7xl mx-auto px-8 py-2.5 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm uppercase tracking-widest">
                {activeL1.name}
              </h3>
              <Link
                href={`/category/${activeL1.slug}`}
                onClick={handleLinkClick}
                className="text-[#F5D78C] text-xs font-medium hover:text-white transition-colors"
              >
                View All {activeL1.name} &rarr;
              </Link>
            </div>
          </div>

          {/* L2 columns + L3 links */}
          <div className="max-w-7xl mx-auto px-8 py-6">
            {activeL1.children.length === 0 ? null : (
              <div
                className="grid gap-x-8 gap-y-2"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(activeL1.children.length, 6)}, minmax(0, 1fr))`,
                }}
              >
                {activeL1.children.map((l2: CategoryNode) => (
                  <div key={l2.slug} className="space-y-2 min-w-0">
                    {/* L2 header link */}
                    <Link
                      href={`/category/${l2.slug}`}
                      onClick={handleLinkClick}
                      className="block text-[#722F37] font-semibold text-sm pb-1.5 border-b border-[#E8E2D9] hover:text-[#5B1A3A] transition-colors truncate"
                    >
                      {l2.name}
                    </Link>

                    {/* L3 list */}
                    {l2.children.length > 0 && (
                      <ul className="space-y-1">
                        {l2.children.slice(0, 8).map((l3: CategoryNode) => (
                          <li key={l3.slug}>
                            <Link
                              href={`/category/${l3.slug}`}
                              onClick={handleLinkClick}
                              className="block text-[#4A4A4A] text-xs leading-snug hover:text-[#722F37] transition-colors py-0.5 truncate"
                            >
                              {l3.name}
                            </Link>
                          </li>
                        ))}
                        {l2.children.length > 8 && (
                          <li>
                            <Link
                              href={`/category/${l2.slug}`}
                              onClick={handleLinkClick}
                              className="block text-[#C49A3C] text-xs font-medium hover:text-[#722F37] transition-colors py-0.5"
                            >
                              +{l2.children.length - 8} more
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop — closes menu on outside click */}
      {activeL1 && (
        <div
          className="fixed inset-0 z-30"
          style={{ top: '80px' }}
          onClick={() => setActiveSlug(null)}
        />
      )}
    </>
  );
}
