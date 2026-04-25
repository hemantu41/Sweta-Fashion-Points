'use client';

import { useState } from 'react';
import { CheckCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES = ['Sarees', "Men's Wear", "Women's Wear", "Kids' Wear", 'Accessories', 'Footwear'];

const SIZES_LIST = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size',
  '5', '6', '7', '8', '9', '10', '11',
  '26', '28', '30', '32', '34', '36', '38', '40',
];

const GST_OPTS = [
  { label: 'Exempt (0%)', value: 0 },
  { label: '5%', value: 5 },
  { label: '12%', value: 12 },
  { label: '18%', value: 18 },
];

const INPUT_CLS =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 focus:border-[#C49A3C] bg-white text-gray-800 transition-colors';

export default function SingleUploadPanel({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();

  const [name, setName]               = useState('');
  const [category, setCategory]       = useState(CATEGORIES[0]);
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [mrp, setMrp]                 = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [gst, setGst]                 = useState(5);
  const [stock, setStock]             = useState('');
  const [sizes, setSizes]             = useState<string[]>([]);
  const [colorInput, setColorInput]   = useState('');
  const [imageUrls, setImageUrls]     = useState(['', '', '', '', '']);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  const toggleSize = (s: string) =>
    setSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  // Auto-compute selling price from MRP + GST when sellingPrice is not manually set
  const computedPrice = sellingPrice
    ? sellingPrice
    : mrp
      ? (parseFloat(mrp) * (1 + gst / 100)).toFixed(0)
      : '';

  const gstAmount = mrp ? (parseFloat(mrp) * gst / 100).toFixed(2) : '0';

  function reset() {
    setName(''); setCategory(CATEGORIES[0]); setSubCategory('');
    setDescription(''); setMrp(''); setSellingPrice(''); setGst(5);
    setStock(''); setSizes([]); setColorInput('');
    setImageUrls(['', '', '', '', '']); setSubmitted(false);
  }

  async function handleSubmit() {
    if (!name.trim()) { toast.error('Product name is required'); return; }
    if (!mrp)         { toast.error('MRP is required'); return; }
    if (!stock)       { toast.error('Stock quantity is required'); return; }
    if (!user?.id)    { toast.error('Not authenticated'); return; }

    const images = imageUrls.filter(Boolean);
    const colors = colorInput
      .split(',')
      .map(c => ({ name: c.trim() }))
      .filter(c => c.name);

    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          product: {
            productId: `ADMIN-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
            name: name.trim(),
            category,
            subCategory: subCategory.trim() || undefined,
            description: description.trim() || undefined,
            price: parseFloat(computedPrice) || parseFloat(mrp),
            originalPrice: parseFloat(mrp),
            stockQuantity: parseInt(stock, 10),
            sizes,
            colors,
            images,
            mainImage: images[0] || undefined,
            isActive: true,
            isNewArrival: false,
            isBestSeller: false,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');
      setSubmitted(true);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create product';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-10 text-center max-w-2xl">
        <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Product Added &amp; Live!</h3>
        <p className="text-xs text-gray-400 mb-5">
          Admin-created products are approved and live immediately — no QC queue.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
        >
          Add Another Product
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Single Product Upload</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Create one product at a time. Goes live immediately — no QC required.
        </p>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-5 space-y-4">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Basic Information</h4>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Banarasi Silk Saree"
            className={INPUT_CLS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Category <span className="text-red-500">*</span>
            </label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={INPUT_CLS}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Sub-Category</label>
            <input
              value={subCategory}
              onChange={e => setSubCategory(e.target.value)}
              placeholder="e.g. Silk, Kurta, Lehenga"
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the product…"
            className={`${INPUT_CLS} resize-none`}
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-5 space-y-4">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pricing &amp; Stock</h4>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              MRP (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={mrp}
              onChange={e => { setMrp(e.target.value); setSellingPrice(''); }}
              placeholder="999"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">GST Slab</label>
            <select
              value={gst}
              onChange={e => { setGst(Number(e.target.value)); setSellingPrice(''); }}
              className={INPUT_CLS}
            >
              {GST_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Selling Price</label>
            <input
              type="number"
              value={sellingPrice || computedPrice}
              onChange={e => setSellingPrice(e.target.value)}
              placeholder="Auto-computed"
              className={INPUT_CLS}
            />
          </div>
        </div>
        {mrp && (
          <p className="text-[10px] text-gray-400">
            GST: ₹{gstAmount} ({gst}%) &middot; Final selling price: ₹{computedPrice}
          </p>
        )}

        <div className="w-1/3">
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Stock Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={stock}
            onChange={e => setStock(e.target.value)}
            placeholder="50"
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Variants */}
      <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-5 space-y-4">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Variants</h4>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">Sizes</label>
          <div className="flex flex-wrap gap-2">
            {SIZES_LIST.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSize(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
                  ${sizes.includes(s)
                    ? 'bg-[#5B1A3A] text-white border-[#5B1A3A]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
              >
                {s}
              </button>
            ))}
          </div>
          {sizes.length > 0 && (
            <p className="text-[10px] text-gray-400 mt-1">Selected: {sizes.join(', ')}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Colors <span className="text-[10px] text-gray-300 ml-1">(comma-separated)</span>
          </label>
          <input
            value={colorInput}
            onChange={e => setColorInput(e.target.value)}
            placeholder="Red, Gold, Navy Blue, Off White"
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] p-5 space-y-3">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Product Images (URLs)</h4>
        <p className="text-[10px] text-gray-400 -mt-2">Paste hosted image URLs (Supabase Storage, CDN, etc.).</p>
        {imageUrls.map((url, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-16 flex-shrink-0">
              Image {i + 1}{i === 0 ? <span className="text-red-400"> *</span> : ''}
            </span>
            <input
              value={url}
              onChange={e => setImageUrls(prev => prev.map((u, j) => (j === i ? e.target.value : u)))}
              placeholder={i === 0 ? 'https://… (main product image)' : `https://… (optional)`}
              className={INPUT_CLS}
            />
            {url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt=""
                className="w-9 h-9 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Notice */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <Package size={14} className="text-blue-500 flex-shrink-0" />
        <p className="text-[10px] text-blue-700">
          Admin-created products are automatically approved and go live immediately. No QC review needed.
        </p>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !name.trim() || !mrp || !stock}
        className="w-full py-3 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
      >
        {submitting ? 'Creating Product…' : 'Create Product & Go Live'}
      </button>
    </div>
  );
}
