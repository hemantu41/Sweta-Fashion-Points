import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import React from 'react';

// GET /api/orders/[id]/label — returns shipping label PDF
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch order
    const { data: order, error } = await supabaseAdmin
      .from('spf_payment_orders')
      .select('id, order_number, status, items, total_amount, delivery_address, payment_method, created_at')
      .eq('id', id)
      .single();

    if (error || !order) {
      // Fallback: try by order_number
      const { data: orderByNum } = await supabaseAdmin
        .from('spf_payment_orders')
        .select('id, order_number, status, items, total_amount, delivery_address, payment_method, created_at')
        .eq('order_number', id)
        .single();

      if (!orderByNum) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      Object.assign(order || {}, orderByNum);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    const addr = (order.delivery_address as Record<string, unknown>) || {};
    const items = (order.items as Array<Record<string, unknown>>) || [];

    const labelOrder = {
      order_id: (order.order_number as string) || order.id,
      order_number: (order.order_number as string) || order.id,
      customer_name: (addr.name as string) || 'Customer',
      customer_mobile: (addr.mobile as string) || '',
      pincode: (addr.pincode as string) || '',
      district: (addr.city as string) || (addr.district as string) || '',
      items: items.map((i: Record<string, unknown>) => ({
        name: (i.name as string) || (i.product_name as string) || '',
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) || 0,
        size: (i.size as string) || '',
      })),
      total: Number(order.total_amount) || 0,
      payment_mode: (order.payment_method as string) || 'cod',
      created_at: order.created_at as string,
    };

    // Generate barcode as PNG data URL using bwip-js
    let barcodeDataURL: string | undefined;
    try {
      const bwipjs = await import('bwip-js');
      const awb = `AWB${labelOrder.order_id.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`;
      const pngBuffer = await bwipjs.default.toBuffer({
        bcid: 'code128',
        text: awb,
        scale: 3,
        height: 12,
        includetext: false,
      });
      barcodeDataURL = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    } catch (barcodeErr) {
      console.warn('[Label] Barcode generation failed:', barcodeErr);
    }

    // Dynamic import of @react-pdf/renderer (server-side)
    const { pdf } = await import('@react-pdf/renderer');
    const { default: ShippingLabelDocument } = await import('@/components/pdf/ShippingLabel');

    const pdfDoc = pdf(
      React.createElement(ShippingLabelDocument, { order: labelOrder, barcodeDataURL })
    );
    const buffer = await pdfDoc.toBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="label-${labelOrder.order_id}.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Label] PDF generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
