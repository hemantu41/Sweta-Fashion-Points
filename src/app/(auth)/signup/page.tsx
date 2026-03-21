'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const gold     = '#C9A84C';
const burgundy = '#7B1C2E';

const labelClass =
  'block text-[10px] font-semibold tracking-[0.18em] uppercase text-[#7B1C2E] mb-1';
const inputClass =
  'w-full bg-transparent border-0 border-b border-[#C9A84C]/35 focus:border-[#C9A84C] outline-none py-2.5 text-[#1A1A1A] text-sm transition-colors duration-200 placeholder:text-[#bbb]';

/* ── Ornament above heading ── */
function Ornament() {
  return (
    <svg width="64" height="22" viewBox="0 0 64 22" fill="none" className="mx-auto mb-3">
      <path d="M32 1 L35 8 L42 8 L37 13 L39 20 L32 16 L25 20 L27 13 L22 8 L29 8 Z" fill={gold} opacity="0.8" />
      <path d="M1 11 Q8 6 16 11 Q24 16 32 11 Q40 6 48 11 Q56 16 63 11"
        stroke={gold} strokeWidth="0.7" fill="none" opacity="0.5" />
      <circle cx="1"  cy="11" r="1.2" fill={gold} opacity="0.6" />
      <circle cx="63" cy="11" r="1.2" fill={gold} opacity="0.6" />
    </svg>
  );
}

/* ── Gold divider ── */
function Divider() {
  return (
    <div className="flex items-center gap-2.5 justify-center my-4">
      <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${gold}80)` }} />
      <svg width="5" height="5" viewBox="0 0 5 5">
        <rect x="0.5" y="0.5" width="4" height="4" fill="none" stroke={gold} strokeWidth="0.6" transform="rotate(45 2.5 2.5)" />
      </svg>
      <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${gold}80)` }} />
    </div>
  );
}

/* ── Spinner ── */
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ── Verified badge ── */
function VerifiedBadge() {
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase text-emerald-600 whitespace-nowrap">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      Verified
    </span>
  );
}

/* ── OTP input row ── */
function OTPBox({ value, onChange, onVerify, loading }: {
  value: string; onChange: (v: string) => void; onVerify: () => void; loading: boolean;
}) {
  return (
    <div className="mt-3 flex gap-2 items-center">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        maxLength={6}
        placeholder="6-digit OTP"
        className="flex-1 bg-transparent border-b border-[#C9A84C]/40 focus:border-[#C9A84C] outline-none py-2 text-sm text-center tracking-[0.3em] text-[#1A1A1A] placeholder:text-[#ccc] transition-colors"
        style={{ fontFamily: "'Jost', sans-serif" }}
      />
      <button
        type="button"
        onClick={onVerify}
        disabled={loading || value.length !== 6}
        style={{ fontFamily: "'Jost', sans-serif", color: burgundy, borderColor: `${burgundy}60` }}
        className="px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase border hover:bg-[#7B1C2E] hover:text-white transition-all duration-200 disabled:opacity-40"
      >
        {loading ? '…' : 'Verify'}
      </button>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', location: '',
    address: '', pincode: '', password: '', confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  const [emailVerification, setEmailVerification] = useState({
    otpSent: false, otp: '', verified: false, loading: false, error: '',
  });
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
    if (!/^[6-9]\d{9}$/.test(formData.mobile))              { setError('Enter a valid 10-digit mobile number'); return; }
    if (!mobileVerification.verified)                        { setError('Please verify your mobile number before signing up'); return; }
    if (!/^\d{6}$/.test(formData.pincode))                   { setError('Pincode must be a 6-digit number'); return; }
    if (formData.password !== formData.confirmPassword)      { setError('Passwords do not match'); return; }
    if (formData.password.length < 6)                       { setError('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, email: formData.email, mobile: formData.mobile, location: formData.location, address: formData.address, pincode: formData.pincode, password: formData.password }) });
      const data = await res.json();
      if (res.ok) { setSuccess('Account created! Redirecting…'); setTimeout(() => router.push('/login'), 2000); }
      else         setError(data.error || 'Something went wrong');
    } catch { setError('Network error. Please try again.'); }
    finally  { setIsLoading(false); }
  };

  const btnDisabled = isLoading || !mobileVerification.verified;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-10 px-4"
      style={{ background: '#FAF8F5', fontFamily: "'Jost', sans-serif" }}
    >
      {/* ── Brand name ── */}
      <div className="flex flex-col items-center mb-6">
        <p
          className="text-3xl font-semibold tracking-[0.06em] text-[#1A1A1A]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Sweta Fashion Points
        </p>
      </div>

      {/* ── Card ── */}
      <div
        className="w-full max-w-md bg-white rounded-sm px-8 py-10"
        style={{ boxShadow: '0 1px 24px rgba(0,0,0,0.06)' }}
      >
        {/* Heading block */}
        <div className="text-center mb-8">
          <Ornament />
          <Divider />
          <h1
            className="text-[2.1rem] font-light text-[#1A1A1A] tracking-[0.03em] leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Create Account
          </h1>
          <p className="text-[10px] tracking-[0.22em] uppercase mt-1.5" style={{ color: gold }}>
            Join Sweta Fashion Points
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Full Name */}
          <div>
            <label className={labelClass}>Full Name <span style={{ color: burgundy }}>*</span></label>
            <input type="text" name="name" value={formData.name} onChange={handleChange}
              required placeholder="Your full name" className={inputClass}
              style={{ fontFamily: "'Jost', sans-serif" }} />
          </div>

          {/* Mobile + OTP */}
          <div>
            <label className={labelClass}>Mobile Number <span style={{ color: burgundy }}>*</span></label>
            <div className="flex items-end gap-3">
              <div
                className="flex items-end flex-1"
                style={{ borderBottom: `1px solid ${mobileVerification.verified ? '#10b981' : '#C9A84C55'}` }}
              >
                <span className="text-xs text-[#aaa] pb-2.5 pr-2 tracking-wider select-none">+91</span>
                <input
                  type="tel" name="mobile" value={formData.mobile} onChange={handleChange}
                  required maxLength={10} disabled={mobileVerification.verified}
                  placeholder="10-digit number"
                  className="flex-1 bg-transparent border-0 outline-none py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#ccc] disabled:opacity-70"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                />
              </div>
              {mobileVerification.verified
                ? <VerifiedBadge />
                : (
                  <button type="button" onClick={sendMobileOTP}
                    disabled={mobileVerification.loading || formData.mobile.length !== 10}
                    className="pb-2.5 text-[10px] font-semibold tracking-[0.15em] uppercase transition-opacity disabled:opacity-40 whitespace-nowrap"
                    style={{ color: burgundy, fontFamily: "'Jost', sans-serif" }}
                  >
                    {mobileVerification.loading ? '…' : mobileVerification.otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                )
              }
            </div>
            {mobileVerification.otpSent && !mobileVerification.verified && (
              <OTPBox
                value={mobileVerification.otp}
                onChange={v => setMobileVerification(p => ({ ...p, otp: v, error: '' }))}
                onVerify={verifyMobileOTP}
                loading={mobileVerification.loading}
              />
            )}
            {mobileVerification.error && (
              <p className="text-[11px] mt-1.5" style={{ color: burgundy }}>{mobileVerification.error}</p>
            )}
          </div>

          {/* Email (optional) */}
          <div>
            <label className={labelClass}>
              Email Address{' '}
              <span className="text-[#bbb] normal-case font-normal tracking-normal">(optional)</span>
            </label>
            <div className="flex items-end gap-3">
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                disabled={emailVerification.verified}
                placeholder="your@email.com"
                className={`flex-1 ${inputClass} disabled:opacity-70`}
                style={{ fontFamily: "'Jost', sans-serif" }}
              />
              {emailVerification.verified
                ? <VerifiedBadge />
                : formData.email
                  ? (
                    <button type="button" onClick={sendEmailOTP}
                      disabled={emailVerification.loading}
                      className="pb-2.5 text-[10px] font-semibold tracking-[0.15em] uppercase transition-opacity disabled:opacity-40 whitespace-nowrap"
                      style={{ color: burgundy, fontFamily: "'Jost', sans-serif" }}
                    >
                      {emailVerification.loading ? '…' : emailVerification.otpSent ? 'Resend' : 'Verify'}
                    </button>
                  ) : null
              }
            </div>
            {emailVerification.otpSent && !emailVerification.verified && (
              <OTPBox
                value={emailVerification.otp}
                onChange={v => setEmailVerification(p => ({ ...p, otp: v, error: '' }))}
                onVerify={verifyEmailOTP}
                loading={emailVerification.loading}
              />
            )}
            {emailVerification.error && (
              <p className="text-[11px] mt-1.5" style={{ color: burgundy }}>{emailVerification.error}</p>
            )}
          </div>

          {/* Address (optional) */}
          <div>
            <label className={labelClass}>
              Address{' '}
              <span className="text-[#bbb] normal-case font-normal tracking-normal">(optional)</span>
            </label>
            <input type="text" name="address" value={formData.address} onChange={handleChange}
              placeholder="House / Flat No., Street, Area" className={inputClass}
              style={{ fontFamily: "'Jost', sans-serif" }} />
          </div>

          {/* City/Town (optional) */}
          <div>
            <label className={labelClass}>
              City / Town{' '}
              <span className="text-[#bbb] normal-case font-normal tracking-normal">(optional)</span>
            </label>
            <input type="text" name="location" value={formData.location} onChange={handleChange}
              placeholder="Enter your city or town" className={inputClass}
              style={{ fontFamily: "'Jost', sans-serif" }} />
          </div>

          {/* Pincode */}
          <div>
            <label className={labelClass}>Pincode <span style={{ color: burgundy }}>*</span></label>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleChange}
              required maxLength={6} placeholder="6-digit pincode" className={inputClass}
              style={{ fontFamily: "'Jost', sans-serif" }} />
          </div>

          {/* Password */}
          <div>
            <label className={labelClass}>Password <span style={{ color: burgundy }}>*</span></label>
            <input type="password" name="password" value={formData.password} onChange={handleChange}
              required minLength={6} placeholder="Minimum 6 characters" className={inputClass}
              style={{ fontFamily: "'Jost', sans-serif" }} />
          </div>

          {/* Confirm Password */}
          <div>
            <label className={labelClass}>Confirm Password <span style={{ color: burgundy }}>*</span></label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
              required placeholder="Re-enter your password" className={inputClass}
              style={{ fontFamily: "'Jost', sans-serif" }} />
          </div>

          {/* Mobile not verified hint */}
          {!mobileVerification.verified && (
            <p className="text-[11px]" style={{ color: `${gold}bb` }}>
              Verify your mobile number to enable sign-up
            </p>
          )}

          {/* Error / Success */}
          {error && (
            <div className="border-l-2 pl-3 py-2 text-sm" style={{ borderColor: burgundy, color: burgundy, background: '#7b1c2e07' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="border-l-2 pl-3 py-2 text-sm border-emerald-500 text-emerald-700 bg-emerald-50">
              {success}
            </div>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={btnDisabled}
            style={{
              fontFamily: "'Jost', sans-serif",
              background: btnDisabled ? `${burgundy}70` : burgundy,
              color: gold,
              letterSpacing: '0.2em',
              borderRadius: 2,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { if (!btnDisabled) (e.currentTarget as HTMLButtonElement).style.background = '#9b2438'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = btnDisabled ? `${burgundy}70` : burgundy; }}
            className="w-full py-3.5 mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <><Spinner /> Creating Account…</> : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-7 text-center text-[11px]" style={{ color: '#aaa' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: gold }} className="underline underline-offset-2 hover:opacity-80 transition-opacity">
            Login
          </Link>
        </p>
      </div>

      {/* Bottom brand note */}
      <p className="mt-8 text-[10px] tracking-[0.2em] uppercase" style={{ color: '#ccc' }}>
        fashionpoints.co.in
      </p>
    </div>
  );
}
