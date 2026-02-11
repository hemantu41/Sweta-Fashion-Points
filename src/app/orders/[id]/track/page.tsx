'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TimelineItem {
  status: string;
  title: string;
  timestamp: string;
  completed: boolean;
  description: string;
}

interface DeliveryPartner {
  name: string;
  mobile: string | null;
  vehicleType: string;
}

interface TrackingInfo {
  orderNumber: string;
  trackingNumber: string;
  orderStatus: string;
  deliveryStatus: string;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  deliveryPartner: DeliveryPartner | null;
  timeline: TimelineItem[];
  statusHistory: any[];
  deliveryAddress: any;
}

export default function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params);
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user?.id && orderId) {
      fetchTracking();
    }
  }, [user, orderId]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('[Track Page] Fetching tracking for order:', orderId, 'user:', user?.id);

      const url = `/api/orders/${orderId}/tracking?userId=${user?.id}`;
      console.log('[Track Page] API URL:', url);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[Track Page] Response status:', response.status);

      const data = await response.json();
      console.log('[Track Page] Response data:', data);

      if (response.ok) {
        console.log('[Track Page] Setting tracking data:', data.tracking);
        setTracking(data.tracking);
      } else {
        console.error('[Track Page] Error response:', data);
        setError(data.error || 'Failed to load tracking information');
      }
    } catch (err) {
      console.error('[Track Page] Fetch tracking error:', err);

      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(`Failed to load tracking information: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      console.log('[Track Page] Setting loading to false');
      setLoading(false);
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

  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-[#2D2D2D] mb-2">Unable to Load Tracking</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Link
              href="/orders"
              className="inline-block bg-[#722F37] text-white py-2 px-6 rounded-lg font-medium hover:bg-[#8B3D47] transition-colors"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center text-[#722F37] hover:underline mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Track Your Order
          </h1>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-[#E8E2D9]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Order Number</p>
              <p className="font-bold text-[#2D2D2D]">{tracking.orderNumber}</p>
            </div>
            {tracking.trackingNumber && (
              <div>
                <p className="text-sm text-[#6B6B6B] mb-1">Tracking Number</p>
                <p className="font-bold text-[#722F37]">{tracking.trackingNumber}</p>
              </div>
            )}
            {tracking.estimatedDeliveryDate && (
              <div>
                <p className="text-sm text-[#6B6B6B] mb-1">
                  {tracking.actualDeliveryDate ? 'Delivered On' : 'Estimated Delivery'}
                </p>
                <p className="font-bold text-[#2D2D2D]">
                  {formatDateOnly(tracking.actualDeliveryDate || tracking.estimatedDeliveryDate)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Partner Info */}
        {tracking.deliveryPartner && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-[#E8E2D9]">
            <h2 className="font-bold text-[#2D2D2D] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Delivery Partner
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#6B6B6B] mb-1">Name</p>
                <p className="font-medium text-[#2D2D2D]">{tracking.deliveryPartner.name}</p>
              </div>
              {tracking.deliveryPartner.mobile && (
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Contact</p>
                  <a
                    href={`tel:${tracking.deliveryPartner.mobile}`}
                    className="font-medium text-[#722F37] hover:underline"
                  >
                    {tracking.deliveryPartner.mobile}
                  </a>
                </div>
              )}
              {tracking.deliveryPartner.vehicleType && (
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Vehicle</p>
                  <p className="font-medium text-[#2D2D2D] capitalize">{tracking.deliveryPartner.vehicleType}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
          <h2 className="font-bold text-[#2D2D2D] mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Order Journey
          </h2>

          <div className="relative">
            {tracking.timeline.map((item, index) => (
              <div key={index} className="flex gap-4 pb-8 last:pb-0">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {item.completed ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                  {index < tracking.timeline.length - 1 && (
                    <div
                      className={`w-0.5 h-full mt-2 ${
                        item.completed ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>

                {/* Timeline content */}
                <div className="flex-1 pb-4">
                  <h3 className="font-semibold text-[#2D2D2D] mb-1">{item.title}</h3>
                  <p className="text-sm text-[#6B6B6B] mb-1">{item.description}</p>
                  <p className="text-xs text-[#6B6B6B]">{formatDate(item.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6 border border-[#E8E2D9]">
          <h2 className="font-bold text-[#2D2D2D] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Delivery Address
          </h2>
          <div className="bg-[#F5F0E8] rounded-lg p-4">
            <p className="font-medium text-[#2D2D2D]">{tracking.deliveryAddress.name}</p>
            <p className="text-sm text-[#6B6B6B] mt-1">
              {tracking.deliveryAddress.address_line1}
              {tracking.deliveryAddress.address_line2 && `, ${tracking.deliveryAddress.address_line2}`}
            </p>
            <p className="text-sm text-[#6B6B6B]">
              {tracking.deliveryAddress.city}, {tracking.deliveryAddress.state} - {tracking.deliveryAddress.pincode}
            </p>
            <p className="text-sm text-[#6B6B6B] mt-1">
              Phone: {tracking.deliveryAddress.phone}
            </p>
          </div>
        </div>

        {/* Support */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6 text-center border border-[#E8E2D9]">
          <p className="text-[#6B6B6B] mb-4">Need help with your order?</p>
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
