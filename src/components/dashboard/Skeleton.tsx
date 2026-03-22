'use client';

// ─── Loading Skeleton Components ────────────────────────────────────────────

export function SkeletonPulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-3 w-24" />
          <SkeletonPulse className="h-7 w-20" />
          <SkeletonPulse className="h-3 w-32" />
        </div>
        <SkeletonPulse className="w-11 h-11 rounded-xl" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <SkeletonPulse className="h-4 w-40 mb-4" />
      <div className="h-64 flex items-end gap-2 pt-4">
        {[60, 80, 50, 90, 70, 95, 65].map((h, i) => (
          <SkeletonPulse key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <SkeletonPulse className="h-4 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-50">
          <SkeletonPulse className="h-4 w-20" />
          <SkeletonPulse className="h-4 w-28" />
          <SkeletonPulse className="h-4 w-16" />
          <SkeletonPulse className="h-4 w-20" />
          <SkeletonPulse className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
      <SkeletonPulse className="h-4 w-36" />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3 items-start">
          <SkeletonPulse className="w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <SkeletonPulse className="h-3.5 w-full" />
            <SkeletonPulse className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
