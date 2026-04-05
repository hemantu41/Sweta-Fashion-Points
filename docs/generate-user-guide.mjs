/**
 * Insta Fashion Points — Platform User Guide PDF Generator
 * Run: node docs/generate-user-guide.mjs
 */

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import {
  Document, Page, Text, View, StyleSheet, Link,
} from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Colors ────────────────────────────────────────────────────────────────
const C = {
  brand: '#059669',
  brandDark: '#047857',
  brandLight: '#ecfdf5',
  seller: '#8B1A1A',
  sellerLight: '#fef2f2',
  admin: '#1e40af',
  adminLight: '#eff6ff',
  delivery: '#7c3aed',
  deliveryLight: '#f5f3ff',
  customer: '#0891b2',
  customerLight: '#ecfeff',
  dark: '#111827',
  gray: '#4b5563',
  lightGray: '#9ca3af',
  border: '#e5e7eb',
  bg: '#f9fafb',
  white: '#ffffff',
  accent: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
};

// ─── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { paddingTop: 50, paddingBottom: 60, paddingHorizontal: 50, fontFamily: 'Helvetica', fontSize: 9.5, color: C.dark, backgroundColor: C.white },
  // Cover
  coverPage: { paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0, fontFamily: 'Helvetica', backgroundColor: C.white },
  coverBanner: { backgroundColor: C.brand, height: 280, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 60 },
  coverLogo: { width: 70, height: 70, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  coverLogoText: { color: C.white, fontSize: 28, fontFamily: 'Helvetica-Bold' },
  coverTitle: { color: C.white, fontSize: 32, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 8 },
  coverSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', marginBottom: 4 },
  coverBody: { paddingHorizontal: 60, paddingTop: 40 },
  coverMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  coverMetaItem: { fontSize: 10, color: C.gray },
  coverMetaLabel: { fontSize: 8, color: C.lightGray, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 },
  coverTocTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 12 },
  coverTocItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  coverTocText: { fontSize: 10, color: C.gray },
  coverTocNum: { fontSize: 10, color: C.brand, fontFamily: 'Helvetica-Bold' },
  // Headers & Footers
  pageHeader: { position: 'absolute', top: 15, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: C.border },
  pageHeaderText: { fontSize: 7, color: C.lightGray },
  footer: { position: 'absolute', bottom: 20, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 8 },
  footerText: { fontSize: 7, color: C.lightGray },
  // Section
  sectionTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.brand, marginBottom: 6, marginTop: 6 },
  sectionSubtitle: { fontSize: 9, color: C.gray, marginBottom: 16 },
  h2: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.dark, marginTop: 16, marginBottom: 6 },
  h3: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.gray, marginTop: 10, marginBottom: 4 },
  para: { fontSize: 9.5, color: C.gray, lineHeight: 1.6, marginBottom: 8 },
  bold: { fontFamily: 'Helvetica-Bold' },
  // Flow diagram box
  flowRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, marginTop: 2 },
  flowBox: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, marginBottom: 0 },
  flowArrow: { fontSize: 14, color: C.lightGray, marginHorizontal: 6 },
  flowVerticalArrow: { fontSize: 12, color: C.lightGray, textAlign: 'center', marginVertical: 2 },
  flowText: { fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  flowSub: { fontSize: 6.5, textAlign: 'center', marginTop: 1 },
  // Cards
  card: { backgroundColor: C.bg, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: C.border },
  cardTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 4 },
  cardText: { fontSize: 9, color: C.gray, lineHeight: 1.5 },
  // Feature list
  featureRow: { flexDirection: 'row', marginBottom: 4, paddingLeft: 4 },
  featureBullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.brand, marginTop: 4, marginRight: 8, flexShrink: 0 },
  featureText: { fontSize: 9, color: C.gray, lineHeight: 1.5, flex: 1 },
  // Table
  table: { marginBottom: 10, borderWidth: 0.5, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: C.brandLight, borderBottomWidth: 0.5, borderBottomColor: C.border },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  tableCell: { paddingVertical: 5, paddingHorizontal: 8, fontSize: 8, color: C.gray },
  tableHeaderCell: { paddingVertical: 6, paddingHorizontal: 8, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.brandDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Badge
  badge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, fontSize: 7, fontFamily: 'Helvetica-Bold', alignSelf: 'flex-start' },
  // Separator
  separator: { borderBottomWidth: 1, borderBottomColor: C.border, marginVertical: 14 },
  // Two column
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  // Role color strip
  roleStrip: { width: 4, borderRadius: 2, marginRight: 10, flexShrink: 0 },
});

// ─── Helper Components ─────────────────────────────────────────────────────

const Header = ({ section }) => (
  React.createElement(View, { style: s.pageHeader, fixed: true },
    React.createElement(Text, { style: s.pageHeaderText }, 'Insta Fashion Points — Platform User Guide'),
    React.createElement(Text, { style: s.pageHeaderText }, section),
  )
);

const Footer = () => (
  React.createElement(View, { style: s.footer, fixed: true },
    React.createElement(Text, { style: s.footerText }, 'Confidential — For Internal Use Only'),
    React.createElement(Text, { style: s.footerText, render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}` }),
  )
);

const Bullet = ({ children }) => (
  React.createElement(View, { style: s.featureRow },
    React.createElement(View, { style: s.featureBullet }),
    React.createElement(Text, { style: s.featureText }, children),
  )
);

const FlowBoxEl = ({ label, sub, color, borderColor }) => (
  React.createElement(View, { style: { ...s.flowBox, backgroundColor: color, borderColor: borderColor || C.border } },
    React.createElement(Text, { style: { ...s.flowText, color: borderColor || C.dark } }, label),
    sub ? React.createElement(Text, { style: { ...s.flowSub, color: borderColor || C.lightGray } }, sub) : null,
  )
);

const FlowArrow = () => React.createElement(Text, { style: s.flowArrow }, '\u2192');
const FlowDown = () => React.createElement(Text, { style: s.flowVerticalArrow }, '\u2193');

const SectionSep = () => React.createElement(View, { style: s.separator });

const Card = ({ title, children }) => (
  React.createElement(View, { style: s.card },
    React.createElement(Text, { style: s.cardTitle }, title),
    typeof children === 'string'
      ? React.createElement(Text, { style: s.cardText }, children)
      : children,
  )
);

// ─── Document ──────────────────────────────────────────────────────────────

const TOC = [
  { num: '1', title: 'Platform Overview', pg: '3' },
  { num: '2', title: 'System Architecture & Tech Stack', pg: '4' },
  { num: '3', title: 'Customer Journey & Flow Diagrams', pg: '5' },
  { num: '4', title: 'Seller Dashboard Guide', pg: '8' },
  { num: '5', title: 'Admin Dashboard Guide', pg: '11' },
  { num: '6', title: 'Delivery Partner Guide', pg: '15' },
  { num: '7', title: 'Payment & Checkout Flow', pg: '16' },
  { num: '8', title: 'Shipping Label & Invoice Generation', pg: '18' },
  { num: '9', title: 'Reviews & Ratings System', pg: '19' },
  { num: '10', title: 'Return Analytics Dashboard', pg: '20' },
  { num: '11', title: 'Authentication & Security', pg: '21' },
  { num: '12', title: 'API Reference Summary', pg: '22' },
  { num: '13', title: 'Database Schema Overview', pg: '24' },
  { num: '14', title: 'Deployment & Configuration', pg: '25' },
];

const UserGuide = () => (
  React.createElement(Document, { title: 'Insta Fashion Points — Platform User Guide', author: 'Insta Fashion Points Engineering', subject: 'Complete platform documentation with flow diagrams' },

    // ═══════════════════════════ COVER PAGE ═══════════════════════════
    React.createElement(Page, { size: 'A4', style: s.coverPage },
      React.createElement(View, { style: s.coverBanner },
        React.createElement(View, { style: s.coverLogo },
          React.createElement(Text, { style: s.coverLogoText }, 'IF'),
        ),
        React.createElement(Text, { style: s.coverTitle }, 'Insta Fashion Points'),
        React.createElement(Text, { style: s.coverSubtitle }, 'Complete Platform User Guide & Technical Reference'),
        React.createElement(Text, { style: { ...s.coverSubtitle, fontSize: 11 } }, 'fashionpoints.co.in'),
      ),
      React.createElement(View, { style: s.coverBody },
        React.createElement(View, { style: s.coverMeta },
          React.createElement(View, null,
            React.createElement(Text, { style: s.coverMetaLabel }, 'Version'),
            React.createElement(Text, { style: s.coverMetaItem }, '1.0.0'),
          ),
          React.createElement(View, null,
            React.createElement(Text, { style: s.coverMetaLabel }, 'Last Updated'),
            React.createElement(Text, { style: s.coverMetaItem }, 'March 2026'),
          ),
          React.createElement(View, null,
            React.createElement(Text, { style: s.coverMetaLabel }, 'Platform'),
            React.createElement(Text, { style: s.coverMetaItem }, 'Next.js 16 + Supabase'),
          ),
          React.createElement(View, null,
            React.createElement(Text, { style: s.coverMetaLabel }, 'Status'),
            React.createElement(Text, { style: s.coverMetaItem }, 'UAT / Pre-Production'),
          ),
        ),
        React.createElement(Text, { style: s.coverTocTitle }, 'Table of Contents'),
        ...TOC.map((item, i) =>
          React.createElement(View, { key: i, style: s.coverTocItem },
            React.createElement(Text, { style: s.coverTocText }, `${item.num}. ${item.title}`),
            React.createElement(Text, { style: s.coverTocNum }, item.pg),
          )
        ),
      ),
    ),

    // ═══════════════════════════ 1. PLATFORM OVERVIEW ═══════════════════════════
    React.createElement(Page, { size: 'A4', style: s.page },
      Header({ section: '1. Platform Overview' }),
      Footer(),
      React.createElement(Text, { style: s.sectionTitle }, '1. Platform Overview'),
      React.createElement(Text, { style: s.sectionSubtitle }, 'What Insta Fashion Points is and how it works'),
      React.createElement(Text, { style: s.para }, 'Insta Fashion Points is a multi-seller fashion e-commerce marketplace based in Gaya, Bihar. The platform connects local sellers with customers, offering a wide range of ethnic and modern fashion products including sarees, kurtas, lehengas, and accessories.'),
      React.createElement(Text, { style: s.para }, 'The platform operates with a 0% commission model, meaning sellers keep 100% of their sales revenue. Revenue is generated through premium seller tools, featured listings, and delivery partner services.'),

      React.createElement(Text, { style: s.h2 }, 'Four User Roles'),
      React.createElement(View, { style: s.twoCol },
        React.createElement(View, { style: s.col },
          React.createElement(View, { style: { ...s.card, borderLeftWidth: 3, borderLeftColor: C.customer } },
            React.createElement(Text, { style: s.cardTitle }, 'Customer'),
            React.createElement(Text, { style: s.cardText }, 'Browse products, place orders, track deliveries, leave reviews. OTP-based login with phone number.'),
          ),
          React.createElement(View, { style: { ...s.card, borderLeftWidth: 3, borderLeftColor: C.seller } },
            React.createElement(Text, { style: s.cardTitle }, 'Seller'),
            React.createElement(Text, { style: s.cardText }, 'List products, manage orders, track earnings, respond to reviews. Dedicated dashboard with analytics.'),
          ),
        ),
        React.createElement(View, { style: s.col },
          React.createElement(View, { style: { ...s.card, borderLeftWidth: 3, borderLeftColor: C.brand } },
            React.createElement(Text, { style: s.cardTitle }, 'Admin'),
            React.createElement(Text, { style: s.cardText }, 'Platform oversight: QC approval, order management, NDR handling, payments, analytics, user management.'),
          ),
          React.createElement(View, { style: { ...s.card, borderLeftWidth: 3, borderLeftColor: C.delivery } },
            React.createElement(Text, { style: s.cardTitle }, 'Delivery Partner'),
            React.createElement(Text, { style: s.cardText }, 'Accept deliveries, update status, track earnings. Auto-assigned based on proximity to seller.'),
          ),
        ),
      ),

      React.createElement(Text, { style: s.h2 }, 'Key Platform Features'),
      React.createElement(View, { style: s.twoCol },
        React.createElement(View, { style: s.col },
          Bullet({ children: 'OTP-based authentication (no passwords)' }),
          Bullet({ children: 'Razorpay payment gateway (UPI, Cards, COD)' }),
          Bullet({ children: 'Shiprocket logistics integration' }),
          Bullet({ children: 'Real-time order tracking' }),
          Bullet({ children: 'Bilingual UI (English + Hindi)' }),
          Bullet({ children: 'GST-compliant invoicing' }),
          Bullet({ children: 'Shipping label generation (4x6 thermal)' }),
        ),
        React.createElement(View, { style: s.col },
          Bullet({ children: 'Cloudinary image optimization' }),
          Bullet({ children: 'Redis caching (Upstash)' }),
          Bullet({ children: 'QC approval workflow for products' }),
          Bullet({ children: 'NDR (Non-Delivery Report) management' }),
          Bullet({ children: 'WhatsApp & SMS notifications' }),
          Bullet({ children: 'Bulk product upload (CSV/Excel)' }),
          Bullet({ children: 'Return analytics with role-based views' }),
        ),
      ),
    ),

    // ═══════════════════════════ 2. TECH STACK ═══════════════════════════
    React.createElement(Page, { size: 'A4', style: s.page },
      Header({ section: '2. System Architecture' }),
      Footer(),
      React.createElement(Text, { style: s.sectionTitle }, '2. System Architecture & Tech Stack'),
      React.createElement(Text, { style: s.sectionSubtitle }, 'Technologies powering the platform'),

      React.createElement(Text, { style: s.h2 }, 'Architecture Diagram'),
      // Simplified architecture flow
      React.createElement(View, { style: { backgroundColor: C.bg, borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: C.border } },
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', marginBottom: 8 } },
          FlowBoxEl({ label: 'Browser / Mobile', sub: 'React 19 + Next.js 16', color: C.customerLight, borderColor: C.customer }),
        ),
        FlowDown(),
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', marginBottom: 8 } },
          FlowBoxEl({ label: 'Next.js API Routes', sub: '83 endpoints', color: C.brandLight, borderColor: C.brand }),
        ),
        FlowDown(),
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', gap: 8, flexWrap: 'wrap' } },
          FlowBoxEl({ label: 'Supabase', sub: 'PostgreSQL DB', color: C.brandLight, borderColor: C.brand }),
          FlowBoxEl({ label: 'Redis', sub: 'Upstash Cache', color: '#fef3c7', borderColor: C.accent }),
          FlowBoxEl({ label: 'Cloudinary', sub: 'Image CDN', color: C.deliveryLight, borderColor: C.delivery }),
        ),
        FlowDown(),
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', gap: 8, flexWrap: 'wrap' } },
          FlowBoxEl({ label: 'Razorpay', sub: 'Payments', color: C.adminLight, borderColor: C.admin }),
          FlowBoxEl({ label: 'Shiprocket', sub: 'Logistics', color: C.sellerLight, borderColor: C.seller }),
          FlowBoxEl({ label: 'Resend', sub: 'Email', color: C.customerLight, borderColor: C.customer }),
        ),
      ),

      React.createElement(Text, { style: s.h2 }, 'Technology Stack'),
      React.createElement(View, { style: s.table },
        React.createElement(View, { style: s.tableHeaderRow },
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '25%' } }, 'Category'),
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '35%' } }, 'Technology'),
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '40%' } }, 'Purpose'),
        ),
        ...([
          ['Frontend', 'Next.js 16.1.4 + React 19.2.3', 'App Router, SSR, API routes'],
          ['Styling', 'Tailwind CSS v4', 'Utility-first responsive design'],
          ['Database', 'Supabase (PostgreSQL)', 'Primary data store with RLS'],
          ['Auth', 'Iron-session + OTP', 'Encrypted cookie sessions'],
          ['Payments', 'Razorpay SDK', 'UPI, Cards, Wallets, COD'],
          ['Logistics', 'Shiprocket API', 'Shipments, tracking, serviceability'],
          ['Images', 'Cloudinary', 'Upload, optimization, CDN delivery'],
          ['Cache', 'Upstash Redis', 'API caching, session warmup'],
          ['PDF', '@react-pdf/renderer', 'Shipping labels, GST invoices'],
          ['Charts', 'Recharts', 'Analytics visualizations'],
          ['Validation', 'Zod v4.3.6', 'Request schema validation'],
          ['Barcode', 'bwip-js', 'Code128 barcode on labels'],
          ['Email', 'Resend', 'Transactional emails'],
          ['Icons', 'Lucide React', '60+ SVG icons'],
          ['CSV', 'PapaParse + xlsx', 'Bulk upload parsing'],
          ['ZIP', 'JSZip', 'Bulk label download'],
        ].map((row, i) =>
          React.createElement(View, { key: i, style: { ...s.tableRow, backgroundColor: i % 2 === 0 ? C.white : C.bg } },
            React.createElement(Text, { style: { ...s.tableCell, width: '25%', fontFamily: 'Helvetica-Bold', color: C.dark } }, row[0]),
            React.createElement(Text, { style: { ...s.tableCell, width: '35%' } }, row[1]),
            React.createElement(Text, { style: { ...s.tableCell, width: '40%' } }, row[2]),
          )
        )),
      ),

      React.createElement(Text, { style: s.h2 }, 'Project Statistics'),
      React.createElement(View, { style: { ...s.flowRow, justifyContent: 'space-around', marginBottom: 10, flexWrap: 'wrap', gap: 8 } },
        ...[
          { n: '83', l: 'API Routes' }, { n: '60+', l: 'Components' }, { n: '30+', l: 'Pages' },
          { n: '4', l: 'User Roles' }, { n: '2', l: 'Languages' }, { n: '6', l: 'Integrations' },
        ].map((stat, i) =>
          React.createElement(View, { key: i, style: { alignItems: 'center', backgroundColor: C.brandLight, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 } },
            React.createElement(Text, { style: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.brand } }, stat.n),
            React.createElement(Text, { style: { fontSize: 7, color: C.gray, marginTop: 2 } }, stat.l),
          )
        ),
      ),
    ),

    // ═══════════════════════════ 3. CUSTOMER JOURNEY ═══════════════════════════
    React.createElement(Page, { size: 'A4', style: s.page },
      Header({ section: '3. Customer Journey' }),
      Footer(),
      React.createElement(Text, { style: s.sectionTitle }, '3. Customer Journey & Flow Diagrams'),
      React.createElement(Text, { style: s.sectionSubtitle }, 'End-to-end customer experience from browse to delivery'),

      React.createElement(Text, { style: s.h2 }, 'Customer Registration Flow'),
      React.createElement(View, { style: { backgroundColor: C.bg, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: C.border } },
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4 } },
          FlowBoxEl({ label: 'Open /signup', sub: 'Enter mobile', color: C.customerLight, borderColor: C.customer }),
          FlowArrow(),
          FlowBoxEl({ label: 'Send OTP', sub: 'API: send-signup-otp', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Verify OTP', sub: '6-digit code', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Complete Profile', sub: 'Name, email', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Session Created', sub: 'Iron-session cookie', color: C.brandLight, borderColor: C.brand }),
        ),
      ),

      React.createElement(Text, { style: s.h2 }, 'Shopping & Checkout Flow'),
      React.createElement(View, { style: { backgroundColor: C.bg, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: C.border } },
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4 } },
          FlowBoxEl({ label: 'Browse', sub: 'Home / Category / Search', color: C.customerLight, borderColor: C.customer }),
          FlowArrow(),
          FlowBoxEl({ label: 'Product Page', sub: 'Reviews, variants', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Add to Cart', sub: 'Cart context', color: C.white, borderColor: C.border }),
        ),
        FlowDown(),
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4 } },
          FlowBoxEl({ label: 'Checkout', sub: 'Select address', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Payment', sub: 'Razorpay modal', color: '#eff6ff', borderColor: C.admin }),
          FlowArrow(),
          FlowBoxEl({ label: 'Verify Payment', sub: 'Signature check', color: '#eff6ff', borderColor: C.admin }),
          FlowArrow(),
          FlowBoxEl({ label: 'Order Confirmed', sub: 'Notifications sent', color: C.brandLight, borderColor: C.brand }),
        ),
      ),

      React.createElement(Text, { style: s.h2 }, 'Order Lifecycle Flow'),
      React.createElement(View, { style: { backgroundColor: C.bg, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: C.border } },
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4 } },
          FlowBoxEl({ label: 'Pending', sub: 'Order placed', color: '#fffbeb', borderColor: C.accent }),
          FlowArrow(),
          FlowBoxEl({ label: 'Confirmed', sub: 'Admin/Auto', color: '#eff6ff', borderColor: C.blue }),
          FlowArrow(),
          FlowBoxEl({ label: 'Packed', sub: 'Seller packs', color: C.deliveryLight, borderColor: C.delivery }),
          FlowArrow(),
          FlowBoxEl({ label: 'Shipped', sub: 'Shiprocket AWB', color: C.deliveryLight, borderColor: C.delivery }),
          FlowArrow(),
          FlowBoxEl({ label: 'Delivered', sub: 'POD confirmed', color: C.brandLight, borderColor: C.brand }),
        ),
        React.createElement(View, { style: { marginTop: 8 } },
          React.createElement(Text, { style: { fontSize: 7.5, color: C.lightGray, textAlign: 'center' } }, 'Alternative paths: Cancelled (by customer/admin) | Returned (post-delivery) | NDR (failed delivery attempt)'),
        ),
      ),

      React.createElement(Text, { style: s.h2 }, 'Customer Features Overview'),
      React.createElement(View, { style: s.twoCol },
        React.createElement(View, { style: s.col },
          Card({ title: 'Product Discovery', children: 'Browse by 6 categories (Sarees, Mens, Womens, Kids, Footwear, Makeup), search, new arrivals page, and pincode-based delivery check.' }),
          Card({ title: 'Cart & Addresses', children: 'Persistent cart with quantity management. Multiple saved delivery addresses. Pincode serviceability validation before checkout.' }),
        ),
        React.createElement(View, { style: s.col },
          Card({ title: 'Payment Methods', children: 'Razorpay integration: Credit/Debit cards, UPI (with QR code), Wallets, Net Banking, and Cash on Delivery (COD) for eligible pincodes.' }),
          Card({ title: 'Post-Purchase', children: 'Real-time order tracking via Shiprocket. Review & rate products. Return requests. Order history with invoice download.' }),
        ),
      ),
    ),

    // ═══════════════════════════ 4. SELLER DASHBOARD ═══════════════════════════
    React.createElement(Page, { size: 'A4', style: s.page },
      Header({ section: '4. Seller Dashboard' }),
      Footer(),
      React.createElement(Text, { style: s.sectionTitle }, '4. Seller Dashboard Guide'),
      React.createElement(Text, { style: s.sectionSubtitle }, 'Complete seller onboarding and dashboard walkthrough'),

      React.createElement(Text, { style: s.h2 }, 'Seller Onboarding Flow'),
      React.createElement(View, { style: { backgroundColor: C.sellerLight, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: '#fecaca' } },
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4 } },
          FlowBoxEl({ label: 'Register', sub: '/seller/register', color: C.white, borderColor: C.seller }),
          FlowArrow(),
          FlowBoxEl({ label: 'OTP Verify', sub: 'Mobile verification', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Business Details', sub: 'GSTIN, address', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Pending Review', sub: '/seller/pending', color: '#fffbeb', borderColor: C.accent }),
          FlowArrow(),
          FlowBoxEl({ label: 'Approved', sub: 'Dashboard access', color: C.brandLight, borderColor: C.brand }),
        ),
      ),

      React.createElement(Text, { style: s.h2 }, 'Dashboard Modules (12 Sections)'),
      React.createElement(View, { style: s.table },
        React.createElement(View, { style: s.tableHeaderRow },
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '20%' } }, 'Module'),
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '30%' } }, 'Route'),
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '50%' } }, 'Features'),
        ),
        ...([
          ['Dashboard', '/seller/dashboard', 'Sales overview, recent orders, revenue KPIs, quick actions'],
          ['Products', '.../products', 'List, search, filter, edit products. Approval status tracking'],
          ['Add Product', '.../products/new', 'Full product form: images, pricing, GST slab, variants, stock'],
          ['Orders', '.../orders', 'Order management, packing status, courier assignment, bulk actions'],
          ['QC Status', '.../qc', 'QC feedback, rejection reasons, resubmission workflow'],
          ['Quick Add', '.../add', 'Simplified product entry form for rapid listing'],
          ['Earnings', '.../earnings', 'Per-order earnings, settlement status, payout history'],
          ['Analytics', '.../analytics', 'Sales trends, category breakdown, conversion metrics'],
          ['Reviews', '.../reviews', 'Customer reviews, star ratings, reply/respond to reviews'],
          ['Health', '.../health', 'Account health score, compliance metrics, risk indicators'],
          ['Settings', '.../settings', 'Bank details, GSTIN, store info, notification preferences'],
        ].map((row, i) =>
          React.createElement(View, { key: i, style: { ...s.tableRow, backgroundColor: i % 2 === 0 ? C.white : C.bg } },
            React.createElement(Text, { style: { ...s.tableCell, width: '20%', fontFamily: 'Helvetica-Bold', color: C.seller } }, row[0]),
            React.createElement(Text, { style: { ...s.tableCell, width: '30%', fontSize: 7.5 } }, row[1]),
            React.createElement(Text, { style: { ...s.tableCell, width: '50%' } }, row[2]),
          )
        )),
      ),

      React.createElement(Text, { style: s.h2 }, 'Product Lifecycle Flow'),
      React.createElement(View, { style: { backgroundColor: C.bg, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: C.border } },
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4 } },
          FlowBoxEl({ label: 'Create Product', sub: 'Images, price, stock', color: C.white, borderColor: C.seller }),
          FlowArrow(),
          FlowBoxEl({ label: 'QC Queue', sub: 'Pending review', color: '#fffbeb', borderColor: C.accent }),
          FlowArrow(),
          FlowBoxEl({ label: 'Admin QC', sub: 'Approve / Reject', color: C.adminLight, borderColor: C.admin }),
        ),
        FlowDown(),
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'space-around', marginTop: 4, gap: 4 } },
          React.createElement(View, { style: { alignItems: 'center' } },
            FlowBoxEl({ label: 'Approved', sub: 'Live on store', color: C.brandLight, borderColor: C.brand }),
          ),
          React.createElement(View, { style: { alignItems: 'center' } },
            FlowBoxEl({ label: 'Rejected', sub: 'With feedback', color: C.sellerLight, borderColor: C.red }),
            React.createElement(Text, { style: { fontSize: 7, color: C.lightGray, marginTop: 4, textAlign: 'center' } }, 'Seller can fix & resubmit'),
          ),
        ),
      ),

      React.createElement(Text, { style: s.h2 }, 'Seller Health Score'),
      React.createElement(Text, { style: s.para }, 'The health score (0-100) determines seller tier (Gold/Silver/Bronze) and visibility. It is based on:'),
      Bullet({ children: 'Cancellation rate (target: < 2%)' }),
      Bullet({ children: 'Return rate (target: < 5%)' }),
      Bullet({ children: 'Late dispatch rate (target: < 3%)' }),
      Bullet({ children: 'Product defect rate (target: < 1%)' }),
      React.createElement(Text, { style: { ...s.para, marginTop: 6 } }, 'Sellers below 50 score receive warnings. Below 30 risks suspension with reactivation request option.'),
    ),

    // ═══════════════════════════ 5. ADMIN DASHBOARD ═══════════════════════════
    React.createElement(Page, { size: 'A4', style: s.page },
      Header({ section: '5. Admin Dashboard' }),
      Footer(),
      React.createElement(Text, { style: s.sectionTitle }, '5. Admin Dashboard Guide'),
      React.createElement(Text, { style: s.sectionSubtitle }, '11-module admin control center for platform management'),

      React.createElement(Text, { style: s.h2 }, 'Admin Dashboard Architecture'),
      React.createElement(View, { style: { backgroundColor: C.bg, borderRadius: 8, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: C.border } },
        React.createElement(Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.admin, marginBottom: 8, textAlign: 'center' } }, 'State-based navigation: single page.tsx with switch/case rendering'),
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 6 } },
          ...['Dashboard', 'Orders', 'NDR', 'Catalogue', 'Payments', 'Analytics'].map((m, i) =>
            FlowBoxEl({ key: i, label: m, color: i === 0 ? C.brandLight : C.white, borderColor: i === 0 ? C.brand : C.border })
          ),
        ),
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 } },
          ...['Support', 'Growth', 'Settings*', 'Users*', 'Returns*'].map((m, i) =>
            FlowBoxEl({ key: i, label: m, color: m.includes('*') ? C.adminLight : C.white, borderColor: m.includes('*') ? C.admin : C.border })
          ),
        ),
        React.createElement(Text, { style: { fontSize: 7, color: C.lightGray, marginTop: 8, textAlign: 'center' } }, '* Users & Returns are nested under Settings in the sidebar'),
      ),

      React.createElement(Text, { style: s.h2 }, 'Module Details'),

      // Dashboard Home
      Card({ title: 'Dashboard Home',
        children: React.createElement(View, null,
          React.createElement(Text, { style: s.cardText }, 'Platform KPIs: total orders, revenue, pending approvals, return rate. Account health widget with radial gauge. Revenue chart (7-day area + category donut). Recent orders table. Delivery heatmap (pincode-based). WhatsApp notification panel. Support ticket widget. Growth suggestions.'),
        ),
      }),

      // Orders
      Card({ title: 'Orders Module',
        children: React.createElement(View, null,
          React.createElement(Text, { style: s.cardText }, 'Full order management with 7 status filters: pending, confirmed, processing, shipped, out_for_delivery, delivered, cancelled, returned. Features: multi-select checkboxes, bulk actions (confirm, ship, print labels, download invoices), individual order status updates, WhatsApp messaging, shipping label & invoice PDF generation, bulk ZIP download of labels.'),
        ),
      }),

      // Catalogue
      Card({ title: 'Catalogue Module',
        children: React.createElement(View, null,
          React.createElement(Text, { style: s.cardText }, 'Three sub-tabs: (1) Products - grid/list view with category filter and approval status badges. (2) Bulk Upload - CSV/Excel import with validation, error reporting, and preview. (3) QC Approval - product approval queue with approve/reject/request-changes actions and feedback notes.'),
        ),
      }),

      // Payments
      Card({ title: 'Payments Module',
        children: React.createElement(View, null,
          React.createElement(Text, { style: s.cardText }, 'KPI cards: total collected, seller payouts, GST collected, pending settlements. Three sub-tabs: (1) Settlements - transaction table with dispute handling. (2) GST Export - download GST reports. (3) Reconciliation - match payments with orders, handle discrepancies.'),
        ),
      }),
    ),

    // Admin Dashboard continued
    React.createElement(Page, { size: 'A4', style: s.page },
      Header({ section: '5. Admin Dashboard (cont.)' }),
      Footer(),

      Card({ title: 'Analytics Module',
        children: React.createElement(View, null,
          React.createElement(Text, { style: s.cardText }, 'Period selector (week/month/quarter). Revenue trend line chart. Category-wise horizontal bar chart. Returns analysis donut chart with 5 reasons. Delivery zone table with pincode, district, orders, avg delivery time, and SLA status.'),
        ),
      }),

      Card({ title: 'NDR Management',
        children: React.createElement(View, null,
          React.createElement(Text, { style: s.cardText }, 'Non-Delivery Report handling. NDR table with: order ID, customer info, failure reason (bilingual), attempt count, COD verification badge. Actions: initiate RTO, mark fake order, schedule retry, update address, verify COD. Red badge in sidebar showing pending NDR count.'),
        ),
      }),

      Card({ title: 'Support Module',
        children: React.createElement(View, null,
          React.createElement(Text, { style: s.cardText }, 'Support ticket list with SLA tracking (progress bar + hours remaining). Priority indicators (high/medium/low). Status tracking (open/in_progress/resolved). Categories: order, payment, product, delivery, other. Quick ticket creation form.'),
        ),
      }),

      Card({ title: 'Growth Module',
        children: React.createElement(View, null,
          React.createElement(Text, { style: s.cardText }, '14-day countdown banner. Growth suggestions (bilingual). Seasonal offers with discount %, date range. Pincode expansion with India Post API integration for new zone validation. WhatsApp notification panel.'),
        ),
      }),

      Card({ title: 'Settings Module (with sub-items)',
        children: React.createElement(View, null,
          React.createElement(Text, { style: s.cardText }, 'Business profile (name, GSTIN verification, PAN, address). WhatsApp config (phone, connection test). Notification preferences (WhatsApp/SMS/Email toggles). Language preference (English/Hindi). Expandable in sidebar with two sub-items: User Management and Return Analytics.'),
        ),
      }),

      React.createElement(Text, { style: s.h2 }, 'Admin Order Processing Flow'),
      React.createElement(View, { style: { backgroundColor: C.bg, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: C.border } },
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4 } },
          FlowBoxEl({ label: 'New Order', sub: 'Customer places', color: '#fffbeb', borderColor: C.accent }),
          FlowArrow(),
          FlowBoxEl({ label: 'Admin Confirms', sub: 'Or auto-confirm', color: C.adminLight, borderColor: C.admin }),
          FlowArrow(),
          FlowBoxEl({ label: 'Seller Packs', sub: 'Packing status', color: C.sellerLight, borderColor: C.seller }),
        ),
        FlowDown(),
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4 } },
          FlowBoxEl({ label: 'Print Label', sub: 'PDF generated', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Shiprocket', sub: 'AWB assigned', color: C.deliveryLight, borderColor: C.delivery }),
          FlowArrow(),
          FlowBoxEl({ label: 'In Transit', sub: 'Real-time tracking', color: C.deliveryLight, borderColor: C.delivery }),
          FlowArrow(),
          FlowBoxEl({ label: 'Delivered', sub: 'Settlement trigger', color: C.brandLight, borderColor: C.brand }),
        ),
      ),
    ),

    // ═══════════════════════════ 6. DELIVERY PARTNER ═══════════════════════════
    React.createElement(Page, { size: 'A4', style: s.page },
      Header({ section: '6-8. Delivery, Payments, Shipping' }),
      Footer(),

      React.createElement(Text, { style: s.sectionTitle }, '6. Delivery Partner Guide'),
      React.createElement(Text, { style: s.sectionSubtitle }, 'Registration and order fulfillment workflow'),

      React.createElement(Text, { style: s.h2 }, 'Delivery Partner Flow'),
      React.createElement(View, { style: { backgroundColor: C.deliveryLight, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: '#ddd6fe' } },
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4 } },
          FlowBoxEl({ label: 'Register', sub: '/delivery-partner/register', color: C.white, borderColor: C.delivery }),
          FlowArrow(),
          FlowBoxEl({ label: 'Verification', sub: 'Admin approval', color: '#fffbeb', borderColor: C.accent }),
          FlowArrow(),
          FlowBoxEl({ label: 'Dashboard', sub: '/delivery/dashboard', color: C.white, borderColor: C.border }),
        ),
        FlowDown(),
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4 } },
          FlowBoxEl({ label: 'Auto-Assigned', sub: 'Proximity-based', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Pick Up', sub: 'From seller', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Deliver', sub: 'Update status', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Earnings', sub: 'Per-delivery payout', color: C.brandLight, borderColor: C.brand }),
        ),
      ),

      Bullet({ children: 'Auto-assignment uses seller location proximity to match nearest available partner' }),
      Bullet({ children: 'Partners can view assigned orders, update delivery status, and track their earnings' }),
      Bullet({ children: 'Status history tracking for accountability and performance analysis' }),

      SectionSep(),

      // ═══════════════════════════ 7. PAYMENT FLOW ═══════════════════════════
      React.createElement(Text, { style: s.sectionTitle }, '7. Payment & Checkout Flow'),
      React.createElement(Text, { style: s.sectionSubtitle }, 'Razorpay integration with multiple payment methods'),

      React.createElement(Text, { style: s.h2 }, 'Payment Processing Flow'),
      React.createElement(View, { style: { backgroundColor: C.adminLight, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: '#bfdbfe' } },
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4 } },
          FlowBoxEl({ label: '1. Create Order', sub: 'POST /api/payment/create-order', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: '2. Razorpay Modal', sub: 'Card / UPI / Wallet / COD', color: C.white, borderColor: C.admin }),
          FlowArrow(),
          FlowBoxEl({ label: '3. Payment Done', sub: 'Client callback', color: C.white, borderColor: C.border }),
        ),
        FlowDown(),
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4 } },
          FlowBoxEl({ label: '4. Verify Signature', sub: 'POST /api/payment/verify', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: '5. Order Confirmed', sub: 'DB updated, emails sent', color: C.brandLight, borderColor: C.brand }),
          FlowArrow(),
          FlowBoxEl({ label: '6. Webhook Backup', sub: 'payment.captured event', color: C.white, borderColor: C.border }),
        ),
      ),

      React.createElement(Text, { style: s.h3 }, 'Supported Payment Methods'),
      React.createElement(View, { style: { ...s.flowRow, gap: 8, flexWrap: 'wrap', marginBottom: 10 } },
        ...['Credit/Debit Card', 'UPI (with QR)', 'Net Banking', 'Wallets', 'Cash on Delivery'].map((m, i) =>
          React.createElement(View, { key: i, style: { ...s.badge, backgroundColor: C.adminLight, color: C.admin } },
            React.createElement(Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.admin } }, m),
          )
        ),
      ),
      React.createElement(Text, { style: s.para }, 'Order ID format: SFP-YYYYMMDD-XXXXXX. All payments trigger seller earnings records and Shiprocket shipment creation on success. Webhook handles edge cases where client callback fails.'),

      SectionSep(),

      // ═══════════════════════════ 8. SHIPPING & INVOICE ═══════════════════════════
      React.createElement(Text, { style: s.sectionTitle }, '8. Shipping Label & Invoice Generation'),
      React.createElement(Text, { style: s.sectionSubtitle }, 'PDF generation for logistics and compliance'),

      React.createElement(View, { style: s.twoCol },
        React.createElement(View, { style: s.col },
          Card({ title: 'Shipping Label (4x6")',
            children: React.createElement(View, null,
              Bullet({ children: 'Code128 barcode (AWB number) via bwip-js' }),
              Bullet({ children: 'Ship To: Customer name, full address, pincode, mobile' }),
              Bullet({ children: 'Ship From: Seller business details' }),
              Bullet({ children: 'Order ID, weight, item count, product list' }),
              Bullet({ children: 'Large destination pincode box for sorting' }),
              Bullet({ children: 'COD badge with amount (when applicable)' }),
              Bullet({ children: 'API: GET /api/orders/[id]/label' }),
            ),
          }),
        ),
        React.createElement(View, { style: s.col },
          Card({ title: 'GST Invoice (A4)',
            children: React.createElement(View, null,
              Bullet({ children: 'Tax invoice with seller GSTIN and state code' }),
              Bullet({ children: 'Bill To / Ship To sections' }),
              Bullet({ children: 'Product table: HSN codes, MRP, selling price' }),
              Bullet({ children: 'GST split: CGST 2.5% + SGST 2.5% (intra-state)' }),
              Bullet({ children: 'Amount in words (Indian numbering system)' }),
              Bullet({ children: 'Signatory section and terms' }),
              Bullet({ children: 'API: GET /api/orders/[id]/invoice' }),
            ),
          }),
        ),
      ),
      React.createElement(Text, { style: s.para }, 'Bulk operations: Select multiple orders > Download all labels as ZIP file (shipping-labels-YYYY-MM-DD.zip). Uses JSZip for client-side ZIP generation with toast progress indicator.'),
    ),

    // ═══════════════════════════ 9-10. REVIEWS & RETURNS ═══════════════════════════
    React.createElement(Page, { size: 'A4', style: s.page },
      Header({ section: '9-10. Reviews & Returns' }),
      Footer(),

      React.createElement(Text, { style: s.sectionTitle }, '9. Reviews & Ratings System'),
      React.createElement(Text, { style: s.sectionSubtitle }, 'Full-stack review system with seller responses'),

      React.createElement(Text, { style: s.h2 }, 'Review System Flow'),
      React.createElement(View, { style: { backgroundColor: C.bg, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: C.border } },
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4 } },
          FlowBoxEl({ label: 'Order Delivered', sub: 'Buyer eligible', color: C.brandLight, borderColor: C.brand }),
          FlowArrow(),
          FlowBoxEl({ label: 'Submit Review', sub: '/order/[id]/review', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Stored in DB', sub: 'spf_reviews table', color: C.white, borderColor: C.border }),
        ),
        FlowDown(),
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4 } },
          FlowBoxEl({ label: 'Public Reviews', sub: '/reviews page', color: C.customerLight, borderColor: C.customer }),
          React.createElement(Text, { style: { ...s.flowArrow, marginHorizontal: 20 } }, ''),
          FlowBoxEl({ label: 'Seller Dashboard', sub: 'View & respond', color: C.sellerLight, borderColor: C.seller }),
        ),
      ),

      React.createElement(Text, { style: s.h3 }, 'Components'),
      Bullet({ children: 'StarRating — Interactive/display SVG stars with half-star support and hover preview' }),
      Bullet({ children: 'ReviewCard — Avatar with initials, verified badge, masked buyer name (seller view), helpful voting, seller response block' }),
      Bullet({ children: 'RatingSummary — 4 stat cards + star breakdown bars with color coding' }),
      Bullet({ children: 'SellerResponseForm — Reply/edit with 800 char limit, publishes to /api/reviews/[id]/response' }),

      React.createElement(Text, { style: s.h3 }, 'API Endpoints'),
      React.createElement(View, { style: s.table },
        React.createElement(View, { style: s.tableHeaderRow },
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '35%' } }, 'Endpoint'),
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '12%' } }, 'Method'),
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '53%' } }, 'Description'),
        ),
        ...([
          ['/api/reviews', 'GET', 'Fetch reviews with filter (star), pagination, seller filtering'],
          ['/api/reviews', 'POST', 'Submit review with Zod validation, XSS sanitization, duplicate check'],
          ['/api/reviews/[id]/response', 'POST', 'Seller response upsert (auth-protected via iron-session)'],
          ['/api/reviews/[id]/helpful', 'POST', 'Helpful vote with IP-based deduplication (1 vote per IP)'],
        ].map((row, i) =>
          React.createElement(View, { key: i, style: { ...s.tableRow, backgroundColor: i % 2 === 0 ? C.white : C.bg } },
            React.createElement(Text, { style: { ...s.tableCell, width: '35%', fontSize: 7.5, fontFamily: 'Helvetica-Bold' } }, row[0]),
            React.createElement(Text, { style: { ...s.tableCell, width: '12%' } }, row[1]),
            React.createElement(Text, { style: { ...s.tableCell, width: '53%' } }, row[2]),
          )
        )),
      ),

      SectionSep(),

      React.createElement(Text, { style: s.sectionTitle }, '10. Return Analytics Dashboard'),
      React.createElement(Text, { style: s.sectionSubtitle }, 'Role-based return analysis with admin and seller views'),

      React.createElement(View, { style: s.twoCol },
        React.createElement(View, { style: s.col },
          Card({ title: 'Admin View',
            children: React.createElement(View, null,
              Bullet({ children: '4 KPIs: total returns, active sellers, return rate, refunds issued' }),
              Bullet({ children: 'Animated reason bars: Size, Quality, Wrong Item, Damage, Other' }),
              Bullet({ children: '6-month return rate trend line chart' }),
              Bullet({ children: 'Sortable seller table with severity badges (Critical/High/Normal)' }),
              Bullet({ children: 'Full return log with status & reason pills' }),
              Bullet({ children: 'Action items flagged by severity' }),
            ),
          }),
        ),
        React.createElement(View, { style: s.col },
          Card({ title: 'Seller View',
            children: React.createElement(View, null,
              Bullet({ children: 'Personal KPIs benchmarked vs platform average' }),
              Bullet({ children: 'Own return reason breakdown bars' }),
              Bullet({ children: 'Dual-line trend: My Rate vs Platform Average' }),
              Bullet({ children: 'Most-returned products table with rate badges' }),
              Bullet({ children: 'Personal return log with filters' }),
              Bullet({ children: 'Personalised fix suggestions per reason' }),
            ),
          }),
        ),
      ),
      React.createElement(Text, { style: s.para }, 'Both views share: role switcher, filter bar (period, reason chips, severity/category), global search, sortable columns, CSV/JSON export with toast confirmation, and live bar dimming on filter selection.'),
    ),

    // ═══════════════════════════ 11-12. AUTH & API ═══════════════════════════
    React.createElement(Page, { size: 'A4', style: s.page },
      Header({ section: '11-12. Auth & API' }),
      Footer(),

      React.createElement(Text, { style: s.sectionTitle }, '11. Authentication & Security'),
      React.createElement(Text, { style: s.sectionSubtitle }, 'OTP-based authentication with encrypted sessions'),

      React.createElement(Text, { style: s.h2 }, 'Authentication Flow'),
      React.createElement(View, { style: { backgroundColor: C.bg, borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: C.border } },
        React.createElement(View, { style: { ...s.flowRow, justifyContent: 'center', flexWrap: 'wrap', gap: 4 } },
          FlowBoxEl({ label: 'User enters mobile', sub: '/login or /signup', color: C.customerLight, borderColor: C.customer }),
          FlowArrow(),
          FlowBoxEl({ label: 'OTP sent via SMS', sub: 'Fast2SMS / Resend', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'User enters OTP', sub: '6-digit verification', color: C.white, borderColor: C.border }),
          FlowArrow(),
          FlowBoxEl({ label: 'Session created', sub: 'Iron-session cookie', color: C.brandLight, borderColor: C.brand }),
        ),
      ),

      React.createElement(Text, { style: s.h3 }, 'Security Layers'),
      Bullet({ children: 'Iron-session: Encrypted HTTP-only cookies. Session data includes userId, mobile, isLoggedIn flag' }),
      Bullet({ children: 'Middleware protection: /account/*, /orders/*, /checkout/* routes require active session' }),
      Bullet({ children: 'Component guards: AdminAuthGuard (isAdmin check), SellerAuthGuard (approved seller check), AuthGuard (basic login)' }),
      Bullet({ children: 'Zod v4 validation on all POST endpoints to prevent injection and malformed data' }),
      Bullet({ children: 'XSS sanitization on user-generated content (reviews, product descriptions)' }),
      Bullet({ children: 'IP-based rate limiting on helpful votes to prevent abuse' }),
      Bullet({ children: 'Supabase Row-Level Security (RLS) for database-level access control' }),

      SectionSep(),

      React.createElement(Text, { style: s.sectionTitle }, '12. API Reference Summary'),
      React.createElement(Text, { style: s.sectionSubtitle }, '83 API endpoints organized by domain'),

      React.createElement(View, { style: s.table },
        React.createElement(View, { style: s.tableHeaderRow },
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '25%' } }, 'Domain'),
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '15%' } }, 'Count'),
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '60%' } }, 'Key Endpoints'),
        ),
        ...([
          ['Authentication', '8', 'send-otp, verify-otp, login, signup, me, logout'],
          ['Payments', '6', 'create-order, verify, status, create-qr, webhook, reconcile'],
          ['Orders', '10', 'CRUD, assign, tracking, packing-status, label, invoice, auto-assign'],
          ['Products', '7', 'CRUD, qc-feedback, resubmit, deletion-history'],
          ['Sellers', '10', 'register, verify, me, list, earnings, analytics, reactivation'],
          ['Delivery', '9', 'register, list, earnings, analytics, status-history, assigned orders'],
          ['Admin', '16', 'dashboard stats, QC queue/approve/reject, analytics, GST, SMS, WhatsApp'],
          ['Reviews', '4', 'GET/POST reviews, seller response, helpful vote'],
          ['NDR', '3', 'list, create, COD verify'],
          ['Shiprocket', '4', 'create-shipment, track, serviceability, test-auth'],
          ['User Profile', '4', 'profile, addresses, UPI'],
          ['Utility', '2', 'image upload, leads capture'],
        ].map((row, i) =>
          React.createElement(View, { key: i, style: { ...s.tableRow, backgroundColor: i % 2 === 0 ? C.white : C.bg } },
            React.createElement(Text, { style: { ...s.tableCell, width: '25%', fontFamily: 'Helvetica-Bold', color: C.dark } }, row[0]),
            React.createElement(Text, { style: { ...s.tableCell, width: '15%', textAlign: 'center', fontFamily: 'Helvetica-Bold', color: C.brand } }, row[1]),
            React.createElement(Text, { style: { ...s.tableCell, width: '60%', fontSize: 8 } }, row[2]),
          )
        )),
      ),
    ),

    // ═══════════════════════════ 13-14. DB & DEPLOY ═══════════════════════════
    React.createElement(Page, { size: 'A4', style: s.page },
      Header({ section: '13-14. Database & Deployment' }),
      Footer(),

      React.createElement(Text, { style: s.sectionTitle }, '13. Database Schema Overview'),
      React.createElement(Text, { style: s.sectionSubtitle }, 'Supabase PostgreSQL tables powering the platform'),

      React.createElement(View, { style: s.table },
        React.createElement(View, { style: s.tableHeaderRow },
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '30%' } }, 'Table'),
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '70%' } }, 'Purpose & Key Columns'),
        ),
        ...([
          ['spf_users', 'User accounts — id, name, email, mobile, role (customer/admin), is_admin flag'],
          ['spf_sellers', 'Seller profiles — id, user_id, business_name, gstin, status (pending/approved/rejected/suspended)'],
          ['spf_products', 'Product catalogue — id, seller_id, name, category, price, stock, approval_status, images[]'],
          ['spf_payment_orders', 'Orders — id, order_number, user_id, items[], delivery_address, payment_method, status, razorpay_order_id'],
          ['spf_seller_earnings', 'Per-order seller earnings — order_id, seller_id, amount, commission (0%), settlement_status'],
          ['spf_delivery_partners', 'Delivery partners — id, user_id, name, vehicle_type, status, location'],
          ['spf_reviews', 'Product reviews — id, order_id (UNIQUE), seller_id, rating (1-5), title, body, verified, helpful_count'],
          ['spf_seller_responses', 'Seller reply to reviews — id, review_id (UNIQUE FK), response_text'],
          ['spf_review_helpful_votes', 'Helpful vote tracking — review_id, voter_ip (UNIQUE pair)'],
          ['spf_ndr_records', 'Non-delivery reports — order_id, failure_reason, attempt_count, cod_verified'],
          ['spf_notifications', 'Seller notifications — seller_id, type, title, message, read flag'],
        ].map((row, i) =>
          React.createElement(View, { key: i, style: { ...s.tableRow, backgroundColor: i % 2 === 0 ? C.white : C.bg } },
            React.createElement(Text, { style: { ...s.tableCell, width: '30%', fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.dark } }, row[0]),
            React.createElement(Text, { style: { ...s.tableCell, width: '70%', fontSize: 8 } }, row[1]),
          )
        )),
      ),

      SectionSep(),

      React.createElement(Text, { style: s.sectionTitle }, '14. Deployment & Configuration'),
      React.createElement(Text, { style: s.sectionSubtitle }, 'Environment variables and deployment requirements'),

      React.createElement(Text, { style: s.h2 }, 'Required Environment Variables'),
      React.createElement(View, { style: s.table },
        React.createElement(View, { style: s.tableHeaderRow },
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '40%' } }, 'Variable'),
          React.createElement(Text, { style: { ...s.tableHeaderCell, width: '60%' } }, 'Description'),
        ),
        ...([
          ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase project URL'],
          ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase anonymous key (client-side)'],
          ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase service role key (server-side, bypasses RLS)'],
          ['SESSION_SECRET', 'Iron-session encryption secret (32+ characters)'],
          ['RAZORPAY_KEY_ID', 'Razorpay API key ID'],
          ['RAZORPAY_KEY_SECRET', 'Razorpay API secret'],
          ['RAZORPAY_WEBHOOK_SECRET', 'Razorpay webhook signature secret'],
          ['CLOUDINARY_CLOUD_NAME', 'Cloudinary cloud name'],
          ['CLOUDINARY_API_KEY', 'Cloudinary API key'],
          ['CLOUDINARY_API_SECRET', 'Cloudinary API secret'],
          ['UPSTASH_REDIS_URL', 'Upstash Redis REST URL'],
          ['UPSTASH_REDIS_TOKEN', 'Upstash Redis REST token'],
          ['SHIPROCKET_EMAIL', 'Shiprocket login email'],
          ['SHIPROCKET_PASSWORD', 'Shiprocket login password'],
          ['RESEND_API_KEY', 'Resend email service API key'],
        ].map((row, i) =>
          React.createElement(View, { key: i, style: { ...s.tableRow, backgroundColor: i % 2 === 0 ? C.white : C.bg } },
            React.createElement(Text, { style: { ...s.tableCell, width: '40%', fontFamily: 'Courier', fontSize: 7.5, color: C.dark } }, row[0]),
            React.createElement(Text, { style: { ...s.tableCell, width: '60%', fontSize: 8 } }, row[1]),
          )
        )),
      ),

      React.createElement(Text, { style: s.h2 }, 'Build & Run'),
      React.createElement(View, { style: { ...s.card, fontFamily: 'Courier' } },
        React.createElement(Text, { style: { fontFamily: 'Courier', fontSize: 8, color: C.dark, lineHeight: 1.8 } },
          'npm install          # Install dependencies\nnpx next build        # Production build\nnpx next start        # Start production server\nnpx next dev          # Development server (port 3000)'
        ),
      ),

      React.createElement(View, { style: { marginTop: 20, padding: 16, backgroundColor: C.brandLight, borderRadius: 8, borderWidth: 1, borderColor: C.brand } },
        React.createElement(Text, { style: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.brand, textAlign: 'center', marginBottom: 4 } }, 'Insta Fashion Points'),
        React.createElement(Text, { style: { fontSize: 9, color: C.gray, textAlign: 'center' } }, 'fashionpoints.co.in | Gaya, Bihar, India'),
        React.createElement(Text, { style: { fontSize: 8, color: C.lightGray, textAlign: 'center', marginTop: 4 } }, 'Document generated March 2026 | Version 1.0.0'),
      ),
    ),
  )
);

// ─── Generate PDF ──────────────────────────────────────────────────────────

async function main() {
  console.log('Generating Insta Fashion Points User Guide PDF...');
  const buffer = await renderToBuffer(React.createElement(UserGuide));
  const outPath = path.join(__dirname, 'Insta-Fashion-Points-User-Guide.pdf');
  fs.writeFileSync(outPath, buffer);
  console.log(`PDF saved to: ${outPath}`);
  console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
