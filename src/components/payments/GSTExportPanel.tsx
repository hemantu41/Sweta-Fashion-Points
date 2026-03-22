'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminLang } from '@/components/dashboard/LanguageContext';
import { formatINR } from '@/lib/admin/constants';
import { getHSNCode } from '@/components/pdf/pdf-utils';
import {
  MOCK_ORDERS,
} from '@/lib/admin/mockData';

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

export default function GSTExportPanel() {
  const { t, lang } = useAdminLang();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [generated, setGenerated] = useState(false);
  const [gstRows, setGstRows] = useState<GSTRow[]>([]);
  const [hsnSummary, setHsnSummary] = useState<HSNSummary[]>([]);

  const GST_RATE = 0.05;
  const CGST_RATE = 0.025;
  const SGST_RATE = 0.025;

  const handleGenerate = () => {
    // Filter orders for selected month (using mock data)
    const filteredOrders = MOCK_ORDERS.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    if (filteredOrders.length === 0) {
      toast.error(t('gst.noOrders'));
      return;
    }

    // B2C invoice summary
    const rows: GSTRow[] = filteredOrders.map(order => {
      const taxable = order.total / (1 + GST_RATE);
      const cgst = taxable * CGST_RATE;
      const sgst = taxable * SGST_RATE;
      // All orders within Bihar = CGST+SGST, interstate would be IGST
      return {
        invoiceNo: `INV-${order.order_id.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
        invoiceDate: new Date(order.created_at).toLocaleDateString('en-IN', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        }),
        placeOfSupply: 'Bihar (10)',
        taxableValue: Math.round(taxable * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst: 0,
        totalTax: Math.round((cgst + sgst) * 100) / 100,
      };
    });

    // HSN-wise summary
    const hsnMap = new Map<string, HSNSummary>();
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const hsn = getHSNCode(item.name);
        const existing = hsnMap.get(hsn) || {
          hsn,
          description: item.name.split(' ').slice(0, 2).join(' '),
          qty: 0,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
        };
        const itemTotal = item.price * item.quantity;
        const taxable = itemTotal / (1 + GST_RATE);
        existing.qty += item.quantity;
        existing.taxableValue += taxable;
        existing.cgst += taxable * CGST_RATE;
        existing.sgst += taxable * SGST_RATE;
        hsnMap.set(hsn, existing);
      });
    });

    setGstRows(rows);
    setHsnSummary(Array.from(hsnMap.values()));
    setGenerated(true);
    toast.success(t('gst.generated'));
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = (await import('xlsx')).default;

      // Sheet 1: B2C Invoice Summary
      const b2cData = gstRows.map(r => ({
        'Invoice No': r.invoiceNo,
        'Invoice Date': r.invoiceDate,
        'Place of Supply': r.placeOfSupply,
        'Taxable Value (₹)': r.taxableValue,
        'CGST (₹)': r.cgst,
        'SGST (₹)': r.sgst,
        'IGST (₹)': r.igst,
        'Total Tax (₹)': r.totalTax,
      }));

      // Sheet 2: HSN Summary
      const hsnData = hsnSummary.map(h => ({
        'HSN Code': h.hsn,
        'Description': h.description,
        'Quantity': h.qty,
        'Taxable Value (₹)': Math.round(h.taxableValue * 100) / 100,
        'CGST (₹)': Math.round(h.cgst * 100) / 100,
        'SGST (₹)': Math.round(h.sgst * 100) / 100,
        'IGST (₹)': Math.round(h.igst * 100) / 100,
      }));

      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(b2cData);
      const ws2 = XLSX.utils.json_to_sheet(hsnData);

      // Set column widths
      ws1['!cols'] = [
        { wch: 18 }, { wch: 14 }, { wch: 16 },
        { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
      ];
      ws2['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 10 },
        { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      ];

      XLSX.utils.book_append_sheet(wb, ws1, 'B2C Invoices');
      XLSX.utils.book_append_sheet(wb, ws2, 'HSN Summary');

      const monthName = MONTHS[month];
      XLSX.writeFile(wb, `GSTR1-${monthName}-${year}-InstaFashionPoints.xlsx`);
      toast.success(t('gst.downloaded'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const totalCGST = gstRows.reduce((s, r) => s + r.cgst, 0);
  const totalSGST = gstRows.reduce((s, r) => s + r.sgst, 0);
  const totalIGST = gstRows.reduce((s, r) => s + r.igst, 0);
  const totalTaxable = gstRows.reduce((s, r) => s + r.taxableValue, 0);

  return (
    <div className="space-y-5">
      {/* Month/Year picker + Generate */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('gst.title')}</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('gst.month')}</label>
            <select
              value={month}
              onChange={e => { setMonth(Number(e.target.value)); setGenerated(false); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{lang === 'hi' ? MONTHS_HI[i] : m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('gst.year')}</label>
            <select
              value={year}
              onChange={e => { setYear(Number(e.target.value)); setGenerated(false); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
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
      </div>

      {/* Results */}
      {generated && (
        <>
          {/* Tax summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('gst.taxableValue')}</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{formatINR(Math.round(totalTaxable))}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">CGST (2.5%)</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">{formatINR(Math.round(totalCGST))}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">SGST (2.5%)</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">{formatINR(Math.round(totalSGST))}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">IGST</p>
              <p className="text-lg font-bold text-gray-400 mt-1">{formatINR(Math.round(totalIGST))}</p>
            </div>
          </div>

          {/* B2C Invoice table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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
                      <td className="px-4 py-3 text-gray-600 text-xs">{r.placeOfSupply}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatINR(r.taxableValue)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{formatINR(r.cgst)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{formatINR(r.sgst)}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{formatINR(r.igst)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatINR(r.totalTax)}</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={3} className="px-4 py-3 text-gray-700">{t('gst.total')}</td>
                    <td className="px-4 py-3 text-right">{formatINR(Math.round(totalTaxable))}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{formatINR(Math.round(totalCGST))}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{formatINR(Math.round(totalSGST))}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{formatINR(Math.round(totalIGST))}</td>
                    <td className="px-4 py-3 text-right">{formatINR(Math.round(totalCGST + totalSGST + totalIGST))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* HSN Summary table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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
                      <td className="px-4 py-3 text-right text-emerald-600">{formatINR(Math.round(h.cgst))}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{formatINR(Math.round(h.sgst))}</td>
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
