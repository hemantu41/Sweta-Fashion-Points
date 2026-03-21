'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import QcPipeline, { QcStage } from '@/components/seller/QcPipeline';

interface Product {
  id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  approvalStatus?: string;
  rejectionReason?: string;
  adminNote?: string;
  mainImage?: string;
  images?: string[];
  createdAt?: string;
}

interface FeedbackMessage {
  id: string;
  product_id: string;
  message: string;
  author_type: 'admin' | 'seller';
  author_name: string;
  is_read: boolean;
  created_at: string;
}

function qcStage(status?: string): QcStage {
  switch (status) {
    case 'approved': return 4;
    case 'under_review': return 2;
    case 'rejected': return 3;
    default: return 1;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ProductCard({ product, sellerId }: { product: Product; sellerId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage[]>([]);
  const [fbLoading, setFbLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [resubmitNote, setResubmitNote] = useState('');
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitted, setResubmitted] = useState(false);
  const [status, setStatus] = useState(product.approvalStatus);
  const chatRef = useRef<HTMLDivElement>(null);

  const stage = qcStage(status);
  const isRejected = status === 'rejected';
  const img = product.mainImage || product.images?.[0];

  async function loadFeedback() {
    setFbLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/qc-feedback`).then(r => r.json());
      setFeedback(res.feedback || []);
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 100);
    } finally { setFbLoading(false); }
  }

  function handleExpand() {
    setExpanded(e => !e);
    if (!expanded) loadFeedback();
  }

  async function handleReply() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/products/${product.id}/qc-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText, authorType: 'seller' }),
      });
      setReplyText('');
      await loadFeedback();
    } finally { setSending(false); }
  }

  async function handleResubmit() {
    if (!resubmitNote.trim()) return;
    setResubmitting(true);
    try {
      const res = await fetch(`/api/products/${product.id}/resubmit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, note: resubmitNote }),
      }).then(r => r.json());
      if (res.success) {
        setStatus('pending');
        setResubmitted(true);
        setResubmitNote('');
      }
    } finally { setResubmitting(false); }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex gap-4 p-4 sm:p-5 cursor-pointer" onClick={handleExpand}>
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {img ? (
            <Image src={img} alt={product.name} width={64} height={64} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-800 leading-tight">{product.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{product.productId} · {product.category} · ₹{product.price?.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                isRejected ? 'bg-red-50 text-red-600' :
                status === 'under_review' ? 'bg-blue-50 text-blue-700' :
                resubmitted ? 'bg-green-50 text-green-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                {isRejected ? 'Rejected' : status === 'under_review' ? 'Under Review' : resubmitted ? 'Resubmitted' : 'Pending QC'}
              </span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Submitted {product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      {/* QC pipeline */}
      <div className="px-4 sm:px-5 pb-4">
        <QcPipeline currentStage={stage} rejected={isRejected && !resubmitted} />
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-gray-50">

          {/* Feedback thread */}
          <div className="px-4 sm:px-5 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">QC Feedback Thread</p>

            {/* Admin rejection reason as first message */}
            {(product.rejectionReason || product.adminNote) && (
              <div className="flex gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-[#8B1A1A] flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-white">QC</span>
                </div>
                <div className="flex-1">
                  <div className="inline-block bg-red-50 border border-red-100 rounded-lg rounded-tl-none px-3 py-2 max-w-sm">
                    <p className="text-xs font-semibold text-red-700 mb-1">QC Team</p>
                    <p className="text-sm text-red-800">{product.rejectionReason || product.adminNote}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic feedback messages */}
            {fbLoading ? (
              <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-[#8B1A1A] border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div ref={chatRef} className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {feedback.map(msg => {
                  const isAdmin = msg.author_type === 'admin';
                  return (
                    <div key={msg.id} className={`flex gap-2 ${!isAdmin ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${isAdmin ? 'bg-[#8B1A1A] text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {isAdmin ? 'QC' : 'S'}
                      </div>
                      <div className={`flex-1 ${!isAdmin ? 'flex flex-col items-end' : ''}`}>
                        <div className={`inline-block rounded-lg px-3 py-2 max-w-xs sm:max-w-sm ${
                          isAdmin ? 'bg-blue-50 border border-blue-100 rounded-tl-none' : 'bg-gray-100 rounded-tr-none'
                        }`}>
                          <p className={`text-xs font-semibold mb-0.5 ${isAdmin ? 'text-blue-700' : 'text-gray-600'}`}>{msg.author_name}</p>
                          <p className="text-sm text-gray-800 leading-relaxed">{msg.message}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 px-1">{timeAgo(msg.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                {feedback.length === 0 && !product.rejectionReason && !product.adminNote && (
                  <p className="text-xs text-gray-400 text-center py-4">No feedback yet. We'll notify you once the QC team reviews your product.</p>
                )}
              </div>
            )}

            {/* Reply box */}
            <div className="mt-3 flex gap-2">
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
                placeholder="Reply to QC team…"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A]"
              />
              <button onClick={handleReply} disabled={sending || !replyText.trim()}
                className="px-3 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-40"
                style={{ background: '#8B1A1A' }}>
                {sending ? '…' : 'Send'}
              </button>
            </div>
          </div>

          {/* Resubmit section for rejected products */}
          {isRejected && !resubmitted && (
            <div className="mx-4 sm:mx-5 mt-4 mb-4 p-4 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50">
              <p className="text-sm font-semibold text-amber-800 mb-2">Ready to resubmit?</p>
              <p className="text-xs text-amber-700 mb-3">Address the QC feedback above, make the necessary changes to your listing, then resubmit.</p>
              <textarea
                value={resubmitNote}
                onChange={e => setResubmitNote(e.target.value)}
                placeholder="Briefly describe what you've fixed (required)…"
                rows={2}
                className="w-full text-sm border border-amber-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 resize-none mb-3"
              />
              <div className="flex gap-2">
                <Link
                  href={`/seller/dashboard/products/edit/${product.id}`}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Edit Listing First
                </Link>
                <button onClick={handleResubmit} disabled={resubmitting || !resubmitNote.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50 flex items-center gap-1.5"
                  style={{ background: '#8B1A1A' }}>
                  {resubmitting ? (
                    <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resubmitting…</>
                  ) : 'Fix & Resubmit for Review'}
                </button>
              </div>
            </div>
          )}

          {resubmitted && (
            <div className="mx-4 sm:mx-5 mt-4 mb-4 p-4 rounded-xl bg-green-50 border border-green-100">
              <p className="text-sm font-semibold text-green-700">✓ Resubmitted successfully</p>
              <p className="text-xs text-green-600 mt-1">Your product is back in the QC queue. We'll review it within 24–48 hours.</p>
            </div>
          )}
        </div>
      )}

      {/* Collapsed actions */}
      {!expanded && (
        <div className="px-4 sm:px-5 pb-4 flex gap-2">
          <button onClick={handleExpand}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
            View Feedback
          </button>
          {isRejected && !resubmitted && (
            <button onClick={handleExpand}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-white"
              style={{ background: '#8B1A1A' }}>
              Fix &amp; Resubmit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function QcPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.sellerId) return;
    fetch(`/api/products?sellerId=${user.sellerId}&isActive=all`)
      .then(r => r.json())
      .then(d => {
        const all: Product[] = d.products || [];
        setProducts(all.filter(p => p.approvalStatus !== 'approved' || p.rejectionReason));
      })
      .finally(() => setLoading(false));
  }, [user?.sellerId]);

  const pending = products.filter(p => p.approvalStatus === 'pending' || !p.approvalStatus);
  const underReview = products.filter(p => p.approvalStatus === 'under_review');
  const rejected = products.filter(p => p.approvalStatus === 'rejected');

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>

      {/* Pipeline diagram */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">Product Approval Pipeline</h2>
        <p className="text-xs text-gray-400 mb-6">Every product goes through these 5 stages before going live to customers.</p>
        <QcPipeline currentStage={0} />
        <div className="mt-4 grid grid-cols-5 gap-2 text-center">
          {[
            { label: 'Submitted', desc: 'Product listed by seller' },
            { label: 'Image Check', desc: 'Min 4 clear images' },
            { label: 'Content Review', desc: 'Title, desc & pricing' },
            { label: 'Admin Approval', desc: 'Final sign-off' },
            { label: 'Live', desc: 'Visible to customers' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-[10px] text-gray-400 leading-tight">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending QC', count: pending.length, bg: '#FEF7EA', color: '#8B5E0A', icon: '⏳' },
          { label: 'Under Review', count: underReview.length, bg: '#EBF2FB', color: '#1A3D6B', icon: '🔍' },
          { label: 'Needs Fix', count: rejected.length, bg: '#FDF3F3', color: '#8B1A1A', icon: '⚡' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: s.bg }}>
            <p className="text-lg mb-1">{s.icon}</p>
            <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-playfair)' }}>{s.count}</p>
            <p className="text-xs mt-1" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tips banner if there are rejected products */}
      {rejected.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">You have {rejected.length} product{rejected.length > 1 ? 's' : ''} that need{rejected.length === 1 ? 's' : ''} attention</p>
            <p className="text-xs text-amber-700 mt-0.5">Click on each product card to view detailed QC feedback and resubmit once fixed. Our team reviews resubmissions within 24–48 hours.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <svg className="text-green-600" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">All products approved!</h3>
          <p className="text-sm text-gray-400 mb-4">No products are currently pending review.</p>
          <Link href="/seller/dashboard/add" className="text-sm text-[#8B1A1A] hover:underline font-medium">Add a new product →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(p => (
            <ProductCard key={p.id} product={p} sellerId={user?.sellerId || ''} />
          ))}
        </div>
      )}
    </div>
  );
}
