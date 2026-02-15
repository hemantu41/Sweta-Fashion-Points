'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SellerRegisterPage() {
  const { user, isSeller, sellerStatus, isApprovedSeller, login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(true);
  const [formData, setFormData] = useState({
    businessName: '',
    businessNameHi: '',
    gstin: '',
    pan: '',
    businessEmail: '',
    businessPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
  });

  // Fetch latest seller status from database on mount
  useEffect(() => {
    const refreshSellerStatus = async () => {
      if (!user || !isSeller) {
        setRefreshing(false);
        return;
      }

      try {
        const response = await fetch(`/api/sellers/me?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          const latestStatus = data.seller?.status;

          // Update user context if status has changed
          if (latestStatus && latestStatus !== sellerStatus) {
            const updatedUser = {
              ...user,
              isSeller: true,
              sellerId: data.seller?.id,
              sellerStatus: latestStatus,
            };
            login(updatedUser);
          }
        }
      } catch (error) {
        console.error('Error refreshing seller status:', error);
      } finally {
        setRefreshing(false);
      }
    };

    refreshSellerStatus();
  }, [user?.id]);

  // Verification states
  const [emailVerification, setEmailVerification] = useState({
    otpSent: false,
    otp: '',
    verified: false,
    loading: false,
    error: '',
  });
  const [phoneVerification, setPhoneVerification] = useState({
    otpSent: false,
    otp: '',
    verified: false,
    loading: false,
    error: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Reset verification if email or phone changes
    if (e.target.name === 'businessEmail' && emailVerification.verified) {
      setEmailVerification({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
    }
    if (e.target.name === 'businessPhone' && phoneVerification.verified) {
      setPhoneVerification({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
    }
  };

  // Send email OTP
  const sendEmailOTP = async () => {
    if (!formData.businessEmail) {
      setEmailVerification(prev => ({ ...prev, error: 'Please enter business email' }));
      return;
    }

    setEmailVerification(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await fetch('/api/sellers/send-verification-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          value: formData.businessEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailVerification(prev => ({ ...prev, otpSent: true, loading: false }));
      } else {
        setEmailVerification(prev => ({ ...prev, error: data.error || 'Failed to send OTP', loading: false }));
      }
    } catch (error) {
      setEmailVerification(prev => ({ ...prev, error: 'Error sending OTP', loading: false }));
    }
  };

  // Verify email OTP
  const verifyEmailOTP = async () => {
    if (!emailVerification.otp || emailVerification.otp.length !== 6) {
      setEmailVerification(prev => ({ ...prev, error: 'Please enter a valid 6-digit OTP' }));
      return;
    }

    setEmailVerification(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await fetch('/api/sellers/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          value: formData.businessEmail,
          otp: emailVerification.otp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setEmailVerification(prev => ({ ...prev, verified: true, loading: false }));
      } else {
        setEmailVerification(prev => ({ ...prev, error: data.error || 'Invalid OTP', loading: false }));
      }
    } catch (error) {
      setEmailVerification(prev => ({ ...prev, error: 'Error verifying OTP', loading: false }));
    }
  };

  // Send phone OTP
  const sendPhoneOTP = async () => {
    if (!formData.businessPhone || formData.businessPhone.length !== 10) {
      setPhoneVerification(prev => ({ ...prev, error: 'Please enter a valid 10-digit phone number' }));
      return;
    }

    setPhoneVerification(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await fetch('/api/sellers/send-verification-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'phone',
          value: formData.businessPhone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPhoneVerification(prev => ({ ...prev, otpSent: true, loading: false }));
      } else {
        setPhoneVerification(prev => ({ ...prev, error: data.error || 'Failed to send OTP', loading: false }));
      }
    } catch (error) {
      setPhoneVerification(prev => ({ ...prev, error: 'Error sending OTP', loading: false }));
    }
  };

  // Verify phone OTP
  const verifyPhoneOTP = async () => {
    if (!phoneVerification.otp || phoneVerification.otp.length !== 6) {
      setPhoneVerification(prev => ({ ...prev, error: 'Please enter a valid 6-digit OTP' }));
      return;
    }

    setPhoneVerification(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await fetch('/api/sellers/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'phone',
          value: formData.businessPhone,
          otp: phoneVerification.otp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setPhoneVerification(prev => ({ ...prev, verified: true, loading: false }));
      } else {
        setPhoneVerification(prev => ({ ...prev, error: data.error || 'Invalid OTP', loading: false }));
      }
    } catch (error) {
      setPhoneVerification(prev => ({ ...prev, error: 'Error verifying OTP', loading: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!user) {
      setMessage('Please login first to register as a seller');
      setLoading(false);
      return;
    }

    // Check if email is verified
    if (!emailVerification.verified) {
      setMessage('Please verify your business email before submitting');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/sellers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Registration submitted successfully! You will see your application status.');

        // Update user session with seller info
        const updatedUser = {
          ...user,
          isSeller: true,
          sellerId: data.seller?.id,
          sellerStatus: 'pending' as const,
        };

        // Update AuthContext and localStorage
        login(updatedUser);

        // Wait a moment to show success message, then page will auto-refresh showing status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(data.error || 'Registration failed');
      }
    } catch (error) {
      setMessage('Error submitting registration');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-xl p-8 border border-[#E8E2D9] text-center">
          <h2 className="text-2xl font-bold text-[#722F37] mb-4">Login Required</h2>
          <p className="text-[#6B6B6B] mb-6">Please login first to register as a seller.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white rounded-full font-semibold hover:shadow-lg transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // If user is already a seller, show their status
  if (isSeller && sellerStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-white rounded-xl p-8 border border-[#E8E2D9]">
          {/* Pending Status */}
          {sellerStatus === 'pending' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#722F37] mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
                Application Under Review
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                <p className="text-yellow-800 text-lg font-semibold mb-2">Status: Pending</p>
                <p className="text-yellow-700">
                  Your seller application has been submitted and is currently under review by our admin team.
                </p>
              </div>
              <div className="text-left space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#722F37] text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D2D2D]">Application Submitted</p>
                    <p className="text-sm text-[#6B6B6B]">Your registration details have been received</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
                    <span className="text-xs">⏳</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D2D2D]">Awaiting Admin Approval</p>
                    <p className="text-sm text-[#6B6B6B]">Admin team is reviewing your business details</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 opacity-50">
                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex-shrink-0 mt-0.5"></div>
                  <div>
                    <p className="font-semibold text-[#6B6B6B]">Start Selling</p>
                    <p className="text-sm text-[#6B6B6B]">Once approved, you can access your seller dashboard</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#6B6B6B] mb-6">
                We typically review applications within 24-48 hours. You'll receive a notification once your application is approved.
              </p>
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Back to Home
              </Link>
            </div>
          )}

          {/* Approved Status */}
          {sellerStatus === 'approved' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#722F37] mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
                🎉 Congratulations!
              </h2>
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <p className="text-green-800 text-lg font-semibold mb-2">Status: Approved</p>
                <p className="text-green-700">
                  Your seller application has been approved! You can now start adding products and managing your store.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/seller/dashboard"
                  className="px-8 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white rounded-full font-semibold hover:shadow-lg transition-all"
                >
                  Go to Seller Dashboard
                </Link>
                <Link
                  href="/"
                  className="px-8 py-3 bg-white border-2 border-[#722F37] text-[#722F37] rounded-full font-semibold hover:bg-[#722F37] hover:text-white transition-all"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          )}

          {/* Rejected Status */}
          {sellerStatus === 'rejected' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#722F37] mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
                Application Not Approved
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                <p className="text-red-800 text-lg font-semibold mb-2">Status: Rejected</p>
                <p className="text-red-700 mb-4">
                  Unfortunately, your seller application was not approved at this time.
                </p>
              </div>
              <div className="text-left bg-gray-50 rounded-xl p-6 mb-6">
                <p className="text-sm text-[#6B6B6B] mb-4">
                  If you believe this was a mistake or would like to reapply with updated information, please contact our support team.
                </p>
                <div className="flex items-center gap-2 text-[#722F37]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">Contact Support</span>
                </div>
              </div>
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Back to Home
              </Link>
            </div>
          )}

          {/* Suspended Status */}
          {sellerStatus === 'suspended' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#722F37] mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
                Account Suspended
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                <p className="text-gray-800 text-lg font-semibold mb-2">Status: Suspended</p>
                <p className="text-gray-700 mb-4">
                  Your seller account has been temporarily suspended. You cannot add or manage products at this time.
                </p>
                <p className="text-sm text-gray-600">
                  Please contact the admin team for more information about reactivating your account.
                </p>
              </div>
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Become a Seller
          </h1>
          <p className="text-[#6B6B6B] mt-2">Register your business to start selling on our platform</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.includes('success')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 border border-[#E8E2D9]">
          {/* Business Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#722F37] mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="Your Business Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Business Name (Hindi)
                </label>
                <input
                  type="text"
                  name="businessNameHi"
                  value={formData.businessNameHi}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="आपका व्यापार नाम"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  GSTIN
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  maxLength={15}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  PAN
                </label>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  maxLength={10}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>
          </div>

          {/* Contact Information with Verification */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#722F37] mb-4">Contact Information</h2>
            <p className="text-sm text-[#6B6B6B] mb-4">
              We'll send OTPs to verify your business email and phone number to ensure genuine sellers.
            </p>

            {/* Business Email with Verification */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                Business Email <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleChange}
                  required
                  disabled={emailVerification.verified}
                  className="flex-1 px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37] disabled:bg-gray-50"
                  placeholder="business@example.com"
                />
                {!emailVerification.verified && (
                  <button
                    type="button"
                    onClick={sendEmailOTP}
                    disabled={emailVerification.loading || !formData.businessEmail}
                    className="px-4 py-2 bg-[#722F37] text-white rounded-lg font-medium hover:bg-[#8B3D47] transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {emailVerification.loading ? 'Sending...' : emailVerification.otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                )}
                {emailVerification.verified && (
                  <div className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </div>
                )}
              </div>

              {/* Email OTP Input */}
              {emailVerification.otpSent && !emailVerification.verified && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-3">Enter the 6-digit OTP sent to your email</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={emailVerification.otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setEmailVerification(prev => ({ ...prev, otp: value, error: '' }));
                      }}
                      maxLength={6}
                      className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37] text-center text-lg tracking-widest"
                      placeholder="000000"
                    />
                    <button
                      type="button"
                      onClick={verifyEmailOTP}
                      disabled={emailVerification.loading || emailVerification.otp.length !== 6}
                      className="px-6 py-2 bg-[#722F37] text-white rounded-lg font-medium hover:bg-[#8B3D47] transition-all disabled:opacity-50"
                    >
                      {emailVerification.loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>
              )}

              {/* Email Error */}
              {emailVerification.error && (
                <p className="text-red-600 text-sm mt-2">{emailVerification.error}</p>
              )}
            </div>

            {/* Business Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                Business Phone <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="tel"
                name="businessPhone"
                value={formData.businessPhone}
                onChange={handleChange}
                maxLength={10}
                className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                placeholder="1234567890"
              />
            </div>
          </div>

          {/* Business Address */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#722F37] mb-4">Business Address</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="Building, Street"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="Locality, Landmark (Optional)"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                    placeholder="123456"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#722F37] mb-4">Bank Details</h2>
            <p className="text-sm text-[#6B6B6B] mb-4">For receiving payments from sales</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="As per bank records"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{9,18}"
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="Bank account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bankIfsc"
                  value={formData.bankIfsc}
                  onChange={handleChange}
                  required
                  maxLength={11}
                  pattern="[A-Z]{4}0[A-Z0-9]{6}"
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="ABCD0123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="Bank name"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !emailVerification.verified}
              className="flex-1 px-8 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
            <Link
              href="/"
              className="px-8 py-3 bg-white border-2 border-[#722F37] text-[#722F37] rounded-full font-semibold hover:bg-[#722F37] hover:text-white transition-all text-center"
            >
              Cancel
            </Link>
          </div>

          {/* Verification Warning */}
          {!emailVerification.verified && (
            <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Verification Required:</strong> Please verify your business email before submitting the registration form.
              </p>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your registration will be reviewed by our admin team. You will receive a notification once your account is approved and you can start selling.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
