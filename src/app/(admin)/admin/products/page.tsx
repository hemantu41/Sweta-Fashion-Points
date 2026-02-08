'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  mainImage: string | null;
  stockQuantity: number;
  isActive: boolean;
}

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const url = '/api/products?isActive=all';
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${productId}?userId=${user?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Product deleted successfully');
        fetchProducts();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting product');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.productId.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    outOfStock: products.filter(p => p.stockQuantity === 0).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
              Product Management
            </h1>
            <p className="text-[#6B6B6B] mt-1">Manage your products inventory</p>
          </div>
          <Link
            href="/admin/products/new"
            className="px-6 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-full hover:shadow-lg transition-all"
          >
            + Add New Product
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-6">
            <p className="text-[#6B6B6B] text-sm">Total Products</p>
            <p className="text-3xl font-bold text-[#722F37] mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-6">
            <p className="text-[#6B6B6B] text-sm">Active Products</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-6">
            <p className="text-[#6B6B6B] text-sm">Out of Stock</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.outOfStock}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="mens">Men's</option>
              <option value="womens">Women's</option>
              <option value="sarees">Sarees</option>
              <option value="kids">Kids</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F0E8]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Image</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Product ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
                    <td className="px-6 py-4">
                      {product.mainImage ? (
                        <Image
                          src={`https://res.cloudinary.com/duoxrodmv/image/upload/c_fill,w_50,h_50/${product.mainImage}`}
                          alt={product.name}
                          width={50}
                          height={50}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6B6B]">{product.productId}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#2D2D2D]">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-[#6B6B6B] capitalize">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-[#2D2D2D]">
                      <div>
                        <span className="font-semibold">₹{product.price.toLocaleString('en-IN')}</span>
                        {product.originalPrice && (
                          <span className="ml-2 text-xs text-gray-400 line-through">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={product.stockQuantity === 0 ? 'text-red-600 font-semibold' : 'text-[#2D2D2D]'}>
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.isActive
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/products/edit/${product.productId}`}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.productId)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#6B6B6B]">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
