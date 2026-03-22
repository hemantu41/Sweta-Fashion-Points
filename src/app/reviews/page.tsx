'use client';

import { useState, useEffect, useCallback } from 'react';
import ReviewCard from '@/components/reviews/ReviewCard';
import RatingSummary from '@/components/reviews/RatingSummary';

type StarFilter = 'all' | '5' | '4' | '3' | '2' | '1';

export default function PublicReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StarFilter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalCount: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
  });

  const limit = 10;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?filter=${filter}&page=${page}&limit=${limit}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setStats({
          averageRating: data.averageRating || 0,
          totalCount: data.totalCount || 0,
          ratingBreakdown: data.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        });
        setHasMore((data.filteredCount || 0) > page * limit);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [filter, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const starFilters: { key: StarFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: '5', label: '5★' },
    { key: '4', label: '4★' },
    { key: '3', label: '3★' },
    { key: '2', label: '2★' },
    { key: '1', label: '1★' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">Customer Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">What our customers say about Insta Fashion Points</p>
        </div>

        {/* Rating summary */}
        <RatingSummary
          averageRating={stats.averageRating}
          totalCount={stats.totalCount}
          ratingBreakdown={stats.ratingBreakdown}
        />

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {starFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === f.key
                  ? 'bg-[#8B1A1A] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reviews list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div className="space-y-2">
                    <div className="w-24 h-3 bg-gray-200 rounded" />
                    <div className="w-16 h-2 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="w-3/4 h-3 bg-gray-200 rounded mb-2" />
                <div className="w-full h-3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-sm font-medium text-gray-600">No reviews yet</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to share your experience!</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {reviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
