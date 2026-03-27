'use client';

import { useState } from 'react';
import { SellerNotification, timeAgo } from '@/hooks/useNotifications';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SellerNotification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

const TYPE_CONFIG = {
  order: {
    bg: '#EBF2FB', color: '#1565C0',
    icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
    label: 'Orders',
  },
  qc: {
    bg: '#EBF7EF', color: '#2E7D32',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    label: 'QC',
  },
  payment: {
    bg: '#FEFCE8', color: '#C49A3C',
    icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    label: 'Payments',
  },
  alert: {
    bg: '#F5EDF2', color: '#C62828',
    icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    label: 'Alerts',
  },
};

type FilterType = 'all' | 'order' | 'qc' | 'payment' | 'alert';

export default function NotificationsPanel({
  isOpen, onClose, notifications, unreadCount, onMarkAllRead, onMarkRead,
}: NotificationsPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const hasUnread = unreadCount > 0;

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8E0E4]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800">Notifications</h2>
              {hasUnread && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white rounded-full" style={{ background: '#5B1A3A' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <button onClick={onMarkAllRead} className="text-xs text-[#5B1A3A] hover:underline">Mark all read</button>
              )}
              <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {(['all', 'order', 'qc', 'payment', 'alert'] as FilterType[]).map(f => {
              const count = f === 'all' ? notifications.length : notifications.filter(n => n.type === f).length;
              if (f !== 'all' && count === 0) return null;
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md whitespace-nowrap transition-colors ${filter === f ? 'text-white' : 'text-gray-500 hover:bg-gray-100 bg-gray-50'}`}
                  style={filter === f ? { background: '#5B1A3A' } : {}}>
                  {f === 'all' ? 'All' : TYPE_CONFIG[f].label}
                  {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-12">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <p className="text-sm">No notifications</p>
              <p className="text-xs text-center px-6">You're all caught up! New orders, QC updates and payment alerts will appear here.</p>
            </div>
          ) : (
            filtered.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.alert;
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 px-5 py-3.5 cursor-pointer transition-colors ${!n.is_read ? 'bg-[#F5EDF2]/40 hover:bg-[#F5EDF2]/60' : 'hover:bg-gray-50'}`}
                  onClick={() => { if (!n.is_read) onMarkRead(n.id); }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={cfg.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    {n.title && <p className="text-xs font-semibold text-gray-700 leading-snug">{n.title}</p>}
                    <p className="text-sm text-gray-600 leading-snug mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#5B1A3A] flex-shrink-0 mt-1.5" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E8E0E4]">
          <p className="text-[10px] text-gray-400 text-center">Notifications update automatically every minute</p>
        </div>
      </div>
    </>
  );
}
