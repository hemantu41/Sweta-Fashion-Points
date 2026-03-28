'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminLang } from '@/components/dashboard/LanguageContext';
import { formatINR } from '@/lib/admin/constants';

interface Settlement {
  id: string;
  order_id: string;
  seller_name: string;
  settlement_date: string;
  expected_amount: number;
  actual_credited: number;
  difference: number;
  payment_mode: string;
  utr: string;
  status: string;
}

interface ReconciliationTableProps {
  onRaiseDispute?: (settlement: Settlement) => void;
}

export default function ReconciliationTable({ onRaiseDispute }: ReconciliationTableProps) {
  const { t } = useAdminLang();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payments/reconcile')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setSettlements(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDispute = (stl: Settlement) => {
    if (onRaiseDispute) {
      onRaiseDispute(stl);
    } else {
      toast.success(t('recon.disputeRaised'));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-6 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg mb-2" />
        ))}
      </div>
    );
  }

  const totalExpected = settlements.reduce((s, r) => s + r.expected_amount, 0);
  const totalActual = settlements.reduce((s, r) => s + r.actual_credited, 0);
  const totalDiff = totalExpected - totalActual;
  const mismatchCount = settlements.filter(r => r.difference > 0).length;

  return (
    <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{t('recon.title')}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {settlements.length} {t('recon.settlements')} &middot; {mismatchCount > 0 && (
              <span className="text-amber-600 font-medium">{mismatchCount} {t('recon.mismatches')}</span>
            )}
          </p>
        </div>
        {totalDiff > 0 && (
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">{t('recon.totalShortfall')}: {formatINR(totalDiff)}</span>
          </div>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-100">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('recon.expected')}</p>
          <p className="text-sm font-bold text-gray-800">{formatINR(totalExpected)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('recon.credited')}</p>
          <p className="text-sm font-bold text-gray-800">{formatINR(totalActual)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('recon.difference')}</p>
          <p className={`text-sm font-bold ${totalDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {totalDiff > 0 ? `-${formatINR(totalDiff)}` : formatINR(0)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.orderId')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Seller</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.date')}</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('recon.expected')}</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('recon.credited')}</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('recon.difference')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">UTR</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('pay.status')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.action')}</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map(stl => {
              const hasDiff = stl.difference > 0;
              return (
                <tr key={stl.id}
                  className={`border-b border-gray-50 transition-colors ${hasDiff ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50/50'}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{stl.order_id}</td>
                  <td className="px-4 py-3 text-gray-600">{stl.seller_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(stl.settlement_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">{formatINR(stl.expected_amount)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">{formatINR(stl.actual_credited)}</td>
                  <td className="px-4 py-3 text-right">
                    {hasDiff ? (
                      <span className="font-bold text-red-600">-{formatINR(stl.difference)}</span>
                    ) : (
                      <span className="text-green-600 font-medium">{formatINR(0)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">
                    {stl.utr || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {stl.status === 'matched' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle size={10} />{t('recon.matched')}
                      </span>
                    )}
                    {stl.status === 'mismatch' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <AlertTriangle size={10} />{t('recon.mismatch')}
                      </span>
                    )}
                    {stl.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <Clock size={10} />{t('pay.pending')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {hasDiff && (
                      <button
                        onClick={() => handleDispute(stl)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
                      >
                        <MessageSquare size={12} />{t('recon.raiseDispute')}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
