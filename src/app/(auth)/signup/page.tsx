'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─────────────────────────────────────────────────────────────────────────────
   Sweta Fashion Points — Signup  ("Quiet Luxury · Minimalist Modern 2026")
   Design: split-screen · cinematic left panel · floating-label form right
───────────────────────────────────────────────────────────────────────────── */

export default function SignupPage() {
  const router = useRouter();

  /* ── form data ── */
  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', location: '', password: '', confirmPassword: '',
  });
  const [isLoading, setIsLoading]   = useState(false);
  const [error,     setError]       = useState('');
  const [success,   setSuccess]     = useState('');

  /* ── verification ── */
  const [emailV, setEmailV] = useState({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
  const [mobileV, setMobileV] = useState({ otpSent: false, otp: '', verified: false, loading: false, error: '' });

  /* ── ui ── */
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ─── handlers ─────────────────────────────────────────────────────────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: name === 'mobile' ? value.replace(/\D/g, '').slice(0, 10) : value }));
    if (name === 'email'  && emailV.verified)  setEmailV({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
    if (name === 'mobile' && mobileV.verified) setMobileV({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
  };

  const sendEmailOTP = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setEmailV(p => ({ ...p, error: 'Please enter a valid email address' })); return;
    }
    setEmailV(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/send-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'email', value: formData.email }) });
      const data = await res.json();
      if (res.ok) setEmailV(p => ({ ...p, otpSent: true, loading: false }));
      else        setEmailV(p => ({ ...p, error: data.error || 'Failed to send OTP', loading: false }));
    } catch { setEmailV(p => ({ ...p, error: 'Error sending OTP', loading: false })); }
  };

  const verifyEmailOTP = async () => {
    if (!emailV.otp || emailV.otp.length !== 6) { setEmailV(p => ({ ...p, error: 'Please enter the 6-digit code' })); return; }
    setEmailV(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/verify-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'email', value: formData.email, otp: emailV.otp }) });
      const data = await res.json();
      if (res.ok && data.verified) setEmailV(p => ({ ...p, verified: true, loading: false }));
      else                          setEmailV(p => ({ ...p, error: data.error || 'Invalid code', loading: false }));
    } catch { setEmailV(p => ({ ...p, error: 'Verification error', loading: false })); }
  };

  const sendMobileOTP = async () => {
    if (!formData.mobile || !/^[6-9]\d{9}$/.test(formData.mobile)) {
      setMobileV(p => ({ ...p, error: 'Please enter a valid 10-digit number' })); return;
    }
    setMobileV(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/send-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'mobile', value: formData.mobile }) });
      const data = await res.json();
      if (res.ok) setMobileV(p => ({ ...p, otpSent: true, loading: false }));
      else        setMobileV(p => ({ ...p, error: data.error || 'Failed to send OTP', loading: false }));
    } catch { setMobileV(p => ({ ...p, error: 'Error sending OTP', loading: false })); }
  };

  const verifyMobileOTP = async () => {
    if (!mobileV.otp || mobileV.otp.length !== 6) { setMobileV(p => ({ ...p, error: 'Please enter the 6-digit code' })); return; }
    setMobileV(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/verify-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'mobile', value: formData.mobile, otp: mobileV.otp }) });
      const data = await res.json();
      if (res.ok && data.verified) setMobileV(p => ({ ...p, verified: true, loading: false }));
      else                          setMobileV(p => ({ ...p, error: data.error || 'Invalid code', loading: false }));
    } catch { setMobileV(p => ({ ...p, error: 'Verification error', loading: false })); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!emailV.verified)                              { setError('Please verify your email address to continue'); return; }
    if (formData.password !== formData.confirmPassword){ setError('Passwords do not match'); return; }
    if (formData.password.length < 6)                  { setError('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, email: formData.email, mobile: formData.mobile, location: formData.location, password: formData.password }) });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Welcome to the atelier. Redirecting…');
        setTimeout(() => router.push('/login'), 2000);
      } else { setError(data.error || 'Something went wrong'); }
    } catch { setError('Network error. Please try again.'); }
    finally { setIsLoading(false); }
  };

  /* ─── derived ─────────────────────────────────────────────────────────── */
  const pwStrength = (() => {
    const p = formData.password;
    const s = [p.length >= 6, p.length >= 10, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
    return { score: s, label: ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][s], color: ['', '#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'][s] };
  })();

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex" style={{ background: '#EFEFEF' }}>

      {/* ══════════════ LEFT — CINEMATIC EDITORIAL PANEL ══════════════ */}
      <div className="hidden lg:block lg:w-[48%] xl:w-[52%] relative overflow-hidden flex-shrink-0">

        {/* Hero image — cinematic fashion editorial */}
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90&fit=crop&crop=center"
          alt="Sweta Fashion Points editorial"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ filter: 'saturate(0.85) contrast(1.04)' }}
        />

        {/* Multi-layer cinematic overlays */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,8,6,0.88) 0%, rgba(10,8,6,0.3) 40%, rgba(10,8,6,0) 70%)' }} />

        {/* Top-left brand mark */}
        <div className="absolute top-10 left-10">
          <div className="flex items-center gap-2.5">
            <div className="w-[1px] h-8 bg-white/40" />
            <div>
              <p className="text-[10px] tracking-[0.3em] text-white/50 uppercase mb-0.5">Sweta</p>
              <p className="text-[10px] tracking-[0.3em] text-white/50 uppercase">Fashion Points</p>
            </div>
          </div>
        </div>

        {/* Bottom editorial text */}
        <div className="absolute bottom-12 left-10 right-10">
          {/* Thin gold rule */}
          <div className="w-8 h-[1px] mb-6" style={{ background: '#C8A96A' }} />

          <h2 className="text-white font-light leading-[1.15] mb-4"
            style={{ fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif', fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', letterSpacing: '-0.01em' }}>
            Dressed for<br />
            the life you<br />
            <em style={{ color: '#C8A96A', fontStyle: 'italic' }}>deserve.</em>
          </h2>

          <p className="text-white/45 text-xs tracking-[0.18em] uppercase">New Collection · 2026</p>

          {/* Member perks micro-copy */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-2.5">
            {[
              'Exclusive early access to new arrivals',
              'Complimentary styling consultations',
              'Members-only events & private sales',
            ].map(b => (
              <div key={b} className="flex items-center gap-3">
                <div className="w-[3px] h-[3px] rounded-full flex-shrink-0" style={{ background: '#C8A96A' }} />
                <p className="text-white/40 text-[11px] tracking-wide">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ RIGHT — FORM PANEL ══════════════ */}
      <div className="flex-1 flex flex-col overflow-y-auto" style={{ background: '#EFEFEF' }}>
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 xl:px-16 py-12 max-w-[520px] mx-auto w-full">

          {/* ── Top nav row ── */}
          <div className="flex items-center justify-between mb-14">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-[1px] h-5 bg-[#C8A96A] group-hover:h-7 transition-all duration-300 ease-out" />
              <span className="text-[11px] tracking-[0.22em] uppercase text-[#1A1A1A]/50 group-hover:text-[#1A1A1A] transition-colors duration-300">
                Sweta Fashion
              </span>
            </Link>
            <Link href="/login"
              className="text-[11px] tracking-[0.18em] uppercase text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors duration-300 ease-out">
              Sign In
            </Link>
          </div>

          {/* ── Heading ── */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#C8A96A] mb-4 font-medium">
              Membership
            </p>
            <h1 className="text-[#1A1A1A] font-light leading-[1.1] mb-3"
              style={{ fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif', fontSize: 'clamp(2.2rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}>
              Join the<br />
              <em style={{ fontStyle: 'italic' }}>Atelier.</em>
            </h1>
            <p className="text-[#1A1A1A]/45 text-sm tracking-wide leading-relaxed">
              Begin your journey into curated luxury fashion.
            </p>
          </div>

          {/* ── Social login (glass pill buttons) ── */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {[
              {
                label: 'Continue with Google',
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                ),
              },
              {
                label: 'Continue with Apple',
                icon: (
                  <svg className="w-4 h-4 text-[#1A1A1A]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                ),
              },
            ].map(btn => (
              <button key={btn.label} type="button"
                className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-[12px] tracking-wide text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-all duration-300 ease-out border hover:border-[#1A1A1A]/30 hover:bg-white/60 group"
                style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)', borderColor: 'rgba(26,26,26,0.1)' }}>
                {btn.icon}
                <span className="hidden sm:inline">{btn.label.split(' ').slice(-1)[0]}</span>
              </button>
            ))}
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-[1px] bg-[#1A1A1A]/10" />
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#1A1A1A]/30">or with email</span>
            <div className="flex-1 h-[1px] bg-[#1A1A1A]/10" />
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-0">

            {/* ─ Full Name ─ */}
            <FloatField label="Your full name" name="name" type="text" value={formData.name} onChange={handleChange} required />

            {/* ─ Email + verify ─ */}
            <div>
              <FloatField
                label="Your email address" name="email" type="email"
                value={formData.email} onChange={handleChange} required
                disabled={emailV.verified}
                verified={emailV.verified}
                actionSlot={
                  !emailV.verified ? (
                    <button type="button" onClick={sendEmailOTP} disabled={emailV.loading || !formData.email}
                      className="absolute right-0 bottom-3 text-[11px] tracking-[0.15em] uppercase transition-all duration-300 ease-out disabled:opacity-30"
                      style={{ color: '#C8A96A' }}>
                      {emailV.loading ? '…' : emailV.otpSent ? 'Resend' : 'Verify'}
                    </button>
                  ) : (
                    <span className="absolute right-0 bottom-3 text-[11px] tracking-[0.12em] text-emerald-600">Verified ✓</span>
                  )
                }
              />
              {emailV.error && <FieldError msg={emailV.error} />}

              {/* OTP panel */}
              {emailV.otpSent && !emailV.verified && (
                <OTPPanel
                  hint="Enter the 6-digit code we sent to your inbox"
                  otp={emailV.otp}
                  loading={emailV.loading}
                  onChange={v => setEmailV(p => ({ ...p, otp: v, error: '' }))}
                  onVerify={verifyEmailOTP}
                />
              )}
            </div>

            {/* ─ Mobile ─ */}
            <div>
              <div className="relative pt-5 pb-3 border-b border-[#1A1A1A]/12 group focus-within:border-[#1A1A1A] transition-colors duration-300 ease-out">
                <label className="absolute top-5 left-0 text-sm text-[#1A1A1A]/35 tracking-wide transition-all duration-300 ease-out"
                  style={{
                    transform: formData.mobile ? 'translateY(-18px)' : 'translateY(0)',
                    fontSize: formData.mobile ? '10px' : '14px',
                    letterSpacing: formData.mobile ? '0.14em' : '0.02em',
                    textTransform: formData.mobile ? 'uppercase' : 'none',
                    color: formData.mobile ? 'rgba(26,26,26,0.4)' : 'rgba(26,26,26,0.35)',
                  }}>
                  Mobile number <span className="text-[#1A1A1A]/20">(optional)</span>
                </label>
                <div className="flex items-center gap-0 mt-1">
                  <span className="text-sm text-[#1A1A1A]/40 mr-2 flex-shrink-0">🇮🇳 +91</span>
                  <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange}
                    disabled={mobileV.verified} maxLength={10}
                    className="flex-1 bg-transparent outline-none text-sm text-[#1A1A1A] tracking-wide min-w-0 disabled:opacity-60" />
                  {!mobileV.verified && formData.mobile.length === 10 && (
                    <button type="button" onClick={sendMobileOTP} disabled={mobileV.loading}
                      className="text-[11px] tracking-[0.15em] uppercase ml-2 flex-shrink-0 transition-all duration-300 disabled:opacity-30"
                      style={{ color: '#C8A96A' }}>
                      {mobileV.loading ? '…' : mobileV.otpSent ? 'Resend' : 'Verify'}
                    </button>
                  )}
                  {mobileV.verified && <span className="text-[11px] tracking-[0.12em] text-emerald-600 ml-2 flex-shrink-0">Verified ✓</span>}
                </div>
              </div>
              {mobileV.error && <FieldError msg={mobileV.error} />}
              {mobileV.otpSent && !mobileV.verified && (
                <OTPPanel
                  hint="Enter the 6-digit code sent to your mobile"
                  otp={mobileV.otp} loading={mobileV.loading}
                  onChange={v => setMobileV(p => ({ ...p, otp: v, error: '' }))}
                  onVerify={verifyMobileOTP}
                />
              )}
            </div>

            {/* ─ Location ─ */}
            <FloatField label="Where are you based?" name="location" type="text" value={formData.location} onChange={handleChange} required />

            {/* ─ Password ─ */}
            <FloatField
              label="Create a password" name="password" type={showPass ? 'text' : 'password'}
              value={formData.password} onChange={handleChange} required
              actionSlot={
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-0 bottom-3 text-[#1A1A1A]/25 hover:text-[#1A1A1A]/60 transition-colors duration-200">
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  )}
                </button>
              }
            />

            {/* Password strength */}
            {formData.password && (
              <div className="pt-2 pb-3">
                <div className="flex gap-1 mb-1.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-[2px] flex-1 rounded-full transition-all duration-500"
                      style={{ background: i <= pwStrength.score ? pwStrength.color : 'rgba(26,26,26,0.08)' }} />
                  ))}
                </div>
                <p className="text-[10px] tracking-[0.1em] uppercase" style={{ color: pwStrength.color }}>
                  {pwStrength.label}
                </p>
              </div>
            )}

            {/* ─ Confirm Password ─ */}
            <FloatField
              label="Confirm your password" name="confirmPassword" type={showConfirm ? 'text' : 'password'}
              value={formData.confirmPassword} onChange={handleChange} required
              actionSlot={
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-0 bottom-3 text-[#1A1A1A]/25 hover:text-[#1A1A1A]/60 transition-colors duration-200">
                  {showConfirm ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  )}
                </button>
              }
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-[11px] text-red-400 tracking-wide pt-1">Passwords don&apos;t match</p>
            )}

            {/* ─ Verification warning ─ */}
            {!emailV.verified && (
              <div className="pt-4 pb-2 flex items-start gap-2.5">
                <div className="w-[2px] h-4 flex-shrink-0 mt-0.5 rounded-full" style={{ background: '#C8A96A' }} />
                <p className="text-[11px] tracking-wide leading-relaxed" style={{ color: 'rgba(26,26,26,0.45)' }}>
                  Email verification is required to create your membership.
                </p>
              </div>
            )}

            {/* ─ Messages ─ */}
            {error && (
              <div className="pt-4 pb-1">
                <p className="text-[12px] text-red-500 tracking-wide leading-relaxed">{error}</p>
              </div>
            )}
            {success && (
              <div className="pt-4 pb-1 flex items-center gap-2">
                <div className="w-[2px] h-4 rounded-full bg-emerald-500 flex-shrink-0" />
                <p className="text-[12px] text-emerald-600 tracking-wide">{success}</p>
              </div>
            )}

            {/* ─ CTA ─ */}
            <div className="pt-8 pb-2">
              <button
                type="submit"
                disabled={isLoading || !emailV.verified}
                className="relative w-full overflow-hidden group disabled:opacity-35 disabled:cursor-not-allowed"
                style={{ height: '56px' }}>

                {/* Background layers */}
                <span className="absolute inset-0 rounded-none transition-all duration-300 ease-out"
                  style={{ background: '#1A1A1A' }} />
                {/* Champagne gold sweep on hover */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(105deg, transparent 20%, rgba(200,169,106,0.15) 50%, transparent 80%)' }} />
                {/* Bottom gold rule slides in */}
                <span className="absolute bottom-0 left-0 h-[1px] w-0 group-hover:w-full transition-all duration-500 ease-out"
                  style={{ background: '#C8A96A' }} />

                {isLoading ? (
                  <span className="relative flex items-center justify-center gap-2 text-white/70">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <span className="text-[11px] tracking-[0.25em] uppercase">Creating your account…</span>
                  </span>
                ) : (
                  <span className="relative flex items-center justify-center gap-3 transition-all duration-300">
                    <span className="text-[11px] tracking-[0.3em] uppercase text-white group-hover:text-[#C8A96A] transition-colors duration-300">
                      Begin Your Journey
                    </span>
                    <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-[#C8A96A] group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* ── Footer ── */}
          <div className="mt-10 pt-8 border-t border-[#1A1A1A]/8">
            <p className="text-[11px] text-[#1A1A1A]/35 tracking-wide text-center leading-relaxed">
              Already a member?{' '}
              <Link href="/login"
                className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors duration-300 ease-out underline underline-offset-2">
                Sign in to your account
              </Link>
            </p>
            <p className="text-[10px] text-[#1A1A1A]/22 tracking-wide text-center mt-3">
              By joining, you agree to our{' '}
              <Link href="/terms-and-conditions" className="underline underline-offset-2 hover:text-[#1A1A1A]/40 transition-colors">Terms</Link>
              {' '}&amp;{' '}
              <Link href="/return-policy" className="underline underline-offset-2 hover:text-[#1A1A1A]/40 transition-colors">Privacy Policy</Link>
            </p>
          </div>

          {/* ── Mobile image (shown on sm) ── */}
          <div className="lg:hidden -mx-8 -mb-12 mt-10 h-48 relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop&crop=top" alt="" className="w-full h-full object-cover object-top" style={{ filter: 'saturate(0.85)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #EFEFEF 0%, transparent 30%)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Sub-components
══════════════════════════════════════════════════════════════════════════ */

/** Floating-label input built on the CSS peer trick */
function FloatField({
  label, name, type, value, onChange, required, disabled, verified, actionSlot,
}: {
  label: string; name: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; disabled?: boolean; verified?: boolean;
  actionSlot?: React.ReactNode;
}) {
  const hasValue = value.length > 0;

  return (
    <div className="relative pt-5 pb-3 border-b border-[#1A1A1A]/12 focus-within:border-[#1A1A1A] transition-colors duration-300 ease-out group"
      style={{ borderColor: verified ? 'rgba(16,185,129,0.5)' : undefined }}>
      {/* Floating label */}
      <label
        className="absolute left-0 top-5 pointer-events-none transition-all duration-300 ease-out"
        style={{
          transform: hasValue ? 'translateY(-18px)' : 'translateY(0)',
          fontSize: hasValue ? '10px' : '14px',
          letterSpacing: hasValue ? '0.14em' : '0.02em',
          textTransform: hasValue ? 'uppercase' : 'none',
          color: hasValue ? 'rgba(26,26,26,0.38)' : 'rgba(26,26,26,0.35)',
        }}>
        {label}{required && <span className="ml-0.5" style={{ color: '#C8A96A' }}>*</span>}
      </label>

      {/* Peer for CSS-driven floating on focus */}
      <input
        type={type} name={name} value={value} onChange={onChange}
        required={required} disabled={disabled} placeholder=""
        className="peer w-full bg-transparent outline-none text-sm text-[#1A1A1A] tracking-wide mt-1 pr-16 disabled:opacity-60 transition-opacity"
        onFocus={e => {
          const lbl = e.currentTarget.previousElementSibling as HTMLElement;
          if (lbl && !value) {
            lbl.style.transform = 'translateY(-18px)';
            lbl.style.fontSize  = '10px';
            lbl.style.letterSpacing = '0.14em';
            lbl.style.textTransform = 'uppercase';
          }
        }}
        onBlur={e => {
          const lbl = e.currentTarget.previousElementSibling as HTMLElement;
          if (lbl && !value) {
            lbl.style.transform = 'translateY(0)';
            lbl.style.fontSize  = '14px';
            lbl.style.letterSpacing = '0.02em';
            lbl.style.textTransform = 'none';
          }
        }}
      />
      {actionSlot}
    </div>
  );
}

/** OTP entry panel — warm ivory, animated shimmer while loading */
function OTPPanel({ hint, otp, loading, onChange, onVerify }: {
  hint: string; otp: string; loading: boolean;
  onChange: (v: string) => void; onVerify: () => void;
}) {
  return (
    <div className="mt-3 mb-1 rounded-xl overflow-hidden border border-[#C8A96A]/20"
      style={{ background: 'rgba(200,169,106,0.04)' }}>
      {/* Shimmer progress bar */}
      {loading && (
        <div className="h-[2px] overflow-hidden">
          <div className="h-full animate-[progressBar_1.4s_ease-in-out_infinite] w-2/5"
            style={{ background: 'linear-gradient(90deg, transparent, #C8A96A, transparent)' }} />
        </div>
      )}
      <div className="px-4 py-3.5">
        <p className="text-[10px] tracking-[0.16em] uppercase text-[#1A1A1A]/35 mb-3">{hint}</p>
        <div className="flex items-center gap-3">
          <input type="text" inputMode="numeric" value={otp}
            onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6} placeholder="— — — — — —"
            className="flex-1 bg-transparent outline-none text-center text-base tracking-[0.35em] font-light text-[#1A1A1A] border-b border-[#1A1A1A]/15 focus:border-[#1A1A1A] transition-colors duration-300 pb-1.5" />
          <button type="button" onClick={onVerify} disabled={loading || otp.length !== 6}
            className="text-[10px] tracking-[0.22em] uppercase px-4 py-2 transition-all duration-300 ease-out disabled:opacity-30 border border-[#1A1A1A]/15 hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white rounded-lg text-[#1A1A1A]/60">
            {loading ? '…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p className="text-[11px] text-red-400 tracking-wide pt-1.5">{msg}</p>;
}
