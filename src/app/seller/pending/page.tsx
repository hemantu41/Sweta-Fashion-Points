'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SellerInfo {
  id: string;
  status: string;
  rejectionReason?: string;
  suspensionReason?: string;
  reactivationRequest?: string;
  reactivationRequestedAt?: string;
  businessName?: string;
  createdAt?: string;
}

export default function SellerPendingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Reactivation request form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    fetch(`/api/sellers/me?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.seller) {
          if (data.seller.status === 'approved') {
            router.push('/seller/dashboard');
            return;
          }
          setSellerInfo({
            id: data.seller.id,
            status: data.seller.status,
            rejectionReason: data.seller.rejectionReason,
            suspensionReason: data.seller.suspensionReason,
            reactivationRequest: data.seller.reactivationRequest,
            reactivationRequestedAt: data.seller.reactivationRequestedAt,
            businessName: data.seller.businessName,
            createdAt: data.seller.createdAt,
          });
          if (data.seller.reactivationRequest) {
            setRequestMessage(data.seller.reactivationRequest);
            setSubmitted(true);
          }
        } else {
          router.push('/seller/register');
        }
      })
      .catch(() => setSellerInfo(null))
      .finally(() => setLoading(false));
  }, [user, isLoading]);

  const handleSubmitRequest = async () => {
    if (!requestMessage.trim()) {
      setSubmitError('Please explain why you would like your account reactivated.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/sellers/reactivation-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, message: requestMessage.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setShowRequestForm(false);
        setSellerInfo(prev => prev
          ? { ...prev, reactivationRequest: requestMessage.trim(), reactivationRequestedAt: new Date().toISOString() }
          : prev
        );
      } else {
        setSubmitError(data.error || 'Failed to submit request. Please try again.');
      }
    } catch {
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sellerInfo) return null;

  const isSuspended = sellerInfo.status === 'suspended';
  const isPending = sellerInfo.status === 'pending';
  const isRejected = sellerInfo.status === 'rejected';

  const statusConfig = (() => {
    if (isPending) return {
      icon: (
        <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-yellow-50', border: 'border-yellow-200',
      title: 'Application Under Review',
      message: 'Your seller application is currently being reviewed by our team. You will be notified once a decision is made.',
      sub: 'Typical review time: 24–48 hours',
    };
    if (isSuspended) return {
      icon: (
        <svg className="w-16 h-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      bg: 'bg-orange-50', border: 'border-orange-200',
      title: 'Account Suspended',
      message: 'Your seller account has been temporarily suspended by the administrator.',
      sub: null,
    };
    if (isRejected) return {
      icon: (
        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-red-50', border: 'border-red-200',
      title: 'Application Rejected',
      message: 'Unfortunately your seller application was not approved.',
      sub: null,
    };
    return null;
  })();

  if (!statusConfig) return null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className={`${statusConfig.bg} border-2 ${statusConfig.border} rounded-2xl shadow-md p-8`}>

          {/* Icon + Title */}
          <div className="text-center">
            <div className="flex justify-center mb-4">{statusConfig.icon}</div>
            <h1 className="text-2xl font-bold text-[#722F37] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
              {statusConfig.title}
            </h1>
            {sellerInfo.businessName && (
              <p className="text-sm text-[#6B6B6B] mb-2">{sellerInfo.businessName}</p>
            )}
            <p className="text-[#2D2D2D] text-sm">{statusConfig.message}</p>
            {statusConfig.sub && <p className="text-xs text-[#6B6B6B] mt-2">{statusConfig.sub}</p>}
          </div>

          {/* Suspension Reason — always shown for suspended, even if empty */}
          {isSuspended && (
            <div className="mt-5 bg-white border border-orange-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                Reason for Suspension
              </p>
              <p className="text-sm text-[#2D2D2D]">
                {sellerInfo.suspensionReason || 'No reason provided. Please contact support for more information.'}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {isRejected && (
            <div className="mt-5 bg-white border border-red-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                Reason for Rejection
              </p>
              <p className="text-sm text-[#2D2D2D]">
                {sellerInfo.rejectionReason || 'No reason provided. Please contact support for more information.'}
              </p>
            </div>
          )}

          {/* Reactivation Request Section (suspended sellers only) */}
          {isSuspended && (
            <div className="mt-5">
              {submitted && sellerInfo.reactivationRequest ? (
                /* Request already submitted — show confirmation */
                <div className="bg-white border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                      Reactivation Request Submitted
                    </p>
                  </div>
                  <p className="text-sm text-[#2D2D2D] mb-1">{sellerInfo.reactivationRequest}</p>
                  {sellerInfo.reactivationRequestedAt && (
                    <p className="text-xs text-[#6B6B6B]">
                      Submitted on: {new Date(sellerInfo.reactivationRequestedAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  )}
                  <button
                    onClick={() => { setShowRequestForm(true); setSubmitted(false); }}
                    className="mt-3 text-xs text-orange-600 underline hover:text-orange-800"
                  >
                    Update my request
                  </button>
                </div>
              ) : showRequestForm ? (
                /* Request form */
                <div className="bg-white border border-orange-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#2D2D2D] mb-1">
                    Request Account Reactivation
                  </p>
                  <p className="text-xs text-[#6B6B6B] mb-3">
                    Explain to the admin why your account should be reactivated. Mention any steps you have taken to resolve the issue.
                  </p>
                  <textarea
                    value={requestMessage}
                    onChange={e => setRequestMessage(e.target.value)}
                    rows={4}
                    placeholder="e.g. I have resolved the compliance issue and updated my product listings accordingly..."
                    className="w-full px-3 py-2 border border-[#E8E2D9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />
                  {submitError && (
                    <p className="text-xs text-red-600 mt-1">{submitError}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setShowRequestForm(false); setSubmitError(''); }}
                      className="flex-1 py-2 border border-[#E8E2D9] text-[#6B6B6B] rounded-lg text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitRequest}
                      disabled={submitting || !requestMessage.trim()}
                      className="flex-1 py-2 bg-[#722F37] text-white rounded-lg text-sm font-semibold hover:bg-[#8B3D47] disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </div>
              ) : (
                /* CTA button to open form */
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="w-full py-3 bg-[#722F37] text-white rounded-xl font-semibold hover:bg-[#8B3D47] transition-colors text-sm"
                >
                  Request Reactivation of Seller Account
                </button>
              )}
            </div>
          )}

          {/* Homepage link */}
          <div className="mt-5">
            <Link
              href="/"
              className="block w-full text-center py-3 border border-[#E8E2D9] text-[#722F37] rounded-xl font-semibold hover:bg-white transition-colors text-sm"
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
