import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import React from 'react';

// GET /api/orders/[id]/invoice — returns GST invoice PDF for an spf_orders record
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch from spf_orders (the live order table)
    const { data: order, error } = await supabaseAdmin
      .from('spf_orders')
      .select(`
        id, order_number, status, payment_method, subtotal, shipping_charge,
        shipping_address, created_at, seller_id,
        spf_order_items(product_name, quantity, unit_price, total_price, sku)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch seller info
    let sellerName    = 'Insta Fashion Points';
    let sellerAddress = '';
    let sellerGstin   = '';

    if ((order as any).seller_id) {
      const { data: seller } = await supabaseAdmin
        .from('spf_sellers')
        .select('business_name, gstin, address_line1, address_line2, city, state, pincode')
        .eq('id', (order as any).seller_id)
        .maybeSingle();

      if (seller) {
        sellerName    = (seller as any).business_name || sellerName;
        sellerGstin   = (seller as any).gstin        || '';
        sellerAddress = [
          (seller as any).address_line1,
          (seller as any).address_line2,
          (seller as any).city,
          (seller as any).state,
          (seller as any).pincode,
        ].filter(Boolean).join(', ');
      }
    }

    const o     = order as any;
    const addr  = o.shipping_address || {};
    const items = (o.spf_order_items as any[]) || [];

    const invoiceOrder = {
      order_id:        o.order_number || o.id,
      order_number:    o.order_number || o.id,
      customer_name:   addr.name     || 'Customer',
      customer_mobile: addr.phone    || addr.mobile || '',
      pincode:         addr.pincode  || '',
      district:        addr.city     || addr.district || '',
      items: items.map((i: any) => ({
        name:     i.product_name || '',
        quantity: Number(i.quantity)   || 1,
        price:    Number(i.unit_price) || 0,
        size:     i.variant_details?.size || '',
      })),
      total:          Number(o.subtotal) + Number(o.shipping_charge),
      payment_mode:   o.payment_method || 'Prepaid',
      created_at:     o.created_at,
      seller_name:    sellerName,
      seller_address: sellerAddress,
      seller_gstin:   sellerGstin,
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
