'use client';

import { useState } from 'react';
import StarRating from './StarRating';
import SellerResponseForm from './SellerResponseForm';

interface ReviewData {
  id: string;
  order_id: string;
  buyer_name: string;
  rating: number;
  title: string;
  body: string;
  product_name: string;
  verified: boolean;
  helpful_count: number;
  created_at: string;
  spf_seller_responses?: { id: string; response_text: string; created_at: string }[];
}

interface ReviewCardProps {
  review: ReviewData;
  showSellerActions?: boolean;
  onRefresh?: () => void;
}

function maskName(name: string): string {
  return name
    .split(' ')
    .map(part => {
      if (part.length <= 2) return part;
      return part[0] + '***' + part[part.length - 1];
    })
    .join(' ');
}

export default function ReviewCard({ review, showSellerActions = false, onRefresh }: ReviewCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [voted, setVoted] = useState(false);

  const response = review.spf_seller_responses?.[0];
  const isNegative = review.rating <= 2 && !response;
  const displayName = showSellerActions ? maskName(review.buyer_name) : review.buyer_name;

  const handleHelpful = async () => {
    if (voted) return;
    try {
      const res = await fetch(`/api/reviews/${review.id}/helpful`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setHelpfulCount(data.helpfulCount);
        setVoted(true);
      }
    } catch { /* silent */ }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden transition-all ${
        isNegative ? 'border-l-4 border-l-red-400 border-red-100' : 'border-gray-100'
      }`}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
              {review.buyer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{displayName}</span>
                {review.verified && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-medium border border-green-200">
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">{formatDate(review.created_at)}</p>
            </div>
          </div>
          <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md font-medium">{review.product_name}</span>
        </div>

        {/* Rating + title */}
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={review.rating} size={14} />
          <span className="text-sm font-semibold text-gray-800">{review.title}</span>
        </div>

        {/* Body */}
        <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <button
            onClick={handleHelpful}
            disabled={voted}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              voted ? 'text-emerald-600 cursor-default' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
            </svg>
            Helpful ({helpfulCount})
          </button>

          {showSellerActions && isNegative && (
            <button
              onClick={() => setShowReplyForm(f => !f)}
              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
            >
              {showReplyForm ? 'Cancel' : 'Reply'}
            </button>
          )}

          {showSellerActions && response && (
            <button
              onClick={() => setShowReplyForm(f => !f)}
              className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
            >
              {showReplyForm ? 'Cancel' : 'Edit Response'}
            </button>
          )}
        </div>
      </div>

      {/* Seller response display */}
      {response && !showReplyForm && (
        <div className="px-5 pb-4">
          <div className="p-3 bg-amber-50 border-l-3 border-l-amber-400 rounded-lg">
            <p className="text-[11px] text-amber-700 font-semibold mb-1">Seller Response</p>
            <p className="text-sm text-gray-700 leading-relaxed">{response.response_text}</p>
            <p className="text-[10px] text-amber-500 mt-2">{formatDate(response.created_at)}</p>
          </div>
        </div>
      )}

      {/* Reply form */}
      {showSellerActions && showReplyForm && (
        <div className="px-5 pb-4">
          <SellerResponseForm
            reviewId={review.id}
            existingResponse={response?.response_text}
            onResponseSaved={() => {
              setShowReplyForm(false);
              onRefresh?.();
            }}
          />
        </div>
      )}
    </div>
  );
}
