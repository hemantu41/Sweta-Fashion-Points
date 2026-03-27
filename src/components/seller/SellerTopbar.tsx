'use client';

interface SellerTopbarProps {
  pageTitle: string;
  pageSubtitle?: string;
  sellerInitials: string;
  hasUnread: boolean;
  onMenuToggle: () => void;
  onNotificationsClick: () => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
}

export default function SellerTopbar({
  pageTitle, pageSubtitle, sellerInitials, hasUnread,
  onMenuToggle, onNotificationsClick, searchValue, onSearchChange,
}: SellerTopbarProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-6 h-14 bg-white border-b border-[#E8E0E4]"
      style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {/* Title */}
      <div className="hidden sm:block flex-shrink-0">
        <h1 className="text-base font-semibold text-[#333333] leading-tight" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)" }}>{pageTitle}</h1>
        {pageSubtitle && <p className="text-xs text-[#999999] leading-none mt-0.5">{pageSubtitle}</p>}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs ml-0 sm:ml-4">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#999999]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-[#E8E0E4] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C49A3C]/30 focus:border-[#C49A3C]/50 text-gray-700 placeholder:text-[#999999]"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <button
          onClick={onNotificationsClick}
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }}
        >
          {sellerInitials}
        </div>
      </div>
    </header>
  );
}
