'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X, FileText, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAdminLang } from '@/components/dashboard/LanguageContext';

// ─── CSV row schema ───────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['Sarees', "Men's Wear", "Women's Wear", "Kids' Wear", 'Accessories', 'Footwear'];
const VALID_GST = [5, 12, 18];

const ProductRowSchema = z.object({
  Name: z.string().min(3, 'Name must be at least 3 characters'),
  Category: z.enum(VALID_CATEGORIES as [string, ...string[]], {
    errorMap: () => ({ message: `Must be one of: ${VALID_CATEGORIES.join(', ')}` }),
  }),
  SubCategory: z.string().optional().default(''),
  MRP: z.coerce.number().positive('MRP must be > 0'),
  SellingPrice: z.coerce.number().positive('Selling price must be > 0'),
  GSTPercent: z.coerce.number().refine(v => VALID_GST.includes(v), {
    message: 'GST must be 5, 12, or 18',
  }),
  Sizes: z.string().optional().default(''),
  Colors: z.string().optional().default(''),
  Description: z.string().optional().default(''),
  ImageURL1: z.string().url('Invalid URL').or(z.literal('')).optional().default(''),
  ImageURL2: z.string().url('Invalid URL').or(z.literal('')).optional().default(''),
  ImageURL3: z.string().url('Invalid URL').or(z.literal('')).optional().default(''),
  ImageURL4: z.string().url('Invalid URL').or(z.literal('')).optional().default(''),
  ImageURL5: z.string().url('Invalid URL').or(z.literal('')).optional().default(''),
});

type ProductRow = z.infer<typeof ProductRowSchema>;

interface ParsedRow {
  index: number;
  data: Record<string, string>;
  parsed?: ProductRow;
  errors: string[];
  valid: boolean;
}

// ─── CSV template ──────────────────────────────────────────────────────────────

const CSV_TEMPLATE = `Name,Category,SubCategory,MRP,SellingPrice,GSTPercent,Sizes,Colors,Description,ImageURL1,ImageURL2,ImageURL3,ImageURL4,ImageURL5
Banarasi Silk Saree,Sarees,Silk,2499,2499,5,"Free","Red,Gold",Premium handwoven saree from Varanasi,https://example.com/img1.jpg,,,,
Cotton Kurta Set,Men's Wear,Kurta,1299,999,5,"S,M,L,XL","White,Blue",Comfortable cotton kurta with pajama,https://example.com/img2.jpg,https://example.com/img3.jpg,,,
Kids Party Frock,Kids' Wear,Dress,899,749,5,"2Y,4Y,6Y,8Y","Pink,Yellow",Sparkle party dress for girls,https://example.com/img4.jpg,,,,`;

export default function BulkUploadPanel() {
  const { t } = useAdminLang();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-upload-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('bulk.templateDownloaded'));
  };

  const parseCSV = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: ParsedRow[] = results.data.map((rawRow, index) => {
          const data = rawRow as Record<string, string>;
          const result = ProductRowSchema.safeParse(data);
          if (result.success) {
            return { index, data, parsed: result.data, errors: [], valid: true };
          }
          const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
          return { index, data, errors, valid: false };
        });
        setRows(parsed);
        const validCount = parsed.filter(r => r.valid).length;
        const errorCount = parsed.length - validCount;
        if (errorCount > 0) {
          toast.error(`${errorCount} ${t('bulk.rowsWithErrors')}`);
        } else {
          toast.success(`${validCount} ${t('bulk.rowsValid')}`);
        }
      },
      error: () => {
        toast.error(t('bulk.parseFailed'));
      },
    });
  }, [t]);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error(t('bulk.csvOnly'));
      return;
    }
    parseCSV(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [parseCSV]);

  const handleUpload = async () => {
    const validRows = rows.filter(r => r.valid && r.parsed);
    if (validRows.length === 0) return;

    setUploading(true);
    // In production, POST to /api/admin/products/bulk
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`${validRows.length} ${t('bulk.productsUploaded')}`);
    setRows([]);
    setUploading(false);
  };

  const validCount = rows.filter(r => r.valid).length;
  const errorCount = rows.length - validCount;

  return (
    <div className="space-y-5">
      {/* Header with template download */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{t('bulk.title')}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{t('bulk.subtitle')}</p>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
          <Download size={14} />{t('bulk.downloadTemplate')}
        </button>
      </div>

      {/* Drop zone */}
      {rows.length === 0 && (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
            ${dragging ? 'border-[#C49A3C] bg-[#F5EDF2]' : 'border-gray-200 hover:border-gray-300'}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={36} className={`mx-auto mb-3 ${dragging ? 'text-[#C49A3C]' : 'text-gray-300'}`} />
          <p className="text-sm text-gray-600 font-medium">{t('bulk.dropCSV')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('bulk.orClick')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {/* Results */}
      {rows.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-1.5">
              <FileText size={14} className="text-gray-500" />
              <span className="text-sm text-gray-700">{rows.length} {t('bulk.totalRows')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-green-500" />
              <span className="text-sm text-green-700">{validCount} {t('bulk.valid')}</span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-sm text-red-600">{errorCount} {t('bulk.errors')}</span>
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <button onClick={() => setRows([])}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium">
                <X size={12} className="inline mr-1" />{t('common.cancel')}
              </button>
              {validCount > 0 && (
                <button onClick={handleUpload} disabled={uploading}
                  className="px-4 py-1.5 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-lg text-xs font-medium hover:from-[#4A1530] hover:to-[#691E45] disabled:opacity-50 transition-colors">
                  {uploading ? <Loader2 size={12} className="inline mr-1 animate-spin" /> : <Upload size={12} className="inline mr-1" />}
                  {t('bulk.uploadValid').replace('{count}', String(validCount))}
                </button>
              )}
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-8">#</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Category</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase">MRP</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase">Selling</th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">GST</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Sizes</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Colors</th>
                    <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">{t('orders.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.index}
                      className={`border-b border-gray-50 transition-colors group ${
                        row.valid ? 'hover:bg-gray-50/50' : 'bg-red-50/50 hover:bg-red-50'
                      }`}
                      title={row.valid ? '' : row.errors.join('\n')}
                    >
                      <td className="px-3 py-2 text-gray-400">{row.index + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-800 max-w-[140px] truncate">
                        {row.data.Name || '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{row.data.Category || '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-800">₹{row.data.MRP || '0'}</td>
                      <td className="px-3 py-2 text-right text-gray-800">₹{row.data.SellingPrice || '0'}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{row.data.GSTPercent || '0'}%</td>
                      <td className="px-3 py-2 text-gray-500 max-w-[100px] truncate">{row.data.Sizes || '—'}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-[80px] truncate">{row.data.Colors || '—'}</td>
                      <td className="px-3 py-2 text-center">
                        {row.valid ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                            <CheckCircle size={10} />{t('bulk.valid')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-medium cursor-help"
                            title={row.errors.join('\n')}>
                            <AlertCircle size={10} />{t('bulk.error')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error details */}
          {errorCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-red-700 mb-2">{t('bulk.errorDetails')}</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {rows.filter(r => !r.valid).map(row => (
                  <div key={row.index} className="text-xs text-red-600">
                    <span className="font-medium">{t('bulk.row')} {row.index + 1}:</span>{' '}
                    {row.errors.join(' | ')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
