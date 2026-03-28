'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, MessageCircle, Package, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminLang } from '@/components/dashboard/LanguageContext';
import { formatINR } from '@/lib/admin/constants';
import { CardSkeleton } from '@/components/dashboard/Skeleton';

interface QCProduct {
  id: string;
  name: string;
  name_hi?: string;
  category: string;
  price: number;
  original_price?: number;
  main_image?: string;
  seller_name: string;
  seller_id: string;
  created_at: string;
  description?: string;
  sizes?: string;
  colors?: string;
}

// Mock pending QC products
const MOCK_QC_QUEUE: QCProduct[] = [
  { id: 'qc-1', name: 'Embroidered Anarkali Suit', name_hi: 'कढ़ाई अनारकली सूट', category: "Women's Wear", price: 1899, original_price: 2499, seller_name: 'Ethnic Corner', seller_id: 'sel-1', created_at: new Date().toISOString(), sizes: 'S,M,L,XL', colors: 'Maroon,Navy' },
  { id: 'qc-2', name: 'Printed Cotton Saree', name_hi: 'प्रिंटेड कॉटन साड़ी', category: 'Sarees', price: 799, original_price: 1199, seller_name: 'Silk House Gaya', seller_id: 'sel-2', created_at: new Date(Date.now() - 3600000).toISOString(), sizes: 'Free', colors: 'Yellow,Green' },
  { id: 'qc-3', name: 'Kids Denim Jacket', name_hi: 'किड्स डेनिम जैकेट', category: "Kids' Wear", price: 649, original_price: 899, seller_name: 'Little Stars', seller_id: 'sel-3', created_at: new Date(Date.now() - 7200000).toISOString(), sizes: '4Y,6Y,8Y,10Y', colors: 'Blue' },
  { id: 'qc-4', name: "Men's Formal Blazer", name_hi: 'पुरुष फॉर्मल ब्लेज़र', category: "Men's Wear", price: 2999, original_price: 4499, seller_name: 'Kumar Textiles', seller_id: 'sel-4', created_at: new Date(Date.now() - 10800000).toISOString(), sizes: 'M,L,XL,XXL', colors: 'Black,Grey' },
  { id: 'qc-5', name: 'Handloom Silk Dupatta', name_hi: 'हैंडलूम सिल्क दुपट्टा', category: 'Accessories', price: 499, original_price: 699, seller_name: 'Craft Corner', seller_id: 'sel-5', created_at: new Date(Date.now() - 14400000).toISOString(), sizes: 'Free', colors: 'Red,Pink,Golden' },
  { id: 'qc-6', name: 'Designer Bridal Lehenga', name_hi: 'डिज़ाइनर ब्राइडल लहंगा', category: "Women's Wear", price: 8999, original_price: 12999, seller_name: 'Fashion Hub', seller_id: 'sel-6', created_at: new Date(Date.now() - 18000000).toISOString(), sizes: 'S,M,L', colors: 'Red,Pink' },
];

export default function QCApprovalPanel() {
  const { t, lang } = useAdminLang();
  const [queue, setQueue] = useState<QCProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentModal, setCommentModal] = useState<{ product: QCProduct; type: 'changes' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    // In production, fetch from /api/admin/products?status=pending
    setTimeout(() => {
      setQueue(MOCK_QC_QUEUE);
      setLoading(false);
    }, 500);
  }, []);

  const handleApprove = (product: QCProduct) => {
    setQueue(prev => prev.filter(p => p.id !== product.id));
    // Notify seller via WhatsApp
    fetch('/api/admin/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'product_approved',
        recipient: product.seller_id,
        message: `Your product "${product.name}" has been approved and is now live.`,
      }),
    }).catch(() => {});
    toast.success(`${t('qc.approved')}: ${product.name}`);
  };

  const handleRequestChanges = () => {
    if (!commentModal || !comment.trim()) return;
    const product = commentModal.product;
    setQueue(prev => prev.filter(p => p.id !== product.id));
    fetch('/api/admin/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'product_changes_requested',
        recipient: product.seller_id,
        message: `Changes requested for "${product.name}": ${comment}`,
      }),
    }).catch(() => {});
    toast.success(`${t('qc.changesRequested')}: ${product.name}`);
    setCommentModal(null);
    setComment('');
  };

  const handleReject = () => {
    if (!commentModal || !comment.trim()) {
      toast.error(t('qc.reasonRequired'));
      return;
    }
    const product = commentModal.product;
    setQueue(prev => prev.filter(p => p.id !== product.id));
    fetch('/api/admin/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'product_rejected',
        recipient: product.seller_id,
        message: `Your product "${product.name}" was rejected. Reason: ${comment}`,
      }),
    }).catch(() => {});
    toast.success(`${t('qc.rejected')}: ${product.name}`);
    setCommentModal(null);
    setComment('');
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
        {queue.length > 0 && (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
            {queue.length} {t('qc.pending')}
          </span>
        )}
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
        {queue.map(product => (
          <div key={product.id} className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] overflow-hidden hover:shadow-md transition-all">
            {/* Image placeholder */}
            <div className="h-36 bg-gray-100 flex items-center justify-center text-gray-300 relative">
              <Package size={40} />
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                {t('qc.pending')}
              </span>
            </div>

            {/* Info */}
            <div className="p-4">
              <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                {lang === 'hi' && product.name_hi ? product.name_hi : product.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-base font-bold text-gray-900">{formatINR(product.price)}</span>
                {product.original_price && (
                  <span className="text-xs text-gray-400 line-through">{formatINR(product.original_price)}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                {product.sizes && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{product.sizes}</span>}
                {product.colors && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{product.colors}</span>}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">{t('cat.seller')}: {product.seller_name}</p>
              <p className="text-[10px] text-gray-300">
                {new Date(product.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-[rgba(196,154,60,0.08)]">
                <button onClick={() => handleApprove(product)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#F5EDF2] text-[#5B1A3A] rounded-lg text-xs font-medium hover:bg-[#EDE0E8] transition-colors">
                  <CheckCircle size={14} />{t('qc.approve')}
                </button>
                <button onClick={() => { setCommentModal({ product, type: 'changes' }); setComment(''); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors">
                  <AlertTriangle size={14} />{t('qc.changes')}
                </button>
                <button onClick={() => { setCommentModal({ product, type: 'reject' }); setComment(''); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                  <XCircle size={14} />{t('qc.reject')}
                </button>
              </div>
            </div>
          </div>
        ))}
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
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{commentModal.product.name}</p>
                <p className="text-xs text-gray-400">{commentModal.product.seller_name} · {formatINR(commentModal.product.price)}</p>
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

            {/* WhatsApp notification info */}
            <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <MessageCircle size={14} className="text-green-600 flex-shrink-0" />
              <p className="text-[10px] text-green-700">{t('qc.sellerNotified')}</p>
            </div>

            {/* Submit */}
            <button
              onClick={commentModal.type === 'changes' ? handleRequestChanges : handleReject}
              disabled={commentModal.type === 'reject' && !comment.trim()}
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
