'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

// ─── Seeded mock rating (consistent per product, no real reviews table yet) ──
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

function mockReviews(id: string): string {
  const n = seededVal(id, 3571) % 4900 + 100; // 100 – 4999
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  mainImage?: string;
  images?: string[];
  sizes?: string[];
  fabric?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  seller?: { businessName: string; businessNameHi?: string; city?: string } | null;
}

interface Props { product: Product }

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductCard({ product }: Props) {
  const [hovered, setHovered] = useState(false);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const extraImages = Math.max(0, (product.images?.length ?? 0) - 1);
  const rating      = mockRating(product.id);
  const reviews     = mockReviews(product.id);

  return (
    <Link href={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #F3F4F6',
          boxShadow: hovered
            ? '0 8px 24px rgba(91,26,58,0.12)'
            : '0 1px 4px rgba(0,0,0,0.05)',
          transition: 'box-shadow 0.22s ease, transform 0.22s ease',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          cursor: 'pointer',
          fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
        }}
      >
        {/* ── Image ── */}
        <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#F9F5F3' }}>
          {product.mainImage ? (
            <img
              src={product.mainImage}
              alt={product.name}
              loading="lazy"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.35s ease',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#E5E7EB' }}>👗</div>
          )}

          {/* Badges — top left */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {product.isNewArrival && (
              <span style={{ background: '#5B1A3A', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.06em' }}>
                NEW
              </span>
            )}
            {product.isBestSeller && (
              <span style={{ background: '#C49A3C', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.06em' }}>
                BESTSELLER
              </span>
            )}
          </div>

          {/* Discount badge — top right */}
          {discount > 0 && (
            <span style={{ position: 'absolute', top: 8, right: 8, background: '#16A34A', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5 }}>
              {discount}% off
            </span>
          )}

          {/* +N more images — bottom left */}
          {extraImages > 0 && (
            <span style={{ position: 'absolute', bottom: 44, left: 8, background: 'rgba(0,0,0,0.54)', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 5 }}>
              +{extraImages} more
            </span>
          )}

          {/* Add to cart — slides up on hover */}
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: '#5B1A3A',
              padding: '10px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: '#fff', fontSize: 13, fontWeight: 600,
              transform: hovered ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.2s ease-in-out',
            }}
          >
            <ShoppingCart size={14} />
            Add to Cart
          </div>
        </div>

        {/* ── Info ── */}
        <div style={{ padding: '10px 11px 13px' }}>
          {/* Name — single line, truncate */}
          <p style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.name}
          </p>

          {/* Seller */}
          {product.seller && (
            <p style={{ fontSize: 10, color: '#C49A3C', fontWeight: 600, margin: '0 0 6px' }}>
              🏪 {product.seller.businessName}
              {product.seller.city ? `, ${product.seller.city.toUpperCase()}` : ''}
            </p>
          )}

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through' }}>
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>
                  {discount}% off
                </span>
              </>
            )}
          </div>

          {/* Free delivery pill */}
          <div style={{ marginBottom: 6 }}>
            <span style={{ display: 'inline-block', border: '1px solid #E5E7EB', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#6B7280', fontWeight: 500 }}>
              Free Delivery
            </span>
          </div>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: '#5B1A3A', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
              ⭐ {rating}
            </span>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>({reviews})</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
