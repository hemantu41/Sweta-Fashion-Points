'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

/* ─── tiny hook: show/hide password ─── */
function useToggle(init = false): [boolean, () => void] {
  const [v, setV] = useState(init);
  return [v, () => setV(p => !p)];
}

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', location: '', password: '', confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const [emailVerification, setEmailVerification] = useState({
    otpSent: false, otp: '', verified: false, loading: false, error: '',
  });
  const [mobileVerification, setMobileVerification] = useState({
    otpSent: false, otp: '', verified: false, loading: false, error: '',
  });

  const [showPass, togglePass]        = useToggle();
  const [showConfirmPass, toggleConfirmPass] = useToggle();
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ─── handlers ────────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'mobile' ? value.replace(/\D/g, '').slice(0, 10) : value,
    }));
    if (name === 'email'  && emailVerification.verified)
      setEmailVerification({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
    if (name === 'mobile' && mobileVerification.verified)
      setMobileVerification({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
  };

  const sendEmailOTP = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setEmailVerification(p => ({ ...p, error: 'Please enter a valid email address' })); return;
    }
    setEmailVerification(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/send-signup-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', value: formData.email }),
      });
      const data = await res.json();
      if (res.ok) setEmailVerification(p => ({ ...p, otpSent: true, loading: false }));
      else         setEmailVerification(p => ({ ...p, error: data.error || 'Failed to send OTP', loading: false }));
    } catch {
      setEmailVerification(p => ({ ...p, error: 'Error sending OTP', loading: false }));
    }
  };

  const verifyEmailOTP = async () => {
    if (!emailVerification.otp || emailVerification.otp.length !== 6) {
      setEmailVerification(p => ({ ...p, error: 'Please enter a valid 6-digit OTP' })); return;
    }
    setEmailVerification(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/verify-signup-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', value: formData.email, otp: emailVerification.otp }),
      });
      const data = await res.json();
      if (res.ok && data.verified) setEmailVerification(p => ({ ...p, verified: true, loading: false }));
      else                          setEmailVerification(p => ({ ...p, error: data.error || 'Invalid OTP', loading: false }));
    } catch {
      setEmailVerification(p => ({ ...p, error: 'Error verifying OTP', loading: false }));
    }
  };

  const sendMobileOTP = async () => {
    if (!formData.mobile || !/^[6-9]\d{9}$/.test(formData.mobile)) {
      setMobileVerification(p => ({ ...p, error: 'Please enter a valid 10-digit mobile number' })); return;
    }
    setMobileVerification(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/send-signup-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mobile', value: formData.mobile }),
      });
      const data = await res.json();
      if (res.ok) setMobileVerification(p => ({ ...p, otpSent: true, loading: false }));
      else         setMobileVerification(p => ({ ...p, error: data.error || 'Failed to send OTP', loading: false }));
    } catch {
      setMobileVerification(p => ({ ...p, error: 'Error sending OTP', loading: false }));
    }
  };

  const verifyMobileOTP = async () => {
    if (!mobileVerification.otp || mobileVerification.otp.length !== 6) {
      setMobileVerification(p => ({ ...p, error: 'Please enter a valid 6-digit OTP' })); return;
    }
    setMobileVerification(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/verify-signup-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mobile', value: formData.mobile, otp: mobileVerification.otp }),
      });
      const data = await res.json();
      if (res.ok && data.verified) setMobileVerification(p => ({ ...p, verified: true, loading: false }));
      else                          setMobileVerification(p => ({ ...p, error: data.error || 'Invalid OTP', loading: false }));
    } catch {
      setMobileVerification(p => ({ ...p, error: 'Error verifying OTP', loading: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!emailVerification.verified) { setError('Please verify your email address before signing up'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name, email: formData.email, mobile: formData.mobile,
          location: formData.location, password: formData.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Account created successfully! Redirecting to login…');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── shared input wrapper ─────────────────────────────────────────────────────
  const isFocused = (name: string) => focusedField === name;

  // ─── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">

      {/* ══════════════════════ LEFT EDITORIAL PANEL ══════════════════════ */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f0f0f 0%, #1a1410 50%, #120d0d 100%)' }}>

        {/* Diamond grid texture SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diamond" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#C8A96A" strokeWidth="0.8"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diamond)"/>
        </svg>

        {/* Top-left gold ornament */}
        <div className="absolute top-8 left-8 w-20 h-20 opacity-25">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0 L80 0 M0 0 L0 80" stroke="#C8A96A" strokeWidth="1.5"/>
            <path d="M0 20 L20 0" stroke="#C8A96A" strokeWidth="0.8" opacity="0.6"/>
            <path d="M0 40 L40 0" stroke="#C8A96A" strokeWidth="0.5" opacity="0.4"/>
          </svg>
        </div>

        {/* Bottom-right gold ornament */}
        <div className="absolute bottom-8 right-8 w-20 h-20 opacity-25 rotate-180">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0 L80 0 M0 0 L0 80" stroke="#C8A96A" strokeWidth="1.5"/>
            <path d="M0 20 L20 0" stroke="#C8A96A" strokeWidth="0.8" opacity="0.6"/>
            <path d="M0 40 L40 0" stroke="#C8A96A" strokeWidth="0.5" opacity="0.4"/>
          </svg>
        </div>

        {/* Gold radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(200,169,106,0.07) 0%, transparent 70%)' }} />

        {/* Content */}
        <div className="relative flex flex-col justify-between h-full px-12 py-14">
          {/* Brand mark */}
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-9 h-9 border border-[#C8A96A]/60 rounded-sm flex items-center justify-center">
                <span className="text-[#C8A96A] text-xs font-bold tracking-widest">SFP</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-[#C8A96A]/40 to-transparent" />
            </div>

            {/* Large heading */}
            <h1 className="text-[2.6rem] xl:text-5xl font-bold text-white leading-[1.1] tracking-tight"
              style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
              Sweta<br />
              <span style={{ color: '#C8A96A' }}>Fashion</span><br />
              Points
            </h1>

            {/* Gold thin divider */}
            <div className="flex items-center gap-3 my-8">
              <div className="h-px w-8 bg-[#C8A96A]" />
              <div className="h-px flex-1 bg-[#C8A96A]/20" />
            </div>

            {/* Tagline */}
            <p className="text-[#B0A090] text-sm leading-relaxed tracking-wide max-w-xs">
              Where every thread tells a story.<br />
              Curated fashion for the discerning soul.
            </p>
          </div>

          {/* Bottom: trust row */}
          <div className="space-y-4">
            {[
              { icon: '✦', text: 'Exclusive member benefits' },
              { icon: '✦', text: 'Early access to new collections' },
              { icon: '✦', text: 'Personalised style recommendations' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-[#C8A96A] text-[10px]">{item.icon}</span>
                <span className="text-[#7A6A5A] text-xs tracking-wide">{item.text}</span>
              </div>
            ))}
            {/* Bottom gold line */}
            <div className="h-px bg-gradient-to-r from-[#C8A96A]/30 via-[#C8A96A]/60 to-transparent mt-8 pt-8" />
            <p className="text-[#4A3A2A] text-[11px] tracking-widest uppercase">Est. Fashion Points</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════ RIGHT FORM PANEL ══════════════════════ */}
      <div className="flex-1 flex items-start lg:items-center justify-center overflow-y-auto"
        style={{ background: 'linear-gradient(155deg, #FAF8F4 0%, #F5F0E8 50%, #F0E8DC 100%)' }}>

        {/* Subtle texture blobs */}
        <div className="fixed top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(200,169,106,0.08) 0%, transparent 70%)' }} />
        <div className="fixed bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(200,169,106,0.06) 0%, transparent 70%)' }} />

        <div className="w-full max-w-[460px] px-6 py-10 lg:py-8">

          {/* Mobile brand header */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <Image src="/images/logo.png" alt="Sweta Fashion Points" width={72} height={72} className="mx-auto" />
            </Link>
            <h2 className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
              Sweta Fashion Points
            </h2>
          </div>

          {/* Glass card */}
          <div className="bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.09)] overflow-hidden">

            {/* Gold accent top bar */}
            <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #C8A96A 0%, #e8c97a 40%, #b8893a 100%)' }} />

            <div className="px-8 pt-8 pb-9">

              {/* Card header */}
              <div className="mb-7">
                <div className="hidden lg:flex items-center gap-3 mb-5">
                  <Link href="/">
                    <Image src="/images/logo.png" alt="Logo" width={44} height={44} className="rounded-xl" />
                  </Link>
                  <div>
                    <p className="text-[10px] text-[#C8A96A] uppercase tracking-[0.2em] font-semibold">Sweta Fashion Points</p>
                    <p className="text-[11px] text-[#9A8A7A] tracking-wide">Premium Collection</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                  Create Account
                </h2>
                <p className="text-[#9A8A7A] text-sm mt-1">Join the world of curated luxury fashion</p>

                {/* Gold divider */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="h-px w-6" style={{ background: '#C8A96A' }} />
                  <div className="h-px flex-1 bg-[#E8E0D4]" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── Full Name ── */}
                <LuxField
                  label="Full Name" required
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                  focused={isFocused('name')}
                >
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                    required placeholder="Your full name"
                    className="w-full bg-transparent outline-none text-sm text-[#1A1A1A] placeholder-[#C0B8B0]"
                  />
                </LuxField>

                {/* ── Email ── */}
                <div>
                  <LuxField
                    label="Email Address" required
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                    focused={isFocused('email')}
                    verified={emailVerification.verified}
                    suffix={
                      !emailVerification.verified ? (
                        <GoldButton
                          onClick={sendEmailOTP}
                          disabled={emailVerification.loading || !formData.email}
                          loading={emailVerification.loading}
                          label={emailVerification.otpSent ? 'Resend' : 'Verify'}
                        />
                      ) : (
                        <VerifiedBadge />
                      )
                    }
                  >
                    <input
                      type="email" name="email" value={formData.email} onChange={handleChange}
                      onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                      required disabled={emailVerification.verified}
                      placeholder="your@email.com"
                      className="w-full bg-transparent outline-none text-sm text-[#1A1A1A] placeholder-[#C0B8B0] disabled:opacity-70"
                    />
                  </LuxField>

                  {/* OTP row */}
                  {emailVerification.otpSent && !emailVerification.verified && (
                    <OTPRow
                      label="OTP sent to your email"
                      otp={emailVerification.otp}
                      loading={emailVerification.loading}
                      onChange={v => setEmailVerification(p => ({ ...p, otp: v, error: '' }))}
                      onVerify={verifyEmailOTP}
                    />
                  )}
                  {emailVerification.error && <FieldError msg={emailVerification.error} />}
                </div>

                {/* ── Mobile ── */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8A7A] mb-1.5">
                    Mobile Number <span className="normal-case font-normal text-[#C0B8B0]">(Optional)</span>
                  </label>
                  <div className={`flex items-center border rounded-2xl overflow-hidden transition-all duration-200 ${
                    isFocused('mobile') ? 'border-[#C8A96A] shadow-[0_0_0_3px_rgba(200,169,106,0.12)]' : 'border-[#E8E0D4]'
                  } bg-white/60`}>
                    <span className="flex items-center gap-1 pl-4 pr-3 py-3.5 text-sm text-[#9A8A7A] border-r border-[#E8E0D4] font-medium whitespace-nowrap">
                      <span>🇮🇳</span> +91
                    </span>
                    <input
                      type="tel" name="mobile" value={formData.mobile} onChange={handleChange}
                      onFocus={() => setFocusedField('mobile')} onBlur={() => setFocusedField(null)}
                      disabled={mobileVerification.verified}
                      maxLength={10} placeholder="9876543210"
                      className="flex-1 px-4 py-3.5 bg-transparent outline-none text-sm text-[#1A1A1A] placeholder-[#C0B8B0] min-w-0"
                    />
                    {formData.mobile.length === 10 && !mobileVerification.verified && (
                      <div className="pr-3">
                        <GoldButton
                          onClick={sendMobileOTP}
                          disabled={mobileVerification.loading}
                          loading={mobileVerification.loading}
                          label={mobileVerification.otpSent ? 'Resend' : 'Verify'}
                        />
                      </div>
                    )}
                    {mobileVerification.verified && <div className="pr-3"><VerifiedBadge /></div>}
                  </div>
                  {mobileVerification.otpSent && !mobileVerification.verified && (
                    <OTPRow
                      label="OTP sent to your mobile"
                      otp={mobileVerification.otp}
                      loading={mobileVerification.loading}
                      onChange={v => setMobileVerification(p => ({ ...p, otp: v, error: '' }))}
                      onVerify={verifyMobileOTP}
                    />
                  )}
                  {mobileVerification.error && <FieldError msg={mobileVerification.error} />}
                </div>

                {/* ── Location ── */}
                <LuxField
                  label="City / Location" required
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  focused={isFocused('location')}
                >
                  <input
                    type="text" name="location" value={formData.location} onChange={handleChange}
                    onFocus={() => setFocusedField('location')} onBlur={() => setFocusedField(null)}
                    required placeholder="e.g. Patna, Bihar"
                    className="w-full bg-transparent outline-none text-sm text-[#1A1A1A] placeholder-[#C0B8B0]"
                  />
                </LuxField>

                {/* ── Password ── */}
                <LuxField
                  label="Password" required
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                  focused={isFocused('password')}
                  suffix={<EyeToggle show={showPass} onToggle={togglePass} />}
                >
                  <input
                    type={showPass ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange}
                    onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                    required minLength={6} placeholder="Minimum 6 characters"
                    className="w-full bg-transparent outline-none text-sm text-[#1A1A1A] placeholder-[#C0B8B0]"
                  />
                </LuxField>

                {/* Password strength */}
                {formData.password && (
                  <PasswordStrength password={formData.password} />
                )}

                {/* ── Confirm Password ── */}
                <LuxField
                  label="Confirm Password" required
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                  focused={isFocused('confirmPassword')}
                  suffix={<EyeToggle show={showConfirmPass} onToggle={toggleConfirmPass} />}
                >
                  <input
                    type={showConfirmPass ? 'text' : 'password'} name="confirmPassword"
                    value={formData.confirmPassword} onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)}
                    required placeholder="Re-enter your password"
                    className="w-full bg-transparent outline-none text-sm text-[#1A1A1A] placeholder-[#C0B8B0]"
                  />
                </LuxField>

                {/* Password match hint */}
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 -mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Passwords do not match
                  </p>
                )}

                {/* ── Email verification warning ── */}
                {!emailVerification.verified && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border"
                    style={{ background: 'linear-gradient(135deg, #FFF9EC, #FFF4DC)', borderColor: '#E8C96A' }}>
                    <svg className="w-4 h-4 text-[#C8A96A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs text-[#8A6A20] leading-relaxed">
                      <span className="font-semibold">Email verification required</span> — Please verify your email address to proceed.
                    </p>
                  </div>
                )}

                {/* ── Error / Success ── */}
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {success}
                  </div>
                )}

                {/* ── Create Account CTA ── */}
                <button
                  type="submit"
                  disabled={isLoading || !emailVerification.verified}
                  className="relative w-full overflow-hidden rounded-2xl py-4 font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed group"
                  style={{ background: isLoading || !emailVerification.verified ? '#1A1A1A' : '#1A1A1A' }}
                >
                  {/* Gold shimmer overlay on hover */}
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(200,169,106,0.18) 50%, transparent 70%)' }} />
                  {/* Gold bottom border on hover */}
                  <span className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
                    style={{ background: 'linear-gradient(90deg, #C8A96A, #e8c97a, #C8A96A)' }} />

                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2 text-white">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating account…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 text-white group-hover:text-[#C8A96A] transition-colors duration-300">
                      Create Account
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  )}
                </button>

                {/* ── Divider ── */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-[#E8E0D4]" />
                  <span className="text-[11px] text-[#C0B8B0] uppercase tracking-widest">or continue with</span>
                  <div className="flex-1 h-px bg-[#E8E0D4]" />
                </div>

                {/* ── Social login row ── */}
                <div className="grid grid-cols-2 gap-3">
                  <button type="button"
                    className="flex items-center justify-center gap-2 py-3 border border-[#E8E0D4] rounded-2xl text-sm font-medium text-[#3A3A3A] hover:border-[#C8A96A] hover:bg-[#FDFAF5] transition-all duration-200 bg-white/60">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button type="button"
                    className="flex items-center justify-center gap-2 py-3 border border-[#E8E0D4] rounded-2xl text-sm font-medium text-[#3A3A3A] hover:border-[#C8A96A] hover:bg-[#FDFAF5] transition-all duration-200 bg-white/60">
                    <svg className="w-4 h-4 text-[#1A1A1A]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Apple
                  </button>
                </div>
              </form>

              {/* ── Login link ── */}
              <div className="mt-6 text-center">
                <div className="h-px bg-[#E8E0D4] mb-5" />
                <p className="text-sm text-[#9A8A7A]">
                  Already a member?{' '}
                  <Link href="/login"
                    className="font-semibold text-[#1A1A1A] hover:text-[#C8A96A] transition-colors duration-200 underline-offset-2 hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Fine print */}
          <p className="text-center text-[11px] text-[#C0B8B0] mt-5 px-4">
            By creating an account you agree to our{' '}
            <Link href="/terms-and-conditions" className="underline hover:text-[#C8A96A] transition-colors">Terms</Link>
            {' '}&amp;{' '}
            <Link href="/return-policy" className="underline hover:text-[#C8A96A] transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LuxField({
  label, required, icon, focused, verified, suffix, children,
}: {
  label: string; required?: boolean; icon: React.ReactNode;
  focused: boolean; verified?: boolean; suffix?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8A7A] mb-1.5">
        {label} {required && <span className="text-[#C8A96A]">*</span>}
      </label>
      <div className={`flex items-center gap-2 border rounded-2xl px-4 py-3.5 bg-white/60 transition-all duration-200 ${
        verified
          ? 'border-green-400 bg-green-50/40 shadow-[0_0_0_3px_rgba(74,222,128,0.08)]'
          : focused
          ? 'border-[#C8A96A] shadow-[0_0_0_3px_rgba(200,169,106,0.12)]'
          : 'border-[#E8E0D4] hover:border-[#D4C8B4]'
      }`}>
        <span className={`flex-shrink-0 transition-colors duration-200 ${focused ? 'text-[#C8A96A]' : verified ? 'text-green-500' : 'text-[#C0B8B0]'}`}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">{children}</div>
        {suffix && <div className="flex-shrink-0 ml-1">{suffix}</div>}
      </div>
    </div>
  );
}

function GoldButton({ onClick, disabled, loading, label }: {
  onClick: () => void; disabled: boolean; loading: boolean; label: string;
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className="px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-40 whitespace-nowrap"
      style={{ background: 'linear-gradient(135deg, #1A1A1A, #2A2A2A)', color: '#C8A96A', border: '1px solid rgba(200,169,106,0.3)' }}
    >
      {loading ? (
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          …
        </span>
      ) : label}
    </button>
  );
}

function VerifiedBadge() {
  return (
    <div className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-xl">
      <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-[11px] text-green-700 font-semibold">Verified</span>
    </div>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="text-[#C0B8B0] hover:text-[#C8A96A] transition-colors duration-200">
      {show ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}

function OTPRow({ label, otp, loading, onChange, onVerify }: {
  label: string; otp: string; loading: boolean;
  onChange: (v: string) => void; onVerify: () => void;
}) {
  return (
    <div className="mt-2 rounded-2xl border border-[#C8A96A]/30 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #FDFAF3, #FAF5E8)' }}>
      {/* Progress bar while loading */}
      {loading && (
        <div className="h-0.5 w-full overflow-hidden">
          <div className="h-full animate-[progressBar_1.5s_ease-in-out_infinite]"
            style={{ background: 'linear-gradient(90deg, #C8A96A, #e8c97a, #C8A96A)', width: '40%' }} />
        </div>
      )}
      <div className="px-4 py-3">
        <p className="text-[11px] text-[#8A7A5A] mb-2 flex items-center gap-1.5">
          <svg className="w-3 h-3 text-[#C8A96A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {label} — enter 6-digit code
        </p>
        <div className="flex gap-2">
          <input
            type="text" inputMode="numeric"
            value={otp}
            onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="flex-1 px-4 py-2.5 border border-[#D4C89A] rounded-xl bg-white/80 outline-none focus:ring-2 focus:ring-[#C8A96A]/30 focus:border-[#C8A96A] text-center text-base tracking-[0.3em] font-bold text-[#1A1A1A] transition-all"
            placeholder="● ● ● ● ● ●"
          />
          <button type="button" onClick={onVerify} disabled={loading || otp.length !== 6}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1A1A1A, #2A2A2A)', color: '#C8A96A' }}>
            {loading ? '…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 6,
    password.length >= 10,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const label = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][score];
  const colors = ['', '#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#10B981'];

  return (
    <div className="-mt-1">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : '#E8E0D4' }} />
        ))}
      </div>
      {score > 0 && (
        <p className="text-[11px] font-semibold" style={{ color: colors[score] }}>{label} password</p>
      )}
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {msg}
    </p>
  );
}
