import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import React from 'react';

// GET /api/orders/[id]/invoice — returns GST invoice PDF
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch order
    const { data: order, error } = await supabaseAdmin
      .from('spf_payment_orders')
      .select('id, order_number, status, items, total_amount, delivery_address, payment_method, created_at, seller_id')
      .eq('id', id)
      .single();

    if (error || !order) {
      const { data: orderByNum } = await supabaseAdmin
        .from('spf_payment_orders')
        .select('id, order_number, status, items, total_amount, delivery_address, payment_method, created_at, seller_id')
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

    // Fetch seller info if available
    let sellerName = '';
    let sellerAddress = '';
    let sellerGstin = '';
    if (order.seller_id) {
      const { data: seller } = await supabaseAdmin
        .from('spf_sellers')
        .select('business_name, gstin, address')
        .eq('id', order.seller_id)
        .single();
      if (seller) {
        sellerName = (seller.business_name as string) || '';
        sellerGstin = (seller.gstin as string) || '';
        sellerAddress = (seller.address as string) || '';
      }
    }

    const addr = (order.delivery_address as Record<string, unknown>) || {};
    const items = (order.items as Array<Record<string, unknown>>) || [];

    const invoiceOrder = {
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
      seller_name: sellerName,
      seller_address: sellerAddress,
      seller_gstin: sellerGstin,
    };

    const { pdf } = await import('@react-pdf/renderer');
    const { default: GSTInvoiceDocument } = await import('@/components/pdf/GSTInvoice');

    const pdfDoc = pdf(
      React.createElement(GSTInvoiceDocument, { order: invoiceOrder })
    );
    const buffer = await pdfDoc.toBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoiceOrder.order_id}.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Invoice] PDF generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
