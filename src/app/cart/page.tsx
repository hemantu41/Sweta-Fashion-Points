'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CldImage } from 'next-cloudinary';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

const FREE_SHIPPING_THRESHOLD = 999;

// Category emoji fallback
const categoryEmoji: Record<string, string> = {
  mens: '👔', womens: '👗', sarees: '🥻', kids: '👶', beauty: '💄', footwear: '👟',
};

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const { language, t } = useLanguage();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [pulsePriceIds, setPulsePriceIds] = useState<Set<string>>(new Set());
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const shippingGap = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);
  const shippingProgress = Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100);
  const isFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD;

  // Fetch recommended products
  useEffect(() => {
    fetch('/api/products?limit=8', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const cartIds = new Set(items.map(i => i.product.id));
        const filtered = (data.products || []).filter((p: any) => !cartIds.has(p.id));
        setRecommendedProducts(filtered.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  const handleRemove = (productId: string, size?: string) => {
    const key = `${productId}-${size || ''}`;
    setRemovingIds(prev => new Set(prev).add(key));
    setTimeout(() => {
      removeFromCart(productId, size);
      setRemovingIds(prev => { const n = new Set(prev); n.delete(key); return n; });
    }, 320);
  };

  const handleQuantity = (productId: string, qty: number, size?: string) => {
    const key = `${productId}-${size || ''}`;
    setPulsePriceIds(prev => new Set(prev).add(key));
    setTimeout(() => setPulsePriceIds(prev => { const n = new Set(prev); n.delete(key); return n; }), 400);
    updateQuantity(productId, qty, size);
  };

  // ── EMPTY CART ──────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F6F4] flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm">
          {/* Illustration */}
          <div className="relative w-36 h-36 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-[#F0EDE8]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-16 h-16 text-[#C9A962]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            {/* Floating dots */}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#722F37]/20" />
            <div className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full bg-[#C9A962]/30" />
          </div>

          <h1 className="text-[1.9rem] font-semibold text-[#1A1A1A] mb-2 leading-tight"
            style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            {language === 'hi' ? 'आपकी कार्ट खाली है' : 'Your bag is empty'}
          </h1>
          <p className="text-[14px] text-[#8A8A8A] mb-8 leading-relaxed">
            {language === 'hi'
              ? 'अपनी पसंद के उत्पाद जोड़ें और शॉपिंग का आनंद लें।'
              : 'Looks like you haven\'t added anything yet. Start exploring our collection.'}
          </p>

          <Link href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1A1A1A] text-white text-[12px] font-semibold tracking-[0.18em] uppercase rounded-full hover:bg-[#722F37] transition-colors duration-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            {language === 'hi' ? 'शॉपिंग जारी रखें' : 'Continue Shopping'}
          </Link>
        </div>
      </div>
    );
  }

  // ── CART WITH ITEMS ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F6F4]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">

        {/* ── Cart Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-3">
          <div>
            <h1 className="text-[2.2rem] sm:text-[2.8rem] font-semibold text-[#1A1A1A] leading-none"
              style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
              {language === 'hi' ? 'आपकी कार्ट' : 'Your Bag'}
            </h1>
            <p className="text-[13px] text-[#ADADAD] mt-1.5 tracking-wide">
              {totalItems} {language === 'hi' ? (totalItems === 1 ? 'आइटम' : 'आइटम') : (totalItems === 1 ? 'item' : 'items')} {language === 'hi' ? 'आपके बैग में' : 'in your bag'}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-[11.5px] text-[#ADADAD] hover:text-red-500 tracking-wide transition-colors duration-200 underline-offset-4 hover:underline">
              {language === 'hi' ? 'कार्ट खाली करें' : 'Clear bag'}
            </button>
            <Link href="/"
              className="text-[11.5px] text-[#1A1A1A] font-semibold tracking-[0.12em] uppercase underline-offset-4 hover:underline transition-colors">
              {language === 'hi' ? 'शॉपिंग जारी रखें' : 'Continue Shopping'}
            </Link>
          </div>
        </div>

        {/* ── Clear Confirm ── */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
              <p className="text-[15px] font-medium text-[#1A1A1A] mb-2">
                {language === 'hi' ? 'क्या आप सभी आइटम हटाना चाहते हैं?' : 'Remove all items from bag?'}
              </p>
              <p className="text-[12px] text-[#ADADAD] mb-6">
                {language === 'hi' ? 'यह क्रिया पूर्ववत नहीं की जा सकती।' : 'This action cannot be undone.'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 border border-[#E0DBD4] text-[11.5px] font-semibold uppercase tracking-widest text-[#6B6B6B] rounded-full hover:border-[#1A1A1A] transition-colors">
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button onClick={() => { clearCart(); setShowClearConfirm(false); }}
                  className="flex-1 py-3 bg-red-500 text-white text-[11.5px] font-semibold uppercase tracking-widest rounded-full hover:bg-red-600 transition-colors">
                  {language === 'hi' ? 'हटाएं' : 'Clear'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Two-Column Layout ── */}
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">

          {/* ── LEFT: Cart Items (65%) ── */}
          <div className="flex-1 min-w-0 space-y-3">

            {/* Shipping Progress Bar */}
            <div className="bg-white rounded-2xl px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#F0EDE8]">
              {isFreeShipping ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-[12.5px] font-medium text-[#1A1A1A]">
                    {language === 'hi' ? 'बधाई हो! आपको मुफ्त डिलीवरी मिल रही है' : 'You\'ve unlocked free delivery!'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#8A7A6A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <p className="text-[12px] text-[#6B6B6B]">
                        {language === 'hi'
                          ? `मुफ्त डिलीवरी के लिए ₹${shippingGap.toLocaleString('en-IN')} और जोड़ें`
                          : `Add ₹${shippingGap.toLocaleString('en-IN')} more for free delivery`}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#722F37]">
                      ₹{FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#722F37] to-[#C9A962] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${shippingProgress}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Cart Items */}
            {items.map((item) => {
              const key = `${item.product.id}-${item.size || ''}`;
              const imageUrl = item.product.mainImage || (item.product as any).image;
              const isCloudinary = imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http');
              const isRemoving = removingIds.has(key);
              const isPulsing = pulsePriceIds.has(key);
              const originalPrice = (item.product as any).originalPrice;
              const discountPercent = originalPrice && parseFloat(String(originalPrice)) > item.product.price
                ? Math.round(((parseFloat(String(originalPrice)) - item.product.price) / parseFloat(String(originalPrice))) * 100)
                : null;

              return (
                <div
                  key={key}
                  className={`bg-white rounded-2xl border border-[#F0EDE8] shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-300 ${isRemoving ? 'opacity-0 scale-95 -translate-x-4' : 'opacity-100 scale-100 translate-x-0'}`}
                >
                  <div className="flex gap-4 p-4 sm:p-5">

                    {/* Product Image */}
                    <Link href={`/product/${item.product.id}`} className="flex-shrink-0 group">
                      <div className="relative w-[90px] h-[110px] sm:w-[100px] sm:h-[124px] rounded-xl overflow-hidden bg-[#F0EDE8]">
                        {isCloudinary ? (
                          <CldImage
                            src={imageUrl} alt={item.product.name} fill
                            sizes="110px"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : imageUrl?.startsWith('http') ? (
                          <img src={imageUrl} alt={item.product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            {categoryEmoji[(item.product as any).category] || '🛍️'}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/product/${item.product.id}`}>
                            <h3 className="text-[13.5px] sm:text-[14.5px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2 hover:text-[#722F37] transition-colors"
                              style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                              {language === 'hi' ? (item.product as any).nameHi || item.product.name : item.product.name}
                            </h3>
                          </Link>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                            {(item.product as any).fabric && (
                              <span className="text-[11.5px] text-[#ADADAD]">
                                {language === 'hi' ? (item.product as any).fabricHi || (item.product as any).fabric : (item.product as any).fabric}
                              </span>
                            )}
                            {item.size && (
                              <span className="text-[11.5px] text-[#ADADAD]">
                                {language === 'hi' ? `साइज़: ${item.size}` : `Size: ${item.size}`}
                              </span>
                            )}
                          </div>

                          {/* Price */}
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className={`text-[14px] font-semibold text-[#1A1A1A] transition-all duration-300 ${isPulsing ? 'scale-110 text-[#722F37]' : ''}`}>
                              ₹{item.product.price.toLocaleString('en-IN')}
                            </span>
                            {originalPrice && parseFloat(String(originalPrice)) > item.product.price && (
                              <>
                                <span className="text-[11px] text-[#ADADAD] line-through">
                                  ₹{parseFloat(String(originalPrice)).toLocaleString('en-IN')}
                                </span>
                                {discountPercent && (
                                  <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">
                                    {discountPercent}% off
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemove(item.product.id, item.size)}
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[#C8C0B8] hover:text-red-500 hover:bg-red-50 transition-all duration-200 group"
                          aria-label="Remove item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Quantity + Line Total */}
                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Selector */}
                        <div className="flex items-center border border-[#E8E2D9] rounded-full overflow-hidden">
                          <button
                            onClick={() => handleQuantity(item.product.id, item.quantity - 1, item.size)}
                            className="w-8 h-8 flex items-center justify-center text-[#6B6B6B] hover:bg-[#F8F6F4] hover:text-[#1A1A1A] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-9 h-8 flex items-center justify-center text-[13px] font-semibold text-[#1A1A1A] select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantity(item.product.id, item.quantity + 1, item.size)}
                            className="w-8 h-8 flex items-center justify-center text-[#6B6B6B] hover:bg-[#F8F6F4] hover:text-[#1A1A1A] transition-colors"
                            aria-label="Increase quantity"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>

                        {/* Line Total */}
                        <span className={`text-[14px] font-bold text-[#1A1A1A] transition-all duration-300 ${isPulsing ? 'scale-110 text-[#722F37]' : ''}`}>
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── You May Also Like ── */}
            {recommendedProducts.length > 0 && (
              <div className="mt-10">
                <h2 className="text-[15px] font-semibold text-[#1A1A1A] mb-4 tracking-wide"
                  style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                  {language === 'hi' ? 'आपको ये भी पसंद आ सकते हैं' : 'You May Also Like'}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {recommendedProducts.map((product) => {
                    const isCloudinary = product.mainImage && !product.mainImage.startsWith('/') && !product.mainImage.startsWith('http');
                    const discount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)
                      ? Math.round(((parseFloat(product.originalPrice) - parseFloat(product.price)) / parseFloat(product.originalPrice)) * 100)
                      : null;
                    return (
                      <Link key={product.id} href={`/product/${product.id}`} className="group">
                        <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-300">
                          <div className="relative aspect-[3/4] bg-[#F0EDE8] overflow-hidden">
                            {product.mainImage && isCloudinary ? (
                              <CldImage src={product.mainImage} alt={product.name} fill sizes="200px"
                                className="object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl">
                                {categoryEmoji[product.category] || '🛍️'}
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-[11.5px] font-medium text-[#1A1A1A] line-clamp-1 mb-1">{product.name}</p>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[12.5px] font-semibold text-[#1A1A1A]">
                                ₹{parseFloat(product.price).toLocaleString('en-IN')}
                              </span>
                              {discount && <span className="text-[10px] text-green-600 font-medium">{discount}% off</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Order Summary (35%) ── */}
          <div className="lg:w-[360px] xl:w-[400px] flex-shrink-0">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl border border-[#F0EDE8] shadow-[0_4px_24px_rgba(0,0,0,0.07)] overflow-hidden">

                {/* Summary Header */}
                <div className="px-6 pt-6 pb-4 border-b border-[#F0EDE8]">
                  <h2 className="text-[16px] font-semibold text-[#1A1A1A]"
                    style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                    {language === 'hi' ? 'ऑर्डर सारांश' : 'Order Summary'}
                  </h2>
                  <p className="text-[11.5px] text-[#ADADAD] mt-0.5">
                    {totalItems} {language === 'hi' ? 'आइटम' : totalItems === 1 ? 'item' : 'items'}
                  </p>
                </div>

                <div className="px-6 py-5 space-y-3.5">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-[#6B6B6B]">
                      {language === 'hi' ? 'उप-योग' : 'Subtotal'}
                    </span>
                    <span className="text-[13px] font-medium text-[#1A1A1A]">
                      ₹{totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Delivery */}
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-[#6B6B6B]">
                      {language === 'hi' ? 'डिलीवरी' : 'Delivery'}
                    </span>
                    {isFreeShipping ? (
                      <span className="text-[12px] font-semibold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                        {language === 'hi' ? 'मुफ्त' : 'Free'}
                      </span>
                    ) : (
                      <span className="text-[13px] text-[#ADADAD]">
                        {language === 'hi' ? 'स्टोर पिकअप' : 'Store Pickup'}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed border-[#E8E2D9] pt-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] font-semibold text-[#1A1A1A]">
                        {language === 'hi' ? 'कुल' : 'Total'}
                      </span>
                      <div className="text-right">
                        <span className="text-[22px] font-bold text-[#1A1A1A] tracking-tight">
                          ₹{totalPrice.toLocaleString('en-IN')}
                        </span>
                        <p className="text-[10px] text-[#ADADAD] mt-0.5">
                          {language === 'hi' ? 'सभी करों सहित' : 'Inclusive of all taxes'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <div className="px-6 pb-6">
                  <Link href="/checkout"
                    className="flex items-center justify-center gap-2.5 w-full py-4 bg-[#1A1A1A] text-white text-[12px] font-semibold tracking-[0.18em] uppercase rounded-full hover:bg-[#722F37] transition-colors duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(114,47,55,0.35)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {language === 'hi' ? 'चेकआउट करें' : 'Proceed to Checkout'}
                  </Link>

                  <Link href="/"
                    className="block text-center text-[11px] text-[#ADADAD] mt-3 hover:text-[#722F37] transition-colors tracking-wide">
                    {language === 'hi' ? 'या शॉपिंग जारी रखें' : 'or continue shopping'}
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="bg-[#F8F6F4] px-6 py-4 grid grid-cols-3 gap-2 border-t border-[#F0EDE8]">
                  {[
                    {
                      icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      ),
                      label: language === 'hi' ? 'सुरक्षित भुगतान' : 'Secure Payment',
                    },
                    {
                      icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ),
                      label: language === 'hi' ? 'आसान रिटर्न' : 'Easy Returns',
                    },
                    {
                      icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      ),
                      label: language === 'hi' ? `₹999 पर मुफ्त` : 'Free over ₹999',
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 text-center">
                      <div className="w-8 h-8 rounded-full bg-white border border-[#E8E2D9] flex items-center justify-center text-[#8A7A6A] shadow-sm">
                        {item.icon}
                      </div>
                      <span className="text-[9.5px] text-[#8A8A8A] leading-tight font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Checkout ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E2D9] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div>
            <p className="text-[10px] text-[#ADADAD] uppercase tracking-wide">{language === 'hi' ? 'कुल' : 'Total'}</p>
            <p className="text-[17px] font-bold text-[#1A1A1A]">₹{totalPrice.toLocaleString('en-IN')}</p>
          </div>
          <Link href="/checkout"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#1A1A1A] text-white text-[11.5px] font-semibold tracking-[0.15em] uppercase rounded-full hover:bg-[#722F37] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {language === 'hi' ? 'चेकआउट' : 'Checkout'}
          </Link>
        </div>
      </div>
      {/* Bottom padding for mobile sticky bar */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
