'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCategories, type CategoryNode } from '@/hooks/useCategories';

interface Banner {
  id: string;
  title: string;
  titleHi: string;
  subtitle: string;
  subtitleHi: string;
  tag: string;
  tagHi: string;
  link: string;
  bgImage: string;
  catKeyword?: string;
  hideText?: boolean;
}

const banners: Banner[] = [
  {
    id: 'welcome',
    title: 'Your Style,\nYour Story',
    titleHi: 'आपकी शैली,\nआपकी कहानी',
    subtitle: 'Premium Fashion for Everyone',
    subtitleHi: 'हर किसी के लिए प्रीमियम फैशन',
    tag: 'Welcome',
    tagHi: 'स्वागत',
    link: '/',
    bgImage: '/welcome-banner.jpg',
    hideText: true,
  },
  {
    id: 'salwar',
    title: 'Ethnic\nElegance',
    titleHi: 'पारंपरिक\nसुंदरता',
    subtitle: 'Where tradition meets modern grace',
    subtitleHi: 'परंपरा और आधुनिक सौंदर्य का संगम',
    tag: "Women's",
    tagHi: 'महिला',
    link: '/womens',
    bgImage: '/banners/salwar-banner.jpg',
    catKeyword: 'women',
    hideText: true,
  },
  {
    id: 'sarees',
    title: 'Exquisite\nSarees',
    titleHi: 'शानदार\nसाड़ियां',
    subtitle: 'Tradition meets contemporary grace',
    subtitleHi: 'परंपरा और आधुनिक सौंदर्य का संगम',
    tag: 'Sarees',
    tagHi: 'साड़ी',
    link: '/sarees',
    bgImage: '/banners/saree-banner.jpg',
    catKeyword: 'saree',
    hideText: true,
  },
  {
    id: 'mens',
    title: "Men's\nCollection",
    titleHi: 'पुरुषों का\nकलेक्शन',
    subtitle: 'Redefine your style',
    subtitleHi: 'अपनी शैली को नया रूप दें',
    tag: "Men's",
    tagHi: 'पुरुष',
    link: '/mens',
    bgImage: '/mens-collection.jpg',
    catKeyword: 'men',
    hideText: true,
  },
  {
    id: 'kids',
    title: 'Kids\nCollection',
    titleHi: 'बच्चों का\nकलेक्शन',
    subtitle: 'Playful styles for little ones',
    subtitleHi: 'छोटों के लिए खिलंडी शैली',
    tag: 'Kids',
    tagHi: 'बच्चे',
    link: '/kids',
    bgImage: '/kids-collection.jpg',
    catKeyword: 'kid',
    hideText: true,
  },
  {
    id: 'beauty',
    title: 'Beauty &\nMakeup',
    titleHi: 'ब्यूटी और\nमेकअप',
    subtitle: 'Radiate confidence',
    subtitleHi: 'आत्मविश्वास बिखेरें',
    tag: 'Beauty',
    tagHi: 'ब्यूटी',
    link: '/makeup',
    bgImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&h=700&fit=crop&q=90',
    catKeyword: 'beauty',
  },
  {
    id: 'footwear',
    title: 'Footwear\nCollection',
    titleHi: 'फुटवियर\nकलेक्शन',
    subtitle: 'Step into style',
    subtitleHi: 'स्टाइल में कदम रखें',
    tag: 'Footwear',
    tagHi: 'जूते',
    link: '/footwear',
    bgImage: '/footwear-new.jpg',
    catKeyword: 'footwear',
    hideText: true,
  },
];

function matchesCatKeyword(node: CategoryNode, kw: string): boolean {
  const name = node.name.toLowerCase();
  const slug = node.slug.toLowerCase();
  const k = kw.toLowerCase();
  return name.startsWith(k) || slug.startsWith(k);
}

function getBannerLink(banner: Banner, tree: CategoryNode[]): string {
  if (!banner.catKeyword || tree.length === 0) return banner.link;
  const l1Match = tree.find((node) => matchesCatKeyword(node, banner.catKeyword!));
  if (l1Match) return `/category/${l1Match.slug}`;
  for (const node of tree) {
    const l2Match = (node.children ?? []).find((child) => matchesCatKeyword(child, banner.catKeyword!));
    if (l2Match) return `/category/${l2Match.slug}`;
  }
  return banner.link;
}

export default function BannerCarousel() {
  const { language } = useLanguage();
  const { tree, loading } = useCategories();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const visibleBanners = loading
    ? banners.filter((b) => !b.catKeyword)
    : banners.filter((b) => {
        if (!b.catKeyword) return true;
        if (tree.some((node) => matchesCatKeyword(node, b.catKeyword!))) return true;
        return tree.some((node) =>
          (node.children ?? []).some((child) => matchesCatKeyword(child, b.catKeyword!))
        );
      });

  const n = visibleBanners.length;

  useEffect(() => {
    if (current >= n) setCurrent(0);
  }, [n, current]);

  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setCurrent((p) => (p + 1) % n), 6000);
    return () => clearInterval(t);
  }, [paused, n]);

  const go = (dir: number) => setCurrent((p) => (p + dir + n) % n);

  if (!n) return null;

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--ifp-border)',
        background: 'var(--ifp-bg-alt)',
        margin: '16px',
      }}
    >
      {/* Slide strip */}
      <div
        style={{
          display: 'flex',
          height: 'clamp(320px, 56vw, 680px)',
          width: `${n * 100}%`,
          transform: `translateX(-${current * (100 / n)}%)`,
          transition: 'transform 0.75s var(--ease-out)',
        }}
      >
        {visibleBanners.map((banner, idx) => (
          <Link
            key={banner.id}
            href={getBannerLink(banner, tree)}
            style={{
              width: `${100 / n}%`,
              height: '100%',
              flexShrink: 0,
              display: 'block',
              position: 'relative',
            }}
          >
            {/* Background image */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${banner.bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Gradient overlay */}
            {!banner.hideText ? (
              <>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(31,14,23,0.78), rgba(31,14,23,0.18) 60%, transparent)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(31,14,23,0.4), transparent 50%)', pointerEvents: 'none' }} />
              </>
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(31,14,23,0.28), transparent 50%)', pointerEvents: 'none' }} />
            )}

            {/* Text overlay for non-hideText banners */}
            {!banner.hideText && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                paddingLeft: 'clamp(24px, 6vw, 96px)',
                paddingRight: '32px',
                maxWidth: '640px',
              }}>
                <span style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.65)',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                }}>
                  {language === 'hi' ? banner.tagHi : banner.tag}
                </span>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2.4rem, 5vw, 4.8rem)',
                  fontWeight: 700,
                  color: 'var(--ifp-gold-light)',
                  lineHeight: 1.04,
                  marginBottom: '20px',
                  whiteSpace: 'pre-line',
                  letterSpacing: '-0.02em',
                }}>
                  {language === 'hi' ? banner.titleHi : banner.title}
                </h2>
                <p style={{
                  fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)',
                  color: 'rgba(255,255,255,0.82)',
                  fontWeight: 300,
                  letterSpacing: '0.04em',
                  fontFamily: 'var(--font-body)',
                }}>
                  {language === 'hi' ? banner.subtitleHi : banner.subtitle}
                </p>
              </div>
            )}

            {/* Active slide indicator label */}
            {idx === current && (
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(196,154,60,0.18)',
                backdropFilter: 'var(--backdrop-blur)',
                border: '1px solid rgba(196,154,60,0.35)',
                borderRadius: 'var(--radius-pill)',
                padding: '6px 16px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--ifp-gold-light)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-body)',
              }}>
                {language === 'hi' ? banner.tagHi : banner.tag}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Prev arrow */}
      {n > 1 && (
        <button
          onClick={(e) => { e.preventDefault(); go(-1); }}
          aria-label="Previous"
          style={{
            position: 'absolute', top: '50%', left: '16px',
            transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(31,14,23,0.32)',
            border: '1px solid rgba(255,255,255,0.35)',
            backdropFilter: 'var(--backdrop-blur)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', zIndex: 20,
            transition: 'background 0.2s, transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,154,60,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(31,14,23,0.32)')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Next arrow */}
      {n > 1 && (
        <button
          onClick={(e) => { e.preventDefault(); go(1); }}
          aria-label="Next"
          style={{
            position: 'absolute', top: '50%', right: '16px',
            transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(31,14,23,0.32)',
            border: '1px solid rgba(255,255,255,0.35)',
            backdropFilter: 'var(--backdrop-blur)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', zIndex: 20,
            transition: 'background 0.2s, transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,154,60,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(31,14,23,0.32)')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Gold progress dots */}
      {n > 1 && (
        <div style={{
          position: 'absolute', bottom: '18px', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: '9px', zIndex: 20,
        }}>
          {visibleBanners.map((_, k) => (
            <button
              key={k}
              aria-label={`Slide ${k + 1}`}
              onClick={(e) => { e.preventDefault(); setCurrent(k); }}
              style={{
                height: '7px',
                width: k === current ? '26px' : '7px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                background: k === current ? 'var(--ifp-gold)' : 'rgba(255,255,255,0.55)',
                transition: 'width 0.3s var(--ease-out), background 0.3s var(--ease-out)',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
