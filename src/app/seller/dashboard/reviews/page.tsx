'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import ReviewCard from '@/components/reviews/ReviewCard';
import RatingSummary from '@/components/reviews/RatingSummary';

type FilterType = 'all' | '5' | '4' | '3' | 'negative';

export default function SellerReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [stats, setStats] = useState({
    averageRating: 0,
    totalCount: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
    pendingResponses: 0,
  });

  const fetchReviews = useCallback(async () => {
    if (!user?.sellerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?sellerId=${user.sellerId}&filter=${filter}&limit=50`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setStats({
          averageRating: data.averageRating || 0,
          totalCount: data.totalCount || 0,
          ratingBreakdown: data.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          pendingResponses: data.pendingResponses || 0,
        });
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [user?.sellerId, filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All Reviews' },
    { key: '5', label: '5★' },
    { key: '4', label: '4★' },
    { key: '3', label: '3★' },
    { key: 'negative', label: 'Needs Response' },
  ];

  return (
    <div className="space-y-6">
      {/* Rating summary */}
      <RatingSummary
        averageRating={stats.averageRating}
        totalCount={stats.totalCount}
        ratingBreakdown={stats.ratingBreakdown}
        pendingResponses={stats.pendingResponses}
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === f.key
                ? f.key === 'negative' ? 'bg-red-600 text-white' : 'bg-[#5B1A3A] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {f.label}
            {f.key === 'negative' && stats.pendingResponses > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-[10px] font-bold">
                {stats.pendingResponses}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-[#E8E0E4] p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="w-24 h-3 bg-gray-200 rounded" />
                  <div className="w-16 h-2 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="w-3/4 h-3 bg-gray-200 rounded mb-2" />
              <div className="w-full h-3 bg-gray-100 rounded mb-1" />
              <div className="w-2/3 h-3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E0E4] p-10 text-center">
          <div className="text-4xl mb-3">⭐</div>
          <p className="text-sm font-medium text-gray-600">
            {filter === 'negative' ? 'No reviews need your response' : 'No reviews found'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === 'negative' ? 'Great job! All reviews have been addressed.' : 'Reviews from your customers will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              showSellerActions
              onRefresh={fetchReviews}
            />
          ))}
        </div>
      )}
    </div>
  );
}
