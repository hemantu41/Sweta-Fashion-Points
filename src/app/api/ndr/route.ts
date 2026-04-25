import { NextRequest, NextResponse } from 'next/server';

// GET  /api/ndr         — list mock NDR records
// POST /api/ndr         — update NDR action (retry / rto / fake / address-update)
// POST /api/ndr/cod-verify — trigger COD verification OTP via Fast2SMS

export async function GET() {
  const ndrRecords = [
    {
      id: 'ndr-001',
      order_id: 'ORD-2026-1042',
      customer_name: 'Priya Kumari',
      mobile: '9876543210',
      pincode: '823001',
      district: 'Gaya',
      failure_reason: 'Customer not available',
      failure_reason_hi: 'ग्राहक उपलब्ध नहीं',
      attempt_count: 2,
      last_attempt: '2026-03-21T14:30:00Z',
      status: 'pending',
      payment_mode: 'cod',
      total: 1299,
      cod_verified: false,
    },
    {
      id: 'ndr-002',
      order_id: 'ORD-2026-1038',
      customer_name: 'Rahul Verma',
      mobile: '9123456780',
      pincode: '824231',
      district: 'Nawada',
      failure_reason: 'Incomplete address',
      failure_reason_hi: 'अधूरा पता',
      attempt_count: 1,
      last_attempt: '2026-03-20T11:00:00Z',
      status: 'pending',
      payment_mode: 'cod',
      total: 899,
      cod_verified: true,
    },
    {
      id: 'ndr-003',
      order_id: 'ORD-2026-1035',
      customer_name: 'Anjali Devi',
      mobile: '9988776655',
      pincode: '824101',
      district: 'Jehanabad',
      failure_reason: 'Customer refused delivery',
      failure_reason_hi: 'ग्राहक ने डिलीवरी से मना किया',
      attempt_count: 3,
      last_attempt: '2026-03-19T16:45:00Z',
      status: 'rto_initiated',
      payment_mode: 'online',
      total: 2499,
      cod_verified: null,
    },
    {
      id: 'ndr-004',
      order_id: 'ORD-2026-1029',
      customer_name: 'Vikash Kumar',
      mobile: '9871234560',
      pincode: '805101',
      district: 'Nalanda',
      failure_reason: 'Wrong phone number',
      failure_reason_hi: 'गलत फोन नंबर',
      attempt_count: 2,
      last_attempt: '2026-03-20T09:15:00Z',
      status: 'pending',
      payment_mode: 'cod',
      total: 649,
      cod_verified: false,
    },
    {
      id: 'ndr-005',
      order_id: 'ORD-2026-1025',
      customer_name: 'Sunita Singh',
      mobile: '9654321870',
      pincode: '824219',
      district: 'Gaya',
      failure_reason: 'Delivery area inaccessible',
      failure_reason_hi: 'डिलीवरी क्षेत्र पहुँच योग्य नहीं',
      attempt_count: 1,
      last_attempt: '2026-03-21T10:00:00Z',
      status: 'pending',
      payment_mode: 'cod',
      total: 1799,
      cod_verified: false,
    },
  ];

  return NextResponse.json(ndrRecords);
}

export async function POST(request: NextRequest) {
  try {
    const { ndrId, action, newAddress } = await request.json();

    if (!ndrId || !action) {
      return NextResponse.json({ error: 'ndrId and action required' }, { status: 400 });
    }

    const validActions = ['retry', 'update_address', 'rto', 'fake_order'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action. Use: ${validActions.join(', ')}` }, { status: 400 });
    }

    // In production this would update the DB record
    console.log(`[NDR] Action: ${action} on ${ndrId}`, newAddress ? `New address: ${newAddress}` : '');

    const messages: Record<string, string> = {
      retry: 'Retry delivery scheduled for next business day',
      update_address: 'Address updated — retry delivery scheduled',
      rto: 'RTO initiated — package returning to seller',
      fake_order: 'Order flagged as fake — COD blocked for this number',
    };

    return NextResponse.json({ success: true, message: messages[action] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
