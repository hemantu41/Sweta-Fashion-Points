'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

const gold     = '#C9A84C';
const burgundy = '#7B1C2E';

type Tab = 'password' | 'otp';

const labelClass =
  'block text-[10px] font-semibold tracking-[0.18em] uppercase text-[#7B1C2E] mb-1';
const inputClass =
  'w-full bg-transparent border-0 border-b border-[#C9A84C]/35 focus:border-[#C9A84C] outline-none py-2.5 text-[#1A1A1A] text-sm transition-colors duration-200 placeholder:text-[#bbb]';

/* ── Ornament ── */
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

/* ── Main form (needs useSearchParams so wrapped in Suspense) ── */
function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get('callbackUrl') || '/';
  const { login }    = useAuth();

  const [tab,        setTab]        = useState<Tab>('password');
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [otp,        setOtp]        = useState('');
  const [otpSent,    setOtpSent]    = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  const switchTab = (t: Tab) => {
    setTab(t); setOtpSent(false); setOtp(''); setError(''); setSuccess('');
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
      if (res.ok) { login(data.user); setSuccess('Login successful! Redirecting…'); setTimeout(() => router.push(callbackUrl), 900); }
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
      if (res.ok) { login(data.user); setSuccess('Login successful! Redirecting…'); setTimeout(() => router.push(callbackUrl), 900); }
      else          setError(data.error || 'Invalid credentials');
    } catch { setError('Network error. Please try again.'); }
    finally  { setIsLoading(false); }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-10 px-4"
      style={{ background: '#FAF8F5', fontFamily: "'Jost', sans-serif" }}
    >
      {/* ── Logo block ── */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="w-16 h-16 flex items-center justify-center mb-3"
          style={{ border: `1px solid ${gold}55` }}
        >
          <Image src="/images/logo.png" alt="Sweta Fashion Points" width={48} height={48} className="object-contain" />
        </div>
        <p
          className="text-lg font-light tracking-[0.1em] text-[#1A1A1A]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Sweta Fashion Points
        </p>
        <p className="text-[9px] tracking-[0.25em] uppercase mt-0.5" style={{ color: `${gold}99` }}>
          Amas · Gaya · Bihar
        </p>
      </div>

      {/* ── Card ── */}
      <div
        className="w-full max-w-sm bg-white rounded-sm px-8 py-10"
        style={{ boxShadow: '0 1px 24px rgba(0,0,0,0.06)' }}
      >
        {/* Heading */}
        <div className="text-center mb-8">
          <Ornament />
          <Divider />
          <h1
            className="text-[2.1rem] font-light text-[#1A1A1A] tracking-[0.03em] leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Welcome Back
          </h1>
          <p className="text-[10px] tracking-[0.22em] uppercase mt-1.5" style={{ color: gold }}>
            Login to your account
          </p>
        </div>

        {/* ── Tab switcher ── */}
        <div className="flex mb-7 border-b border-[#C9A84C]/20">
          {(['password', 'otp'] as Tab[]).map(t => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className="flex-1 pb-3 text-[10px] font-semibold tracking-[0.18em] uppercase relative transition-colors duration-200"
                style={{ fontFamily: "'Jost', sans-serif", color: active ? burgundy : '#bbb' }}
              >
                {t === 'password' ? 'Password' : 'Email OTP'}
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: gold }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ════ PASSWORD TAB ════ */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-5">

            <div>
              <label className={labelClass}>Email or Mobile</label>
              <input
                type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                required placeholder="Enter email or mobile number"
                className={inputClass} style={{ fontFamily: "'Jost', sans-serif" }}
              />
            </div>

            <div>
              <div className="flex items-end justify-between mb-1">
                <label className={labelClass} style={{ marginBottom: 0 }}>Password</label>
                <button
                  type="button"
                  className="text-[10px] tracking-wide hover:opacity-70 transition-opacity"
                  style={{ color: `${gold}99`, fontFamily: "'Jost', sans-serif" }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-end">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  required placeholder="Enter your password"
                  className={`${inputClass} pr-8`} style={{ fontFamily: "'Jost', sans-serif" }}
                />
                <button
                  type="button" onClick={() => setShowPass(p => !p)} tabIndex={-1}
                  className="absolute right-0 bottom-2.5 transition-opacity hover:opacity-70"
                  style={{ color: gold }}
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

            {error   && <div className="border-l-2 pl-3 py-2 text-sm" style={{ borderColor: burgundy, color: burgundy, background: '#7b1c2e07' }}>{error}</div>}
            {success && <div className="border-l-2 pl-3 py-2 text-sm border-emerald-500 text-emerald-700 bg-emerald-50">{success}</div>}

            <button
              type="submit" disabled={isLoading}
              style={{ fontFamily: "'Jost', sans-serif", background: isLoading ? `${burgundy}70` : burgundy, color: gold, letterSpacing: '0.2em', borderRadius: 2, transition: 'background 0.2s' }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#9b2438'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isLoading ? `${burgundy}70` : burgundy; }}
              className="w-full py-3.5 mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <><Spinner /> Signing in…</> : 'Login'}
            </button>
          </form>
        )}

        {/* ════ OTP TAB ════ */}
        {tab === 'otp' && (
          <form onSubmit={handleOtpLogin} className="space-y-5">

            <div>
              <label className={labelClass}>Email Address</label>
              <div className="flex items-end gap-3">
                <input
                  type="email" value={identifier} onChange={e => setIdentifier(e.target.value)}
                  required disabled={otpSent} placeholder="Enter your email"
                  className={`flex-1 ${inputClass} disabled:opacity-70`}
                  style={{ fontFamily: "'Jost', sans-serif" }}
                />
                {!otpSent ? (
                  <button
                    type="button" onClick={handleSendOtp}
                    disabled={isLoading || !identifier}
                    className="pb-2.5 text-[10px] font-semibold tracking-[0.15em] uppercase transition-opacity disabled:opacity-40 whitespace-nowrap"
                    style={{ color: burgundy, fontFamily: "'Jost', sans-serif" }}
                  >
                    {isLoading ? '…' : 'Send OTP'}
                  </button>
                ) : (
                  <button
                    type="button" onClick={() => { setOtpSent(false); setOtp(''); setSuccess(''); }}
                    className="pb-2.5 text-[10px] font-semibold tracking-[0.12em] uppercase transition-opacity hover:opacity-70 whitespace-nowrap"
                    style={{ color: `${gold}99`, fontFamily: "'Jost', sans-serif" }}
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
                    type="button" onClick={handleSendOtp} disabled={isLoading}
                    className="text-[10px] tracking-wide hover:opacity-70 transition-opacity disabled:opacity-40"
                    style={{ color: `${gold}99`, fontFamily: "'Jost', sans-serif" }}
                  >
                    Resend
                  </button>
                </div>
                <input
                  type="text" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required maxLength={6} placeholder="— — — — — —"
                  className="w-full bg-transparent border-0 border-b border-[#C9A84C]/35 focus:border-[#C9A84C] outline-none py-2.5 text-center text-xl tracking-[0.5em] text-[#1A1A1A] transition-colors placeholder:text-[#ddd] placeholder:tracking-[0.3em]"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                />
              </div>
            )}

            {error   && <div className="border-l-2 pl-3 py-2 text-sm" style={{ borderColor: burgundy, color: burgundy, background: '#7b1c2e07' }}>{error}</div>}
            {success && <div className="border-l-2 pl-3 py-2 text-sm border-emerald-500 text-emerald-700 bg-emerald-50">{success}</div>}

            {!otpSent ? (
              <button
                type="button" onClick={handleSendOtp}
                disabled={isLoading || !identifier}
                style={{ fontFamily: "'Jost', sans-serif", background: isLoading || !identifier ? `${burgundy}70` : burgundy, color: gold, letterSpacing: '0.2em', borderRadius: 2, transition: 'background 0.2s' }}
                onMouseEnter={e => { if (!isLoading && identifier) (e.currentTarget as HTMLButtonElement).style.background = '#9b2438'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isLoading || !identifier ? `${burgundy}70` : burgundy; }}
                className="w-full py-3.5 mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <><Spinner /> Sending…</> : 'Send OTP'}
              </button>
            ) : (
              <button
                type="submit" disabled={isLoading}
                style={{ fontFamily: "'Jost', sans-serif", background: isLoading ? `${burgundy}70` : burgundy, color: gold, letterSpacing: '0.2em', borderRadius: 2, transition: 'background 0.2s' }}
                onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#9b2438'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isLoading ? `${burgundy}70` : burgundy; }}
                className="w-full py-3.5 mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <><Spinner /> Verifying…</> : 'Verify & Login'}
              </button>
            )}
          </form>
        )}

        {/* Footer */}
        <p className="mt-7 text-center text-[11px]" style={{ color: '#aaa' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: gold }} className="underline underline-offset-2 hover:opacity-80 transition-opacity">
            Sign Up
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
