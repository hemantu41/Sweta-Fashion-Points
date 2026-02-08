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

// GET /api/products - Fetch products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subCategory = searchParams.get('subCategory');
    const isNewArrival = searchParams.get('isNewArrival');
    const isBestSeller = searchParams.get('isBestSeller');
    const priceRange = searchParams.get('priceRange');
    const isActive = searchParams.get('isActive');

    // TEMPORARY FIX: Use static products file instead of database
    const { products: staticProducts } = await import('@/data/products');

    let filteredProducts = staticProducts;

    // Apply filters
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    if (subCategory) {
      filteredProducts = filteredProducts.filter(p => p.subCategory === subCategory);
    }
    if (isNewArrival === 'true') {
      filteredProducts = filteredProducts.filter(p => p.isNewArrival);
    }
    if (isBestSeller === 'true') {
      filteredProducts = filteredProducts.filter(p => p.isBestSeller);
    }
    if (priceRange) {
      filteredProducts = filteredProducts.filter(p => p.priceRange === priceRange);
    }

    console.log(`[Products API] Returning ${filteredProducts.length} products for category: ${category}`);

    return NextResponse.json({ products: filteredProducts });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, product } = body;

    // Check admin authorization
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!product.productId || !product.name || !product.category || !product.price) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, name, category, price' },
        { status: 400 }
      );
    }

    // Check if product ID already exists
    const { data: existing } = await supabase
      .from('spf_productdetails')
      .select('id')
      .eq('product_id', product.productId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Product ID already exists' },
        { status: 400 }
      );
    }

    // Insert product
    const { data: newProduct, error } = await supabase
      .from('spf_productdetails')
      .insert({
        product_id: product.productId,
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
        images: product.images || [],
        colors: product.colors || [],
        sizes: product.sizes || [],
        stock_quantity: product.stockQuantity || 0,
        is_new_arrival: product.isNewArrival || false,
        is_best_seller: product.isBestSeller || false,
        is_active: product.isActive !== false,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Product creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
