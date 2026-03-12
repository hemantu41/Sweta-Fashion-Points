'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CldImage } from 'next-cloudinary';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import PincodeBanner from '@/components/PincodeBanner';

export default function MensPage() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState<string | null>(categoryFromUrl);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    fetchProducts();
  }, [authLoading]);

  useEffect(() => {
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?category=mens${user?.latitude && user?.longitude ? `&userLat=${user.latitude}&userLng=${user.longitude}` : ''}`, { cache: 'no-store' });
      const data = await response.json();
      setAllProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const fabrics = ['Cotton', 'Polyester', 'Linen', 'Silk', 'Denim', 'Wool'];

  // Muted, sophisticated color palette
  const colors = [
    { name: 'Black', hex: '#1A1A1A' },
    { name: 'White', hex: '#F0EDE8' },
    { name: 'Navy', hex: '#2C3E6B' },
    { name: 'Burgundy', hex: '#7A2535' },
    { name: 'Olive', hex: '#5C6B3A' },
    { name: 'Mustard', hex: '#C4A24A' },
    { name: 'Dusty Rose', hex: '#C48A8A' },
    { name: 'Charcoal', hex: '#4A4A4A' },
    { name: 'Camel', hex: '#C49A6A' },
    { name: 'Brown', hex: '#6B4A2A' },
  ];

  const priceRanges = [
    { label: 'Under ₹500', min: 0, max: 500 },
    { label: '₹500 – ₹1,000', min: 500, max: 1000 },
    { label: '₹1,000 – ₹2,000', min: 1000, max: 2000 },
    { label: '₹2,000 – ₹5,000', min: 2000, max: 5000 },
    { label: 'Above ₹5,000', min: 5000, max: 100000 },
  ];

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };
  const handleFabricToggle = (fabric: string) => {
    setSelectedFabrics(prev => prev.includes(fabric) ? prev.filter(f => f !== fabric) : [...prev, fabric]);
  };
  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };
  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange([min, max]);
  };
  const clearFilters = () => {
    setPriceRange([0, 5000]);
    setSelectedSizes([]);
    setSelectedFabrics([]);
    setSelectedColors([]);
  };

  const filteredProducts = allProducts.filter((product) => {
    if (activeCategory && product.subCategory !== activeCategory) return false;
    const price = parseFloat(product.price);
    if (price < priceRange[0] || price > priceRange[1]) return false;
    if (selectedSizes.length > 0 && product.sizes) {
      if (!selectedSizes.some(size => product.sizes.includes(size))) return false;
    }
    if (selectedFabrics.length > 0 && product.fabric) {
      if (!selectedFabrics.includes(product.fabric)) return false;
    }
    if (selectedColors.length > 0 && product.color) {
      if (!selectedColors.includes(product.color)) return false;
    }
    return true;
  });

  const getCategoryName = () => {
    if (!activeCategory) return language === 'hi' ? 'सभी उत्पाद' : 'All Products';
    const categoryMap: any = {
      'shirts': language === 'hi' ? 'शर्ट' : 'Shirts',
      'tshirts': language === 'hi' ? 'टी-शर्ट' : 'T-Shirts',
      'jeans': language === 'hi' ? 'जींस' : 'Jeans',
      'shorts': language === 'hi' ? 'शॉर्ट्स' : 'Shorts',
    };
    return categoryMap[activeCategory] || activeCategory;
  };

  const categories = [
    { id: null, en: 'All', hi: 'सभी' },
    { id: 'shirts', en: 'Shirts', hi: 'शर्ट' },
    { id: 'tshirts', en: 'T-Shirts', hi: 'टी-शर्ट' },
    { id: 'jeans', en: 'Jeans', hi: 'जींस' },
    { id: 'shorts', en: 'Shorts', hi: 'शॉर्ट्स' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PincodeBanner />

        {/* Breadcrumb — soft grey */}
        <nav className="flex items-center gap-2 text-xs text-[#B0AAA3] mb-6">
          <Link href="/" className="hover:text-[#7A7A7A] transition-colors">
            {language === 'hi' ? 'होम' : 'Home'}
          </Link>
          <span>/</span>
          <Link href="/mens" className="hover:text-[#7A7A7A] transition-colors">
            {language === 'hi' ? 'पुरुषों का कलेक्शन' : "Men's Collection"}
          </Link>
          {activeCategory && (
            <>
              <span>/</span>
              <span className="text-[#8A8A8A]">{getCategoryName()}</span>
            </>
          )}
        </nav>

        <div className="flex gap-8">
          {/* Left Sidebar — minimal, no card */}
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-medium text-[#2D2D2D] uppercase tracking-widest">
                  {language === 'hi' ? 'फ़िल्टर' : 'Filters'}
                </span>
                <button
                  onClick={clearFilters}
                  className="text-xs text-[#9E9E9E] hover:text-[#1A1A1A] underline underline-offset-2 transition-colors"
                >
                  {language === 'hi' ? 'साफ़ करें' : 'Clear All'}
                </button>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-[#E8E2D9]">
                <h3 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-widest mb-3">
                  {language === 'hi' ? 'कीमत' : 'Price'}
                </h3>
                <div className="space-y-2.5">
                  {priceRanges.map((range) => {
                    const checked = priceRange[0] === range.min && priceRange[1] === range.max;
                    return (
                      <label key={range.label} className="flex items-center gap-2.5 cursor-pointer group">
                        {/* Custom radio */}
                        <span
                          onClick={() => handlePriceRangeChange(range.min, range.max)}
                          className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
                            checked ? 'border-[#1A1A1A] bg-[#1A1A1A]' : 'border-[#C4C0BB] group-hover:border-[#6B6B6B]'
                          }`}
                        >
                          {checked && <span className="w-1 h-1 rounded-full bg-white block" />}
                        </span>
                        <span
                          onClick={() => handlePriceRangeChange(range.min, range.max)}
                          className="text-xs text-[#6B6B6B] group-hover:text-[#2D2D2D] transition-colors"
                        >
                          {range.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Size */}
              <div className="mb-6 pb-6 border-b border-[#E8E2D9]">
                <h3 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-widest mb-3">
                  {language === 'hi' ? 'साइज़' : 'Size'}
                </h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeToggle(size)}
                      className={`py-1.5 border text-xs font-medium transition-all ${
                        selectedSizes.includes(size)
                          ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                          : 'bg-white text-[#6B6B6B] border-[#D4D0CB] hover:border-[#1A1A1A]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabric */}
              <div className="mb-6 pb-6 border-b border-[#E8E2D9]">
                <h3 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-widest mb-3">
                  {language === 'hi' ? 'फ़ैब्रिक' : 'Fabric'}
                </h3>
                <div className="space-y-2.5">
                  {fabrics.map((fabric) => {
                    const checked = selectedFabrics.includes(fabric);
                    return (
                      <label key={fabric} className="flex items-center gap-2.5 cursor-pointer group">
                        {/* Custom checkbox */}
                        <span
                          onClick={() => handleFabricToggle(fabric)}
                          className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center transition-all ${
                            checked ? 'border-[#1A1A1A] bg-[#1A1A1A]' : 'border-[#C4C0BB] group-hover:border-[#6B6B6B]'
                          }`}
                        >
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span
                          onClick={() => handleFabricToggle(fabric)}
                          className="text-xs text-[#6B6B6B] group-hover:text-[#2D2D2D] transition-colors"
                        >
                          {fabric}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Colour */}
              <div>
                <h3 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-widest mb-3">
                  {language === 'hi' ? 'रंग' : 'Colour'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleColorToggle(color.name)}
                      title={color.name}
                      className={`w-6 h-6 rounded-full transition-all ring-offset-[2px] ${
                        selectedColors.includes(color.name)
                          ? 'ring-1 ring-[#6B6B6B]'
                          : 'ring-1 ring-transparent hover:ring-[#BCBCBC]'
                      } ${color.hex === '#F0EDE8' ? 'border border-[#D4D0CB]' : ''}`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1">
            {/* Category tabs — text with underline, no pill */}
            <div className="flex flex-wrap gap-6 mb-6 border-b border-[#E8E2D9] pb-0">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={String(cat.id)}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`text-sm pb-3 border-b-2 transition-all -mb-px ${
                      isActive
                        ? 'border-[#1A1A1A] text-[#1A1A1A] font-medium'
                        : 'border-transparent text-[#9E9E9E] hover:text-[#4A4A4A]'
                    }`}
                  >
                    {language === 'hi' ? cat.hi : cat.en}
                  </button>
                );
              })}
            </div>

            {/* Results count */}
            <p className="text-xs text-[#B0AAA3] mb-5">
              {language === 'hi' ? 'दिखा रहे हैं' : 'Showing'}{' '}
              <span className="text-[#6B6B6B]">{filteredProducts.length}</span>{' '}
              {language === 'hi' ? 'उत्पाद' : 'products'}
            </p>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-10 h-10 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
                {filteredProducts.map((product) => {
                  const discountPercent = product.originalPrice && product.price
                    ? Math.round(((parseFloat(product.originalPrice) - parseFloat(product.price)) / parseFloat(product.originalPrice)) * 100)
                    : null;
                  const rating = parseFloat(product.rating) || 4.0;
                  const fullStars = Math.floor(rating);

                  return (
                    <Link key={product.id} href={`/product/${product.id}`} className="group block">
                      {/* Image — portrait, no border/shadow */}
                      <div className="relative aspect-[3/4] bg-[#F0EDE8] overflow-hidden mb-3">
                        {product.mainImage ? (
                          <CldImage
                            src={product.mainImage}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">👔</div>
                        )}
                        {/* New Arrival / Best Seller badge */}
                        {product.isNewArrival && (
                          <span className="absolute top-2 left-2 text-[10px] font-medium bg-white text-[#1A1A1A] px-2 py-0.5 tracking-widest uppercase">
                            New
                          </span>
                        )}
                        {product.isBestSeller && (
                          <span className="absolute top-2 left-2 text-[10px] font-medium bg-[#1A1A1A] text-white px-2 py-0.5 tracking-widest uppercase">
                            Bestseller
                          </span>
                        )}
                      </div>

                      {/* Info — no card, just text */}
                      <div>
                        <h3 className="text-sm text-[#2D2D2D] leading-snug mb-1 line-clamp-1">
                          {product.name}
                        </h3>

                        {/* Stars */}
                        <div className="flex items-center gap-1 mb-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-3 h-3 ${star <= fullStars ? 'text-[#B8962E]' : 'text-[#D4D0CB]'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                          {product.reviews > 0 && (
                            <span className="text-[10px] text-[#B0AAA3] ml-0.5">({product.reviews})</span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-[#1A1A1A]">
                            ₹{parseFloat(product.price).toLocaleString('en-IN')}
                          </span>
                          {product.originalPrice && (
                            <>
                              <span className="text-xs text-[#B0AAA3] line-through">
                                ₹{parseFloat(product.originalPrice).toLocaleString('en-IN')}
                              </span>
                              {discountPercent && (
                                <span className="text-[10px] text-[#7A7A7A]">{discountPercent}% off</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-sm text-[#9E9E9E] mb-4">
                  {language === 'hi' ? 'कोई उत्पाद नहीं मिला' : 'No products found'}
                </p>
                <button
                  onClick={clearFilters}
                  className="text-xs underline underline-offset-2 text-[#5A5A5A] hover:text-[#1A1A1A] transition-colors"
                >
                  {language === 'hi' ? 'फ़िल्टर साफ़ करें' : 'Clear filters'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
