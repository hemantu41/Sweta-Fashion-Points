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
    const sellerId = searchParams.get('sellerId'); // NEW: Filter by seller

    // Build query
    let query = supabase.from('spf_productdetails').select('*');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (subCategory) {
      query = query.eq('sub_category', subCategory);
    }
    if (isNewArrival === 'true') {
      query = query.eq('is_new_arrival', true);
    }
    if (isBestSeller === 'true') {
      query = query.eq('is_best_seller', true);
    }
    if (priceRange) {
      query = query.eq('price_range', priceRange);
    }
    if (isActive !== 'all') {
      query = query.eq('is_active', true);
    }
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    const { data: products, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Products API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend
    const transformedProducts = products?.map(p => ({
      id: p.id,
      productId: p.product_id,
      name: p.name,
      nameHi: p.name_hi,
      category: p.category,
      subCategory: p.sub_category,
      price: p.price,
      originalPrice: p.original_price,
      priceRange: p.price_range,
      description: p.description,
      descriptionHi: p.description_hi,
      fabric: p.fabric,
      fabricHi: p.fabric_hi,
      mainImage: p.main_image,
      images: p.images || [],
      colors: p.colors || [],
      sizes: p.sizes || [],
      stockQuantity: p.stock_quantity,
      isNewArrival: p.is_new_arrival,
      isBestSeller: p.is_best_seller,
      isActive: p.is_active,
      sellerId: p.seller_id,
    })) || [];

    console.log(`[Products API] Returning ${transformedProducts.length} products for category: ${category}`);

    return NextResponse.json({ products: transformedProducts });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product (Admin or Seller)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sellerId, product } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Check if user is admin or approved seller
    const userIsAdmin = await isAdmin(userId);
    let userSellerId = sellerId;

    if (!userIsAdmin) {
      // Check if user is an approved seller
      const { data: sellerData } = await supabase
        .from('spf_sellers')
        .select('id, status')
        .eq('user_id', userId)
        .single();

      if (!sellerData || sellerData.status !== 'approved') {
        return NextResponse.json(
          { error: 'Unauthorized. Only admins and approved sellers can create products.' },
          { status: 403 }
        );
      }

      userSellerId = sellerData.id;
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

    // Update seller profile with shop information if provided
    if (userSellerId && (product.shopName || product.shopMobile || product.shopLocation)) {
      const updateData: any = {};

      if (product.shopName) updateData.business_name = product.shopName;
      if (product.shopMobile) updateData.business_phone = product.shopMobile;
      if (product.shopLocation) updateData.address_line1 = product.shopLocation;

      await supabase
        .from('spf_sellers')
        .update(updateData)
        .eq('id', userSellerId);
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
        seller_id: userSellerId || null,
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
