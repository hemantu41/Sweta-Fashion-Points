'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CldImage } from 'next-cloudinary';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const sizeChartData: Record<string, { headers: { en: string[]; hi: string[] }; rows: string[][] }> = {
  mens_top: {
    headers: {
      en: ['Size', 'Chest (in)', 'Length (in)', 'Shoulder (in)'],
      hi: ['साइज़', 'छाती (इंच)', 'लंबाई (इंच)', 'कंधा (इंच)'],
    },
    rows: [
      ['S', '36', '27', '16'],
      ['M', '38', '28', '17'],
      ['L', '40', '29', '17.5'],
      ['XL', '42', '30', '18'],
      ['XXL', '44', '31', '18.5'],
    ],
  },
  mens_bottom: {
    headers: {
      en: ['Size', 'Waist (in)', 'Length (in)'],
      hi: ['साइज़', 'कमर (इंच)', 'लंबाई (इंच)'],
    },
    rows: [
      ['30', '30', '30'],
      ['32', '32', '30.5'],
      ['34', '34', '31'],
      ['36', '36', '31.5'],
      ['38', '38', '32'],
    ],
  },
  womens: {
    headers: {
      en: ['Size', 'Bust (in)', 'Waist (in)', 'Hips (in)'],
      hi: ['साइज़', 'बस्ट (इंच)', 'कमर (इंच)', 'हिप (इंच)'],
    },
    rows: [
      ['XS', '32', '24', '34'],
      ['S', '34', '26', '36'],
      ['M', '36', '28', '38'],
      ['L', '38', '30', '40'],
      ['XL', '40', '32', '42'],
    ],
  },
  kids: {
    headers: {
      en: ['Size', 'Age', 'Height (cm)', 'Chest (cm)'],
      hi: ['साइज़', 'उम्र', 'ऊंचाई (सेमी)', 'छाती (सेमी)'],
    },
    rows: [
      ['4-6Y', '4-6 Yrs', '100-115', '54-58'],
      ['6-8Y', '6-8 Yrs', '115-125', '58-62'],
      ['8-10Y', '8-10 Yrs', '125-140', '62-67'],
    ],
  },
};

function getSizeChartKey(category: string, subCategory: string): string {
  if (category === 'mens' && subCategory === 'jeans') return 'mens_bottom';
  if (category === 'mens') return 'mens_top';
  if (category === 'womens') return 'womens';
  if (category === 'kids') return 'kids';
  return 'mens_top';
}

// Parse beauty product fabric field (format: "Brand: X, Shade: Y, Volume: Z, Expiry: W months")
function parseBeautyDetails(fabric: string): { brand?: string; shade?: string; volume?: string; expiry?: string } {
  const details: any = {};
  const parts = fabric.split(',').map(p => p.trim());
  parts.forEach(part => {
    const [key, value] = part.split(':').map(s => s.trim());
    if (key && value) {
      details[key.toLowerCase()] = value;
    }
  });
  return details;
}

// Parse footwear fabric field (format: "Brand: X, Material: Y")
function parseFootwearDetails(fabric: string): { brand?: string; material?: string } {
  const details: any = {};
  const parts = fabric.split(',').map(p => p.trim());
  parts.forEach(part => {
    const [key, value] = part.split(':').map(s => s.trim());
    if (key && value) {
      details[key.toLowerCase()] = value;
    }
  });
  return details;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

const categoryLabels: Record<string, { en: string; hi: string }> = {
  mens: { en: "Men's", hi: 'पुरुष' },
  womens: { en: "Women's", hi: 'महिला' },
  sarees: { en: 'Sarees', hi: 'साड़ियां' },
  kids: { en: 'Kids', hi: 'बच्चे' },
  beauty: { en: 'Beauty & Makeup', hi: 'ब्यूटी और मेकअप' },
  footwear: { en: 'Footwear', hi: 'जूते' },
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showRatingTooltip, setShowRatingTooltip] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>('description');

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${id}`, { cache: 'no-store' });
        const data = await response.json();
        if (response.ok && data.product) {
          setProduct(data.product);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  // Reset image index when product changes
  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize(null);
    setSelectedColor(0);
  }, [product]);

  // Fetch addresses
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetch(`/api/user/addresses?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.addresses?.length > 0) {
            setAddresses(data.addresses);
            const def = data.addresses.find((a: Address) => a.is_default);
            setSelectedAddress(def || data.addresses[0]);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user?.id]);

  // Auto-select Free Size for sarees
  useEffect(() => {
    if (product?.sizes?.length === 1 && product.sizes[0] === 'Free Size') {
      setSelectedSize('Free Size');
    }
  }, [product]);

  const isFreeSize = product?.sizes?.length === 1 && product.sizes[0] === 'Free Size';
  const discountPercent = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const allImages = product?.images?.length > 0 ? product.images : product?.mainImage ? [product.mainImage] : [];
  const isCloudinary = (img: string) => img && !img.startsWith('/') && !img.startsWith('http');

  const sizeChartKey = product ? getSizeChartKey(product.category, product.subCategory) : 'mens_top';
  const chartData = sizeChartData[sizeChartKey];

  const handleAddToCart = () => {
    if (!product) return;
    // Skip size validation for beauty/footwear products or products without sizes
    const requiresSize = product.sizes && product.sizes.length > 0 && !isFreeSize;
    if (requiresSize && !selectedSize) {
      setSizeError(true);
      return;
    }
    addToCart(product, selectedSize || undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF7F2]">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF7F2]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#722F37] mb-2">Product Not Found</h1>
          <p className="text-[#6B6B6B] mb-4">The product you're looking for doesn't exist.</p>
          <Link href="/" className="px-6 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-full hover:shadow-lg transition-all inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-[#6B6B6B] mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-[#722F37] transition-colors">{t('nav.home')}</Link>
          <span>/</span>
          <Link
            href={product.category === 'beauty' ? '/makeup' : product.category === 'footwear' ? '/footwear' : `/${product.category}`}
            className="hover:text-[#722F37] transition-colors"
          >
            {language === 'hi' ? categoryLabels[product.category]?.hi : categoryLabels[product.category]?.en}
          </Link>
          <span>/</span>
          <span className="text-[#2D2D2D] font-medium truncate">{language === 'hi' ? product.nameHi : product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex gap-3">
              {/* Vertical Thumbnails - Left Side */}
              {allImages.length > 1 && (
                <div className="flex flex-col gap-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        selectedImage === idx ? 'border-[#722F37] shadow-md ring-2 ring-[#722F37]' : 'border-[#E8E2D9] hover:border-[#722F37]'
                      }`}
                    >
                      {isCloudinary(img) ? (
                        <CldImage src={img} alt="" fill className="object-cover" sizes="80px" />
                      ) : (
                        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image - Right Side */}
              <div
                className="flex-1 relative aspect-square rounded-xl overflow-hidden bg-[#F5F0E8] cursor-zoom-in group"
                onMouseEnter={() => allImages.length > 0 ? setZoomImage(allImages[selectedImage]) : null}
                onMouseLeave={() => setZoomImage(null)}
                onClick={() => allImages.length > 0 ? setZoomImage(allImages[selectedImage]) : null}
              >
                {allImages.length > 0 && isCloudinary(allImages[selectedImage]) ? (
                  <CldImage
                    src={allImages[selectedImage]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : allImages.length > 0 && !isCloudinary(allImages[selectedImage]) ? (
                  <img src={allImages[selectedImage]} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-8xl opacity-40">
                      {product.category === 'mens' && '👔'}
                      {product.category === 'womens' && '👗'}
                      {product.category === 'sarees' && '🥻'}
                      {product.category === 'kids' && '👶'}
                      {product.category === 'beauty' && '💄'}
                      {product.category === 'footwear' && '👟'}
                    </span>
                  </div>
                )}
                {/* Zoom hint */}
                <div className="absolute bottom-2 right-2 bg-black/40 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  🔍 Click to zoom
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-3">
            {/* Name & Badges */}
            <div>
              <div className="flex gap-2 mb-2">
                {product.isNewArrival && (
                  <span className="bg-[#722F37] text-white text-xs font-medium px-2.5 py-0.5 rounded-full">{t('product.newArrival')}</span>
                )}
                {product.isBestSeller && (
                  <span className="bg-[#C9A962] text-white text-xs font-medium px-2.5 py-0.5 rounded-full">{t('product.bestSeller')}</span>
                )}
              </div>
              <h1 className="text-3xl font-semibold text-[#1A1A1A] leading-snug tracking-tight" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                {language === 'hi' ? product.nameHi : product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-sm text-[#9E9E9E] line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-[#7A7A7A] font-medium">{discountPercent}% off</span>
                </>
              )}
            </div>

            {/* Colors — placed directly below price */}
            {product.colors && product.colors.length > 0 && product.category !== 'beauty' && (
              <div>
                <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-widest mb-2.5">
                  {t('product.color')}
                  {product.colors[selectedColor] && (
                    <span className="normal-case tracking-normal ml-2 text-[#2D2D2D] font-semibold">
                      {language === 'hi' ? product.colors[selectedColor]?.nameHi : product.colors[selectedColor]?.name}
                    </span>
                  )}
                </p>
                <div className="flex gap-2.5">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedColor(idx);
                        if (allImages.length > 0) {
                          const imagesPerColor = Math.max(1, Math.floor(allImages.length / product.colors.length));
                          const startIndex = idx * imagesPerColor;
                          setSelectedImage(startIndex < allImages.length ? startIndex : idx % allImages.length);
                        }
                      }}
                      className={`w-8 h-8 rounded-full transition-all duration-200 ring-offset-2 ${
                        selectedColor === idx
                          ? 'ring-2 ring-[#1A1A1A] scale-105'
                          : 'ring-1 ring-transparent hover:ring-[#BCBCBC]'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="relative inline-block">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onMouseEnter={() => setShowRatingTooltip(true)}
                onMouseLeave={() => setShowRatingTooltip(false)}
              >
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className={`w-4 h-4 ${star <= 4 ? 'text-[#B8962E]' : 'text-[#D4B86A]'}`} fill={star <= 4 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={star === 5 ? 1.5 : 0} viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-medium text-[#3A3A3A]">4.5</span>
                <span className="text-xs text-[#9E9E9E]">2,456 {language === 'hi' ? 'रेटिंग' : 'ratings'}</span>
              </div>

              {/* Rating Tooltip */}
              {showRatingTooltip && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-[#E8E2D9] rounded-xl shadow-lg p-4 w-64 z-10">
                  <h4 className="font-semibold text-[#2D2D2D] mb-3 text-sm">{language === 'hi' ? 'रेटिंग विवरण' : 'Rating Breakdown'}</h4>
                  <div className="space-y-2">
                    {[
                      { stars: 5, count: 1520, percentage: 62 },
                      { stars: 4, count: 618, percentage: 25 },
                      { stars: 3, count: 221, percentage: 9 },
                      { stars: 2, count: 73, percentage: 3 },
                      { stars: 1, count: 24, percentage: 1 },
                    ].map(({ stars, count, percentage }) => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-xs text-[#6B6B6B] w-8">{stars} ⭐</span>
                        <div className="flex-1 h-2 bg-[#F0EDE8] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#B8962E] transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-[#6B6B6B] w-12 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sizes */}
            {(product.sizes && product.sizes.length > 0) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-widest">{t('product.size')}</p>
                  {!isFreeSize && !['beauty', 'footwear'].includes(product.category) && (
                    <button
                      onClick={() => setShowSizeChart(true)}
                      className="text-xs text-[#5A5A5A] underline underline-offset-2 hover:text-[#1A1A1A] transition-colors flex items-center gap-1"
                    >
                      {t('product.sizeChart')}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v4M13 20h6M16 17l3 3 3-3" />
                      </svg>
                    </button>
                  )}
                </div>
                {isFreeSize ? (
                  <p className="text-sm text-[#6B6B6B] bg-[#F5F0E8] rounded-lg px-4 py-2 inline-block">
                    {t('product.freeSize')}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {product.sizes?.map((size) => (
                      <button
                        key={size}
                        onClick={() => { setSelectedSize(size); setSizeError(false); }}
                        className={`px-5 py-2.5 rounded border text-sm font-medium transition-all duration-200 ${
                          selectedSize === size
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                            : 'border-[#D4D0CB] text-[#3A3A3A] hover:border-[#1A1A1A] bg-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
                {sizeError && <p className="text-red-500 text-sm mt-1.5">{t('product.selectSize')}</p>}
              </div>
            )}

            {/* Delivery Info — clean, no heavy box */}
            <div className="border-t border-[#E8E2D9] pt-3">
              {isAuthenticated ? (
                selectedAddress ? (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-[#6B6B6B] leading-relaxed">
                      <span className="text-[#3A3A3A] font-medium">{t('product.deliverTo')}</span>{' '}
                      <span className="font-medium text-[#2D2D2D]">{selectedAddress.name}</span>{' '}
                      — {selectedAddress.address_line1}{selectedAddress.address_line2 ? `, ${selectedAddress.address_line2}` : ''}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
                    </p>
                    {addresses.length > 1 && (
                      <button
                        onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                        className="text-xs text-[#5A5A5A] underline underline-offset-2 hover:text-[#1A1A1A] whitespace-nowrap transition-colors flex-shrink-0"
                      >
                        {t('product.changeAddress')}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#6B6B6B]">
                    {t('product.deliverTo')}{' '}
                    <Link href="/addresses" className="underline underline-offset-2 hover:text-[#1A1A1A] transition-colors">{t('product.addAddress')}</Link>
                  </p>
                )
              ) : (
                <p className="text-xs text-[#6B6B6B]">
                  <Link href="/login" className="underline underline-offset-2 hover:text-[#1A1A1A] transition-colors">{t('product.loginDelivery')}</Link>
                </p>
              )}
              {showAddressDropdown && addresses.length > 1 && (
                <div className="mt-2 border border-[#E8E2D9] rounded bg-white overflow-hidden">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => { setSelectedAddress(addr); setShowAddressDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-[#FAF7F2] transition-colors ${
                        selectedAddress?.id === addr.id ? 'bg-[#FAF7F2] font-medium text-[#1A1A1A]' : 'text-[#3A3A3A]'
                      }`}
                    >
                      <span className="font-medium">{addr.name}</span> — {addr.address_line1}, {addr.city}
                      {addr.is_default && <span className="ml-2 text-[#C9A962]">({language === 'hi' ? 'डिफ़ॉल्ट' : 'Default'})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-full py-4 rounded-none bg-[#1A1A1A] text-white font-medium text-sm tracking-widest uppercase transition-all duration-300 hover:bg-[#3A3A3A] active:bg-black"
            >
              {t('product.addToCart')}
            </button>

            {/* Accordion — Description / Details & Care / Shipping & Returns */}
            <div className="border-t border-[#E8E2D9]">
              {[
                {
                  id: 'description',
                  label: language === 'hi' ? 'विवरण' : 'Description',
                  content: (
                    <p className="text-sm text-[#4A4A4A] leading-relaxed">
                      {language === 'hi' ? product.descriptionHi : product.description}
                    </p>
                  ),
                },
                {
                  id: 'details',
                  label: language === 'hi' ? 'विवरण और देखभाल' : 'Details & Care',
                  content: (
                    <ul className="space-y-2 text-sm text-[#4A4A4A]">
                      <li className="flex items-start gap-2">
                        <span className="text-[#9E9E9E] mt-0.5">—</span>
                        <span>
                          <span className="font-medium text-[#2D2D2D]">{language === 'hi' ? 'श्रेणी' : 'Category'}:</span>{' '}
                          {language === 'hi' ? categoryLabels[product.category]?.hi : categoryLabels[product.category]?.en}
                        </span>
                      </li>
                      {!['beauty', 'footwear'].includes(product.category) && product.fabric && (
                        <li className="flex items-start gap-2">
                          <span className="text-[#9E9E9E] mt-0.5">—</span>
                          <span>
                            <span className="font-medium text-[#2D2D2D]">{language === 'hi' ? 'कपड़ा' : 'Fabric'}:</span>{' '}
                            {language === 'hi' ? product.fabricHi : product.fabric}
                          </span>
                        </li>
                      )}
                      {product.category === 'beauty' && product.fabric && (() => {
                        const d = parseBeautyDetails(product.fabric);
                        return (
                          <>
                            {d.brand && <li className="flex items-start gap-2"><span className="text-[#9E9E9E] mt-0.5">—</span><span><span className="font-medium text-[#2D2D2D]">{language === 'hi' ? 'ब्रांड' : 'Brand'}:</span> {d.brand}</span></li>}
                            {d.shade && <li className="flex items-start gap-2"><span className="text-[#9E9E9E] mt-0.5">—</span><span><span className="font-medium text-[#2D2D2D]">{language === 'hi' ? 'शेड' : 'Shade'}:</span> {d.shade}</span></li>}
                            {d.volume && <li className="flex items-start gap-2"><span className="text-[#9E9E9E] mt-0.5">—</span><span><span className="font-medium text-[#2D2D2D]">{language === 'hi' ? 'मात्रा' : 'Volume'}:</span> {d.volume}</span></li>}
                            {d.expiry && <li className="flex items-start gap-2"><span className="text-[#9E9E9E] mt-0.5">—</span><span><span className="font-medium text-[#2D2D2D]">{language === 'hi' ? 'समाप्ति' : 'Expiry'}:</span> {d.expiry}</span></li>}
                          </>
                        );
                      })()}
                      {product.category === 'footwear' && product.fabric && (() => {
                        const d = parseFootwearDetails(product.fabric);
                        return (
                          <>
                            {d.brand && <li className="flex items-start gap-2"><span className="text-[#9E9E9E] mt-0.5">—</span><span><span className="font-medium text-[#2D2D2D]">{language === 'hi' ? 'ब्रांड' : 'Brand'}:</span> {d.brand}</span></li>}
                            {d.material && <li className="flex items-start gap-2"><span className="text-[#9E9E9E] mt-0.5">—</span><span><span className="font-medium text-[#2D2D2D]">{language === 'hi' ? 'सामग्री' : 'Material'}:</span> {d.material}</span></li>}
                          </>
                        );
                      })()}
                      <li className="flex items-start gap-2">
                        <span className="text-[#9E9E9E] mt-0.5">—</span>
                        <span>{language === 'hi' ? 'हल्के हाथ से या मशीन में ठंडे पानी से धोएं' : 'Hand wash or machine wash in cold water'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#9E9E9E] mt-0.5">—</span>
                        <span>{language === 'hi' ? 'सीधे धूप में न सुखाएं' : 'Do not tumble dry or bleach'}</span>
                      </li>
                    </ul>
                  ),
                },
                {
                  id: 'shipping',
                  label: language === 'hi' ? 'शिपिंग और वापसी' : 'Shipping & Returns',
                  content: (
                    <ul className="space-y-2 text-sm text-[#4A4A4A]">
                      <li className="flex items-start gap-2">
                        <span className="text-[#9E9E9E] mt-0.5">—</span>
                        <span>{language === 'hi' ? 'सामान्यतः 3–7 कार्यदिवसों में डिलीवरी' : 'Delivery within 3–7 business days'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#9E9E9E] mt-0.5">—</span>
                        <span>{language === 'hi' ? '₹499 से अधिक के ऑर्डर पर निःशुल्क शिपिंग' : 'Free shipping on orders above ₹499'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#9E9E9E] mt-0.5">—</span>
                        <span>
                          {language === 'hi'
                            ? 'डिलीवरी के 7 दिनों के भीतर वापसी की जा सकती है'
                            : 'Easy returns within 7 days of delivery'}
                        </span>
                      </li>
                      {product.seller && (
                        <li className="flex items-start gap-2 pt-1 border-t border-[#F0EDE8] mt-1">
                          <span className="text-[#9E9E9E] mt-0.5">—</span>
                          <span>
                            {language === 'hi' ? 'विक्रेता: ' : 'Sold by '}
                            <span className="font-medium text-[#2D2D2D]">
                              {language === 'hi' && product.seller.businessNameHi ? product.seller.businessNameHi : product.seller.businessName}
                            </span>
                            {product.seller.city ? `, ${product.seller.city}` : ''}
                          </span>
                        </li>
                      )}
                    </ul>
                  ),
                },
              ].map(({ id, label, content }) => (
                <div key={id} className="border-b border-[#E8E2D9]">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === id ? null : id)}
                    className="w-full flex items-center justify-between py-4 text-left"
                  >
                    <span className="text-xs font-medium text-[#2D2D2D] uppercase tracking-widest">{label}</span>
                    <svg
                      className={`w-4 h-4 text-[#6B6B6B] transition-transform duration-200 ${openAccordion === id ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openAccordion === id && (
                    <div className="pb-4">
                      {content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#2D2D2D]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                {t('product.sizeChart')}
              </h3>
              <button onClick={() => setShowSizeChart(false)} className="text-[#6B6B6B] hover:text-[#2D2D2D] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F0E8]">
                  {chartData.headers[language].map((h, i) => (
                    <th key={i} className="text-left px-3 py-2.5 font-semibold text-[#2D2D2D]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-[#2D2D2D]">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {isCloudinary(zoomImage) ? (
              <CldImage
                src={zoomImage}
                alt="Zoomed product"
                width={900}
                height={900}
                className="object-contain max-h-[85vh] rounded-xl shadow-2xl"
              />
            ) : (
              <img src={zoomImage} alt="Zoomed product" className="object-contain max-h-[85vh] max-w-full rounded-xl shadow-2xl" />
            )}
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-[#2D2D2D] rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold shadow"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
