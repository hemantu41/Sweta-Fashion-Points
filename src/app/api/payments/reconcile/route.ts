import { NextResponse } from 'next/server';

// GET /api/payments/reconcile
// Returns mock settlement reconciliation data.
// One record has an intentional ₹150 discrepancy to demo the dispute flow.

export async function GET() {
  const settlements = [
    {
      id: 'stl-001',
      order_id: 'IFP-1042',
      seller_name: 'Silk House Gaya',
      settlement_date: '2026-03-20',
      expected_amount: 2450,
      actual_credited: 2450,
      difference: 0,
      payment_mode: 'cod',
      utr: 'UTR2026032001',
      status: 'matched',
    },
    {
      id: 'stl-002',
      order_id: 'IFP-1041',
      seller_name: 'Kumar Textiles',
      settlement_date: '2026-03-19',
      expected_amount: 1890,
      actual_credited: 1740,
      difference: 150,
      payment_mode: 'upi',
      utr: 'UTR2026031902',
      status: 'mismatch',
    },
    {
      id: 'stl-003',
      order_id: 'IFP-1040',
      seller_name: 'Fashion Hub',
      settlement_date: '2026-03-18',
      expected_amount: 3200,
      actual_credited: 3200,
      difference: 0,
      payment_mode: 'cod',
      utr: 'UTR2026031803',
      status: 'matched',
    },
    {
      id: 'stl-004',
      order_id: 'IFP-1039',
      seller_name: 'Little Stars',
      settlement_date: '2026-03-17',
      expected_amount: 1250,
      actual_credited: 1250,
      difference: 0,
      payment_mode: 'online',
      utr: 'UTR2026031704',
      status: 'matched',
    },
    {
      id: 'stl-005',
      order_id: 'IFP-1038',
      seller_name: 'Ethnic Corner',
      settlement_date: '2026-03-16',
      expected_amount: 4100,
      actual_credited: 4100,
      difference: 0,
      payment_mode: 'upi',
      utr: 'UTR2026031605',
      status: 'matched',
    },
    {
      id: 'stl-006',
      order_id: 'IFP-1037',
      seller_name: 'Silk House Gaya',
      settlement_date: '2026-03-15',
      expected_amount: 1197,
      actual_credited: 0,
      difference: 1197,
      payment_mode: 'cod',
      utr: '',
      status: 'pending',
    },
  ];

  return NextResponse.json(settlements);
}
