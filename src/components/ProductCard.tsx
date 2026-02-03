'use client';

import { useState } from 'react';
import { CldImage } from 'next-cloudinary';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/data/products';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  // Check if image is a Cloudinary public ID (doesn't start with / or http)
  const isCloudinaryImage = product.image && !product.image.startsWith('/') && !product.image.startsWith('http');

  return (
    <div className="bg-white rounded-xl overflow-hidden card-hover group border border-[#E8E2D9]">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-[#FAF7F2] to-[#F5F0E8]">
        {/* Product Image */}
        {isCloudinaryImage ? (
          <CldImage
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-60">
              {product.category === 'mens' && '👔'}
              {product.category === 'womens' && '👗'}
              {product.category === 'sarees' && '🥻'}
              {product.category === 'kids' && '👶'}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNewArrival && (
            <span className="bg-[#722F37] text-white text-xs font-medium px-3 py-1 rounded-full tracking-wide">
              {t('product.newArrival')}
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-[#C9A962] text-white text-xs font-medium px-3 py-1 rounded-full tracking-wide">
              {t('product.bestSeller')}
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
          <button
            onClick={handleAddToCart}
            className={`text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center space-x-2 transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 ${added ? 'bg-green-600' : 'bg-[#722F37] hover:bg-[#5a252c]'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>{added ? (language === 'hi' ? 'जोड़ा गया!' : 'Added!') : t('product.addToCart')}</span>
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-[#2D2D2D] mb-1 line-clamp-1" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
          {language === 'hi' ? product.nameHi : product.name}
        </h3>
        <p className="text-sm text-[#6B6B6B] mb-3 line-clamp-1">
          {language === 'hi' ? product.fabricHi : product.fabric}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#722F37]">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          <button
            onClick={handleAddToCart}
            className={`text-xs text-white px-3 py-1.5 rounded-full transition-colors ${added ? 'bg-green-600' : 'bg-[#722F37] hover:bg-[#5a252c]'}`}
          >
            {added ? (language === 'hi' ? 'जोड़ा गया!' : 'Added!') : t('product.addToCart')}
          </button>
        </div>
      </div>
    </div>
  );
}
