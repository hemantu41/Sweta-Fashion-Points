'use client';

import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { useAdminLang } from './LanguageContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['order', 'payment', 'product', 'delivery', 'other'] as const;
const PRIORITIES = ['low', 'medium', 'high'] as const;

export default function SupportTicketWidget() {
  const { t } = useAdminLang();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<string>('order');
  const [priority, setPriority] = useState<string>('medium');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    // Mock submission
    setSubmitted(true);
    toast.success('Ticket submitted successfully!');
    setTimeout(() => {
      setSubject('');
      setMessage('');
      setSubmitted(false);
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col items-center justify-center min-h-[280px]">
        <CheckCircle size={48} className="text-green-500 mb-3" />
        <p className="text-sm font-semibold text-gray-800">Ticket Submitted!</p>
        <p className="text-xs text-gray-400 mt-1">We&apos;ll respond within 24 hours</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('support.newTicket')}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder={t('support.subject')}
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40"
        />
        <textarea
          placeholder={t('support.message')}
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none
            focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40"
        />
        <div className="flex gap-3">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white
            rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Send size={14} />
          {t('support.submit')}
        </button>
      </form>
    </div>
  );
}
