'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import {
  MessageCircle, Plus, X, Send, Clock, CheckCircle,
  AlertTriangle, ChevronRight, RefreshCw, Tag, Loader2,
  RotateCcw, Search, Filter,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  related_order_number: string | null;
  sla_deadline: string;
  resolved_at: string | null;
  created_at: string;
  sla_breached?: boolean;
}

interface Comment {
  id: string;
  author_type: string;
  author_name: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; cls: string }> = {
  open:              { label: 'Open',           cls: 'bg-blue-100 text-blue-700' },
  in_progress:       { label: 'In Progress',    cls: 'bg-yellow-100 text-yellow-700' },
  waiting_on_seller: { label: 'Waiting on You', cls: 'bg-purple-100 text-purple-700' },
  resolved:          { label: 'Resolved',        cls: 'bg-green-100 text-green-700' },
  closed:            { label: 'Closed',          cls: 'bg-gray-100 text-gray-500' },
};

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-gray-400', medium: 'bg-yellow-500', high: 'bg-red-500', critical: 'bg-red-700',
};

const CATEGORIES = ['order', 'payment', 'product', 'delivery', 'seller', 'other'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

function slaTimeLabelFn(deadline: string) {
  const diffMs  = new Date(deadline).getTime() - Date.now();
  const diffHrs = Math.abs(diffMs) / (1000 * 60 * 60);
  if (diffMs >= 0) return diffHrs < 1 ? `${Math.round(diffHrs * 60)}m left` : `${Math.round(diffHrs)}h left`;
  return diffHrs < 24 ? `${Math.round(diffHrs)}h overdue` : `${Math.round(diffHrs / 24)}d overdue`;
}

function slaProgressFn(createdAt: string, deadline: string) {
  const total   = new Date(deadline).getTime() - new Date(createdAt).getTime();
  const elapsed = Date.now()                   - new Date(createdAt).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

// ── Thread modal ──────────────────────────────────────────────────────────────

function ThreadModal({
  ticket, userId, onClose, onRefresh,
}: { ticket: Ticket; userId: string; onClose: () => void; onRefresh: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [reply, setReply]       = useState('');
  const [sending, setSending]   = useState(false);
  const [reopening, setReopening] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/seller/support/tickets/${ticket.id}/comments?userId=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments(data.comments || []);
    } catch { /* silent */ }
    setLoading(false);
  }, [ticket.id, userId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/seller/support/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReply('');
      setComments(prev => [...prev, data.comment]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send');
    }
    setSending(false);
  };

  const handleReopen = async () => {
    setReopening(true);
    try {
      const res = await fetch(`/api/seller/support/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reopen' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Ticket re-opened');
      onRefresh();
      fetchComments();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to re-open');
    }
    setReopening(false);
  };

  const isClosed   = ticket.status === 'closed';
  const isResolved = ticket.status === 'resolved';
  const slaP = slaProgressFn(ticket.created_at, ticket.sla_deadline);
  const slaC = ticket.sla_breached ? '#ef4444' : slaP >= 70 ? '#f59e0b' : '#22c55e';
  const isDone = isClosed || isResolved;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-gray-400">{ticket.ticket_number}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[ticket.status]?.cls}`}>
                {STATUS_META[ticket.status]?.label}
              </span>
              {ticket.sla_breached && !isDone && (
                <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle size={11} /> SLA overdue
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{ticket.subject}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {ticket.category} · {new Date(ticket.created_at).toLocaleDateString()}
              {ticket.related_order_number && ` · ${ticket.related_order_number}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* SLA bar */}
        {!isDone && (
          <div className="px-5 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <Clock size={11} className="text-gray-400" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${slaP}%`, backgroundColor: slaC }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: slaC }}>
                {slaTimeLabelFn(ticket.sla_deadline)}
              </span>
            </div>
          </div>
        )}

        {/* Waiting-on-seller notice */}
        {ticket.status === 'waiting_on_seller' && (
          <div className="mx-5 mt-3 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-xs text-purple-700 font-medium">
              The support team is waiting for your reply. Please add a message below.
            </p>
          </div>
        )}

        {/* Re-open for resolved/closed */}
        {isDone && (
          <div className="mx-5 mt-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
            <p className="text-xs text-gray-600">
              {isClosed ? 'This ticket is closed.' : 'This ticket is resolved.'} Still having issues?
            </p>
            <button
              onClick={handleReopen}
              disabled={reopening}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#5B1A3A]
                border border-[#5B1A3A]/30 rounded-lg hover:bg-[#5B1A3A]/5 transition-colors disabled:opacity-50"
            >
              {reopening ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
              Re-open
            </button>
          </div>
        )}

        {/* Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No replies yet</p>
          ) : comments.map(c => (
            <div key={c.id} className={`flex ${c.author_type === 'system' ? 'justify-center' : ''}`}>
              {c.author_type === 'system' ? (
                <span className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                  {c.message}
                </span>
              ) : (
                <div className={`max-w-[80%] ${c.author_type === 'seller' ? 'ml-auto' : ''}`}>
                  <div className={`px-3 py-2 rounded-xl text-sm
                    ${c.author_type === 'seller'
                      ? 'bg-[#3D0E2A] text-white'
                      : 'bg-gray-100 text-gray-800'
                    }`}>
                    {c.message}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 px-1">
                    {c.author_type === 'seller' ? 'You' : `Support — ${c.author_name}`}
                    {' · '}
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reply box */}
        {!isClosed && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-end gap-2">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type your reply…"
                rows={2}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-[#3D0E2A]/20 focus:border-[#3D0E2A]/40"
              />
              <button
                onClick={handleSend}
                disabled={sending || !reply.trim()}
                className="p-2.5 bg-[#3D0E2A] text-white rounded-lg hover:bg-[#2A0A1E]
                  disabled:opacity-50 transition-colors flex-shrink-0"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Ctrl+Enter to send</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── New ticket form ───────────────────────────────────────────────────────────

function NewTicketForm({ userId, onCreated, onCancel }: {
  userId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [subject, setSubject]   = useState('');
  const [message, setMessage]   = useState('');
  const [category, setCategory] = useState('order');
  const [priority, setPriority] = useState('medium');
  const [orderNo, setOrderNo]   = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) { toast.error('Subject and message are required'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/seller/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subject:              subject.trim(),
          message:              message.trim(),
          category,
          priority,
          relatedOrderNumber:   orderNo.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Ticket ${data.ticket.ticket_number} raised! We'll respond within the SLA window.`);
      onCreated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create ticket');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Raise a Support Ticket</h3>
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
          <X size={15} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text" placeholder="Subject *" value={subject} onChange={e => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3D0E2A]/20"
        />
        <textarea
          placeholder="Describe your issue in detail *" value={message} onChange={e => setMessage(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3D0E2A]/20"
        />
        <input
          type="text" placeholder="Related order number (optional)" value={orderNo} onChange={e => setOrderNo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3D0E2A]/20"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">Category</label>
            <select
              value={category} onChange={e => setCategory(e.target.value)}
              className="mt-0.5 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3D0E2A]/20"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">Priority</label>
            <select
              value={priority} onChange={e => setPriority(e.target.value)}
              className="mt-0.5 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3D0E2A]/20"
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit" disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#3D0E2A] text-white
              rounded-lg text-sm font-medium hover:bg-[#2A0A1E] transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {loading ? 'Submitting…' : 'Submit Ticket'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SellerSupportPage() {
  const { user }  = useAuth();
  const [tickets, setTickets]       = useState<Ticket[]>([]);
  const [stats, setStats]           = useState({ open: 0, inProgress: 0, resolved: 0, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilter]   = useState('all');
  const [search, setSearch]         = useState('');

  const fetchTickets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId: user.id });
      if (filterStatus !== 'all') params.set('status', filterStatus);
      const res  = await fetch(`/api/seller/support/tickets?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(data.tickets || []);
      setStats(data.stats || { open: 0, inProgress: 0, resolved: 0, total: 0 });
    } catch { /* silent */ }
    setLoading(false);
  }, [user?.id, filterStatus]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const displayed = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(t =>
      t.subject.toLowerCase().includes(q) ||
      t.ticket_number.toLowerCase().includes(q) ||
      (t.related_order_number || '').toLowerCase().includes(q),
    );
  }, [tickets, search]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Support</h2>
          <p className="text-xs text-gray-400 mt-0.5">Raise and track your support requests</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTickets}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowCreate(p => !p)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3D0E2A] text-white rounded-lg text-sm font-medium hover:bg-[#2A0A1E] transition-colors"
          >
            <Plus size={14} /> New Ticket
          </button>
        </div>
      </div>

      {/* New ticket form */}
      {showCreate && user?.id && (
        <NewTicketForm
          userId={user.id}
          onCreated={() => { setShowCreate(false); fetchTickets(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open',        value: stats.open,       color: '#3b82f6', icon: <MessageCircle size={15} /> },
          { label: 'In Progress', value: stats.inProgress, color: '#f59e0b', icon: <Clock size={15} /> },
          { label: 'Resolved',    value: stats.resolved,   color: '#22c55e', icon: <CheckCircle size={15} /> },
          { label: 'Total',       value: stats.total,      color: '#6b7280', icon: <Tag size={15} /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search tickets…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-[#3D0E2A]/20"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-gray-400" />
          <select
            value={filterStatus} onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3D0E2A]/20"
          >
            {['all', 'open', 'in_progress', 'waiting_on_seller', 'resolved', 'closed'].map(s => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ticket list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[80px] bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 px-4">
            <MessageCircle size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No tickets yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "New Ticket" to raise a support request</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayed.map(ticket => {
              const slaP   = slaProgressFn(ticket.created_at, ticket.sla_deadline);
              const slaC   = ticket.sla_breached ? '#ef4444' : slaP >= 70 ? '#f59e0b' : '#22c55e';
              const isDone = ['resolved', 'closed'].includes(ticket.status);
              const isWaiting = ticket.status === 'waiting_on_seller';

              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelected(ticket)}
                  className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors group
                    ${isWaiting ? 'bg-purple-50/40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[ticket.priority]}`} />
                      <p className="text-sm font-medium text-gray-800 truncate">{ticket.subject}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isWaiting && (
                        <span className="text-[11px] font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full animate-pulse">
                          Reply needed
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_META[ticket.status]?.cls}`}>
                        {STATUS_META[ticket.status]?.label}
                      </span>
                      <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                    <span className="font-mono">{ticket.ticket_number}</span>
                    <span>·</span>
                    <span>{ticket.category}</span>
                    {ticket.related_order_number && (
                      <><span>·</span><span>{ticket.related_order_number}</span></>
                    )}
                    <span>·</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>

                  {!isDone && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${slaP}%`, backgroundColor: slaC }} />
                      </div>
                      <span className="text-[10px] font-medium flex-shrink-0" style={{ color: slaC }}>
                        {ticket.sla_breached
                          ? <>{slaTimeLabelFn(ticket.sla_deadline)}</>
                          : slaTimeLabelFn(ticket.sla_deadline)
                        }
                      </span>
                    </div>
                  )}
                  {isDone && ticket.resolved_at && (
                    <p className="text-[11px] text-green-600">
                      Resolved {new Date(ticket.resolved_at).toLocaleDateString()}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Thread modal */}
      {selected && user?.id && (
        <ThreadModal
          ticket={selected}
          userId={user.id}
          onClose={() => setSelected(null)}
          onRefresh={() => {
            fetchTickets();
            fetch(`/api/seller/support/tickets?userId=${user.id}`)
              .then(r => r.json())
              .then(data => {
                const updated = (data.tickets || []).find((t: Ticket) => t.id === selected.id);
                if (updated) setSelected(updated);
              })
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}
