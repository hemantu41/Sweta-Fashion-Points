import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// POST /api/logout — destroy session cookie
export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ message: 'Logged out successfully' });
}
