'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const gold = '#C9A84C';
const burgundy = '#7B1C2E';
const black = '#0A0A0A';

/* ── Ornamental SVG above the heading ── */
function OrnamentSVG() {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-3">
      <path d="M40 2 L44 10 L52 10 L46 16 L48 24 L40 20 L32 24 L34 16 L28 10 L36 10 Z" fill={gold} opacity="0.85" />
      <path d="M1 14 Q10 8 20 14 Q30 20 40 14 Q50 8 60 14 Q70 20 79 14" stroke={gold} strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx="1"  cy="14" r="1.5" fill={gold} opacity="0.7" />
      <circle cx="79" cy="14" r="1.5" fill={gold} opacity="0.7" />
    </svg>
  );
}

/* ── Underline input style ── */
const inputClass =
  'w-full bg-transparent border-0 border-b border-[#C9A84C]/40 focus:border-[#C9A84C] outline-none py-2.5 text-[#0A0A0A] text-sm transition-colors duration-200 placeholder:text-[#999]';
const labelClass =
  'block text-[10px] font-semibold tracking-[0.18em] uppercase text-[#7B1C2E] mb-1';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', location: '',
    address: '', pincode: '', password: '', confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  /* Email verification (optional) */
  const [emailVerification, setEmailVerification] = useState({
    otpSent: false, otp: '', verified: false, loading: false, error: '',
  });

  /* Mobile verification (mandatory) */
  const [mobileVerification, setMobileVerification] = useState({
    otpSent: false, otp: '', verified: false, loading: false, error: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'mobile' || name === 'pincode') {
      setFormData({ ...formData, [name]: value.replace(/\D/g, '').slice(0, name === 'mobile' ? 10 : 6) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (name === 'email'  && emailVerification.verified)
      setEmailVerification({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
    if (name === 'mobile' && mobileVerification.verified)
      setMobileVerification({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
  };

  /* ── Email OTP ── */
  const sendEmailOTP = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setEmailVerification(p => ({ ...p, error: 'Please enter a valid email address' })); return;
    }
    setEmailVerification(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/send-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'email', value: formData.email }) });
      const data = await res.json();
      res.ok
        ? setEmailVerification(p => ({ ...p, otpSent: true, loading: false }))
        : setEmailVerification(p => ({ ...p, error: data.error || 'Failed to send OTP', loading: false }));
    } catch { setEmailVerification(p => ({ ...p, error: 'Error sending OTP', loading: false })); }
  };

  const verifyEmailOTP = async () => {
    if (emailVerification.otp.length !== 6) { setEmailVerification(p => ({ ...p, error: 'Enter 6-digit OTP' })); return; }
    setEmailVerification(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/verify-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'email', value: formData.email, otp: emailVerification.otp }) });
      const data = await res.json();
      res.ok && data.verified
        ? setEmailVerification(p => ({ ...p, verified: true, loading: false }))
        : setEmailVerification(p => ({ ...p, error: data.error || 'Invalid OTP', loading: false }));
    } catch { setEmailVerification(p => ({ ...p, error: 'Error verifying OTP', loading: false })); }
  };

  /* ── Mobile OTP ── */
  const sendMobileOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      setMobileVerification(p => ({ ...p, error: 'Enter valid 10-digit mobile number' })); return;
    }
    setMobileVerification(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/send-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'mobile', value: formData.mobile }) });
      const data = await res.json();
      res.ok
        ? setMobileVerification(p => ({ ...p, otpSent: true, loading: false }))
        : setMobileVerification(p => ({ ...p, error: data.error || 'Failed to send OTP', loading: false }));
    } catch { setMobileVerification(p => ({ ...p, error: 'Error sending OTP', loading: false })); }
  };

  const verifyMobileOTP = async () => {
    if (mobileVerification.otp.length !== 6) { setMobileVerification(p => ({ ...p, error: 'Enter 6-digit OTP' })); return; }
    setMobileVerification(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/verify-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'mobile', value: formData.mobile, otp: mobileVerification.otp }) });
      const data = await res.json();
      res.ok && data.verified
        ? setMobileVerification(p => ({ ...p, verified: true, loading: false }))
        : setMobileVerification(p => ({ ...p, error: data.error || 'Invalid OTP', loading: false }));
    } catch { setMobileVerification(p => ({ ...p, error: 'Error verifying OTP', loading: false })); }
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) { setError('Enter a valid 10-digit mobile number'); return; }
    if (!mobileVerification.verified)           { setError('Please verify your mobile number before signing up'); return; }
    if (!/^\d{6}$/.test(formData.pincode))      { setError('Pincode must be a 6-digit number'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6)           { setError('Password must be at least 6 characters'); return; }

    setIsLoading(true);
    try {
      const res  = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, email: formData.email, mobile: formData.mobile, location: formData.location, address: formData.address, pincode: formData.pincode, password: formData.password }) });
      const data = await res.json();
      if (res.ok) { setSuccess('Account created! Redirecting…'); setTimeout(() => router.push('/login'), 2000); }
      else         setError(data.error || 'Something went wrong');
    } catch { setError('Network error. Please try again.'); }
    finally  { setIsLoading(false); }
  };

  /* ── Verified badge ── */
  const VerifiedBadge = () => (
    <span className="flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase text-emerald-600">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      Verified
    </span>
  );

  /* ── OTP row ── */
  const OTPBox = ({ value, onChange, onVerify, loading }: { value: string; onChange: (v: string) => void; onVerify: () => void; loading: boolean }) => (
    <div className="mt-3 flex gap-2 items-center">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        maxLength={6}
        placeholder="6-digit OTP"
        className="flex-1 bg-transparent border-b border-[#C9A84C]/40 focus:border-[#C9A84C] outline-none py-2 text-sm text-center tracking-[0.3em] text-[#0A0A0A] placeholder:text-[#bbb] transition-colors"
      />
      <button
        type="button"
        onClick={onVerify}
        disabled={loading || value.length !== 6}
        style={{ fontFamily: "'Jost', sans-serif" }}
        className="px-4 py-2 text-[10px] font-semibold tracking-widest uppercase border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-all duration-200 disabled:opacity-40"
      >
        {loading ? '…' : 'Verify'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Jost', sans-serif" }}>

      {/* ════════════════════════════════════
          LEFT PANEL — Dark luxury editorial
          ════════════════════════════════════ */}
      <div
        className="hidden lg:flex w-[45%] flex-shrink-0 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0A0A0A 0%, #1a0610 50%, #0A0A0A 100%)' }}
      >
        {/* Corner ornaments */}
        {[
          'top-6 left-6',
          'top-6 right-6 rotate-90',
          'bottom-6 left-6 -rotate-90',
          'bottom-6 right-6 rotate-180',
        ].map((pos, i) => (
          <svg key={i} className={`absolute ${pos} w-8 h-8 opacity-40`} viewBox="0 0 32 32" fill="none">
            <path d="M2 2 L12 2 L2 12" stroke={gold} strokeWidth="1.2" />
            <path d="M2 2 L2 8" stroke={gold} strokeWidth="0.6" />
            <path d="M2 2 L8 2" stroke={gold} strokeWidth="0.6" />
          </svg>
        ))}

        {/* Vertical gold line accents */}
        <div className="absolute left-12 top-16 bottom-16 w-px" style={{ background: `linear-gradient(to bottom, transparent, ${gold}55, transparent)` }} />
        <div className="absolute right-12 top-16 bottom-16 w-px" style={{ background: `linear-gradient(to bottom, transparent, ${gold}55, transparent)` }} />

        {/* Centre content */}
        <div className="relative z-10 flex flex-col items-center px-12 text-center">

          {/* Gold decorative ring + logo */}
          <div className="relative mb-8">
            {/* Outer ring */}
            <div className="absolute inset-0 -m-5 rounded-full border border-[#C9A84C]/25" />
            <div className="absolute inset-0 -m-9 rounded-full border border-[#C9A84C]/12" />

            {/* Gold square frame */}
            <div
              className="w-36 h-36 flex items-center justify-center"
              style={{
                border: `1px solid ${gold}60`,
                boxShadow: `0 0 0 4px #0A0A0A, 0 0 0 5px ${gold}35`,
                background: 'rgba(201,168,76,0.04)',
              }}
            >
              {/* Top-left corner accent */}
              <svg className="absolute top-0 left-0 w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M1 1 L8 1 L1 8" stroke={gold} strokeWidth="1" />
              </svg>
              {/* Bottom-right corner accent */}
              <svg className="absolute bottom-0 right-0 w-5 h-5 rotate-180" viewBox="0 0 20 20" fill="none">
                <path d="M1 1 L8 1 L1 8" stroke={gold} strokeWidth="1" />
              </svg>

              <Image src="/images/logo.png" alt="Sweta Fashion Points" width={100} height={100} className="object-contain" />
            </div>
          </div>

          {/* Brand name */}
          <h2
            className="text-3xl font-light tracking-[0.12em] text-white mb-2 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Sweta
          </h2>
          <h2
            className="text-3xl font-light tracking-[0.12em] mb-1 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: gold }}
          >
            Fashion Points
          </h2>

          {/* Gold divider */}
          <div className="flex items-center gap-3 my-5 w-40">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${gold}80)` }} />
            <svg width="8" height="8" viewBox="0 0 8 8"><rect x="1" y="1" width="6" height="6" fill="none" stroke={gold} strokeWidth="0.8" transform="rotate(45 4 4)" /></svg>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${gold}80)` }} />
          </div>

          <p className="text-[11px] tracking-[0.25em] uppercase text-white/35 font-light">
            Amas · Gaya · Bihar
          </p>
          <p className="text-[10px] tracking-[0.15em] uppercase mt-1" style={{ color: `${gold}70` }}>
            Est. 2024
          </p>
        </div>

        {/* Bottom tagline */}
        <p
          className="absolute bottom-8 text-[11px] italic tracking-widest text-white/20"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          "Where tradition meets elegance"
        </p>
      </div>

      {/* ════════════════════════════════════
          RIGHT PANEL — Signup Form
          ════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto" style={{ background: '#FAF8F5' }}>

        {/* Mobile-only header */}
        <div
          className="lg:hidden flex items-center justify-center py-6 px-6"
          style={{ background: black }}
        >
          <div className="flex items-center gap-3">
            <div style={{ border: `1px solid ${gold}50`, padding: 6 }}>
              <Image src="/images/logo.png" alt="Sweta Fashion Points" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <p className="text-white text-sm font-light tracking-[0.12em]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Sweta Fashion Points
              </p>
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: gold, opacity: 0.7 }}>
                Amas · Gaya · Bihar
              </p>
            </div>
          </div>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-start justify-center px-8 py-10 lg:py-14">
          <div className="w-full max-w-md">

            {/* Ornament + heading */}
            <div className="mb-8 text-center">
              <OrnamentSVG />

              {/* Gold thin divider above heading */}
              <div className="flex items-center gap-3 mb-5 justify-center">
                <div className="h-px w-16" style={{ background: `linear-gradient(to right, transparent, ${gold}90)` }} />
                <svg width="6" height="6" viewBox="0 0 6 6"><rect x="0.5" y="0.5" width="5" height="5" fill="none" stroke={gold} strokeWidth="0.6" transform="rotate(45 3 3)" /></svg>
                <div className="h-px w-16" style={{ background: `linear-gradient(to left, transparent, ${gold}90)` }} />
              </div>

              <h1
                className="text-4xl font-light text-[#0A0A0A] tracking-[0.04em] leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Create Account
              </h1>
              <p className="text-[11px] tracking-[0.2em] uppercase mt-2" style={{ color: `${gold}` }}>
                Join Sweta Fashion Points
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Full Name */}
              <div>
                <label className={labelClass}>Full Name <span style={{ color: burgundy }}>*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your full name" className={inputClass} style={{ fontFamily: "'Jost', sans-serif" }} />
              </div>

              {/* Mobile + OTP */}
              <div>
                <label className={labelClass}>Mobile Number <span style={{ color: burgundy }}>*</span></label>
                <div className="flex items-end gap-3">
                  <div className="flex items-end flex-1" style={{ borderBottom: `1px solid ${mobileVerification.verified ? '#10b981' : '#C9A84C66'}` }}>
                    <span className="text-xs text-[#999] pb-2.5 pr-2 tracking-wider">+91</span>
                    <input
                      type="tel" name="mobile" value={formData.mobile} onChange={handleChange}
                      required maxLength={10} disabled={mobileVerification.verified}
                      placeholder="10-digit number"
                      className="flex-1 bg-transparent border-0 outline-none py-2.5 text-sm text-[#0A0A0A] placeholder:text-[#bbb]"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    />
                  </div>
                  {mobileVerification.verified
                    ? <VerifiedBadge />
                    : (
                      <button type="button" onClick={sendMobileOTP}
                        disabled={mobileVerification.loading || formData.mobile.length !== 10}
                        className="pb-2.5 text-[10px] font-semibold tracking-[0.15em] uppercase transition-colors duration-200 disabled:opacity-40"
                        style={{ color: gold, fontFamily: "'Jost', sans-serif", whiteSpace: 'nowrap' }}
                      >
                        {mobileVerification.loading ? '…' : mobileVerification.otpSent ? 'Resend' : 'Send OTP'}
                      </button>
                    )
                  }
                </div>
                {mobileVerification.otpSent && !mobileVerification.verified && (
                  <OTPBox value={mobileVerification.otp} onChange={v => setMobileVerification(p => ({ ...p, otp: v, error: '' }))} onVerify={verifyMobileOTP} loading={mobileVerification.loading} />
                )}
                {mobileVerification.error && <p className="text-[11px] mt-1.5" style={{ color: burgundy }}>{mobileVerification.error}</p>}
              </div>

              {/* Email (optional) */}
              <div>
                <label className={labelClass}>Email Address <span className="text-[#aaa] normal-case font-normal tracking-normal">(optional)</span></label>
                <div className="flex items-end gap-3">
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    disabled={emailVerification.verified}
                    placeholder="your@email.com"
                    className={`flex-1 ${inputClass}`}
                    style={{ fontFamily: "'Jost', sans-serif" }}
                  />
                  {emailVerification.verified
                    ? <VerifiedBadge />
                    : formData.email
                      ? (
                        <button type="button" onClick={sendEmailOTP}
                          disabled={emailVerification.loading}
                          className="pb-2.5 text-[10px] font-semibold tracking-[0.15em] uppercase transition-colors duration-200 disabled:opacity-40"
                          style={{ color: gold, fontFamily: "'Jost', sans-serif", whiteSpace: 'nowrap' }}
                        >
                          {emailVerification.loading ? '…' : emailVerification.otpSent ? 'Resend' : 'Verify'}
                        </button>
                      ) : null
                  }
                </div>
                {emailVerification.otpSent && !emailVerification.verified && (
                  <OTPBox value={emailVerification.otp} onChange={v => setEmailVerification(p => ({ ...p, otp: v, error: '' }))} onVerify={verifyEmailOTP} loading={emailVerification.loading} />
                )}
                {emailVerification.error && <p className="text-[11px] mt-1.5" style={{ color: burgundy }}>{emailVerification.error}</p>}
              </div>

              {/* Address */}
              <div>
                <label className={labelClass}>Address <span className="text-[#aaa] normal-case font-normal tracking-normal">(optional)</span></label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="House / Flat No., Street, Area" className={inputClass} style={{ fontFamily: "'Jost', sans-serif" }} />
              </div>

              {/* City/Town */}
              <div>
                <label className={labelClass}>City / Town <span className="text-[#aaa] normal-case font-normal tracking-normal">(optional)</span></label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Enter your city or town" className={inputClass} style={{ fontFamily: "'Jost', sans-serif" }} />
              </div>

              {/* Pincode */}
              <div>
                <label className={labelClass}>Pincode <span style={{ color: burgundy }}>*</span></label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required maxLength={6} placeholder="6-digit pincode" className={inputClass} style={{ fontFamily: "'Jost', sans-serif" }} />
              </div>

              {/* Password */}
              <div>
                <label className={labelClass}>Password <span style={{ color: burgundy }}>*</span></label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} placeholder="Minimum 6 characters" className={inputClass} style={{ fontFamily: "'Jost', sans-serif" }} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className={labelClass}>Confirm Password <span style={{ color: burgundy }}>*</span></label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Re-enter password" className={inputClass} style={{ fontFamily: "'Jost', sans-serif" }} />
              </div>

              {/* Mobile verification warning */}
              {!mobileVerification.verified && (
                <p className="text-[11px] tracking-wide" style={{ color: `${gold}cc` }}>
                  ⚠ Verify your mobile number to enable sign-up
                </p>
              )}

              {/* Error / Success */}
              {error && (
                <div className="border-l-2 pl-3 py-2 text-sm" style={{ borderColor: burgundy, color: burgundy, background: '#7b1c2e08' }}>
                  {error}
                </div>
              )}
              {success && (
                <div className="border-l-2 pl-3 py-2 text-sm border-emerald-500 text-emerald-700 bg-emerald-50">
                  {success}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !mobileVerification.verified}
                style={{
                  fontFamily: "'Jost', sans-serif",
                  background: isLoading || !mobileVerification.verified ? '#7b1c2e88' : burgundy,
                  color: gold,
                  letterSpacing: '0.22em',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => { if (!isLoading && mobileVerification.verified) (e.currentTarget as HTMLButtonElement).style.background = '#9b2438'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isLoading || !mobileVerification.verified ? '#7b1c2e88' : burgundy; }}
                className="w-full py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ borderRadius: 4, ...({ fontFamily: "'Jost', sans-serif", background: isLoading || !mobileVerification.verified ? '#7b1c2e88' : burgundy, color: gold, letterSpacing: '0.22em', transition: 'all 0.25s ease' }) }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating Account…
                  </>
                ) : 'Create Account'}
              </button>
            </form>

            {/* Footer link */}
            <p className="mt-8 text-center text-[11px] tracking-[0.15em]" style={{ color: `${gold}90` }}>
              Already have an account?{' '}
              <Link href="/login" className="underline underline-offset-2 hover:opacity-100 transition-opacity" style={{ color: gold }}>
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
