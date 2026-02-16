'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SellerAuthGuard from '@/components/SellerAuthGuard';

export default function SellerEarningsPage() {
  const { user } = useAuth();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchSellerProfile();
  }, [user]);

  useEffect(() => {
    if (sellerId) {
      fetchEarnings();
    }
  }, [sellerId, filter]);

  const fetchSellerProfile = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/sellers/profile?userId=${user.id}`);
      const data = await response.json();
      setSellerId(data.seller?.id);
    } catch (error) {
      console.error('Error fetching seller profile:', error);
    }
  };

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('paymentStatus', filter);
      }

      const response = await fetch(`/api/sellers/${sellerId}/earnings?${params}`);
      const data = await response.json();
      setEarnings(data.earnings || []);
      setSummary(data.summary || {});
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SellerAuthGuard>
      <div className="min-h-screen bg-[#FAF7F2] p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[#722F37] mb-6">My Earnings</h1>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
                <p className="text-sm text-[#6B6B6B] mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-[#722F37]">
                  ₹{summary.totalEarnings?.toLocaleString('en-IN') || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
                <p className="text-sm text-[#6B6B6B] mb-1">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{summary.pendingEarnings?.toLocaleString('en-IN') || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
                <p className="text-sm text-[#6B6B6B] mb-1">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{summary.paidEarnings?.toLocaleString('en-IN') || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
                <p className="text-sm text-[#6B6B6B] mb-1">Total Commission</p>
                <p className="text-2xl font-bold text-[#2D2D2D]">
                  ₹{summary.totalCommission?.toLocaleString('en-IN') || 0}
                </p>
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="bg-white rounded-xl shadow-md mb-6 p-1 flex gap-2">
            {['all', 'pending', 'processing', 'paid'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-[#722F37] text-white'
                    : 'text-[#6B6B6B] hover:bg-[#F0EDE8]'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Earnings Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F0EDE8]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#2D2D2D]">Order</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#2D2D2D]">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#2D2D2D]">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-[#2D2D2D]">Item Total</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-[#2D2D2D]">Commission</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-[#2D2D2D]">Earning</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-[#2D2D2D]">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[#6B6B6B]">Loading...</td>
                  </tr>
                ) : earnings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[#6B6B6B]">No earnings found</td>
                  </tr>
                ) : (
                  earnings.map((earning) => (
                    <tr key={earning.id} className="border-t border-[#E8E2D9]">
                      <td className="px-4 py-3 text-sm">{earning.order_number}</td>
                      <td className="px-4 py-3 text-sm">{earning.item_name}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(earning.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        ₹{parseFloat(earning.total_item_price).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        -₹{parseFloat(earning.commission_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                        ₹{parseFloat(earning.seller_earning).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            earning.payment_status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : earning.payment_status === 'processing'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {earning.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SellerAuthGuard>
  );
}
