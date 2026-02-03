'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface PaymentMethod {
  id: string;
  type: 'upi' | 'card';
  label: string;
  details: string;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card'>('upi');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Payment Methods
          </h1>
          <p className="text-[#6B6B6B] mt-2">Choose your preferred payment method</p>
        </div>

        {/* Payment Options */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-[#2D2D2D] mb-6">Select Payment Method</h2>

          <div className="space-y-4">
            {/* UPI Option - Default */}
            <div
              onClick={() => setSelectedMethod('upi')}
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                selectedMethod === 'upi'
                  ? 'border-[#722F37] bg-[#722F37]/5'
                  : 'border-gray-200 hover:border-[#722F37]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedMethod === 'upi' ? 'bg-[#722F37] text-white' : 'bg-[#F5F0E8] text-[#6B6B6B]'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-[#2D2D2D]">UPI Payment</p>
                      <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs font-medium rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-[#6B6B6B]">Pay using Google Pay, PhonePe, Paytm, or any UPI app</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'upi' ? 'border-[#722F37]' : 'border-gray-300'
                }`}>
                  {selectedMethod === 'upi' && (
                    <div className="w-3 h-3 rounded-full bg-[#722F37]"></div>
                  )}
                </div>
              </div>

              {selectedMethod === 'upi' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-[#00C853] rounded flex items-center justify-center text-white text-xs font-bold">
                        G
                      </div>
                      <span className="text-sm text-[#2D2D2D]">Google Pay</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-[#5F259F] rounded flex items-center justify-center text-white text-xs font-bold">
                        P
                      </div>
                      <span className="text-sm text-[#2D2D2D]">PhonePe</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-[#00BAF2] rounded flex items-center justify-center text-white text-xs font-bold">
                        P
                      </div>
                      <span className="text-sm text-[#2D2D2D]">Paytm</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-[#FF9900] rounded flex items-center justify-center text-white text-xs font-bold">
                        B
                      </div>
                      <span className="text-sm text-[#2D2D2D]">BHIM</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card Option */}
            <div
              onClick={() => setSelectedMethod('card')}
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                selectedMethod === 'card'
                  ? 'border-[#722F37] bg-[#722F37]/5'
                  : 'border-gray-200 hover:border-[#722F37]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedMethod === 'card' ? 'bg-[#722F37] text-white' : 'bg-[#F5F0E8] text-[#6B6B6B]'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D2D2D]">Credit / Debit Card</p>
                    <p className="text-sm text-[#6B6B6B]">Pay using Visa, Mastercard, or RuPay cards</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'card' ? 'border-[#722F37]' : 'border-gray-300'
                }`}>
                  {selectedMethod === 'card' && (
                    <div className="w-3 h-3 rounded-full bg-[#722F37]"></div>
                  )}
                </div>
              </div>

              {selectedMethod === 'card' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-[#1A1F71] rounded flex items-center justify-center text-white text-xs font-bold">
                        V
                      </div>
                      <span className="text-sm text-[#2D2D2D]">Visa</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-[#EB001B] rounded flex items-center justify-center text-white text-xs font-bold">
                        M
                      </div>
                      <span className="text-sm text-[#2D2D2D]">Mastercard</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-[#0070BA] rounded flex items-center justify-center text-white text-xs font-bold">
                        R
                      </div>
                      <span className="text-sm text-[#2D2D2D]">RuPay</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saved Payment Methods */}
        {paymentMethods.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
            <h2 className="text-lg font-semibold text-[#2D2D2D] mb-4">Saved Payment Methods</h2>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 bg-[#F5F0E8] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <div>
                      <p className="font-medium text-[#2D2D2D]">{method.label}</p>
                      <p className="text-sm text-[#6B6B6B]">{method.details}</p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Info */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-[#2D2D2D] mb-1">Secure Payments</h3>
              <p className="text-sm text-[#6B6B6B]">
                All transactions are encrypted and secure. Your payment information is never stored on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Phone Support */}
        <div className="mt-6 text-center">
          <p className="text-[#6B6B6B] mb-2">For payment related queries</p>
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
