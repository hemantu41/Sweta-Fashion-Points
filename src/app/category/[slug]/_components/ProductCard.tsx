'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ─── Seeded mock helpers (consistent per product, no real reviews table yet) ──
function seededVal(id: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
function mockRating(id: string): number {
  const v = seededVal(id, 7919) / 2147483647;
  return Math.round((3.4 + v * 1.6) * 10) / 10; // 3.4 – 5.0
}
function mockReviewCount(id: string): number {
  return seededVal(id, 3571) % 4900 + 100; // 100 – 4999
}
// TODO: replace with real data from spf_reviews once aggregates are live
function mockBreakdown(id: string): RatingBreakdown['breakdown'] {
  const s5 = 40 + (seededVal(id, 1111) % 35); // 40–74
  const s4 = 10 + (seededVal(id, 2222) % 20); // 10–29
  const s3 =  5 + (seededVal(id, 3333) % 10); //  5–14
  const rem = Math.max(0, 100 - s5 - s4 - s3);
  const s2 = Math.floor(rem * 0.4);
  const s1 = rem - s2;
  return { 5: s5, 4: s4, 3: s3, 2: s2, 1: s1 };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface RatingBreakdown {
  average: number;
  total: number;
  breakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  mainImage?: string;
  images?: string[];
  sizes?: string[];
  fabric?: string;
  stockQuantity?: number;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  seller?: { businessName: string; businessNameHi?: string; city?: string } | null;
  is_sponsored?: boolean;
  is_assured?: boolean;
  trending_direction?: 'up' | 'down' | null;
  avg_rating?: number;
  review_count?: number;
  // TODO: wire to real aggregated data once spf_reviews aggregates are available
  rating_breakdown?: RatingBreakdown;
}

// ─── Assured shield badge ─────────────────────────────────────────────────────
function AssuredBadge() {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        marginLeft: 5, color: '#1D6FE8', fontSize: 11, fontWeight: 600,
        verticalAlign: 'middle', whiteSpace: 'nowrap',
      }}
    >
      <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
        <path d="M5.5 0L0 2.2V6.5C0 9.6 2.4 12.5 5.5 13C8.6 12.5 11 9.6 11 6.5V2.2L5.5 0Z" fill="#1D6FE8" />
        <path d="M3.5 6.5L4.9 7.9L7.5 5.3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Assured
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);

  const imgSrc = product.mainImage || product.images?.[0];

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const rating      = product.avg_rating ?? mockRating(product.id);
  const reviewTotal = product.review_count ?? mockReviewCount(product.id);
  const reviewLabel = reviewTotal >= 1000
    ? `${(reviewTotal / 1000).toFixed(1)}k`
    : String(reviewTotal);

  // Rating breakdown — real data preferred, mock fallback
  const breakdown = product.rating_breakdown?.breakdown ?? mockBreakdown(product.id);

  const stock = product.stockQuantity ?? 999;
  const dealBadge: 'few_left' | 'hot_deal' | null =
    stock <= 5     ? 'few_left' :
    discount >= 60 ? 'hot_deal' :
                     null;

  const discountColor = discount >= 50 ? '#16A34A' : '#C49A3C';

  return (
    <Link
      href={`/product/${product.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', outline: 'none' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff',
          cursor: 'pointer',
          fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
          boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.12)' : 'none',
          transition: 'box-shadow 200ms ease',
        }}
      >

        {/* ── Image Block — Change 1: bg-white, no border/ring/outline ── */}
        <div className="relative aspect-[3/4] overflow-hidden bg-white">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#E5E7EB' }}>
              
            </div>
          )}

          {/* Trending badge — top left (kept as-is) */}
          {product.trending_direction && (
            <div
              style={{
                position: 'absolute', top: 8, left: 8,
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: product.trending_direction === 'up' ? '#FFF7ED' : '#F0FDF4',
                fontSize: 16, fontWeight: 700,
                color: product.trending_direction === 'up' ? '#F97316' : '#16A34A',
              }}
            >
              {product.trending_direction === 'up' ? '↗' : '↘'}
            </div>
          )}

          {/* Change 2: Wishlist heart removed entirely */}
        </div>

        {/* ── Info Block ── */}
        <div style={{ padding: '8px 10px 12px' }}>

          {/* Sponsored */}
          {product.is_sponsored && (
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px' }}>Sponsored</p>
          )}

          {/* Product name + optional Assured badge */}
          <p
            style={{
              fontSize: 13, color: '#1A1A1A', margin: '0 0 5px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.35,
            } as React.CSSProperties}
          >
            {product.name}
            {product.is_assured && <AssuredBadge />}
          </p>

          {/* Price row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'line-through' }}>
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: discountColor }}>
                  {discount}% off
                </span>
              </>
            )}
          </div>

          {/* Deal / urgency badge */}
          {dealBadge && (
            <div style={{ marginBottom: 5 }}>
              {dealBadge === 'few_left' && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>Only few left</span>
              )}
              {dealBadge === 'hot_deal' && (
                <span style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 700,
                  background: '#16A34A', color: '#fff',
                  padding: '2px 8px', borderRadius: 4,
                }}>
                  Hot Deal
                </span>
              )}
            </div>
          )}

          {/* Change 3: Rating row with hover tooltip breakdown */}
          <div className="relative group/rating inline-flex items-center gap-1 pt-0.5 cursor-default">

            {/* Tooltip — visible on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                            invisible opacity-0
                            group-hover/rating:visible group-hover/rating:opacity-100
                            transition-all duration-200
                            bg-white border border-gray-200 rounded-lg shadow-xl
                            p-3 z-50 min-w-[180px] pointer-events-none">

              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2
                              border-4 border-transparent border-t-white" />

              {/* Header */}
              <p className="text-[12px] font-semibold text-gray-800 mb-1"
                 style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
                Overall Rating
              </p>
              <div className="flex items-center gap-1 mb-2">
                <span style={{ color: '#5B1A3A', fontSize: 13 }}></span>
                <span className="text-[13px] font-bold text-gray-900"
                      style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
                  {rating.toFixed(1)}
                </span>
                <span className="text-[11px] text-gray-400"
                      style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
                  based on {reviewLabel}
                </span>
              </div>

              <div className="border-t border-gray-100 mb-2" />

              {/* Breakdown bars */}
              {([5, 4, 3, 2, 1] as const).map(star => (
                <div key={star} className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] text-gray-500 w-5 text-right"
                        style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
                    {star}
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${breakdown[star]}%`, background: '#5B1A3A' }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 w-7 text-right"
                        style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
                    {breakdown[star]}%
                  </span>
                </div>
              ))}
            </div>

            {/* Visible rating badge */}
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold"
                 style={{ background: '#F5EDF2', color: '#5B1A3A', fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
              <span></span>
              <span>{rating.toFixed(1)}</span>
            </div>
            <span className="text-[11px] text-gray-400"
                  style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
              ({reviewLabel})
            </span>
          </div>

        </div>
      </div>
    </Link>
  );
}
