'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { REJECTION_REASONS } from '@/lib/qc/constants';
import { getSlaLabel, getSlaPercent } from '@/lib/qc/constants';
import type {
  QCProduct,
  SLACounts,
  RejectionReasonId,
  Severity,
  NotifyResult,
} from '@/types/qc.types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#FAF8F5',
  surface: '#FFFFFF',
  surface2: '#F3F0EB',
  border: '#E8E3DC',
  borderStrong: '#D4CFC7',
  brand: '#8B2020',
  brandLight: '#FDF0F0',
  green: '#2D4A22',
  greenLight: '#EEF4EB',
  greenBorder: '#B8D9AF',
  amber: '#8B5E0A',
  amberLight: '#FEF6E7',
  amberBorder: '#EDD9B0',
  blue: '#1A3A6B',
  blueLight: '#EBF0F9',
  text: '#1A1714',
  text2: '#6B6560',
  text3: '#9E9892',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rupee = (n: number) => '₹' + n.toLocaleString('en-IN');
const discount = (price: number, mrp: number | null) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;

function slaColors(cls: string) {
  if (cls === 'urgent') return { bar: C.brand, pill: C.brand, pillBg: C.brandLight, border: C.brand };
  if (cls === 'warning') return { bar: C.amber, pill: C.amber, pillBg: C.amberLight, border: C.amberBorder };
  return { bar: C.green, pill: C.green, pillBg: C.greenLight, border: C.greenBorder };
}

// ─── Types local ─────────────────────────────────────────────────────────────
interface EventLogEntry {
  id: string;
  event: string;
  product: string;
  status: 'sent' | 'failed';
  time: string;
}

interface Toast {
  id: string;
  type: 'green' | 'red' | 'amber';
  title: string;
  body: string;
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function AdminQCPage() {
  const { user } = useAuth();

  // Queue state
  const [products, setProducts] = useState<QCProduct[]>([]);
  const [slaCounts, setSlaCounts] = useState<SLACounts>({ overdue: 0, warning: 0, onTrack: 0, resolvedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [sortBy, setSortBy] = useState<'oldest' | 'newest' | 'price'>('oldest');

  // Modals
  const [approveProduct, setApproveProduct] = useState<QCProduct | null>(null);
  const [rejectProduct, setRejectProduct] = useState<QCProduct | null>(null);
  const [approveNote, setApproveNote] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<Set<RejectionReasonId>>(new Set());
  const [severity, setSeverity] = useState<Severity>('minor');
  const [rejectNote, setRejectNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Right panel
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch queue ──
  const fetchQueue = useCallback(async () => {
    try {
      const adminId = user?.id ?? '';
      const res = await fetch(
        `/api/admin/qc/queue?status=${activeTab}&sortBy=${sortBy}&adminUserId=${adminId}`
      );
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setProducts(data.products ?? []);
      setSlaCounts(data.slaCounts ?? { overdue: 0, warning: 0, onTrack: 0, resolvedToday: 0 });
    } catch {
      // Keep existing state on error
    } finally {
      setLoading(false);
    }
  }, [activeTab, sortBy, user?.id]);

  useEffect(() => {
    setLoading(true);
    fetchQueue();
  }, [fetchQueue]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    refreshRef.current = setInterval(fetchQueue, 60_000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [fetchQueue]);

  // ── Toast ──
  const addToast = useCallback((type: Toast['type'], title: string, body: string) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, type, title, body }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  // ── Log events ──
  const pushEvents = useCallback((results: NotifyResult[], product: QCProduct) => {
    const entries: EventLogEntry[] = results.map((r) => ({
      id: crypto.randomUUID(),
      event: r.event,
      product: product.name,
      status: r.status,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }));
    setEventLog((log) => [...entries, ...log].slice(0, 50));
  }, []);

  // ── Approve ──
  const handleApprove = async () => {
    if (!approveProduct || !user?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/qc/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: approveProduct.id, adminUserId: user.id, note: approveNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      pushEvents(
        [...(data.notifyFired ?? []).map((e: string) => ({ event: e, status: 'sent' as const })),
         ...(data.notifyFailed ?? []).map((e: string) => ({ event: e, status: 'failed' as const }))],
        approveProduct
      );
      addToast('green', '✅ Approved!', `"${approveProduct.name}" is now live. ${data.notifyFired?.length ?? 0} notify events fired.`);
      setApproveProduct(null);
      setApproveNote('');
      fetchQueue();
    } catch (err: any) {
      addToast('red', 'Approval failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reject ──
  const handleReject = async () => {
    if (!rejectProduct || !user?.id || selectedReasons.size === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/qc/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: rejectProduct.id,
          adminUserId: user.id,
          reasons: Array.from(selectedReasons),
          severity,
          note: rejectNote || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      pushEvents(
        [...(data.notifyFired ?? []).map((e: string) => ({ event: e, status: 'sent' as const })),
         ...(data.notifyFailed ?? []).map((e: string) => ({ event: e, status: 'failed' as const }))],
        rejectProduct
      );
      addToast('red', '❌ Rejected', `"${rejectProduct.name}" rejected with ${selectedReasons.size} reason(s). Seller notified.`);
      setRejectProduct(null);
      setSelectedReasons(new Set());
      setSeverity('minor');
      setRejectNote('');
      fetchQueue();
    } catch (err: any) {
      addToast('red', 'Rejection failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReason = (id: RejectionReasonId) => {
    setSelectedReasons((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; }
          to   { opacity: 0; transform: translateX(24px); }
        }
        .qc-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.09) !important; }
        .reason-tag:hover { border-color: ${C.brand} !important; background: ${C.brandLight} !important; }
        .sort-btn:hover { background: ${C.surface2} !important; }
        .tab-btn:hover { background: ${C.surface2} !important; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${C.surface2}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>

        {/* ════ NAVBAR ════ */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: '0 28px', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: C.brand }}>
              Insta Fashion Points
            </span>
            <span style={{ color: C.text3, fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: C.text2, fontWeight: 500 }}>Admin QC Review</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Bell with unread dot */}
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              {eventLog.filter(e => e.status === 'sent').length > 0 && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 9, height: 9, borderRadius: '50%',
                  background: C.brand, border: `2px solid ${C.surface}`,
                }} />
              )}
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: C.brand, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
          </div>
        </nav>

        {/* ════ PAGE HEADER ════ */}
        <div style={{ padding: '24px 28px 0' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, margin: 0, color: C.text }}>
            Product QC Review Queue
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.text2 }}>
            Review pending submissions · Approve or reject with structured reasons · Sellers notified instantly
          </p>
        </div>

        {/* ════ SLA STAT CARDS ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, padding: '20px 28px 0' }}>
          {[
            { label: 'Overdue (>24h)', value: slaCounts.overdue, color: C.brand, bg: C.brandLight, border: C.brand, icon: '🔴' },
            { label: 'Warning (12–24h)', value: slaCounts.warning, color: C.amber, bg: C.amberLight, border: C.amberBorder, icon: '🟡' },
            { label: 'On Track (<12h)', value: slaCounts.onTrack, color: C.green, bg: C.greenLight, border: C.greenBorder, icon: '🟢' },
            { label: 'Resolved Today', value: slaCounts.resolvedToday, color: C.text, bg: C.surface, border: C.border, icon: '✅' },
          ].map((s) => (
            <div key={s.label} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${s.border}`,
              borderRadius: 10, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 1px 3px rgba(0,0,0,.05)',
            }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1,
                }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 4, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ════ TABS ════ */}
        <div style={{ padding: '18px 28px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          {(['pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              className="tab-btn"
              onClick={() => setActiveTab(tab)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, fontWeight: 600,
                padding: '7px 18px', borderRadius: 20,
                border: `1.5px solid ${activeTab === tab ? C.brand : C.border}`,
                background: activeTab === tab ? C.brand : C.surface,
                color: activeTab === tab ? '#fff' : C.text2,
                cursor: 'pointer', transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'pending' && slaCounts.overdue + slaCounts.warning + slaCounts.onTrack > 0 && (
                <span style={{
                  background: activeTab === 'pending' ? 'rgba(255,255,255,.25)' : C.brandLight,
                  color: activeTab === 'pending' ? '#fff' : C.brand,
                  borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700,
                }}>
                  {slaCounts.overdue + slaCounts.warning + slaCounts.onTrack}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ════ SORT ROW ════ */}
        <div style={{ padding: '12px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: C.text2 }}>
            <strong style={{ color: C.text }}>{products.length}</strong> products · {activeTab}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['oldest', 'newest', 'price'] as const).map((s) => (
              <button
                key={s}
                className="sort-btn"
                onClick={() => setSortBy(s)}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12, fontWeight: 500,
                  padding: '5px 12px', borderRadius: 8,
                  border: `1px solid ${sortBy === s ? C.text : C.border}`,
                  background: sortBy === s ? C.text : C.surface,
                  color: sortBy === s ? '#fff' : C.text2,
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                {s === 'oldest' ? 'Oldest first' : s === 'newest' ? 'Newest first' : 'Price ↓'}
              </button>
            ))}
          </div>
        </div>

        {/* ════ MAIN 2-COLUMN ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, padding: '16px 28px 48px' }}>

          {/* ── Product Queue ── */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.text2 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
                Loading queue…
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.text2 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
                <strong>Queue is clear!</strong>
                <div style={{ fontSize: 13, marginTop: 4 }}>No {activeTab} products right now.</div>
              </div>
            ) : (
              products.map((p) => {
                const cls = p.slaClass ?? 'ok';
                const col = slaColors(cls);
                const disc = discount(p.price, p.original_price);
                return (
                  <div
                    key={p.id}
                    className="qc-card"
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${col.border}`,
                      borderRadius: 10, marginBottom: 12,
                      boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                      overflow: 'hidden', transition: 'box-shadow .15s',
                    }}
                  >
                    {/* Card body */}
                    <div style={{ display: 'flex', gap: 14, padding: '14px 16px' }}>
                      {/* Thumbnail */}
                      <div style={{
                        width: 52, height: 52, borderRadius: 8, flexShrink: 0,
                        background: C.surface2, border: `1px solid ${C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, overflow: 'hidden',
                      }}>
                        {p.main_image
                          ? <img src={p.main_image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : '📦'}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: C.text, lineHeight: 1.3 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: C.text3, marginTop: 2, fontFamily: 'monospace' }}>
                              {p.product_id ?? p.id.slice(0, 8)}
                            </div>
                            <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>
                              {p.category}{p.sub_category ? ` · ${p.sub_category}` : ''} · <em>{p.seller_name}</em>
                            </div>
                          </div>
                          {/* Right: SLA pill + price */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                              background: col.pillBg, color: col.pill, border: `1px solid ${col.border}`,
                              letterSpacing: '.03em',
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.pill, display: 'inline-block' }} />
                              {getSlaLabel(p.created_at)}
                            </span>
                            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: C.text }}>
                              {rupee(p.price)}
                            </div>
                            {disc && (
                              <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>{disc}% off</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SLA progress bar */}
                    <div style={{ height: 3, background: C.surface2 }}>
                      <div style={{
                        height: 3, background: col.bar,
                        width: `${getSlaPercent(p.created_at)}%`,
                        transition: 'width .6s ease',
                      }} />
                    </div>

                    {/* Card footer */}
                    <div style={{
                      padding: '8px 16px', borderTop: `1px solid ${C.border}`,
                      background: C.surface2,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: 8,
                    }}>
                      <span style={{ fontSize: 12, color: C.text3 }}>
                        Submitted {getSlaLabel(p.created_at)}
                      </span>

                      {p.approval_status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => { setRejectProduct(p); setSelectedReasons(new Set()); setSeverity('minor'); setRejectNote(''); }}
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 7,
                              border: `1.5px solid #DDBBB8`, background: C.brandLight,
                              color: C.brand, cursor: 'pointer',
                            }}
                          >✕ Reject with reasons</button>
                          <button
                            onClick={() => { setApproveProduct(p); setApproveNote(''); }}
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 7,
                              border: `1.5px solid ${C.greenBorder}`, background: C.greenLight,
                              color: C.green, cursor: 'pointer',
                            }}
                          >✓ Approve</button>
                        </div>
                      )}
                      {p.approval_status === 'approved' && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                          background: C.greenLight, color: C.green, border: `1px solid ${C.greenBorder}`,
                        }}>● Live for customers</span>
                      )}
                      {p.approval_status === 'rejected' && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                          background: C.brandLight, color: C.brand, border: `1px solid #DDBBB8`,
                        }}>⏳ Awaiting seller resubmit</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div style={{ position: 'sticky', top: 76, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* notify.* Event Log */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{
                padding: '12px 14px', borderBottom: `1px solid ${C.border}`,
                background: C.surface2,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: C.text }}>
                  📡 notify.* Event Log
                  <span style={{
                    background: C.green, color: '#fff', borderRadius: 10,
                    padding: '1px 7px', fontSize: 10, fontWeight: 700,
                    letterSpacing: '.04em',
                  }}>● Wired</span>
                </div>
                <button
                  onClick={() => setEventLog([])}
                  style={{ background: 'none', border: 'none', fontSize: 11, color: C.text3, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >Clear</button>
              </div>
              <div style={{ maxHeight: 340, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {eventLog.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 16px', color: C.text3, fontSize: 12 }}>
                    <div style={{ fontSize: 22, marginBottom: 8, opacity: .5 }}>📭</div>
                    No events yet.<br />Approve or reject to see live events.
                  </div>
                ) : (
                  eventLog.map((e) => (
                    <div key={e.id} style={{
                      border: `1px solid ${C.border}`, borderRadius: 7,
                      padding: '9px 11px', background: C.surface2,
                      animation: 'slideUp .2s ease',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: C.brand }}>{e.event}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: '.05em',
                          padding: '2px 6px', borderRadius: 8,
                          background: e.status === 'sent' ? C.greenLight : C.brandLight,
                          color: e.status === 'sent' ? C.green : C.brand,
                          textTransform: 'uppercase',
                        }}>{e.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.text2, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.product}</div>
                      <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{e.time}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Queue Summary */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, background: C.surface2, fontSize: 13, fontWeight: 700, color: C.text }}>
                📊 Queue Summary
              </div>
              {[
                ['Total Pending', slaCounts.overdue + slaCounts.warning + slaCounts.onTrack],
                ['Overdue', slaCounts.overdue],
                ['Warning', slaCounts.warning],
                ['On Track', slaCounts.onTrack],
                ['Resolved Today', slaCounts.resolvedToday],
              ].map(([label, val]) => (
                <div key={label as string} style={{
                  padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 13, color: C.text2,
                }}>
                  <span>{label}</span>
                  <span style={{ fontWeight: 700, color: C.text }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════ APPROVE MODAL ════ */}
        {approveProduct && (
          <div
            onClick={(e) => e.target === e.currentTarget && setApproveProduct(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(26,18,9,.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
          >
            <div style={{
              background: C.surface, borderRadius: 14, width: 500, maxWidth: '100%',
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,.2)',
              animation: 'slideUp .2s ease',
            }}>
              {/* Header */}
              <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>✅</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: C.text }}>Approve Product</div>
                  <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>The following notify.* events will fire on confirmation</div>
                </div>
                <button onClick={() => setApproveProduct(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.text3, padding: '2px 6px' }}>✕</button>
              </div>

              <div style={{ padding: '18px 24px' }}>
                {/* Product strip */}
                <div style={{ background: C.greenLight, border: `1px solid ${C.greenBorder}`, borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: C.green }}>{approveProduct.name}</div>
                  <div style={{ color: C.text2, marginTop: 3 }}>{approveProduct.seller_name} · {rupee(approveProduct.price)}</div>
                </div>

                {/* Notify checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {[
                    { icon: '📱', label: 'notify.product.approved', desc: 'In-app notification → seller dashboard bell' },
                    { icon: '📧', label: 'notify.email.seller', desc: `Email → ${approveProduct.seller_email || 'seller registered email'}` },
                    { icon: '🗑', label: 'notify.cache.invalidated', desc: 'productCache cleared + Redis seller:* keys invalidated' },
                    { icon: '📊', label: 'notify.event.logged', desc: 'Logged to spf_notify_event_log table' },
                  ].map((item) => (
                    <div key={item.label} style={{
                      display: 'flex', gap: 10, padding: '11px 13px',
                      background: C.surface2, borderRadius: 8, border: `1px solid ${C.border}`,
                    }}>
                      <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: C.green }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{item.desc}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, background: C.greenLight, color: C.green, padding: '2px 7px', borderRadius: 8, letterSpacing: '.05em', alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>WILL FIRE</span>
                    </div>
                  ))}
                </div>

                {/* Optional note */}
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 6 }}>
                  Admin Note <span style={{ fontWeight: 400, color: C.text3 }}>(optional)</span>
                </label>
                <textarea
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  rows={2}
                  placeholder="Optional note for the seller…"
                  style={{
                    width: '100%', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`,
                    background: C.surface2, color: C.text, resize: 'vertical', outline: 'none',
                  }}
                />
              </div>

              <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, background: C.surface2, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setApproveProduct(null)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${C.border}`, background: 'none', color: C.text2, cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                    padding: '8px 20px', borderRadius: 8, border: 'none',
                    background: submitting ? C.border : C.green, color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >{submitting ? 'Approving…' : '✓ Approve & Notify Seller'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ════ REJECT MODAL ════ */}
        {rejectProduct && (
          <div
            onClick={(e) => e.target === e.currentTarget && setRejectProduct(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(26,18,9,.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
          >
            <div style={{
              background: C.surface, borderRadius: 14, width: 580, maxWidth: '100%',
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,.2)',
              animation: 'slideUp .2s ease',
            }}>
              {/* Header */}
              <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: C.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🚫</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: C.text }}>Reject &amp; Notify Seller</div>
                  <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>Select reason tags — sent as structured fix instructions to seller</div>
                </div>
                <button onClick={() => setRejectProduct(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.text3, padding: '2px 6px' }}>✕</button>
              </div>

              <div style={{ padding: '18px 24px' }}>
                {/* Product strip */}
                <div style={{ background: C.brandLight, border: '1px solid #DDBBB8', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: C.brand }}>{rejectProduct.name}</div>
                  <div style={{ color: C.text2, marginTop: 3 }}>{rejectProduct.category} · {rejectProduct.seller_name} · {rupee(rejectProduct.price)}</div>
                </div>

                {/* Reason tags — 2 column grid */}
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                  Select Rejection Reasons{' '}
                  <span style={{ fontWeight: 400, color: C.brand, fontSize: 12 }}>(at least 1 required)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 16 }}>
                  {REJECTION_REASONS.map((r) => {
                    const selected = selectedReasons.has(r.id);
                    return (
                      <div
                        key={r.id}
                        className="reason-tag"
                        onClick={() => toggleReason(r.id)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 9,
                          padding: '10px 12px', borderRadius: 8,
                          border: `2px solid ${selected ? C.brand : C.border}`,
                          background: selected ? C.brandLight : C.surface,
                          cursor: 'pointer', transition: 'all .13s',
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 17, height: 17, borderRadius: 5, flexShrink: 0, marginTop: 1,
                          border: `2px solid ${selected ? C.brand : C.borderStrong}`,
                          background: selected ? C.brand : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .13s',
                        }}>
                          {selected && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{r.title}</div>
                          <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{r.sub}</div>
                          {selected && (
                            <div style={{ fontSize: 10, color: C.brand, marginTop: 4, fontStyle: 'italic' }}>
                              → {r.fixInstruction}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Severity picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flexShrink: 0 }}>Severity:</span>
                  {(['minor', 'major', 'critical'] as Severity[]).map((s) => {
                    const active = severity === s;
                    const colors = s === 'minor'
                      ? { bg: active ? C.greenLight : C.surface, border: active ? C.greenBorder : C.border, text: active ? C.green : C.text2 }
                      : s === 'major'
                      ? { bg: active ? C.amberLight : C.surface, border: active ? C.amberBorder : C.border, text: active ? C.amber : C.text2 }
                      : { bg: active ? C.brandLight : C.surface, border: active ? C.brand : C.border, text: active ? C.brand : C.text2 };
                    return (
                      <button
                        key={s}
                        onClick={() => setSeverity(s)}
                        style={{
                          flex: 1, fontFamily: "'DM Sans', sans-serif",
                          fontSize: 12, fontWeight: 600, padding: '7px 0', borderRadius: 8,
                          border: `2px solid ${colors.border}`,
                          background: colors.bg, color: colors.text,
                          cursor: 'pointer', transition: 'all .13s',
                        }}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    );
                  })}
                </div>

                {/* Optional note */}
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 6 }}>
                  Admin Note{' '}
                  <span style={{ fontWeight: 400, color: C.text3 }}>(optional · max 500 chars)</span>
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="Additional context for the seller…"
                  style={{
                    width: '100%', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`,
                    background: C.surface2, color: C.text, resize: 'vertical', outline: 'none',
                    marginBottom: 4,
                  }}
                />
                <div style={{ textAlign: 'right', fontSize: 11, color: rejectNote.length > 450 ? C.brand : C.text3 }}>
                  {rejectNote.length} / 500
                </div>

                {/* Seller preview strip */}
                <div style={{
                  marginTop: 12,
                  background: C.amberLight, border: `1px solid ${C.amberBorder}`,
                  borderLeft: `3px solid ${C.amber}`, borderRadius: 8,
                  padding: '11px 14px', fontSize: 12, color: C.text2,
                }}>
                  <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>📬 Seller Will Receive</div>
                  <div>Seller: <strong>{rejectProduct.seller_name}</strong></div>
                  <div style={{ marginTop: 2 }}>
                    Reasons: <strong>{selectedReasons.size > 0 ? `${selectedReasons.size} tag(s) as fix instructions` : 'None selected yet'}</strong>
                  </div>
                  {selectedReasons.size > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {Array.from(selectedReasons).map((id) => (
                        <span key={id} style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
                          background: C.brandLight, color: C.brand, border: '1px solid #DDBBB8',
                        }}>
                          {REJECTION_REASONS.find((r) => r.id === id)?.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, background: C.surface2, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setRejectProduct(null)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${C.border}`, background: 'none', color: C.text2, cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={handleReject}
                  disabled={submitting || selectedReasons.size === 0}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                    padding: '8px 20px', borderRadius: 8, border: 'none',
                    background: submitting || selectedReasons.size === 0 ? C.border : C.brand,
                    color: '#fff', cursor: submitting || selectedReasons.size === 0 ? 'not-allowed' : 'pointer',
                  }}
                >{submitting ? 'Rejecting…' : '🚫 Reject & Notify Seller'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ════ TOASTS ════ */}
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                minWidth: 300, maxWidth: 380,
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '13px 16px',
                boxShadow: '0 8px 32px rgba(0,0,0,.14)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
                pointerEvents: 'all', animation: 'toastIn .3s ease',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: t.type === 'green' ? C.greenLight : t.type === 'red' ? C.brandLight : C.amberLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>
                {t.type === 'green' ? '✅' : t.type === 'red' ? '🚫' : '⚠️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.title}</div>
                <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{t.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
