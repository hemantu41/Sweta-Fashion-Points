'use client';

/**
 * Admin — Orders Management
 * Tabs: All | Pending | Accepted | Ready to Ship | In Transit | Delivered | SLA Breach | Flagged
 * Features: stats row, orders table, SLA countdown, risk flags, order detail drawer, admin actions
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// ─── Brand ────────────────────────────────────────────────────────────────────
const C = {
  maroon:  '#5B1A3A',
  gold:    '#C49A3C',
  bg:      '#FAF7F8',
  sidebar: '#1F0E17',
  text:    '#1a1a1a',
  muted:   '#6b7280',
  border:  '#e5e0e3',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderRow {
  id:                    string;
  orderNumber:           string;
  status:                string;
  riskStatus:            string;
  riskScore:             number;
  customerId:            string;
  customerName:          string;
  customerEmail:         string;
  paymentMethod:         string | null;
  subtotal:              number;
  shippingCharge:        number;
  total:                 number;
  acceptanceSlaDeadline: string | null;
  packingSlaDeadline:    string | null;
  awbNumber:             string | null;
  courierPartner:        string | null;
  createdAt:             string;
  itemCount:             number;
}

interface OrderDetail extends OrderRow {
  sellerId:           string;
  sellerName:         string;
  sellerEmail:        string;
  sellerPhone:        string;
  customerPhone:      string;
  platformFee:        number;
  pgFee:              number;
  sellerPayoutAmount: number;
  shippingAddress:    any;
  trackingUrl:        string | null;
  notes:              string | null;
  items: {
    id:         string;
    productName: string;
    quantity:   number;
    unitPrice:  number;
    totalPrice: number;
    sku:        string | null;
    variantDetails: any;
  }[];
  statusHistory: {
    id:         string;
    fromStatus: string | null;
    toStatus:   string;
    actorType:  string;
    actorId:    string | null;
    note:       string | null;
    createdAt:  string;
  }[];
  riskFlags: {
    id:                string;
    flagType:          string;
    flagValue:         string | null;
    scoreContribution: number;
    createdAt:         string;
  }[];
  payout: {
    grossAmount:       number;
    shippingDeduction: number;
    pgFeeDeduction:    number;
    netPayout:         number;
    status:            string;
    payoutDate:        string | null;
  } | null;
}

interface Stats {
  totalToday:        number;
  pendingAcceptance: number;
  slaAtRisk:         number;
  fraudHold:         number;
  deliveredToday:    number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'all',        label: 'All Orders' },
  { key: 'pending',    label: 'Pending' },
  { key: 'accepted',   label: 'Accepted' },
  { key: 'ready',      label: 'Ready to Ship' },
  { key: 'in-transit', label: 'In Transit' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'sla-breach', label: ' SLA Breach' },
  { key: 'flagged',    label: ' Flagged' },
] as const;

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING_PAYMENT:  { bg: '#fef3c7', color: '#92400e' },
  PAYMENT_FAILED:   { bg: '#fee2e2', color: '#991b1b' },
  CONFIRMED:        { bg: '#dbeafe', color: '#1e40af' },
  SELLER_NOTIFIED:  { bg: '#ede9fe', color: '#5b21b6' },
  ACCEPTED:         { bg: '#d1fae5', color: '#065f46' },
  PACKED:           { bg: '#ecfdf5', color: '#047857' },
  READY_TO_SHIP:    { bg: '#d1fae5', color: '#065f46' },
  PICKUP_SCHEDULED: { bg: '#cffafe', color: '#164e63' },
  IN_TRANSIT:       { bg: '#dbeafe', color: '#1e40af' },
  OUT_FOR_DELIVERY: { bg: '#e0f2fe', color: '#075985' },
  DELIVERED:        { bg: '#d1fae5', color: '#065f46' },
  CANCELLED:        { bg: '#fee2e2', color: '#991b1b' },
  RETURN_INITIATED: { bg: '#fef3c7', color: '#92400e' },
  RETURNED:         { bg: '#ffedd5', color: '#9a3412' },
};

const RISK_COLORS: Record<string, { bg: string; color: string }> = {
  CLEAR:     { bg: '#d1fae5', color: '#065f46' },
  SOFT_FLAG: { bg: '#fef3c7', color: '#92400e' },
  HOLD:      { bg: '#fee2e2', color: '#991b1b' },
  REJECTED:  { bg: '#4b0000', color: '#fca5a5' },
};

const STATUS_STEPS = [
  'PENDING_PAYMENT', 'CONFIRMED', 'SELLER_NOTIFIED', 'ACCEPTED',
  'PACKED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function SlaCountdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const tick = () => {
      const ms  = new Date(deadline).getTime() - Date.now();
      if (ms <= 0) { setRemaining('BREACHED'); return; }
      const h   = Math.floor(ms / 3600000);
      const m   = Math.floor((ms % 3600000) / 60000);
      const s   = Math.floor((ms % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const isBreached = remaining === 'BREACHED';
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, fontFamily: 'monospace',
      color: isBreached ? '#dc2626' : '#d97706',
    }}>
      {remaining}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
      background: c.bg, color: c.color, whiteSpace: 'nowrap',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function RiskBadge({ riskStatus, riskScore }: { riskStatus: string; riskScore: number }) {
  if (riskStatus === 'CLEAR' && riskScore === 0) return null;
  const c = RISK_COLORS[riskStatus] ?? { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: c.bg, color: c.color,
    }}>
      {riskStatus} {riskScore > 0 ? `(${riskScore})` : ''}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tab,       setTab]       = useState<string>('all');
  const [search,    setSearch]    = useState('');
  const [searchQ,   setSearchQ]   = useState(''); // debounced
  const [page,      setPage]      = useState(1);
  const [orders,    setOrders]    = useState<OrderRow[]>([]);
  const [total,     setTotal]     = useState(0);
  const [totalPages,setTotalPages]= useState(0);
  const [loading,   setLoading]   = useState(true);
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [drawer,    setDrawer]    = useState<OrderDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Auth guard
  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearchQ(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when tab changes
  useEffect(() => { setPage(1); }, [tab]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/orders/v2/stats');
    if (res.ok) setStats(await res.json());
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ tab, page: String(page) });
      if (searchQ) qs.set('search', searchQ);
      const res = await fetch(`/api/admin/orders/v2?${qs}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, page, searchQ]);

  useEffect(() => {
    fetchStats();
    fetchOrders();
  }, [fetchStats, fetchOrders]);

  // SLA Breach tab: auto-refresh every 60s
  useEffect(() => {
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    if (tab === 'sla-breach') {
      autoRefreshRef.current = setInterval(fetchOrders, 60_000);
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [tab, fetchOrders]);

  // Show toast
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Open drawer
  const openDrawer = async (id: string) => {
    setDrawerLoading(true);
    setDrawer(null);
    const res = await fetch(`/api/admin/orders/v2/${id}`);
    if (res.ok) {
      const data = await res.json();
      setDrawer(data.order);
    }
    setDrawerLoading(false);
  };

  // Admin action helper
  const action = async (
    orderId: string,
    endpoint: string,
    body?: object,
    successMsg = 'Done',
  ) => {
    setActionLoading(endpoint);
    try {
      const res = await fetch(`/api/admin/orders/v2/${orderId}/${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (res.ok) {
        showToast(successMsg);
        fetchOrders();
        fetchStats();
        if (drawer?.id === orderId) openDrawer(orderId);
      } else {
        showToast(data.error ?? 'Something went wrong', false);
      }
    } catch {
      showToast('Network error', false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = (orderId: string) => {
    const reason = window.prompt('Cancel reason (optional):');
    if (reason === null) return; // user pressed Cancel
    action(orderId, 'cancel', { reason }, 'Order cancelled');
  };

  // Active SLA deadline for a row
  const activeSlaDeadline = (o: OrderRow): string | null => {
    if (o.status === 'SELLER_NOTIFIED') return o.acceptanceSlaDeadline;
    if (o.status === 'ACCEPTED')        return o.packingSlaDeadline;
    return null;
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          background: toast.ok ? '#065f46' : '#991b1b',
          color: '#fff', padding: '10px 20px', borderRadius: 8,
          fontWeight: 600, fontSize: 14, boxShadow: '0 4px 12px rgba(0,0,0,.2)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: C.sidebar, padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/admin/dashboard')}
            style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', fontSize: 20 }}
          >←</button>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>
            Orders Management
          </h1>
        </div>
        <button
          onClick={() => { fetchOrders(); fetchStats(); }}
          style={{
            background: C.gold, color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}
        >
          ↻ Refresh
        </button>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Stats Row */}
        {stats && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(5,1fr)',
            gap: 12, marginBottom: 20,
          }}>
            {[
              { label: "Today's Orders",   value: stats.totalToday,        color: C.maroon },
              { label: 'Pending Acceptance',value: stats.pendingAcceptance, color: '#7c3aed' },
              { label: 'SLA At-Risk',       value: stats.slaAtRisk,         color: '#d97706' },
              { label: 'Fraud Hold',        value: stats.fraudHold,         color: '#dc2626' },
              { label: 'Delivered Today',   value: stats.deliveredToday,    color: '#059669' },
            ].map(s => (
              <div key={s.label} style={{
                background: '#fff', borderRadius: 12,
                padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                borderLeft: `4px solid ${s.color}`,
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, borderBottom: `2px solid ${C.border}`,
          marginBottom: 16, overflowX: 'auto',
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 16px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                borderBottom: tab === t.key ? `3px solid ${C.gold}` : '3px solid transparent',
                color: tab === t.key ? C.gold : C.muted,
                marginBottom: -2,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <input
            placeholder="Search order number or customer ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, maxWidth: 360, padding: '8px 14px', borderRadius: 8,
              border: `1px solid ${C.border}`, fontSize: 13, outline: 'none',
            }}
          />
          <span style={{ fontSize: 13, color: C.muted }}>{total} orders</span>
          {tab === 'sla-breach' && (
            <span style={{
              fontSize: 12, color: '#dc2626', fontWeight: 600,
              background: '#fee2e2', padding: '4px 10px', borderRadius: 6,
            }}>
              Auto-refresh: 60s
            </span>
          )}
        </div>

        {/* Table */}
        <div style={{
          background: '#fff', borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,.07)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.sidebar }}>
                {['Order', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Risk', 'SLA', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, color: '#ccc', letterSpacing: .5, whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: C.muted }}>
                  Loading…
                </td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: C.muted }}>
                  No orders found
                </td></tr>
              ) : orders.map((o, i) => {
                const sla = activeSlaDeadline(o);
                return (
                  <tr
                    key={o.id}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: i % 2 === 0 ? '#fff' : '#faf9fb',
                      cursor: 'pointer',
                      transition: 'background .1s',
                    }}
                    onClick={() => openDrawer(o.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f0f4')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#faf9fb')}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.maroon }}>{o.orderNumber}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{o.customerName}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{o.customerEmail}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'center' }}>
                      {o.itemCount}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>
                      {fmtINR(o.total)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px',
                        borderRadius: 99, background: '#f3f4f6', color: '#374151',
                      }}>
                        {o.paymentMethod ?? 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <StatusBadge status={o.status} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <RiskBadge riskStatus={o.riskStatus} riskScore={o.riskScore} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {sla ? <SlaCountdown deadline={sla} /> : (
                        <span style={{ fontSize: 12, color: C.muted }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>
                      {fmtDate(o.createdAt)}
                    </td>
                    <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(o.status === 'SELLER_NOTIFIED' || o.status === 'ACCEPTED') && (
                          <ActionBtn
                            label="Nudge"
                            color="#7c3aed"
                            loading={actionLoading === 'nudge-seller'}
                            onClick={() => action(o.id, 'nudge-seller', undefined, 'Seller nudged')}
                          />
                        )}
                        {(o.status === 'SELLER_NOTIFIED' || o.status === 'ACCEPTED') && (
                          <ActionBtn
                            label="+1h"
                            color={C.gold}
                            loading={actionLoading === 'sla-extend'}
                            onClick={() => action(o.id, 'sla-extend', undefined, 'SLA extended +1h')}
                          />
                        )}
                        {o.riskStatus === 'HOLD' && (
                          <ActionBtn
                            label="Approve"
                            color="#059669"
                            loading={actionLoading === 'approve-hold'}
                            onClick={() => action(o.id, 'approve-hold', undefined, 'Order approved')}
                          />
                        )}
                        {!['DELIVERED', 'CANCELLED', 'RETURNED'].includes(o.status) && (
                          <ActionBtn
                            label="Cancel"
                            color="#dc2626"
                            loading={actionLoading === 'cancel'}
                            onClick={() => handleCancel(o.id)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <PagBtn disabled={page === 1}          onClick={() => setPage(1)}>«</PagBtn>
            <PagBtn disabled={page === 1}          onClick={() => setPage(p => p - 1)}>‹</PagBtn>
            <span style={{ padding: '6px 14px', fontSize: 13, color: C.text }}>
              Page {page} of {totalPages}
            </span>
            <PagBtn disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</PagBtn>
            <PagBtn disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</PagBtn>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      {(drawerLoading || drawer) && (
        <OrderDrawer
          order={drawer}
          loading={drawerLoading}
          actionLoading={actionLoading}
          onClose={() => { setDrawer(null); }}
          onAction={action}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionBtn({
  label, color, loading, onClick,
}: { label: string; color: string; loading: boolean; onClick: () => void }) {
  return (
    <button
      disabled={loading}
      onClick={onClick}
      style={{
        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
        border: `1px solid ${color}`, color, background: 'transparent',
        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .5 : 1,
      }}
    >
      {label}
    </button>
  );
}

function PagBtn({ disabled, onClick, children }: any) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e0e3',
        background: disabled ? '#f9f9f9' : '#fff', cursor: disabled ? 'default' : 'pointer',
        fontSize: 14, color: disabled ? '#ccc' : C.maroon,
      }}
    >
      {children}
    </button>
  );
}

// ─── Order Drawer ─────────────────────────────────────────────────────────────

function OrderDrawer({
  order, loading, actionLoading, onClose, onAction, onCancel,
}: {
  order:         OrderDetail | null;
  loading:       boolean;
  actionLoading: string | null;
  onClose:       () => void;
  onAction:      (id: string, ep: string, body?: object, msg?: string) => void;
  onCancel:      (id: string) => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 100,
        }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 560,
        background: '#fff', zIndex: 101, overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0,0,0,.15)',
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading…</div>
        ) : order ? (
          <DrawerContent
            order={order}
            actionLoading={actionLoading}
            onClose={onClose}
            onAction={onAction}
            onCancel={onCancel}
          />
        ) : null}
      </div>
    </>
  );
}

function DrawerContent({ order, actionLoading, onClose, onAction, onCancel }: {
  order: OrderDetail;
  actionLoading: string | null;
  onClose: () => void;
  onAction: (id: string, ep: string, body?: object, msg?: string) => void;
  onCancel: (id: string) => void;
}) {
  const addr = order.shippingAddress ?? {};
  const stepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.maroon }}>{order.orderNumber}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <StatusBadge status={order.status} />
            <RiskBadge riskStatus={order.riskStatus} riskScore={order.riskScore} />
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', fontSize: 22,
          cursor: 'pointer', color: C.muted,
        }}></button>
      </div>

      <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '12px 0' }} />

      {/* Status Timeline */}
      <Section title="Status Timeline">
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', padding: '4px 0' }}>
          {STATUS_STEPS.map((s, i) => {
            const done    = i <= stepIdx;
            const current = i === stepIdx;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: current ? C.gold : done ? C.maroon : '#e5e7eb',
                    border: current ? `3px solid ${C.gold}` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {done && !current && <span style={{ color: '#fff', fontSize: 11 }}></span>}
                  </div>
                  <div style={{
                    fontSize: 9, marginTop: 3, textAlign: 'center',
                    color: done ? C.maroon : C.muted, fontWeight: done ? 600 : 400,
                    lineHeight: 1.2, maxWidth: 60,
                  }}>
                    {s.replace(/_/g, '\n')}
                  </div>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, background: i < stepIdx ? C.maroon : '#e5e7eb',
                    minWidth: 8, marginBottom: 20,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Customer & Seller */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <InfoCard title="Customer">
          <InfoRow label="Name"  value={order.customerName} />
          <InfoRow label="Email" value={order.customerEmail} />
          <InfoRow label="Phone" value={order.customerPhone} />
          <InfoRow label="Address" value={[addr.house, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')} />
        </InfoCard>
        <InfoCard title="Seller">
          <InfoRow label="Name"  value={order.sellerName} />
          <InfoRow label="Email" value={order.sellerEmail} />
          <InfoRow label="Phone" value={order.sellerPhone} />
        </InfoCard>
      </div>

      {/* Items */}
      <Section title={`Items (${order.items.length})`}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9f5f7' }}>
              {['Product', 'Qty', 'Unit Price', 'Total'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, color: C.muted, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: '8px 10px' }}>
                  <div style={{ fontWeight: 600 }}>{item.productName}</div>
                  {item.sku && <div style={{ fontSize: 11, color: C.muted }}>SKU: {item.sku}</div>}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '8px 10px' }}>{fmtINR(item.unitPrice)}</td>
                <td style={{ padding: '8px 10px', fontWeight: 600 }}>{fmtINR(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Payment Breakdown */}
      <Section title="Payment">
        <PayRow label="Subtotal"       value={fmtINR(order.subtotal)} />
        <PayRow label="Shipping"       value={fmtINR(order.shippingCharge)} />
        <PayRow label="Total"          value={fmtINR(order.subtotal + order.shippingCharge)} bold />
        <PayRow label="Platform Fee"   value={fmtINR(order.platformFee)} muted />
        <PayRow label="PG Fee"         value={fmtINR(order.pgFee)} muted />
        <PayRow label="Seller Payout"  value={fmtINR(order.sellerPayoutAmount)} />
        <PayRow label="Payment Method" value={order.paymentMethod ?? 'N/A'} />
      </Section>

      {/* Risk Flags */}
      {order.riskFlags.length > 0 && (
        <Section title={`Risk Flags (score: ${order.riskScore})`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {order.riskFlags.map(f => (
              <div key={f.id} style={{
                background: '#fee2e2', color: '#991b1b',
                padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              }}>
                {f.flagType.replace(/_/g, ' ')}
                {f.flagValue ? ` (${f.flagValue})` : ''}
                {' '}+{f.scoreContribution}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tracking */}
      {(order.awbNumber || order.courierPartner) && (
        <Section title="Tracking">
          <InfoRow label="AWB"     value={order.awbNumber ?? '—'} />
          <InfoRow label="Courier" value={order.courierPartner ?? '—'} />
          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: C.gold, fontWeight: 600 }}
            >
              Track Shipment →
            </a>
          )}
        </Section>
      )}

      {/* Admin Actions */}
      <Section title="Admin Actions">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {(order.status === 'SELLER_NOTIFIED' || order.status === 'ACCEPTED') && (
            <DrawerActionBtn
              label="Nudge Seller"
              color="#7c3aed"
              loading={actionLoading === 'nudge-seller'}
              onClick={() => onAction(order.id, 'nudge-seller', undefined, 'Seller nudged')}
            />
          )}
          {(order.status === 'SELLER_NOTIFIED' || order.status === 'ACCEPTED') && (
            <DrawerActionBtn
              label="Extend SLA +1h"
              color={C.gold}
              loading={actionLoading === 'sla-extend'}
              onClick={() => onAction(order.id, 'sla-extend', undefined, 'SLA extended +1h')}
            />
          )}
          {order.riskStatus === 'HOLD' && (
            <DrawerActionBtn
              label="Approve (Clear Hold)"
              color="#059669"
              loading={actionLoading === 'approve-hold'}
              onClick={() => onAction(order.id, 'approve-hold', undefined, 'Order approved')}
            />
          )}
          {!['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status) && (
            <DrawerActionBtn
              label="Cancel Order"
              color="#dc2626"
              loading={actionLoading === 'cancel'}
              onClick={() => onCancel(order.id)}
            />
          )}
        </div>
      </Section>

      {/* Status History */}
      <Section title="History Log">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {order.statusHistory.map(h => (
            <div key={h.id} style={{
              borderLeft: `3px solid ${C.gold}`, paddingLeft: 12, fontSize: 12,
            }}>
              <div style={{ fontWeight: 700, color: C.maroon }}>
                {h.fromStatus ? `${h.fromStatus} → ` : ''}{h.toStatus}
                <span style={{ fontWeight: 400, color: C.muted, marginLeft: 8 }}>
                  [{h.actorType}]
                </span>
              </div>
              {h.note && <div style={{ color: C.text, marginTop: 2 }}>{h.note}</div>}
              <div style={{ color: C.muted, marginTop: 2 }}>{fmtDate(h.createdAt)}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Payout */}
      {order.payout && (
        <Section title="Seller Payout">
          <PayRow label="Gross Amount"       value={fmtINR(order.payout.grossAmount)} />
          <PayRow label="Shipping Deduction" value={`-${fmtINR(order.payout.shippingDeduction)}`} muted />
          <PayRow label="PG Fee Deduction"   value={`-${fmtINR(order.payout.pgFeeDeduction)}`} muted />
          <PayRow label="Net Payout"         value={fmtINR(order.payout.netPayout)} bold />
          <PayRow label="Status"             value={order.payout.status} />
          {order.payout.payoutDate && (
            <PayRow label="Payout Date" value={fmtDate(order.payout.payoutDate)} />
          )}
        </Section>
      )}
    </div>
  );
}

// ─── Reusable Drawer Sub-components ──────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11, fontWeight: 800, letterSpacing: 1, color: C.muted,
        textTransform: 'uppercase', marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#faf7f8', borderRadius: 8, padding: '12px 16px',
      border: `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: .5, marginBottom: 8 }}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 12 }}>
      <span style={{ color: C.muted, minWidth: 52 }}>{label}:</span>
      <span style={{ fontWeight: 600, color: C.text, wordBreak: 'break-word' }}>{value || '—'}</span>
    </div>
  );
}

function PayRow({ label, value, bold, muted }: {
  label: string; value: string; bold?: boolean; muted?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '4px 0', fontSize: 13, borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ color: muted ? C.muted : C.text }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: bold ? C.maroon : C.text }}>{value}</span>
    </div>
  );
}

function DrawerActionBtn({ label, color, loading, onClick }: {
  label: string; color: string; loading: boolean; onClick: () => void;
}) {
  return (
    <button
      disabled={loading}
      onClick={onClick}
      style={{
        padding: '8px 16px', borderRadius: 8, border: `2px solid ${color}`,
        background: loading ? '#f3f4f6' : color, color: '#fff',
        fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? .6 : 1,
      }}
    >
      {loading ? '…' : label}
    </button>
  );
}
