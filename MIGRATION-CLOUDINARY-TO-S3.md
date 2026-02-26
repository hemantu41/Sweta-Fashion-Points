# Cloudinary to AWS S3 Migration Guide

This document explains the migration from Cloudinary to AWS S3 + CloudFront CDN for image storage.

## ✅ What's Already Done

1. **AWS S3 + CloudFront Setup** ✓
   - S3 bucket: `fashion-points-images-2024`
   - CloudFront CDN: `d3p9b9yka11dgj.cloudfront.net`
   - Region: `ap-south-1` (Mumbai)

2. **Code Updates** ✓
   - Image upload API now uses S3 instead of Cloudinary
   - Image optimization with Sharp (resize, compress, WebP)
   - Upload components support both legacy Cloudinary and new S3 images
   - CloudinaryImage component auto-detects image source type

3. **Features Implemented** ✓
   - Automatic image optimization (max 1920x1920, 85% quality)
   - WebP format generation for modern browsers
   - CloudFront CDN for fast global delivery
   - 1-year cache headers for optimal performance

## 🚀 Migration Steps

### Step 1: Test Upload (Already Working!)

The upload system is already using S3. Test it:

```bash
# Visit the test page
http://localhost:3000/test-upload

# Or create a new product as a seller
http://localhost:3000/seller/dashboard/products/new
```

New uploads will automatically go to S3 and be served via CloudFront CDN.

### Step 2: Migrate Existing Images

Run the migration script to copy existing Cloudinary images to S3:

```bash
# Dry run first (no changes, just shows what would happen)
npx tsx scripts/migrate-cloudinary-to-s3.ts --dry-run

# Migrate first 10 products (test)
npx tsx scripts/migrate-cloudinary-to-s3.ts --limit=10

# Migrate all products
npx tsx scripts/migrate-cloudinary-to-s3.ts
```

**What the script does:**
1. Fetches all products with Cloudinary images from database
2. Downloads each image from Cloudinary
3. Optimizes and uploads to S3 (with WebP version)
4. Updates database with new S3 keys
5. Logs progress and errors

**Time estimate:** ~5-10 seconds per product (depends on image size and count)

### Step 3: Verify Migration

After migration, verify that:

1. **Product pages load correctly:**
   - Visit some product detail pages
   - Check that images load from CloudFront
   - Inspect image URLs (should start with `https://d3p9b9yka11dgj.cloudfront.net/`)

2. **Check database:**
   ```sql
   SELECT product_id, name, main_image, images
   FROM spf_productdetails
   WHERE main_image LIKE '%cloudfront%'
   LIMIT 10;
   ```

3. **Check S3 bucket:**
   - Login to AWS Console → S3
   - Open `fashion-points-images-2024` bucket
   - Verify images are organized in folders: `products/category/seller_id/`

### Step 4: Monitor for Issues

**Common issues and fixes:**

1. **Images not loading:**
   - Check CloudFront distribution status (should be "Deployed")
   - Verify S3 bucket policy allows public read
   - Check Next.js config has CloudFront domain in `remotePatterns`

2. **Slow first load:**
   - First load might be slow as CloudFront caches the image
   - Subsequent loads will be instant (cached globally)

3. **Migration errors:**
   - Check Cloudinary URLs are accessible
   - Verify AWS credentials are correct
   - Check S3 bucket has enough space

### Step 5: (Optional) Remove Cloudinary

**After confirming all images are migrated and working:**

1. **Remove Cloudinary packages:**
   ```bash
   npm uninstall cloudinary next-cloudinary
   ```

2. **Remove Cloudinary env variables from `.env.local`:**
   ```bash
   # Remove these lines:
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

3. **Update components:**
   - Rename `CloudinaryImage` to `OptimizedImage`
   - Remove CldImage import and usage
   - Simplify to only use Next.js Image component

4. **Update Vercel environment variables:**
   - Remove Cloudinary variables
   - Keep AWS S3 variables

## 📊 Cost Comparison

### Before (Cloudinary)
- **Cloudinary Plus:** ₹7,500/month
- **Storage:** 50,000 images
- **Bandwidth:** 100GB/month
- **Total:** ₹7,500/month

### After (AWS S3 + CloudFront)
- **S3 Storage:** ~₹150/month (10GB)
- **S3 Requests:** ~₹50/month
- **CloudFront:** ~₹800/month (100GB bandwidth)
- **Total:** ~₹1,000/month

**Savings:** ₹6,500/month (~85% reduction!) 🎉

## 🔧 Technical Details

### Image Optimization

All uploaded images are optimized with:
- Resize to max 1920x1920 (maintains aspect ratio)
- JPEG quality: 85% (good balance of quality/size)
- WebP generation for ~30% better compression
- Mozjpeg encoder for better compression

### Folder Structure in S3

```
products/
  ├── mens/
  │   ├── seller-uuid/
  │   │   ├── 1234567890-product.jpg
  │   │   └── 1234567890-product.webp
  │   └── ...
  ├── womens/
  ├── sarees/
  ├── kids/
  ├── beauty/
  └── footwear/
```

### Image URL Formats

**S3 Key (stored in database):**
```
products/mens/abc-123/1234567890-tshirt.jpg
```

**CloudFront URL (served to users):**
```
https://d3p9b9yka11dgj.cloudfront.net/products/mens/abc-123/1234567890-tshirt.jpg
```

**WebP version:**
```
https://d3p9b9yka11dgj.cloudfront.net/products/mens/abc-123/1234567890-tshirt.webp
```

### Backward Compatibility

The system supports **three image formats simultaneously:**

1. **Legacy Cloudinary IDs:**
   - Format: `sweta-fashion-points/abc123`
   - Still works via Cloudinary (until fully migrated)

2. **S3 Keys:**
   - Format: `products/mens/seller/12345-image.jpg`
   - Converted to CloudFront URL automatically

3. **Full URLs:**
   - Format: `https://d3p9b9yka11dgj.cloudfront.net/...`
   - Used as-is

This allows for **gradual migration** without breaking existing products.

## 🎯 Next Steps

1. **Test upload:** Create a new product with images ✓
2. **Run migration:** Migrate existing images from Cloudinary to S3
3. **Verify:** Check that all product pages load correctly
4. **Monitor:** Watch for any image loading issues
5. **Remove Cloudinary:** Once confirmed all working (optional)

## 📞 Support

If you encounter any issues:

1. Check the console for errors (F12 → Console)
2. Verify AWS credentials in `.env.local`
3. Check S3 bucket permissions
4. Review migration script logs
5. Check CloudFront distribution status

---

**Migration Date:** February 27, 2026
**Status:** Ready to migrate
**Estimated Time:** 2-4 hours for full migration
