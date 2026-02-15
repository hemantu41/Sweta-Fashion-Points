'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Seller {
  id: string;
  businessName: string;
  status: string;
  commissionPercentage: number;
}

interface Product {
  id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  mainImage?: string;
  stockQuantity: number;
  isActive: boolean;
}

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSellerData();
  }, [user]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);

      // Fetch seller profile
      const sellerResponse = await fetch(`/api/sellers/me?userId=${user?.id}`);
      const sellerData = await sellerResponse.json();

      if (!sellerResponse.ok) {
        alert('You are not registered as a seller. Please contact admin.');
        router.push('/');
        return;
      }

      setSeller(sellerData.seller);

      // Check if seller is approved
      if (sellerData.seller.status !== 'approved') {
        alert(`Your seller account is ${sellerData.seller.status}. Please wait for admin approval.`);
        router.push('/');
        return;
      }

      // Fetch seller's products
      const productsResponse = await fetch(`/api/products?sellerId=${sellerData.seller.id}`);
      const productsData = await productsResponse.json();

      if (productsResponse.ok) {
        setProducts(productsData.products || []);
      }
    } catch (error) {
      console.error('Fetch seller data error:', error);
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
        fetchSellerData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (error) {
      alert('Error deleting product');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] p-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <p className="text-[#6B6B6B]">Loading your seller dashboard...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] p-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <p className="text-red-600">Not authorized as seller</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    inactive: products.filter(p => !p.isActive).length,
    lowStock: products.filter(p => p.stockQuantity < 10).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Seller Dashboard
          </h1>
          <p className="text-[#6B6B6B] mt-2">Welcome, {seller.businessName}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Total Products</p>
            <p className="text-3xl font-bold text-[#722F37]">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <p className="text-sm text-green-700 mb-1">Active Products</p>
            <p className="text-3xl font-bold text-green-800">{stats.active}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-700 mb-1">Inactive Products</p>
            <p className="text-3xl font-bold text-gray-800">{stats.inactive}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <p className="text-sm text-orange-700 mb-1">Low Stock</p>
            <p className="text-3xl font-bold text-orange-800">{stats.lowStock}</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#722F37]">My Products</h2>
          {products.length > 0 && (
            <Link
              href="/seller/dashboard/products/new"
              className="px-6 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white rounded-full font-semibold hover:shadow-lg transition-all"
            >
              + Add New Product
            </Link>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[#6B6B6B] mb-4">You haven't added any products yet.</p>
              <Link
                href="/seller/dashboard/products/new"
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Image</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Product ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Stock</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {products.map((product, index) => (
                    <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
                      <td className="px-6 py-4">
                        {product.mainImage ? (
                          <Image
                            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_60,h_60,c_fill/${product.mainImage}`}
                            alt={product.name}
                            width={60}
                            height={60}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-[60px] h-[60px] bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-[#6B6B6B]">{product.productId}</td>
                      <td className="px-6 py-4 font-semibold text-[#2D2D2D]">{product.name}</td>
                      <td className="px-6 py-4 text-[#6B6B6B] capitalize">{product.category}</td>
                      <td className="px-6 py-4 font-bold text-[#722F37]">₹{product.price.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={product.stockQuantity < 10 ? 'text-orange-600 font-bold' : 'text-[#2D2D2D]'}>
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/seller/products/edit/${product.productId}`}
                            className="px-3 py-1 bg-[#722F37] text-white text-xs rounded-lg hover:bg-[#8B3D47]"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product.productId)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
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
          )}
        </div>

        {/* Seller Info */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-2">Seller Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-semibold">Business Name:</span>
              <p className="text-blue-900">{seller.businessName}</p>
            </div>
            <div>
              <span className="text-blue-700 font-semibold">Account Status:</span>
              <p className="text-blue-900 capitalize">{seller.status}</p>
            </div>
            <div>
              <span className="text-blue-700 font-semibold">Commission:</span>
              <p className="text-blue-900">{seller.commissionPercentage}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
