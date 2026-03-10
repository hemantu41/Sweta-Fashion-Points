'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SellerInfo {
  status: string;
  rejectionReason?: string;
  suspensionReason?: string;
  businessName?: string;
  createdAt?: string;
}

export default function SellerPendingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    fetch(`/api/sellers/me?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.seller) {
          // If seller is approved, redirect to dashboard
          if (data.seller.status === 'approved') {
            router.push('/seller/dashboard');
            return;
          }
          setSellerInfo({
            status: data.seller.status,
            rejectionReason: data.seller.rejectionReason,
            suspensionReason: data.seller.suspensionReason,
            businessName: data.seller.businessName,
            createdAt: data.seller.createdAt,
          });
        } else {
          // No seller record — redirect to register
          router.push('/seller/register');
        }
      })
      .catch(() => setSellerInfo(null))
      .finally(() => setLoading(false));
  }, [user, isLoading]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sellerInfo) return null;

  const config = (() => {
    switch (sellerInfo.status) {
      case 'pending':
        return {
          icon: (
            <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          title: 'Application Under Review',
          message: 'Your seller application has been submitted and is currently being reviewed by our team. You will be notified once a decision is made.',
          sub: 'Typical review time: 24–48 hours',
          extra: null,
        };
      case 'suspended':
        return {
          icon: (
            <svg className="w-16 h-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          title: 'Account Suspended',
          message: 'Your seller account has been temporarily suspended by the administrator.',
          sub: sellerInfo.suspensionReason
            ? null
            : 'Please contact support for more information.',
          extra: sellerInfo.suspensionReason ? (
            <div className="bg-white border border-orange-200 rounded-xl p-4 mt-4 text-left">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">Reason for Suspension</p>
              <p className="text-sm text-[#2D2D2D]">{sellerInfo.suspensionReason}</p>
            </div>
          ) : null,
        };
      case 'rejected':
        return {
          icon: (
            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bg: 'bg-red-50',
          border: 'border-red-200',
          title: 'Application Rejected',
          message: 'Unfortunately your seller application was not approved.',
          sub: null,
          extra: sellerInfo.rejectionReason ? (
            <div className="bg-white border border-red-200 rounded-xl p-4 mt-4 text-left">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Reason for Rejection</p>
              <p className="text-sm text-[#2D2D2D]">{sellerInfo.rejectionReason}</p>
            </div>
          ) : null,
        };
      default:
        return null;
    }
  })();

  if (!config) return null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className={`${config.bg} border-2 ${config.border} rounded-2xl shadow-md p-8`}>
          <div className="text-center">
            <div className="flex justify-center mb-4">{config.icon}</div>
            <h1 className="text-2xl font-bold text-[#722F37] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
              {config.title}
            </h1>
            {sellerInfo.businessName && (
              <p className="text-sm text-[#6B6B6B] mb-2">{sellerInfo.businessName}</p>
            )}
            <p className="text-[#2D2D2D] text-sm">{config.message}</p>
            {config.sub && <p className="text-xs text-[#6B6B6B] mt-2">{config.sub}</p>}
          </div>

          {config.extra}

          <div className="mt-6 flex flex-col gap-3">
            {sellerInfo.status === 'suspended' && (
              <Link
                href="/contact"
                className="block w-full text-center py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
              >
                Contact Support
              </Link>
            )}
            <Link
              href="/"
              className="block w-full text-center py-3 border border-[#E8E2D9] text-[#722F37] rounded-xl font-semibold hover:bg-white transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>

        {sellerInfo.createdAt && (
          <p className="text-center text-xs text-[#6B6B6B] mt-4">
            Application submitted: {new Date(sellerInfo.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
