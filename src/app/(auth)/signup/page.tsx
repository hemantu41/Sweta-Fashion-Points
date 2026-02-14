'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    location: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verification states
  const [emailVerification, setEmailVerification] = useState({
    otpSent: false,
    otp: '',
    verified: false,
    loading: false,
    error: '',
  });
  const [mobileVerification, setMobileVerification] = useState({
    otpSent: false,
    otp: '',
    verified: false,
    loading: false,
    error: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      // Only allow digits and limit to 10
      setFormData({ ...formData, [name]: value.replace(/\D/g, '').slice(0, 10) });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Reset verification if email or mobile changes
    if (name === 'email' && emailVerification.verified) {
      setEmailVerification({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
    }
    if (name === 'mobile' && mobileVerification.verified) {
      setMobileVerification({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
    }
  };

  // Send email OTP
  const sendEmailOTP = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setEmailVerification(prev => ({ ...prev, error: 'Please enter a valid email address' }));
      return;
    }

    setEmailVerification(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          value: formData.email,
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
      const response = await fetch('/api/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          value: formData.email,
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

  // Send mobile OTP
  const sendMobileOTP = async () => {
    if (!formData.mobile || !/^[6-9]\d{9}$/.test(formData.mobile)) {
      setMobileVerification(prev => ({ ...prev, error: 'Please enter a valid 10-digit mobile number' }));
      return;
    }

    setMobileVerification(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mobile',
          value: formData.mobile,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMobileVerification(prev => ({ ...prev, otpSent: true, loading: false }));
      } else {
        setMobileVerification(prev => ({ ...prev, error: data.error || 'Failed to send OTP', loading: false }));
      }
    } catch (error) {
      setMobileVerification(prev => ({ ...prev, error: 'Error sending OTP', loading: false }));
    }
  };

  // Verify mobile OTP
  const verifyMobileOTP = async () => {
    if (!mobileVerification.otp || mobileVerification.otp.length !== 6) {
      setMobileVerification(prev => ({ ...prev, error: 'Please enter a valid 6-digit OTP' }));
      return;
    }

    setMobileVerification(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await fetch('/api/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mobile',
          value: formData.mobile,
          otp: mobileVerification.otp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setMobileVerification(prev => ({ ...prev, verified: true, loading: false }));
      } else {
        setMobileVerification(prev => ({ ...prev, error: data.error || 'Invalid OTP', loading: false }));
      }
    } catch (error) {
      setMobileVerification(prev => ({ ...prev, error: 'Error verifying OTP', loading: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check if email is verified
    if (!emailVerification.verified) {
      setError('Please verify your email address before signing up');
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          location: formData.location,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] to-[#F5F0E8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/images/logo.png"
              alt="Sweta Fashion Points"
              width={120}
              height={120}
              className="mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold text-[#722F37] mt-4" style={{ fontFamily: 'var(--font-playfair)' }}>
            Create Account
          </h1>
          <p className="text-[#6B6B6B] mt-2">Join Sweta Fashion Points</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email with Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={emailVerification.verified}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all disabled:bg-gray-50"
                  placeholder="Enter your email"
                />
                {!emailVerification.verified && (
                  <button
                    type="button"
                    onClick={sendEmailOTP}
                    disabled={emailVerification.loading || !formData.email}
                    className="px-4 py-2 bg-[#722F37] text-white rounded-lg font-medium hover:bg-[#5a252c] transition-all disabled:opacity-50 whitespace-nowrap text-sm"
                  >
                    {emailVerification.loading ? 'Sending...' : emailVerification.otpSent ? 'Resend' : 'Verify'}
                  </button>
                )}
                {emailVerification.verified && (
                  <div className="flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Email OTP Input */}
              {emailVerification.otpSent && !emailVerification.verified && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 mb-2">Enter 6-digit OTP sent to your email</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={emailVerification.otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setEmailVerification(prev => ({ ...prev, otp: value, error: '' }));
                      }}
                      maxLength={6}
                      className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37] text-center text-lg tracking-widest"
                      placeholder="000000"
                    />
                    <button
                      type="button"
                      onClick={verifyEmailOTP}
                      disabled={emailVerification.loading || emailVerification.otp.length !== 6}
                      className="px-4 py-2 bg-[#722F37] text-white rounded-lg font-medium hover:bg-[#5a252c] transition-all disabled:opacity-50 text-sm"
                    >
                      {emailVerification.loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>
              )}

              {emailVerification.error && (
                <p className="text-red-600 text-xs mt-1">{emailVerification.error}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  maxLength={10}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  placeholder="10 digit number"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                placeholder="Enter your city/town"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                placeholder="Minimum 6 characters"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                placeholder="Re-enter password"
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Verification Warning */}
            {(!emailVerification.verified || !mobileVerification.verified) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>⚠️ Verification Required:</strong> Please verify both email and mobile number before signing up.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !emailVerification.verified || !mobileVerification.verified}
              className="w-full bg-[#722F37] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#5a252c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-[#722F37] font-medium hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
