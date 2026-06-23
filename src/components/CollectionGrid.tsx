'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCategories, type CategoryNode } from '@/hooks/useCategories';
import styles from './CollectionGrid.module.css';

export interface Collection {
  id: string;
  name: string;
  nameHi: string;
  desc: string;
  descHi: string;
  img: string;
  pos?: string;
  catKeyword?: string;
  l1Kw?: string;
  l2Kw?: string;
  l3Kw?: string;
  fallbackHref: string;
}

function nodeMatches(node: CategoryNode, kw: string): boolean {
  const k = kw.toLowerCase();
  const name = node.name.toLowerCase();
  const slug = node.slug.toLowerCase();
  return name.startsWith(k) || slug.startsWith(k) || name.includes(k) || slug.includes(k);
}

function resolveHref(tree: CategoryNode[], c: Collection): string {
  if (tree.length === 0) return c.fallbackHref;

  // Explicit 3-level lookup: l1Kw → l2Kw → l3Kw
  if (c.l1Kw && c.l2Kw && c.l3Kw) {
    const l1 = tree.find(n => nodeMatches(n, c.l1Kw!));
    if (l1) {
      const l2 = (l1.children ?? []).find(n => nodeMatches(n, c.l2Kw!));
      if (l2) {
        const l3 = (l2.children ?? []).find(n => nodeMatches(n, c.l3Kw!));
        if (l3) return `/category/${l3.slug}`;
      }
    }
    return c.fallbackHref;
  }

  // catKeyword: searches L1 first, then L2
  if (c.catKeyword) {
    const kw = c.catKeyword.toLowerCase();
    const l1 = tree.find(n => n.name.toLowerCase().startsWith(kw) || n.slug.toLowerCase().startsWith(kw));
    if (l1) return `/category/${l1.slug}`;
    for (const node of tree) {
      const l2 = (node.children ?? []).find(n => n.name.toLowerCase().startsWith(kw) || n.slug.toLowerCase().startsWith(kw));
      if (l2) return `/category/${l2.slug}`;
    }
  }

  return c.fallbackHref;
}

interface CollectionGridProps {
  collections: Collection[];
  title?: string;
  titleHi?: string;
}

export default function CollectionGrid({ collections, title, titleHi }: CollectionGridProps) {
  const { language } = useLanguage();
  const { tree } = useCategories();

  return (
    <section style={{ padding: '64px 16px', background: 'var(--ifp-bg)' }}>
      {(title || titleHi) && (
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
            fontWeight: 700,
            color: 'var(--ifp-maroon)',
            marginBottom: '12px',
          }}>
            {language === 'hi' ? (titleHi ?? title) : title}
          </h2>
          <div style={{
            width: '60px', height: '2px',
            background: 'var(--gradient-gold-rule)',
            margin: '0 auto',
          }} />
        </div>
      )}

      <div className={styles.grid} style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {collections.map((c) => (
          <Link
            key={c.id}
            href={resolveHref(tree, c)}
            className={styles.tile}
          >
            <img
              src={c.img}
              alt={c.name}
              className={styles.img}
              style={{ objectPosition: c.pos ?? 'center' }}
            />
            <div className={styles.overlay} />
            <div className={styles.caption}>
              <div className={styles.main}>
                <h3>{language === 'hi' ? c.nameHi : c.name}</h3>
                <span className={styles.rule} />
                <p>{language === 'hi' ? c.descHi : c.desc}</p>
              </div>
              <div className={styles.shopBtnWrap}>
                <span className={styles.shopBtn}>
                  {language === 'hi' ? 'अभी खरीदें' : 'Shop Now'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
