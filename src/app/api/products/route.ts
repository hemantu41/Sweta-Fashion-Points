import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { publicGet, publicInvalidate } from '@/lib/publicCache';
import { notifyProductSubmitted } from '@/lib/notifications/productNotifications';
import { filterProductsByDistance } from '@/lib/pincode-distance';

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
    const search = searchParams.get('search'); // NEW: Search query
    const limit = searchParams.get('limit');   // Optional result limit (e.g. autocomplete)
    const userLat = searchParams.get('userLat');   // Location-based filter
    const userLng = searchParams.get('userLng');   // Location-based filter
    // Note: _t parameter is ignored for cache key (used only for browser cache busting)

    // Public cache only for unauthenticated, non-search, non-location queries.
    // Seller / admin queries and search are always real-time (no public cache).
    const isPublicQuery = !search && !(userLat && userLng) && !sellerId && searchParams.get('includeAllStatuses') !== 'true';
    const cacheKey = `pub:products:${category || 'all'}:${subCategory || 'all'}:${isNewArrival || 'any'}:${isBestSeller || 'any'}:${priceRange || 'any'}:${isActive || 'active'}`;

    // Function to fetch products
    const fetchProducts = async () => {
      // Build query with seller information
      let query = supabase.from('spf_productdetails').select(`
        *,
        seller:spf_sellers!spf_productdetails_seller_id_fkey (
          id,
          business_name,
          business_name_hi,
          city,
          state,
          business_phone,
          latitude,
          longitude
        )
      `);

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
        // Exclude soft-deleted products from seller dashboard
        query = query.is('deleted_at', null);
      }
      if (search) {
        // Strategy 1: Exact substring match across all searchable fields (includes product_id)
        const orClauses: string[] = [
          `name.ilike.%${search}%`,
          `name_hi.ilike.%${search}%`,
          `description.ilike.%${search}%`,
          `description_hi.ilike.%${search}%`,
          `fabric.ilike.%${search}%`,
          `fabric_hi.ilike.%${search}%`,
          `category.ilike.%${search}%`,
          `sub_category.ilike.%${search}%`,
          `product_id.ilike.%${search}%`,
        ];

        // Strategy 2: Fuzzy typo-tolerance — replace vowel groups with SQL wildcard %
        // e.g. "tshart" → "tsh%rt" → matches "tshirts"
        // Only applies to terms ≥4 chars that contain vowels
        if (search.length >= 4) {
          const fuzzy = search.replace(/[aeiou]+/gi, '%');
          if (fuzzy !== search) {
            orClauses.push(`name.ilike.%${fuzzy}%`, `name_hi.ilike.%${fuzzy}%`);
          }
        }

        query = query.or(orClauses.join(','));
      }

      // IMPORTANT: Only show approved products for customer-facing queries
      // Sellers querying their own products can see all statuses
      // Admin can use includeAllStatuses=true to see pending/rejected products
      const includeAllStatuses = searchParams.get('includeAllStatuses') === 'true';
      if (!sellerId && !includeAllStatuses) {
        query = query.eq('approval_status', 'approved');
        // Customer-facing queries should also exclude deleted products
        query = query.is('deleted_at', null);
      }

      // Apply optional limit (used by autocomplete dropdown)
      const lim = limit ? parseInt(limit) : 0;
      if (lim > 0) query = query.limit(lim);

      const { data: products, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[Products API] Database error:', error);
        throw new Error('Failed to fetch products');
      }

      // Transform to camelCase for frontend
      return products?.map(p => ({
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
        approvalStatus: p.approval_status,
        rejectionReason: p.rejection_reason,
        sellerId: p.seller_id,
        // Deletion tracking
        deletedAt: p.deleted_at,
        deletedBy: p.deleted_by,
        deletedByRole: p.deleted_by_role,
        deletionReason: p.deletion_reason,
        // Seller information
        seller: p.seller ? {
          id: p.seller.id,
          businessName: p.seller.business_name,
          businessNameHi: p.seller.business_name_hi,
          city: p.seller.city,
          state: p.seller.state,
          businessPhone: p.seller.business_phone,
          latitude: p.seller.latitude != null ? Number(p.seller.latitude) : null,
          longitude: p.seller.longitude != null ? Number(p.seller.longitude) : null,
        } : null,
      })) || [];
    };

    // Use two-tier public cache (L1 memory → L2 Redis → DB) for public queries.
    // Search / location / seller / admin queries always hit the DB directly.
    let transformedProducts = isPublicQuery
      ? await publicGet(cacheKey, fetchProducts, 600)
      : await fetchProducts();

    // Apply 35 km distance filter when user coordinates are provided
    if (userLat && userLng) {
      const lat = parseFloat(userLat);
      const lng = parseFloat(userLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        const before = transformedProducts.length;
        transformedProducts = filterProductsByDistance(transformedProducts, lat, lng);
        console.log(`[Products API] Location filter (${lat},${lng}): ${before} → ${transformedProducts.length} products`);
      }
    }

    console.log(`[Products API] Returning ${transformedProducts.length} products${search ? ` for search: "${search}"` : category ? ` for category: ${category}` : ''}`);

    // Public queries get aggressive CDN caching via Cache-Control headers.
    // Vercel Edge Network (or any CDN) will serve subsequent requests from
    // edge cache without hitting the origin — achieving near-zero latency.
    const cacheHeaders = isPublicQuery
      ? { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
      : { 'Cache-Control': 'private, no-store' };

    return NextResponse.json({ products: transformedProducts }, { headers: cacheHeaders });
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
    // Admins create approved products, sellers create pending products
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
        is_active: userIsAdmin ? (product.isActive !== false) : false, // Sellers: inactive until approved
        approval_status: userIsAdmin ? 'approved' : 'pending', // Sellers need approval
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

    // Invalidate public product cache (in-memory L1 + Redis L2)
    publicInvalidate('pub:products:*').catch(() => {});

    // Notify seller (non-blocking — does not delay API response)
    // Only for seller-submitted products; admin-created products skip the review queue
    if (!userIsAdmin && newProduct?.id) {
      void notifyProductSubmitted(newProduct.id);
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
