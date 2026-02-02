'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function PaymentMethodsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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

  // Sample payment methods (empty for now)
  const paymentMethods: Array<{
    id: string;
    type: string;
    last4: string;
    expiry: string;
    isDefault: boolean;
  }> = [];

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Payment Methods
          </h1>
          <p className="text-[#6B6B6B] mt-2">Manage your saved payment methods</p>
        </div>

        {/* Payment Methods List */}
        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-8 bg-[#F5F0E8] rounded flex items-center justify-center">
                      <svg className="w-8 h-6 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[#2D2D2D]">•••• •••• •••• {method.last4}</p>
                      <p className="text-sm text-[#6B6B6B]">Expires {method.expiry}</p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <span className="px-3 py-1 bg-green-100 text-green-600 text-sm font-medium rounded-full">
                      Default
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
            <div className="w-24 h-24 bg-[#F5F0E8] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
              No Payment Methods
            </h2>
            <p className="text-[#6B6B6B] mb-8 max-w-md mx-auto">
              You haven&apos;t saved any payment methods yet. Payment methods will be saved when you make a purchase.
            </p>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-[#2D2D2D] mb-4">Accepted Payment Methods</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 text-[#6B6B6B]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-sm">Credit Card</span>
            </div>
            <div className="flex items-center space-x-2 text-[#6B6B6B]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-sm">Debit Card</span>
            </div>
            <div className="flex items-center space-x-2 text-[#6B6B6B]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">UPI</span>
            </div>
            <div className="flex items-center space-x-2 text-[#6B6B6B]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm">Cash on Delivery</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Support */}
        <div className="mt-6 text-center">
          <p className="text-[#6B6B6B] mb-2">For payment related queries</p>
          <a
            href="https://wa.me/919608063673"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-[#25D366] font-medium hover:underline"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>Contact us on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
