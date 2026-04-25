'use client';

import { useState } from 'react';
import { X, RotateCcw, MapPin, Undo2, AlertOctagon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminLang } from '@/components/dashboard/LanguageContext';

export interface NDRRecord {
  id: string;
  order_id: string;
  customer_name: string;
  mobile: string;
  pincode: string;
  district: string;
  failure_reason: string;
  failure_reason_hi: string;
  attempt_count: number;
  last_attempt: string;
  status: string;
  payment_mode: string;
  total: number;
  cod_verified: boolean | null;
}

interface NDRActionModalProps {
  ndr: NDRRecord;
  onClose: () => void;
  onActionComplete: (ndrId: string, action: string) => void;
}

export default function NDRActionModal({ ndr, onClose, onActionComplete }: NDRActionModalProps) {
  const { t, lang } = useAdminLang();
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      const res = await fetch('/api/ndr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ndrId: ndr.id,
          action,
          newAddress: action === 'update_address' ? newAddress : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        onActionComplete(ndr.id, action);
        onClose();
      } else {
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    setLoading(null);
  };

  const actions = [
    {
      key: 'retry',
      icon: RotateCcw,
      label: t('ndr.retryDelivery'),
      desc: t('ndr.retryDesc'),
      color: 'bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] hover:from-[#7A2350] hover:to-[#5B1A3A]',
    },
    {
      key: 'update_address',
      icon: MapPin,
      label: t('ndr.updateAddress'),
      desc: t('ndr.updateAddressDesc'),
      color: 'bg-blue-600 hover:bg-blue-700',
      showInput: true,
    },
    {
      key: 'rto',
      icon: Undo2,
      label: t('ndr.initiateRTO'),
      desc: t('ndr.rtoDesc'),
      color: 'bg-amber-600 hover:bg-amber-700',
    },
    {
      key: 'fake_order',
      icon: AlertOctagon,
      label: t('ndr.markFake'),
      desc: t('ndr.fakeDesc'),
      color: 'bg-red-600 hover:bg-red-700',
    },
  ];

  return (
    <div className="fixed inset-0 bg-[rgba(31,14,23,0.5)] backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 border border-[rgba(196,154,60,0.08)]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{t('ndr.actionTitle')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Order summary */}
        <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('orders.orderId')}</span>
            <span className="font-medium text-gray-800">{ndr.order_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('orders.customer')}</span>
            <span className="text-gray-700">{ndr.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('ndr.failureReason')}</span>
            <span className="text-red-600 text-xs font-medium">
              {lang === 'hi' ? ndr.failure_reason_hi : ndr.failure_reason}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('ndr.attempts')}</span>
            <span className="text-gray-700">{ndr.attempt_count}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {actions.map(({ key, icon: Icon, label, desc, color, showInput }) => (
            <div key={key}>
              {showInput && (
                <input
                  placeholder={t('ndr.newAddressPlaceholder')}
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  className="w-full mb-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              )}
              <button
                onClick={() => handleAction(key)}
                disabled={loading !== null || (key === 'update_address' && !newAddress.trim())}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${color}`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <div className="text-left flex-1">
                  <p>{label}</p>
                  <p className="text-[10px] opacity-80 font-normal">{desc}</p>
                </div>
                {loading === key && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
