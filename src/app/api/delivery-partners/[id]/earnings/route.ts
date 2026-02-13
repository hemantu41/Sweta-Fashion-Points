import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get partner earnings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const status = request.nextUrl.searchParams.get('status'); // pending, paid, all
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');

    let query = supabase
      .from('spf_delivery_earnings')
      .select(`
        *,
        order:spf_payment_orders(order_number, amount),
        delivery:spf_order_deliveries(status, delivered_at)
      `)
      .eq('delivery_partner_id', id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('payment_status', status);
    }

    if (startDate) {
      query = query.gte('delivery_date', startDate);
    }

    if (endDate) {
      query = query.lte('delivery_date', endDate);
    }

    const { data: earnings, error } = await query;

    if (error) {
      console.error('[Partner Earnings API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch earnings', details: error.message },
        { status: 500 }
      );
    }

    // Calculate summary
    const totalEarnings = earnings?.reduce((sum, e) => sum + parseFloat(e.total_earning || 0), 0) || 0;
    const totalPending = earnings
      ?.filter((e) => e.payment_status === 'pending')
      .reduce((sum, e) => sum + parseFloat(e.total_earning || 0), 0) || 0;
    const totalPaid = earnings
      ?.filter((e) => e.payment_status === 'paid')
      .reduce((sum, e) => sum + parseFloat(e.total_earning || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      earnings: earnings || [],
      summary: {
        totalEarnings: totalEarnings.toFixed(2),
        totalPending: totalPending.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        count: earnings?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('[Partner Earnings API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch earnings',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

// POST - Manually add earning (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      orderDeliveryId,
      orderId,
      deliveryCharge,
      bonusAmount,
      penaltyAmount,
      notes,
      processedBy,
    } = body;

    if (!orderDeliveryId || !orderId || !deliveryCharge) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const totalEarning = parseFloat(deliveryCharge) +
      parseFloat(bonusAmount || 0) -
      parseFloat(penaltyAmount || 0);

    const { data: earning, error } = await supabase
      .from('spf_delivery_earnings')
      .insert([
        {
          delivery_partner_id: id,
          order_delivery_id: orderDeliveryId,
          order_id: orderId,
          delivery_charge: deliveryCharge,
          bonus_amount: bonusAmount || 0,
          penalty_amount: penaltyAmount || 0,
          total_earning: totalEarning,
          delivery_date: new Date().toISOString().split('T')[0],
          delivery_status: 'delivered',
          notes,
          processed_by: processedBy,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Partner Earnings API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create earning', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      earning,
      message: 'Earning record created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Partner Earnings API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create earning',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

// PUT - Update earning payment status (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      earningId,
      paymentStatus,
      paymentDate,
      paymentReference,
      paymentMethod,
      processedBy,
    } = body;

    if (!earningId || !paymentStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updateData: any = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (paymentDate) updateData.payment_date = paymentDate;
    if (paymentReference) updateData.payment_reference = paymentReference;
    if (paymentMethod) updateData.payment_method = paymentMethod;
    if (processedBy) updateData.processed_by = processedBy;

    const { data: earning, error } = await supabase
      .from('spf_delivery_earnings')
      .update(updateData)
      .eq('id', earningId)
      .select()
      .single();

    if (error) {
      console.error('[Partner Earnings API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update earning', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      earning,
      message: 'Earning updated successfully',
    });
  } catch (error: any) {
    console.error('[Partner Earnings API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update earning',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
