import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch status change history for a delivery partner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('spf_delivery_partner_status_history')
      .select('*')
      .eq('delivery_partner_id', id)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('[Status History API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch status history', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      history: data || [],
    });
  } catch (error: any) {
    console.error('[Status History API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status history', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
