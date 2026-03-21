'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CldImage } from 'next-cloudinary';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import PincodeBanner from '@/components/PincodeBanner';

export default function SareesPage() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState<string | null>(categoryFromUrl);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    fetchProducts();
  }, [authLoading]);

  // Update active category when URL changes
  useEffect(() => {
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?category=sarees${user?.latitude && user?.longitude ? `&userLat=${user.latitude}&userLng=${user.longitude}` : ''}`, { cache: 'no-store' });
      const data = await response.json();
      setAllProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  const sizes = ['Free Size', 'Standard', '5.5m', '6m', '6.5m'];
  const fabrics = ['Silk', 'Cotton', 'Georgette', 'Chiffon', 'Banarasi', 'Kanjivaram', 'Crepe', 'Net'];
  const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#CC0000' },
    { name: 'Pink', hex: '#FF69B4' },
    { name: 'Blue', hex: '#0066CC' },
    { name: 'Green', hex: '#00AA00' },
    { name: 'Yellow', hex: '#FFD700' },
    { name: 'Purple', hex: '#800080' },
    { name: 'Orange', hex: '#FF8C00' },
    { name: 'Gold', hex: '#FFD700' },
  ];

  const priceRanges = [
    { label: 'Under ₹1000', min: 0, max: 1000 },
    { label: '₹1000 - ₹2500', min: 1000, max: 2500 },
    { label: '₹2500 - ₹5000', min: 2500, max: 5000 },
    { label: '₹5000 - ₹10000', min: 5000, max: 10000 },
    { label: 'Above ₹10000', min: 10000, max: 100000 },
  ];

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleFabricToggle = (fabric: string) => {
    setSelectedFabrics(prev =>
      prev.includes(fabric) ? prev.filter(f => f !== fabric) : [...prev, fabric]
    );
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange([min, max]);
  };

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedSizes([]);
    setSelectedFabrics([]);
    setSelectedColors([]);
  };

  // Apply filters
  const filteredProducts = allProducts.filter((product) => {
    // Category filter
    if (activeCategory && product.subCategory !== activeCategory) return false;

    // Price filter
    const price = parseFloat(product.price);
    if (price < priceRange[0] || price > priceRange[1]) return false;

    // Size filter
    if (selectedSizes.length > 0 && product.sizes) {
      const hasSize = selectedSizes.some(size => product.sizes.includes(size));
      if (!hasSize) return false;
    }

    // Fabric filter
    if (selectedFabrics.length > 0 && product.fabric) {
      if (!selectedFabrics.includes(product.fabric)) return false;
    }

    // Color filter
    if (selectedColors.length > 0 && product.color) {
      if (!selectedColors.includes(product.color)) return false;
    }

    return true;
  });

  // Get category name for breadcrumb
  const getCategoryName = () => {
    if (!activeCategory) return language === 'hi' ? 'सभी साड़ियां' : 'All Sarees';
    const categoryMap: any = {
      'daily': language === 'hi' ? 'डेली वियर' : 'Daily Wear',
      'party': language === 'hi' ? 'पार्टी वियर' : 'Party Wear',
      'wedding': language === 'hi' ? 'वेडिंग' : 'Wedding',
      'festival': language === 'hi' ? 'फेस्टिवल' : 'Festival',
    };
    return categoryMap[activeCategory] || activeCategory;
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PincodeBanner />
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/" className="text-[#6B6B6B] hover:text-[#722F37] transition-colors">
            {language === 'hi' ? 'होम' : 'Home'}
          </Link>
          <span className="text-[#6B6B6B]">&gt;&gt;</span>
          <Link href="/sarees" className="text-[#6B6B6B] hover:text-[#722F37] transition-colors">
            {language === 'hi' ? 'साड़ी कलेक्शन' : 'Sarees Collection'}
          </Link>
          {activeCategory && (
            <>
              <span className="text-[#6B6B6B]">&gt;&gt;</span>
              <span className="text-[#722F37] font-medium">{getCategoryName()}</span>
            </>
          )}
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E2D9] p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#2D2D2D]">
                  {language === 'hi' ? 'फ़िल्टर' : 'Filters'}
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-xs text-[#722F37] hover:underline"
                >
                  {language === 'hi' ? 'साफ़ करें' : 'Clear All'}
                </button>
              </div>

              {/* Price Filter */}
              <div className="mb-6 pb-6 border-b border-[#E8E2D9]">
                <h3 className="font-semibold text-[#2D2D2D] mb-3 text-sm uppercase tracking-wide">
                  {language === 'hi' ? 'कीमत' : 'Price'}
                </h3>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priceRange"
                        checked={priceRange[0] === range.min && priceRange[1] === range.max}
                        onChange={() => handlePriceRangeChange(range.min, range.max)}
                        className="w-4 h-4 text-[#722F37] focus:ring-[#722F37]"
                      />
                      <span className="text-sm text-[#6B6B6B]">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              <div className="mb-6 pb-6 border-b border-[#E8E2D9]">
                <h3 className="font-semibold text-[#2D2D2D] mb-3 text-sm uppercase tracking-wide">
                  {language === 'hi' ? 'साइज़' : 'Size'}
                </h3>
                <div className="space-y-2">
                  {sizes.map((size) => (
                    <label key={size} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() => handleSizeToggle(size)}
                        className="w-4 h-4 text-[#722F37] focus:ring-[#722F37] rounded"
                      />
                      <span className="text-sm text-[#6B6B6B]">{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fabric Filter */}
              <div className="mb-6 pb-6 border-b border-[#E8E2D9]">
                <h3 className="font-semibold text-[#2D2D2D] mb-3 text-sm uppercase tracking-wide">
                  {language === 'hi' ? 'फ़ैब्रिक' : 'Fabric'}
                </h3>
                <div className="space-y-2">
                  {fabrics.map((fabric) => (
                    <label key={fabric} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFabrics.includes(fabric)}
                        onChange={() => handleFabricToggle(fabric)}
                        className="w-4 h-4 text-[#722F37] focus:ring-[#722F37] rounded"
                      />
                      <span className="text-sm text-[#6B6B6B]">{fabric}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div className="mb-4">
                <h3 className="font-semibold text-[#2D2D2D] mb-3 text-sm uppercase tracking-wide">
                  {language === 'hi' ? 'रंग' : 'Colour'}
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleColorToggle(color.name)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColors.includes(color.name)
                          ? 'border-[#722F37] ring-2 ring-[#722F37] ring-offset-2'
                          : 'border-[#E8E2D9] hover:border-[#722F37]'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Products */}
          <div className="flex-1">
            {/* Category Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E2D9] p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === null
                      ? 'bg-[#722F37] text-white'
                      : 'bg-[#F0EDE8] text-[#6B6B6B] hover:bg-[#E8E2D9]'
                  }`}
                >
                  {language === 'hi' ? 'सभी' : 'All'}
                </button>
                <button
                  onClick={() => setActiveCategory('daily')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === 'daily'
                      ? 'bg-[#722F37] text-white'
                      : 'bg-[#F0EDE8] text-[#6B6B6B] hover:bg-[#E8E2D9]'
                  }`}
                >
                  {language === 'hi' ? 'डेली वियर' : 'Daily Wear'}
                </button>
                <button
                  onClick={() => setActiveCategory('party')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === 'party'
                      ? 'bg-[#722F37] text-white'
                      : 'bg-[#F0EDE8] text-[#6B6B6B] hover:bg-[#E8E2D9]'
                  }`}
                >
                  {language === 'hi' ? 'पार्टी वियर' : 'Party Wear'}
                </button>
                <button
                  onClick={() => setActiveCategory('wedding')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === 'wedding'
                      ? 'bg-[#722F37] text-white'
                      : 'bg-[#F0EDE8] text-[#6B6B6B] hover:bg-[#E8E2D9]'
                  }`}
                >
                  {language === 'hi' ? 'वेडिंग' : 'Wedding'}
                </button>
                <button
                  onClick={() => setActiveCategory('festival')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === 'festival'
                      ? 'bg-[#722F37] text-white'
                      : 'bg-[#F0EDE8] text-[#6B6B6B] hover:bg-[#E8E2D9]'
                  }`}
                >
                  {language === 'hi' ? 'फेस्टिवल' : 'Festival'}
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-sm text-[#6B6B6B]">
                {language === 'hi' ? 'दिखा रहे हैं' : 'Showing'} <span className="font-semibold text-[#2D2D2D]">{filteredProducts.length}</span> {language === 'hi' ? 'साड़ियां' : 'sarees'}
              </p>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  // Calculate discount percentage
                  const discountPercent = product.originalPrice && product.price
                    ? Math.round(((parseFloat(product.originalPrice) - parseFloat(product.price)) / parseFloat(product.originalPrice)) * 100)
                    : null;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl shadow-sm border border-[#E8E2D9] overflow-hidden hover:shadow-lg transition-shadow group"
                    >
                      <Link href={`/product/${product.id}`}>
                        <div className="relative aspect-[3/4] bg-[#F0EDE8] overflow-hidden">
                          {product.mainImage ? (
                            <CldImage
                              src={product.mainImage}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl">
                              🥻
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-[#2D2D2D] mb-1 line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-sm text-[#6B6B6B] mb-2 line-clamp-2">
                            {product.description || product.name}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-bold text-[#722F37]">
                              ₹{product.price}
                            </span>
                            {product.originalPrice && (
                              <>
                                <span className="text-sm text-[#6B6B6B] line-through">
                                  ₹{product.originalPrice}
                                </span>
                                {discountPercent && (
                                  <span className="text-xs text-green-600 font-semibold">
                                    ({discountPercent}% off)
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          {/* Size Options */}
                          {product.sizes && (
                            <div className="flex gap-1 mb-2">
                              {product.sizes.slice(0, 4).map((size: string) => (
                                <span
                                  key={size}
                                  className="px-2 py-1 border border-[#E8E2D9] rounded text-xs text-[#6B6B6B]"
                                >
                                  {size}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Rating */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                              <span>{(product.rating || 4.0).toFixed(1)}</span>
                              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                              </svg>
                            </div>
                            <span className="text-xs text-[#6B6B6B]">
                              ({product.reviews || 0} reviews)
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-[#E8E2D9] p-12 text-center">
                <span className="text-6xl mb-4 block">🥻</span>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {language === 'hi' ? 'कोई साड़ी नहीं मिली' : 'No Sarees Found'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {language === 'hi'
                    ? 'फ़िल्टर बदलें या हमारे स्टोर पर आएं'
                    : 'Try changing filters or visit our store'}
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-6 py-3 bg-[#722F37] text-white font-semibold rounded-full hover:bg-[#5a252c] transition-colors"
                >
                  {language === 'hi' ? 'फ़िल्टर साफ़ करें' : 'Clear Filters'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
