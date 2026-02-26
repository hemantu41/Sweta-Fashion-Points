# Production Optimization Guide for March 2026 Launch

## Overview

This guide covers optimizations to ensure your website handles production traffic efficiently while staying within free tier limits.

**Target Launch Metrics:**
- 10,000 products
- 10 sellers
- 50 delivery partners
- 50,000 images
- Expected traffic: 10,000-50,000 visitors/month

---

## Part 1: Supabase Optimization (Stay on FREE Tier)

### Current FREE Tier Limits
- Database: 500MB
- File Storage: 1GB
- Bandwidth: 5GB/month
- Edge Functions: 500K invocations/month
- Realtime: 200 concurrent connections

### 1.1 Database Size Optimization

**Current Estimated Size:**
- 10,000 products × 5KB = **50MB** ✓
- User data: ~10MB
- Orders: ~20MB
- **Total: ~80MB** (84% under limit!)

**Strategies to Stay Under 500MB:**

1. **Don't Store Images in Database** ✓ (Already done - using S3)

2. **Optimize JSON Columns**
   - Current: `items` column in `spf_payment_orders` stores full product details
   - Optimization: Store only essential data (product_id, quantity, price)

3. **Archive Old Data**
   - Move orders older than 1 year to cold storage
   - Keep only active/recent data in main tables

4. **Index Optimization**
   - Remove unused indexes
   - Use partial indexes for filtered queries

### 1.2 Bandwidth Optimization

**Current Usage Pattern:**
- API calls: ~2GB/month (estimated)
- Realtime: Not used yet
- **Total: ~2GB/month** (60% under limit)

**Strategies:**

1. **Client-Side Caching**
   - Cache product listings in localStorage (1 hour TTL)
   - Cache user session data
   - Reduce redundant API calls

2. **Use Connection Pooling**
   - Already using Supabase client (built-in pooling)
   - No additional setup needed

3. **Pagination**
   - Load products in batches (20-50 per page)
   - Infinite scroll for better UX

### 1.3 Query Optimization

**Implement These Changes:**

1. **Select Only Required Columns**
   ```typescript
   // ❌ Bad - fetches all columns
   const { data } = await supabase.from('spf_productdetails').select('*')

   // ✅ Good - fetch only needed columns
   const { data } = await supabase
     .from('spf_productdetails')
     .select('id, name, price, main_image, category')
   ```

2. **Use Indexes for Common Queries**
   ```sql
   -- Already have these, verify in Supabase
   CREATE INDEX IF NOT EXISTS idx_products_category ON spf_productdetails(category);
   CREATE INDEX IF NOT EXISTS idx_products_seller ON spf_productdetails(seller_id);
   CREATE INDEX IF NOT EXISTS idx_products_active ON spf_productdetails(is_active);
   ```

3. **Implement Query Result Caching**
   - Cache product listings on client-side
   - Use SWR or React Query for automatic caching

---

## Part 2: Performance Optimizations

### 2.1 Image Optimization ✓ (Already Done)

- S3 + CloudFront CDN ✓
- Image resize to 1920×1920 ✓
- 85% JPEG quality ✓
- WebP generation ✓

**Additional Optimization:**
- Implement lazy loading for product images
- Use blur placeholders for better perceived performance

### 2.2 Code Splitting and Bundle Optimization

**Install Webpack Bundle Analyzer:**
```bash
npm install -D @next/bundle-analyzer
```

**Update next.config.ts:**
```typescript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... existing config
})
```

**Analyze bundle:**
```bash
ANALYZE=true npm run build
```

### 2.3 Lazy Loading Components

**Implement Dynamic Imports for Heavy Components:**
```typescript
// Example: Load Razorpay only when needed
import dynamic from 'next/dynamic'

const RazorpayCheckout = dynamic(
  () => import('@/components/RazorpayCheckout'),
  { loading: () => <p>Loading payment...</p> }
)
```

### 2.4 Enable Next.js Production Optimizations

**Update next.config.ts:**
```typescript
const nextConfig: NextConfig = {
  // Enable React strict mode for better debugging
  reactStrictMode: true,

  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // Compress responses
  compress: true,

  // Remove console.logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // ... rest of config
}
```

---

## Part 3: Monitoring and Analytics

### 3.1 Setup Vercel Analytics (FREE)

**Install Vercel Analytics:**
```bash
npm install @vercel/analytics
```

**Add to app/layout.tsx:**
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 3.2 Setup Error Tracking

**Option A: Sentry (Recommended - FREE tier available)**
```bash
npm install @sentry/nextjs
```

**Option B: Simple Error Logging**
Create custom error boundary and log to Supabase

### 3.3 Database Performance Monitoring

**Add Query Performance Tracking:**
```typescript
// Create lib/supabase-monitored.ts
import { supabase } from './supabase'

export async function monitoredQuery(
  queryName: string,
  queryFn: () => Promise<any>
) {
  const start = performance.now()
  try {
    const result = await queryFn()
    const duration = performance.now() - start

    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn(`Slow query: ${queryName} took ${duration.toFixed(2)}ms`)
    }

    return result
  } catch (error) {
    console.error(`Query failed: ${queryName}`, error)
    throw error
  }
}
```

---

## Part 4: Security Hardening

### 4.1 Environment Variables Validation

**Create lib/env.ts:**
```typescript
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
]

export function validateEnv() {
  const missing = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  )

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}
```

### 4.2 Rate Limiting for APIs

**Install rate limiter:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Or use simple in-memory rate limiting:**
```typescript
// lib/rate-limit.ts
const rateLimit = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const record = rateLimit.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimit.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}
```

### 4.3 Input Validation

**Install Zod for schema validation:**
```bash
npm install zod
```

**Example usage in API routes:**
```typescript
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(3).max(200),
  price: z.number().positive(),
  category: z.enum(['mens', 'womens', 'sarees', 'kids', 'beauty', 'footwear']),
})

// In API route
const validatedData = productSchema.parse(requestBody)
```

---

## Part 5: SEO Optimization

### 5.1 Add Metadata to All Pages

**Example for product pages:**
```typescript
// app/products/[id]/page.tsx
import { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await fetchProduct(params.id)

  return {
    title: `${product.name} - Sweta Fashion Points`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.main_image],
    },
  }
}
```

### 5.2 Add Sitemap

**Create app/sitemap.ts:**
```typescript
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchAllProducts()

  return [
    {
      url: 'https://fashionpoints.co.in',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...products.map((product) => ({
      url: `https://fashionpoints.co.in/products/${product.id}`,
      lastModified: product.updated_at,
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
  ]
}
```

### 5.3 Add robots.txt

**Create app/robots.ts:**
```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/seller/dashboard/', '/api/'],
    },
    sitemap: 'https://fashionpoints.co.in/sitemap.xml',
  }
}
```

---

## Part 6: Vercel Deployment Optimization

### 6.1 Configure Vercel Settings

**vercel.json:**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "regions": ["bom1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 6.2 Configure Caching

**next.config.ts:**
```typescript
const nextConfig: NextConfig = {
  // ... existing config

  async headers() {
    return [
      {
        source: '/products/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
}
```

---

## Part 7: Database Backup Strategy

### 7.1 Automated Backups

Supabase FREE tier includes:
- Daily automated backups (7-day retention)
- Point-in-time recovery (PITR) - NOT on free tier

**Manual Backup Script:**
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/supabase_backup_$DATE.sql"

pg_dump "$SUPABASE_DATABASE_URL" \
  --schema=public \
  --no-owner \
  --no-acl \
  -f "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"

# Upload to S3 for safety
aws s3 cp "$BACKUP_FILE" "s3://fashion-points-backups/"
```

**Schedule with cron (run weekly):**
```bash
0 2 * * 0 /path/to/backup-db.sh
```

---

## Part 8: Pre-Launch Checklist

### 8.1 Performance

- [ ] Lighthouse score > 90 on all pages
- [ ] Images optimized and lazy loaded ✓
- [ ] Code split and tree-shaken
- [ ] Bundle size < 200KB (main.js)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s

### 8.2 Security

- [ ] All API routes have authentication
- [ ] Rate limiting implemented
- [ ] Input validation with Zod
- [ ] Environment variables validated
- [ ] HTTPS enforced (Vercel default)
- [ ] Security headers configured

### 8.3 SEO

- [ ] Metadata on all pages
- [ ] Sitemap.xml generated
- [ ] robots.txt configured
- [ ] Google Analytics/Vercel Analytics installed
- [ ] Open Graph tags for social sharing
- [ ] Schema.org markup for products

### 8.4 Monitoring

- [ ] Error tracking (Sentry or custom)
- [ ] Analytics installed
- [ ] Slow query logging
- [ ] Uptime monitoring
- [ ] Database size monitoring

### 8.5 Functionality

- [ ] All user flows tested (buyer, seller, delivery partner, admin)
- [ ] Payment integration tested (Razorpay test mode)
- [ ] Email notifications working
- [ ] Order tracking functional
- [ ] Product approval workflow tested
- [ ] Delivery assignment working

---

## Part 9: Cost Monitoring

### Expected Monthly Costs (March 2026)

| Service | Plan | Cost (₹) |
|---------|------|----------|
| AWS S3 (50,000 images, ~10GB) | Pay-as-you-go | ₹150 |
| AWS CloudFront (100GB bandwidth) | Pay-as-you-go | ₹800 |
| Supabase Database | FREE tier | ₹0 |
| Vercel Hosting | Hobby | ₹0 |
| Domain (fashionpoints.co.in) | Yearly | ₹80/month |
| **TOTAL** | | **₹1,030/month** |

### When to Upgrade

**Supabase → Pro (₹2,100/month):**
- Database > 400MB
- Bandwidth > 5GB/month
- Need point-in-time recovery

**Vercel → Pro (₹1,700/month):**
- Bandwidth > 100GB/month
- Need team collaboration
- Need advanced analytics

---

## Part 10: Implementation Timeline

### Week 1: Performance (Feb 10-16)
- [ ] Implement client-side caching
- [ ] Optimize database queries
- [ ] Add lazy loading
- [ ] Bundle optimization

### Week 2: Monitoring (Feb 17-23)
- [ ] Setup Vercel Analytics
- [ ] Add error tracking
- [ ] Implement rate limiting
- [ ] Query performance monitoring

### Week 3: SEO & Security (Feb 24 - Mar 2)
- [ ] Add metadata to all pages
- [ ] Generate sitemap
- [ ] Input validation with Zod
- [ ] Security headers

### Week 4: Testing (Mar 3-9)
- [ ] Load testing with 1000 concurrent users
- [ ] Test all payment flows
- [ ] Verify seller and admin workflows
- [ ] Check mobile responsiveness

### Week 5: Final Polish (Mar 10-16)
- [ ] Final bug fixes
- [ ] Content review
- [ ] Backup strategy setup
- [ ] Documentation update

### Launch Week (Mar 17-23)
- [ ] Deploy to production
- [ ] Monitor performance
- [ ] Customer support ready
- [ ] 🎉 Launch!

---

## Next Steps

1. I'll implement the critical optimizations now
2. Create monitoring scripts
3. Setup pre-launch testing
4. Generate deployment checklist

Would you like me to start with the performance optimizations?
