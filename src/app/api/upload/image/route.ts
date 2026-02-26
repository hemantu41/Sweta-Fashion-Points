import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToS3 } from '@/lib/s3-upload-optimized';

// POST /api/upload/image - Upload image to AWS S3 with optimization
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sellerId = formData.get('sellerId') as string | null;
    const category = formData.get('category') as string | null;
    const productId = formData.get('productId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB before optimization)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3 with optimization
    const result = await uploadImageToS3(buffer, file.name, {
      sellerId: sellerId || undefined,
      category: category || undefined,
      productId: productId || undefined,
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 85,
      generateWebP: true,
    });

    // Return S3 key as imageId for backward compatibility
    // Extract just the filename part from the key for compatibility with existing code
    // For example: "products/mens/123/1234567890-image.jpg" -> full key
    const imageId = result.key;

    return NextResponse.json({
      success: true,
      imageId, // This is now the S3 key instead of Cloudinary public_id
      url: result.url,
      webpUrl: result.webpUrl,
      width: result.width,
      height: result.height,
      size: result.size,
    });
  } catch (error: any) {
    console.error('[Image Upload API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
