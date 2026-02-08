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
      .select('*')
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

// PUT /api/products/[id] - Update product (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json();
    const { userId, product } = body;

    // Check admin authorization
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Build update object (only include provided fields)
    const updateData: any = { updated_by: userId };

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

// DELETE /api/products/[id] - Soft delete product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Check admin authorization
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Soft delete (set is_active to false)
    const { error } = await supabase
      .from('spf_productdetails')
      .update({ is_active: false, updated_by: userId })
      .eq('product_id', productId);

    if (error) {
      console.error('Product delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete product' },
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
