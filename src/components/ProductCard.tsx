'use client';

import { CldImage } from 'next-cloudinary';
import { useLanguage } from '@/context/LanguageContext';
import type { Product } from '@/data/products';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { language, t } = useLanguage();

  const handleWhatsAppOrder = () => {
    const message = encodeURIComponent(
      `Hi! I'm interested in ${product.name} (₹${product.price}). Can you provide more details?`
    );
    window.open(`https://wa.me/919608063673?text=${message}`, '_blank');
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
            onClick={handleWhatsAppOrder}
            className="bg-[#25D366] text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center space-x-2 hover:bg-[#20BA5A] transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>{t('product.orderWhatsapp')}</span>
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
          <span className="text-xs text-[#6B6B6B] bg-[#F5F0E8] px-2 py-1 rounded-full">
            {t('product.availableInStore')}
          </span>
        </div>
      </div>
    </div>
  );
}
