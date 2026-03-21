import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { clearAllSellerCache } from '@/lib/sellerCache';

// POST /api/logout — destroy session cookie + clear seller Redis cache
export async function POST(request: NextRequest) {
  try {
    // Optionally clear seller Redis cache if sellerId is passed
    const body = await request.json().catch(() => ({}));
    if (body?.sellerId) {
      clearAllSellerCache(body.sellerId).catch(() => {});
    }
  } catch { /* silent */ }

  const session = await getSession();
  session.destroy();
  return NextResponse.json({ message: 'Logged out successfully' });
}
