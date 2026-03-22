'use client';

import { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminLang } from '@/components/dashboard/LanguageContext';

interface CODVerificationBadgeProps {
  orderId: string;
  phone: string;
  paymentMode: string;
  verified: boolean | null; // null = not COD, true = verified, false = pending
  onVerified?: () => void;
}

export default function CODVerificationBadge({
  orderId,
  phone,
  paymentMode,
  verified,
  onVerified,
}: CODVerificationBadgeProps) {
  const { t } = useAdminLang();
  const [sending, setSending] = useState(false);

  // Only show for COD orders
  if (paymentMode !== 'cod') return null;

  const triggerVerification = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/ndr/cod-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, phone }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.mock ? t('ndr.codOTPLogged') : t('ndr.codOTPSent'));
        onVerified?.();
      } else {
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    setSending(false);
  };

  if (verified === true) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
        <ShieldCheck size={12} />
        {t('ndr.codVerified')}
      </span>
    );
  }

  if (verified === false) {
    return (
      <button
        onClick={triggerVerification}
        disabled={sending}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer disabled:opacity-50"
        title={t('ndr.sendCODOTP')}
      >
        {sending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <ShieldAlert size={12} />
        )}
        {t('ndr.codPending')}
      </button>
    );
  }

  // High risk — multiple failed attempts, unverified COD
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-600">
      <Shield size={12} />
      {t('ndr.codHighRisk')}
    </span>
  );
}
