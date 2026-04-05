import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/tracking/[awb]
// Public endpoint — no auth required (anyone with AWB can track)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ awb: string }> }
) {
  const { awb } = await params;

  if (!awb) {
    return NextResponse.json({ success: false, error: 'AWB is required' }, { status: 400 });
  }

  const { data: shipment } = await supabaseAdmin
    .from('spf_shipments')
    .select(`
      awb_number,
      courier_name,
      status,
      estimated_delivery,
      picked_up_at,
      shipped_at,
      delivered_at,
      is_rto,
      label_url,
      tracking:spf_shipment_tracking(id, status, location, description, created_at),
      order:spf_payment_orders(id, status)
    `)
    .eq('awb_number', awb)
    .single();

  if (!shipment) {
    return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, shipment });
}
