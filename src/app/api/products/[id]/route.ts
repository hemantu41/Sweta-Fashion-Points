import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('spf_users')
    .select('is_admin')
    .eq('id', userId)
    .single();
  return data?.is_admin || false;
}

// GET /api/products/[id] - Fetch single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

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
      .eq('product_id', productId)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Transform to camelCase
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
      sellerId: product.seller_id,
      // Seller information
      seller: product.seller ? {
        id: product.seller.id,
        businessName: product.seller.business_name,
        businessNameHi: product.seller.business_name_hi,
        city: product.seller.city,
        state: product.seller.state,
        businessPhone: product.seller.business_phone,
      } : null,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };

    console.log(`[Product API] Found product: ${transformedProduct.name}`);

    return NextResponse.json({ product: transformedProduct });
  } catch (error) {
    console.error('Product fetch error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// Helper to check if user can edit product
async function canEditProduct(userId: string, productId: string): Promise<boolean> {
  // Check if user is admin
  if (await isAdmin(userId)) {
    return true;
  }

  // Check if user is the seller who owns this product
  const { data: product } = await supabase
    .from('spf_productdetails')
    .select('seller_id')
    .eq('product_id', productId)
    .single();

  if (!product?.seller_id) {
    // Product has no seller (legacy product) - only admin can edit
    return false;
  }

  // Check if user owns this seller account
  const { data: seller } = await supabase
    .from('spf_sellers')
    .select('user_id, status')
    .eq('id', product.seller_id)
    .single();

  return seller?.user_id === userId && seller?.status === 'approved';
}

// PUT /api/products/[id] - Update product (Admin or product owner)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json();
    const { userId, product } = body;

    // Check authorization
    if (!userId || !(await canEditProduct(userId, productId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(userId);

    // Build update object (only include provided fields)
    const updateData: any = { updated_by: userId };

    // If seller (not admin) is editing, reset to pending approval
    if (!userIsAdmin) {
      updateData.approval_status = 'pending';
      updateData.is_active = false;
      updateData.approved_by = null;
      updateData.approved_at = null;
    }

    if (product.name !== undefined) updateData.name = product.name;
    if (product.nameHi !== undefined) updateData.name_hi = product.nameHi;
    if (product.category !== undefined) updateData.category = product.category;
    if (product.subCategory !== undefined) updateData.sub_category = product.subCategory;
    if (product.price !== undefined) updateData.price = product.price;
    if (product.originalPrice !== undefined) updateData.original_price = product.originalPrice;
    if (product.priceRange !== undefined) updateData.price_range = product.priceRange;
    if (product.description !== undefined) updateData.description = product.description;
    if (product.descriptionHi !== undefined) updateData.description_hi = product.descriptionHi;
    if (product.fabric !== undefined) updateData.fabric = product.fabric;
    if (product.fabricHi !== undefined) updateData.fabric_hi = product.fabricHi;
    if (product.mainImage !== undefined) updateData.main_image = product.mainImage;
    if (product.images !== undefined) updateData.images = product.images;
    if (product.colors !== undefined) updateData.colors = product.colors;
    if (product.sizes !== undefined) updateData.sizes = product.sizes;
    if (product.stockQuantity !== undefined) updateData.stock_quantity = product.stockQuantity;
    if (product.isNewArrival !== undefined) updateData.is_new_arrival = product.isNewArrival;
    if (product.isBestSeller !== undefined) updateData.is_best_seller = product.isBestSeller;
    if (product.isActive !== undefined) updateData.is_active = product.isActive;

    const { data: updatedProduct, error } = await supabase
      .from('spf_productdetails')
      .update(updateData)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) {
      console.error('Product update error:', error);
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
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Soft delete product (Admin or product owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json();
    const { userId, deletionReason } = body;

    // Check authorization
    if (!userId || !(await canEditProduct(userId, productId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Require deletion reason for approved products
    if (!deletionReason || deletionReason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Deletion reason is required' },
        { status: 400 }
      );
    }

    // Soft delete (mark as inactive and deleted)
    // Use supabaseAdmin to bypass RLS for authorized deletions
    const { supabaseAdmin } = await import('@/lib/supabase-admin');
    const { error } = await supabaseAdmin
      .from('spf_productdetails')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deletion_reason: deletionReason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', productId);

    if (error) {
      console.error('Product delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete product', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
