'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { PaymentLoadingState } from '@/components/LoadingState';

interface OrderData {
  items: {
    id: string;
    productId?: string;
    sellerId?: string | null;
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

const UPI_APPS = [
  { name: 'Google Pay', short: 'GPay', letter: 'G', bg: '#00C853', text: '#fff' },
  { name: 'PhonePe', short: 'PhonePe', letter: 'P', bg: '#5F259F', text: '#fff' },
  { name: 'Paytm', short: 'Paytm', letter: 'P', bg: '#00BAF2', text: '#fff' },
  { name: 'BHIM', short: 'BHIM', letter: 'B', bg: '#FF9900', text: '#fff' },
];

const INPUT_CLS =
  'w-full px-5 py-3.5 border border-[#E8E2D9] rounded-2xl text-sm text-[#2C2C2C] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A2E2E]/30 focus:border-[#7A2E2E] transition-all bg-white/80';

function PaymentContent() {
  const searchParams = useSearchParams();
  const method = searchParams.get('method') as 'upi' | 'card';
  const router = useRouter();
  const { clearCart } = useCart();
  const { user } = useAuth();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [stage, setStage] = useState<'form' | 'processing' | 'checking-status' | 'success' | 'failed' | 'pending' | 'expired'>('form');
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('success');

  // Razorpay state
  const [razorpayOrderId, setRazorpayOrderId] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);

  // UPI state
  const [upiType, setUpiType] = useState<'mobile' | 'upiId' | 'qr'>('upiId');
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [txnRef] = useState(() => {
    const now = new Date();
    return `SFP${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${Math.floor(Math.random() * 900000 + 100000)}`;
  });

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

  useEffect(() => {
    if (order && user?.id && !razorpayOrderId && !creatingOrder) {
      createRazorpayOrder();
    }
  }, [order, user, razorpayOrderId, creatingOrder]);

  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  useEffect(() => {
    if (razorpayOrderId && method === 'upi' && upiType === 'qr' && !qrCodeGenerated) {
      setQrCodeGenerated(true);
      setTimeout(() => { openRazorpayCheckout(); }, 500);
    }
  }, [razorpayOrderId, method, upiType, qrCodeGenerated]);

  const createRazorpayOrder = async () => {
    setCreatingOrder(true);
    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          amount: order?.totalPrice,
          items: order?.items,
          address: order?.address,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create payment order');
      setRazorpayOrderId(data.orderId);
      setOrderNumber(data.orderNumber);
    } catch (error: any) {
      console.error('[Payment] Error creating order:', error);
      alert('Failed to initialize payment. Please try again.');
    } finally {
      setCreatingOrder(false);
    }
  };

  const openRazorpayCheckout = () => {
    if (!razorpayOrderId || !order) {
      alert('Please wait for order initialization...');
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.totalPrice * 100,
        currency: 'INR',
        name: 'Fashion Points',
        description: `Order #${orderNumber}`,
        order_id: razorpayOrderId,
        prefill: { name: order.address.name, contact: order.address.phone },
        notes: { order_number: orderNumber, user_id: user?.id },
        theme: { color: '#7A2E2E' },
        handler: function (response: any) { handlePaymentSuccess(response); },
        modal: { ondismiss: function () { setStage('form'); } },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) { handlePaymentFailure(response); });
      rzp.open();
      setStage('processing');
    };
    script.onerror = () => { alert('Failed to load Razorpay. Please check your internet connection.'); };
    document.body.appendChild(script);
  };

  const handlePaymentSuccess = async (response: any) => {
    setStage('checking-status');
    try {
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });
      const verifyData = await verifyResponse.json();
      if (verifyData.success) {
        sessionStorage.removeItem('sweta_order');
        clearCart();
        setStage('success');
      } else {
        setStage('failed');
      }
    } catch (error) {
      console.error('[Payment] Verification error:', error);
      setStage('pending');
    }
  };

  const handlePaymentFailure = (response: any) => {
    console.error('[Payment] Payment failed:', response.error);
    setStage('failed');
  };

  const startPaymentStatusPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment/status/${razorpayOrderId}`);
        const data = await response.json();
        if (data.status === 'success') {
          clearInterval(interval);
          setPaymentStatus('success');
          sessionStorage.removeItem('sweta_order');
          clearCart();
          setStage('success');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setPaymentStatus('failed');
          setStage('failed');
        }
      } catch (error) {
        console.error('[Payment] Status check error:', error);
      }
    }, 5000);
    setPollingInterval(interval);
    setTimeout(() => {
      clearInterval(interval);
      if (stage === 'checking-status') setStage('pending');
    }, 600000);
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() + 900000 + 100000);
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
    if (upiType === 'mobile') {
      if (mobileNumber.length !== 10) { setMobileError('Please enter a valid 10-digit mobile number'); return false; }
      setMobileError('');
      return true;
    }
    if (upiType === 'upiId') {
      if (!upiId.trim()) { setUpiError('Please enter your UPI ID'); return false; }
      if (!upiId.includes('@') || upiId.startsWith('@') || upiId.endsWith('@')) {
        setUpiError('Please enter a valid UPI ID (e.g. name@gpay)');
        return false;
      }
      setUpiError('');
      return true;
    }
    return true;
  };

  const validateCard = () => {
    const errs: Record<string, string> = {};
    if (cardNumber.replace(/\D/g, '').length !== 16) errs.cardNumber = 'Enter a valid 16-digit card number';
    if (!cardName.trim()) errs.cardName = 'Enter the name on your card';
    const expDigits = expiry.replace(/\D/g, '');
    if (expDigits.length !== 4) { errs.expiry = 'Enter valid expiry date (MM/YY)'; }
    else { const mm = parseInt(expDigits.slice(0, 2)); if (mm < 1 || mm > 12) errs.expiry = 'Enter a valid month (01-12)'; }
    const cvvDigits = cvv.replace(/\D/g, '');
    if (cvvDigits.length < 3 || cvvDigits.length > 4) errs.cvv = 'Enter 3 or 4 digit CVV';
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = async () => {
    if (method === 'upi' && upiType === 'qr') { openRazorpayCheckout(); return; }
    if (method === 'upi' && !validateUpi()) return;
    if (method === 'card' && !validateCard()) return;
    if (!razorpayOrderId) { alert('Payment not ready. Please wait...'); return; }
    if (method === 'upi' && upiType !== 'qr' && user?.id) {
      const upiValue = upiType === 'mobile' ? mobileNumber : upiId;
      try {
        await fetch('/api/user/upi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, upiId: upiValue }),
        });
      } catch (err) { console.error('Failed to save UPI ID:', err); }
    }
    openRazorpayCheckout();
  };

  const handleRetry = () => {
    setQrCodeGenerated(false);
    setStage('form');
    openRazorpayCheckout();
  };

  const completePayment = async (status: 'success' | 'failed' | 'pending') => {
    const orderNum = generateOrderNumber();
    setOrderNumber(orderNum);
    setPaymentStatus(status);
    if (user?.id && order) {
      try {
        await fetch('/api/notifications/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            orderNumber: orderNum,
            amount: order.totalPrice,
            status,
            paymentMethod: method,
            items: order.items,
          }),
        });
      } catch (err) { console.error('Failed to send payment notifications:', err); }
    }
    if (status === 'success') { sessionStorage.removeItem('sweta_order'); clearCart(); }
    setStage(status);
  };

  // ─── Shared page shell ────────────────────────────────────────────────────────
  const PageBg = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #F8F5F0 0%, #F2EBE1 35%, #EDE0D4 65%, #F5EDE5 100%)' }}>
      {/* Decorative blobs */}
      <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #7A2E2E 0%, transparent 70%)' }} />
      <div className="relative w-full max-w-md">
        {children}
      </div>
    </div>
  );

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (!order) {
    return (
      <PageBg>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-14 h-14 border-4 border-[#E8E2D9] border-t-[#7A2E2E] rounded-full animate-spin" />
          <p className="text-sm text-[#6B6B6B] font-medium">Loading order details…</p>
        </div>
      </PageBg>
    );
  }

  // ─── Processing ───────────────────────────────────────────────────────────────
  if (stage === 'processing') {
    return (
      <PageBg>
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.12)] p-10 text-center">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#F0EBE3]" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#7A2E2E] animate-spin" />
            <div className="absolute inset-[6px] rounded-full bg-[#F8F5F0] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#7A2E2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            Processing Payment
          </h2>
          <p className="text-sm text-[#6B6B6B] mb-6">Please complete payment in the Razorpay window</p>
          <div className="flex justify-center gap-1.5">
            {[0, 150, 300].map(d => (
              <div key={d} className="w-2 h-2 bg-[#7A2E2E] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      </PageBg>
    );
  }

  // ─── Checking Status ──────────────────────────────────────────────────────────
  if (stage === 'checking-status') {
    return (
      <PageBg>
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.12)] p-8">
          <PaymentLoadingState />
          <div className="mt-6 bg-blue-50/80 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your payment is being verified automatically</li>
                <li>• This usually takes 5–30 seconds</li>
                <li>• Please don't close this window</li>
              </ul>
            </div>
          </div>
          {orderNumber && (
            <div className="mt-4 bg-white rounded-2xl border border-[#F0EBE3] p-4 text-center">
              <p className="text-xs text-[#6B6B6B] mb-1 uppercase tracking-wide">Order Number</p>
              <p className="font-bold text-[#7A2E2E] text-lg tracking-wider">{orderNumber}</p>
            </div>
          )}
        </div>
      </PageBg>
    );
  }

  // ─── Success ──────────────────────────────────────────────────────────────────
  if (stage === 'success') {
    return (
      <PageBg>
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* Green top strip */}
          <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />
          <div className="p-8 text-center">
            {/* Animated check */}
            <div className="relative mx-auto w-20 h-20 mb-5">
              <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#2C2C2C] mb-1" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
              Order Placed!
            </h1>
            <p className="text-sm text-[#6B6B6B] mb-6">Thank you for shopping with Fashion Points</p>

            {/* Order number */}
            <div className="bg-[#F8F5F0] border border-[#F0EBE3] rounded-2xl px-6 py-4 mb-5 inline-block w-full">
              <p className="text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">Order Number</p>
              <p className="font-bold text-[#7A2E2E] text-lg tracking-wide">{orderNumber}</p>
            </div>

            {/* Items */}
            <div className="bg-white border border-[#F0EBE3] rounded-2xl p-5 text-left mb-5">
              <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3 uppercase tracking-wide">Order Details</h3>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">{item.name}{item.size ? ` (${item.size})` : ''} × {item.quantity}</span>
                    <span className="font-semibold text-[#2C2C2C]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#F0EBE3] mt-3 pt-3 flex justify-between">
                <span className="font-bold text-[#2C2C2C]">Total</span>
                <span className="font-bold text-[#7A2E2E] text-base">₹{order.totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-[#F0EBE3]">
                <p className="text-[11px] text-[#6B6B6B] uppercase tracking-widest mb-1">Delivering to</p>
                <p className="text-sm font-medium text-[#2C2C2C]">{order.address.name}</p>
                <p className="text-xs text-[#6B6B6B]">{order.address.address_line1}{order.address.address_line2 ? `, ${order.address.address_line2}` : ''}</p>
                <p className="text-xs text-[#6B6B6B]">{order.address.city}, {order.address.state} — {order.address.pincode}</p>
              </div>
            </div>

            <Link href="/" className="block w-full py-4 bg-gradient-to-r from-[#7A2E2E] to-[#9B3E3E] text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-[#7A2E2E]/25 hover:-translate-y-0.5 transition-all duration-300 text-center">
              Continue Shopping
            </Link>
          </div>
        </div>
      </PageBg>
    );
  }

  // ─── Failed ───────────────────────────────────────────────────────────────────
  if (stage === 'failed') {
    return (
      <PageBg>
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#2C2C2C] mb-1" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
              Payment Failed
            </h1>
            <p className="text-sm text-[#6B6B6B] mb-6">Your payment could not be processed</p>
            <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-red-800 mb-2 text-sm">What to do next?</h3>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                <li>Check if amount was deducted from your account</li>
                <li>If deducted, wait 24–48 hours for auto-refund</li>
                <li>Try again with a different payment method</li>
                <li>Contact support if the issue persists</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button onClick={() => window.location.reload()}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#7A2E2E] to-[#9B3E3E] text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-[#7A2E2E]/25 transition-all duration-300">
                Try Again
              </button>
              <Link href="/"
                className="flex-1 py-3.5 border-2 border-[#7A2E2E] text-[#7A2E2E] font-bold rounded-2xl hover:bg-[#7A2E2E] hover:text-white transition-all duration-300 text-center">
                Go Home
              </Link>
            </div>
            <a href="tel:+918294153256" className="block mt-5 text-sm text-[#7A2E2E] hover:underline font-medium">
              Call us at +91 82941 53256
            </a>
          </div>
        </div>
      </PageBg>
    );
  }

  // ─── Expired ──────────────────────────────────────────────────────────────────
  if (stage === 'expired') {
    return (
      <PageBg>
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-500" />
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#2C2C2C] mb-1" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
              QR Code Expired
            </h1>
            <p className="text-sm text-[#6B6B6B] mb-6">The payment QR code has expired after 3 minutes</p>
            <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-4 mb-6 text-left">
              <ul className="text-xs text-orange-800 space-y-1 list-disc list-inside">
                <li>QR codes expire after 3 minutes for security</li>
                <li>No payment was detected during this time</li>
                <li>If you already paid, check your UPI app</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button onClick={handleRetry}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#7A2E2E] to-[#9B3E3E] text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-[#7A2E2E]/25 transition-all">
                Generate New QR
              </button>
              <Link href="/"
                className="flex-1 py-3.5 border-2 border-[#7A2E2E] text-[#7A2E2E] font-bold rounded-2xl hover:bg-[#7A2E2E] hover:text-white transition-all text-center">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </PageBg>
    );
  }

  // ─── Pending ──────────────────────────────────────────────────────────────────
  if (stage === 'pending') {
    return (
      <PageBg>
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-yellow-400 to-amber-400" />
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#2C2C2C] mb-1" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
              Payment Pending
            </h1>
            <p className="text-sm text-[#6B6B6B] mb-5">Your payment is being verified by the bank</p>
            {orderNumber && (
              <div className="bg-[#F8F5F0] border border-[#F0EBE3] rounded-2xl px-6 py-4 mb-5 inline-block w-full">
                <p className="text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">Order Number</p>
                <p className="font-bold text-[#7A2E2E] text-lg tracking-wide">{orderNumber}</p>
              </div>
            )}
            <div className="bg-yellow-50/80 border border-yellow-200 rounded-2xl p-4 mb-5 text-left">
              <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                <li>This usually takes 5–10 minutes</li>
                <li>You will receive confirmation via SMS/WhatsApp</li>
                <li>Check your email for order updates</li>
              </ul>
            </div>
            <Link href="/"
              className="block w-full py-4 bg-gradient-to-r from-[#7A2E2E] to-[#9B3E3E] text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-[#7A2E2E]/25 transition-all text-center">
              Go to Home
            </Link>
          </div>
        </div>
      </PageBg>
    );
  }

  // ─── FORM (main payment UI) ───────────────────────────────────────────────────
  const amountDisplay = order.totalPrice.toLocaleString('en-IN');

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-10 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #F8F5F0 0%, #F2EBE1 40%, #EDE0D4 70%, #F5EDE5 100%)' }}>
      {/* Decorative blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-80px] left-[-80px] w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(122,46,46,0.12) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md">
        {/* Back + Brand header */}
        <div className="flex items-center justify-between mb-6 px-1">
          <button onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-sm border border-white/80 text-[#6B6B6B] hover:text-[#7A2E2E] hover:bg-white transition-all shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-[11px] text-[#6B6B6B] uppercase tracking-widest font-semibold">Fashion Points</p>
            <p className="text-xs text-[#B0A99B]">Secure Checkout</p>
          </div>
          {/* SSL badge */}
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm border border-white/80 rounded-full px-3 py-1.5 shadow-sm">
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-[10px] text-green-700 font-bold">SSL</span>
          </div>
        </div>

        {/* ── Main card ── */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* Gold top accent line */}
          <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-[#c9971c] to-[#D4AF37]" />

          {/* Amount hero */}
          <div className="px-8 pt-7 pb-6 text-center border-b border-[#F5F0E8]">
            <p className="text-[11px] text-[#B0A99B] uppercase tracking-widest font-semibold mb-1">
              {method === 'upi' ? 'UPI Payment' : 'Card Payment'}
            </p>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className="text-3xl font-bold text-[#7A2E2E]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>₹</span>
              <span className="text-5xl font-bold text-[#2C2C2C] tracking-tight" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                {amountDisplay}
              </span>
            </div>
            {/* Items mini list */}
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {order.items.slice(0, 3).map((item, i) => (
                <span key={i} className="text-[11px] bg-[#F5F0E8] text-[#6B6B6B] px-2.5 py-1 rounded-full">
                  {item.name}{item.size ? ` · ${item.size}` : ''} ×{item.quantity}
                </span>
              ))}
              {order.items.length > 3 && (
                <span className="text-[11px] bg-[#F5F0E8] text-[#6B6B6B] px-2.5 py-1 rounded-full">
                  +{order.items.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* ── UPI form ── */}
          {method === 'upi' && (
            <div className="px-7 pt-6 pb-7">
              {/* Tab selector */}
              <div className="flex bg-[#F5F0E8] rounded-2xl p-1 mb-6 gap-1">
                {([
                  { id: 'mobile', label: 'Mobile No', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
                  { id: 'upiId', label: 'UPI ID', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                  { id: 'qr', label: 'Scan QR', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z' },
                ] as { id: 'mobile' | 'upiId' | 'qr'; label: string; icon: string }[]).map(tab => (
                  <button key={tab.id} onClick={() => setUpiType(tab.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                      upiType === tab.id
                        ? 'bg-white text-[#7A2E2E] shadow-md shadow-black/8'
                        : 'text-[#6B6B6B] hover:text-[#7A2E2E]'
                    }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Mobile Number tab */}
              {upiType === 'mobile' && (
                <div className="space-y-5">
                  <p className="text-xs text-[#6B6B6B] text-center">Enter your registered mobile number to receive a payment request</p>
                  <div className={`flex items-center border rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#7A2E2E]/30 focus-within:border-[#7A2E2E] transition-all ${mobileError ? 'border-red-400' : 'border-[#E8E2D9]'}`}>
                    <span className="px-4 py-4 bg-[#F8F5F0] text-[#6B6B6B] text-sm border-r border-[#E8E2D9] font-medium">+91</span>
                    <input type="tel" inputMode="numeric" value={mobileNumber}
                      onChange={e => { setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10)); setMobileError(''); }}
                      placeholder="9876543210"
                      className="flex-1 px-4 py-4 text-sm outline-none bg-transparent text-[#2C2C2C] placeholder-gray-400" />
                  </div>
                  {mobileError && <p className="text-red-500 text-xs mt-1">{mobileError}</p>}

                  {/* App pills */}
                  <div>
                    <p className="text-[11px] text-[#B0A99B] uppercase tracking-widest mb-3 font-semibold">Pay using</p>
                    <div className="grid grid-cols-4 gap-2">
                      {UPI_APPS.map(app => (
                        <div key={app.name} className="flex flex-col items-center gap-1.5 p-2 bg-[#F8F5F0] border border-[#F0EBE3] rounded-2xl hover:border-[#7A2E2E]/30 hover:bg-white transition-all cursor-default group">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: app.bg }}>{app.letter}</div>
                          <span className="text-[10px] text-[#6B6B6B] font-medium">{app.short}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* UPI ID tab */}
              {upiType === 'upiId' && (
                <div className="space-y-5">
                  <p className="text-xs text-[#6B6B6B] text-center">Enter your UPI ID from any payment app</p>
                  <div className="relative">
                    <input type="text" value={upiId}
                      onChange={e => { setUpiId(e.target.value); setUpiError(''); }}
                      placeholder="yourname@gpay"
                      className={`w-full px-5 py-4 border rounded-2xl text-sm text-[#2C2C2C] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A2E2E]/30 focus:border-[#7A2E2E] transition-all bg-white/80 ${upiError ? 'border-red-400 bg-red-50/50' : 'border-[#E8E2D9]'}`} />
                    {upiId.includes('@') && !upiError && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  {upiError && <p className="text-red-500 text-xs">{upiError}</p>}

                  {/* App pills */}
                  <div>
                    <p className="text-[11px] text-[#B0A99B] uppercase tracking-widest mb-3 font-semibold">Supported apps</p>
                    <div className="grid grid-cols-4 gap-2">
                      {UPI_APPS.map(app => (
                        <div key={app.name} className="flex flex-col items-center gap-1.5 p-2 bg-[#F8F5F0] border border-[#F0EBE3] rounded-2xl hover:border-[#7A2E2E]/30 hover:bg-white transition-all cursor-default group">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: app.bg }}>{app.letter}</div>
                          <span className="text-[10px] text-[#6B6B6B] font-medium">{app.short}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Scan QR tab */}
              {upiType === 'qr' && (
                <div className="text-center space-y-5">
                  {razorpayOrderId ? (
                    <>
                      {/* Animated QR placeholder */}
                      <div className="relative mx-auto w-48 h-48">
                        {/* Pulse rings */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-[#7A2E2E]/20 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute inset-2 rounded-2xl border-2 border-[#D4AF37]/30 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                        {/* QR icon container */}
                        <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-[#F8F5F0] to-[#EDE5DC] border-2 border-[#E8E2D9] flex items-center justify-center shadow-inner">
                          <div className="text-center">
                            <svg className="w-16 h-16 text-[#7A2E2E] mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h.01M17 14h3M17 17h.01M14 17h.01M14 20h3M17 20h3M20 17h.01" />
                            </svg>
                            <p className="text-[10px] text-[#7A2E2E] font-bold uppercase tracking-wider">Scan to Pay</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <p className="text-xs text-blue-700 font-semibold">Razorpay payment page opening…</p>
                        </div>
                      </div>
                      {/* App pills */}
                      <div className="grid grid-cols-4 gap-2">
                        {UPI_APPS.map(app => (
                          <div key={app.name} className="flex flex-col items-center gap-1.5 p-2 bg-[#F8F5F0] border border-[#F0EBE3] rounded-2xl">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: app.bg }}>{app.letter}</div>
                            <span className="text-[10px] text-[#6B6B6B] font-medium">{app.short}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-10">
                      <div className="w-12 h-12 border-4 border-[#F0EBE3] border-t-[#7A2E2E] rounded-full animate-spin" />
                      <p className="text-sm text-[#6B6B6B]">Preparing secure payment…</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Card form ── */}
          {method === 'card' && (
            <div className="px-7 pt-6 pb-7 space-y-4">
              {/* Card number */}
              <div>
                <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-widest mb-1.5">Card Number</label>
                <input type="text" inputMode="numeric" value={cardNumber}
                  onChange={e => { setCardNumber(formatCardNumber(e.target.value)); if (cardErrors.cardNumber) setCardErrors(p => ({ ...p, cardNumber: '' })); }}
                  placeholder="1234  5678  9012  3456"
                  className={`${INPUT_CLS} tracking-widest ${cardErrors.cardNumber ? 'border-red-400 bg-red-50/50' : ''}`} />
                {cardErrors.cardNumber && <p className="text-red-500 text-xs mt-1">{cardErrors.cardNumber}</p>}
              </div>
              {/* Name */}
              <div>
                <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-widest mb-1.5">Name on Card</label>
                <input type="text" value={cardName}
                  onChange={e => { setCardName(e.target.value); if (cardErrors.cardName) setCardErrors(p => ({ ...p, cardName: '' })); }}
                  placeholder="John Doe"
                  className={`${INPUT_CLS} ${cardErrors.cardName ? 'border-red-400 bg-red-50/50' : ''}`} />
                {cardErrors.cardName && <p className="text-red-500 text-xs mt-1">{cardErrors.cardName}</p>}
              </div>
              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-widest mb-1.5">Expiry</label>
                  <input type="text" inputMode="numeric" value={expiry}
                    onChange={e => { setExpiry(formatExpiry(e.target.value)); if (cardErrors.expiry) setCardErrors(p => ({ ...p, expiry: '' })); }}
                    placeholder="MM / YY" maxLength={5}
                    className={`${INPUT_CLS} ${cardErrors.expiry ? 'border-red-400 bg-red-50/50' : ''}`} />
                  {cardErrors.expiry && <p className="text-red-500 text-xs mt-1">{cardErrors.expiry}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-widest mb-1.5">CVV</label>
                  <input type="password" inputMode="numeric" value={cvv}
                    onChange={e => { setCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); if (cardErrors.cvv) setCardErrors(p => ({ ...p, cvv: '' })); }}
                    placeholder="•••" maxLength={4}
                    className={`${INPUT_CLS} ${cardErrors.cvv ? 'border-red-400 bg-red-50/50' : ''}`} />
                  {cardErrors.cvv && <p className="text-red-500 text-xs mt-1">{cardErrors.cvv}</p>}
                </div>
              </div>
              {/* Card logos */}
              <div className="flex items-center gap-2 pt-1">
                {[
                  { name: 'Visa', letter: 'VISA', bg: '#1A1F71', italic: true },
                  { name: 'Mastercard', letter: 'MC', bg: '#EB001B', italic: false },
                  { name: 'RuPay', letter: 'R', bg: '#0070BA', italic: false },
                ].map(c => (
                  <div key={c.name} className="h-8 px-3 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: c.bg, fontStyle: c.italic ? 'italic' : 'normal' }}>{c.letter}</div>
                ))}
              </div>
            </div>
          )}

          {/* ── Pay CTA ── */}
          {!(method === 'upi' && upiType === 'qr') && (
            <div className="px-7 pb-7">
              <button onClick={handlePay} disabled={!razorpayOrderId || creatingOrder}
                className="relative w-full py-4.5 overflow-hidden rounded-2xl text-white font-bold text-base tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                style={{ padding: '1.1rem' }}>
                {/* Gradient bg */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#7A2E2E] via-[#9B3E3E] to-[#7A2E2E] bg-[length:200%_100%] group-hover:bg-[position:right_center] transition-all duration-500" />
                {/* Shimmer */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)' }} />
                <span className="relative flex items-center justify-center gap-2">
                  {creatingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Preparing payment…
                    </>
                  ) : !razorpayOrderId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Please wait…
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Pay ₹{amountDisplay}
                    </>
                  )}
                </span>
              </button>
            </div>
          )}

          {/* ── Footer trust row ── */}
          <div className="border-t border-[#F5F0E8] px-7 py-4 bg-[#FDFAF7] flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B6B6B] font-medium">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              256-bit SSL
            </div>
            <div className="w-px h-4 bg-[#E8E2D9]" />
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B6B6B] font-medium">
              <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Razorpay Secured
            </div>
            <div className="w-px h-4 bg-[#E8E2D9]" />
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B6B6B] font-medium">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              PCI DSS
            </div>
          </div>
        </div>

        {/* Below-card note */}
        <p className="text-center text-[11px] text-[#B0A99B] mt-4">
          By paying, you agree to Fashion Points&apos; Terms &amp; Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F8F5F0 0%, #F2EBE1 40%, #EDE0D4 70%, #F5EDE5 100%)' }}>
        <div className="w-12 h-12 border-4 border-[#E8E2D9] border-t-[#7A2E2E] rounded-full animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
