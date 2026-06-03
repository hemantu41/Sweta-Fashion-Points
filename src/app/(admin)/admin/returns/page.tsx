'use client';

/**
 * Admin — Returns Management
 * Lists all return requests. Allows review (approve/reject) and refund initiation.
 */

import { useEffect, useState, useCallback } from 'react';
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
interface ReturnRow {
  id:                  string;
  order_id:            string;
  order_number:        string;
  customer_id:         string;
  customer_name:       string;
  customer_email:      string;
  seller_id:           string;
  return_type:         string;
  reason_category:     string;
  reason_detail:       string | null;
  item_condition:      string | null;
  status:              string;
  admin_notes:         string | null;
  seller_verified:     boolean;
  refund_amount:       number | null;
  razorpay_refund_id:  string | null;
  refund_status:       string | null;
  order_total:         number;
  payment_method:      string;
  created_at:          string;
  updated_at:          string;
}

const STATUS_TABS = [
  { label: 'All',          value: '' },
  { label: 'Pending',      value: 'PENDING' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Approved',     value: 'APPROVED' },
  { label: 'Rejected',     value: 'REJECTED' },
  { label: 'Refund Sent',  value: 'REFUND_INITIATED' },
  { label: 'Refunded',     value: 'REFUNDED' },
];

const REASON_LABELS: Record<string, string> = {
  damaged:         'Damaged / Defective',
  wrong_item:      'Wrong Item',
  size_issue:      'Size Issue',
  quality_issue:   'Quality Issue',
  not_as_described:'Not as Described',
  changed_mind:    'Changed Mind',
  other:           'Other',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:          'bg-yellow-100 text-yellow-700 border-yellow-200',
  UNDER_REVIEW:     'bg-blue-100 text-blue-700 border-blue-200',
  APPROVED:         'bg-green-100 text-green-700 border-green-200',
  REJECTED:         'bg-red-100 text-red-700 border-red-200',
  REFUND_INITIATED: 'bg-purple-100 text-purple-700 border-purple-200',
  REFUNDED:         'bg-emerald-100 text-emerald-700 border-emerald-200',
};

function fmt(v: number) {
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminReturnsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [returns, setReturns]               = useState<ReturnRow[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeTab, setActiveTab]           = useState('');
  const [selected, setSelected]             = useState<ReturnRow | null>(null);

  // Review form state
  const [reviewAction,   setReviewAction]   = useState<'approve' | 'reject' | ''>('');
  const [adminNotes,     setAdminNotes]     = useState('');
  const [sellerVerified, setSellerVerified] = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [reviewError,    setReviewError]    = useState('');

  // Refund state
  const [refundAmount,   setRefundAmount]   = useState('');
  const [refunding,      setRefunding]      = useState(false);
  const [refundError,    setRefundError]    = useState('');
  const [refundSuccess,  setRefundSuccess]  = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/admin/returns${activeTab ? `?status=${activeTab}` : ''}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (res.ok) setReturns(data.returns || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  function openDrawer(row: ReturnRow) {
    setSelected(row);
    setReviewAction('');
    setAdminNotes(row.admin_notes || '');
    setSellerVerified(row.seller_verified || false);
    setReviewError('');
    setRefundAmount(row.order_total ? String(Math.round(row.order_total)) : '');
    setRefundError('');
    setRefundSuccess('');
    setSubmitting(false);
    setRefunding(false);
  }

  async function handleReview() {
    if (!reviewAction || !selected) return;
    setSubmitting(true);
    setReviewError('');
    try {
      const res = await fetch(`/api/admin/returns/${selected.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:         reviewAction,
          adminNotes:     adminNotes.trim(),
          sellerVerified: sellerVerified,
          reviewerId:     user?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelected(prev => prev ? { ...prev, status: data.status, admin_notes: adminNotes.trim(), seller_verified: sellerVerified } : null);
        setReturns(prev => prev.map(r => r.id === selected.id
          ? { ...r, status: data.status, admin_notes: adminNotes.trim(), seller_verified: sellerVerified }
          : r,
        ));
      } else {
        setReviewError(data.error || 'Failed to submit review.');
      }
    } catch {
      setReviewError('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRefund() {
    if (!selected) return;
    setRefunding(true);
    setRefundError('');
    setRefundSuccess('');
    try {
      const res = await fetch(`/api/admin/returns/${selected.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundAmount: refundAmount ? Number(refundAmount) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRefundSuccess(data.message);
        setSelected(prev => prev ? {
          ...prev,
          status:              'REFUND_INITIATED',
          razorpay_refund_id:  data.razorpayRefundId,
          refund_amount:       data.refundAmount,
          refund_status:       'initiated',
        } : null);
        setReturns(prev => prev.map(r => r.id === selected.id
          ? { ...r, status: 'REFUND_INITIATED', razorpay_refund_id: data.razorpayRefundId, refund_amount: data.refundAmount }
          : r,
        ));
      } else {
        setRefundError(data.error || 'Refund failed.');
      }
    } catch {
      setRefundError('Something went wrong.');
    } finally {
      setRefunding(false);
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: C.maroon, borderTopColor: 'transparent' }} />
    </div>
  );

  const canReview  = (r: ReturnRow) => ['PENDING', 'UNDER_REVIEW'].includes(r.status);
  const canRefund  = (r: ReturnRow) => r.status === 'APPROVED' && r.payment_method?.toUpperCase() !== 'COD' && !r.razorpay_refund_id;

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between" style={{ background: 'white', borderColor: C.border }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: C.maroon }}>Returns Management</h1>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>Review customer return requests and process refunds</p>
        </div>
        <button
          onClick={fetchReturns}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: C.border, color: C.text }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.value
                  ? 'text-white'
                  : 'hover:bg-gray-100'
              }`}
              style={activeTab === tab.value
                ? { background: C.maroon, color: 'white' }
                : { color: C.muted }
              }
            >
              {tab.label}
              {tab.value === '' && returns.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-white/20">{returns.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: C.maroon, borderTopColor: 'transparent' }} />
          </div>
        ) : returns.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: C.muted }}>
            No return requests found.
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: C.border, background: '#faf5f8' }}>
                  <th className="px-4 py-3 font-semibold" style={{ color: C.muted }}>Order</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: C.muted }}>Customer</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: C.muted }}>Reason</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: C.muted }}>Type</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: C.muted }}>Amount</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: C.muted }}>Payment</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: C.muted }}>Status</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: C.muted }}>Date</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: C.muted }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    style={{ borderColor: i < returns.length - 1 ? C.border : 'transparent' }}
                    onClick={() => openDrawer(row)}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: C.maroon }}>
                      #{row.order_number}
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ color: C.text }}>{row.customer_name || '—'}</div>
                      <div className="text-xs" style={{ color: C.muted }}>{row.customer_email}</div>
                    </td>
                    <td className="px-4 py-3" style={{ color: C.text }}>
                      {REASON_LABELS[row.reason_category] || row.reason_category}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        row.return_type === 'RTO'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {row.return_type === 'RTO' ? 'RTO' : 'Customer'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: C.text }}>
                      {fmt(row.order_total)}
                    </td>
                    <td className="px-4 py-3 uppercase text-xs font-medium" style={{ color: C.muted }}>
                      {row.payment_method || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {row.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>
                      {fmtDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); openDrawer(row); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: `${C.maroon}15`, color: C.maroon }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Drawer ────────────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          {/* Backdrop */}
          <div className="flex-1" onClick={() => setSelected(null)} />

          {/* Panel */}
          <div className="w-full max-w-lg h-full overflow-y-auto flex flex-col shadow-2xl" style={{ background: 'white' }}>
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b flex items-start justify-between sticky top-0 bg-white z-10" style={{ borderColor: C.border }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: C.maroon }}>Return #{selected.order_number}</h2>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>Return request ID: {selected.id.slice(0, 8)}…</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: C.muted }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6">
              {/* Status badge */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[selected.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {selected.status.replace(/_/g, ' ')}
                </span>
                {selected.seller_verified && (
                  <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Seller Verified
                  </span>
                )}
              </div>

              {/* Customer info */}
              <section>
                <h3 className="text-sm font-semibold mb-2" style={{ color: C.text }}>Customer</h3>
                <div className="rounded-lg p-4 text-sm space-y-1" style={{ background: '#faf5f8' }}>
                  <p style={{ color: C.text }}>{selected.customer_name || '—'}</p>
                  <p style={{ color: C.muted }}>{selected.customer_email}</p>
                </div>
              </section>

              {/* Return details */}
              <section>
                <h3 className="text-sm font-semibold mb-2" style={{ color: C.text }}>Return Details</h3>
                <div className="rounded-lg p-4 text-sm space-y-2" style={{ background: '#faf5f8' }}>
                  <div className="flex justify-between">
                    <span style={{ color: C.muted }}>Type</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${selected.return_type === 'RTO' ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                      {selected.return_type === 'RTO' ? 'RTO (Return to Origin)' : 'Customer Return'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: C.muted }}>Reason</span>
                    <span style={{ color: C.text }}>{REASON_LABELS[selected.reason_category] || selected.reason_category}</span>
                  </div>
                  {selected.item_condition && (
                    <div className="flex justify-between">
                      <span style={{ color: C.muted }}>Item condition</span>
                      <span style={{ color: C.text }} className="capitalize">{selected.item_condition.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span style={{ color: C.muted }}>Order total</span>
                    <span className="font-semibold" style={{ color: C.text }}>{fmt(selected.order_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: C.muted }}>Payment</span>
                    <span style={{ color: C.text }} className="uppercase">{selected.payment_method || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: C.muted }}>Requested on</span>
                    <span style={{ color: C.text }}>{fmtDate(selected.created_at)}</span>
                  </div>
                </div>
                {selected.reason_detail && (
                  <div className="mt-2 rounded-lg p-3 text-sm border" style={{ borderColor: C.border, color: C.text }}>
                    <p className="text-xs mb-1 font-medium" style={{ color: C.muted }}>Customer note:</p>
                    {selected.reason_detail}
                  </div>
                )}
              </section>

              {/* Refund info (if already initiated) */}
              {selected.razorpay_refund_id && (
                <section>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: C.text }}>Refund Info</h3>
                  <div className="rounded-lg p-4 text-sm space-y-2 bg-emerald-50 border border-emerald-200">
                    <div className="flex justify-between">
                      <span style={{ color: C.muted }}>Refund ID</span>
                      <span className="font-mono text-xs" style={{ color: C.text }}>{selected.razorpay_refund_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: C.muted }}>Amount</span>
                      <span className="font-semibold text-emerald-700">{fmt(selected.refund_amount || 0)}</span>
                    </div>
                  </div>
                </section>
              )}

              {/* ── Review Section ─────────────────────────────────────────── */}
              {canReview(selected) && (
                <section>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Review Decision</h3>

                  {/* Seller verified toggle */}
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sellerVerified}
                      onChange={e => setSellerVerified(e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: C.maroon }}
                    />
                    <span className="text-sm" style={{ color: C.text }}>
                      Verified return reason with seller
                    </span>
                  </label>

                  {/* Admin notes */}
                  <p className="text-sm mb-1" style={{ color: C.muted }}>Admin notes (optional)</p>
                  <textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    rows={3}
                    placeholder="Add internal notes or rejection reason…"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
                    style={{ borderColor: C.border, color: C.text }}
                  />

                  {reviewError && <p className="text-red-600 text-sm mt-2">{reviewError}</p>}

                  {/* Approve / Reject buttons */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => { setReviewAction('reject'); handleReview(); }}
                      disabled={submitting}
                      className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 hover:bg-red-50"
                      style={{ borderColor: '#fca5a5', color: '#dc2626' }}
                    >
                      {submitting && reviewAction === 'reject' ? 'Rejecting…' : 'Reject Return'}
                    </button>
                    <button
                      onClick={() => { setReviewAction('approve'); handleReview(); }}
                      disabled={submitting}
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                      style={{ background: '#16a34a' }}
                    >
                      {submitting && reviewAction === 'approve' ? 'Approving…' : 'Approve Return'}
                    </button>
                  </div>
                </section>
              )}

              {/* ── Refund Section ─────────────────────────────────────────── */}
              {canRefund(selected) && (
                <section>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Process Refund</h3>
                  <div className="rounded-lg p-4 border" style={{ borderColor: C.border }}>
                    <p className="text-xs mb-3" style={{ color: C.muted }}>
                      Refund will be sent to the customer's original payment method via Razorpay.
                      Default: full order amount ({fmt(selected.order_total)}).
                    </p>
                    <label className="text-sm font-medium block mb-1" style={{ color: C.text }}>
                      Refund amount (₹)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={e => setRefundAmount(e.target.value)}
                      placeholder={String(Math.round(selected.order_total))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none mb-3"
                      style={{ borderColor: C.border, color: C.text }}
                    />

                    {refundError   && <p className="text-red-600 text-sm mb-3">{refundError}</p>}
                    {refundSuccess && <p className="text-green-600 text-sm mb-3">{refundSuccess}</p>}

                    <button
                      onClick={handleRefund}
                      disabled={refunding}
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: C.maroon }}
                    >
                      {refunding ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Processing…
                        </>
                      ) : 'Initiate Razorpay Refund'}
                    </button>
                  </div>
                </section>
              )}

              {/* Admin notes display (read-only for reviewed requests) */}
              {!canReview(selected) && selected.admin_notes && (
                <section>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: C.text }}>Admin Notes</h3>
                  <div className="rounded-lg p-3 text-sm border" style={{ borderColor: C.border, color: C.text }}>
                    {selected.admin_notes}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
