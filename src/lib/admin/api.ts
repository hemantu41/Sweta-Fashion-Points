// ─── Admin Dashboard API Layer ──────────────────────────────────────────────
// Centralized fetch helpers. All API calls go through here.

import type {
  DashboardStats,
  RevenueDataPoint,
  Order,
  CatalogueProduct,
  PaymentRecord,
  SupportTicket,
  WhatsAppNotification,
} from '@/types/admin';

const BASE = '/api/admin';

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>(`${BASE}/dashboard/stats`);
}

export async function fetchRevenueChart(days = 7): Promise<RevenueDataPoint[]> {
  return apiFetch<RevenueDataPoint[]>(`${BASE}/dashboard/revenue?days=${days}`);
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export async function fetchOrders(status?: string): Promise<Order[]> {
  const q = status && status !== 'all' ? `?status=${status}` : '';
  return apiFetch<Order[]>(`${BASE}/orders${q}`);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  await apiFetch(`${BASE}/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ─── Catalogue ──────────────────────────────────────────────────────────────

export async function fetchCatalogue(filter?: string): Promise<CatalogueProduct[]> {
  const q = filter && filter !== 'all' ? `?filter=${filter}` : '';
  return apiFetch<CatalogueProduct[]>(`${BASE}/catalogue${q}`);
}

// ─── Payments ───────────────────────────────────────────────────────────────

export async function fetchPayments(): Promise<PaymentRecord[]> {
  return apiFetch<PaymentRecord[]>(`${BASE}/payments`);
}

// ─── Support ────────────────────────────────────────────────────────────────

export async function fetchTickets(): Promise<SupportTicket[]> {
  return apiFetch<SupportTicket[]>(`${BASE}/support/tickets`);
}

export async function createTicket(ticket: Partial<SupportTicket>): Promise<SupportTicket> {
  return apiFetch<SupportTicket>(`${BASE}/support/tickets`, {
    method: 'POST',
    body: JSON.stringify(ticket),
  });
}

// ─── WhatsApp ───────────────────────────────────────────────────────────────

export async function fetchWhatsAppLogs(): Promise<WhatsAppNotification[]> {
  return apiFetch<WhatsAppNotification[]>(`${BASE}/whatsapp/logs`);
}

export async function sendWhatsAppTemplate(
  template: string,
  recipient: string
): Promise<{ success: boolean }> {
  return apiFetch(`${BASE}/whatsapp/send`, {
    method: 'POST',
    body: JSON.stringify({ template, recipient }),
  });
}
