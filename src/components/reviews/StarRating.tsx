'use client';

import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
}

export default function StarRating({ rating, size = 16, interactive = false, onChange, showValue = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const display = interactive && hovered > 0 ? hovered : rating;

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => {
          const filled = star <= Math.floor(display);
          const half = !filled && star - 0.5 <= display;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(star)}
              onMouseEnter={() => interactive && setHovered(star)}
              onMouseLeave={() => interactive && setHovered(0)}
              className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
              style={{ padding: 0, background: 'none', border: 'none' }}
            >
              <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={filled ? '#F59E0B' : half ? 'url(#halfGrad)' : '#E5E7EB'}
                  stroke={filled || half ? '#F59E0B' : '#D1D5DB'}
                  strokeWidth="1"
                />
                {half && (
                  <defs>
                    <linearGradient id="halfGrad">
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="50%" stopColor="#E5E7EB" />
                    </linearGradient>
                  </defs>
                )}
              </svg>
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-gray-700 ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
