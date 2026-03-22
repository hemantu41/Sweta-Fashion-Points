import React from 'react';
import {
  Document, Page, View, Text, StyleSheet,
} from '@react-pdf/renderer';
import type { InvoiceOrderData } from './pdf-utils';
import { SELLER_INFO, getHSNCode, numberToWords } from './pdf-utils';

const s = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a1a',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottom: '2pt solid #059669',
    paddingBottom: 10,
  },
  brandName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  brandAddress: {
    fontSize: 8,
    color: '#555',
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    textAlign: 'right' as const,
  },
  invoiceDetail: {
    fontSize: 8,
    color: '#666',
    textAlign: 'right' as const,
    marginTop: 2,
  },
  // Parties
  partiesRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  partyBox: {
    flex: 1,
    padding: 8,
    border: '0.5pt solid #ddd',
    borderRadius: 3,
  },
  partyTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#888',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 8,
    color: '#444',
    marginBottom: 1,
  },
  // Table
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderTop: '1pt solid #d1d5db',
    borderBottom: '1pt solid #d1d5db',
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e5e7eb',
    paddingVertical: 5,
  },
  col_sno: { width: '5%', paddingHorizontal: 3 },
  col_name: { width: '22%', paddingHorizontal: 3 },
  col_hsn: { width: '8%', paddingHorizontal: 3 },
  col_qty: { width: '6%', paddingHorizontal: 3, textAlign: 'center' as const },
  col_mrp: { width: '10%', paddingHorizontal: 3, textAlign: 'right' as const },
  col_sell: { width: '10%', paddingHorizontal: 3, textAlign: 'right' as const },
  col_disc: { width: '9%', paddingHorizontal: 3, textAlign: 'right' as const },
  col_taxable: { width: '10%', paddingHorizontal: 3, textAlign: 'right' as const },
  col_cgst: { width: '10%', paddingHorizontal: 3, textAlign: 'right' as const },
  col_sgst: { width: '10%', paddingHorizontal: 3, textAlign: 'right' as const },
  thText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#555',
    textTransform: 'uppercase' as const,
  },
  tdText: {
    fontSize: 8,
    color: '#333',
  },
  // Summary
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  summaryTable: {
    width: 220,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#555',
  },
  summaryValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderTop: '1.5pt solid #111',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  // Amount in words
  amountWords: {
    fontSize: 8,
    color: '#444',
    fontStyle: 'italic',
    marginBottom: 15,
    padding: 6,
    backgroundColor: '#f9fafb',
    borderRadius: 3,
  },
  // Footer
  footer: {
    marginTop: 'auto',
    borderTop: '0.5pt solid #ddd',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: '#999',
    textAlign: 'center' as const,
    marginBottom: 2,
  },
  signatory: {
    fontSize: 8,
    color: '#555',
    textAlign: 'right' as const,
    marginTop: 20,
    marginBottom: 4,
  },
});

interface GSTInvoiceProps {
  order: InvoiceOrderData;
}

export default function GSTInvoiceDocument({ order }: GSTInvoiceProps) {
  const invoiceNo = order.invoice_number || `INV-${order.order_id.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`;
  const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  // Tax calculations (intra-state Bihar: CGST 2.5% + SGST 2.5% = 5% GST)
  const GST_RATE = 0.05;
  const CGST_RATE = 0.025;
  const SGST_RATE = 0.025;

  const lineItems = order.items.map((item, idx) => {
    const mrp = item.price;
    const sellingPrice = item.price; // same as MRP for now
    const discount = 0;
    const taxableValue = (sellingPrice * item.quantity) / (1 + GST_RATE);
    const cgst = taxableValue * CGST_RATE;
    const sgst = taxableValue * SGST_RATE;
    return {
      sno: idx + 1,
      name: item.name,
      hsn: getHSNCode(item.name),
      qty: item.quantity,
      mrp,
      sellingPrice,
      discount,
      taxableValue: Math.round(taxableValue * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      total: sellingPrice * item.quantity,
    };
  });

  const subtotal = lineItems.reduce((s, i) => s + i.taxableValue, 0);
  const totalCGST = lineItems.reduce((s, i) => s + i.cgst, 0);
  const totalSGST = lineItems.reduce((s, i) => s + i.sgst, 0);
  const grandTotal = order.total;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.brandName}>{order.seller_name || SELLER_INFO.name}</Text>
            <Text style={s.brandAddress}>{order.seller_address || SELLER_INFO.address}</Text>
            <Text style={s.brandAddress}>GSTIN: {order.seller_gstin || SELLER_INFO.gstin}</Text>
            <Text style={s.brandAddress}>State: {SELLER_INFO.state} ({SELLER_INFO.stateCode})</Text>
          </View>
          <View>
            <Text style={s.invoiceTitle}>TAX INVOICE</Text>
            <Text style={s.invoiceDetail}>Invoice No: {invoiceNo}</Text>
            <Text style={s.invoiceDetail}>Date: {invoiceDate}</Text>
            <Text style={s.invoiceDetail}>Order: {order.order_id}</Text>
            <Text style={s.invoiceDetail}>Place of Supply: Bihar ({SELLER_INFO.stateCode})</Text>
          </View>
        </View>

        {/* Bill To / Ship To */}
        <View style={s.partiesRow}>
          <View style={s.partyBox}>
            <Text style={s.partyTitle}>Bill To</Text>
            <Text style={s.partyName}>{order.customer_name}</Text>
            <Text style={s.partyLine}>{order.district}, {order.pincode}</Text>
            <Text style={s.partyLine}>Phone: {order.customer_mobile}</Text>
            <Text style={s.partyLine}>State: Bihar ({SELLER_INFO.stateCode})</Text>
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyTitle}>Ship To</Text>
            <Text style={s.partyName}>{order.customer_name}</Text>
            <Text style={s.partyLine}>{order.district}, {order.pincode}</Text>
            <Text style={s.partyLine}>Phone: {order.customer_mobile}</Text>
          </View>
        </View>

        {/* Product Table */}
        <View style={s.table}>
          {/* Header row */}
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.col_sno]}>#</Text>
            <Text style={[s.thText, s.col_name]}>Product</Text>
            <Text style={[s.thText, s.col_hsn]}>HSN</Text>
            <Text style={[s.thText, s.col_qty]}>Qty</Text>
            <Text style={[s.thText, s.col_mrp]}>MRP</Text>
            <Text style={[s.thText, s.col_sell]}>Price</Text>
            <Text style={[s.thText, s.col_disc]}>Disc.</Text>
            <Text style={[s.thText, s.col_taxable]}>Taxable</Text>
            <Text style={[s.thText, s.col_cgst]}>CGST 2.5%</Text>
            <Text style={[s.thText, s.col_sgst]}>SGST 2.5%</Text>
          </View>
          {/* Data rows */}
          {lineItems.map(item => (
            <View style={s.tableRow} key={item.sno}>
              <Text style={[s.tdText, s.col_sno]}>{item.sno}</Text>
              <Text style={[s.tdText, s.col_name]}>{item.name}</Text>
              <Text style={[s.tdText, s.col_hsn]}>{item.hsn}</Text>
              <Text style={[s.tdText, s.col_qty]}>{item.qty}</Text>
              <Text style={[s.tdText, s.col_mrp]}>₹{item.mrp}</Text>
              <Text style={[s.tdText, s.col_sell]}>₹{item.sellingPrice}</Text>
              <Text style={[s.tdText, s.col_disc]}>₹{item.discount}</Text>
              <Text style={[s.tdText, s.col_taxable]}>₹{item.taxableValue.toFixed(2)}</Text>
              <Text style={[s.tdText, s.col_cgst]}>₹{item.cgst.toFixed(2)}</Text>
              <Text style={[s.tdText, s.col_sgst]}>₹{item.sgst.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={s.summaryBox}>
          <View style={s.summaryTable}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Taxable Amount</Text>
              <Text style={s.summaryValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>CGST @ 2.5%</Text>
              <Text style={s.summaryValue}>₹{totalCGST.toFixed(2)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>SGST @ 2.5%</Text>
              <Text style={s.summaryValue}>₹{totalSGST.toFixed(2)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Grand Total</Text>
              <Text style={s.totalValue}>₹{grandTotal.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Amount in words */}
        <Text style={s.amountWords}>
          Amount in words: {numberToWords(grandTotal)}
        </Text>

        {/* Signatory */}
        <Text style={s.signatory}>For {order.seller_name || SELLER_INFO.name}</Text>
        <Text style={[s.signatory, { marginTop: 25 }]}>Authorized Signatory</Text>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>This is a computer-generated invoice and does not require a physical signature.</Text>
          <Text style={s.footerText}>Subject to {SELLER_INFO.state} jurisdiction. E&OE.</Text>
        </View>
      </Page>
    </Document>
  );
}
