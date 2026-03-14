'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─────────────────────────────────────────────────────────────────────────────
   Sweta Fashion Points — Signup
   Aesthetic: Luxury Dark Fashion · Near-Black (#0e0b08) · Gold (#c9a84c)
   Display: Cormorant Garamond  ·  Body: Jost
───────────────────────────────────────────────────────────────────────────── */

const GOLD   = '#c9a84c';
const DARK   = '#0e0b08';
const PANEL  = '#100d0a';   /* right-panel bg — barely lighter than left */
const BORDER = 'rgba(201,168,76,0.45)';
const MUTED  = 'rgba(255,255,255,0.78)';
const DIM    = 'rgba(255,255,255,0.52)';

const CORMORANT = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const JOST      = '"Jost", "Inter", system-ui, sans-serif';

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', location: '', password: '', confirmPassword: '',
  });
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [emailV, setEmailV] = useState({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
  const [mobileV, setMobileV] = useState({ otpSent: false, otp: '', verified: false, loading: false, error: '' });

  /* ─── handlers ─────────────────────────────────────────────────────────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: name === 'mobile' ? value.replace(/\D/g, '').slice(0, 10) : value }));
    if (name === 'email'  && emailV.verified)  resetEmailV();
    if (name === 'mobile' && mobileV.verified) resetMobileV();
  };
  const resetEmailV  = () => setEmailV ({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
  const resetMobileV = () => setMobileV({ otpSent: false, otp: '', verified: false, loading: false, error: '' });

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
    if (!emailV.otp || emailV.otp.length !== 6) { setEmailV(p => ({ ...p, error: 'Enter the 6-digit code' })); return; }
    setEmailV(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/verify-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'email', value: formData.email, otp: emailV.otp }) });
      const data = await res.json();
      if (res.ok && data.verified) setEmailV(p => ({ ...p, verified: true, loading: false }));
      else                          setEmailV(p => ({ ...p, error: data.error || 'Invalid code', loading: false }));
    } catch { setEmailV(p => ({ ...p, error: 'Verification error', loading: false })); }
  };

  const sendMobileOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) { setMobileV(p => ({ ...p, error: 'Enter a valid 10-digit number' })); return; }
    setMobileV(p => ({ ...p, loading: true, error: '' }));
    try {
      const res  = await fetch('/api/auth/send-signup-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'mobile', value: formData.mobile }) });
      const data = await res.json();
      if (res.ok) setMobileV(p => ({ ...p, otpSent: true, loading: false }));
      else        setMobileV(p => ({ ...p, error: data.error || 'Failed to send OTP', loading: false }));
    } catch { setMobileV(p => ({ ...p, error: 'Error sending OTP', loading: false })); }
  };

  const verifyMobileOTP = async () => {
    if (!mobileV.otp || mobileV.otp.length !== 6) { setMobileV(p => ({ ...p, error: 'Enter the 6-digit code' })); return; }
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
    if (!emailV.verified)                               { setError('Please verify your email address first'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6)                   { setError('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, email: formData.email, mobile: formData.mobile, location: formData.location, password: formData.password }) });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Welcome. Redirecting you now…');
        setTimeout(() => router.push('/login'), 2000);
      } else { setError(data.error || 'Something went wrong'); }
    } catch { setError('Network error. Please try again.'); }
    finally { setIsLoading(false); }
  };

  /* ─── password strength ─────────────────────────────────────────────────── */
  const pw = formData.password;
  const pwScore = [pw.length >= 6, pw.length >= 10, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const pwLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][pwScore];
  const pwColor = ['', '#ef4444', '#f59e0b', '#eab308', '#10b981', GOLD][pwScore];

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex" style={{ background: DARK, fontFamily: JOST }}>

      {/* ══════════ LEFT BRAND PANEL ══════════ */}
      <div className="hidden lg:flex flex-col justify-between lg:w-[42%] xl:w-[45%] flex-shrink-0 relative overflow-hidden px-12 xl:px-16 py-14"
        style={{
          background: DARK,
          backgroundImage: `radial-gradient(${GOLD}08 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}>

        {/* Vertical gold rule — right edge */}
        <div className="absolute right-0 top-0 h-full w-[1px]"
          style={{ background: `linear-gradient(to bottom, transparent 0%, ${GOLD}40 20%, ${GOLD}60 50%, ${GOLD}40 80%, transparent 100%)` }} />

        {/* Top section */}
        <div>
          {/* Monogram */}
          <div className="flex items-center gap-4 mb-16">
            <div className="w-11 h-11 border flex items-center justify-center"
              style={{ borderColor: `${GOLD}50` }}>
              <span className="text-xs font-medium tracking-[0.2em]" style={{ color: GOLD, fontFamily: JOST }}>SFP</span>
            </div>
            <div className="h-[1px] flex-1" style={{ background: `linear-gradient(to right, ${GOLD}40, transparent)` }} />
          </div>

          {/* Brand name */}
          <div className="mb-6">
            <p className="text-[11px] tracking-[0.35em] uppercase mb-5 font-light" style={{ color: GOLD, fontFamily: JOST }}>
              Est. Fashion Points
            </p>
            <h1 className="font-light text-white leading-[1.08] mb-6"
              style={{
                fontFamily: CORMORANT,
                fontSize: 'clamp(2.8rem, 4.5vw, 4rem)',
                letterSpacing: '-0.015em',
              }}>
              Sweta<br />
              Fashion<br />
              <em className="not-italic" style={{ color: GOLD }}>Points</em>
            </h1>

            {/* Gold ornament */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] w-6" style={{ background: GOLD }} />
              <div className="h-[1px] flex-1" style={{ background: `${GOLD}25` }} />
            </div>

            {/* Italic tagline */}
            <p className="leading-relaxed"
              style={{
                fontFamily: CORMORANT,
                fontSize: 'clamp(1.25rem, 2vw, 1.55rem)',
                fontStyle: 'italic',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.88)',
                letterSpacing: '0.01em',
              }}>
              &ldquo;Where every thread<br />
              tells a story.&rdquo;
            </p>
          </div>
        </div>

        {/* Middle — feature bullets */}
        <div className="space-y-5 my-auto py-10">
          {[
            { title: 'Exclusive access',    body: 'First look at every new arrival before the world sees it.' },
            { title: 'Curated for you',     body: 'Personalised style edits based on your taste & wardrobe.' },
            { title: 'Members-only events', body: 'Private trunk shows, style nights & seasonal sales.' },
          ].map(b => (
            <div key={b.title} className="flex gap-4">
              <div className="flex-shrink-0 w-[2px] h-auto self-stretch rounded-full mt-1"
                style={{ background: `linear-gradient(to bottom, ${GOLD}, ${GOLD}30)` }} />
              <div>
                <p className="text-sm font-medium tracking-wide mb-0.5" style={{ color: 'rgba(255,255,255,0.95)', fontFamily: JOST }}>{b.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)', fontFamily: JOST }}>{b.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom — copyright */}
        <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: DIM, fontFamily: JOST }}>
          © 2026 Sweta Fashion Points
        </p>
      </div>

      {/* ══════════ RIGHT FORM PANEL ══════════ */}
      <div className="flex-1 overflow-y-auto flex flex-col" style={{ background: PANEL }}>
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 xl:px-16 py-12 max-w-[500px] mx-auto w-full">

          {/* Mobile brand header */}
          <div className="lg:hidden mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase mb-2 font-light" style={{ color: GOLD, fontFamily: JOST }}>Sweta Fashion Points</p>
            <h2 className="text-white font-light text-3xl" style={{ fontFamily: CORMORANT, letterSpacing: '-0.01em' }}>Create Account</h2>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-10">
            <p className="text-[10px] tracking-[0.32em] uppercase mb-4" style={{ color: GOLD, fontFamily: JOST, fontWeight: 300 }}>
              New Membership
            </p>
            <h2 className="font-light leading-[1.1] text-white mb-2"
              style={{ fontFamily: CORMORANT, fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', letterSpacing: '-0.02em' }}>
              Create Your Account
            </h2>
            <p className="text-xs tracking-wide" style={{ color: MUTED, fontFamily: JOST, fontWeight: 300 }}>
              Join the inner circle of curated fashion.
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-1">

            {/* Full Name */}
            <DarkField label="Full Name" name="name" type="text" value={formData.name} onChange={handleChange} required />

            {/* Email */}
            <div>
              <DarkField label="Email Address" name="email" type="email" value={formData.email}
                onChange={handleChange} required disabled={emailV.verified}
                verified={emailV.verified}
                suffix={
                  !emailV.verified ? (
                    <GoldInlineBtn onClick={sendEmailOTP} disabled={emailV.loading || !formData.email} loading={emailV.loading}
                      label={emailV.otpSent ? 'Resend' : 'Verify'} />
                  ) : <VerifiedChip />
                }
              />
              {emailV.error && <ErrMsg msg={emailV.error} />}
              {emailV.otpSent && !emailV.verified && (
                <OTPBox hint="6-digit code sent to your email" otp={emailV.otp} loading={emailV.loading}
                  onChange={v => setEmailV(p => ({ ...p, otp: v, error: '' }))} onVerify={verifyEmailOTP} />
              )}
            </div>

            {/* Mobile */}
            <div>
              <MobileField
                value={formData.mobile} onChange={handleChange}
                verified={mobileV.verified}
                onSendOTP={sendMobileOTP} sending={mobileV.loading} otpSent={mobileV.otpSent}
              />
              {mobileV.error && <ErrMsg msg={mobileV.error} />}
              {mobileV.otpSent && !mobileV.verified && (
                <OTPBox hint="6-digit code sent to your mobile" otp={mobileV.otp} loading={mobileV.loading}
                  onChange={v => setMobileV(p => ({ ...p, otp: v, error: '' }))} onVerify={verifyMobileOTP} />
              )}
            </div>

            {/* Location */}
            <DarkField label="City / Town" name="location" type="text" value={formData.location} onChange={handleChange} required />

            {/* Password */}
            <DarkField label="Password" name="password" type={showPass ? 'text' : 'password'}
              value={formData.password} onChange={handleChange} required
              suffix={<EyeBtn show={showPass} onToggle={() => setShowPass(p => !p)} />}
            />
            {pw && (
              <div className="pb-3 pt-1.5">
                <div className="flex gap-1 mb-1.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-[1.5px] flex-1 rounded-full transition-all duration-500 ease-out"
                      style={{ background: i <= pwScore ? pwColor : 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
                {pwLabel && <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: pwColor, fontFamily: JOST }}>{pwLabel}</p>}
              </div>
            )}

            {/* Confirm Password */}
            <DarkField label="Confirm Password" name="confirmPassword" type={showConfirm ? 'text' : 'password'}
              value={formData.confirmPassword} onChange={handleChange} required
              suffix={<EyeBtn show={showConfirm} onToggle={() => setShowConfirm(p => !p)} />}
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-[11px] pt-1" style={{ color: '#ef4444', fontFamily: JOST }}>Passwords do not match</p>
            )}

            {/* ── Verification notice ── */}
            {!emailV.verified && (
              <div className="flex items-start gap-3 mt-5 mb-1 pt-2">
                <div className="w-[2px] h-9 flex-shrink-0 rounded-full mt-0.5"
                  style={{ background: `linear-gradient(to bottom, ${GOLD}, ${GOLD}30)` }} />
                <p className="text-[11px] leading-relaxed tracking-wide" style={{ color: MUTED, fontFamily: JOST, fontWeight: 300 }}>
                  Please verify your email address before creating your account. A one-time code will be sent to your inbox.
                </p>
              </div>
            )}

            {/* ── Messages ── */}
            {error && (
              <div className="pt-4 pb-1">
                <p className="text-[12px] tracking-wide" style={{ color: '#f87171', fontFamily: JOST }}>{error}</p>
              </div>
            )}
            {success && (
              <div className="pt-4 pb-1 flex items-center gap-2">
                <div className="w-[2px] h-4 rounded-full flex-shrink-0" style={{ background: GOLD }} />
                <p className="text-[12px] tracking-wide" style={{ color: GOLD, fontFamily: JOST }}>{success}</p>
              </div>
            )}

            {/* ── CTA — gold shimmer button ── */}
            <div className="pt-8 pb-2">
              <button
                type="submit"
                disabled={isLoading || !emailV.verified}
                className="relative w-full overflow-hidden group"
                style={{ height: '54px', opacity: isLoading || !emailV.verified ? 0.4 : 1, cursor: isLoading || !emailV.verified ? 'not-allowed' : 'pointer' }}>

                {/* Gold base */}
                <span className="absolute inset-0 transition-all duration-300"
                  style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #e0b85a 50%, ${GOLD} 100%)` }} />

                {/* Shimmer sweep */}
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
                  style={{
                    background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.28) 50%, transparent 75%)',
                    animation: 'none',
                  }}
                />
                {/* Shimmer animation class on hover */}
                <style>{`
                  .shimmer-btn:hover .shimmer-sweep {
                    animation: shimmerSweep 0.7s ease-out forwards;
                  }
                  @keyframes shimmerSweep {
                    0%   { transform: translateX(-100%); opacity: 1; }
                    100% { transform: translateX(200%);  opacity: 1; }
                  }
                `}</style>

                {/* Shimmer via separate overlay */}
                <span
                  className="shimmer-sweep absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)', transform: 'translateX(-100%)' }}
                />

                {isLoading ? (
                  <span className="relative flex items-center justify-center gap-2"
                    style={{ color: DARK, fontFamily: JOST, fontSize: '11px', letterSpacing: '0.25em' }}>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Creating Account…
                  </span>
                ) : (
                  <span className="relative flex items-center justify-center gap-3 transition-all duration-300"
                    style={{ color: DARK, fontFamily: JOST, fontSize: '11px', letterSpacing: '0.3em', fontWeight: 500, textTransform: 'uppercase' }}>
                    Create Account
                    <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                )}
              </button>

              {/* Under-button rule — dark-to-gold fade on hover, always visible */}
              <div className="h-[1px] mt-0 w-0 group-hover:w-full transition-all duration-500"
                style={{ background: GOLD }} />
            </div>

            {/* ── Divider ── */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-[1px]" style={{ background: DIM }} />
              <span className="text-[10px] tracking-[0.22em] uppercase" style={{ color: DIM, fontFamily: JOST }}>or</span>
              <div className="flex-1 h-[1px]" style={{ background: DIM }} />
            </div>

            {/* ── Social ── */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Google',
                  icon: <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
                },
                {
                  label: 'Apple',
                  icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="rgba(255,255,255,0.95)"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>,
                },
              ].map(s => (
                <button key={s.label} type="button"
                  className="flex items-center justify-center gap-2.5 transition-all duration-300 ease-out group/s"
                  style={{
                    height: '46px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${BORDER}`,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${GOLD}50`; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.06)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  {s.icon}
                  <span style={{ color: MUTED, fontFamily: JOST, fontSize: '11px', letterSpacing: '0.15em', fontWeight: 300, textTransform: 'uppercase' }}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </form>

          {/* ── Footer ── */}
          <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${DIM}` }}>
            <p className="text-center" style={{ fontFamily: JOST, fontSize: '12px', color: MUTED, letterSpacing: '0.04em' }}>
              Already a member?{' '}
              <Link href="/login"
                className="transition-colors duration-300"
                style={{ color: GOLD }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = '#e0c570')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = GOLD)}>
                Sign in
              </Link>
            </p>
            <p className="text-center mt-3" style={{ fontFamily: JOST, fontSize: '10px', color: DIM, letterSpacing: '0.06em' }}>
              By joining you agree to our{' '}
              <Link href="/terms-and-conditions" className="underline underline-offset-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Terms</Link>
              {' '}&amp;{' '}
              <Link href="/return-policy" className="underline underline-offset-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Privacy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Sub-components — dark theme
══════════════════════════════════════════════════════════════════════════ */

function DarkField({ label, name, type, value, onChange, required, disabled, verified, suffix }: {
  label: string; name: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; disabled?: boolean; verified?: boolean; suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;

  return (
    <div className="relative py-5"
      style={{ borderBottom: `1px solid ${verified ? '#10b98160' : focused ? `${GOLD}60` : 'rgba(255,255,255,0.1)'}`, transition: 'border-color 0.3s ease' }}>
      {/* Floating label */}
      <label
        className="absolute left-0 pointer-events-none transition-all duration-300 ease-out"
        style={{
          top: raised ? '4px' : '20px',
          fontSize: raised ? '9px' : '13px',
          letterSpacing: raised ? '0.18em' : '0.04em',
          textTransform: raised ? 'uppercase' : 'none',
          color: verified ? '#10b981' : focused ? GOLD : 'rgba(255,255,255,0.62)',
          fontFamily: JOST,
          fontWeight: 300,
        }}>
        {label}{required && <span style={{ color: GOLD, marginLeft: '2px' }}>*</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        required={required} disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent outline-none pr-20 mt-4"
        style={{ color: 'rgba(255,255,255,0.95)', fontFamily: JOST, fontSize: '14px', fontWeight: 300, letterSpacing: '0.03em', caretColor: GOLD }}
      />
      {suffix && <div className="absolute right-0 bottom-4">{suffix}</div>}
    </div>
  );
}

function MobileField({ value, onChange, verified, onSendOTP, sending, otpSent }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  verified: boolean; onSendOTP: () => void; sending: boolean; otpSent: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;

  return (
    <div className="relative py-5"
      style={{ borderBottom: `1px solid ${verified ? '#10b98160' : focused ? `${GOLD}60` : 'rgba(255,255,255,0.1)'}`, transition: 'border-color 0.3s ease' }}>
      <label className="absolute left-0 pointer-events-none transition-all duration-300 ease-out"
        style={{
          top: raised ? '4px' : '20px',
          fontSize: raised ? '9px' : '13px',
          letterSpacing: raised ? '0.18em' : '0.04em',
          textTransform: raised ? 'uppercase' : 'none',
          color: verified ? '#10b981' : focused ? GOLD : 'rgba(255,255,255,0.62)',
          fontFamily: JOST, fontWeight: 300,
        }}>
        Mobile Number <span style={{ color: 'rgba(255,255,255,0.50)', fontSize: '11px' }}>(optional)</span>
      </label>
      <div className="flex items-center mt-4">
        <span className="mr-2 flex-shrink-0 text-sm" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: JOST, fontWeight: 300 }}>🇮🇳 +91</span>
        <input type="tel" name="mobile" value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          disabled={verified} maxLength={10}
          className="flex-1 bg-transparent outline-none min-w-0"
          style={{ color: 'rgba(255,255,255,0.95)', fontFamily: JOST, fontSize: '14px', fontWeight: 300, letterSpacing: '0.06em', caretColor: GOLD }}
        />
        <div className="flex-shrink-0 ml-2">
          {!verified && value.length === 10 && (
            <GoldInlineBtn onClick={onSendOTP} disabled={sending} loading={sending} label={otpSent ? 'Resend' : 'Verify'} />
          )}
          {verified && <VerifiedChip />}
        </div>
      </div>
    </div>
  );
}

function GoldInlineBtn({ onClick, disabled, loading, label }: { onClick: () => void; disabled: boolean; loading: boolean; label: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="transition-all duration-300"
      style={{
        fontFamily: JOST, fontSize: '10px', letterSpacing: '0.2em', fontWeight: 400,
        textTransform: 'uppercase', color: GOLD, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '4px 0',
      }}>
      {loading ? '…' : label}
    </button>
  );
}

function VerifiedChip() {
  return (
    <div className="flex items-center gap-1" style={{ color: '#10b981' }}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      <span style={{ fontFamily: JOST, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Verified</span>
    </div>
  );
}

function EyeBtn({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{ color: 'rgba(255,255,255,0.50)', transition: 'color 0.2s' }}
      onMouseEnter={e => ((e.target as HTMLElement).style.color = GOLD)}
      onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.50)')}>
      {show ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
      )}
    </button>
  );
}

function OTPBox({ hint, otp, loading, onChange, onVerify }: {
  hint: string; otp: string; loading: boolean;
  onChange: (v: string) => void; onVerify: () => void;
}) {
  return (
    <div className="mt-3 mb-2 overflow-hidden"
      style={{ background: 'rgba(201,168,76,0.05)', border: `1px solid ${BORDER}` }}>
      {loading && (
        <div className="h-[1px] overflow-hidden">
          <div className="h-full w-2/5" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, animation: 'progressBar 1.4s ease-in-out infinite' }} />
        </div>
      )}
      <div className="px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: GOLD, fontFamily: JOST }}>{hint}</p>
        <div className="flex items-center gap-3">
          <input type="text" inputMode="numeric" value={otp} maxLength={6}
            onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="— — — — — —"
            className="flex-1 bg-transparent outline-none text-center text-base"
            style={{
              color: 'rgba(255,255,255,0.92)', fontFamily: JOST, letterSpacing: '0.4em', fontWeight: 300,
              borderBottom: `1px solid rgba(255,255,255,0.12)`, paddingBottom: '6px',
              caretColor: GOLD,
            }}
          />
          <button type="button" onClick={onVerify} disabled={loading || otp.length !== 6}
            className="transition-all duration-300 ease-out"
            style={{
              fontFamily: JOST, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: loading || otp.length !== 6 ? 'rgba(201,168,76,0.35)' : GOLD,
              padding: '6px 14px',
              border: `1px solid ${loading || otp.length !== 6 ? BORDER : `${GOLD}50`}`,
              cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
            }}>
            {loading ? '…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  return <p className="text-[11px] pt-1.5 tracking-wide" style={{ color: '#f87171', fontFamily: JOST }}>{msg}</p>;
}
