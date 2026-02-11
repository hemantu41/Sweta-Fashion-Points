'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CldImage } from 'next-cloudinary';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ProductColor } from '@/data/products';

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
  const [added, setAdded] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

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

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-20 px-4 flex flex-col items-center justify-center">
        <p className="text-[#6B6B6B] text-lg mb-4">{t('product.notFound')}</p>
        <Link href="/" className="text-[#722F37] hover:underline">{t('product.goBack')}</Link>
      </div>
    );
  }

  const isFreeSize = product.sizes?.length === 1 && product.sizes[0] === 'Free Size';
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const allImages = product.images?.length > 0 ? product.images : product.image ? [product.image] : [];
  const isCloudinary = (img: string) => img && !img.startsWith('/') && !img.startsWith('http');

  const sizeChartKey = getSizeChartKey(product.category, product.subCategory);
  const chartData = sizeChartData[sizeChartKey];

  const handleAddToCart = () => {
    if (!isFreeSize && !selectedSize) {
      setSizeError(true);
      return;
    }
    addToCart(product, selectedSize || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
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
          <Link href={`/${product.category}`} className="hover:text-[#722F37] transition-colors">
            {language === 'hi' ? categoryLabels[product.category]?.hi : categoryLabels[product.category]?.en}
          </Link>
          <span>/</span>
          <span className="text-[#2D2D2D] font-medium truncate">{language === 'hi' ? product.nameHi : product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {/* Main Image */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-[#F5F0E8]">
              {allImages.length > 0 && isCloudinary(allImages[selectedImage]) ? (
                <CldImage
                  src={allImages[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : allImages.length > 0 && !isCloudinary(allImages[selectedImage]) ? (
                <img src={allImages[selectedImage]} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl opacity-40">
                    {product.category === 'mens' && '👔'}
                    {product.category === 'womens' && '👗'}
                    {product.category === 'sarees' && '🥻'}
                    {product.category === 'kids' && '👶'}
                  </span>
                </div>
              )}
              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 mt-3">
                {allImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-[#722F37] shadow-md' : 'border-[#E8E2D9]'
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
          </div>

          {/* Right Column - Details */}
          <div className="space-y-5">
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
              <h1 className="text-2xl font-bold text-[#2D2D2D]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                {language === 'hi' ? product.nameHi : product.name}
              </h1>
              {product.fabric && (
                <p className="text-sm text-[#6B6B6B] mt-1">{language === 'hi' ? product.fabricHi : product.fabric}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-bold text-[#722F37]">₹{product.price.toLocaleString('en-IN')}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-[#6B6B6B] line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                  <span className="bg-green-100 text-green-700 text-sm font-semibold px-2.5 py-0.5 rounded-full">{discountPercent}% off</span>
                </>
              )}
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[#2D2D2D] mb-2">
                  {t('product.color')}:{' '}
                  <span className="font-normal text-[#6B6B6B]">
                    {language === 'hi' ? product.colors[selectedColor]?.nameHi : product.colors[selectedColor]?.name}
                  </span>
                </p>
                <div className="flex gap-2">
                  {product.colors.map((color: ProductColor, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(idx)}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                        selectedColor === idx ? 'border-[#722F37] shadow-md scale-110' : 'border-[#E8E2D9] hover:border-[#C9A962]'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#2D2D2D]">{t('product.size')}</p>
                {!isFreeSize && (
                  <button onClick={() => setShowSizeChart(true)} className="text-sm text-[#722F37] hover:underline transition-colors">
                    {t('product.sizeChart')}
                  </button>
                )}
              </div>
              {isFreeSize ? (
                <p className="text-sm text-[#6B6B6B] bg-[#F5F0E8] rounded-lg px-4 py-2 inline-block">
                  {t('product.freeSize')}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {product.sizes?.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => { setSelectedSize(size); setSizeError(false); }}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        selectedSize === size
                          ? 'bg-[#722F37] text-white border-[#722F37]'
                          : 'border-[#E8E2D9] text-[#2D2D2D] hover:border-[#722F37]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
              {sizeError && <p className="text-red-500 text-sm mt-1.5">{t('product.selectSize')}</p>}
            </div>

            {/* Delivery Address */}
            <div className="bg-[#F5F0E8] rounded-lg p-4">
              {isAuthenticated ? (
                selectedAddress ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#2D2D2D]">{t('product.deliverTo')}</p>
                      {addresses.length > 1 && (
                        <button onClick={() => setShowAddressDropdown(!showAddressDropdown)} className="text-sm text-[#722F37] hover:underline transition-colors">
                          {t('product.changeAddress')}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-[#6B6B6B] mt-1">
                      <span className="font-medium text-[#2D2D2D]">{selectedAddress.name}</span> —{' '}
                      {selectedAddress.address_line1}
                      {selectedAddress.address_line2 ? `, ${selectedAddress.address_line2}` : ''}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
                    </p>
                    {showAddressDropdown && (
                      <div className="mt-2 border border-[#E8E2D9] rounded-lg bg-white overflow-hidden">
                        {addresses.map((addr: Address) => (
                          <button
                            key={addr.id}
                            onClick={() => { setSelectedAddress(addr); setShowAddressDropdown(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F5F0E8] transition-colors ${
                              selectedAddress?.id === addr.id ? 'bg-[#F5F0E8] font-medium text-[#722F37]' : 'text-[#2D2D2D]'
                            }`}
                          >
                            <span className="font-medium">{addr.name}</span> — {addr.address_line1}, {addr.city}
                            {addr.is_default && <span className="ml-2 text-xs text-[#C9A962]">({language === 'hi' ? 'डिफ़ॉल्ट' : 'Default'})</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B6B6B]">
                    {t('product.deliverTo')}{' '}
                    <Link href="/addresses" className="text-[#722F37] hover:underline">{t('product.addAddress')}</Link>
                  </p>
                )
              ) : (
                <p className="text-sm text-[#6B6B6B]">
                  <Link href="/login" className="text-[#722F37] hover:underline">{t('product.loginDelivery')}</Link>
                </p>
              )}
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className={`w-full py-4 rounded-full text-white font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                added
                  ? 'bg-green-600'
                  : 'bg-gradient-to-r from-[#722F37] to-[#8B3D47] hover:shadow-lg hover:shadow-[#722F37]/25'
              }`}
            >
              {added ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {language === 'hi' ? 'कार्ट में जोड़ा गया!' : 'Added to Cart!'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {t('product.addToCart')}
                </>
              )}
            </button>

            {/* Product Details Card */}
            <div className="bg-white rounded-xl border border-[#E8E2D9] p-5">
              <h3 className="font-semibold text-[#2D2D2D] mb-3" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                {t('product.productDetails')}
              </h3>
              <div className="space-y-0 text-sm">
                <div className="flex justify-between py-2 border-b border-[#F0EDE8]">
                  <span className="text-[#6B6B6B]">{language === 'hi' ? 'श्रेणी' : 'Category'}</span>
                  <span className="font-medium text-[#2D2D2D]">
                    {language === 'hi' ? categoryLabels[product.category]?.hi : categoryLabels[product.category]?.en}
                  </span>
                </div>
                {product.fabric && (
                  <div className="flex justify-between py-2 border-b border-[#F0EDE8]">
                    <span className="text-[#6B6B6B]">{language === 'hi' ? 'कपड़ा' : 'Fabric'}</span>
                    <span className="font-medium text-[#2D2D2D]">{language === 'hi' ? product.fabricHi : product.fabric}</span>
                  </div>
                )}
                <div className="py-2">
                  <span className="text-[#6B6B6B]">{language === 'hi' ? 'विवरण' : 'Description'}</span>
                  <p className="text-[#2D2D2D] mt-1 leading-relaxed">
                    {language === 'hi' ? product.descriptionHi : product.description}
                  </p>
                </div>
              </div>
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
                  {chartData.headers[language].map((h: string, i: number) => (
                    <th key={i} className="text-left px-3 py-2.5 font-semibold text-[#2D2D2D]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.rows.map((row: string[], i: number) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
                    {row.map((cell: string, j: number) => (
                      <td key={j} className="px-3 py-2 text-[#2D2D2D]">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
