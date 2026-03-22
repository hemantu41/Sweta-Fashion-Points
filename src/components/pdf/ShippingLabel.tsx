import React from 'react';
import {
  Document, Page, View, Text, Image, StyleSheet,
} from '@react-pdf/renderer';
import type { LabelOrderData } from './pdf-utils';
import { SELLER_INFO } from './pdf-utils';

const s = StyleSheet.create({
  page: {
    width: '4in',
    height: '6in',
    padding: 12,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1.5pt solid #111',
    paddingBottom: 6,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  orderDate: {
    fontSize: 7,
    color: '#666',
  },
  barcodeSection: {
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 6,
    borderBottom: '0.5pt dashed #ccc',
  },
  barcodeImage: {
    width: 200,
    height: 50,
  },
  awbText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginTop: 3,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 8,
    padding: 6,
    border: '0.5pt solid #ddd',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#666',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 8,
    color: '#333',
    marginBottom: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    fontSize: 7,
    color: '#888',
  },
  value: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  pincodeBox: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 6,
    border: '2pt solid #111',
    borderRadius: 3,
  },
  pincodeLabel: {
    fontSize: 7,
    color: '#666',
    marginBottom: 2,
  },
  pincode: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 3,
  },
  codBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 6,
    border: '1pt solid #f59e0b',
  },
  codText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
  },
  footer: {
    marginTop: 'auto',
    borderTop: '0.5pt solid #ddd',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 6,
    color: '#aaa',
  },
});

interface ShippingLabelProps {
  order: LabelOrderData;
  barcodeDataURL?: string;
}

export default function ShippingLabelDocument({ order, barcodeDataURL }: ShippingLabelProps) {
  const awb = `AWB${order.order_id.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`;
  const isCOD = order.payment_mode === 'cod';
  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <Document>
      <Page size={[288, 432]} style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.brandName}>{SELLER_INFO.name}</Text>
          <Text style={s.orderDate}>{date}</Text>
        </View>

        {/* Barcode */}
        <View style={s.barcodeSection}>
          {barcodeDataURL ? (
            <Image src={barcodeDataURL} style={s.barcodeImage} />
          ) : (
            <Text style={{ fontSize: 8, color: '#999' }}>[Barcode: {awb}]</Text>
          )}
          <Text style={s.awbText}>{awb}</Text>
        </View>

        {/* Ship To */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Ship To</Text>
          <Text style={s.name}>{order.customer_name}</Text>
          <Text style={s.addressLine}>{order.district}, {order.pincode}</Text>
          <Text style={s.addressLine}>Ph: {order.customer_mobile}</Text>
        </View>

        {/* Ship From */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Ship From</Text>
          <Text style={s.addressLine}>{SELLER_INFO.name}</Text>
          <Text style={s.addressLine}>{SELLER_INFO.address}</Text>
          <Text style={s.addressLine}>Ph: {SELLER_INFO.phone}</Text>
        </View>

        {/* Order Details */}
        <View style={s.section}>
          <View style={s.row}>
            <View>
              <Text style={s.label}>Order ID</Text>
              <Text style={s.value}>{order.order_id}</Text>
            </View>
            <View>
              <Text style={s.label}>Weight</Text>
              <Text style={s.value}>{order.weight_kg || 0.5} kg</Text>
            </View>
            <View>
              <Text style={s.label}>Items</Text>
              <Text style={s.value}>{totalItems}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7, color: '#555', marginTop: 3 }}>
            {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
          </Text>
        </View>

        {/* Destination Pincode (large for sorting) */}
        <View style={s.pincodeBox}>
          <Text style={s.pincodeLabel}>DESTINATION PINCODE</Text>
          <Text style={s.pincode}>{order.pincode}</Text>
        </View>

        {/* COD Badge */}
        {isCOD && (
          <View style={s.codBadge}>
            <Text style={s.codText}>COD: ₹{order.total.toLocaleString('en-IN')}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Insta Fashion Points — Gaya, Bihar</Text>
          <Text style={s.footerText}>{isCOD ? 'CASH ON DELIVERY' : 'PREPAID'}</Text>
        </View>
      </Page>
    </Document>
  );
}
