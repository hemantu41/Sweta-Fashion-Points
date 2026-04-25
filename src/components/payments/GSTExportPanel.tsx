'use client';

import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminLang } from '@/components/dashboard/LanguageContext';
import { formatINR } from '@/lib/admin/constants';
import { getHSNCode } from '@/components/pdf/pdf-utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_HI = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
];

interface GSTRow {
  invoiceNo: string;
  invoiceDate: string;
  sellerName: string;
  placeOfSupply: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

interface HSNSummary {
  hsn: string;
  description: string;
  qty: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

interface GSTExportPanelProps {
  earnings: any[];
}

const GST_RATE   = 0.05;
const CGST_RATE  = 0.025;
const SGST_RATE  = 0.025;

export default function GSTExportPanel({ earnings }: GSTExportPanelProps) {
  const { t, lang } = useAdminLang();
  const now = new Date();
  const [month, setMonth]             = useState(now.getMonth());
  const [year, setYear]               = useState(now.getFullYear());
  const [sellerFilter, setSellerFilter] = useState('all');
  const [generated, setGenerated]     = useState(false);
  const [gstRows, setGstRows]         = useState<GSTRow[]>([]);
  const [hsnSummary, setHsnSummary]   = useState<HSNSummary[]>([]);

  // Unique sellers from real earnings data
  const sellerOptions = useMemo(() => {
    const map = new Map<string, string>();
    earnings.forEach(e => {
      if (e.seller_id) map.set(e.seller_id, e.seller_name || e.seller_id);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [earnings]);

  const handleGenerate = () => {
    // Filter earnings by month + year + seller
    const filtered = earnings.filter(e => {
      const d = new Date(e.order_date || e.created_at);
      const monthMatch = d.getMonth() === month && d.getFullYear() === year;
      const sellerMatch = sellerFilter === 'all' || e.seller_id === sellerFilter;
      return monthMatch && sellerMatch;
    });

    if (filtered.length === 0) {
      toast.error(t('gst.noOrders'));
      return;
    }

    // Group by order_number → one GST row per order
    const orderMap = new Map<string, { orderDate: string; items: any[]; sellerName: string }>();
    filtered.forEach(e => {
      const key = e.order_number || e.order_id || e.id;
      const existing = orderMap.get(key) ?? {
        orderDate: e.order_date || e.created_at,
        items: [],
        sellerName: e.seller_name || '—',
      };
      existing.items.push(e);
      orderMap.set(key, existing);
    });

    const rows: GSTRow[] = Array.from(orderMap.entries()).map(([orderNo, order]) => {
      const gross    = order.items.reduce((s: number, e: any) => s + Number(e.total_item_price || 0), 0);
      const taxable  = gross / (1 + GST_RATE);
      const cgst     = taxable * CGST_RATE;
      const sgst     = taxable * SGST_RATE;
      return {
        invoiceNo:    `INV-${orderNo}`,
        invoiceDate:  new Date(order.orderDate).toLocaleDateString('en-IN', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        }),
        sellerName:   order.sellerName,
        placeOfSupply: 'Bihar (10)',
        taxableValue: Math.round(taxable * 100) / 100,
        cgst:         Math.round(cgst * 100) / 100,
        sgst:         Math.round(sgst * 100) / 100,
        igst:         0,
        totalTax:     Math.round((cgst + sgst) * 100) / 100,
      };
    });

    // HSN-wise summary from individual items
    const hsnMap = new Map<string, HSNSummary>();
    filtered.forEach(e => {
      const hsn = getHSNCode(e.item_name || '');
      const existing = hsnMap.get(hsn) ?? {
        hsn,
        description: (e.item_name || '').split(' ').slice(0, 3).join(' '),
        qty: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0,
      };
      const gross   = Number(e.total_item_price || 0);
      const taxable = gross / (1 + GST_RATE);
      existing.qty          += Number(e.quantity || 1);
      existing.taxableValue += taxable;
      existing.cgst         += taxable * CGST_RATE;
      existing.sgst         += taxable * SGST_RATE;
      hsnMap.set(hsn, existing);
    });

    setGstRows(rows);
    setHsnSummary(Array.from(hsnMap.values()));
    setGenerated(true);
    toast.success(`Report generated — ${rows.length} invoice(s)`);
  };

  const handleExportExcel = async () => {
    try {
      // xlsx has no default export — import the module object directly
      const XLSX = await import('xlsx');

      // Sheet 1: B2C Invoice Summary
      const b2cData = gstRows.map(r => ({
        'Invoice No':        r.invoiceNo,
        'Invoice Date':      r.invoiceDate,
        'Seller':            r.sellerName,
        'Place of Supply':   r.placeOfSupply,
        'Taxable Value (₹)': r.taxableValue,
        'CGST (₹)':          r.cgst,
        'SGST (₹)':          r.sgst,
        'IGST (₹)':          r.igst,
        'Total Tax (₹)':     r.totalTax,
      }));

      // Sheet 2: HSN Summary
      const hsnData = hsnSummary.map(h => ({
        'HSN Code':          h.hsn,
        'Description':       h.description,
        'Quantity':          h.qty,
        'Taxable Value (₹)': Math.round(h.taxableValue * 100) / 100,
        'CGST (₹)':          Math.round(h.cgst * 100) / 100,
        'SGST (₹)':          Math.round(h.sgst * 100) / 100,
        'IGST (₹)':          Math.round(h.igst * 100) / 100,
      }));

      const wb  = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(b2cData);
      const ws2 = XLSX.utils.json_to_sheet(hsnData);

      ws1['!cols'] = [
        { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 16 },
        { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
      ];
      ws2['!cols'] = [
        { wch: 12 }, { wch: 24 }, { wch: 10 },
        { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      ];

      XLSX.utils.book_append_sheet(wb, ws1, 'B2C Invoices');
      XLSX.utils.book_append_sheet(wb, ws2, 'HSN Summary');

      // Write to array buffer and download via Blob (works reliably in Next.js browser env)
      const buf  = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buf], { type: 'application/octet-stream' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `GSTR1-${MONTHS[month]}-${year}-InstaFashionPoints.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('gst.downloaded'));
    } catch (err) {
      console.error('[GST Export]', err);
      toast.error('Download failed — please try again');
    }
  };

  const totalCGST    = gstRows.reduce((s, r) => s + r.cgst, 0);
  const totalSGST    = gstRows.reduce((s, r) => s + r.sgst, 0);
  const totalIGST    = gstRows.reduce((s, r) => s + r.igst, 0);
  const totalTaxable = gstRows.reduce((s, r) => s + r.taxableValue, 0);

  const INPUT_CLS = 'px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20';

  return (
    <div className="space-y-5">
      {/* Filters + Generate */}
      <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('gst.title')}</h3>
        <div className="flex flex-wrap items-end gap-3">
          {/* Month */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('gst.month')}</label>
            <select
              value={month}
              onChange={e => { setMonth(Number(e.target.value)); setGenerated(false); }}
              className={INPUT_CLS}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{lang === 'hi' ? MONTHS_HI[i] : m}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('gst.year')}</label>
            <select
              value={year}
              onChange={e => { setYear(Number(e.target.value)); setGenerated(false); }}
              className={INPUT_CLS}
            >
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Seller filter */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Seller</label>
            <select
              value={sellerFilter}
              onChange={e => { setSellerFilter(e.target.value); setGenerated(false); }}
              className={INPUT_CLS}
            >
              <option value="all">All Sellers</option>
              {sellerOptions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
          >
            <FileSpreadsheet size={14} className="inline mr-1.5" />{t('gst.generate')}
          </button>
          {generated && (
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Download size={14} className="inline mr-1.5" />{t('gst.downloadExcel')}
            </button>
          )}
        </div>

        {earnings.length === 0 && (
          <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            No settlement data found. Orders must be captured in Razorpay before GST data appears here.
          </p>
        )}
      </div>

      {/* Results */}
      {generated && (
        <>
          {/* Tax summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('gst.taxableValue')}</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{formatINR(Math.round(totalTaxable))}</p>
            </div>
            <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">CGST (2.5%)</p>
              <p className="text-lg font-bold text-[#5B1A3A] mt-1">{formatINR(Math.round(totalCGST))}</p>
            </div>
            <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">SGST (2.5%)</p>
              <p className="text-lg font-bold text-[#5B1A3A] mt-1">{formatINR(Math.round(totalSGST))}</p>
            </div>
            <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">IGST</p>
              <p className="text-lg font-bold text-gray-400 mt-1">{formatINR(Math.round(totalIGST))}</p>
            </div>
          </div>

          {/* B2C Invoice table */}
          <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-800">{t('gst.b2cSummary')}</h4>
              <p className="text-xs text-gray-400">{gstRows.length} {t('gst.invoices')}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('gst.invoiceNo')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('gst.invoiceDate')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Seller</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('gst.placeOfSupply')}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('gst.taxableValue')}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">CGST</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SGST</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">IGST</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('gst.totalTax')}</th>
                  </tr>
                </thead>
                <tbody>
                  {gstRows.map(r => (
                    <tr key={r.invoiceNo} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.invoiceNo}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{r.invoiceDate}</td>
                      <td className="px-4 py-3 text-gray-700 text-xs">{r.sellerName}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{r.placeOfSupply}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatINR(r.taxableValue)}</td>
                      <td className="px-4 py-3 text-right text-[#5B1A3A]">{formatINR(r.cgst)}</td>
                      <td className="px-4 py-3 text-right text-[#5B1A3A]">{formatINR(r.sgst)}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{formatINR(r.igst)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatINR(r.totalTax)}</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={4} className="px-4 py-3 text-gray-700">{t('gst.total')}</td>
                    <td className="px-4 py-3 text-right">{formatINR(Math.round(totalTaxable))}</td>
                    <td className="px-4 py-3 text-right text-[#5B1A3A]">{formatINR(Math.round(totalCGST))}</td>
                    <td className="px-4 py-3 text-right text-[#5B1A3A]">{formatINR(Math.round(totalSGST))}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{formatINR(Math.round(totalIGST))}</td>
                    <td className="px-4 py-3 text-right">{formatINR(Math.round(totalCGST + totalSGST + totalIGST))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* HSN Summary table */}
          <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-800">{t('gst.hsnSummary')}</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">HSN</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('gst.description')}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('gst.qty')}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('gst.taxableValue')}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">CGST</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SGST</th>
                  </tr>
                </thead>
                <tbody>
                  {hsnSummary.map(h => (
                    <tr key={h.hsn} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono font-medium text-gray-800">{h.hsn}</td>
                      <td className="px-4 py-3 text-gray-600">{h.description}</td>
                      <td className="px-4 py-3 text-right">{h.qty}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatINR(Math.round(h.taxableValue))}</td>
                      <td className="px-4 py-3 text-right text-[#5B1A3A]">{formatINR(Math.round(h.cgst))}</td>
                      <td className="px-4 py-3 text-right text-[#5B1A3A]">{formatINR(Math.round(h.sgst))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
