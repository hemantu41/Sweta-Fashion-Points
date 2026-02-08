'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface OrderItem {
  id: string;
  name: string;
  nameHi: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
}

interface Order {
  id: string;
  order_number: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  currency: string;
  status: string;
  items: OrderItem[];
  delivery_address: {
    name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  payment_method?: string;
  created_at: string;
  payment_completed_at?: string;
}

export default function OrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?userId=${user?.id}`);
      const data = await response.json();

      console.log('[Orders Page] Response:', data);
      console.log('[Orders Page] data.success:', data.success);
      console.log('[Orders Page] Orders count:', data.orders?.length || 0);
      console.log('[Orders Page] First order:', data.orders?.[0]);
      console.log('[Orders Page] First order items:', data.orders?.[0]?.items);

      // Set orders if we have data, regardless of success flag
      if (data.orders && Array.isArray(data.orders)) {
        console.log('[Orders Page] Setting orders state with:', data.orders.length, 'orders');
        setOrders(data.orders);
      } else if (data.success) {
        console.log('[Orders Page] Success but no orders array');
        setOrders([]);
      } else {
        console.error('[Orders Page] Error:', data.error);
        setError(data.error || 'Failed to load orders');
      }
    } catch (err) {
      console.error('[Orders Page] Fetch error:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'captured':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'created':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'captured':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Pending';
      case 'created':
        return 'Order Created';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Order History
          </h1>
          <p className="text-[#6B6B6B] mt-2">Track and manage your orders</p>
        </div>

        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-900 font-bold mb-2">DEBUG INFO:</p>
          <p className="text-sm text-yellow-800">Orders state length: {orders.length}</p>
          <p className="text-sm text-yellow-800">Loading: {loading.toString()}</p>
          <p className="text-sm text-yellow-800">Error: {error || 'None'}</p>
          <p className="text-sm text-yellow-800 mt-2">Check console for detailed logs</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-[#E8E2D9]">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-[#722F37]/5 to-[#E8E2D9]/30 px-6 py-4 border-b border-[#E8E2D9]">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-[#2D2D2D] text-lg">
                          Order #{order.order_number}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B6B6B]">
                        Placed on {formatDate(order.created_at)}
                      </p>
                      {order.payment_completed_at && (
                        <p className="text-sm text-green-600">
                          Paid on {formatDate(order.payment_completed_at)}
                        </p>
                      )}
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-[#6B6B6B] mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-[#722F37]">
                        ₹{(order.amount / 100).toLocaleString('en-IN')}
                      </p>
                      {order.payment_method && (
                        <p className="text-xs text-[#6B6B6B] mt-1 capitalize">
                          via {order.payment_method}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <h4 className="font-semibold text-[#2D2D2D] mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Items Ordered ({order.items.length})
                  </h4>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-[#2D2D2D]">{item.name}</h5>
                          <p className="text-sm text-[#6B6B6B]">{item.nameHi}</p>
                          {item.size && (
                            <p className="text-sm text-[#6B6B6B] mt-1">Size: {item.size}</p>
                          )}
                          <p className="text-sm text-[#6B6B6B] mt-1">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#722F37]">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-[#6B6B6B] mt-1">
                            ₹{item.price.toLocaleString('en-IN')} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="px-6 pb-6">
                  <h4 className="font-semibold text-[#2D2D2D] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Delivery Address
                  </h4>
                  <div className="bg-[#F5F0E8] rounded-lg p-4">
                    <p className="font-medium text-[#2D2D2D]">{order.delivery_address.name}</p>
                    <p className="text-sm text-[#6B6B6B] mt-1">
                      {order.delivery_address.address_line1}
                      {order.delivery_address.address_line2 && `, ${order.delivery_address.address_line2}`}
                    </p>
                    <p className="text-sm text-[#6B6B6B]">
                      {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}
                    </p>
                    <p className="text-sm text-[#6B6B6B] mt-1">
                      Phone: {order.delivery_address.phone}
                    </p>
                  </div>
                </div>

                {/* Order Actions */}
                {order.razorpay_payment_id && (
                  <div className="px-6 pb-6">
                    <p className="text-xs text-[#6B6B6B]">
                      Payment ID: {order.razorpay_payment_id}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
            <div className="w-24 h-24 bg-[#F5F0E8] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
              No Orders Yet
            </h2>
            <p className="text-[#6B6B6B] mb-8 max-w-md mx-auto">
              You haven&apos;t placed any orders yet. Start shopping to see your orders here!
            </p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white py-3 px-8 rounded-full font-medium hover:shadow-lg hover:shadow-[#722F37]/25 transition-all duration-300"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6 text-center border border-[#E8E2D9]">
          <p className="text-[#6B6B6B] mb-4">Need help with an order?</p>
          <a
            href="tel:+919608063673"
            className="inline-flex items-center space-x-2 text-[#722F37] font-medium hover:underline"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Call us at +91 96080 63673</span>
          </a>
        </div>
      </div>
    </div>
  );
}
