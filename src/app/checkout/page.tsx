'use client';

import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { CldImage } from 'next-cloudinary';

interface Address {
  id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export default function CheckoutPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { items, totalPrice } = useCart();
  const { language } = useLanguage();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'upi' | 'card'>('upi');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Bihar',
    pincode: '',
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.id) {
      fetchAddresses();
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.mobile || '',
      }));
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (mounted && items.length === 0) {
      router.push('/cart');
    }
  }, [mounted, items.length, router]);

  useEffect(() => {
    if (!isFetching && addresses.length === 0) {
      setShowAddForm(true);
    }
  }, [isFetching, addresses.length]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`/api/user/addresses?userId=${user?.id}`);
      const data = await res.json();
      if (res.ok) {
        const addrs = data.addresses || [];
        setAddresses(addrs);
        const def = addrs.find((a: Address) => a.is_default);
        if (def) setSelectedAddressId(def.id);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          ...formData,
          isDefault: addresses.length === 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddForm(false);
        setFormData({
          name: user?.name || '',
          phone: user?.mobile || '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: 'Bihar',
          pincode: '',
        });
        if (data.address) setSelectedAddressId(data.address.id);
        await fetchAddresses();
      }
    } catch (err) {
      console.error('Error saving address:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = () => {
    const selected = addresses.find(a => a.id === selectedAddressId);
    if (!selected) return;
    sessionStorage.setItem('sweta_order', JSON.stringify({
      items: items.map(i => ({
        id: i.product.id,
        productId: i.product.productId || i.product.id, // Use productId if available, fallback to id
        sellerId: i.product.sellerId || null, // Include sellerId for earnings calculation
        name: i.product.name,
        nameHi: i.product.nameHi,
        image: i.product.mainImage || i.product.image,
        category: i.product.category,
        price: i.product.price,
        quantity: i.quantity,
        size: i.size,
      })),
      address: selected,
      paymentMethod: selectedPayment,
      totalPrice,
    }));
    router.push(`/payment?method=${selectedPayment}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const progressSteps = [
    { num: 1, label: 'Address' },
    { num: 2, label: 'Payment' },
    { num: 3, label: 'Review' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-[#722F37] mb-6" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
          Checkout
        </h1>

        {/* Progress Bar */}
        <div className="flex items-start justify-center max-w-sm mx-auto mb-8">
          {progressSteps.map((s, idx) => (
            <Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step >= s.num ? 'bg-[#722F37] text-white' : 'bg-[#E8E2D9] text-[#6B6B6B]'
                }`}>
                  {step > s.num ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.num}
                </div>
                <span className={`text-xs mt-2 font-medium ${step >= s.num ? 'text-[#722F37]' : 'text-[#6B6B6B]'}`}>
                  {s.label}
                </span>
              </div>
              {idx < 2 && (
                <div className={`w-12 sm:w-20 h-0.5 mt-5 flex-shrink-0 ${step > s.num ? 'bg-[#722F37]' : 'bg-[#E8E2D9]'}`}></div>
              )}
            </Fragment>
          ))}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step Content */}
          <div className="lg:col-span-2">

            {/* ─── STEP 1: Address ─── */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Delivery Address</h2>

                {addresses.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {addresses.map(addr => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-[#722F37] bg-[#722F37]/5'
                            : 'border-[#E8E2D9] hover:border-[#722F37]/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-[#2D2D2D]">{addr.name}</h3>
                              {addr.is_default && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs font-medium rounded-full">Default</span>
                              )}
                            </div>
                            <p className="text-sm text-[#6B6B6B]">{addr.phone}</p>
                            <p className="text-sm text-[#6B6B6B] mt-1">
                              {addr.address_line1}{addr.address_line2 && `, ${addr.address_line2}`}
                            </p>
                            <p className="text-sm text-[#6B6B6B]">{addr.city}, {addr.state} - {addr.pincode}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                            selectedAddressId === addr.id ? 'border-[#722F37]' : 'border-gray-300'
                          }`}>
                            {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-[#722F37]"></div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showAddForm ? (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full border-2 border-dashed border-[#E8E2D9] rounded-xl p-4 text-[#722F37] font-medium hover:border-[#722F37] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Address
                  </button>
                ) : (
                  <div className="bg-white rounded-xl border border-[#E8E2D9] p-6">
                    <h3 className="font-semibold text-[#2D2D2D] mb-4">New Address</h3>
                    <form onSubmit={handleAddAddress} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Full Name</label>
                          <input type="text" name="name" value={formData.name} onChange={handleChange} required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Phone</label>
                          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Address Line 1</label>
                        <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required
                          placeholder="House/Flat No., Building, Street"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Address Line 2 (Optional)</label>
                        <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange}
                          placeholder="Landmark, Area"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent text-sm" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#2D2D2D] mb-1">City</label>
                          <input type="text" name="city" value={formData.city} onChange={handleChange} required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2D2D2D] mb-1">State</label>
                          <select name="state" value={formData.state} onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent text-sm">
                            <option value="Bihar">Bihar</option>
                            <option value="Jharkhand">Jharkhand</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="West Bengal">West Bengal</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2D2D2D] mb-1">PIN Code</label>
                          <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required
                            maxLength={6} pattern="[0-9]{6}"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent text-sm" />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" disabled={isSaving}
                          className="px-6 py-2.5 bg-[#722F37] text-white rounded-lg text-sm font-medium hover:bg-[#5a252c] transition-colors disabled:opacity-50">
                          {isSaving ? 'Saving...' : 'Save Address'}
                        </button>
                        <button type="button" onClick={() => setShowAddForm(false)}
                          className="px-6 py-2.5 border border-gray-300 rounded-lg text-[#6B6B6B] text-sm hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedAddressId}
                  className="mt-6 w-full py-3.5 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-[#722F37]/25 transition-all duration-300 disabled:opacity-50 disabled:shadow-none"
                >
                  Continue
                </button>
              </div>
            )}

            {/* ─── STEP 2: Payment ─── */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Payment Method</h2>

                <div className="space-y-4">
                  {/* UPI */}
                  <div
                    onClick={() => setSelectedPayment('upi')}
                    className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${
                      selectedPayment === 'upi' ? 'border-[#722F37] bg-[#722F37]/5' : 'border-[#E8E2D9] hover:border-[#722F37]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedPayment === 'upi' ? 'bg-[#722F37] text-white' : 'bg-[#F5F0E8] text-[#6B6B6B]'
                        }`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#2D2D2D]">UPI Payment</p>
                            <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs font-medium rounded-full">Recommended</span>
                          </div>
                          <p className="text-sm text-[#6B6B6B]">Google Pay, PhonePe, Paytm, or any UPI app</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedPayment === 'upi' ? 'border-[#722F37]' : 'border-gray-300'
                      }`}>
                        {selectedPayment === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-[#722F37]"></div>}
                      </div>
                    </div>
                    {selectedPayment === 'upi' && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                        {[
                          { name: 'Google Pay', letter: 'G', color: '#00C853' },
                          { name: 'PhonePe', letter: 'P', color: '#5F259F' },
                          { name: 'Paytm', letter: 'P', color: '#00BAF2' },
                          { name: 'BHIM', letter: 'B', color: '#FF9900' },
                        ].map(app => (
                          <div key={app.name} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                            <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: app.color }}>{app.letter}</div>
                            <span className="text-sm text-[#2D2D2D]">{app.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card */}
                  <div
                    onClick={() => setSelectedPayment('card')}
                    className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${
                      selectedPayment === 'card' ? 'border-[#722F37] bg-[#722F37]/5' : 'border-[#E8E2D9] hover:border-[#722F37]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedPayment === 'card' ? 'bg-[#722F37] text-white' : 'bg-[#F5F0E8] text-[#6B6B6B]'
                        }`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-[#2D2D2D]">Credit / Debit Card</p>
                          <p className="text-sm text-[#6B6B6B]">Visa, Mastercard, or RuPay</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedPayment === 'card' ? 'border-[#722F37]' : 'border-gray-300'
                      }`}>
                        {selectedPayment === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-[#722F37]"></div>}
                      </div>
                    </div>
                    {selectedPayment === 'card' && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                        {[
                          { name: 'Visa', letter: 'V', color: '#1A1F71' },
                          { name: 'Mastercard', letter: 'M', color: '#EB001B' },
                          { name: 'RuPay', letter: 'R', color: '#0070BA' },
                        ].map(card => (
                          <div key={card.name} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                            <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: card.color }}>{card.letter}</div>
                            <span className="text-sm text-[#2D2D2D]">{card.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Security note */}
                <div className="mt-4 bg-white rounded-xl border border-[#E8E2D9] p-4 flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#6B6B6B]">All transactions are encrypted and secure. Your payment information is never stored on our servers.</p>
                </div>

                <div className="flex gap-4 mt-6">
                  <button onClick={() => setStep(1)} className="px-6 py-2.5 border border-[#E8E2D9] rounded-lg text-[#6B6B6B] hover:bg-gray-50 transition-colors">Back</button>
                  <button onClick={() => setStep(3)} className="flex-1 py-3.5 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-[#722F37]/25 transition-all duration-300">Continue</button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: Review ─── */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Review Your Order</h2>

                {/* Items */}
                <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 mb-4">
                  <h3 className="font-medium text-[#2D2D2D] mb-3">Order Items ({items.length})</h3>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const imageUrl = item.product.mainImage || item.product.image;
                      const isCloudinary = imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http');
                      return (
                        <div key={`${item.product.id}-${item.size || ''}`} className="flex gap-3 items-center">
                          <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-[#F5F0E8]">
                            {isCloudinary ? (
                              <CldImage src={imageUrl} alt={item.product.name} fill className="object-cover" sizes="64px" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl">
                                  {item.product.category === 'mens' && '👔'}
                                  {item.product.category === 'womens' && '👗'}
                                  {item.product.category === 'sarees' && '🥻'}
                                  {item.product.category === 'kids' && '👶'}
                                  {item.product.category === 'beauty' && '💄'}
                                  {item.product.category === 'footwear' && '👟'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#2D2D2D] truncate">
                              {language === 'hi' ? item.product.nameHi : item.product.name}
                            </p>
                            {item.size && <p className="text-xs text-[#6B6B6B]">Size: {item.size}</p>}
                            <p className="text-xs text-[#6B6B6B]">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-semibold text-[#722F37] flex-shrink-0">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Address summary */}
                <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-[#2D2D2D]">Delivery Address</h3>
                    <button onClick={() => setStep(1)} className="text-sm text-[#722F37] hover:underline">Edit</button>
                  </div>
                  {selectedAddress && (
                    <div className="text-sm text-[#6B6B6B]">
                      <p className="font-medium text-[#2D2D2D]">{selectedAddress.name}</p>
                      <p>{selectedAddress.phone}</p>
                      <p>{selectedAddress.address_line1}{selectedAddress.address_line2 && `, ${selectedAddress.address_line2}`}</p>
                      <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
                    </div>
                  )}
                </div>

                {/* Payment summary */}
                <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-[#2D2D2D]">Payment Method</h3>
                    <button onClick={() => setStep(2)} className="text-sm text-[#722F37] hover:underline">Edit</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F5F0E8] rounded-full flex items-center justify-center">
                      {selectedPayment === 'upi' ? (
                        <svg className="w-5 h-5 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#2D2D2D]">
                      {selectedPayment === 'upi' ? 'UPI Payment' : 'Credit / Debit Card'}
                    </p>
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-white rounded-xl border border-[#E8E2D9] p-5">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6B6B6B]">Subtotal</span>
                      <span className="font-medium text-[#2D2D2D]">₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6B6B]">Delivery</span>
                      <span className="text-green-600 font-semibold">Free</span>
                    </div>
                  </div>
                  <div className="border-t border-[#E8E2D9] mt-3 pt-3 flex justify-between">
                    <span className="font-bold text-[#2D2D2D]">Total</span>
                    <span className="text-lg font-bold text-[#722F37]">₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button onClick={() => setStep(2)} className="px-6 py-2.5 border border-[#E8E2D9] rounded-lg text-[#6B6B6B] hover:bg-gray-50 transition-colors">Back</button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3.5 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-[#722F37]/25 transition-all duration-300"
                  >
                    Confirm & Pay ₹{totalPrice.toLocaleString('en-IN')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── Order Summary Sidebar ─── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-[#E8E2D9] p-5 sticky top-24">
              <h3 className="font-bold text-[#2D2D2D] mb-4" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>Order Summary</h3>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={`${item.product.id}-${item.size || ''}`} className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B] truncate mr-2">
                      {language === 'hi' ? item.product.nameHi : item.product.name}
                      {item.size && ` (${item.size})`} × {item.quantity}
                    </span>
                    <span className="font-medium text-[#2D2D2D] flex-shrink-0">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E8E2D9] mt-4 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Subtotal</span>
                  <span className="font-medium text-[#2D2D2D]">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Delivery</span>
                  <span className="text-green-600 font-semibold">Free</span>
                </div>
              </div>
              <div className="border-t border-[#E8E2D9] mt-3 pt-3 flex justify-between">
                <span className="font-bold text-[#2D2D2D]">Total</span>
                <span className="font-bold text-[#722F37]">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
