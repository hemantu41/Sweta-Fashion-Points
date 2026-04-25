'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SellerNotification {
  id: string;
  seller_id: string;
  type: 'order' | 'qc' | 'payment' | 'alert';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

interface UseNotificationsResult {
  notifications: SellerNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => void;
}

const POLL_INTERVAL = 60_000; // 60 seconds

export function useNotifications(sellerId: string | undefined): UseNotificationsResult {
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const fetch_ = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications/seller?sellerId=${sid}&limit=40`).then(r => r.json());
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // silently ignore — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sellerId) return;
    fetch_(sellerId);

    // Poll every 60s for new notifications
    timerRef.current = setInterval(() => fetch_(sellerId), POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [sellerId, fetch_]);

  const markRead = useCallback(async (id: string) => {
    if (!sellerId) return;
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    try {
      await fetch('/api/notifications/seller', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, ids: [id] }),
      });
    } catch { /* silent */ }
  }, [sellerId]);

  const markAllRead = useCallback(async () => {
    if (!sellerId) return;
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/notifications/seller', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, markAll: true }),
      });
    } catch { /* silent */ }
  }, [sellerId]);

  const refresh = useCallback(() => {
    if (sellerId) fetch_(sellerId);
  }, [sellerId, fetch_]);

  return { notifications, unreadCount, loading, markRead, markAllRead, refresh };
}

/** Time ago helper */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}
