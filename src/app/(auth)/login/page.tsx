'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

const gold     = '#C9A84C';
const burgundy = '#7B1C2E';
const black    = '#0A0A0A';

type LoginMethod = 'password' | 'otp';

/* ── Shared ornament (same as signup) ── */
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

/* ── Spinner ── */
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const labelClass =
  'block text-[10px] font-semibold tracking-[0.18em] uppercase text-[#7B1C2E] mb-1';
const inputClass =
  'w-full bg-transparent border-0 border-b border-[#C9A84C]/40 focus:border-[#C9A84C] outline-none py-2.5 text-[#0A0A0A] text-sm transition-colors duration-200 placeholder:text-[#bbb]';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const { login } = useAuth();

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [identifier, setIdentifier]   = useState('');
  const [password,   setPassword]     = useState('');
  const [showPass,   setShowPass]     = useState(false);
  const [otp,        setOtp]          = useState('');
  const [otpSent,    setOtpSent]      = useState(false);
  const [isLoading,  setIsLoading]    = useState(false);
  const [error,      setError]        = useState('');
  const [success,    setSuccess]      = useState('');

  const switchTab = (method: LoginMethod) => {
    setLoginMethod(method);
    setOtpSent(false); setOtp(''); setError(''); setSuccess('');
  };

  /* ── Send OTP ── */
  const handleSendOtp = async () => {
    setError(''); setSuccess('');
    if (!identifier) { setError('Please enter your email address'); return; }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: identifier }) });
      const data = await res.json();
      if (res.ok) { setOtpSent(true); setSuccess('OTP sent to your email'); }
      else          setError(data.error || 'Failed to send OTP');
    } catch { setError('Network error. Please try again.'); }
    finally  { setIsLoading(false); }
  };

  /* ── OTP Login ── */
  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!otp || otp.length !== 6) { setError('Please enter a valid 6-digit OTP'); return; }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: identifier, otp }) });
      const data = await res.json();
      if (res.ok) { login(data.user); setSuccess('Login successful! Redirecting…'); setTimeout(() => router.push(callbackUrl), 1000); }
      else          setError(data.error || 'Invalid OTP');
    } catch { setError('Network error. Please try again.'); }
    finally  { setIsLoading(false); }
  };

  /* ── Password Login ── */
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!identifier || !password) { setError('Please fill in all fields'); return; }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }) });
      const data = await res.json();
      if (res.ok) { login(data.user); setSuccess('Login successful! Redirecting…'); setTimeout(() => router.push(callbackUrl), 1000); }
      else          setError(data.error || 'Invalid credentials');
    } catch { setError('Network error. Please try again.'); }
    finally  { setIsLoading(false); }
  };

  /* ── Primary CTA button ── */
  const PrimaryBtn = ({ label, loading, loadingLabel, onClick, type = 'submit', disabled = false }: {
    label: string; loading: boolean; loadingLabel: string;
    onClick?: () => void; type?: 'submit' | 'button'; disabled?: boolean;
  }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      style={{ fontFamily: "'Jost', sans-serif", background: burgundy, color: gold, letterSpacing: '0.22em', borderRadius: 4, transition: 'background 0.2s' }}
      onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#9b2438'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = burgundy; }}
      className="w-full py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? <><Spinner />{loadingLabel}</> : label}
    </button>
  );

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Jost', sans-serif" }}>

      {/* ══════════════════════════════════
          LEFT PANEL — Dark luxury editorial
          ══════════════════════════════════ */}
      <div
        className="hidden lg:flex w-[45%] flex-shrink-0 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0A0A0A 0%, #1a0610 50%, #0A0A0A 100%)' }}
      >
        {/* Corner ornaments */}
        {['top-6 left-6', 'top-6 right-6 rotate-90', 'bottom-6 left-6 -rotate-90', 'bottom-6 right-6 rotate-180'].map((pos, i) => (
          <svg key={i} className={`absolute ${pos} w-8 h-8 opacity-40`} viewBox="0 0 32 32" fill="none">
            <path d="M2 2 L12 2 L2 12" stroke={gold} strokeWidth="1.2" />
            <path d="M2 2 L2 8"  stroke={gold} strokeWidth="0.6" />
            <path d="M2 2 L8 2"  stroke={gold} strokeWidth="0.6" />
          </svg>
        ))}

        {/* Vertical gold line accents */}
        <div className="absolute left-12 top-16 bottom-16 w-px" style={{ background: `linear-gradient(to bottom, transparent, ${gold}55, transparent)` }} />
        <div className="absolute right-12 top-16 bottom-16 w-px" style={{ background: `linear-gradient(to bottom, transparent, ${gold}55, transparent)` }} />

        {/* Centre content */}
        <div className="relative z-10 flex flex-col items-center px-12 text-center">

          {/* Logo with gold ornamental frame */}
          <div className="relative mb-8">
            <div className="absolute inset-0 -m-5 rounded-full border border-[#C9A84C]/25" />
            <div className="absolute inset-0 -m-9 rounded-full border border-[#C9A84C]/12" />
            <div
              className="w-36 h-36 flex items-center justify-center relative"
              style={{ border: `1px solid ${gold}60`, boxShadow: `0 0 0 4px #0A0A0A, 0 0 0 5px ${gold}35`, background: 'rgba(201,168,76,0.04)' }}
            >
              <svg className="absolute top-0 left-0 w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M1 1 L8 1 L1 8" stroke={gold} strokeWidth="1" />
              </svg>
              <svg className="absolute bottom-0 right-0 w-5 h-5 rotate-180" viewBox="0 0 20 20" fill="none">
                <path d="M1 1 L8 1 L1 8" stroke={gold} strokeWidth="1" />
              </svg>
              <Link href="/">
                <Image src="/images/logo.png" alt="Sweta Fashion Points" width={100} height={100} className="object-contain" />
              </Link>
            </div>
          </div>

          {/* Brand name */}
          <h2 className="text-3xl font-light tracking-[0.12em] text-white mb-1 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Sweta
          </h2>
          <h2 className="text-3xl font-light tracking-[0.12em] mb-1 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", color: gold }}>
            Fashion Points
          </h2>

          {/* Gold divider */}
          <div className="flex items-center gap-3 my-5 w-44">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${gold}80)` }} />
            <svg width="8" height="8" viewBox="0 0 8 8"><rect x="1" y="1" width="6" height="6" fill="none" stroke={gold} strokeWidth="0.8" transform="rotate(45 4 4)" /></svg>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${gold}80)` }} />
          </div>

          {/* Tagline */}
          <p className="text-base italic font-light text-white/60 tracking-wide leading-relaxed max-w-[220px]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            "Premium Fashion,<br />Delivered to You"
          </p>

          <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 font-light mt-5">
            fashionpoints.co.in
          </p>
        </div>

        {/* Bottom tagline */}
        <p className="absolute bottom-8 text-[11px] italic tracking-widest text-white/20" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Amas · Gaya · Bihar
        </p>
      </div>

      {/* ══════════════════════════════════
          RIGHT PANEL — Login Form
          ══════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ background: '#FAF8F5' }}>

        {/* Mobile-only header */}
        <div className="lg:hidden flex items-center justify-center py-6 px-6" style={{ background: black }}>
          <div className="flex items-center gap-3">
            <div style={{ border: `1px solid ${gold}50`, padding: 6 }}>
              <Link href="/">
                <Image src="/images/logo.png" alt="Sweta Fashion Points" width={36} height={36} className="object-contain" />
              </Link>
            </div>
            <div>
              <p className="text-white text-sm font-light tracking-[0.12em]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Sweta Fashion Points
              </p>
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: gold, opacity: 0.7 }}>
                fashionpoints.co.in
              </p>
            </div>
          </div>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm">

            {/* Ornament + heading */}
            <div className="mb-8 text-center">
              <OrnamentSVG />

              {/* Gold thin divider */}
              <div className="flex items-center gap-3 mb-5 justify-center">
                <div className="h-px w-16" style={{ background: `linear-gradient(to right, transparent, ${gold}90)` }} />
                <svg width="6" height="6" viewBox="0 0 6 6"><rect x="0.5" y="0.5" width="5" height="5" fill="none" stroke={gold} strokeWidth="0.6" transform="rotate(45 3 3)" /></svg>
                <div className="h-px w-16" style={{ background: `linear-gradient(to left, transparent, ${gold}90)` }} />
              </div>

              <h1 className="text-4xl font-light text-[#0A0A0A] tracking-[0.04em] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Welcome Back
              </h1>
              <p className="text-[11px] tracking-[0.2em] uppercase mt-2" style={{ color: gold }}>
                Sign in to your account
              </p>
            </div>

            {/* ── Underline tabs ── */}
            <div className="flex mb-8 border-b border-[#C9A84C]/20">
              {(['password', 'otp'] as LoginMethod[]).map(tab => {
                const active = loginMethod === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => switchTab(tab)}
                    className="flex-1 pb-3 text-[11px] font-semibold tracking-[0.18em] uppercase transition-all duration-200 relative"
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      color: active ? burgundy : '#aaa',
                    }}
                  >
                    {tab === 'password' ? 'Password' : 'Email OTP'}
                    {active && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                        style={{ background: gold }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ══ PASSWORD TAB ══ */}
            {loginMethod === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-6">
                <div>
                  <label className={labelClass}>Email or Mobile</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                    placeholder="Enter email or mobile number"
                    className={inputClass}
                    style={{ fontFamily: "'Jost', sans-serif" }}
                  />
                </div>

                <div>
                  <div className="flex items-end justify-between mb-1">
                    <label className={labelClass} style={{ marginBottom: 0 }}>Password</label>
                    <button
                      type="button"
                      className="text-[10px] tracking-wide hover:opacity-80 transition-opacity"
                      style={{ color: `${gold}99`, fontFamily: "'Jost', sans-serif" }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-end">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className={`${inputClass} pr-8`}
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    />
                    {/* Eye toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-0 bottom-2.5 transition-opacity hover:opacity-70"
                      style={{ color: gold }}
                      tabIndex={-1}
                    >
                      {showPass ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error   && <div className="border-l-2 pl-3 py-2 text-sm" style={{ borderColor: burgundy, color: burgundy, background: '#7b1c2e08' }}>{error}</div>}
                {success && <div className="border-l-2 pl-3 py-2 text-sm border-emerald-500 text-emerald-700 bg-emerald-50">{success}</div>}

                <PrimaryBtn label="Login" loading={isLoading} loadingLabel="Signing in…" />
              </form>
            )}

            {/* ══ EMAIL OTP TAB ══ */}
            {loginMethod === 'otp' && (
              <form onSubmit={handleOtpLogin} className="space-y-6">
                <div>
                  <label className={labelClass}>Email Address</label>
                  <div className="flex items-end gap-3">
                    <input
                      type="email"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      required
                      disabled={otpSent}
                      placeholder="Enter your email"
                      className={`flex-1 ${inputClass}`}
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    />
                    {!otpSent && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isLoading || !identifier}
                        className="pb-2.5 text-[10px] font-semibold tracking-[0.15em] uppercase transition-colors duration-200 disabled:opacity-40 border-b"
                        style={{ color: burgundy, borderColor: `${burgundy}60`, fontFamily: "'Jost', sans-serif", whiteSpace: 'nowrap' }}
                      >
                        {isLoading ? '…' : 'Send OTP'}
                      </button>
                    )}
                    {otpSent && (
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(''); setSuccess(''); }}
                        className="pb-2.5 text-[10px] font-semibold tracking-[0.12em] uppercase transition-opacity hover:opacity-70"
                        style={{ color: `${gold}99`, fontFamily: "'Jost', sans-serif", whiteSpace: 'nowrap' }}
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <div className="flex items-end justify-between mb-1">
                      <label className={labelClass} style={{ marginBottom: 0 }}>Enter OTP</label>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="text-[10px] tracking-wide hover:opacity-70 transition-opacity disabled:opacity-40"
                        style={{ color: `${gold}99`, fontFamily: "'Jost', sans-serif" }}
                      >
                        Resend
                      </button>
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      placeholder="— — — — — —"
                      className="w-full bg-transparent border-0 border-b border-[#C9A84C]/40 focus:border-[#C9A84C] outline-none py-2.5 text-center text-xl tracking-[0.5em] text-[#0A0A0A] transition-colors duration-200 placeholder:text-[#ddd] placeholder:tracking-[0.3em]"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    />
                  </div>
                )}

                {error   && <div className="border-l-2 pl-3 py-2 text-sm" style={{ borderColor: burgundy, color: burgundy, background: '#7b1c2e08' }}>{error}</div>}
                {success && <div className="border-l-2 pl-3 py-2 text-sm border-emerald-500 text-emerald-700 bg-emerald-50">{success}</div>}

                {!otpSent
                  ? <PrimaryBtn label="Send OTP" loading={isLoading} loadingLabel="Sending…" type="button" onClick={handleSendOtp} disabled={!identifier} />
                  : <PrimaryBtn label="Verify & Login" loading={isLoading} loadingLabel="Verifying…" />
                }
              </form>
            )}

            {/* Footer link */}
            <p className="mt-10 text-center text-[11px] tracking-[0.15em]" style={{ color: `${gold}90` }}>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline underline-offset-2 hover:opacity-100 transition-opacity" style={{ color: gold }}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
