'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

interface OrderData {
  items: {
    id: string;
    name: string;
    nameHi: string;
    image: string;
    category: string;
    price: number;
    quantity: number;
    size?: string;
  }[];
  address: {
    id: string;
    name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: 'upi' | 'card';
  totalPrice: number;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const method = searchParams.get('method') as 'upi' | 'card';
  const router = useRouter();
  const { clearCart } = useCart();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [stage, setStage] = useState<'form' | 'processing' | 'success'>('form');
  const [orderNumber, setOrderNumber] = useState('');

  // UPI state
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');

  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = sessionStorage.getItem('sweta_order');
    if (stored) {
      setOrder(JSON.parse(stored));
    } else {
      router.push('/');
    }
  }, [router]);

  const generateOrderNumber = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 900000 + 100000);
    return `SFP-${y}${m}${d}-${rand}`;
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const validateUpi = () => {
    if (!upiId.trim()) { setUpiError('Please enter your UPI ID'); return false; }
    if (!upiId.includes('@') || upiId.startsWith('@') || upiId.endsWith('@')) {
      setUpiError('Please enter a valid UPI ID (e.g. name@gpay)');
      return false;
    }
    setUpiError('');
    return true;
  };

  const validateCard = () => {
    const errs: Record<string, string> = {};
    if (cardNumber.replace(/\D/g, '').length !== 16) errs.cardNumber = 'Enter a valid 16-digit card number';
    if (!cardName.trim()) errs.cardName = 'Enter the name on your card';
    const expDigits = expiry.replace(/\D/g, '');
    if (expDigits.length !== 4) {
      errs.expiry = 'Enter valid expiry date (MM/YY)';
    } else {
      const mm = parseInt(expDigits.slice(0, 2));
      if (mm < 1 || mm > 12) errs.expiry = 'Enter a valid month (01-12)';
    }
    const cvvDigits = cvv.replace(/\D/g, '');
    if (cvvDigits.length < 3 || cvvDigits.length > 4) errs.cvv = 'Enter 3 or 4 digit CVV';
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = () => {
    if (method === 'upi' && !validateUpi()) return;
    if (method === 'card' && !validateCard()) return;
    setStage('processing');
    setTimeout(() => {
      setOrderNumber(generateOrderNumber());
      sessionStorage.removeItem('sweta_order');
      clearCart();
      setStage('success');
    }, 3000);
  };

  // ── Loading (no order yet) ──
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ── Processing ──
  if (stage === 'processing') {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 border-4 border-[#E8E2D9] border-t-[#722F37] rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-[#2D2D2D] mb-2" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            Processing Payment...
          </h2>
          <p className="text-[#6B6B6B] text-sm">Please wait, do not close this window</p>
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-2 h-2 bg-[#722F37] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#722F37] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#722F37] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (stage === 'success') {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[#2D2D2D] mb-2" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            Order Placed Successfully!
          </h1>
          <p className="text-[#6B6B6B] mb-6">Thank you for shopping with Sweta Fashion Points</p>

          {/* Order Number */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-4 mb-6">
            <p className="text-sm text-[#6B6B6B] mb-1">Order Number</p>
            <p className="font-bold text-[#722F37] text-lg tracking-wide">{orderNumber}</p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 text-left mb-6">
            <h3 className="font-semibold text-[#2D2D2D] mb-3">Order Details</h3>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-[#6B6B6B]">
                    {item.name}{item.size ? ` (${item.size})` : ''} × {item.quantity}
                  </span>
                  <span className="font-medium text-[#2D2D2D]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#E8E2D9] mt-3 pt-3 flex justify-between">
              <span className="font-bold text-[#2D2D2D]">Total</span>
              <span className="font-bold text-[#722F37]">₹{order.totalPrice.toLocaleString('en-IN')}</span>
            </div>

            {/* Delivery address */}
            <div className="mt-4 pt-3 border-t border-[#E8E2D9]">
              <p className="text-xs text-[#6B6B6B] uppercase tracking-wide mb-1">Delivering to</p>
              <p className="text-sm font-medium text-[#2D2D2D]">{order.address.name}</p>
              <p className="text-sm text-[#6B6B6B]">
                {order.address.address_line1}{order.address.address_line2 ? `, ${order.address.address_line2}` : ''}
              </p>
              <p className="text-sm text-[#6B6B6B]">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-medium rounded-full hover:shadow-lg hover:shadow-[#722F37]/25 transition-all duration-300"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="text-[#6B6B6B] hover:text-[#722F37] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            {method === 'upi' ? 'UPI Payment' : 'Card Payment'}
          </h1>
        </div>

        {/* Amount */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 mb-6">
          <p className="text-sm text-[#6B6B6B] mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-[#722F37]">₹{order.totalPrice.toLocaleString('en-IN')}</p>
        </div>

        {/* UPI Form */}
        {method === 'upi' && (
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-6">
            <h2 className="font-semibold text-[#2D2D2D] mb-1">Enter UPI ID</h2>
            <p className="text-sm text-[#6B6B6B] mb-4">Open your UPI app and scan, or enter your UPI ID below</p>
            <div>
              <input
                type="text"
                value={upiId}
                onChange={(e) => { setUpiId(e.target.value); setUpiError(''); }}
                placeholder="example@gpay"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent ${upiError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {upiError && <p className="text-red-500 text-xs mt-1.5">{upiError}</p>}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
              {[
                { name: 'Google Pay', letter: 'G', color: '#00C853' },
                { name: 'PhonePe', letter: 'P', color: '#5F259F' },
                { name: 'Paytm', letter: 'P', color: '#00BAF2' },
                { name: 'BHIM', letter: 'B', color: '#FF9900' },
              ].map(app => (
                <div key={app.name} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F5F0E8] rounded-lg">
                  <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: app.color }}>{app.letter}</div>
                  <span className="text-xs text-[#2D2D2D]">{app.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card Form */}
        {method === 'card' && (
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Card Number</label>
              <input
                type="text"
                inputMode="numeric"
                value={cardNumber}
                onChange={(e) => {
                  setCardNumber(formatCardNumber(e.target.value));
                  if (cardErrors.cardNumber) setCardErrors(prev => ({ ...prev, cardNumber: '' }));
                }}
                placeholder="1234 5678 9012 3456"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent ${cardErrors.cardNumber ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {cardErrors.cardNumber && <p className="text-red-500 text-xs mt-1.5">{cardErrors.cardNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Name on Card</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => {
                  setCardName(e.target.value);
                  if (cardErrors.cardName) setCardErrors(prev => ({ ...prev, cardName: '' }));
                }}
                placeholder="John Doe"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent ${cardErrors.cardName ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {cardErrors.cardName && <p className="text-red-500 text-xs mt-1.5">{cardErrors.cardName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Expiry (MM/YY)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={expiry}
                  onChange={(e) => {
                    setExpiry(formatExpiry(e.target.value));
                    if (cardErrors.expiry) setCardErrors(prev => ({ ...prev, expiry: '' }));
                  }}
                  placeholder="MM/YY"
                  maxLength={5}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent ${cardErrors.expiry ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                {cardErrors.expiry && <p className="text-red-500 text-xs mt-1.5">{cardErrors.expiry}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">CVV</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={cvv}
                  onChange={(e) => {
                    setCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                    if (cardErrors.cvv) setCardErrors(prev => ({ ...prev, cvv: '' }));
                  }}
                  placeholder="•••"
                  maxLength={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent ${cardErrors.cvv ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                {cardErrors.cvv && <p className="text-red-500 text-xs mt-1.5">{cardErrors.cvv}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { name: 'Visa', letter: 'V', color: '#1A1F71' },
                { name: 'Mastercard', letter: 'M', color: '#EB001B' },
                { name: 'RuPay', letter: 'R', color: '#0070BA' },
              ].map(card => (
                <div key={card.name} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F5F0E8] rounded-lg">
                  <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: card.color }}>{card.letter}</div>
                  <span className="text-xs text-[#2D2D2D]">{card.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePay}
          className="mt-6 w-full py-4 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-[#722F37]/25 transition-all duration-300"
        >
          Pay ₹{order.totalPrice.toLocaleString('en-IN')}
        </button>

        {/* Security note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#6B6B6B]">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Secured with 256-bit SSL encryption</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
