'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PartnerStatus {
  id: string;
  name: string;
  status: 'pending_approval' | 'active' | 'inactive' | 'suspended' | 'rejected';
  created_at: string;
  rejection_reason?: string;
}

export default function DeliveryPartnerStatusPage() {
  const { user, isAuthenticated, isDeliveryPartner, deliveryPartnerId } = useAuth();
  const router = useRouter();
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isDeliveryPartner && deliveryPartnerId) {
      fetchStatus();
    } else {
      setError('No delivery partner account found');
      setLoading(false);
    }
  }, [isAuthenticated, isDeliveryPartner, deliveryPartnerId, router]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/delivery-partners/${deliveryPartnerId}`);
      const data = await response.json();

      if (response.ok) {
        setPartnerStatus(data.partner);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">Loading status...</p>
        </div>
      </div>
    );
  }

  const getStatusDisplay = () => {
    switch (partnerStatus?.status) {
      case 'pending_approval':
        return {
          title: 'Application Under Review',
          icon: (
            <svg className="w-16 h-16 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          message: 'Your application is being reviewed by our team. You will receive an email notification once approved.',
          timeline: 'Expected approval time: 24-48 hours',
        };
      case 'active':
        return {
          title: 'Account Active',
          icon: (
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          message: 'Your delivery partner account is active. You can access the dashboard and receive deliveries.',
          timeline: null,
        };
      case 'rejected':
        return {
          title: 'Application Rejected',
          icon: (
            <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          message: 'Your application was not approved.',
          timeline: null,
        };
      default:
        return {
          title: 'Status Unknown',
          icon: null,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          message: 'Unable to determine account status',
          timeline: null,
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/profile"
          className="inline-flex items-center text-[#722F37] hover:underline mb-6"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Profile
        </Link>

        <div className={`${statusDisplay.bgColor} border-2 ${statusDisplay.borderColor} rounded-xl shadow-md p-8`}>
          <div className="text-center mb-6">
            {statusDisplay.icon && (
              <div className="flex justify-center mb-4">
                {statusDisplay.icon}
              </div>
            )}
            <h1 className="text-3xl font-bold text-[#722F37] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
              {statusDisplay.title}
            </h1>
            <p className={`text-lg ${statusDisplay.textColor} mb-2`}>
              {statusDisplay.message}
            </p>
            {statusDisplay.timeline && (
              <p className="text-sm text-[#6B6B6B]">{statusDisplay.timeline}</p>
            )}
          </div>

          {partnerStatus?.status === 'rejected' && partnerStatus.rejection_reason && (
            <div className="bg-white rounded-lg p-4 mb-4 border border-red-300">
              <p className="font-semibold text-[#2D2D2D] mb-1">Reason:</p>
              <p className="text-sm text-[#6B6B6B]">{partnerStatus.rejection_reason}</p>
            </div>
          )}

          <div className="bg-white rounded-lg p-6 border border-[#E8E2D9]">
            <h3 className="font-semibold text-[#2D2D2D] mb-3">Application Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Applicant Name:</span>
                <span className="font-medium text-[#2D2D2D]">{partnerStatus?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Application Date:</span>
                <span className="font-medium text-[#2D2D2D]">
                  {partnerStatus?.created_at && new Date(partnerStatus.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Status:</span>
                <span className={`font-medium ${statusDisplay.textColor}`}>
                  {partnerStatus?.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {partnerStatus?.status === 'active' && (
            <div className="mt-6">
              <Link
                href={`/delivery/dashboard?partnerId=${deliveryPartnerId}`}
                className="block w-full bg-[#722F37] text-white text-center py-3 px-6 rounded-lg font-medium hover:bg-[#8B3D47] transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          )}

          {partnerStatus?.status === 'pending_approval' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-[#6B6B6B]">
                Need help? <Link href="/contact" className="text-[#722F37] hover:underline">Contact Support</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
