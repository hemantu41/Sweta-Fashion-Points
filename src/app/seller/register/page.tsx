'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const LocationPickerMap = dynamic(() => import('@/components/LocationPickerMap'), { ssr: false });

/* ─── Color Tokens ────────────────────────────────────────────────────────── */
const C = {
  primary: '#5B1A3A',
  primaryLight: '#7A2350',
  primaryDark: '#3D0E2A',
  accent: '#C49A3C',
  accentLight: '#DDB868',
  accentSubtle: 'rgba(196,154,60,0.08)',
  bgWarm: '#FAF7F8',
  bgCard: '#FFFFFF',
  heading: '#5B1A3A',
  body: '#555555',
  muted: '#888888',
  borderSubtle: 'rgba(91,26,58,0.12)',
  borderMedium: 'rgba(196,154,60,0.25)',
  success: '#16A34A',
  successBg: '#F0FDF4',
  error: '#DC2626',
  errorBg: '#FEF2F2',
};

const FONT_PLAYFAIR = "var(--font-playfair), 'Playfair Display', Georgia, serif";
const FONT_BODY = "'DM Sans', var(--font-lato), sans-serif";

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes scaleIn { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
@keyframes checkPop { 0%{transform:scale(0)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
@keyframes confetti { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
.fade-up { animation: fadeUp 0.5s ease-out forwards; }
.scale-in { animation: scaleIn 0.4s ease-out forwards; }
.check-pop { animation: checkPop 0.4s ease-out forwards; }
`;

/* ─── Step Definitions ────────────────────────────────────────────────────── */
const STEPS = [
  { id: 1, title: 'Basic Info', titleHi: 'बुनियादी जानकारी', subtitle: 'Account Details' },
  { id: 2, title: 'Business', titleHi: 'व्यापार', subtitle: 'Business Details' },
  { id: 3, title: 'Documents', titleHi: 'दस्तावेज़', subtitle: 'KYC & Bank' },
  { id: 4, title: 'Products', titleHi: 'उत्पाद', subtitle: 'Sample Photos' },
  { id: 5, title: 'Confirm', titleHi: 'पुष्टि करें', subtitle: 'Review & Submit' },
];

const BUSINESS_TYPES = [
  'Sarees', 'Women\'s Wear', 'Men\'s Wear', 'Kids Wear', 'Ethnic Wear',
  'Western Wear', 'Accessories', 'Footwear', 'Jewellery', 'Other',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface FormData {
  // Step 1
  fullName: string;
  phone: string;
  email: string;
  // Step 2
  businessName: string;
  businessNameHi: string;
  businessTypes: string[];
  hasGST: boolean;
  gstin: string;
  pan: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  // Step 3
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  // Step 5
  termsAccepted: boolean;
}

export default function SellerRegisterPage() {
  const { user, isSeller, sellerStatus, isApprovedSeller, login } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    email: '',
    businessName: '',
    businessNameHi: '',
    businessTypes: [],
    hasGST: false,
    gstin: '',
    pan: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    latitude: null,
    longitude: null,
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
    termsAccepted: false,
  });

  // OTP states
  const [phoneOtp, setPhoneOtp] = useState({ sent: false, code: '', verified: false, loading: false, error: '' });
  const [emailOtp, setEmailOtp] = useState({ sent: false, code: '', verified: false, loading: false, error: '' });

  // Product photos (Step 4)
  const [productPhotos, setProductPhotos] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document uploads (Step 3)
  const [documents, setDocuments] = useState<{
    panCard: { file: File | null; preview: string };
    aadhaarFront: { file: File | null; preview: string };
    aadhaarBack: { file: File | null; preview: string };
    gstCertificate: { file: File | null; preview: string };
    chequeOrPassbook: { file: File | null; preview: string };
  }>({
    panCard: { file: null, preview: '' },
    aadhaarFront: { file: null, preview: '' },
    aadhaarBack: { file: null, preview: '' },
    gstCertificate: { file: null, preview: '' },
    chequeOrPassbook: { file: null, preview: '' },
  });

  // Refresh seller status on mount
  useEffect(() => {
    const refreshSellerStatus = async () => {
      if (!user) { setRefreshing(false); return; }
      try {
        const response = await fetch(`/api/sellers/me?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          const latestStatus = data.seller?.status;
          if (data.seller) {
            const updatedUser = { ...user, isSeller: true, sellerId: data.seller.id, sellerStatus: latestStatus };
            login(updatedUser);
            if (sellerStatus !== 'approved' && latestStatus === 'approved') {
              setTimeout(() => window.location.reload(), 500);
              return;
            }
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

  // Pre-fill name and phone from user context
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const updateField = (field: keyof FormData, value: string | boolean | string[] | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  // ─── OTP Functions ──────────────────────────────────────────────────────
  const sendPhoneOTP = async () => {
    if (!formData.phone || formData.phone.length !== 10) {
      setPhoneOtp(p => ({ ...p, error: 'Enter a valid 10-digit number' }));
      return;
    }
    setPhoneOtp(p => ({ ...p, loading: true, error: '' }));
    try {
      const res = await fetch('/api/sellers/send-verification-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'phone', value: formData.phone }),
      });
      if (res.ok) setPhoneOtp(p => ({ ...p, sent: true, loading: false }));
      else {
        const data = await res.json();
        setPhoneOtp(p => ({ ...p, error: data.error || 'Failed to send OTP', loading: false }));
      }
    } catch {
      setPhoneOtp(p => ({ ...p, error: 'Network error', loading: false }));
    }
  };

  const verifyPhoneOTP = async () => {
    if (phoneOtp.code.length !== 6) {
      setPhoneOtp(p => ({ ...p, error: 'Enter 6-digit OTP' }));
      return;
    }
    setPhoneOtp(p => ({ ...p, loading: true, error: '' }));
    try {
      const res = await fetch('/api/sellers/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'phone', value: formData.phone, otp: phoneOtp.code }),
      });
      const data = await res.json();
      if (res.ok && data.verified) setPhoneOtp(p => ({ ...p, verified: true, loading: false }));
      else setPhoneOtp(p => ({ ...p, error: data.error || 'Invalid OTP', loading: false }));
    } catch {
      setPhoneOtp(p => ({ ...p, error: 'Verification failed', loading: false }));
    }
  };

  const sendEmailOTP = async () => {
    if (!formData.email) {
      setEmailOtp(p => ({ ...p, error: 'Enter your email' }));
      return;
    }
    setEmailOtp(p => ({ ...p, loading: true, error: '' }));
    try {
      const res = await fetch('/api/sellers/send-verification-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', value: formData.email }),
      });
      if (res.ok) setEmailOtp(p => ({ ...p, sent: true, loading: false }));
      else {
        const data = await res.json();
        setEmailOtp(p => ({ ...p, error: data.error || 'Failed to send OTP', loading: false }));
      }
    } catch {
      setEmailOtp(p => ({ ...p, error: 'Network error', loading: false }));
    }
  };

  const verifyEmailOTP = async () => {
    if (emailOtp.code.length !== 6) {
      setEmailOtp(p => ({ ...p, error: 'Enter 6-digit OTP' }));
      return;
    }
    setEmailOtp(p => ({ ...p, loading: true, error: '' }));
    try {
      const res = await fetch('/api/sellers/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', value: formData.email, otp: emailOtp.code }),
      });
      const data = await res.json();
      if (res.ok && data.verified) setEmailOtp(p => ({ ...p, verified: true, loading: false }));
      else setEmailOtp(p => ({ ...p, error: data.error || 'Invalid OTP', loading: false }));
    } catch {
      setEmailOtp(p => ({ ...p, error: 'Verification failed', loading: false }));
    }
  };

  // ─── Validation ──────────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
      // Phone is optional (DLT not approved yet)
      if (formData.phone && formData.phone.length !== 10) errs.phone = 'Enter a valid 10-digit phone number';
      if (formData.phone && formData.phone.length === 10 && !phoneOtp.verified) errs.phone = 'Please verify your phone number';
      if (!formData.email) errs.email = 'Email is required';
      if (!emailOtp.verified) errs.email = 'Please verify your email';
    }

    if (step === 2) {
      if (!formData.businessName.trim()) errs.businessName = 'Business name is required';
      if (formData.businessTypes.length === 0) errs.businessTypes = 'Select at least one business type';
      if (formData.hasGST && !formData.gstin) errs.gstin = 'GSTIN is required';
      if (!formData.hasGST && !formData.pan) errs.pan = 'PAN is required';
      if (!formData.addressLine1.trim()) errs.addressLine1 = 'Address is required';
      if (!formData.city.trim()) errs.city = 'City is required';
      if (!formData.state) errs.state = 'State is required';
      if (!formData.pincode || formData.pincode.length !== 6) errs.pincode = 'Valid 6-digit pincode required';
    }

    if (step === 3) {
      if (!documents.panCard.file) errs.panCard = 'PAN Card is required';
      if (!documents.aadhaarFront.file) errs.aadhaarFront = 'Aadhaar Front is required';
      if (!documents.aadhaarBack.file) errs.aadhaarBack = 'Aadhaar Back is required';
      if (formData.hasGST && !documents.gstCertificate.file) errs.gstCertificate = 'GST Certificate is required';
      if (!documents.chequeOrPassbook.file) errs.chequeOrPassbook = 'Cancelled Cheque / Passbook is required';
      if (!formData.bankAccountName.trim()) errs.bankAccountName = 'Account holder name required';
      if (!formData.bankAccountNumber) errs.bankAccountNumber = 'Account number required';
      if (!formData.bankIfsc) errs.bankIfsc = 'IFSC code required';
      if (!formData.bankName.trim()) errs.bankName = 'Bank name required';
    }

    if (step === 5) {
      if (!formData.termsAccepted) errs.termsAccepted = 'Please accept terms & conditions';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(s => Math.min(s + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── File Handling ───────────────────────────────────────────────────────
  const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB

  const handleDocUpload = (key: keyof typeof documents, file: File | null) => {
    if (!file) return;
    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, [key]: 'Only JPEG, PNG, and PDF files are allowed' }));
      return;
    }
    if (file.size > MAX_DOC_SIZE) {
      setErrors(prev => ({ ...prev, [key]: 'File size must be under 5MB' }));
      return;
    }
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    const preview = file.type === 'application/pdf' ? 'pdf' : URL.createObjectURL(file);
    setDocuments(prev => ({ ...prev, [key]: { file, preview } }));
  };

  const handleProductPhotos = (files: FileList | null) => {
    if (!files) return;
    const newPhotos = Array.from(files).slice(0, 6 - productPhotos.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setProductPhotos(prev => [...prev, ...newPhotos].slice(0, 6));
  };

  const removeProductPhoto = (index: number) => {
    setProductPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/sellers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          businessName: formData.businessName,
          businessNameHi: formData.businessNameHi,
          gstin: formData.hasGST ? formData.gstin : '',
          pan: formData.pan,
          businessEmail: formData.email,
          businessPhone: formData.phone,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          latitude: formData.latitude,
          longitude: formData.longitude,
          bankAccountName: formData.bankAccountName,
          bankAccountNumber: formData.bankAccountNumber,
          bankIfsc: formData.bankIfsc,
          bankName: formData.bankName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = {
          ...user,
          isSeller: true,
          sellerId: data.seller?.id,
          sellerStatus: 'pending' as const,
        };
        login(updatedUser);
        setSubmitted(true);
      } else {
        setErrors({ submit: data.error || 'Registration failed. Please try again.' });
      }
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading State ───────────────────────────────────────────────────────
  if (refreshing) {
    return (
      <div style={{ minHeight: '100vh', background: C.bgWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY }}>
        <style>{GLOBAL_STYLES}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: C.body }}>Loading...</p>
        </div>
      </div>
    );
  }

  // ─── Not Logged In ───────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: C.bgWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY, padding: 24 }}>
        <style>{GLOBAL_STYLES}</style>
        <div className="scale-in" style={{ maxWidth: 440, width: '100%', background: C.bgCard, borderRadius: 20, padding: 48, textAlign: 'center', boxShadow: '0 8px 40px rgba(91,26,58,0.06)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="32" height="32" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
          </div>
          <h2 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 26, fontWeight: 700, color: C.heading, marginBottom: 12 }}>Login Required</h2>
          <p style={{ color: C.body, marginBottom: 32, lineHeight: 1.6 }}>Please login first to register as a seller on Insta Fashion Points.</p>
          <Link href="/login" style={{ display: 'inline-block', padding: '14px 40px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: 'white', borderRadius: 50, fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ─── Already a Seller — Show Status ──────────────────────────────────────
  if (isSeller && sellerStatus) {
    const statusConfig: Record<string, { icon: string; color: string; bg: string; title: string; desc: string }> = {
      pending: { icon: '⏳', color: '#CA8A04', bg: '#FEFCE8', title: 'Application Under Review', desc: 'Your seller application is being reviewed by our team. We typically review applications within 24-48 hours.' },
      approved: { icon: '🎉', color: C.success, bg: C.successBg, title: 'Congratulations!', desc: 'Your seller application has been approved! You can now start adding products and managing your store.' },
      rejected: { icon: '❌', color: C.error, bg: C.errorBg, title: 'Application Not Approved', desc: 'Unfortunately, your seller application was not approved. Please contact support for more information.' },
      suspended: { icon: '🚫', color: '#6B7280', bg: '#F9FAFB', title: 'Account Suspended', desc: 'Your seller account has been temporarily suspended. Please contact the admin team.' },
    };
    const cfg = statusConfig[sellerStatus] || statusConfig.pending;

    return (
      <div style={{ minHeight: '100vh', background: C.bgWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY, padding: 24 }}>
        <style>{GLOBAL_STYLES}</style>
        <div className="scale-in" style={{ maxWidth: 520, width: '100%', background: C.bgCard, borderRadius: 20, padding: 48, textAlign: 'center', boxShadow: '0 8px 40px rgba(91,26,58,0.06)' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>{cfg.icon}</div>
          <h2 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 26, fontWeight: 700, color: C.heading, marginBottom: 16 }}>{cfg.title}</h2>
          <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}20`, borderRadius: 12, padding: 20, marginBottom: 28 }}>
            <p style={{ color: cfg.color, fontWeight: 600, marginBottom: 4 }}>Status: {sellerStatus.charAt(0).toUpperCase() + sellerStatus.slice(1)}</p>
            <p style={{ color: C.body, fontSize: 14, lineHeight: 1.6 }}>{cfg.desc}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {sellerStatus === 'approved' && (
              <Link href="/seller/dashboard" style={{ padding: '14px 32px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: 'white', borderRadius: 50, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
                Go to Dashboard
              </Link>
            )}
            <Link href="/" style={{ padding: '14px 32px', border: `2px solid ${C.primary}`, color: C.primary, borderRadius: 50, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success Screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY, padding: 24 }}>
        <style>{GLOBAL_STYLES}</style>
        <div className="scale-in" style={{ maxWidth: 520, width: '100%', background: C.bgCard, borderRadius: 24, padding: '56px 40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          {/* Success checkmark */}
          <div className="check-pop" style={{ width: 88, height: 88, borderRadius: '50%', background: `linear-gradient(135deg, ${C.success}, #22C55E)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: `0 8px 30px ${C.success}40` }}>
            <svg width="40" height="40" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <h2 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 30, fontWeight: 700, color: C.heading, marginBottom: 12 }}>
            Application Submitted!
          </h2>
          <p style={{ color: C.body, fontSize: 16, lineHeight: 1.7, marginBottom: 32, maxWidth: 380, margin: '0 auto 32px' }}>
            Your seller registration has been submitted successfully. Our team will review your application within <strong>24-48 hours</strong>.
          </p>

          {/* Status timeline */}
          <div style={{ textAlign: 'left', maxWidth: 340, margin: '0 auto 36px' }}>
            {[
              { label: 'Application Submitted', done: true },
              { label: 'Under Admin Review', active: true },
              { label: 'Account Activation', done: false },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: i < 2 ? 20 : 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: item.done ? C.success : item.active ? C.accent : '#E5E7EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  ...(item.active ? { animation: 'pulse 2s infinite' } : {}),
                }}>
                  {item.done ? (
                    <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.active ? 'white' : '#9CA3AF' }} />
                  )}
                </div>
                <span style={{ fontSize: 14, fontWeight: item.done || item.active ? 600 : 400, color: item.done ? C.success : item.active ? C.accent : C.muted }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{ padding: '14px 36px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: 'white', borderRadius: 50, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
              Back to Home
            </Link>
            <Link href="/seller" style={{ padding: '14px 36px', border: '2px solid #E5E7EB', color: C.body, borderRadius: 50, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
              View Seller Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Registration Form ──────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bgWarm, fontFamily: FONT_BODY, paddingBottom: 100 }}>
      <style>{GLOBAL_STYLES}</style>

      {/* ── Sticky Header ───────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(91,26,58,0.08)',
        padding: '12px 20px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/seller" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: C.accent, fontWeight: 800, fontSize: 14 }}>IF</span>
            </div>
            <span style={{ fontFamily: FONT_PLAYFAIR, fontWeight: 700, color: C.heading, fontSize: 16 }}>Insta Fashion Points</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>Step</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>{currentStep}/5</span>
          </div>
        </div>
      </header>

      {/* ── Stepper Bar ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
          {STEPS.map((step, i) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            const isFuture = currentStep < step.id;

            return (
              <div key={step.id} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: isCompleted ? C.success : isActive ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` : '#E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? `0 4px 16px ${C.primary}30` : 'none',
                  }}>
                    {isCompleted ? (
                      <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                    ) : (
                      <span style={{ color: isActive ? 'white' : '#9CA3AF', fontWeight: 700, fontSize: 14 }}>{step.id}</span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, marginTop: 6, textAlign: 'center',
                    color: isCompleted ? C.success : isActive ? C.primary : C.muted,
                    display: 'block', whiteSpace: 'nowrap',
                  }}>
                    {step.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: isCompleted ? C.success : '#E5E7EB', margin: '0 4px', marginBottom: 20, transition: 'background 0.3s ease' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step Title ──────────────────────────────────────────────────────── */}
        <div className="fade-up" key={currentStep} style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 26, fontWeight: 700, color: C.heading, marginBottom: 4 }}>
            {STEPS[currentStep - 1].title}
          </h1>
          <p style={{ color: C.muted, fontSize: 14 }}>{STEPS[currentStep - 1].subtitle}</p>
        </div>

        {/* Error banner */}
        {errors.submit && (
          <div style={{ background: C.errorBg, border: `1px solid ${C.error}20`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, color: C.error, fontSize: 14, fontWeight: 500 }}>
            {errors.submit}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 1 — Basic Info
           ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div className="fade-up" style={{ background: C.bgCard, borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 20px rgba(91,26,58,0.04)' }}>
            {/* Full Name */}
            <FieldGroup label="Full Name" required error={errors.fullName}>
              <StyledInput
                value={formData.fullName}
                onChange={v => updateField('fullName', v)}
                placeholder="Enter your full name"
                error={!!errors.fullName}
              />
            </FieldGroup>

            {/* Phone with OTP */}
            <FieldGroup label="Phone Number" labelHi="फोन नंबर" error={errors.phone}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: '#F3F4F6', borderRadius: 10, fontSize: 14, color: C.body, fontWeight: 500 }}>+91</div>
                <StyledInput
                  value={formData.phone}
                  onChange={v => {
                    updateField('phone', v.replace(/\D/g, '').slice(0, 10));
                    if (phoneOtp.verified) setPhoneOtp({ sent: false, code: '', verified: false, loading: false, error: '' });
                  }}
                  placeholder="10-digit phone number"
                  type="tel"
                  maxLength={10}
                  disabled={phoneOtp.verified}
                  error={!!errors.phone}
                  style={{ flex: 1 }}
                />
                {!phoneOtp.verified ? (
                  <ActionButton onClick={sendPhoneOTP} loading={phoneOtp.loading} disabled={formData.phone.length !== 10}>
                    {phoneOtp.sent ? 'Resend' : 'Send OTP'}
                  </ActionButton>
                ) : (
                  <VerifiedBadge />
                )}
              </div>
              {phoneOtp.sent && !phoneOtp.verified && (
                <OtpInput
                  value={phoneOtp.code}
                  onChange={v => setPhoneOtp(p => ({ ...p, code: v, error: '' }))}
                  onVerify={verifyPhoneOTP}
                  loading={phoneOtp.loading}
                  error={phoneOtp.error}
                />
              )}
              {phoneOtp.error && !phoneOtp.sent && <ErrorText>{phoneOtp.error}</ErrorText>}
            </FieldGroup>

            {/* Email with OTP */}
            <FieldGroup label="Email Address" labelHi="ईमेल" required error={errors.email}>
              <div style={{ display: 'flex', gap: 10 }}>
                <StyledInput
                  value={formData.email}
                  onChange={v => {
                    updateField('email', v);
                    if (emailOtp.verified) setEmailOtp({ sent: false, code: '', verified: false, loading: false, error: '' });
                  }}
                  placeholder="your@email.com"
                  type="email"
                  disabled={emailOtp.verified}
                  error={!!errors.email}
                  style={{ flex: 1 }}
                />
                {!emailOtp.verified ? (
                  <ActionButton onClick={sendEmailOTP} loading={emailOtp.loading} disabled={!formData.email}>
                    {emailOtp.sent ? 'Resend' : 'Send OTP'}
                  </ActionButton>
                ) : (
                  <VerifiedBadge />
                )}
              </div>
              {emailOtp.sent && !emailOtp.verified && (
                <OtpInput
                  value={emailOtp.code}
                  onChange={v => setEmailOtp(p => ({ ...p, code: v, error: '' }))}
                  onVerify={verifyEmailOTP}
                  loading={emailOtp.loading}
                  error={emailOtp.error}
                />
              )}
              {emailOtp.error && !emailOtp.sent && <ErrorText>{emailOtp.error}</ErrorText>}
            </FieldGroup>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 2 — Business Details
           ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div className="fade-up" style={{ background: C.bgCard, borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 20px rgba(91,26,58,0.04)' }}>
            {/* Business Name */}
            <FieldGroup label="Business / Shop Name" required error={errors.businessName}>
              <StyledInput value={formData.businessName} onChange={v => updateField('businessName', v)} placeholder="Your business name" error={!!errors.businessName} />
            </FieldGroup>

            <FieldGroup label="Business Name (Hindi)" labelHi="व्यापार नाम (हिंदी)">
              <StyledInput value={formData.businessNameHi} onChange={v => updateField('businessNameHi', v)} placeholder="आपका व्यापार नाम" />
            </FieldGroup>

            {/* Business Type Chips */}
            <FieldGroup label="What do you sell?" required error={errors.businessTypes}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {BUSINESS_TYPES.map(type => {
                  const selected = formData.businessTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        updateField('businessTypes',
                          selected
                            ? formData.businessTypes.filter(t => t !== type)
                            : [...formData.businessTypes, type]
                        );
                      }}
                      style={{
                        padding: '8px 18px', borderRadius: 50, fontSize: 13, fontWeight: 600,
                        border: `2px solid ${selected ? C.primary : '#E5E7EB'}`,
                        background: selected ? C.primary : 'white',
                        color: selected ? 'white' : C.body,
                        cursor: 'pointer', transition: 'all 0.2s ease',
                        fontFamily: FONT_BODY,
                      }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </FieldGroup>

            {/* GST / PAN Toggle */}
            <FieldGroup label="Tax Registration">
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'I have GST', value: true },
                  { label: 'PAN only (no GST)', value: false },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => updateField('hasGST', opt.value)}
                    style={{
                      flex: 1, padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                      border: `2px solid ${formData.hasGST === opt.value ? C.accent : '#E5E7EB'}`,
                      background: formData.hasGST === opt.value ? C.accentSubtle : 'white',
                      color: formData.hasGST === opt.value ? C.primary : C.body,
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      fontFamily: FONT_BODY,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {formData.hasGST ? (
                <StyledInput value={formData.gstin} onChange={v => updateField('gstin', v.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} error={!!errors.gstin} />
              ) : (
                <StyledInput value={formData.pan} onChange={v => updateField('pan', v.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} error={!!errors.pan} />
              )}
              {(errors.gstin || errors.pan) && <ErrorText>{errors.gstin || errors.pan}</ErrorText>}
            </FieldGroup>

            {/* Address */}
            <div style={{ borderTop: `1px solid ${C.borderSubtle}`, paddingTop: 24, marginTop: 24 }}>
              <h3 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 18, fontWeight: 700, color: C.heading, marginBottom: 20 }}>Business Address</h3>

              <FieldGroup label="Address Line 1" required error={errors.addressLine1}>
                <StyledInput value={formData.addressLine1} onChange={v => updateField('addressLine1', v)} placeholder="Building, Street" error={!!errors.addressLine1} />
              </FieldGroup>

              <FieldGroup label="Address Line 2">
                <StyledInput value={formData.addressLine2} onChange={v => updateField('addressLine2', v)} placeholder="Locality, Landmark (Optional)" />
              </FieldGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FieldGroup label="City" required error={errors.city}>
                  <StyledInput value={formData.city} onChange={v => updateField('city', v)} placeholder="City" error={!!errors.city} />
                </FieldGroup>
                <FieldGroup label="State" required error={errors.state}>
                  <select
                    value={formData.state}
                    onChange={e => updateField('state', e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14,
                      border: `1.5px solid ${errors.state ? C.error : '#E5E7EB'}`,
                      background: 'white', color: formData.state ? C.body : C.muted,
                      outline: 'none', fontFamily: FONT_BODY, cursor: 'pointer',
                    }}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FieldGroup>
              </div>

              <FieldGroup label="Pincode" required error={errors.pincode}>
                <StyledInput value={formData.pincode} onChange={v => updateField('pincode', v.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" maxLength={6} error={!!errors.pincode} />
              </FieldGroup>

              {/* Location Picker */}
              <FieldGroup label="Shop / Warehouse Location" labelHi="दुकान / गोदाम लोकेशन">
                {formData.latitude != null && formData.longitude != null ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: C.successBg, border: `1px solid ${C.success}30`, borderRadius: 10 }}>
                    <svg width="20" height="20" fill="none" stroke={C.success} strokeWidth="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><circle cx="12" cy="11" r="3" /></svg>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.success }}>Location set</p>
                      <p style={{ fontSize: 11, color: '#16A34A99' }}>{formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}</p>
                    </div>
                    <button type="button" onClick={() => { updateField('latitude', null); updateField('longitude', null); }} style={{ fontSize: 12, color: C.success, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setShowMapPicker(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', border: `2px solid ${C.primary}`, color: C.primary, borderRadius: 12, fontSize: 13, fontWeight: 600, background: 'white', cursor: 'pointer', fontFamily: FONT_BODY }}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      Pin on Map
                    </button>
                    <button type="button" onClick={() => {
                      if (!navigator.geolocation) return;
                      navigator.geolocation.getCurrentPosition(
                        pos => { updateField('latitude', Math.round(pos.coords.latitude * 1e7) / 1e7); updateField('longitude', Math.round(pos.coords.longitude * 1e7) / 1e7); },
                        () => alert('Could not get location. Please allow location access or pin manually.'),
                        { enableHighAccuracy: true, timeout: 10000 }
                      );
                    }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', border: '2px solid #3B82F6', color: '#3B82F6', borderRadius: 12, fontSize: 13, fontWeight: 600, background: 'white', cursor: 'pointer', fontFamily: FONT_BODY }}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4m10-10h-4M6 12H2" /></svg>
                      Use Current
                    </button>
                  </div>
                )}

                {showMapPicker && (
                  <div style={{ marginTop: 12, border: `1px solid ${C.borderSubtle}`, borderRadius: 12, padding: 16, background: '#FAFAFA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.body }}>Pin your location</span>
                      <button type="button" onClick={() => setShowMapPicker(false)} style={{ fontSize: 12, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Close</button>
                    </div>
                    <LocationPickerMap
                      initialLat={formData.latitude}
                      initialLng={formData.longitude}
                      onLocationSelect={(lat: number, lng: number) => { updateField('latitude', lat); updateField('longitude', lng); }}
                    />
                    {formData.latitude != null && (
                      <button type="button" onClick={() => setShowMapPicker(false)} style={{ width: '100%', marginTop: 10, padding: '10px 0', background: C.primary, color: 'white', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: FONT_BODY }}>Confirm Location</button>
                    )}
                  </div>
                )}
              </FieldGroup>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 3 — Documents & Bank
           ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div className="fade-up" style={{ background: C.bgCard, borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 20px rgba(91,26,58,0.04)' }}>
            {/* Document Uploads */}
            <h3 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 18, fontWeight: 700, color: C.heading, marginBottom: 6 }}>Document Upload</h3>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Upload clear documents for KYC verification. Accepted formats: JPEG, PNG, PDF (max 5MB each)</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              {([
                { key: 'panCard' as const, label: 'PAN Card' },
                { key: 'aadhaarFront' as const, label: 'Aadhaar Front' },
                { key: 'aadhaarBack' as const, label: 'Aadhaar Back' },
                ...(formData.hasGST ? [{ key: 'gstCertificate' as const, label: 'GST Certificate' }] : []),
                { key: 'chequeOrPassbook' as const, label: 'Cancelled Cheque / Passbook' },
              ]).map(doc => (
                <DocUploadCard
                  key={doc.key}
                  label={doc.label}
                  preview={documents[doc.key].preview}
                  onUpload={(file) => handleDocUpload(doc.key, file)}
                  onRemove={() => { setDocuments(prev => ({ ...prev, [doc.key]: { file: null, preview: '' } })); setErrors(prev => { const n = { ...prev }; delete n[doc.key]; return n; }); }}
                  error={errors[doc.key]}
                />
              ))}
            </div>

            {/* Bank Details */}
            <div style={{ borderTop: `1px solid ${C.borderSubtle}`, paddingTop: 24 }}>
              <h3 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 18, fontWeight: 700, color: C.heading, marginBottom: 6 }}>Bank Details</h3>
              <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>For receiving payments from your sales</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FieldGroup label="Account Holder Name" required error={errors.bankAccountName}>
                  <StyledInput value={formData.bankAccountName} onChange={v => updateField('bankAccountName', v)} placeholder="As per bank records" error={!!errors.bankAccountName} />
                </FieldGroup>
                <FieldGroup label="Account Number" required error={errors.bankAccountNumber}>
                  <StyledInput value={formData.bankAccountNumber} onChange={v => updateField('bankAccountNumber', v.replace(/\D/g, ''))} placeholder="Account number" error={!!errors.bankAccountNumber} />
                </FieldGroup>
                <FieldGroup label="IFSC Code" required error={errors.bankIfsc}>
                  <StyledInput value={formData.bankIfsc} onChange={v => updateField('bankIfsc', v.toUpperCase())} placeholder="ABCD0123456" maxLength={11} error={!!errors.bankIfsc} />
                </FieldGroup>
                <FieldGroup label="Bank Name" required error={errors.bankName}>
                  <StyledInput value={formData.bankName} onChange={v => updateField('bankName', v)} placeholder="Bank name" error={!!errors.bankName} />
                </FieldGroup>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 4 — Product Photos (Optional)
           ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 4 && (
          <div className="fade-up" style={{ background: C.bgCard, borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 20px rgba(91,26,58,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <h3 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 18, fontWeight: 700, color: C.heading }}>Sample Product Photos</h3>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, background: C.accentSubtle, padding: '3px 10px', borderRadius: 50 }}>Optional</span>
            </div>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
              Upload up to 6 photos of your best products. This helps our team understand your product quality and speeds up approval.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
              {productPhotos.map((photo, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', border: `1px solid ${C.borderSubtle}` }}>
                  <img src={photo.preview} alt={`Product ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => removeProductPhoto(i)}
                    style={{
                      position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}

              {productPhotos.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    aspectRatio: '1', borderRadius: 12, border: `2px dashed ${C.borderMedium}`,
                    background: C.accentSubtle, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="28" height="28" fill="none" stroke={C.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" /></svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.accent }}>Add Photo</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleProductPhotos(e.target.files)}
            />

            <p style={{ fontSize: 12, color: C.muted, marginTop: 16 }}>
              {productPhotos.length}/6 photos added. You can add more products after approval from your seller dashboard.
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 5 — Review & Confirm
           ══════════════════════════════════════════════════════════════════════ */}
        {currentStep === 5 && (
          <div className="fade-up">
            {/* Review sections */}
            <ReviewSection title="Personal Information" step={1} onEdit={() => setCurrentStep(1)}>
              <ReviewRow label="Name" value={formData.fullName} />
              {formData.phone && <ReviewRow label="Phone" value={`+91 ${formData.phone}`} verified={phoneOtp.verified} />}
              <ReviewRow label="Email" value={formData.email} verified />
            </ReviewSection>

            <ReviewSection title="Business Details" step={2} onEdit={() => setCurrentStep(2)}>
              <ReviewRow label="Business Name" value={formData.businessName} />
              {formData.businessNameHi && <ReviewRow label="Business Name (Hindi)" value={formData.businessNameHi} />}
              <ReviewRow label="Categories" value={formData.businessTypes.join(', ')} />
              <ReviewRow label={formData.hasGST ? 'GSTIN' : 'PAN'} value={formData.hasGST ? formData.gstin : formData.pan} />
              <ReviewRow label="Address" value={`${formData.addressLine1}${formData.addressLine2 ? ', ' + formData.addressLine2 : ''}, ${formData.city}, ${formData.state} - ${formData.pincode}`} />
              {formData.latitude && <ReviewRow label="Location" value={`${formData.latitude.toFixed(5)}, ${formData.longitude?.toFixed(5)}`} />}
            </ReviewSection>

            <ReviewSection title="Bank Details" step={3} onEdit={() => setCurrentStep(3)}>
              <ReviewRow label="Account Holder" value={formData.bankAccountName} />
              <ReviewRow label="Account Number" value={formData.bankAccountNumber.replace(/.(?=.{4})/g, '*')} />
              <ReviewRow label="IFSC" value={formData.bankIfsc} />
              <ReviewRow label="Bank" value={formData.bankName} />
            </ReviewSection>

            {productPhotos.length > 0 && (
              <ReviewSection title="Product Photos" step={4} onEdit={() => setCurrentStep(4)}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {productPhotos.map((p, i) => (
                    <img key={i} src={p.preview} alt={`Product ${i + 1}`} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: `1px solid ${C.borderSubtle}` }} />
                  ))}
                </div>
              </ReviewSection>
            )}

            {/* Terms & Conditions */}
            <div style={{ background: C.bgCard, borderRadius: 16, padding: '24px 28px', boxShadow: '0 4px 20px rgba(91,26,58,0.04)', marginTop: 16 }}>
              <label style={{ display: 'flex', gap: 14, cursor: 'pointer', alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={e => updateField('termsAccepted', e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: C.primary, flexShrink: 0, marginTop: 2, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: C.body, lineHeight: 1.7 }}>
                  I confirm that all the information provided above is accurate. I agree to the{' '}
                  <Link href="/terms-and-conditions" target="_blank" style={{ color: C.primary, fontWeight: 600, textDecoration: 'underline' }}>Terms & Conditions</Link>
                  {' '}and{' '}
                  <Link href="/return-policy" target="_blank" style={{ color: C.primary, fontWeight: 600, textDecoration: 'underline' }}>Seller Policies</Link>
                  {' '}of Insta Fashion Points.
                </span>
              </label>
              {errors.termsAccepted && <ErrorText>{errors.termsAccepted}</ErrorText>}
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed Bottom Navigation ──────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(91,26,58,0.08)',
        padding: '14px 20px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              style={{
                padding: '13px 28px', borderRadius: 50, fontSize: 14, fontWeight: 600,
                border: `2px solid ${C.primary}`, color: C.primary, background: 'white',
                cursor: 'pointer', fontFamily: FONT_BODY, transition: 'all 0.2s ease',
              }}
            >
              Back
            </button>
          ) : (
            <Link href="/seller" style={{
              padding: '13px 28px', borderRadius: 50, fontSize: 14, fontWeight: 600,
              border: `2px solid ${C.primary}`, color: C.primary, background: 'white',
              textDecoration: 'none', fontFamily: FONT_BODY,
            }}>
              Cancel
            </Link>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                padding: '13px 36px', borderRadius: 50, fontSize: 14, fontWeight: 700,
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                color: 'white', border: 'none', cursor: 'pointer',
                fontFamily: FONT_BODY, transition: 'all 0.2s ease',
                boxShadow: `0 4px 16px ${C.primary}30`,
              }}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '13px 36px', borderRadius: 50, fontSize: 14, fontWeight: 700,
                background: loading ? '#9CA3AF' : `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                color: loading ? 'white' : C.primaryDark, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: FONT_BODY, transition: 'all 0.2s ease',
                boxShadow: loading ? 'none' : `0 4px 16px ${C.accent}40`,
              }}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Reusable Sub-Components
   ═══════════════════════════════════════════════════════════════════════════ */

function FieldGroup({ label, labelHi, required, error, children }: {
  label: string; labelHi?: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.heading, marginBottom: 8 }}>
        {label}
        {labelHi && <span style={{ color: C.muted, fontWeight: 400, marginLeft: 6 }}>({labelHi})</span>}
        {required && <span style={{ color: C.error, marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, type = 'text', maxLength, disabled, error, style }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
  maxLength?: number; disabled?: boolean; error?: boolean; style?: React.CSSProperties;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      style={{
        width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14,
        border: `1.5px solid ${error ? C.error : '#E5E7EB'}`,
        background: disabled ? '#F9FAFB' : 'white', color: C.body,
        outline: 'none', fontFamily: FONT_BODY,
        transition: 'border-color 0.2s ease',
        ...style,
      }}
    />
  );
}

function ActionButton({ onClick, loading, disabled, children }: {
  onClick: () => void; loading?: boolean; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        background: disabled ? '#E5E7EB' : C.primary, color: disabled ? '#9CA3AF' : 'white',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap', fontFamily: FONT_BODY,
        transition: 'all 0.2s ease',
      }}
    >
      {loading ? '...' : children}
    </button>
  );
}

function VerifiedBadge() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', background: C.successBg, borderRadius: 10, border: `1px solid ${C.success}30` }}>
      <svg width="16" height="16" fill="none" stroke={C.success} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.success }}>Verified</span>
    </div>
  );
}

function OtpInput({ value, onChange, onVerify, loading, error }: {
  value: string; onChange: (v: string) => void; onVerify: () => void; loading?: boolean; error?: string;
}) {
  return (
    <div style={{ marginTop: 12, padding: 16, background: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE' }}>
      <p style={{ fontSize: 12, color: '#1E40AF', marginBottom: 10, fontWeight: 500 }}>Enter the 6-digit OTP</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          placeholder="000000"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 8, fontSize: 18,
            border: '1.5px solid #93C5FD', textAlign: 'center',
            letterSpacing: '0.3em', fontWeight: 600, outline: 'none',
            fontFamily: FONT_BODY,
          }}
        />
        <button
          type="button"
          onClick={onVerify}
          disabled={loading || value.length !== 6}
          style={{
            padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: value.length === 6 ? C.primary : '#E5E7EB',
            color: value.length === 6 ? 'white' : '#9CA3AF',
            border: 'none', cursor: value.length === 6 ? 'pointer' : 'not-allowed',
            fontFamily: FONT_BODY,
          }}
        >
          {loading ? '...' : 'Verify'}
        </button>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12, color: C.error, marginTop: 6, fontWeight: 500 }}>{children}</p>;
}

function DocUploadCard({ label, preview, onUpload, onRemove, error }: {
  label: string; preview: string; onUpload: (file: File) => void; onRemove: () => void; error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPdf = preview === 'pdf';

  return (
    <div>
      <div style={{
        borderRadius: 12, border: `1.5px dashed ${error ? C.error + '60' : preview ? C.success + '40' : C.borderMedium}`,
        background: error ? C.errorBg : preview ? C.successBg : C.accentSubtle,
        overflow: 'hidden', position: 'relative',
      }}>
        {preview ? (
          <div style={{ position: 'relative' }}>
            {isPdf ? (
              <div style={{ width: '100%', height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FEF3C7' }}>
                <svg width="32" height="32" fill="none" stroke="#D97706" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9l-5-5H7a2 2 0 00-2 2v13a2 2 0 002 2z" /><path d="M14 4v5h5" /></svg>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#D97706', marginTop: 4 }}>PDF</span>
              </div>
            ) : (
              <img src={preview} alt={label} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
            )}
            <button
              type="button"
              onClick={onRemove}
              style={{
                position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <div style={{ padding: '8px 12px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.success }}>{label}</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              width: '100%', padding: '24px 12px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8, cursor: 'pointer', background: 'none', border: 'none',
            }}
          >
            <svg width="24" height="24" fill="none" stroke={C.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, textAlign: 'center' }}>{label} <span style={{ color: C.error }}>*</span></span>
            <span style={{ fontSize: 9, color: C.muted, textAlign: 'center' }}>JPEG, PNG, PDF (max 5MB)</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }}
        />
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function ReviewSection({ title, step, onEdit, children }: {
  title: string; step: number; onEdit: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ background: C.bgCard, borderRadius: 16, padding: '24px 28px', boxShadow: '0 4px 20px rgba(91,26,58,0.04)', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 16, fontWeight: 700, color: C.heading }}>{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          style={{
            fontSize: 12, fontWeight: 600, color: C.primary,
            background: 'none', border: `1.5px solid ${C.primary}`,
            borderRadius: 50, padding: '5px 16px', cursor: 'pointer',
            fontFamily: FONT_BODY,
          }}
        >
          Edit
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  );
}

function ReviewRow({ label, value, verified }: { label: string; value: string; verified?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, color: C.muted, minWidth: 110, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, color: C.body, fontWeight: 500, flex: 1 }}>{value}</span>
      {verified && (
        <span style={{ fontSize: 10, fontWeight: 700, color: C.success, background: C.successBg, padding: '2px 8px', borderRadius: 50 }}>Verified</span>
      )}
    </div>
  );
}
