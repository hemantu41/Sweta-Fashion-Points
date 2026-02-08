import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/list-users - List all users (for debugging)
export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('spf_users')
      .select('id, name, email, mobile, is_admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users?.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        isAdmin: u.is_admin || false
      })) || []
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
