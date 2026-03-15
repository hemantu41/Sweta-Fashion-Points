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
const PANEL  = '#100d0a';
const BORDER = 'rgba(201,168,76,0.35)';
const MUTED  = 'rgba(255,255,255,0.72)';
const DIM    = 'rgba(255,255,255,0.35)';
const LINE   = 'rgba(255,255,255,0.10)';

const CORMORANT = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const JOST      = '"Jost", "Inter", system-ui, sans-serif';

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', location: '', pincode: '', landmark: '', password: '', confirmPassword: '',
  });
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [emailV,  setEmailV]  = useState({ otpSent: false, otp: '', verified: false, loading: false, error: '' });
  const [mobileV, setMobileV] = useState({ otpSent: false, otp: '', verified: false, loading: false, error: '' });

  /* ─── handlers ─────────────────────────────────────────────────────────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({
      ...p,
      [name]: name === 'mobile'  ? value.replace(/\D/g, '').slice(0, 10)
             : name === 'pincode' ? value.replace(/\D/g, '').slice(0, 6)
             : value,
    }));
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
    if (!mobileV.verified)                              { setError('Please verify your mobile number first'); return; }
    if (!/^\d{6}$/.test(formData.pincode))              { setError('Please enter a valid 6-digit PIN code'); return; }
    if (!formData.landmark.trim())                      { setError('Please enter a landmark'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6)                   { setError('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, email: formData.email, mobile: formData.mobile, location: formData.location, pincode: formData.pincode, landmark: formData.landmark, password: formData.password }) });
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
      <div className="hidden lg:flex flex-col lg:w-[44%] xl:w-[46%] flex-shrink-0 relative overflow-hidden px-14 xl:px-18 py-14"
        style={{ background: DARK }}>

        {/* Subtle dot texture */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: `radial-gradient(${GOLD}0a 1px, transparent 1px)`, backgroundSize: '26px 26px' }} />

        {/* Vertical gold rule — right edge */}
        <div className="absolute right-0 top-0 h-full w-px"
          style={{ background: `linear-gradient(to bottom, transparent 5%, ${GOLD}30 30%, ${GOLD}55 55%, ${GOLD}30 80%, transparent 95%)` }} />

        {/* ── Monogram ── */}
        <div className="relative mb-10">
          <div className="w-10 h-10 border flex items-center justify-center mb-5"
            style={{ borderColor: `${GOLD}45` }}>
            <span style={{ color: GOLD, fontFamily: CORMORANT, fontSize: '18px', fontWeight: 400, fontStyle: 'italic' }}>F</span>
          </div>
          <p className="text-[9px] tracking-[0.38em] uppercase font-light" style={{ color: GOLD, fontFamily: JOST }}>
            Sweta Fashion Points
          </p>
        </div>

        {/* ── Main headline ── */}
        <div className="relative flex-1 flex flex-col justify-center">
          <h1 style={{
            fontFamily: CORMORANT,
            fontSize: 'clamp(2.6rem, 4vw, 3.6rem)',
            fontWeight: 300,
            lineHeight: 1.12,
            letterSpacing: '-0.01em',
            marginBottom: '28px',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.92)' }}>Dress with</span><br />
            <em style={{ color: GOLD, fontStyle: 'italic' }}>intention.</em><br />
            <span style={{ color: 'rgba(255,255,255,0.92)' }}>Shop with ease.</span>
          </h1>

          {/* Gold rule divider */}
          <div className="flex items-center gap-3 mb-7">
            <div className="h-px w-8" style={{ background: GOLD }} />
            <div className="h-px flex-1" style={{ background: `${GOLD}20` }} />
          </div>

          {/* Body copy */}
          <p className="text-sm leading-relaxed mb-10 font-light"
            style={{ color: 'rgba(255,255,255,0.82)', fontFamily: JOST, maxWidth: '320px', letterSpacing: '0.01em' }}>
            Premium fashion curated from Bharat&apos;s finest collections, delivered to your doorstep.
          </p>

          {/* Bullet list */}
          <ul className="space-y-3.5">
            {[
              'Exclusive membership collections',
              'Fast local delivery — 48hrs & nearby districts',
              'Curated pieces, ethnic & western wear',
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-[5px]" style={{ color: GOLD, fontSize: '6px' }}>◆</span>
                <span className="text-[13px] font-light leading-snug"
                  style={{ color: 'rgba(255,255,255,0.86)', fontFamily: JOST, letterSpacing: '0.01em' }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Bottom copyright ── */}
        <p className="relative text-[9px] tracking-[0.22em] uppercase mt-10" style={{ color: DIM, fontFamily: JOST }}>
          © 2026 Sweta Fashion Points
        </p>
      </div>

      {/* ══════════ RIGHT FORM PANEL ══════════ */}
      <div className="flex-1 overflow-y-auto" style={{ background: PANEL }}>
        <div className="min-h-full flex flex-col justify-center px-8 sm:px-12 xl:px-14 py-12 max-w-[480px] mx-auto w-full">

          {/* Mobile brand header */}
          <div className="lg:hidden mb-8">
            <div className="w-9 h-9 border flex items-center justify-center mb-4"
              style={{ borderColor: `${GOLD}45` }}>
              <span style={{ color: GOLD, fontFamily: CORMORANT, fontSize: '16px', fontStyle: 'italic' }}>F</span>
            </div>
            <p className="text-[9px] tracking-[0.3em] uppercase mb-3 font-light" style={{ color: GOLD, fontFamily: JOST }}>Sweta Fashion Points</p>
            <h2 className="font-light" style={{ fontFamily: CORMORANT, fontSize: '2rem', letterSpacing: '-0.01em', color: '#ffffff' }}>Create Account</h2>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <p className="tracking-[0.32em] uppercase mb-4 font-light" style={{ color: GOLD, fontFamily: JOST, fontSize: '11px' }}>
              Member Access
            </p>
            <h2 className="font-light"
              style={{ fontFamily: CORMORANT, fontSize: 'clamp(1.9rem, 3vw, 2.6rem)', letterSpacing: '-0.02em', lineHeight: 1.1, color: '#ffffff' }}>
              Create Account
            </h2>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full Name */}
            <StaticField label="Full Name" name="name" type="text"
              value={formData.name} onChange={handleChange}
              placeholder="Your full name" required />

            {/* Email */}
            <div>
              <StaticField label="Email Address" name="email" type="email"
                value={formData.email} onChange={handleChange}
                placeholder="your@email.com" required
                disabled={emailV.verified} verified={emailV.verified}
                suffix={
                  !emailV.verified
                    ? <GoldInlineBtn onClick={sendEmailOTP} disabled={emailV.loading || !formData.email} loading={emailV.loading} label={emailV.otpSent ? 'Resend' : 'Verify'} />
                    : <VerifiedChip />
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

            {/* City */}
            <StaticField label="City / Town" name="location" type="text"
              value={formData.location} onChange={handleChange}
              placeholder="Your city or town" required />

            {/* Pincode */}
            <StaticField label="PIN Code" name="pincode" type="text" inputMode="numeric"
              value={formData.pincode} onChange={handleChange}
              placeholder="6-digit PIN code" required />

            {/* Landmark */}
            <StaticField label="Landmark" name="landmark" type="text"
              value={formData.landmark} onChange={handleChange}
              placeholder="Nearby landmark" required />

            {/* Password */}
            <div>
              <StaticField label="Password" name="password" type={showPass ? 'text' : 'password'}
                value={formData.password} onChange={handleChange}
                placeholder="Minimum 6 characters" required
                suffix={<EyeBtn show={showPass} onToggle={() => setShowPass(p => !p)} />}
              />
              {pw && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="h-px flex-1 rounded-full transition-all duration-500"
                        style={{ background: i <= pwScore ? pwColor : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  {pwLabel && <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: pwColor, fontFamily: JOST }}>{pwLabel}</p>}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <StaticField label="Confirm Password" name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                value={formData.confirmPassword} onChange={handleChange}
                placeholder="Re-enter password" required
                suffix={<EyeBtn show={showConfirm} onToggle={() => setShowConfirm(p => !p)} />}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-[11px] mt-1" style={{ color: '#ef4444', fontFamily: JOST }}>Passwords do not match</p>
              )}
            </div>

            {/* ── Verify notices ── */}
            {(!emailV.verified || !mobileV.verified) && (
              <div className="flex items-start gap-2.5 py-3 px-3.5"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="#f87171" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(248,113,113,0.90)', fontFamily: JOST, fontWeight: 300 }}>
                  {!emailV.verified && !mobileV.verified
                    ? 'Please verify your email and mobile number before creating your account'
                    : !emailV.verified
                    ? 'Please verify your email before creating your account'
                    : 'Please verify your mobile number before creating your account'}
                </p>
              </div>
            )}

            {/* ── Messages ── */}
            {error && (
              <div className="flex items-start gap-2.5 py-3 px-3.5"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="#f87171" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-[11px]" style={{ color: 'rgba(248,113,113,0.90)', fontFamily: JOST }}>{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2.5 py-3 px-3.5"
                style={{ background: 'rgba(201,168,76,0.08)', border: `1px solid ${BORDER}` }}>
                <div className="w-px h-4 rounded-full flex-shrink-0" style={{ background: GOLD }} />
                <p className="text-[11px]" style={{ color: GOLD, fontFamily: JOST }}>{success}</p>
              </div>
            )}

            {/* ── CTA ── */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !emailV.verified}
                className="relative w-full overflow-hidden group shimmer-btn"
                style={{
                  height: '50px',
                  background: `linear-gradient(135deg, ${GOLD} 0%, #ddb84e 50%, ${GOLD} 100%)`,
                  opacity: isLoading || !emailV.verified ? 0.45 : 1,
                  cursor: isLoading || !emailV.verified ? 'not-allowed' : 'pointer',
                }}>

                {/* Shimmer sweep */}
                <style>{`
                  @keyframes shimmerSweep {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(220%); }
                  }
                  .shimmer-btn:hover .shimmer-sweep {
                    animation: shimmerSweep 0.65s ease-out forwards;
                  }
                `}</style>
                <span className="shimmer-sweep absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.30) 50%, transparent 70%)', transform: 'translateX(-100%)' }} />

                {isLoading ? (
                  <span className="relative flex items-center justify-center gap-2"
                    style={{ color: DARK, fontFamily: JOST, fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase' }}>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Creating Account…
                  </span>
                ) : (
                  <span className="relative flex items-center justify-center gap-3 transition-all duration-300"
                    style={{ color: DARK, fontFamily: JOST, fontSize: '11px', letterSpacing: '0.32em', fontWeight: 500, textTransform: 'uppercase' }}>
                    Create My Account
                    <svg className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                )}
              </button>
            </div>

          </form>

          {/* ── Footer ── */}
          <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${LINE}` }}>
            <p className="text-center text-[12px]"
              style={{ fontFamily: JOST, color: MUTED, letterSpacing: '0.03em' }}>
              Already a member?{' '}
              <Link href="/login"
                className="transition-colors duration-300"
                style={{ color: GOLD }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = '#e0c570')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = GOLD)}>
                Sign in
              </Link>
            </p>
            <p className="text-center mt-2.5 text-[10px]"
              style={{ fontFamily: JOST, color: DIM, letterSpacing: '0.05em' }}>
              By joining you agree to our{' '}
              <Link href="/terms-and-conditions" className="underline underline-offset-2"
                style={{ color: 'rgba(255,255,255,0.52)' }}>Terms</Link>
              {' '}&amp;{' '}
              <Link href="/return-policy" className="underline underline-offset-2"
                style={{ color: 'rgba(255,255,255,0.52)' }}>Privacy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Sub-components
══════════════════════════════════════════════════════════════════════════ */

function StaticField({ label, name, type, value, onChange, placeholder, required, disabled, verified, suffix, inputMode }: {
  label: string; name: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean; disabled?: boolean; verified?: boolean; suffix?: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block mb-1.5"
        style={{
          fontFamily: JOST, fontSize: '9px', letterSpacing: '0.28em',
          textTransform: 'uppercase', fontWeight: 400,
          color: verified ? '#10b981' : focused ? GOLD : 'rgba(201,168,76,0.75)',
          transition: 'color 0.2s',
        }}>
        {label}
      </label>
      <div className="flex items-center"
        style={{
          borderBottom: `1px solid ${verified ? '#10b98155' : focused ? `${GOLD}65` : LINE}`,
          paddingBottom: '8px',
          transition: 'border-color 0.25s',
        }}>
        <input
          type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder} required={required} disabled={disabled}
          inputMode={inputMode}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none min-w-0"
          style={{
            color: 'rgba(255,255,255,0.88)', fontFamily: JOST, fontSize: '13px',
            fontWeight: 300, letterSpacing: '0.02em', caretColor: GOLD,
          }}
        />
        {suffix && <div className="flex-shrink-0 ml-3">{suffix}</div>}
      </div>
    </div>
  );
}

function MobileField({ value, onChange, verified, onSendOTP, sending, otpSent }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  verified: boolean; onSendOTP: () => void; sending: boolean; otpSent: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block mb-1.5"
        style={{
          fontFamily: JOST, fontSize: '9px', letterSpacing: '0.28em',
          textTransform: 'uppercase', fontWeight: 400,
          color: verified ? '#10b981' : focused ? GOLD : 'rgba(201,168,76,0.75)',
          transition: 'color 0.2s',
        }}>
        Mobile Number
      </label>
      <div className="flex items-center"
        style={{
          borderBottom: `1px solid ${verified ? '#10b98155' : focused ? `${GOLD}65` : LINE}`,
          paddingBottom: '8px',
          transition: 'border-color 0.25s',
        }}>
        <span className="flex-shrink-0 mr-2 text-sm font-light" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: JOST }}>🇮🇳 +91</span>
        <input type="tel" name="mobile" value={value} onChange={onChange}
          placeholder="10-digit number"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          disabled={verified} maxLength={10}
          className="flex-1 bg-transparent outline-none min-w-0"
          style={{ color: 'rgba(255,255,255,0.88)', fontFamily: JOST, fontSize: '13px', fontWeight: 300, letterSpacing: '0.06em', caretColor: GOLD }}
        />
        <div className="flex-shrink-0 ml-3">
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
        fontFamily: JOST, fontSize: '9px', letterSpacing: '0.22em', fontWeight: 400,
        textTransform: 'uppercase', color: GOLD,
        opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '3px 0',
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
      <span style={{ fontFamily: JOST, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Verified</span>
    </div>
  );
}

function EyeBtn({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      style={{ color: 'rgba(255,255,255,0.42)', transition: 'color 0.2s' }}
      onMouseEnter={e => ((e.target as HTMLElement).style.color = GOLD)}
      onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.42)')}>
      {show ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      )}
    </button>
  );
}

function OTPBox({ hint, otp, loading, onChange, onVerify }: {
  hint: string; otp: string; loading: boolean;
  onChange: (v: string) => void; onVerify: () => void;
}) {
  return (
    <div className="mt-3 mb-1 overflow-hidden"
      style={{ background: 'rgba(201,168,76,0.05)', border: `1px solid ${BORDER}` }}>
      {loading && (
        <div className="h-px overflow-hidden">
          <div className="h-full w-2/5"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, animation: 'progressBar 1.4s ease-in-out infinite' }} />
        </div>
      )}
      <div className="px-4 py-4">
        <p className="text-[9px] uppercase tracking-[0.22em] mb-3" style={{ color: GOLD, fontFamily: JOST }}>{hint}</p>
        <div className="flex items-center gap-3">
          <input type="text" inputMode="numeric" value={otp} maxLength={6}
            onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="— — — — — —"
            className="flex-1 bg-transparent outline-none text-center text-base"
            style={{
              color: 'rgba(255,255,255,0.90)', fontFamily: JOST, letterSpacing: '0.35em', fontWeight: 300,
              borderBottom: `1px solid ${LINE}`, paddingBottom: '6px', caretColor: GOLD,
            }}
          />
          <button type="button" onClick={onVerify} disabled={loading || otp.length !== 6}
            className="transition-all duration-300 ease-out"
            style={{
              fontFamily: JOST, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: loading || otp.length !== 6 ? 'rgba(201,168,76,0.30)' : GOLD,
              padding: '6px 12px',
              border: `1px solid ${loading || otp.length !== 6 ? BORDER : `${GOLD}55`}`,
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
  return <p className="text-[11px] mt-1.5 tracking-wide" style={{ color: '#f87171', fontFamily: JOST }}>{msg}</p>;
}
