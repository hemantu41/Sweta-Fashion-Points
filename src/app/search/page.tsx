'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components';
import Link from 'next/link';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    if (query) {
      searchProducts();
    } else {
      setLoading(false);
    }
  }, [query]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      setProducts(data.products || []);
      setTotalResults(data.products?.length || 0);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#6B6B6B]">Searching products...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <svg className="w-20 h-20 text-[#6B6B6B] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">Search Products</h2>
            <p className="text-[#6B6B6B] mb-6">Enter a search term to find products</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#722F37] text-white font-medium rounded-full hover:bg-[#5A252C] transition-all duration-300"
            >
              Browse Collections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            Search Results
          </h1>
          <p className="text-[#6B6B6B]">
            {totalResults > 0 ? (
              <>
                Found <span className="font-semibold text-[#722F37]">{totalResults}</span> product{totalResults !== 1 ? 's' : ''} for "<span className="font-semibold">{query}</span>"
              </>
            ) : (
              <>No results found for "<span className="font-semibold">{query}</span>"</>
            )}
          </p>
        </div>

        {/* Search Results */}
        {totalResults > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-[#E8E2D9]">
            <svg className="w-20 h-20 text-[#6B6B6B] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">No products found</h3>
            <p className="text-[#6B6B6B] mb-6">
              Try adjusting your search terms or browse our collections
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/mens"
                className="px-6 py-2.5 bg-[#F5F0E8] text-[#722F37] font-medium rounded-full hover:bg-[#E8E2D9] transition-colors"
              >
                Men's Collection
              </Link>
              <Link
                href="/womens"
                className="px-6 py-2.5 bg-[#F5F0E8] text-[#722F37] font-medium rounded-full hover:bg-[#E8E2D9] transition-colors"
              >
                Women's Collection
              </Link>
              <Link
                href="/sarees"
                className="px-6 py-2.5 bg-[#F5F0E8] text-[#722F37] font-medium rounded-full hover:bg-[#E8E2D9] transition-colors"
              >
                Sarees
              </Link>
              <Link
                href="/kids"
                className="px-6 py-2.5 bg-[#F5F0E8] text-[#722F37] font-medium rounded-full hover:bg-[#E8E2D9] transition-colors"
              >
                Kids Collection
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F2] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#6B6B6B]">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
