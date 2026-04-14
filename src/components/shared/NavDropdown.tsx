'use client';

import Link from 'next/link';
import { NavbarCategory } from '@/lib/navbar';

interface NavDropdownProps {
  category: NavbarCategory;
  onClose: () => void;
}

export default function NavDropdown({ category, onClose }: NavDropdownProps) {
  const { groups, navbar_promo: promo } = category;

  if (groups.length === 0 && !promo) return null;

  return (
    <div className="absolute top-full left-0 min-w-[520px] bg-white border border-[#E8E0E4] rounded-b-[10px] shadow-lg z-[100] p-4 flex gap-6">
      {/* L2 column groups */}
      {groups.map((group, groupIdx) => (
        <div key={group.id} className="min-w-[110px] flex-shrink-0">
          {/* L2 column heading */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C49A3C] pb-1.5 mb-1.5 border-b border-[#E8E0E4]">
            {group.name}
          </p>
          {/* L3 items */}
          <div className="flex flex-col">
            {group.items.map((item, itemIdx) => (
              <Link
                key={item.id}
                href={`/category/${item.slug}`}
                onClick={onClose}
                className={`py-[3px] text-xs transition-colors cursor-pointer hover:text-[#5B1A3A] ${
                  itemIdx === 0 ? 'font-medium text-[#5B1A3A]' : 'text-[#888]'
                }`}
              >
                {item.name}
              </Link>
            ))}
            {/* If no L3 items, the group itself links to its slug */}
            {group.items.length === 0 && (
              <Link
                href={`/category/${group.slug}`}
                onClick={onClose}
                className="py-[3px] text-xs font-medium text-[#5B1A3A] hover:underline"
              >
                View all
              </Link>
            )}
          </div>
        </div>
      ))}

      {/* Promo block */}
      {promo && (
        <div className="bg-[#f7f0f3] rounded-lg p-[14px] min-w-[140px] flex-shrink-0 flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C49A3C]">
            {promo.label}
          </p>
          <p className="text-sm font-semibold text-[#5B1A3A] font-[family-name:var(--font-playfair)] leading-snug">
            {promo.title}
          </p>
          <Link
            href={promo.link}
            onClick={onClose}
            className="text-[11px] font-medium text-[#5B1A3A] hover:underline mt-auto"
          >
            Shop now →
          </Link>
        </div>
      )}
    </div>
  );
}
