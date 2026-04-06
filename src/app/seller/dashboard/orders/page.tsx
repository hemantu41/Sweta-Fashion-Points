'use client';

/**
 * Seller Dashboard — Orders Module
 * Tabs: Pending | Accepted | Ready to Ship | Shipped | Delivered | Cancelled
 * Mobile-first card layout.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

// ─── Brand ────────────────────────────────────────────────────────────────────
const C = {
  sidebar: '#3D0E2A',
  gold:    '#C49A3C',
  maroon:  '#5B1A3A',
  bg:      '#FAF7F8',
  border:  '#EAE0E6',
  text:    '#1a1a1a',
  muted:   '#6b7280',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id:             string;
  productId:      string;
  productName:    string;
  variantDetails: any;
  quantity:       number;
  unitPrice:      number;
  totalPrice:     number;
  sku:            string | null;
  imageUrl:       string | null;
}

interface OrderRow {
  id:                    string;
  orderNumber:           string;
  status:                string;
  paymentMethod:         string | null;
  subtotal:              number;
  shippingCharge:        number;
  total:                 number;
  acceptanceSlaDeadline: string | null;
  packingSlaDeadline:    string | null;
  deliveredAt:           string | null;
  awbNumber:             string | null;
  courierPartner:        string | null;
  trackingUrl:           string | null;
  createdAt:             string;
  deliveryCity:          string;
  deliveryPincode:       string;
  items:                 OrderItem[];
  payout: {
    status:     string;
    payoutDate: string | null;
    netPayout:  number;
    grossAmount:number;
  } | null;
}

interface OrderDetail extends OrderRow {
  deliveryState:      string;
  paymentStatus:      string | null;
  platformFee:        number;
  pgFee:              number;
  sellerPayoutAmount: number;
  notes:              string | null;
  statusHistory: {
    id:         string;
    fromStatus: string | null;
    toStatus:   string;
    actorType:  string;
    note:       string | null;
    createdAt:  string;
  }[];
}

interface Stats {
  newOrders:      number;
  pendingAction:  number;
  packed:         number;
  inTransit:      number;
  deliveredMonth: number;
}

// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS = [
  { key: 'pending',   label: 'Pending',        badge: 'newOrders'     },
  { key: 'accepted',  label: 'Accepted',        badge: null            },
  { key: 'ready',     label: 'Ready to Ship',   badge: null            },
  { key: 'shipped',   label: 'Shipped',         badge: null            },
  { key: 'delivered', label: 'Delivered',       badge: null            },
  { key: 'cancelled', label: 'Cancelled',       badge: null            },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── SLA Countdown ────────────────────────────────────────────────────────────

function SlaCountdown({ deadline, compact }: { deadline: string; compact?: boolean }) {
  const [ms, setMs] = useState(new Date(deadline).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setMs(new Date(deadline).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (ms <= 0) {
    return (
      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
        SLA BREACHED
      </span>
    );
  }

  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const isRed    = ms < 30 * 60 * 1000;
  const isPulse  = ms < 10 * 60 * 1000;
  const timeStr  = compact ? `${h}h ${m}m` : `${h}h ${m}m ${s}s`;

  return (
    <span
      className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${isPulse ? 'animate-pulse' : ''}`}
      style={{
        color:      isRed ? '#dc2626' : '#d97706',
        background: isRed ? '#fee2e2' : '#fef3c7',
      }}
    >
      ⏱ {timeStr}
    </span>
  );
}

// ─── Pack Modal ───────────────────────────────────────────────────────────────

function PackModal({
  order,
  onConfirm,
  onClose,
  loading,
}: {
  order:     OrderRow;
  onConfirm: (photoUrl?: string) => void;
  onClose:   () => void;
  loading:   boolean;
}) {
  const [checked, setChecked] = useState([false, false, false]);
  const [photoUrl, setPhotoUrl] = useState('');
  const allChecked = checked.every(Boolean);

  const checklist = [
    'Packed in opaque, non-transparent material',
    'No external branding or MRP visible on outer box',
    'Label printed and affixed securely',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b" style={{ borderColor: C.border }}>
          <h3 className="font-bold text-lg" style={{ color: C.maroon }}>Confirm Packaging</h3>
          <p className="text-sm mt-1" style={{ color: C.muted }}>{order.orderNumber}</p>
        </div>
        <div className="p-5 space-y-4">
          {/* Checklist */}
          <div className="space-y-3">
            {checklist.map((item, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => {
                    const n = [...checked];
                    n[i] = !n[i];
                    setChecked(n);
                  }}
                  className="mt-0.5 w-4 h-4 accent-[#C49A3C]"
                />
                <span className="text-sm" style={{ color: C.text }}>{item}</span>
              </label>
            ))}
          </div>
          {/* Optional photo URL */}
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.muted }}>
              PACKED PHOTO URL (optional)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={e => setPhotoUrl(e.target.value)}
              placeholder="Paste image URL or leave blank"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{ borderColor: C.border }}
            />
          </div>
        </div>
        <div className="p-5 flex gap-3 justify-end border-t" style={{ borderColor: C.border }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold border"
            style={{ borderColor: C.border, color: C.muted }}
          >
            Cancel
          </button>
          <button
            disabled={!allChecked || loading}
            onClick={() => onConfirm(photoUrl || undefined)}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
            style={{ background: allChecked ? C.gold : '#d1d5db', cursor: allChecked ? 'pointer' : 'not-allowed' }}
          >
            {loading ? 'Confirming…' : 'Confirm Packed ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Detail Drawer ──────────────────────────────────────────────────────

function OrderDrawer({
  order, sellerId, onClose, onAction,
}: {
  order:    OrderDetail;
  sellerId: string;
  onClose:  () => void;
  onAction: () => void;
}) {
  const STATUS_STEPS = [
    'PENDING_PAYMENT', 'CONFIRMED', 'SELLER_NOTIFIED', 'ACCEPTED',
    'PACKED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED',
  ];
  const stepIdx = STATUS_STEPS.indexOf(order.status);

  const handleLabel = async () => {
    const res = await fetch(`/api/seller/orders/${order.id}/label?sellerId=${sellerId}`);
    const data = await res.json();
    if (res.ok && data.labelUrl) {
      window.open(data.labelUrl, '_blank');
    } else if (res.ok && data.trackingUrl) {
      window.open(data.trackingUrl, '_blank');
    } else {
      alert(data.error ?? 'Label not available yet');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 bg-white overflow-y-auto"
        style={{ width: 520, boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xl font-bold" style={{ color: C.maroon }}>{order.orderNumber}</div>
              <div className="text-sm mt-1" style={{ color: C.muted }}>{fmtDateTime(order.createdAt)}</div>
            </div>
            <button onClick={onClose} className="text-2xl leading-none" style={{ color: C.muted }}>✕</button>
          </div>

          {/* Timeline stepper */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex items-center min-w-max gap-0">
              {STATUS_STEPS.map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center" style={{ minWidth: 52 }}>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                      style={{
                        background: i < stepIdx ? C.maroon : i === stepIdx ? C.gold : '#e5e7eb',
                      }}
                    >
                      {i < stepIdx ? '✓' : ''}
                    </div>
                    <div
                      className="text-center mt-1 leading-tight"
                      style={{
                        fontSize: 8, maxWidth: 52,
                        color: i <= stepIdx ? C.maroon : C.muted,
                        fontWeight: i === stepIdx ? 700 : 400,
                      }}
                    >
                      {s.replace(/_/g, '\n')}
                    </div>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className="mb-4"
                      style={{ width: 16, height: 2, background: i < stepIdx ? C.maroon : '#e5e7eb' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <DrawerSection title={`Items (${order.items.length})`}>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-3 items-start">
                  {item.imageUrl ? (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-2xl">
                      📦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{item.productName}</div>
                    {item.variantDetails && Object.keys(item.variantDetails).length > 0 && (
                      <div className="text-xs mt-0.5" style={{ color: C.muted }}>
                        {Object.entries(item.variantDetails).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </div>
                    )}
                    <div className="text-xs mt-0.5" style={{ color: C.muted }}>
                      Qty: {item.quantity} × {fmtINR(item.unitPrice)} = {fmtINR(item.totalPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DrawerSection>

          {/* Payment */}
          <DrawerSection title="Payment">
            <DrawerRow label="Subtotal"   value={fmtINR(order.subtotal)} />
            <DrawerRow label="Shipping"   value={fmtINR(order.shippingCharge)} />
            <DrawerRow label="Total"      value={fmtINR(order.total)} bold />
            <DrawerRow label="Payment"    value={order.paymentMethod ?? 'N/A'} />
            <DrawerRow label="Your Payout" value={fmtINR(order.sellerPayoutAmount)} />
          </DrawerSection>

          {/* Delivery */}
          <DrawerSection title="Delivery">
            <DrawerRow label="Location" value={`${order.deliveryCity}, ${order.deliveryState} – ${order.deliveryPincode}`} />
            {order.awbNumber && <DrawerRow label="AWB" value={order.awbNumber} />}
            {order.courierPartner && <DrawerRow label="Courier" value={order.courierPartner} />}
            {order.trackingUrl && (
              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm font-semibold block mt-2" style={{ color: C.gold }}>
                Track Shipment →
              </a>
            )}
          </DrawerSection>

          {/* Payout (if delivered) */}
          {order.payout && (
            <DrawerSection title="Payout">
              <DrawerRow label="Gross Amount" value={fmtINR(order.payout.grossAmount)} />
              <DrawerRow label="Net Payout"   value={fmtINR(order.payout.netPayout)} bold />
              <DrawerRow label="Status"       value={order.payout.status} />
              {order.payout.payoutDate && (
                <DrawerRow label="Payout Date" value={fmtDate(order.payout.payoutDate)} />
              )}
            </DrawerSection>
          )}

          {/* Download Label */}
          {order.awbNumber && (
            <button
              onClick={handleLabel}
              className="w-full py-3 rounded-xl text-sm font-bold mb-3 border-2"
              style={{ borderColor: C.gold, color: C.gold }}
            >
              📄 Download Shipping Label
            </button>
          )}

          {/* Status History */}
          <DrawerSection title="History">
            <div className="space-y-3">
              {order.statusHistory.map(h => (
                <div key={h.id} className="pl-3 border-l-2" style={{ borderColor: C.gold }}>
                  <div className="text-xs font-bold" style={{ color: C.maroon }}>
                    {h.fromStatus ? `${h.fromStatus} → ` : ''}{h.toStatus}
                    <span className="ml-2 font-normal" style={{ color: C.muted }}>[{h.actorType}]</span>
                  </div>
                  {h.note && <div className="text-xs mt-0.5" style={{ color: C.text }}>{h.note}</div>}
                  <div className="text-xs mt-0.5" style={{ color: C.muted }}>{fmtDateTime(h.createdAt)}</div>
                </div>
              ))}
            </div>
          </DrawerSection>
        </div>
      </div>
    </>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function DrawerRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 border-b text-sm" style={{ borderColor: C.border }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: bold ? C.maroon : C.text }}>{value}</span>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  sellerId,
  onOpenDrawer,
  onAccept,
  onPack,
  onReady,
  actionLoading,
}: {
  order:         OrderRow;
  sellerId:      string;
  onOpenDrawer:  (id: string) => void;
  onAccept:      (order: OrderRow) => void;
  onPack:        (order: OrderRow) => void;
  onReady:       (order: OrderRow) => void;
  actionLoading: string | null;
}) {
  const sla = order.status === 'SELLER_NOTIFIED'
    ? order.acceptanceSlaDeadline
    : order.status === 'ACCEPTED'
    ? order.packingSlaDeadline
    : null;

  const firstItem = order.items[0];
  const moreItems = order.items.length > 1 ? `+${order.items.length - 1} more` : null;
  const isLoading = actionLoading === order.id;

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden"
      style={{ borderColor: C.border, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: C.border, background: '#fdfbfc' }}
      >
        <div>
          <span className="font-bold text-sm" style={{ color: C.maroon }}>{order.orderNumber}</span>
          <span className="ml-2 text-xs" style={{ color: C.muted }}>{fmtDateTime(order.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Payment badge */}
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: order.paymentMethod === 'COD' ? '#fef3c7' : '#dbeafe',
              color:       order.paymentMethod === 'COD' ? '#92400e'  : '#1e40af',
            }}
          >
            {order.paymentMethod === 'COD' ? 'COD' : 'Prepaid'}
          </span>
          {/* SLA countdown */}
          {sla && <SlaCountdown deadline={sla} compact />}
        </div>
      </div>

      {/* Product row */}
      <div className="px-4 py-3 flex gap-3 items-start">
        {firstItem?.imageUrl ? (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
            <Image src={firstItem.imageUrl} alt={firstItem.productName} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl bg-[#f5eef5] flex-shrink-0 flex items-center justify-center text-3xl">
            📦
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{firstItem?.productName ?? '—'}</div>
          {firstItem?.variantDetails && Object.keys(firstItem.variantDetails).length > 0 && (
            <div className="text-xs mt-0.5" style={{ color: C.muted }}>
              {Object.entries(firstItem.variantDetails).map(([k, v]) => `${v}`).join(' · ')}
            </div>
          )}
          <div className="text-xs mt-0.5" style={{ color: C.muted }}>
            Qty {firstItem?.quantity ?? 1}
            {moreItems && <span className="ml-2 font-semibold" style={{ color: C.gold }}>{moreItems}</span>}
          </div>
        </div>
      </div>

      {/* Footer row: location, amount */}
      <div
        className="px-4 py-2.5 flex items-center justify-between border-t"
        style={{ borderColor: C.border, background: '#fdfbfc' }}
      >
        <div className="text-xs" style={{ color: C.muted }}>
          📍 {order.deliveryCity || '—'}, {order.deliveryPincode || '—'}
        </div>
        <div className="font-bold text-base" style={{ color: C.maroon }}>
          {fmtINR(order.total)}
        </div>
      </div>

      {/* AWB row (Shipped tab) */}
      {order.awbNumber && (
        <div className="px-4 py-2 border-t text-xs flex items-center justify-between" style={{ borderColor: C.border }}>
          <span style={{ color: C.muted }}>AWB: <span className="font-mono font-semibold" style={{ color: C.text }}>{order.awbNumber}</span></span>
          {order.courierPartner && <span style={{ color: C.muted }}>{order.courierPartner}</span>}
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
              className="font-semibold" style={{ color: C.gold }}>
              Track →
            </a>
          )}
        </div>
      )}

      {/* Payout row (Delivered tab) */}
      {order.payout && (
        <div className="px-4 py-2 border-t text-xs flex items-center justify-between" style={{ borderColor: C.border }}>
          <span style={{ color: C.muted }}>Payout: <span
            className="font-semibold"
            style={{ color: order.payout.status === 'PAID' ? '#059669' : '#d97706' }}
          >
            {order.payout.status}
          </span></span>
          <span style={{ color: C.muted }}>
            {fmtINR(order.payout.netPayout)}
            {order.payout.payoutDate ? ` · ${fmtDate(order.payout.payoutDate)}` : ''}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex gap-2.5 flex-wrap border-t" style={{ borderColor: C.border }}>
        {/* View Details — always shown */}
        <button
          onClick={() => onOpenDrawer(order.id)}
          className="flex-1 py-2 rounded-xl text-sm font-semibold border"
          style={{ borderColor: C.border, color: C.maroon }}
        >
          View Details
        </button>

        {/* PENDING → Accept */}
        {order.status === 'SELLER_NOTIFIED' && (
          <button
            disabled={isLoading}
            onClick={() => onAccept(order)}
            className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: isLoading ? '#d1d5db' : C.gold }}
          >
            {isLoading ? 'Accepting…' : 'Accept Order →'}
          </button>
        )}

        {/* ACCEPTED → Mark Packed */}
        {order.status === 'ACCEPTED' && (
          <button
            disabled={isLoading}
            onClick={() => onPack(order)}
            className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: isLoading ? '#d1d5db' : C.maroon }}
          >
            {isLoading ? 'Processing…' : 'Mark as Packed'}
          </button>
        )}

        {/* PACKED → Ready to Ship */}
        {order.status === 'PACKED' && (
          <button
            disabled={isLoading}
            onClick={() => onReady(order)}
            className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: isLoading ? '#d1d5db' : '#059669' }}
          >
            {isLoading ? 'Processing…' : 'Mark Ready to Ship'}
          </button>
        )}

        {/* READY_TO_SHIP / PICKUP_SCHEDULED */}
        {(order.status === 'READY_TO_SHIP' || order.status === 'PICKUP_SCHEDULED') && (
          <div
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-center"
            style={{ background: '#d1fae5', color: '#065f46' }}
          >
            Pickup Scheduled ✓
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const sellerId = user?.sellerId ?? '';

  const [tab,          setTab]          = useState<TabKey>('pending');
  const [orders,       setOrders]       = useState<OrderRow[]>([]);
  const [total,        setTotal]        = useState(0);
  const [totalPages,   setTotalPages]   = useState(0);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [drawer,       setDrawer]       = useState<OrderDetail | null>(null);
  const [drawerLoading,setDrawerLoading]= useState(false);
  const [packModal,    setPackModal]    = useState<OrderRow | null>(null);
  const [actionLoading,setActionLoading]= useState<string | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => { if (mountedRef.current) setToast(null); }, 4000);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!sellerId) return;
    const res = await fetch(`/api/seller/orders?sellerId=${sellerId}&stats=true`);
    if (res.ok) setStats(await res.json());
  }, [sellerId]);

  // ── Orders list ────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!sellerId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/seller/orders?sellerId=${encodeURIComponent(sellerId)}&tab=${tab}&page=${page}`,
      );
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [sellerId, tab, page]);

  useEffect(() => { setPage(1); }, [tab]);

  useEffect(() => {
    fetchStats();
    fetchOrders();
  }, [fetchStats, fetchOrders]);

  // ── Open drawer ────────────────────────────────────────────────────────────
  const openDrawer = async (id: string) => {
    setDrawerLoading(true);
    setDrawer(null);
    const res = await fetch(`/api/seller/orders/${id}?sellerId=${sellerId}`);
    if (res.ok) {
      const data = await res.json();
      setDrawer(data.order);
    }
    setDrawerLoading(false);
  };

  // ── Accept ─────────────────────────────────────────────────────────────────
  const handleAccept = async (order: OrderRow) => {
    setActionLoading(order.id);
    try {
      const res = await fetch(`/api/seller/orders/${order.id}/accept`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sellerId }),
      });
      const data = await res.json();
      if (res.ok) {
        const deadline = data.packingSlaDeadline
          ? ` Pack before ${new Date(data.packingSlaDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
          : '';
        showToast(`Order accepted!${deadline}`);
        fetchOrders();
        fetchStats();
      } else {
        showToast(data.error ?? 'Failed to accept', false);
      }
    } catch {
      showToast('Network error', false);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Pack confirm ───────────────────────────────────────────────────────────
  const handlePackConfirm = async (photoUrl?: string) => {
    if (!packModal) return;
    setActionLoading(packModal.id);
    try {
      const res = await fetch(`/api/seller/orders/${packModal.id}/pack`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sellerId, photoUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Order marked as packed!');
        setPackModal(null);
        fetchOrders();
        fetchStats();
      } else {
        showToast(data.error ?? 'Failed to pack', false);
      }
    } catch {
      showToast('Network error', false);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Ready to ship ──────────────────────────────────────────────────────────
  const handleReady = async (order: OrderRow) => {
    setActionLoading(order.id);
    try {
      const res = await fetch(`/api/seller/orders/${order.id}/ready`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sellerId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message ?? 'Pickup scheduled!');
        fetchOrders();
        fetchStats();
      } else {
        showToast(data.error ?? 'Failed to schedule pickup', false);
      }
    } catch {
      showToast('Network error', false);
    } finally {
      setActionLoading(null);
    }
  };

  if (!sellerId) {
    return <div className="p-8 text-center" style={{ color: C.muted }}>Loading…</div>;
  }

  const statCards = [
    { label: 'New Orders',       value: stats?.newOrders      ?? 0, color: C.maroon,   tab: 'pending'   },
    { label: 'Pending Action',   value: stats?.pendingAction  ?? 0, color: '#7c3aed',  tab: 'accepted'  },
    { label: 'Packed',           value: stats?.packed         ?? 0, color: C.gold,     tab: 'ready'     },
    { label: 'In Transit',       value: stats?.inTransit      ?? 0, color: '#0284c7',  tab: 'shipped'   },
    { label: 'Delivered (30d)',  value: stats?.deliveredMonth ?? 0, color: '#059669',  tab: 'delivered' },
  ];

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-xl"
          style={{ background: toast.ok ? '#065f46' : '#991b1b' }}
        >
          {toast.msg}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {statCards.map(s => (
          <button
            key={s.label}
            onClick={() => setTab(s.tab as TabKey)}
            className="bg-white rounded-2xl p-4 text-left transition-all hover:shadow-md"
            style={{
              borderLeft: `4px solid ${s.color}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: C.muted }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 border-b mb-5 overflow-x-auto"
        style={{ borderColor: C.border }}
      >
        {TABS.map(t => {
          const badge = t.badge ? (stats?.[t.badge as keyof Stats] ?? 0) : 0;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all"
              style={{
                borderBottom: tab === t.key ? `3px solid ${C.gold}` : '3px solid transparent',
                color:  tab === t.key ? C.gold   : C.muted,
                marginBottom: -1,
              }}
            >
              {t.label}
              {badge > 0 && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: C.maroon, color: '#fff', fontSize: 10 }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" style={{ borderColor: C.border }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16" style={{ color: C.muted }}>
          <div className="text-5xl mb-4">📭</div>
          <div className="font-semibold text-lg">No orders here</div>
          <div className="text-sm mt-1">
            {tab === 'pending' ? "You're all caught up! New orders will appear here." : `No ${tab} orders.`}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              sellerId={sellerId}
              onOpenDrawer={openDrawer}
              onAccept={handleAccept}
              onPack={o => setPackModal(o)}
              onReady={handleReady}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-40"
            style={{ borderColor: C.border, color: C.maroon }}
          >
            ← Prev
          </button>
          <span className="px-4 py-2 text-sm" style={{ color: C.muted }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-40"
            style={{ borderColor: C.border, color: C.maroon }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Pack modal */}
      {packModal && (
        <PackModal
          order={packModal}
          onConfirm={handlePackConfirm}
          onClose={() => setPackModal(null)}
          loading={actionLoading === packModal.id}
        />
      )}

      {/* Detail drawer */}
      {(drawerLoading || drawer) && (
        <>
          {drawerLoading && !drawer && (
            <>
              <div
                className="fixed inset-0 z-40"
                style={{ background: 'rgba(0,0,0,0.4)' }}
                onClick={() => setDrawerLoading(false)}
              />
              <div
                className="fixed right-0 top-0 bottom-0 z-50 bg-white flex items-center justify-center"
                style={{ width: 520 }}
              >
                <div className="animate-spin w-10 h-10 rounded-full border-4 border-t-transparent"
                  style={{ borderColor: C.gold, borderTopColor: 'transparent' }}
                />
              </div>
            </>
          )}
          {drawer && (
            <OrderDrawer
              order={drawer}
              sellerId={sellerId}
              onClose={() => setDrawer(null)}
              onAction={() => { fetchOrders(); fetchStats(); }}
            />
          )}
        </>
      )}
    </div>
  );
}
