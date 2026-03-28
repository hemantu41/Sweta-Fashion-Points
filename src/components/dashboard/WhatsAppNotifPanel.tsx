'use client';

import { useState } from 'react';
import { MessageCircle, Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAdminLang } from './LanguageContext';
import type { WhatsAppNotification } from '@/types/admin';

const MOCK_LOGS: WhatsAppNotification[] = [
  { id: '1', type: 'order', message: 'Order #IFP-1042 confirmed — delivery by tomorrow', recipient: '+91 82941xxxxx', status: 'sent', created_at: new Date().toISOString() },
  { id: '2', type: 'payment', message: 'Payment of ₹1,250 received for order #IFP-1039', recipient: '+91 73215xxxxx', status: 'sent', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', type: 'qc', message: 'Your product "Banarasi Silk Saree" has been approved', recipient: '+91 96342xxxxx', status: 'pending', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', type: 'alert', message: 'Delivery delayed for order #IFP-1035', recipient: '+91 88214xxxxx', status: 'failed', created_at: new Date(Date.now() - 10800000).toISOString() },
];

const TEMPLATES = [
  { key: 'wa.orderConfirm', emoji: '📦' },
  { key: 'wa.shipmentUpdate', emoji: '🚚' },
  { key: 'wa.deliveryComplete', emoji: '✅' },
  { key: 'wa.paymentReminder', emoji: '💰' },
];

const STATUS_ICONS = {
  sent: { icon: CheckCircle, color: '#10b981' },
  pending: { icon: Clock, color: '#f59e0b' },
  failed: { icon: XCircle, color: '#ef4444' },
};

export default function WhatsAppNotifPanel() {
  const { t } = useAdminLang();
  const [logs] = useState(MOCK_LOGS);

  return (
    <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-green-600" />
          <h3 className="text-sm font-semibold text-gray-800">{t('wa.title')}</h3>
        </div>
      </div>

      {/* Template buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TEMPLATES.map(tmpl => (
          <button
            key={tmpl.key}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-[rgba(196,154,60,0.2)] bg-[#faf6ee]
              text-xs font-medium text-[#5B1A3A] hover:bg-[#f5eddc] transition-colors"
          >
            <span>{tmpl.emoji}</span>
            <span>{t(tmpl.key)}</span>
            <Send size={12} className="ml-auto" />
          </button>
        ))}
      </div>

      {/* Recent logs */}
      <div className="space-y-2">
        {logs.map(log => {
          const st = STATUS_ICONS[log.status];
          const StIcon = st.icon;
          return (
            <div key={log.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50">
              <StIcon size={14} style={{ color: st.color }} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 line-clamp-1">{log.message}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{log.recipient}</p>
              </div>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ color: st.color, backgroundColor: st.color + '15' }}
              >
                {t(`wa.${log.status}`)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
