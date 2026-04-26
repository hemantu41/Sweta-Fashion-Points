'use client';

import StarRating from './StarRating';

interface RatingSummaryProps {
  averageRating: number;
  totalCount: number;
  ratingBreakdown: Record<number, number>;
  pendingResponses?: number;
}

export default function RatingSummary({ averageRating, totalCount, ratingBreakdown, pendingResponses }: RatingSummaryProps) {
  const recommended = totalCount > 0
    ? Math.round(((ratingBreakdown[4] || 0) + (ratingBreakdown[5] || 0)) / totalCount * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Average Rating</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-800">{averageRating.toFixed(1)}</span>
            <StarRating rating={averageRating} size={14} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Needs Response</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">
            {pendingResponses ?? 0}
            {(pendingResponses ?? 0) > 0 && (
              <span className="ml-2 inline-flex w-2 h-2 rounded-full bg-red-500" />
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">% Recommended</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{recommended}%</p>
        </div>
      </div>

      {/* Star breakdown bar chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Rating Distribution</h3>
        <div className="space-y-2.5">
          {[5, 4, 3, 2, 1].map(star => {
            const count = ratingBreakdown[star] || 0;
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500 w-8 text-right">{star}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: star >= 4 ? '#10B981' : star === 3 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 font-medium w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
