'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CldImage } from 'next-cloudinary';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import PincodeBanner from '@/components/PincodeBanner';

const ITEMS_PER_PAGE = 12;

const HERO_IMAGES: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-1561049501-e1f96bdd98fd?w=1800&h=800&fit=crop&crop=center&q=95',
  daily: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=1800&h=800&fit=crop&crop=top&q=95',
  party: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1800&h=800&fit=crop&crop=top&q=95',
  wedding: 'https://images.unsplash.com/photo-1547535975-b55f679c4bb4?w=1800&h=800&fit=crop&crop=top&q=95',
  festival: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1800&h=800&fit=crop&crop=top&q=95',
};

type SortOption = 'popular' | 'new' | 'price-asc' | 'price-desc';

interface QuickViewProduct {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  mainImage?: string;
  rating?: string;
  reviews?: number;
  sizes?: string[];
  fabric?: string;
  color?: string;
  description?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

export default function SareesPage() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category');

  const [activeCategory, setActiveCategory] = useState<string | null>(categoryFromUrl);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);
  const [quickViewSize, setQuickViewSize] = useState<string>('');
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedLengths, setSelectedLengths] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    fetchProducts();
  }, [authLoading]);

  useEffect(() => {
    if (categoryFromUrl !== undefined) setActiveCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `/api/products?category=sarees${user?.latitude && user?.longitude ? `&userLat=${user.latitude}&userLng=${user.longitude}` : ''}`,
        { cache: 'no-store' }
      );
      const data = await response.json();
      setAllProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const lengths = ['5.5m', '6m', '6.5m', 'Free Size'];
  const fabrics = ['Silk', 'Cotton', 'Georgette', 'Chiffon', 'Banarasi', 'Kanjivaram', 'Crepe', 'Net'];
  const occasions = ['Daily Wear', 'Party Wear', 'Wedding', 'Festival', 'Office'];
  const colors = [
    { name: 'Red', hex: '#CC2222' },
    { name: 'Maroon', hex: '#7A1A2A' },
    { name: 'Pink', hex: '#E8718A' },
    { name: 'Gold', hex: '#C9A962' },
    { name: 'Green', hex: '#3A7A4A' },
    { name: 'Blue', hex: '#2C5A8A' },
    { name: 'Purple', hex: '#6A3A8A' },
    { name: 'Orange', hex: '#E8762A' },
    { name: 'Yellow', hex: '#D4B034' },
    { name: 'White', hex: '#F0EDE8' },
  ];
  const priceRanges = [
    { label: 'All Prices', min: 0, max: 100000 },
    { label: 'Under ₹1,000', min: 0, max: 1000 },
    { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
    { label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
    { label: '₹5,000 – ₹10,000', min: 5000, max: 10000 },
    { label: 'Above ₹10,000', min: 10000, max: 100000 },
  ];
  const categories = [
    { id: null, en: 'All Sarees', hi: 'सभी साड़ियां' },
    { id: 'daily', en: 'Daily Wear', hi: 'डेली वियर' },
    { id: 'party', en: 'Party Wear', hi: 'पार्टी वियर' },
    { id: 'wedding', en: 'Wedding', hi: 'वेडिंग' },
    { id: 'festival', en: 'Festival', hi: 'फेस्टिवल' },
  ];
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'popular', label: language === 'hi' ? 'लोकप्रिय' : 'Most Popular' },
    { value: 'new', label: language === 'hi' ? 'नए आगमन' : 'New Arrivals' },
    { value: 'price-asc', label: language === 'hi' ? 'कम कीमत पहले' : 'Price: Low to High' },
    { value: 'price-desc', label: language === 'hi' ? 'अधिक कीमत पहले' : 'Price: High to Low' },
  ];

  const toggleWishlist = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const openQuickView = useCallback((product: QuickViewProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
    setQuickViewSize('');
  }, []);

  const clearFilters = () => {
    setPriceRange([0, 100000]);
    setSelectedLengths([]);
    setSelectedFabrics([]);
    setSelectedColors([]);
    setSelectedOccasions([]);
  };

  const filteredProducts = allProducts
    .filter((product) => {
      if (activeCategory && product.subCategory !== activeCategory) return false;
      const price = parseFloat(product.price);
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (selectedLengths.length > 0 && product.sizes) {
        if (!selectedLengths.some((s: string) => product.sizes.includes(s))) return false;
      }
      if (selectedFabrics.length > 0 && product.fabric) {
        if (!selectedFabrics.includes(product.fabric)) return false;
      }
      if (selectedColors.length > 0 && product.color) {
        if (!selectedColors.includes(product.color)) return false;
      }
      if (selectedOccasions.length > 0 && product.occasion) {
        if (!selectedOccasions.includes(product.occasion)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === 'price-desc') return parseFloat(b.price) - parseFloat(a.price);
      if (sortBy === 'new') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
    });

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const getCategoryHero = () => HERO_IMAGES[activeCategory || 'default'] || HERO_IMAGES.default;

  const getCategoryTitle = () => {
    const map: Record<string, { en: string; hi: string }> = {
      daily: { en: 'Daily Wear Sarees', hi: 'डेली वियर साड़ियां' },
      party: { en: 'Party Wear Sarees', hi: 'पार्टी वियर साड़ियां' },
      wedding: { en: 'Bridal & Wedding Sarees', hi: 'ब्राइडल साड़ियां' },
      festival: { en: 'Festival Sarees', hi: 'फेस्टिवल साड़ियां' },
    };
    if (activeCategory && map[activeCategory]) {
      return language === 'hi' ? map[activeCategory].hi : map[activeCategory].en;
    }
    return language === 'hi' ? 'साड़ी कलेक्शन' : 'Saree Collection';
  };

  const getCategorySubtitle = () => {
    const map: Record<string, { en: string; hi: string }> = {
      daily: { en: 'Elegant comfort for every day', hi: 'हर दिन के लिए सुंदर साड़ियां' },
      party: { en: 'Drape yourself in luxury', hi: 'शानदार पार्टी लुक' },
      wedding: { en: 'Your most beautiful moment', hi: 'आपका सबसे खूबसूरत पल' },
      festival: { en: 'Celebrate in colour and tradition', hi: 'रंग और परंपरा का जश्न' },
    };
    if (activeCategory && map[activeCategory]) {
      return language === 'hi' ? map[activeCategory].hi : map[activeCategory].en;
    }
    return language === 'hi' ? 'हर मौसम, हर अवसर की साड़ियां' : 'Timeless elegance, every occasion';
  };

  const activeFiltersCount =
    (priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0) +
    selectedLengths.length + selectedFabrics.length + selectedColors.length + selectedOccasions.length;

  const FilterContent = () => (
    <>
      {/* Price */}
      <div className="mb-5 pb-5 border-b border-[#F0EDE8]">
        <h3 className="text-[9px] font-bold text-[#ADADAD] uppercase tracking-[0.25em] mb-3">
          {language === 'hi' ? 'कीमत' : 'Price Range'}
        </h3>
        <div className="space-y-2">
          {priceRanges.map((range) => {
            const checked = priceRange[0] === range.min && priceRange[1] === range.max;
            return (
              <label key={range.label} onClick={() => setPriceRange([range.min, range.max])} className="flex items-center gap-2.5 cursor-pointer group">
                <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked ? 'border-[#722F37] bg-[#722F37]' : 'border-[#D0C9C0] group-hover:border-[#722F37]'}`}>
                  {checked && <span className="w-1 h-1 rounded-full bg-white block" />}
                </span>
                <span className={`text-[11.5px] transition-colors ${checked ? 'text-[#1A1A1A] font-medium' : 'text-[#8A8A8A] group-hover:text-[#3A3A3A]'}`}>{range.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Saree Length */}
      <div className="mb-5 pb-5 border-b border-[#F0EDE8]">
        <h3 className="text-[9px] font-bold text-[#ADADAD] uppercase tracking-[0.25em] mb-3">
          {language === 'hi' ? 'साड़ी की लंबाई' : 'Saree Length'}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {lengths.map((len) => (
            <button key={len}
              onClick={() => setSelectedLengths(prev => prev.includes(len) ? prev.filter(l => l !== len) : [...prev, len])}
              className={`py-1.5 rounded-lg text-[11px] font-medium border transition-all ${selectedLengths.includes(len) ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-sm' : 'bg-white text-[#6B6B6B] border-[#E0DBD4] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'}`}>
              {len}
            </button>
          ))}
        </div>
      </div>

      {/* Occasion */}
      <div className="mb-5 pb-5 border-b border-[#F0EDE8]">
        <h3 className="text-[9px] font-bold text-[#ADADAD] uppercase tracking-[0.25em] mb-3">
          {language === 'hi' ? 'अवसर' : 'Occasion'}
        </h3>
        <div className="space-y-2">
          {occasions.map((occ) => {
            const checked = selectedOccasions.includes(occ);
            return (
              <label key={occ} onClick={() => setSelectedOccasions(prev => prev.includes(occ) ? prev.filter(o => o !== occ) : [...prev, occ])} className="flex items-center gap-2.5 cursor-pointer group">
                <span className={`w-3.5 h-3.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked ? 'border-[#722F37] bg-[#722F37]' : 'border-[#D0C9C0] group-hover:border-[#722F37]'}`}>
                  {checked && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
                <span className={`text-[11.5px] transition-colors ${checked ? 'text-[#1A1A1A] font-medium' : 'text-[#8A8A8A] group-hover:text-[#3A3A3A]'}`}>{occ}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Fabric */}
      <div className="mb-5 pb-5 border-b border-[#F0EDE8]">
        <h3 className="text-[9px] font-bold text-[#ADADAD] uppercase tracking-[0.25em] mb-3">
          {language === 'hi' ? 'फ़ैब्रिक' : 'Fabric'}
        </h3>
        <div className="space-y-2">
          {fabrics.map((fabric) => {
            const checked = selectedFabrics.includes(fabric);
            return (
              <label key={fabric} onClick={() => setSelectedFabrics(prev => prev.includes(fabric) ? prev.filter(f => f !== fabric) : [...prev, fabric])} className="flex items-center gap-2.5 cursor-pointer group">
                <span className={`w-3.5 h-3.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked ? 'border-[#722F37] bg-[#722F37]' : 'border-[#D0C9C0] group-hover:border-[#722F37]'}`}>
                  {checked && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
                <span className={`text-[11.5px] transition-colors ${checked ? 'text-[#1A1A1A] font-medium' : 'text-[#8A8A8A] group-hover:text-[#3A3A3A]'}`}>{fabric}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Colour */}
      <div>
        <h3 className="text-[9px] font-bold text-[#ADADAD] uppercase tracking-[0.25em] mb-3">
          {language === 'hi' ? 'रंग' : 'Colour'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button key={color.name}
              onClick={() => setSelectedColors(prev => prev.includes(color.name) ? prev.filter(c => c !== color.name) : [...prev, color.name])}
              title={color.name}
              className={`w-6 h-6 rounded-full transition-all ring-offset-2 ring-offset-white ${selectedColors.includes(color.name) ? 'ring-2 ring-[#722F37] scale-110' : 'ring-1 ring-transparent hover:ring-[#BCBCBC] hover:scale-105'} ${color.hex === '#F0EDE8' ? 'border border-[#D4D0CB]' : ''}`}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F8F6F4]">

      {/* ── Hero Banner ── */}
      <div className="relative w-full h-[360px] sm:h-[460px] md:h-[540px] overflow-hidden">
        <img
          src={getCategoryHero()}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: 'saturate(1.2) contrast(1.06)' }}
        />
        {/* Warm amber colour grade for sarees */}
        <div className="absolute inset-0 bg-amber-950/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-end pb-16 px-12 sm:px-16 lg:px-24">
          <nav className="flex items-center gap-2 text-[11px] text-white/70 mb-4 tracking-wide" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/sarees" className="hover:text-white transition-colors">Sarees</Link>
            {activeCategory && (
              <>
                <span>/</span>
                <span className="text-white/90 capitalize">{activeCategory}</span>
              </>
            )}
          </nav>
          <h1
            className="text-[2.2rem] sm:text-[3rem] md:text-[3.6rem] font-semibold text-white leading-none tracking-[-0.025em] mb-4"
            style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif', textShadow: '0 2px 24px rgba(0,0,0,0.85), 0 1px 6px rgba(0,0,0,0.95)' }}
          >
            {getCategoryTitle()}
          </h1>
          <p className="text-[13.5px] sm:text-[15.5px] text-white/90 font-light tracking-widest uppercase" style={{ textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}>
            {getCategorySubtitle()}
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <PincodeBanner />

        {/* ── Category Tabs + Sort ── */}
        <div className="flex items-center justify-between mt-4 mb-0">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button key={String(cat.id)} onClick={() => { setActiveCategory(cat.id); setVisibleCount(ITEMS_PER_PAGE); }}
                  className={`flex-shrink-0 px-5 py-3 text-[11.5px] font-semibold tracking-[0.12em] uppercase border-b-2 transition-all duration-200 ${isActive ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#9E9E9E] hover:text-[#4A4A4A] hover:border-[#D0C9C0]'}`}>
                  {language === 'hi' ? cat.hi : cat.en}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <button onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1A1A1A] border border-[#D0C9C0] px-4 py-2.5 hover:border-[#1A1A1A] transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 9h10M11 14h2" />
              </svg>
              Filters {activeFiltersCount > 0 && <span className="bg-[#722F37] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{activeFiltersCount}</span>}
            </button>

            <div className="relative">
              <button onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1A1A1A] border border-[#D0C9C0] px-4 py-2.5 hover:border-[#1A1A1A] transition-colors bg-white">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M10 17h4" />
                </svg>
                {sortOptions.find(o => o.value === sortBy)?.label}
                <svg className={`w-3 h-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#E8E2D9] shadow-lg z-20 min-w-[190px]">
                  {sortOptions.map(opt => (
                    <button key={opt.value} onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                      className={`w-full text-left px-5 py-3 text-[12px] tracking-wide transition-colors ${sortBy === opt.value ? 'bg-[#F8F6F4] text-[#1A1A1A] font-semibold' : 'text-[#6B6B6B] hover:bg-[#F8F6F4] hover:text-[#1A1A1A]'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-8 mt-6">

          {/* ── Filter Sidebar ── */}
          <aside className="hidden lg:block w-[220px] flex-shrink-0">
            <div className="sticky top-5 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin">
              <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.25em]">
                    {language === 'hi' ? 'फ़िल्टर' : 'Filters'}
                    {activeFiltersCount > 0 && <span className="ml-2 bg-[#722F37] text-white text-[9px] rounded-full px-1.5 py-0.5">{activeFiltersCount}</span>}
                  </span>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} className="text-[10px] text-[#722F37] hover:text-[#5A252C] font-medium transition-colors">
                      {language === 'hi' ? 'साफ़ करें' : 'Clear All'}
                    </button>
                  )}
                </div>
                <FilterContent />
              </div>
            </div>
          </aside>

          {/* ── Product Grid ── */}
          <div className="flex-1 min-w-0">
            <p className="text-[11.5px] text-[#ADADAD] mb-5">
              {language === 'hi' ? 'दिखा रहे हैं' : 'Showing'}{' '}
              <span className="text-[#6B6B6B] font-medium">{Math.min(visibleCount, filteredProducts.length)}</span>{' '}
              {language === 'hi' ? 'में से' : 'of'}{' '}
              <span className="text-[#6B6B6B] font-medium">{filteredProducts.length}</span>{' '}
              {language === 'hi' ? 'साड़ियां' : 'sarees'}
            </p>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="rounded-xl bg-[#F0EDE8] animate-pulse">
                    <div className="aspect-[3/4] rounded-t-xl bg-[#E8E4DE]" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-[#E8E4DE] rounded w-3/4" />
                      <div className="h-3 bg-[#E8E4DE] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {visibleProducts.map((product) => {
                    const discountPercent = product.originalPrice && product.price
                      ? Math.round(((parseFloat(product.originalPrice) - parseFloat(product.price)) / parseFloat(product.originalPrice)) * 100)
                      : null;
                    const rating = parseFloat(product.rating) || 4.2;
                    const fullStars = Math.floor(rating);

                    return (
                      <div key={product.id} className="group relative">
                        <Link href={`/product/${product.id}`} className="block">
                          <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.14)] hover:-translate-y-1 transition-all duration-300">
                            <div className="relative aspect-[3/4] bg-[#F0EDE8] overflow-hidden">
                              {product.mainImage ? (
                                <>
                                  <CldImage src={product.mainImage} alt={product.name} fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover absolute inset-0 transition-opacity duration-500 ease-in-out group-hover:opacity-0" />
                                  <CldImage src={product.secondImage || product.mainImage} alt={`${product.name} — alternate view`} fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover absolute inset-0 opacity-0 scale-[1.06] transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:scale-100" />
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center select-none">
                                  <svg className="w-16 h-16 text-[#C8C0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={0.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l2-2m0 0l7-7 7 7m-2-2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V7m5 0v9" />
                                  </svg>
                                </div>
                              )}
                              <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                                {product.isNewArrival && <span className="bg-white text-[#1A1A1A] text-[8.5px] font-bold tracking-[0.2em] uppercase px-2 py-0.5 shadow-sm">NEW</span>}
                                {product.isBestSeller && !product.isNewArrival && <span className="bg-[#1A1A1A] text-white text-[8.5px] font-bold tracking-[0.2em] uppercase px-2 py-0.5">BESTSELLER</span>}
                              </div>
                            </div>
                            <div className="px-3 pt-3 pb-4">
                              <h3 className="text-[12px] font-medium text-[#1A1A1A] leading-snug mb-1.5 line-clamp-1">{product.name}</h3>
                              <div className="flex items-center gap-0.5 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg key={star} className={`w-2.5 h-2.5 ${star <= fullStars ? 'text-[#C9A962] fill-[#C9A962]' : 'text-[#E0DBD4] fill-[#E0DBD4]'}`} viewBox="0 0 20 20">
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                  </svg>
                                ))}
                                {product.reviews > 0 && <span className="text-[9.5px] text-[#ADADAD] ml-0.5">({product.reviews})</span>}
                              </div>
                              <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5">
                                <span className="text-[13px] font-semibold text-[#1A1A1A]">₹{parseFloat(product.price).toLocaleString('en-IN')}</span>
                                {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                                  <>
                                    <span className="text-[10.5px] text-[#ADADAD] line-through">₹{parseFloat(product.originalPrice).toLocaleString('en-IN')}</span>
                                    {discountPercent && discountPercent > 0 && <span className="text-[10px] text-[#8A7A6A] font-medium">{discountPercent}% off</span>}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {hasMore && (
                  <div className="mt-14 text-center">
                    <button onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                      className="inline-flex items-center gap-3 px-10 py-4 border border-[#1A1A1A] text-[#1A1A1A] text-[10.5px] font-semibold tracking-[0.22em] uppercase hover:bg-[#1A1A1A] hover:text-white transition-all duration-300 group">
                      {language === 'hi' ? 'और लोड करें' : 'Load More'}
                      <svg className="w-3 h-3 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <p className="mt-3 text-[11px] text-[#ADADAD]">{filteredProducts.length - visibleCount} {language === 'hi' ? 'और साड़ियां' : 'more sarees'}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-[#F0EDE8] flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-[#C8C0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <p className="text-[14px] text-[#6B6B6B] mb-2">{language === 'hi' ? 'कोई साड़ी नहीं मिली' : 'No sarees found'}</p>
                <p className="text-[12px] text-[#ADADAD] mb-6">{language === 'hi' ? 'फ़िल्टर बदलकर दोबारा कोशिश करें' : 'Try adjusting your filters'}</p>
                <button onClick={clearFilters} className="text-[11px] font-semibold tracking-[0.15em] uppercase underline underline-offset-4 text-[#722F37] hover:text-[#5A252C] transition-colors">
                  {language === 'hi' ? 'सभी फ़िल्टर हटाएं' : 'Clear All Filters'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#F0EDE8]">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]">Filters</span>
              <button onClick={() => setMobileFilterOpen(false)}>
                <svg className="w-5 h-5 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-6">
              <FilterContent />
              <div className="flex gap-3 pt-4">
                <button onClick={clearFilters} className="flex-1 py-3 border border-[#D0C9C0] text-[11px] font-semibold uppercase tracking-widest text-[#6B6B6B] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors rounded-lg">Clear</button>
                <button onClick={() => setMobileFilterOpen(false)} className="flex-1 py-3 bg-[#1A1A1A] text-white text-[11px] font-semibold uppercase tracking-widest rounded-lg hover:bg-[#722F37] transition-colors">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick View Modal ── */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" onClick={() => setQuickViewProduct(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col sm:flex-row" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setQuickViewProduct(null)} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors">
              <svg className="w-4 h-4 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full sm:w-[340px] aspect-[3/4] sm:aspect-auto flex-shrink-0 bg-[#F0EDE8]">
              {quickViewProduct.mainImage ? (
                <CldImage src={quickViewProduct.mainImage} alt={quickViewProduct.name} fill sizes="340px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#C8C0B8]">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={0.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l2-2m0 0l7-7 7 7m-2-2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V7" />
                  </svg>
                </div>
              )}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {quickViewProduct.isNewArrival && <span className="bg-white text-[#1A1A1A] text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 shadow-sm">NEW</span>}
                {quickViewProduct.isBestSeller && <span className="bg-[#1A1A1A] text-white text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1">BESTSELLER</span>}
              </div>
            </div>
            <div className="flex-1 p-7 sm:p-9 overflow-y-auto flex flex-col">
              <p className="text-[9.5px] tracking-[0.25em] uppercase text-[#ADADAD] font-semibold mb-2">Fashion Points · Sarees</p>
              <h2 className="text-[1.4rem] sm:text-[1.6rem] font-semibold text-[#1A1A1A] leading-tight mb-3" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                {quickViewProduct.name}
              </h2>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.floor(parseFloat(quickViewProduct.rating || '4')) ? 'text-[#C9A962] fill-[#C9A962]' : 'text-[#E0DBD4] fill-[#E0DBD4]'}`} viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
                {quickViewProduct.reviews ? <span className="text-[11px] text-[#ADADAD] ml-1">({quickViewProduct.reviews} reviews)</span> : null}
              </div>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-[1.4rem] font-semibold text-[#1A1A1A]">₹{parseFloat(quickViewProduct.price).toLocaleString('en-IN')}</span>
                {quickViewProduct.originalPrice && (
                  <>
                    <span className="text-[13px] text-[#ADADAD] line-through">₹{parseFloat(quickViewProduct.originalPrice).toLocaleString('en-IN')}</span>
                    <span className="text-[11px] font-semibold text-[#722F37]">
                      {Math.round(((parseFloat(quickViewProduct.originalPrice) - parseFloat(quickViewProduct.price)) / parseFloat(quickViewProduct.originalPrice)) * 100)}% off
                    </span>
                  </>
                )}
              </div>
              {quickViewProduct.sizes && quickViewProduct.sizes.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ADADAD] mb-3">Length</p>
                  <div className="flex flex-wrap gap-2">
                    {quickViewProduct.sizes.map((size) => (
                      <button key={size} onClick={() => setQuickViewSize(size)}
                        className={`px-4 py-2 border text-[12px] font-medium transition-all ${quickViewSize === size ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E0DBD4] text-[#6B6B6B] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Link href={`/product/${quickViewProduct.id}`}
                className="mt-auto inline-flex items-center justify-center gap-2 w-full py-4 bg-[#1A1A1A] text-white text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-[#722F37] transition-colors">
                View Full Details
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
