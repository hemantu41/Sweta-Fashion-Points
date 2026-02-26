import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface ImageUploadOptions {
  sellerId?: string;
  category?: string;
  productId?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  generateWebP?: boolean;
}

export interface UploadResult {
  url: string;
  webpUrl?: string;
  key: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Upload image to S3 with optimization
 * - Resize to max dimensions
 * - Compress with quality setting
 * - Optionally generate WebP format
 * - Return CloudFront CDN URLs
 */
export async function uploadImageToS3(
  fileBuffer: Buffer,
  fileName: string,
  options: ImageUploadOptions = {}
): Promise<UploadResult> {
  const {
    sellerId,
    category,
    productId,
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
    generateWebP = true,
  } = options;

  // Build folder structure
  let folder = 'products';
  if (category) folder += `/${category}`;
  if (sellerId) folder += `/${sellerId}`;

  // Get image metadata
  const image = sharp(fileBuffer);
  const metadata = await image.metadata();

  // Optimize and resize image
  const optimizedBuffer = await image
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  // Get optimized dimensions
  const optimizedMetadata = await sharp(optimizedBuffer).metadata();

  // Generate unique key
  const timestamp = Date.now();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${timestamp}-${cleanFileName}`;

  // Upload JPEG version
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      Body: optimizedBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'max-age=31536000, public, immutable', // 1 year cache
      Metadata: {
        originalWidth: String(metadata.width || ''),
        originalHeight: String(metadata.height || ''),
        sellerId: sellerId || '',
        category: category || '',
        productId: productId || '',
      },
    })
  );

  const result: UploadResult = {
    url: `${process.env.NEXT_PUBLIC_CDN_URL}/${key}`,
    key,
    width: optimizedMetadata.width || 0,
    height: optimizedMetadata.height || 0,
    size: optimizedBuffer.length,
  };

  // Generate and upload WebP version if requested
  if (generateWebP) {
    const webpBuffer = await sharp(fileBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    const webpKey = key.replace(/\.(jpg|jpeg|png)$/i, '.webp');

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: webpKey,
        Body: webpBuffer,
        ContentType: 'image/webp',
        CacheControl: 'max-age=31536000, public, immutable',
        Metadata: {
          originalWidth: String(metadata.width || ''),
          originalHeight: String(metadata.height || ''),
          sellerId: sellerId || '',
          category: category || '',
          productId: productId || '',
        },
      })
    );

    result.webpUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/${webpKey}`;
  }

  return result;
}

/**
 * Upload multiple images in parallel
 */
export async function uploadMultipleImages(
  files: { buffer: Buffer; fileName: string }[],
  options: ImageUploadOptions = {}
): Promise<UploadResult[]> {
  const uploadPromises = files.map(({ buffer, fileName }) =>
    uploadImageToS3(buffer, fileName, options)
  );

  return Promise.all(uploadPromises);
}

/**
 * Delete image from S3
 */
export async function deleteImageFromS3(key: string): Promise<void> {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
    })
  );

  // Also delete WebP version if exists
  const webpKey = key.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: webpKey,
      })
    );
  } catch (error) {
    // WebP version might not exist, ignore error
  }
}
