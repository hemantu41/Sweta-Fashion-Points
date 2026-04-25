import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// GET /api/me — return current session user
export async function GET() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.mobile) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({
    mobile: session.mobile,
    isLoggedIn: true,
  });
}
