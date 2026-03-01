import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/products/[id] - Fetch single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch product with seller information
    const { data: product, error } = await supabase
      .from('spf_productdetails')
      .select(`
        *,
        seller:spf_sellers!spf_productdetails_seller_id_fkey (
          id,
          business_name,
          business_name_hi,
          city,
          state,
          business_phone
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('[Product API] Database error:', error);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Allow sellers to view their own products regardless of approval status
    const sellerIdParam = request.nextUrl.searchParams.get('sellerId');
    const isSellerViewingOwnProduct = sellerIdParam && product.seller_id === sellerIdParam;

    // Only show approved and active products to customers (not sellers viewing their own)
    if (!isSellerViewingOwnProduct && (product.approval_status !== 'approved' || !product.is_active)) {
      return NextResponse.json(
        { error: 'Product not available' },
        { status: 404 }
      );
    }

    // Transform to camelCase for frontend
    const transformedProduct = {
      id: product.id,
      productId: product.product_id,
      name: product.name,
      nameHi: product.name_hi,
      category: product.category,
      subCategory: product.sub_category,
      price: product.price,
      originalPrice: product.original_price,
      priceRange: product.price_range,
      description: product.description,
      descriptionHi: product.description_hi,
      fabric: product.fabric,
      fabricHi: product.fabric_hi,
      mainImage: product.main_image,
      images: product.images || [],
      colors: product.colors || [],
      sizes: product.sizes || [],
      stockQuantity: product.stock_quantity,
      isNewArrival: product.is_new_arrival,
      isBestSeller: product.is_best_seller,
      isActive: product.is_active,
      approvalStatus: product.approval_status,
      sellerId: product.seller_id,
      seller: product.seller ? {
        id: product.seller.id,
        businessName: product.seller.business_name,
        businessNameHi: product.seller.business_name_hi,
        city: product.seller.city,
        state: product.seller.state,
        businessPhone: product.seller.business_phone,
      } : null,
    };

    return NextResponse.json({ product: transformedProduct });
  } catch (error) {
    console.error('[Product API] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product (Admin or Seller)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, product } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Update product
    const { data: updatedProduct, error } = await supabase
      .from('spf_productdetails')
      .update({
        name: product.name,
        name_hi: product.nameHi,
        category: product.category,
        sub_category: product.subCategory,
        price: product.price,
        original_price: product.originalPrice,
        price_range: product.priceRange,
        description: product.description,
        description_hi: product.descriptionHi,
        fabric: product.fabric,
        fabric_hi: product.fabricHi,
        main_image: product.mainImage,
        images: product.images,
        colors: product.colors,
        sizes: product.sizes,
        stock_quantity: product.stockQuantity,
        is_new_arrival: product.isNewArrival,
        is_best_seller: product.isBestSeller,
        is_active: product.isActive,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Product API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('[Product API] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Soft delete product (Admin or Seller owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    // Get userId and deletionReason from query params or body
    const url = new URL(request.url);
    const userIdFromQuery = url.searchParams.get('userId');

    let userId = userIdFromQuery;
    let deletionReason = 'Deleted by user';
    let deletedByRole = 'unknown';

    // Try to read body (can only be read once!)
    let bodyData: any = null;
    try {
      bodyData = await request.json();
    } catch (e) {
      // No body or invalid JSON
    }

    // Use body data if available
    if (bodyData) {
      userId = bodyData.userId || userId;
      deletionReason = bodyData.deletionReason || deletionReason;
      deletedByRole = bodyData.deletedByRole || deletedByRole;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Get product to check ownership and current deletion status
    // Query by UUID (id) for reliability - product_id (custom string) may be null
    const { data: product, error: fetchError } = await supabase
      .from('spf_productdetails')
      .select('id, product_id, seller_id, name, deleted_at')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or the seller who owns the product
    const { data: user } = await supabase
      .from('spf_users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    const isAdmin = user?.is_admin || false;

    // If not admin, check if user owns the product through seller
    if (!isAdmin && product.seller_id) {
      const { data: seller } = await supabase
        .from('spf_sellers')
        .select('id')
        .eq('id', product.seller_id)
        .eq('user_id', userId)
        .single();

      if (!seller) {
        return NextResponse.json(
          { error: 'Unauthorized - You can only delete your own products' },
          { status: 403 }
        );
      }
    } else if (!isAdmin && !product.seller_id) {
      // Product has no seller (admin product), only admin can delete
      return NextResponse.json(
        { error: 'Unauthorized - Only admin can delete this product' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const isFirstDeletion = !product.deleted_at;

    // Step 1: Always add to deletion history table (tracks complete audit trail)
    // Use product.product_id (custom string) for history FK, not the UUID
    const { error: historyError } = await supabase
      .from('spf_product_deletion_history')
      .insert({
        product_id: product.product_id,
        product_name: product.name,
        deleted_by: userId,
        deleted_by_role: deletedByRole,
        deletion_reason: deletionReason,
        deleted_at: now,
      });

    if (historyError) {
      console.error('[Product API] Deletion history error:', historyError);
      return NextResponse.json(
        { error: 'Failed to record deletion history' },
        { status: 500 }
      );
    }

    // Step 2: Only update main table if this is the first deletion
    // This preserves the original deletion info in the main table
    if (isFirstDeletion) {
      const { error: deleteError } = await supabase
        .from('spf_productdetails')
        .update({
          deleted_at: now,
          deleted_by: userId,
          deleted_by_role: deletedByRole,
          deletion_reason: deletionReason,
          is_active: false, // Also mark as inactive
          updated_at: now,
        })
        .eq('id', productId);

      if (deleteError) {
        console.error('[Product API] Delete error:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete product' },
          { status: 500 }
        );
      }
    }

    // Clear product cache
    const { productCache } = await import('@/lib/cache');
    productCache.clear();

    return NextResponse.json({
      message: isFirstDeletion
        ? 'Product deleted successfully'
        : 'Deletion recorded in history (product was already deleted)',
      success: true,
      isFirstDeletion,
    });
  } catch (error) {
    console.error('[Product API] Delete error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
