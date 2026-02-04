'use client';

import Link from 'next/link';
import { CldImage } from 'next-cloudinary';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const { language, t } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-20 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#E8E2D9]">
            <svg className="w-14 h-14 text-[#C9A962]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#2D2D2D] mb-2" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            {t('cart.empty')}
          </h1>
          <p className="text-[#6B6B6B] mb-8 leading-relaxed">{t('cart.emptyDesc')}</p>
          <Link
            href="/"
            className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-medium rounded-full hover:shadow-lg hover:shadow-[#722F37]/25 transition-all duration-300"
          >
            {t('cart.continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
              {t('cart.title')}
            </h1>
            <p className="text-[#6B6B6B] mt-1">{totalItems} {t('cart.items')}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={clearCart}
              className="text-sm text-[#6B6B6B] hover:text-red-600 transition-colors"
            >
              {t('cart.clearCart')}
            </button>
            <Link href="/" className="text-sm text-[#722F37] hover:underline transition-colors">
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const isCloudinary = item.product.image && !item.product.image.startsWith('/') && !item.product.image.startsWith('http');
              return (
                <div key={`${item.product.id}-${item.size || ''}`} className="bg-white rounded-xl border border-[#E8E2D9] p-4 flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-[#F5F0E8]">
                    {isCloudinary ? (
                      <CldImage src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl">
                          {item.product.category === 'mens' && '👔'}
                          {item.product.category === 'womens' && '👗'}
                          {item.product.category === 'sarees' && '🥻'}
                          {item.product.category === 'kids' && '👶'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[#2D2D2D]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                          {language === 'hi' ? item.product.nameHi : item.product.name}
                        </h3>
                        {item.product.fabric && (
                          <p className="text-sm text-[#6B6B6B]">
                            {language === 'hi' ? item.product.fabricHi : item.product.fabric}
                          </p>
                        )}
                        {item.size && (
                          <p className="text-sm text-[#6B6B6B]">
                            {language === 'hi' ? 'साइज़: ' : 'Size: '}{item.size}
                          </p>
                        )}
                        <p className="text-sm font-medium text-[#722F37] mt-0.5">
                          ₹{item.product.price.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.size)}
                        className="text-[#6B6B6B] hover:text-red-600 transition-colors flex-shrink-0 p-0.5"
                        aria-label="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Quantity & Line Total */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#E8E2D9] rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size)}
                          className="w-8 h-8 flex items-center justify-center text-[#6B6B6B] hover:bg-[#F5F0E8] transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center text-sm font-semibold text-[#2D2D2D]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size)}
                          className="w-8 h-8 flex items-center justify-center text-[#6B6B6B] hover:bg-[#F5F0E8] transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      <span className="font-bold text-[#722F37]">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-[#E8E2D9] p-6 sticky top-24">
              <h2 className="text-lg font-bold text-[#2D2D2D] mb-5" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                {t('cart.orderSummary')}
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">{t('cart.subtotal')}</span>
                  <span className="font-medium text-[#2D2D2D]">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">{t('cart.delivery')}</span>
                  <span className="text-green-600 font-semibold">{t('cart.freePickup')}</span>
                </div>
              </div>

              <div className="border-t border-[#E8E2D9] mt-4 pt-4 flex justify-between items-center">
                <span className="font-bold text-[#2D2D2D] text-base">{t('cart.total')}</span>
                <span className="text-xl font-bold text-[#722F37]">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>

              <p className="text-xs text-[#6B6B6B] mt-3 leading-relaxed">{t('cart.storePickup')}</p>

              <a
                href="tel:+919608063673"
                className="flex items-center justify-center gap-2 mt-6 w-full py-4 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-[#722F37]/25 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {t('cart.callToOrder')}
              </a>

              <Link
                href="/contact"
                className="block mt-3 text-center text-sm text-[#722F37] hover:underline transition-colors"
              >
                {t('cart.visitStore')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
