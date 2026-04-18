'use client';

import { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { useAdminLang } from './LanguageContext';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['order', 'payment', 'product', 'delivery', 'seller', 'other'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

interface Props {
  onTicketCreated?: () => void;
}

export default function SupportTicketWidget({ onTicketCreated }: Props) {
  const { t } = useAdminLang();
  const { user } = useAuth();
  const [subject, setSubject]   = useState('');
  const [message, setMessage]   = useState('');
  const [category, setCategory] = useState<string>('order');
  const [priority, setPriority] = useState<string>('medium');
  const [orderNo, setOrderNo]   = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    if (!user?.id) { toast.error('Not authenticated'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId:        user.id,
          subject:            subject.trim(),
          message:            message.trim(),
          category,
          priority,
          raisedByType:       'admin',
          raisedByName:       user.email || 'Admin',
          relatedOrderNumber: orderNo.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create ticket');

      setSubmitted(true);
      toast.success(`Ticket ${data.ticket.ticket_number} created!`);
      onTicketCreated?.();

      setTimeout(() => {
        setSubject('');
        setMessage('');
        setOrderNo('');
        setCategory('order');
        setPriority('medium');
        setSubmitted(false);
      }, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5 flex flex-col items-center justify-center min-h-[280px]">
        <CheckCircle size={48} className="text-green-500 mb-3" />
        <p className="text-sm font-semibold text-gray-800">Ticket Submitted!</p>
        <p className="text-xs text-gray-400 mt-1">SLA timer has started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('support.newTicket')}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder={t('support.subject')}
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 focus:border-[#C49A3C]/40"
        />
        <textarea
          placeholder={t('support.message')}
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none
            focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 focus:border-[#C49A3C]/40"
        />
        <input
          type="text"
          placeholder="Related order # (optional)"
          value={orderNo}
          onChange={e => setOrderNo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 focus:border-[#C49A3C]/40"
        />
        <div className="flex gap-3">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 focus:border-[#C49A3C]/40"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 focus:border-[#C49A3C]/40"
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white
            rounded-lg text-sm font-medium hover:from-[#4A1530] hover:to-[#6A1E45] transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {loading ? 'Submitting…' : t('support.submit')}
        </button>
      </form>
    </div>
  );
}
