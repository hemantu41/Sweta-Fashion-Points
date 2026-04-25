'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, MessageCircle, Package, X, Send, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminLang } from '@/components/dashboard/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/admin/constants';
import { CardSkeleton } from '@/components/dashboard/Skeleton';

interface QCProduct {
  id: string;
  product_id: string;
  name: string;
  name_hi?: string;
  category: string;
  sub_category?: string;
  price: number;
  original_price?: number;
  main_image?: string;
  seller_id: string;
  created_at: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
  seller?: {
    id: string;
    business_name: string;
    city?: string;
    state?: string;
  };
}

export default function QCApprovalPanel({ onApproved }: { onApproved?: () => void }) {
  const { t, lang } = useAdminLang();
  const { user } = useAuth();
  const [queue, setQueue] = useState<QCProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commentModal, setCommentModal] = useState<{
    product: QCProduct;
    type: 'changes' | 'reject';
  } | null>(null);
  const [comment, setComment] = useState('');

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products/review?status=pending');
      const data = await res.json();
      setQueue(data.products || []);
    } catch {
      toast.error('Failed to load pending products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  async function callReviewApi(productId: string, action: 'approve' | 'reject', rejectionReason?: string) {
    if (!user?.id) { toast.error('Not authenticated'); return false; }
    const res = await fetch('/api/admin/products/review', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, action, rejectionReason, adminUserId: user.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Action failed');
    return true;
  }

  const handleApprove = async (product: QCProduct) => {
    setActionLoading(product.id);
    try {
      await callReviewApi(product.id, 'approve');
      setQueue(prev => prev.filter(p => p.id !== product.id));
      toast.success(`Approved: ${product.name}`);
      onApproved?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestChanges = async () => {
    if (!commentModal || !comment.trim()) return;
    const product = commentModal.product;
    setActionLoading(product.id);
    try {
      await callReviewApi(product.id, 'reject', `Changes requested: ${comment}`);
      setQueue(prev => prev.filter(p => p.id !== product.id));
      toast.success(`Changes requested for: ${product.name}`);
      setCommentModal(null);
      setComment('');
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!commentModal || !comment.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    const product = commentModal.product;
    setActionLoading(product.id);
    try {
      await callReviewApi(product.id, 'reject', comment);
      setQueue(prev => prev.filter(p => p.id !== product.id));
      toast.success(`Rejected: ${product.name}`);
      setCommentModal(null);
      setComment('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{t('qc.title')}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {queue.length} {t('qc.pendingReview')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
              {queue.length} {t('qc.pending')}
            </span>
          )}
          <button
            onClick={fetchQueue}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Refresh">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {queue.length === 0 && (
        <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-10 text-center">
          <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
          <p className="text-sm text-gray-600 font-medium">{t('qc.allClear')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('qc.noPending')}</p>
        </div>
      )}

      {/* Product card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {queue.map(product => {
          const isActing = actionLoading === product.id;
          return (
            <div key={product.id} className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] overflow-hidden hover:shadow-md transition-all">
              {/* Image */}
              {product.main_image ? (
                <img src={product.main_image} alt={product.name} className="w-full h-36 object-cover" />
              ) : (
                <div className="h-36 bg-gray-100 flex items-center justify-center text-gray-300 relative">
                  <Package size={40} />
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                    {t('qc.pending')}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                  {lang === 'hi' && product.name_hi ? product.name_hi : product.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {product.category}{product.sub_category ? ` › ${product.sub_category}` : ''}
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-base font-bold text-gray-900">{formatINR(product.price)}</span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-xs text-gray-400 line-through">{formatINR(product.original_price)}</span>
                  )}
                </div>
                {(product.sizes?.length || product.colors?.length) ? (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
                    {product.sizes && product.sizes.length > 0 && (
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">{product.sizes.join(', ')}</span>
                    )}
                    {product.colors && product.colors.length > 0 && (
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">{product.colors.join(', ')}</span>
                    )}
                  </div>
                ) : null}
                <p className="text-[10px] text-gray-400 mt-2">
                  {product.seller?.business_name || '—'}
                  {product.seller?.city ? ` · ${product.seller.city}` : ''}
                </p>
                <p className="text-[10px] text-gray-300">
                  {new Date(product.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-[rgba(196,154,60,0.08)]">
                  <button
                    onClick={() => handleApprove(product)}
                    disabled={isActing}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#F5EDF2] text-[#5B1A3A] rounded-lg text-xs font-medium hover:bg-[#EDE0E8] transition-colors disabled:opacity-50">
                    <CheckCircle size={14} />{t('qc.approve')}
                  </button>
                  <button
                    onClick={() => { setCommentModal({ product, type: 'changes' }); setComment(''); }}
                    disabled={isActing}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-50">
                    <AlertTriangle size={14} />{t('qc.changes')}
                  </button>
                  <button
                    onClick={() => { setCommentModal({ product, type: 'reject' }); setComment(''); }}
                    disabled={isActing}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50">
                    <XCircle size={14} />{t('qc.reject')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comment modal for Request Changes / Reject */}
      {commentModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setCommentModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                {commentModal.type === 'changes' ? t('qc.requestChangesTitle') : t('qc.rejectTitle')}
              </h3>
              <button onClick={() => setCommentModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Product summary */}
            <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
              {commentModal.product.main_image ? (
                <img src={commentModal.product.main_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-800">{commentModal.product.name}</p>
                <p className="text-xs text-gray-400">
                  {commentModal.product.seller?.business_name || '—'} · {formatINR(commentModal.product.price)}
                </p>
              </div>
            </div>

            {/* Comment box */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                {commentModal.type === 'changes' ? t('qc.changesComment') : t('qc.rejectReason')}
                {commentModal.type === 'reject' && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder={commentModal.type === 'changes' ? t('qc.changesPlaceholder') : t('qc.rejectPlaceholder')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 resize-none"
              />
            </div>

            {/* Seller notified info */}
            <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <MessageCircle size={14} className="text-green-600 flex-shrink-0" />
              <p className="text-[10px] text-green-700">{t('qc.sellerNotified')} — email will be sent automatically.</p>
            </div>

            {/* Submit */}
            <button
              onClick={commentModal.type === 'changes' ? handleRequestChanges : handleReject}
              disabled={
                actionLoading === commentModal.product.id ||
                (commentModal.type === 'reject' && !comment.trim())
              }
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50
                ${commentModal.type === 'changes'
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-red-600 text-white hover:bg-red-700'
                }`}
            >
              <Send size={14} />
              {commentModal.type === 'changes' ? t('qc.sendChanges') : t('qc.confirmReject')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
