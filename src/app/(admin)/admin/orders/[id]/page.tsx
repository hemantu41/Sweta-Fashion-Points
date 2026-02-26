'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { COURIER_PROVIDERS } from '@/lib/courier-providers';

interface Order {
  id: string;
  order_number: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  status: string;
  delivery_status?: string;
  tracking_number?: string;
  delivery_type?: 'partner' | 'courier';
  courier_company?: string;
  courier_tracking_number?: string;
  courier_tracking_url?: string;
  user_id: string;
  delivery_address: any;
  items: any[];
  created_at: string;
  payment_completed_at?: string;
}

export default function OrderDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchOrderDetails();
  }, [user, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json();

      if (response.ok) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Failed to fetch order details');
      }
    } catch (error) {
      console.error('Fetch order error:', error);
      setError('An error occurred while fetching order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      captured: 'bg-green-100 text-green-700 border-green-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      created: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getDeliveryStatusBadge = (status?: string) => {
    const colors: { [key: string]: string } = {
      delivered: 'bg-green-100 text-green-700 border-green-200',
      out_for_delivery: 'bg-blue-100 text-blue-700 border-blue-200',
      in_transit: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      picked_up: 'bg-purple-100 text-purple-700 border-purple-200',
      accepted: 'bg-teal-100 text-teal-700 border-teal-200',
      assigned: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      pending_assignment: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return colors[status || 'pending_assignment'] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <p className="text-red-700">{error || 'Order not found'}</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-[#722F37] hover:text-[#8B3D47] font-medium"
          >
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const courierProvider = order.courier_company
    ? COURIER_PROVIDERS.find((p) => p.id === order.courier_company)
    : null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/orders"
            className="text-[#722F37] hover:text-[#8B3D47] font-medium inline-flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Order Details
          </h1>
          <p className="text-[#6B6B6B] mt-2">Order #{order.order_number}</p>
        </div>

        {/* Order Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Payment Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
              {order.status}
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Delivery Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getDeliveryStatusBadge(order.delivery_status)}`}>
              {order.delivery_status?.replace('_', ' ') || 'Pending'}
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Order Amount</p>
            <p className="text-2xl font-bold text-[#722F37]">₹{(order.amount / 100).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Delivery Information */}
        {(order.delivery_type || order.tracking_number) && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-[#E8E2D9]">
            <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Delivery Information</h2>
            <div className="space-y-3">
              {order.delivery_type && (
                <div>
                  <p className="text-sm text-[#6B6B6B]">Delivery Method</p>
                  <p className="font-medium text-[#2D2D2D]">
                    {order.delivery_type === 'courier' ? 'Courier Service' : 'Local Partner'}
                  </p>
                </div>
              )}

              {order.delivery_type === 'courier' && order.courier_company && (
                <div>
                  <p className="text-sm text-[#6B6B6B]">Courier Company</p>
                  <p className="font-medium text-[#2D2D2D]">
                    {courierProvider?.name || order.courier_company}
                  </p>
                </div>
              )}

              {order.courier_tracking_number && (
                <div>
                  <p className="text-sm text-[#6B6B6B]">Tracking Number (AWB)</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#2D2D2D]">{order.courier_tracking_number}</p>
                    {order.courier_tracking_url && (
                      <a
                        href={order.courier_tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-1"
                      >
                        Track
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {order.tracking_number && !order.delivery_type && (
                <div>
                  <p className="text-sm text-[#6B6B6B]">Tracking Number</p>
                  <p className="font-medium text-[#2D2D2D]">{order.tracking_number}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer & Delivery Address */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-[#E8E2D9]">
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Customer & Delivery Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Customer Name</p>
              <p className="font-medium text-[#2D2D2D]">{order.delivery_address?.name}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Phone</p>
              <p className="font-medium text-[#2D2D2D]">{order.delivery_address?.phone}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-[#6B6B6B] mb-1">Delivery Address</p>
              <p className="font-medium text-[#2D2D2D]">
                {order.delivery_address?.addressLine1}
                {order.delivery_address?.addressLine2 && `, ${order.delivery_address.addressLine2}`}
                <br />
                {order.delivery_address?.city}, {order.delivery_address?.state} - {order.delivery_address?.pincode}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-[#E8E2D9]">
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center pb-4 border-b border-[#E8E2D9] last:border-0">
                  <div>
                    <p className="font-medium text-[#2D2D2D]">{item.name || 'Product'}</p>
                    <p className="text-sm text-[#6B6B6B]">Quantity: {item.quantity || 1}</p>
                  </div>
                  <p className="font-semibold text-[#722F37]">
                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[#6B6B6B]">No items found</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-[#E8E2D9]">
            <div className="flex justify-between items-center">
              <p className="font-bold text-[#2D2D2D]">Total Amount</p>
              <p className="text-2xl font-bold text-[#722F37]">₹{(order.amount / 100).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-[#E8E2D9]">
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Payment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Razorpay Order ID</p>
              <p className="font-medium text-[#2D2D2D] text-sm break-all">{order.razorpay_order_id}</p>
            </div>
            {order.razorpay_payment_id && (
              <div>
                <p className="text-sm text-[#6B6B6B] mb-1">Razorpay Payment ID</p>
                <p className="font-medium text-[#2D2D2D] text-sm break-all">{order.razorpay_payment_id}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Order Created</p>
              <p className="font-medium text-[#2D2D2D]">{formatDate(order.created_at)}</p>
            </div>
            {order.payment_completed_at && (
              <div>
                <p className="text-sm text-[#6B6B6B] mb-1">Payment Completed</p>
                <p className="font-medium text-[#2D2D2D]">{formatDate(order.payment_completed_at)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
