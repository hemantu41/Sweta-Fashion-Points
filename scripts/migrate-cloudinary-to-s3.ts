/**
 * Migration Script: Cloudinary to AWS S3
 *
 * This script migrates all product images from Cloudinary to AWS S3.
 *
 * Usage:
 *   npx tsx scripts/migrate-cloudinary-to-s3.ts
 *
 * What it does:
 * 1. Fetches all products with Cloudinary images
 * 2. Downloads each image from Cloudinary
 * 3. Uploads to S3 with optimization (resize, compress, WebP)
 * 4. Updates database with new S3 keys
 * 5. Logs progress and errors
 */

import { createClient } from '@supabase/supabase-js';
import { uploadImageToS3 } from '../src/lib/s3-upload-optimized';
import fetch from 'node-fetch';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Product {
  id: string;
  product_id: string;
  name: string;
  main_image: string;
  images: string[];
  category: string;
  seller_id: string;
}

async function downloadImageFromCloudinary(cloudinaryUrl: string): Promise<Buffer> {
  const response = await fetch(cloudinaryUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function migrateProduct(product: Product, dryRun: boolean = false): Promise<boolean> {
  try {
    console.log(`\n📦 Migrating product: ${product.name} (${product.product_id})`);

    // Migrate main image
    let newMainImage = product.main_image;
    if (product.main_image && !product.main_image.startsWith('http')) {
      // This is a Cloudinary public_id
      const cloudinaryUrl = `https://res.cloudinary.com/duoxrodmv/image/upload/${product.main_image}`;

      console.log(`  📥 Downloading main image from Cloudinary...`);
      const imageBuffer = await downloadImageFromCloudinary(cloudinaryUrl);

      if (!dryRun) {
        console.log(`  ⬆️  Uploading main image to S3...`);
        const result = await uploadImageToS3(imageBuffer, `${product.product_id}-main.jpg`, {
          category: product.category,
          sellerId: product.seller_id,
          productId: product.product_id,
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 85,
          generateWebP: true,
        });

        newMainImage = result.key;
        console.log(`  ✅ Main image uploaded: ${result.url}`);
        console.log(`  🌐 WebP version: ${result.webpUrl}`);
      } else {
        console.log(`  [DRY RUN] Would upload main image to S3`);
      }
    }

    // Migrate additional images
    const newImages: string[] = [];
    if (product.images && product.images.length > 0) {
      for (let i = 0; i < product.images.length; i++) {
        const imageId = product.images[i];

        if (!imageId || imageId.startsWith('http')) {
          // Already migrated or invalid
          newImages.push(imageId);
          continue;
        }

        const cloudinaryUrl = `https://res.cloudinary.com/duoxrodmv/image/upload/${imageId}`;

        console.log(`  📥 Downloading image ${i + 1}/${product.images.length} from Cloudinary...`);
        const imageBuffer = await downloadImageFromCloudinary(cloudinaryUrl);

        if (!dryRun) {
          console.log(`  ⬆️  Uploading image ${i + 1} to S3...`);
          const result = await uploadImageToS3(imageBuffer, `${product.product_id}-${i + 1}.jpg`, {
            category: product.category,
            sellerId: product.seller_id,
            productId: product.product_id,
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 85,
            generateWebP: true,
          });

          newImages.push(result.key);
          console.log(`  ✅ Image ${i + 1} uploaded: ${result.url}`);
        } else {
          console.log(`  [DRY RUN] Would upload image ${i + 1} to S3`);
          newImages.push(imageId); // Keep old for dry run
        }
      }
    }

    // Update database
    if (!dryRun) {
      console.log(`  💾 Updating database...`);
      const { error } = await supabase
        .from('spf_productdetails')
        .update({
          main_image: newMainImage,
          images: newImages.length > 0 ? newImages : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (error) {
        throw error;
      }
      console.log(`  ✅ Database updated successfully`);
    } else {
      console.log(`  [DRY RUN] Would update database with new S3 keys`);
    }

    return true;
  } catch (error: any) {
    console.error(`  ❌ Error migrating product ${product.product_id}:`, error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];

  console.log('\n🚀 Starting Cloudinary to S3 Migration');
  console.log('=====================================\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
    console.log('   Remove --dry-run flag to perform actual migration\n');
  }

  // Fetch all products with Cloudinary images
  console.log('📊 Fetching products from database...');

  let query = supabase
    .from('spf_productdetails')
    .select('id, product_id, name, main_image, images, category, seller_id')
    .not('main_image', 'is', null)
    .not('main_image', 'like', '%cloudfront%') // Skip already migrated
    .not('main_image', 'like', '%amazonaws%') // Skip S3 URLs
    .order('created_at', { ascending: true });

  if (limit) {
    query = query.limit(parseInt(limit));
  }

  const { data: products, error } = await query;

  if (error) {
    console.error('❌ Error fetching products:', error);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('✅ No products found to migrate. All images are already on S3!');
    process.exit(0);
  }

  console.log(`\n📦 Found ${products.length} products to migrate\n`);

  // Migrate each product
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i] as unknown as Product;
    console.log(`\nProgress: ${i + 1}/${products.length}`);

    const success = await migrateProduct(product, dryRun);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n\n=====================================');
  console.log('📊 Migration Summary');
  console.log('=====================================');
  console.log(`Total products: ${products.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN - no changes were made');
    console.log('Run without --dry-run flag to perform actual migration');
  } else {
    console.log('\n🎉 Migration completed!');
  }
}

main().catch(console.error);
