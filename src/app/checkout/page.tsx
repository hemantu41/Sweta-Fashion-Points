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

const EMPTY_FORM = {
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: 'Bihar',
  pincode: '',
};

const INPUT_CLS =
  'w-full px-4 py-3 border border-[#E8E2D9] rounded-xl text-sm text-[#2D2D2D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#722F37]/40 focus:border-[#722F37] transition-all bg-white';

const LABEL_CLS = 'block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-1.5';

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
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.id) {
      fetchAddresses();
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (mounted && items.length === 0) router.push('/cart');
  }, [mounted, items.length, router]);

  useEffect(() => {
    if (!isFetching && addresses.length === 0) {
      openAddModal();
    }
  }, [isFetching, addresses.length]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`/api/user/addresses?userId=${user?.id}`);
      const data = await res.json();
      if (res.ok) {
        const addrs: Address[] = data.addresses || [];
        setAddresses(addrs);
        const def = addrs.find(a => a.is_default);
        if (def) setSelectedAddressId(def.id);
        else if (addrs.length > 0) setSelectedAddressId(addrs[0].id);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({
      ...EMPTY_FORM,
      name: user?.name || '',
      phone: user?.mobile || '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFormData({
      name: addr.name,
      phone: addr.phone,
      addressLine1: addr.address_line1,
      addressLine2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingAddress(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingAddress) {
        // Edit existing
        const res = await fetch(`/api/user/addresses/${editingAddress.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id, ...formData }),
        });
        if (res.ok) {
          closeModal();
          await fetchAddresses();
        }
      } else {
        // Add new
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
          closeModal();
          if (data.address) setSelectedAddressId(data.address.id);
          await fetchAddresses();
        }
      }
    } catch (err) {
      console.error('Error saving address:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (res.ok) {
        if (selectedAddressId === id) setSelectedAddressId(null);
        await fetchAddresses();
      }
    } catch (err) {
      console.error('Error deleting address:', err);
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const handleConfirm = () => {
    const selected = addresses.find(a => a.id === selectedAddressId);
    if (!selected) return;
    sessionStorage.setItem('sweta_order', JSON.stringify({
      items: items.map(i => ({
        id: i.product.id,
        productId: i.product.productId || i.product.id,
        sellerId: i.product.sellerId || null,
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

  // ─── Loading / guards ────────────────────────────────────────────────────────
  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const delivery = totalPrice >= 999 ? 0 : 49;
  const grandTotal = totalPrice + delivery;

  const steps = [
    { num: 1, label: 'Address' },
    { num: 2, label: 'Payment' },
    { num: 3, label: 'Review' },
  ];

  const continueDisabled = step === 1 ? !selectedAddressId : false;

  const handleContinue = () => {
    if (step < 3) setStep(s => s + 1);
    else handleConfirm();
  };

  const continueCTA =
    step === 3
      ? `Confirm & Pay ₹${grandTotal.toLocaleString('en-IN')}`
      : 'Continue';

  // ─── Address form modal ───────────────────────────────────────────────────────
  const AddressModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeModal}
      />
      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-[fadeInUp_0.25s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0EBE3]">
          <h3 className="text-lg font-bold text-[#2D2D2D]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button
            onClick={closeModal}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F0E8] text-[#6B6B6B] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSaveAddress} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your name" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="10-digit number" className={INPUT_CLS} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Address Line 1</label>
            <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required placeholder="House/Flat No., Building, Street" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Address Line 2 <span className="normal-case font-normal text-gray-400">(Optional)</span></label>
            <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Landmark, Area" className={INPUT_CLS} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL_CLS}>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="City" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>State</label>
              <select name="state" value={formData.state} onChange={handleChange} className={INPUT_CLS}>
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
              <label className={LABEL_CLS}>PIN Code</label>
              <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required maxLength={6} pattern="[0-9]{6}" placeholder="6 digits" className={INPUT_CLS} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#722F37]/25 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : editingAddress ? 'Update Address' : 'Save Address'}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-3 border border-[#E8E2D9] rounded-xl text-[#6B6B6B] hover:bg-[#FAF7F2] transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─── Delete confirm modal ─────────────────────────────────────────────────────
  const DeleteModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        <h3 className="text-lg font-bold text-[#2D2D2D] mb-2">Delete Address?</h3>
        <p className="text-sm text-[#6B6B6B] mb-6">This address will be permanently removed from your account.</p>
        <div className="flex gap-3">
          <button
            onClick={() => deleteConfirmId && handleDeleteAddress(deleteConfirmId)}
            disabled={!!deletingId}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            {deletingId ? 'Deleting…' : 'Yes, Delete'}
          </button>
          <button
            onClick={() => setDeleteConfirmId(null)}
            className="flex-1 py-2.5 border border-[#E8E2D9] rounded-xl text-[#6B6B6B] hover:bg-[#FAF7F2] transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Order Summary (shared sidebar content) ───────────────────────────────────
  const OrderSummary = () => (
    <div className="bg-white rounded-2xl border border-[#F0EBE3] shadow-sm overflow-hidden sticky top-24">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#F0EBE3] bg-[#FAF7F2]">
        <h3 className="font-bold text-[#2D2D2D] text-base" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
          Order Summary
        </h3>
        <p className="text-xs text-[#6B6B6B] mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>
      {/* Items */}
      <div className="px-6 py-4 space-y-3 max-h-56 overflow-y-auto">
        {items.map(item => {
          const imageUrl = item.product.mainImage || item.product.image;
          const isCloudinary = imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http');
          const emoji = { mens: '👔', womens: '👗', sarees: '🥻', kids: '👶', beauty: '💄', footwear: '👟' }[item.product.category] || '🛍';
          return (
            <div key={`${item.product.id}-${item.size || ''}`} className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-[#F5F0E8]">
                {isCloudinary ? (
                  <CldImage src={imageUrl} alt={item.product.name} fill className="object-cover" sizes="48px" />
                ) : imageUrl && imageUrl.startsWith('http') ? (
                  <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-lg">{emoji}</div>
                )}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#722F37] rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                  {item.quantity}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#2D2D2D] truncate">
                  {language === 'hi' ? item.product.nameHi : item.product.name}
                </p>
                {item.size && <p className="text-[11px] text-[#6B6B6B]">Size: {item.size}</p>}
              </div>
              <p className="text-sm font-semibold text-[#2D2D2D] flex-shrink-0">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
            </div>
          );
        })}
      </div>
      {/* Totals */}
      <div className="px-6 py-4 border-t border-[#F0EBE3] space-y-2 text-sm">
        <div className="flex justify-between text-[#6B6B6B]">
          <span>Subtotal</span>
          <span className="text-[#2D2D2D] font-medium">₹{totalPrice.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-[#6B6B6B]">
          <span>Delivery</span>
          {delivery === 0 ? (
            <span className="text-green-600 font-semibold">Free</span>
          ) : (
            <span className="text-[#2D2D2D] font-medium">₹{delivery}</span>
          )}
        </div>
      </div>
      <div className="px-6 py-4 border-t border-[#F0EBE3]">
        <div className="flex justify-between items-baseline">
          <span className="font-bold text-[#2D2D2D]">Total</span>
          <span className="text-xl font-bold text-[#722F37]">₹{grandTotal.toLocaleString('en-IN')}</span>
        </div>
        {delivery === 0 && (
          <p className="text-xs text-green-600 mt-1 font-medium">You save on delivery!</p>
        )}
      </div>
      {/* Delivery estimate */}
      <div className="mx-6 mb-4 px-4 py-3 bg-[#F5F0E8] rounded-xl flex items-center gap-3">
        <svg className="w-5 h-5 text-[#722F37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <div>
          <p className="text-xs font-semibold text-[#2D2D2D]">Estimated Delivery</p>
          <p className="text-xs text-[#6B6B6B]">3–5 Business Days</p>
        </div>
      </div>
      {/* Payment logos */}
      <div className="px-6 pb-4">
        <p className="text-[11px] text-[#6B6B6B] mb-2 text-center">Secure payments via</p>
        <div className="flex items-center justify-center gap-2">
          {[
            { label: 'Visa', bg: '#1A1F71', letter: 'VISA', textColor: '#fff', italic: true },
            { label: 'Mastercard', bg: '#EB001B', letter: 'MC', textColor: '#fff', italic: false },
            { label: 'UPI', bg: '#00C853', letter: 'UPI', textColor: '#fff', italic: false },
            { label: 'Razorpay', bg: '#072654', letter: 'RP', textColor: '#fff', italic: false },
          ].map(p => (
            <div key={p.label} title={p.label} className="h-7 px-2 rounded flex items-center justify-center text-[10px] font-bold tracking-wide"
              style={{ backgroundColor: p.bg, color: p.textColor, fontStyle: p.italic ? 'italic' : 'normal' }}>
              {p.letter}
            </div>
          ))}
        </div>
      </div>
      {/* Trust indicators */}
      <div className="border-t border-[#F0EBE3] px-4 py-4 bg-[#FAFAF9]">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { icon: '🔒', label: 'Secure Payment' },
            { icon: '↩', label: 'Easy Returns' },
            { icon: '⚡', label: 'Fast Delivery' },
          ].map(t => (
            <div key={t.label} className="flex flex-col items-center gap-1">
              <span className="text-lg">{t.icon}</span>
              <span className="text-[10px] text-[#6B6B6B] font-medium leading-tight">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Security badge */}
      <div className="px-6 pb-5 flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-[11px] text-green-700 font-semibold">100% Secure Checkout</p>
      </div>
    </div>
  );

  // ─── Step content ─────────────────────────────────────────────────────────────
  const StepContent = () => {
    // STEP 1 — Address
    if (step === 1) return (
      <div>
        <h2 className="text-2xl font-bold text-[#2D2D2D] mb-6" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
          Delivery Address
        </h2>
        <div className="space-y-3 mb-4">
          {addresses.map(addr => (
            <div
              key={addr.id}
              onClick={() => setSelectedAddressId(addr.id)}
              className={`group relative bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                selectedAddressId === addr.id
                  ? 'border-[#722F37] shadow-[0_0_0_3px_rgba(114,47,55,0.08)]'
                  : 'border-[#F0EBE3] hover:border-[#722F37]/40'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Radio */}
                <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedAddressId === addr.id ? 'border-[#722F37]' : 'border-gray-300'
                }`}>
                  {selectedAddressId === addr.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#722F37]" />
                  )}
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-semibold text-[#2D2D2D]">{addr.name}</span>
                    {addr.is_default && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[11px] font-semibold rounded-full border border-green-200">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#6B6B6B]">{addr.phone}</p>
                  <p className="text-sm text-[#6B6B6B] mt-1">
                    {addr.address_line1}{addr.address_line2 && `, ${addr.address_line2}`}
                  </p>
                  <p className="text-sm text-[#6B6B6B]">{addr.city}, {addr.state} — {addr.pincode}</p>
                </div>
                {/* Edit / Delete */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openEditModal(addr)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-[#6B6B6B] hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(addr.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#6B6B6B] hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Add address */}
        <button
          onClick={openAddModal}
          className="w-full border-2 border-dashed border-[#E8E2D9] hover:border-[#722F37] rounded-2xl p-4 text-[#722F37] font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:bg-[#722F37]/4 group"
        >
          <div className="w-7 h-7 rounded-full border-2 border-[#722F37] flex items-center justify-center group-hover:bg-[#722F37] group-hover:text-white transition-all">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          Add New Address
        </button>
      </div>
    );

    // STEP 2 — Payment
    if (step === 2) return (
      <div>
        <h2 className="text-2xl font-bold text-[#2D2D2D] mb-6" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
          Payment Method
        </h2>
        <div className="space-y-4">
          {/* UPI */}
          <div
            onClick={() => setSelectedPayment('upi')}
            className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              selectedPayment === 'upi' ? 'border-[#722F37] shadow-[0_0_0_3px_rgba(114,47,55,0.08)]' : 'border-[#F0EBE3] hover:border-[#722F37]/40'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedPayment === 'upi' ? 'bg-[#722F37] text-white' : 'bg-[#F5F0E8] text-[#6B6B6B]'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[#2D2D2D]">UPI Payment</p>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[11px] font-semibold rounded-full border border-green-200">Recommended</span>
                </div>
                <p className="text-sm text-[#6B6B6B] mt-0.5">Google Pay, PhonePe, Paytm, or any UPI app</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                selectedPayment === 'upi' ? 'border-[#722F37]' : 'border-gray-300'
              }`}>
                {selectedPayment === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-[#722F37]" />}
              </div>
            </div>
            {selectedPayment === 'upi' && (
              <div className="mt-4 pt-4 border-t border-[#F0EBE3] flex flex-wrap gap-2">
                {[
                  { name: 'Google Pay', letter: 'G', bg: '#00C853' },
                  { name: 'PhonePe', letter: 'P', bg: '#5F259F' },
                  { name: 'Paytm', letter: 'P', bg: '#00BAF2' },
                  { name: 'BHIM', letter: 'B', bg: '#FF9900' },
                ].map(app => (
                  <div key={app.name} className="flex items-center gap-2 px-3 py-2 bg-[#FAFAF9] border border-[#F0EBE3] rounded-xl">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: app.bg }}>{app.letter}</div>
                    <span className="text-sm text-[#2D2D2D]">{app.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card */}
          <div
            onClick={() => setSelectedPayment('card')}
            className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              selectedPayment === 'card' ? 'border-[#722F37] shadow-[0_0_0_3px_rgba(114,47,55,0.08)]' : 'border-[#F0EBE3] hover:border-[#722F37]/40'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedPayment === 'card' ? 'bg-[#722F37] text-white' : 'bg-[#F5F0E8] text-[#6B6B6B]'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#2D2D2D]">Credit / Debit Card</p>
                <p className="text-sm text-[#6B6B6B] mt-0.5">Visa, Mastercard, or RuPay</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                selectedPayment === 'card' ? 'border-[#722F37]' : 'border-gray-300'
              }`}>
                {selectedPayment === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-[#722F37]" />}
              </div>
            </div>
            {selectedPayment === 'card' && (
              <div className="mt-4 pt-4 border-t border-[#F0EBE3] flex flex-wrap gap-2">
                {[
                  { name: 'Visa', letter: 'VISA', bg: '#1A1F71', italic: true },
                  { name: 'Mastercard', letter: 'MC', bg: '#EB001B', italic: false },
                  { name: 'RuPay', letter: 'R', bg: '#0070BA', italic: false },
                ].map(card => (
                  <div key={card.name} className="flex items-center gap-2 px-3 py-2 bg-[#FAFAF9] border border-[#F0EBE3] rounded-xl">
                    <div className="h-7 px-2 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: card.bg, fontStyle: card.italic ? 'italic' : 'normal' }}>{card.letter}</div>
                    <span className="text-sm text-[#2D2D2D]">{card.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security note */}
        <div className="mt-4 bg-white rounded-2xl border border-[#F0EBE3] p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-green-50 border border-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-sm text-[#6B6B6B]">All transactions are 256-bit encrypted and secure. Your payment information is never stored on our servers.</p>
        </div>
      </div>
    );

    // STEP 3 — Review
    return (
      <div>
        <h2 className="text-2xl font-bold text-[#2D2D2D] mb-6" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
          Review Your Order
        </h2>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-[#F0EBE3] p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#2D2D2D]">Items ({items.length})</h3>
          </div>
          <div className="space-y-4">
            {items.map(item => {
              const imageUrl = item.product.mainImage || item.product.image;
              const isCloudinary = imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http');
              const emoji = { mens: '👔', womens: '👗', sarees: '🥻', kids: '👶', beauty: '💄', footwear: '👟' }[item.product.category] || '🛍';
              return (
                <div key={`${item.product.id}-${item.size || ''}`} className="flex gap-3 items-center">
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-[#F5F0E8]">
                    {isCloudinary ? (
                      <CldImage src={imageUrl} alt={item.product.name} fill className="object-cover" sizes="56px" />
                    ) : imageUrl?.startsWith('http') ? (
                      <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl">{emoji}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2D2D2D] truncate">
                      {language === 'hi' ? item.product.nameHi : item.product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.size && <span className="text-xs text-[#6B6B6B]">Size: {item.size}</span>}
                      <span className="text-xs text-[#6B6B6B]">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#722F37] flex-shrink-0">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery address summary */}
        <div className="bg-white rounded-2xl border border-[#F0EBE3] p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#2D2D2D]">Delivery Address</h3>
            <button onClick={() => setStep(1)} className="text-sm text-[#722F37] hover:underline font-medium">Change</button>
          </div>
          {selectedAddress && (
            <div className="text-sm text-[#6B6B6B] space-y-0.5">
              <p className="font-semibold text-[#2D2D2D]">{selectedAddress.name} · {selectedAddress.phone}</p>
              <p>{selectedAddress.address_line1}{selectedAddress.address_line2 && `, ${selectedAddress.address_line2}`}</p>
              <p>{selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}</p>
            </div>
          )}
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-2xl border border-[#F0EBE3] p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#2D2D2D]">Payment Method</h3>
            <button onClick={() => setStep(2)} className="text-sm text-[#722F37] hover:underline font-medium">Change</button>
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
            <div>
              <p className="text-sm font-semibold text-[#2D2D2D]">{selectedPayment === 'upi' ? 'UPI Payment' : 'Credit / Debit Card'}</p>
              <p className="text-xs text-[#6B6B6B]">{selectedPayment === 'upi' ? 'Google Pay, PhonePe, Paytm, BHIM' : 'Visa, Mastercard, RuPay'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Navigation buttons ────────────────────────────────────────────────────────
  const NavButtons = ({ className = '' }) => (
    <div className={`flex gap-4 mt-8 ${className}`}>
      {step > 1 && (
        <button
          onClick={() => setStep(s => s - 1)}
          className="px-6 py-3.5 border-2 border-[#E8E2D9] rounded-full text-[#6B6B6B] hover:border-[#722F37]/40 hover:bg-[#FAF7F2] transition-all font-medium text-sm"
        >
          ← Back
        </button>
      )}
      <button
        onClick={handleContinue}
        disabled={continueDisabled}
        className="flex-1 py-3.5 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-bold rounded-full hover:shadow-xl hover:shadow-[#722F37]/25 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none text-base"
      >
        {continueCTA}
      </button>
    </div>
  );

  // ─── Main render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Add / Edit Address Modal */}
      {showAddModal && <AddressModal />}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && <DeleteModal />}

      <div className="min-h-screen bg-[#FAF7F2] pb-32 lg:pb-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push('/cart')}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white border border-transparent hover:border-[#E8E2D9] text-[#6B6B6B] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#2D2D2D]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                Checkout
              </h1>
              <p className="text-sm text-[#6B6B6B] mt-0.5">Fashion Points — Secure &amp; Fast Delivery</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center mb-10">
            <div className="flex items-center">
              {steps.map((s, idx) => (
                <Fragment key={s.num}>
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => step > s.num && setStep(s.num)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        step > s.num
                          ? 'bg-[#722F37] text-white cursor-pointer hover:scale-105'
                          : step === s.num
                          ? 'bg-[#722F37] text-white ring-4 ring-[#722F37]/20'
                          : 'bg-white border-2 border-[#E8E2D9] text-[#6B6B6B] cursor-default'
                      }`}
                    >
                      {step > s.num ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : s.num}
                    </button>
                    <span className={`text-xs mt-2 font-semibold transition-colors ${
                      step >= s.num ? 'text-[#722F37]' : 'text-[#B0A99B]'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className="w-16 sm:w-24 h-0.5 mx-2 mb-4 relative">
                      <div className="absolute inset-0 bg-[#E8E2D9] rounded-full" />
                      <div
                        className="absolute inset-y-0 left-0 bg-[#722F37] rounded-full transition-all duration-500"
                        style={{ width: step > s.num ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* LEFT — 65% */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl border border-[#F0EBE3] shadow-sm p-6 sm:p-8">
                <StepContent />
                {/* Navigation buttons — desktop */}
                <NavButtons className="hidden lg:flex" />
              </div>
            </div>

            {/* RIGHT — 35% */}
            <div className="w-full lg:w-[380px] flex-shrink-0">
              <OrderSummary />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky continue bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-[#F0EBE3] px-4 py-4 shadow-[0_-8px_32px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-[#6B6B6B]">Total</p>
            <p className="text-lg font-bold text-[#722F37]">₹{grandTotal.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs font-semibold">Secure</span>
          </div>
        </div>
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-5 py-3 border-2 border-[#E8E2D9] rounded-full text-[#6B6B6B] font-medium text-sm"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={continueDisabled}
            className="flex-1 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-bold rounded-full disabled:opacity-40 transition-all text-sm"
          >
            {continueCTA}
          </button>
        </div>
      </div>
    </>
  );
}
