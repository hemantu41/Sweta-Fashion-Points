'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';

// ─── Seeded mock rating (consistent per product, no real reviews table yet) ───
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
function mockReviewCount(id: string): string {
  const n = seededVal(id, 3571) % 4900 + 100; // 100 – 4999
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;   // MRP / was originalPrice in API
  mainImage?: string;
  images?: string[];
  sizes?: string[];
  fabric?: string;
  stockQuantity?: number;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  seller?: { businessName: string; businessNameHi?: string; city?: string } | null;
  // Optional enrichment fields
  is_sponsored?: boolean;
  is_assured?: boolean;
  trending_direction?: 'up' | 'down' | null;
  avg_rating?: number;
  review_count?: number;
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
  const [hovered,    setHovered]    = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const imgSrc = product.mainImage || product.images?.[0];

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const rating      = product.avg_rating   ?? mockRating(product.id);
  const reviewCount = product.review_count
    ? (product.review_count >= 1000
        ? `${(product.review_count / 1000).toFixed(1)}k`
        : String(product.review_count))
    : mockReviewCount(product.id);

  const stock = product.stockQuantity ?? 999;
  const dealBadge: 'few_left' | 'hot_deal' | null =
    stock <= 5     ? 'few_left' :
    discount >= 60 ? 'hot_deal' :
                     null;

  const discountColor = discount >= 50 ? '#16A34A' : '#C49A3C';

  return (
    <Link href={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', outline: 'none' }}>
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

        {/* ── Image Block ── */}
        <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#F0EBEE' }}>
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
              👗
            </div>
          )}

          {/* Trending badge — top left */}
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

          {/* Wishlist heart — top right */}
          <button
            onClick={e => { e.preventDefault(); setWishlisted(w => !w); }}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(4px)',
              border: 'none', cursor: 'pointer', padding: 0,
              transform: hovered ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 200ms ease',
            }}
          >
            <Heart
              size={16}
              fill={wishlisted ? '#DC2626' : 'none'}
              stroke={wishlisted ? '#DC2626' : '#6B7280'}
              strokeWidth={2}
            />
          </button>
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

          {/* Rating row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 2,
              background: '#F5EDF2', color: '#5B1A3A',
              fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
            }}>
              ★ {rating.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>({reviewCount})</span>
          </div>

        </div>
      </div>
    </Link>
  );
}
