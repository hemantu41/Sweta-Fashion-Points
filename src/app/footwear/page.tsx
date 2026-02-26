'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function FootwearPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'all');
  const [filters, setFilters] = useState({
    priceRange: [] as string[],
    size: [] as string[],
    brand: [] as string[],
    color: [] as string[],
  });

  const categories = [
    { id: 'all', label: 'All Footwear', labelHi: 'सभी फुटवियर' },
    { id: 'sport-shoes', label: 'Sport Shoes', labelHi: 'स्पोर्ट शूज़' },
    { id: 'sneakers', label: 'Sneakers', labelHi: 'स्नीकर्स' },
    { id: 'formal-shoes', label: 'Formal Shoes', labelHi: 'फॉर्मल शूज़' },
    { id: 'slippers', label: 'Slippers', labelHi: 'चप्पल' },
  ];

  const priceRanges = [
    { id: 'under-1000', label: 'Under ₹1,000', min: 0, max: 1000 },
    { id: '1000-2000', label: '₹1,000 - ₹2,000', min: 1000, max: 2000 },
    { id: '2000-3000', label: '₹2,000 - ₹3,000', min: 2000, max: 3000 },
    { id: '3000-5000', label: '₹3,000 - ₹5,000', min: 3000, max: 5000 },
    { id: 'above-5000', label: 'Above ₹5,000', min: 5000, max: Infinity },
  ];

  const sizes = ['6', '7', '8', '9', '10', '11', '12'];
  const brands = ['Nike', 'Adidas', 'Puma', 'Reebok', 'Bata', 'Woodland'];
  const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Brown', hex: '#8B4513' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Red', hex: '#FF0000' },
    { name: 'Grey', hex: '#808080' },
  ];

  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: 'footwear',
        ...(activeCategory !== 'all' && { subCategory: activeCategory }),
      });

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value],
    }));
  };

  const filteredProducts = products.filter(product => {
    // Price filter
    if (filters.priceRange.length > 0) {
      const productPrice = parseFloat(product.price);
      const matchesPrice = filters.priceRange.some(rangeId => {
        const range = priceRanges.find(r => r.id === rangeId);
        return range && productPrice >= range.min && productPrice < range.max;
      });
      if (!matchesPrice) return false;
    }

    // Size filter
    if (filters.size.length > 0) {
      const matchesSize = filters.size.some(size => product.sizes?.includes(size));
      if (!matchesSize) return false;
    }

    // Color filter
    if (filters.color.length > 0) {
      const matchesColor = filters.color.some(color =>
        product.colors?.some((c: any) => c.name.toLowerCase() === color.toLowerCase())
      );
      if (!matchesColor) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E8E2D9]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
            <Link href="/" className="hover:text-[#722F37] transition-colors">
              Home
            </Link>
            <span>&gt;&gt;</span>
            <span className="text-[#722F37] font-medium">Footwear Collection</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-[#E8E2D9] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-[#722F37] text-white'
                    : 'bg-[#F0EDE8] text-[#2D2D2D] hover:bg-[#E8E2D9]'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-[#E8E2D9] p-6 sticky top-24">
              <h3 className="text-lg font-bold text-[#722F37] mb-4">Filters</h3>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-[#2D2D2D] mb-3">Price</h4>
                <div className="space-y-2">
                  {priceRanges.map(range => (
                    <label key={range.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.priceRange.includes(range.id)}
                        onChange={() => toggleFilter('priceRange', range.id)}
                        className="w-4 h-4 text-[#722F37] border-gray-300 rounded focus:ring-[#722F37]"
                      />
                      <span className="text-sm text-[#2D2D2D]">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-[#2D2D2D] mb-3">Size</h4>
                <div className="grid grid-cols-3 gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleFilter('size', size)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        filters.size.includes(size)
                          ? 'bg-[#722F37] text-white border-[#722F37]'
                          : 'bg-white text-[#2D2D2D] border-[#E8E2D9] hover:border-[#722F37]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-[#2D2D2D] mb-3">Color</h4>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => (
                    <button
                      key={color.name}
                      onClick={() => toggleFilter('color', color.name)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        filters.color.includes(color.name)
                          ? 'border-[#722F37] ring-2 ring-[#722F37] ring-offset-2'
                          : 'border-[#E8E2D9] hover:border-[#722F37]'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(filters.priceRange.length > 0 || filters.size.length > 0 || filters.color.length > 0) && (
                <button
                  onClick={() => setFilters({ priceRange: [], size: [], brand: [], color: [] })}
                  className="w-full px-4 py-2 bg-[#F0EDE8] text-[#722F37] rounded-lg font-medium hover:bg-[#E8E2D9] transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
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
                            <Image
                              src={`https://res.cloudinary.com/duoxrodmv/image/upload/${product.mainImage}`}
                              alt={product.name}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl">
                              👟
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
                          <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold w-fit">
                            <span>{(product.rating || 4.0).toFixed(1)}</span>
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#6B6B6B] text-lg mb-4">No products found</p>
                <button
                  onClick={() => setFilters({ priceRange: [], size: [], brand: [], color: [] })}
                  className="px-6 py-2 bg-[#722F37] text-white rounded-full hover:bg-[#8B3D47] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
