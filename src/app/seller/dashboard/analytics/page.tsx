'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import SellerAuthGuard from '@/components/SellerAuthGuard';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SellerAnalyticsPage() {
  const { user } = useAuth();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchSellerProfile();
  }, [user]);

  useEffect(() => {
    if (sellerId) {
      fetchAnalytics();
    }
  }, [sellerId, period]);

  const fetchSellerProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/sellers/me?userId=${user.id}`);
      const data = await response.json();
      if (response.ok && data.seller?.id) {
        setSellerId(data.seller.id);
      } else {
        console.error('No seller profile found');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching seller profile:', error);
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sellers/${sellerId}/analytics?days=${period}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SellerAuthGuard>
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
          <p>Loading analytics...</p>
        </div>
      </SellerAuthGuard>
    );
  }

  return (
    <SellerAuthGuard>
      <div className="min-h-screen bg-[#FAF7F2] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#722F37]">Analytics</h1>
            <select
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value))}
              className="px-4 py-2 border border-[#E8E2D9] rounded-lg"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-md mb-6 p-2 flex gap-2 overflow-x-auto">
            <Link
              href="/seller/dashboard"
              className="flex-1 min-w-[120px] py-3 px-6 rounded-lg font-medium text-[#6B6B6B] hover:bg-[#F0EDE8] transition-colors text-center"
            >
              Dashboard
            </Link>
            <Link
              href="/seller/dashboard/earnings"
              className="flex-1 min-w-[120px] py-3 px-6 rounded-lg font-medium text-[#6B6B6B] hover:bg-[#F0EDE8] transition-colors text-center"
            >
              Earnings
            </Link>
            <Link
              href="/seller/dashboard/analytics"
              className="flex-1 min-w-[120px] py-3 px-6 rounded-lg font-medium bg-[#722F37] text-white text-center"
            >
              Analytics
            </Link>
            <Link
              href="/seller/dashboard/products/new"
              className="flex-1 min-w-[120px] py-3 px-6 rounded-lg font-medium text-[#6B6B6B] hover:bg-[#F0EDE8] transition-colors text-center"
            >
              + Add Product
            </Link>
          </div>

          {/* Overview Cards */}
          {analytics?.overview && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
                <p className="text-sm text-[#6B6B6B] mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-[#722F37]">
                  ₹{analytics.overview.totalRevenue?.toLocaleString('en-IN') || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
                <p className="text-sm text-[#6B6B6B] mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-[#722F37]">
                  {analytics.overview.totalOrders || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
                <p className="text-sm text-[#6B6B6B] mb-1">Products Sold</p>
                <p className="text-2xl font-bold text-[#722F37]">
                  {analytics.overview.totalProductsSold || 0}
                </p>
              </div>
            </div>
          )}

          {/* Revenue Trend Chart */}
          {analytics?.revenueByDay && analytics.revenueByDay.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-[#E8E2D9]">
              <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Revenue Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#722F37" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Products */}
          {analytics?.topProducts && analytics.topProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
              <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Top Products</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topProducts.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalRevenue" fill="#722F37" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6">
                <table className="w-full">
                  <thead className="bg-[#F0EDE8]">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Product</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Revenue</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Orders</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topProducts.slice(0, 10).map((product: any, index: number) => (
                      <tr key={index} className="border-t border-[#E8E2D9]">
                        <td className="px-4 py-2 text-sm">{product.name}</td>
                        <td className="px-4 py-2 text-sm text-right">
                          ₹{product.totalRevenue.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2 text-sm text-right">{product.totalOrders}</td>
                        <td className="px-4 py-2 text-sm text-right">{product.totalQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </SellerAuthGuard>
  );
}
