'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Download, MessageSquare, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatINR } from '@/lib/admin/constants';

interface ReconciliationTableProps {
  earnings: any[];
  adminUserId?: string;
  onRefresh?: () => void;
}

type StatusFilter = 'all' | 'pending' | 'matched' | 'disputed';

export default function ReconciliationTable({
  earnings,
  adminUserId,
  onRefresh,
}: ReconciliationTableProps) {
  const [sellerFilter, setSellerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  // Unique sellers for filter dropdown
  const sellerOptions = useMemo(() => {
    const map = new Map<string, string>();
    earnings.forEach(e => {
      if (e.seller_id) map.set(e.seller_id, e.seller_name || e.seller_id);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [earnings]);

  // Build reconciliation rows from earnings
  const allRows = useMemo(() => {
    return earnings.map(e => {
      const isPaid       = ['paid', 'settled'].includes(e.payment_status || '');
      const isDisputed   = e.payment_status === 'disputed';
      const expected     = Number(e.seller_earning || 0);
      const actual       = isPaid ? expected : 0;
      const difference   = expected - actual;
      const reconStatus  = isPaid ? 'matched' : isDisputed ? 'disputed' : 'pending';

      return {
        id:             e.id,
        order_number:   e.order_number || e.order_id || '—',
        seller_id:      e.seller_id,
        seller_name:    e.seller_name || '—',
        item_name:      e.item_name || '—',
        order_date:     e.order_date || e.created_at,
        payment_date:   e.payment_date,
        expected_amount: expected,
        actual_credited: actual,
        difference,
        utr:            e.payment_reference || null,
        payment_notes:  e.payment_notes || null,
        recon_status:   reconStatus,
        payment_status: e.payment_status,
      };
    });
  }, [earnings]);

  // Apply filters
  const rows = useMemo(() => {
    return allRows.filter(r => {
      const sellerMatch = sellerFilter === 'all' || r.seller_id === sellerFilter;
      const statusMatch = statusFilter === 'all' || r.recon_status === statusFilter;
      return sellerMatch && statusMatch;
    });
  }, [allRows, sellerFilter, statusFilter]);

  // Summary stats (computed on filtered rows)
  const totalExpected  = rows.reduce((s, r) => s + r.expected_amount, 0);
  const totalActual    = rows.reduce((s, r) => s + r.actual_credited, 0);
  const totalDiff      = totalExpected - totalActual;
  const pendingCount   = rows.filter(r => r.recon_status === 'pending').length;
  const mismatchCount  = rows.filter(r => r.recon_status === 'disputed').length;

  async function handleRaiseDispute(row: typeof allRows[0]) {
    if (!disputeReason.trim()) { toast.error('Reason is required'); return; }
    if (!adminUserId) { toast.error('Not authenticated'); return; }
    setDisputeLoading(true);
    try {
      const res = await fetch('/api/admin/payments/settlements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId,
          earningIds: [row.id],
          action: 'dispute',
          reason: disputeReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`Dispute raised for order ${row.order_number}`);
      setDisputingId(null);
      setDisputeReason('');
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to raise dispute');
    } finally {
      setDisputeLoading(false);
    }
  }

  function handleExportCSV() {
    const headers = ['Order #', 'Seller', 'Item', 'Order Date', 'Payment Date', 'Expected (₹)', 'Credited (₹)', 'Difference (₹)', 'UTR', 'Status'];
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        r.order_number,
        `"${r.seller_name}"`,
        `"${r.item_name}"`,
        r.order_date ? new Date(r.order_date).toLocaleDateString('en-IN') : '—',
        r.payment_date ? new Date(r.payment_date).toLocaleDateString('en-IN') : '—',
        r.expected_amount.toFixed(2),
        r.actual_credited.toFixed(2),
        r.difference.toFixed(2),
        r.utr || '—',
        r.recon_status,
      ].join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Reconciliation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  }

  const statusBadge = (status: string) => {
    if (status === 'matched')  return { cls: 'bg-green-100 text-green-700',  icon: <CheckCircle size={10} />,  label: 'Matched'  };
    if (status === 'disputed') return { cls: 'bg-red-100 text-red-600',      icon: <XCircle size={10} />,      label: 'Disputed' };
    return                            { cls: 'bg-yellow-100 text-yellow-700', icon: <Clock size={10} />,        label: 'Pending'  };
  };

  const INPUT_CLS = 'px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 text-gray-700';

  return (
    <div className="space-y-4">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Expected Payouts</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{formatINR(Math.round(totalExpected))}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{rows.length} item(s)</p>
        </div>
        <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Actually Paid</p>
          <p className="text-lg font-bold text-green-600 mt-1">{formatINR(Math.round(totalActual))}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{rows.filter(r => r.recon_status === 'matched').length} settled</p>
        </div>
        <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Outstanding</p>
          <p className={`text-lg font-bold mt-1 ${totalDiff > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {formatINR(Math.round(totalDiff))}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">{pendingCount} pending</p>
        </div>
        <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Disputes</p>
          <p className={`text-lg font-bold mt-1 ${mismatchCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {mismatchCount}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">flagged items</p>
        </div>
      </div>

      {/* Filters + Export */}
      <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wide mb-1 block">Seller</label>
            <select value={sellerFilter} onChange={e => setSellerFilter(e.target.value)} className={INPUT_CLS}>
              <option value="all">All Sellers</option>
              {sellerOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wide mb-1 block">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} className={INPUT_CLS}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="matched">Matched</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
          <div className="ml-auto mt-4">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Reconciliation Ledger</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {rows.length} record(s)
              {totalDiff > 0 && (
                <span className="ml-2 text-amber-600 font-medium">
                  · {formatINR(Math.round(totalDiff))} outstanding
                </span>
              )}
            </p>
          </div>
          {totalDiff > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={13} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">
                {pendingCount} unpaid — {formatINR(Math.round(totalDiff))}
              </span>
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <CheckCircle size={32} className="mx-auto text-green-400 mb-2" />
            <p className="text-sm text-gray-500">No records found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Seller</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Expected</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Credited</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Diff</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">UTR / Notes</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const badge = statusBadge(row.recon_status);
                  const isDisputing = disputingId === row.id;
                  return (
                    <>
                      <tr
                        key={row.id}
                        className={`border-b border-gray-50 transition-colors
                          ${row.recon_status === 'pending'  ? 'bg-amber-50/30 hover:bg-amber-50/60' : ''}
                          ${row.recon_status === 'disputed' ? 'bg-red-50/30 hover:bg-red-50/60'    : ''}
                          ${row.recon_status === 'matched'  ? 'hover:bg-gray-50/50'                : ''}`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-800 text-xs">{row.order_number}</td>
                        <td className="px-4 py-3 text-gray-700 text-xs">{row.seller_name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate" title={row.item_name}>
                          {row.item_name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {row.order_date
                            ? new Date(row.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{formatINR(row.expected_amount)}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-700">{formatINR(row.actual_credited)}</td>
                        <td className="px-4 py-3 text-right">
                          {row.difference > 0 ? (
                            <span className="font-bold text-amber-600">−{formatINR(row.difference)}</span>
                          ) : (
                            <span className="text-green-600 font-medium">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {row.utr ? (
                            <span className="font-mono text-gray-600">{row.utr}</span>
                          ) : row.payment_notes ? (
                            <span className="text-red-500 italic">{row.payment_notes}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                            {badge.icon} {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.recon_status === 'pending' && (
                            <button
                              onClick={() => {
                                setDisputingId(isDisputing ? null : row.id);
                                setDisputeReason('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
                            >
                              <MessageSquare size={11} /> Raise Dispute
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Inline dispute form */}
                      {isDisputing && (
                        <tr key={`${row.id}-dispute`} className="border-b border-amber-100 bg-amber-50">
                          <td colSpan={10} className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <input
                                value={disputeReason}
                                onChange={e => setDisputeReason(e.target.value)}
                                placeholder="Reason for dispute (e.g. payment not received, wrong amount)…"
                                className="flex-1 px-3 py-1.5 border border-amber-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                              />
                              <button
                                onClick={() => handleRaiseDispute(row)}
                                disabled={disputeLoading}
                                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
                              >
                                {disputeLoading ? 'Raising…' : 'Confirm Dispute'}
                              </button>
                              <button
                                onClick={() => setDisputingId(null)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>

              {/* Footer totals */}
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-gray-700">Total ({rows.length} records)</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">{formatINR(Math.round(totalExpected))}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-green-700">{formatINR(Math.round(totalActual))}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-amber-600">
                    {totalDiff > 0 ? `−${formatINR(Math.round(totalDiff))}` : '—'}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
