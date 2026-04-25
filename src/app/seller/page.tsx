'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';

/* ─── Color Tokens ────────────────────────────────────────────────────────── */
const C = {
  primary: '#5B1A3A',
  primaryLight: '#7A2350',
  primaryDark: '#3D0E2A',
  primaryDeep: '#1F0E17',
  accent: '#C49A3C',
  accentLight: '#DDB868',
  accentSubtle: 'rgba(196,154,60,0.08)',
  bgWarm: '#FAF7F8',
  bgCard: '#FFFFFF',
  bgAlt: '#F5EDF2',
  heading: '#5B1A3A',
  body: '#555555',
  muted: '#888888',
  placeholder: '#999999',
  borderSubtle: 'rgba(196,154,60,0.08)',
  borderMedium: 'rgba(196,154,60,0.15)',
  shadowCard: '0 8px 40px rgba(91,26,58,0.04)',
  shadowHover: '0 20px 50px rgba(91,26,58,0.1)',
};

const FONT_PLAYFAIR = "var(--font-playfair), 'Playfair Display', Georgia, serif";
const FONT_BODY = "'DM Sans', var(--font-lato), sans-serif";

/* ─── CSS Keyframes (injected once) ──────────────────────────────────────── */
const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
@keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
.shimmer-text{background:linear-gradient(90deg,#C49A3C 0%,#DDB868 40%,#C49A3C 80%);background-size:200% auto;animation:shimmer 3s linear infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.float-1{animation:float 4s ease-in-out infinite}
.float-2{animation:float 4s ease-in-out infinite;animation-delay:2s}
.hover-lift{transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease}
.hover-lift:hover{transform:translateY(-6px);box-shadow:${C.shadowHover}}
`;

/* ─── Data ────────────────────────────────────────────────────────────────── */
const STATS = [
  { num: 'Thousands of', label: 'Sellers trust us to grow online', grad: `linear-gradient(135deg,${C.accent},${C.accentLight})` },
  { num: 'Lakhs of', label: 'Customers buying across India', grad: `linear-gradient(135deg,${C.primary},${C.primaryLight})` },
  { num: '19,000+', label: 'Pincodes served — we deliver everywhere', grad: `linear-gradient(135deg,#6B1B4A,#8B2D5E)` },
  { num: '50+', label: 'Fashion categories to sell online', grad: `linear-gradient(135deg,#8B6B3C,${C.accent})` },
];

const BENEFITS = [
  { icon: '', title: '0% Commission Fee', hi: '0% कमीशन', desc: 'Keep 100% of your profit for the first 6 months. No hidden charges, no deductions, no surprises.' },
  { icon: '', title: '7-Day Fast Payments', hi: '7 दिन में भुगतान', desc: 'Receive payments within 7 days of delivery — including COD orders. Trusted sellers unlock 5-day payouts.' },
  { icon: '', title: 'Your Real Shop Identity', hi: 'आपकी असली दुकान पहचान', desc: 'Customers see YOUR shop name, photo & story. Build your brand identity — not just sell products.' },
  { icon: '', title: 'Free Fabric Verification', hi: 'मुफ्त कपड़ा जांच', desc: 'First 10 products verified FREE. Verified products earn more trust, more orders, and fewer returns.' },
  { icon: '', title: 'Zero Penalty Policy', hi: 'शून्य जुर्माना नीति', desc: 'No penalties for order cancellations or late dispatch. We understand the realities of small businesses.' },
  { icon: '', title: 'Effortless Shipping', hi: 'आसान शिपिंग', desc: 'We handle pickup from your doorstep and delivery across India. You focus on your craft — we handle the logistics.' },
];

const STEPS = [
  { title: 'Register for FREE', hi: 'मुफ्त रजिस्टर करें', desc: 'Phone number, GST or PAN, bank details — that\'s all. Done in under 10 minutes.' },
  { title: 'List Your Products', hi: 'प्रोडक्ट लिस्ट करें', desc: 'Upload photos & videos. Our team assists with descriptions, pricing, and Fabric Verification.' },
  { title: 'Receive Orders', hi: 'ऑर्डर प्राप्त करें', desc: 'Customers from across India discover your products. Instant WhatsApp notifications for every order.' },
  { title: 'Pack & We Ship', hi: 'पैक करें, हम भेजेंगे', desc: 'Pack the order. Our logistics partner picks it up from your shop. We handle everything after that.' },
  { title: 'Get Paid Quickly', hi: 'जल्दी भुगतान पाएं', desc: 'Money deposited to your bank within 7 days. Full transparency in your seller dashboard.' },
];

const FAQS = [
  { q: 'What documents do I need to register?', a: 'You need a mobile number, GST number (or PAN card if turnover is below ₹40 lakh), and bank account details. That\'s it — no complex paperwork required.' },
  { q: 'Is there any registration fee?', a: 'Absolutely not. Registration on Insta Fashion Points is completely FREE with no hidden charges at any stage.' },
  { q: 'I don\'t have GST. Can I still sell?', a: 'Yes! If your annual turnover is below ₹40 lakh, you can register with just your PAN card. We welcome sellers of all sizes.' },
  { q: 'How and when will I get paid?', a: 'Payments are deposited directly to your bank account within 7 days of delivery confirmation, including COD orders. Trusted sellers get upgraded to 5-day payouts.' },
  { q: 'What is the Fabric Verified Badge?', a: 'Our team physically inspects your fabric quality and awards a trust badge to verified products. This significantly increases customer confidence and order volume. First 10 products are verified FREE.' },
  { q: 'How is Insta Fashion Points different from other platforms?', a: 'We show your REAL shop identity to customers (name, photo, ratings), let you build a loyal follower base, offer occasion-based shopping, and specialize in ethnic wear for Tier 2/3 India. Your customers buy from YOU.' },
];

const APNA_FEATURES = [
  { icon: '', title: 'Your Shop Photo & Name', desc: 'Customers see your real shop identity' },
  { icon: '', title: 'Your Ratings & Reviews', desc: 'Build trust with genuine feedback' },
  { icon: '', title: 'Build Your Followers', desc: 'Grow a loyal customer base' },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const SectionLabel = ({ children }: { children: string }) => (
  <p style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: C.accent, marginBottom: 10 }}>{children}</p>
);

const SectionTitle = ({ children }: { children: string }) => (
  <h2 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 38, fontWeight: 700, color: C.heading, lineHeight: 1.2, margin: 0 }}>{children}</h2>
);

const HindiSub = ({ children }: { children: string }) => (
  <p style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500, color: C.accent, fontStyle: 'italic', marginTop: 6, marginBottom: 0 }}>{children}</p>
);

const GoldDivider = () => (
  <div style={{ maxWidth: 200, margin: '0 auto', height: 1, background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)` }} />
);

const TrustDiamond = ({ text }: { text: string }) => (
  <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 500, color: C.primary, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <span style={{ color: C.accent, fontSize: 8 }}>◆</span> {text}
  </span>
);

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SellerLandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Why Join', href: '#why' },
    { label: 'How it Works', href: '#how' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'No GST?', href: '#faq' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      {/* ═══════════ 1. STICKY NAV ═══════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 1000, height: 70, display: 'flex', alignItems: 'center',
        padding: '0 28px', transition: 'all 0.4s ease',
        background: scrolled ? 'rgba(250,247,248,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid rgba(196,154,60,0.1)` : '1px solid transparent',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/seller" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(91,26,58,0.25)',
            }}>
              <span style={{ fontFamily: FONT_PLAYFAIR, fontSize: 11, fontWeight: 700, color: C.accent }}>IFP</span>
            </div>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontFamily: FONT_PLAYFAIR, fontSize: 17, fontWeight: 700, color: C.primary }}>Insta Fashion Points</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 9, fontWeight: 600, color: C.accent, letterSpacing: 2, textTransform: 'uppercase' }}>SELLER PORTAL</div>
            </div>
          </Link>

          {/* Center nav links — desktop */}
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="desktop-nav">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: '#666', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.primary)} onMouseLeave={e => (e.currentTarget.style.color = '#666')}
              >{l.label}</a>
            ))}
          </div>

          {/* Right buttons */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/login" style={{
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: C.primary, textDecoration: 'none',
              padding: '10px 24px', borderRadius: 10, border: `1.5px solid ${C.primary}`, background: 'transparent',
              transition: 'all 0.3s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.primary; }}
            >Login</Link>
            <Link href="/seller/register" style={{
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none',
              padding: '10px 24px', borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, #AD8530)`,
              boxShadow: '0 4px 18px rgba(196,154,60,0.35)', transition: 'all 0.3s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(196,154,60,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(196,154,60,0.35)'; }}
            >Join as Seller</Link>
          </div>
        </div>
      </nav>

      {/* Mobile nav hide CSS */}
      <style dangerouslySetInnerHTML={{ __html: `@media(max-width:768px){.desktop-nav{display:none!important}}` }} />

      {/* ═══════════ 2. HERO SECTION ═══════════ */}
      <section style={{ background: `linear-gradient(170deg, ${C.bgWarm} 0%, #F5EDF3 40%, ${C.bgAlt} 100%)`, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -100, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,154,60,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -120, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,26,58,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 28px 70px', display: 'flex', gap: 70, flexWrap: 'wrap', alignItems: 'center', position: 'relative' }}>
          {/* Left text */}
          <div style={{ flex: '1 1 500px', minWidth: 300 }}>
            {/* NEW badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 30, padding: '8px 18px',
              boxShadow: '0 2px 15px rgba(0,0,0,0.04)', border: '1px solid rgba(196,154,60,0.12)', marginBottom: 22,
            }}>
              <span style={{ background: C.primary, color: C.accent, fontSize: 9, fontWeight: 700, letterSpacing: 1, borderRadius: 4, padding: '3px 8px', fontFamily: FONT_BODY }}>NEW</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: '#555' }}>GST नहीं है? PAN card से भी बेचें</span>
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 50, fontWeight: 700, lineHeight: 1.12, color: C.heading, margin: '0 0 10px' }}>
              Sell Online to Lakhs{'\n'}of Customers at{' '}
              <span className="shimmer-text">0% Commission</span>
            </h1>

            <p style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: C.accent, fontStyle: 'italic', marginBottom: 16, marginTop: 0 }}>
              लाखों ग्राहकों को ऑनलाइन बेचें — 0% कमीशन पर
            </p>

            <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: '#555', lineHeight: 1.8, maxWidth: 480, marginBottom: 30, marginTop: 0 }}>
              Become an Insta Fashion Points seller and grow your fashion business across India. Your real shop identity. Your products. Your loyal customers.
            </p>

            <p style={{ fontFamily: FONT_PLAYFAIR, fontSize: 22, fontWeight: 600, color: C.primary, fontStyle: 'italic', marginBottom: 28, marginTop: 0 }}>
              &ldquo;Apne Dukandaar se, Online&rdquo;
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
              <Link href="/seller/register" style={{
                fontFamily: FONT_BODY, fontSize: 16, fontWeight: 700, color: '#fff', textDecoration: 'none',
                padding: '16px 36px', borderRadius: 12, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                boxShadow: '0 8px 30px rgba(91,26,58,0.3)', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)', letterSpacing: 0.3,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(91,26,58,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(91,26,58,0.3)'; }}
              >Start Your Online Dukaan — Free</Link>
              <button style={{
                fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: C.primary, cursor: 'pointer',
                padding: '16px 28px', borderRadius: 12, border: '1.5px solid rgba(91,26,58,0.2)', background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              }}>▶ Watch How It Works</button>
            </div>

            {/* Trust markers */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <TrustDiamond text="Free Registration" />
              <TrustDiamond text="No GST Required" />
              <TrustDiamond text="7-Day Payments" />
            </div>
          </div>

          {/* Right visual card */}
          <div style={{ flex: '1 1 400px', minWidth: 300, display: 'flex', justifyContent: 'center', position: 'relative' }}>
            {/* Floating stats */}
            <div className="float-1" style={{
              position: 'absolute', top: 20, right: -10, background: '#fff', borderRadius: 16, padding: '14px 20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: `1px solid ${C.borderSubtle}`, zIndex: 2,
            }}>
              <div style={{ fontFamily: FONT_PLAYFAIR, fontSize: 18, fontWeight: 700, color: C.primary }}>₹2,45,000</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: '#999' }}>Monthly earnings</div>
            </div>
            <div className="float-2" style={{
              position: 'absolute', bottom: 30, left: -10, background: '#fff', borderRadius: 16, padding: '14px 20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: `1px solid ${C.borderSubtle}`, zIndex: 2,
            }}>
              <div style={{ fontFamily: FONT_PLAYFAIR, fontSize: 18, fontWeight: 700, color: C.accent }}>1,200+</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: '#999' }}>Orders this month</div>
            </div>

            {/* Main card */}
            <div style={{
              width: 370, height: 420, borderRadius: 28, overflow: 'hidden', position: 'relative',
              background: `linear-gradient(160deg, ${C.primary} 0%, ${C.primaryLight} 40%, #8B2D5E 100%)`,
              boxShadow: '0 30px 80px rgba(91,26,58,0.25)',
            }}>
              {/* Gold top line */}
              <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)` }} />
              {/* Radial overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 40%, rgba(196,154,60,0.08) 0%, transparent 50%)', pointerEvents: 'none' }} />

              {/* Shop icon + text */}
              <div style={{ textAlign: 'center', paddingTop: 50 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 20, margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, rgba(196,154,60,0.2), rgba(196,154,60,0.1))',
                  border: `2px solid rgba(196,154,60,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
                }}></div>
                <div style={{ fontFamily: FONT_PLAYFAIR, fontSize: 22, fontWeight: 700, color: '#fff' }}>Your Shop</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: C.accent, letterSpacing: 1 }}>Now Online</div>
              </div>

              {/* Seller profile glassmorphism card */}
              <div style={{
                position: 'absolute', bottom: 28, left: 22, right: 22, borderRadius: 18, padding: 20,
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(196,154,60,0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                  }}></div>
                  <div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: '#fff' }}>Ravi Textiles, Gaya</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}> 4.8 · Since 2018 · 342 Followers</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Fabric Verified ', 'Trusted Seller', ' Trending'].map(b => (
                    <span key={b} style={{
                      fontFamily: FONT_BODY, fontSize: 9, fontWeight: 700, color: C.accent,
                      background: 'rgba(196,154,60,0.15)', border: '1px solid rgba(196,154,60,0.2)',
                      borderRadius: 20, padding: '4px 10px',
                    }}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 3. STATS SECTION ═══════════ */}
      <section style={{ background: '#fff', padding: '60px 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {STATS.map((s, i) => (
            <div key={i} className="hover-lift" style={{
              padding: 32, borderRadius: 20, background: C.bgWarm, border: `1px solid ${C.borderSubtle}`, cursor: 'default',
            }}>
              <div style={{
                fontFamily: FONT_PLAYFAIR, fontSize: 30, fontWeight: 900, lineHeight: 1.2, marginBottom: 6,
                background: s.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{s.num}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500, color: '#666', lineHeight: 1.6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ 4. GOLD DIVIDER ═══════════ */}
      <div style={{ padding: '10px 0' }}><GoldDivider /></div>

      {/* ═══════════ 5. WHY SELLERS LOVE US ═══════════ */}
      <section id="why" style={{ background: C.bgWarm, padding: '70px 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <SectionLabel>WHY CHOOSE US</SectionLabel>
            <SectionTitle>Why Sellers Love Insta Fashion Points</SectionTitle>
            <HindiSub>विक्रेता Insta Fashion Points को क्यों पसंद करते हैं</HindiSub>
            <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: C.muted, maxWidth: 520, margin: '12px auto 0', lineHeight: 1.7 }}>
              Everything is designed to help you sell more and grow your business with confidence.
            </p>
          </div>

          <div id="pricing" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} className="hover-lift" style={{
                display: 'flex', gap: 18, padding: 28, borderRadius: 20, background: '#fff',
                border: `1px solid rgba(196,154,60,0.06)`, cursor: 'default',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                  background: `linear-gradient(135deg, ${C.bgWarm}, #F0E0EC)`, border: `1px solid ${C.borderMedium}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                }}>{b.icon}</div>
                <div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 700, color: C.primary, marginBottom: 2 }}>{b.title}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.accent, fontStyle: 'italic', marginBottom: 6 }}>{b.hi}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: C.muted, lineHeight: 1.7 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 6. APNA DUKANDAAR (DARK) ═══════════ */}
      <section style={{
        background: `linear-gradient(160deg, ${C.primary} 0%, ${C.primaryDark} 40%, #5A1A40 100%)`,
        padding: '80px 28px', position: 'relative', overflow: 'hidden',
        borderTop: `1px solid rgba(196,154,60,0.3)`,
      }}>
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,154,60,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.accent, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 16 }}> Only on Insta Fashion Points </p>
          <h2 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 38, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Apna Dukandaar</h2>
          <p style={{ fontFamily: FONT_PLAYFAIR, fontSize: 20, fontWeight: 500, color: C.accent, fontStyle: 'italic', margin: '0 0 20px' }}>Your Real Shop, Online</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: 'rgba(255,255,255,0.7)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.8 }}>
            On most platforms, sellers are faceless and invisible. On Insta Fashion Points, customers see YOUR shop name, YOUR photo, YOUR story. They buy from a person they trust — just like visiting your real shop. Build your brand and grow loyal followers.
          </p>

          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {APNA_FEATURES.map((f, i) => (
              <div key={i} style={{
                width: 220, padding: '28px 24px', borderRadius: 20, textAlign: 'center',
                background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(196,154,60,0.12)', transition: 'all 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,154,60,0.08)'; e.currentTarget.style.borderColor = 'rgba(196,154,60,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(196,154,60,0.12)'; }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 7. HOW IT WORKS ═══════════ */}
      <section id="how" style={{ background: '#fff', padding: '80px 28px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <SectionLabel>SIMPLE PROCESS</SectionLabel>
            <SectionTitle>How It Works</SectionTitle>
            <HindiSub>सिर्फ 5 आसान स्टेप्स में शुरू करें</HindiSub>
            <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: C.muted, marginTop: 10 }}>Begin selling in under 10 minutes. It&apos;s that simple.</p>
          </div>

          <div>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 24, paddingBottom: 28 }}>
                {/* Step number + connecting line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i === 0 ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})` : `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                    boxShadow: i === 0 ? '0 6px 20px rgba(196,154,60,0.3)' : '0 6px 20px rgba(91,26,58,0.2)',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 800, color: '#fff' }}>0{i + 1}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 1.5, height: 44, background: `linear-gradient(to bottom, ${C.accent}, transparent)`, marginTop: 4 }} />
                  )}
                </div>
                {/* Text */}
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 700, color: C.primary, marginBottom: 2 }}>{step.title}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.accent, fontStyle: 'italic', marginBottom: 6 }}>{step.hi}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 8. TESTIMONIAL ═══════════ */}
      <section style={{ background: C.bgWarm, padding: '60px 28px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel>SELLER STORIES</SectionLabel>
          <h2 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 32, fontWeight: 700, color: C.heading, margin: '0 0 30px' }}>Voices of Our Sellers</h2>

          <div style={{
            background: '#fff', borderRadius: 24, padding: '40px 36px', position: 'relative',
            boxShadow: C.shadowCard, border: `1px solid ${C.borderSubtle}`,
          }}>
            <span style={{ fontFamily: FONT_PLAYFAIR, fontSize: 64, color: 'rgba(196,154,60,0.15)', position: 'absolute', top: 10, left: 24, lineHeight: 1 }}>&ldquo;</span>
            <p style={{ fontFamily: FONT_PLAYFAIR, fontSize: 17, color: '#555', lineHeight: 2, fontStyle: 'italic', margin: '0 0 24px', position: 'relative' }}>
              Insta Fashion Points ne mera business completely badal diya. Pehle sirf Gaya mein customers the, ab pure India se orders aate hain. Sabse acchi baat — customers ko meri dukaan ka photo dikhta hai, toh unhe trust hota hai. 6 mahine mein ₹2 lakh monthly kamane laga.
            </p>
            <div style={{ width: 50, height: 1.5, margin: '0 auto 16px', background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)` }} />
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: C.primary }}>Ravi Kumar</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: C.accent }}>Ravi Textiles, Gaya — Seller since 2024</div>
          </div>
        </div>
      </section>

      {/* ═══════════ 9. FAQ ═══════════ */}
      <section id="faq" style={{ background: '#fff', padding: '70px 28px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <SectionLabel>GOT QUESTIONS?</SectionLabel>
            <h2 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 34, fontWeight: 700, color: C.heading, margin: 0 }}>Frequently Asked Questions</h2>
            <HindiSub>अक्सर पूछे जाने वाले सवाल</HindiSub>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} style={{
                  borderRadius: 16, border: `1px solid ${C.borderSubtle}`, overflow: 'hidden',
                  background: isOpen ? C.bgWarm : '#fff', transition: 'background 0.3s',
                }}>
                  <button onClick={() => setOpenFaq(isOpen ? null : i)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
                  }}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: C.primary, flex: 1, paddingRight: 12 }}>{faq.q}</span>
                    <span style={{
                      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: isOpen ? C.primary : C.accentSubtle, color: isOpen ? C.accent : C.primary,
                      fontFamily: FONT_BODY, fontSize: 18, fontWeight: 300, transition: 'all 0.3s',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}>+</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 24px 20px' }}>
                      <div style={{ width: 40, height: 1.5, background: `linear-gradient(90deg, ${C.accent}, transparent)`, marginBottom: 12 }} />
                      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: '#777', lineHeight: 1.8, margin: 0 }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ 10. FINAL CTA (DARK) ═══════════ */}
      <section style={{
        background: `linear-gradient(160deg, ${C.primary} 0%, ${C.primaryDark} 50%, #5A1A40 100%)`,
        padding: '80px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden',
        borderTop: `1px solid rgba(196,154,60,0.3)`,
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,154,60,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.accent, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 16 }}>YOUR JOURNEY BEGINS HERE</p>
          <h2 style={{ fontFamily: FONT_PLAYFAIR, fontSize: 36, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Ready to Grow Your Business?</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 500, color: C.accent, fontStyle: 'italic', margin: '0 0 20px' }}>अपना बिज़नेस बढ़ाने के लिए तैयार हैं?</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 32 }}>
            Join thousands of sellers building their fashion empire on Insta Fashion Points. Registration is free and takes under 10 minutes.
          </p>

          <Link href="/seller/register" style={{
            display: 'inline-block', fontFamily: FONT_BODY, fontSize: 17, fontWeight: 800, color: '#2E1422', textDecoration: 'none',
            padding: '18px 44px', borderRadius: 14,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight}, ${C.accent})`, backgroundSize: '200% auto',
            boxShadow: '0 10px 40px rgba(196,154,60,0.35)', transition: 'all 0.3s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 14px 50px rgba(196,154,60,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(196,154,60,0.35)'; }}
          >Start Your Online Dukaan — Free</Link>

          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
            {['No registration fee', 'No GST required', '0% commission for 6 months'].map((t, i) => (
              <span key={i} style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: C.accent, fontSize: 8 }}>◆</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 11. FOOTER ═══════════ */}
      <footer style={{
        background: C.primaryDeep, borderTop: `1px solid rgba(196,154,60,0.06)`, padding: '36px 28px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'rgba(196,154,60,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: FONT_PLAYFAIR, fontSize: 10, fontWeight: 700, color: C.accent }}>IFP</span>
            </div>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>© 2026 Insta Fashion Points. All rights reserved.</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Service', 'Contact Us'].map(l => (
              <a key={l} href="#" style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.accent)} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ═══════════ RESPONSIVE OVERRIDES ═══════════ */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media(max-width:768px){
          .desktop-nav{display:none!important}
        }
      ` }} />
    </>
  );
}
