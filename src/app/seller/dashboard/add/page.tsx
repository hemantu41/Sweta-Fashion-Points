'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

/* ── Static data ── */
const CATEGORIES = ['Clothes', 'Footwear', 'Beauty & Makeup', 'Sarees'];

const SUB_CATS: Record<string, string[]> = {
  Clothes: ['Shirt', 'T-Shirt', 'Jeans', 'Kurta', 'Salwar Suit', 'Lehenga', 'Jacket', 'Hoodie', 'Shorts'],
  Footwear: ['Casual Shoes', 'Formal Shoes', 'Sports Shoes', 'Sandals', 'Heels', 'Slippers', 'Boots'],
  'Beauty & Makeup': ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Nail Care', 'Body Care'],
  Sarees: ['Silk Saree', 'Cotton Saree', 'Georgette Saree', 'Party Saree', 'Wedding Saree', 'Daily Wear'],
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size', '6', '7', '8', '9', '10', '11'];
const COLORS = [
  { name: 'Red', hex: '#EF4444' }, { name: 'Blue', hex: '#3B82F6' }, { name: 'Green', hex: '#22C55E' },
  { name: 'Yellow', hex: '#EAB308' }, { name: 'Pink', hex: '#EC4899' }, { name: 'Purple', hex: '#A855F7' },
  { name: 'Orange', hex: '#F97316' }, { name: 'Black', hex: '#111827' }, { name: 'White', hex: '#F9FAFB' },
  { name: 'Navy', hex: '#1E3A5F' }, { name: 'Maroon', hex: '#7F1D1D' }, { name: 'Beige', hex: '#D2B48C' },
];
const GST_RATES = [0, 5, 12, 18];

/* ── GST Calculator ── */
function GstInfo({ price, gst }: { price: number; gst: number }) {
  const base = price / (1 + gst / 100);
  const gstAmt = price - base;
  const earnings = base * 0.9; // after 10% platform fee
  return (
    <div className="space-y-2 text-sm">
      {[
        { label: 'Base Price (ex-GST)', value: `₹${base.toFixed(2)}` },
        { label: `GST Amount (${gst}%)`, value: `₹${gstAmt.toFixed(2)}` },
        { label: 'Customer Pays', value: `₹${price.toFixed(2)}`, bold: true },
        { label: 'Your Earnings (after 10% fee)', value: `₹${earnings.toFixed(2)}`, bold: true, color: '#2E7D32' },
      ].map(r => (
        <div key={r.label} className={`flex justify-between py-1.5 border-b border-[#E8E0E4] last:border-0 ${r.bold ? 'font-semibold' : ''}`}>
          <span className="text-gray-500">{r.label}</span>
          <span style={{ color: r.color || (r.bold ? '#1A1A1A' : '#6B7280'), fontFamily: r.bold ? 'var(--font-playfair)' : undefined }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AddProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sellerId, setSellerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Clothes');
  const [subCat, setSubCat] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('');
  const [mrp, setMrp] = useState('');
  const [price, setPrice] = useState('');
  const [gst, setGst] = useState(5);
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [weight, setWeight] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/sellers/me?userId=${user.id}`)
      .then(r => r.json())
      .then(d => { if (d.seller) setSellerId(d.seller.id); });
  }, [user?.id]);

  function toggleSize(s: string) { setSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]); }
  function toggleColor(c: string) { setColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]); }

  function addImage() {
    const url = imageInput.trim();
    if (url && !images.includes(url)) { setImages(prev => [...prev, url]); setImageInput(''); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name || !category || !description || !price || !stock) { setError('Please fill all required fields.'); return; }
    if (!checked1 || !checked2) { setError('Please check both declarations before submitting.'); return; }
    if (!sellerId) { setError('Seller profile not found.'); return; }
    setSubmitting(true);
    try {
      const body = {
        sellerId, name, category, subCategory: subCat, description,
        brand, fabric: material, price: parseFloat(price),
        originalPrice: parseFloat(mrp) || parseFloat(price),
        stockQuantity: parseInt(stock),
        sku: sku || undefined, weight: weight ? parseInt(weight) : undefined,
        sizes, colors: colors.map(c => ({ name: c, hex: COLORS.find(x => x.name === c)?.hex || '#000' })),
        images, mainImage: images[0], approvalStatus: 'pending', isActive: false,
      };
      const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create product'); }
      setSubmitted(true);
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg className="text-green-600" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Product Submitted!</h2>
        <p className="text-gray-500 mb-6">Your product is now in the QC pipeline. It will go live once approved by our team (usually within 24 hours).</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSubmitted(false); setName(''); setDescription(''); setPrice(''); setMrp(''); setStock(''); setSizes([]); setColors([]); setImages([]); setChecked1(false); setChecked2(false); }}
            className="px-5 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
            Add Another
          </button>
          <button onClick={() => router.push('/seller/dashboard/qc')}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }}>
            View QC Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: Form ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  placeholder="e.g. Women's Printed Cotton Kurta"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5B1A3A]/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                  <select value={category} onChange={e => { setCategory(e.target.value); setSubCat(''); }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sub-category</label>
                  <select value={subCat} onChange={e => setSubCat(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
                    <option value="">Select…</option>
                    {(SUB_CATS[category] || []).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4}
                  placeholder="Describe the product — fabric, style, occasion, wash care…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5B1A3A]/30 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Brand</label>
                  <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand name"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Material / Fabric</label>
                  <input value={material} onChange={e => setMaterial(e.target.value)} placeholder="e.g. Cotton, Silk"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Variants</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map(s => (
                    <button key={s} type="button" onClick={() => toggleSize(s)}
                      className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${sizes.includes(s) ? 'text-white border-[#5B1A3A]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      style={sizes.includes(s) ? { background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' } : {}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Colors</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button key={c.name} type="button" onClick={() => toggleColor(c.name)}
                      title={c.name}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${colors.includes(c.name) ? 'border-gray-800 scale-110 ring-2 ring-offset-1 ring-gray-400' : 'border-transparent hover:scale-105'}`}
                      style={{ background: c.hex }} />
                  ))}
                </div>
                {colors.length > 0 && <p className="text-xs text-gray-400 mt-1.5">Selected: {colors.join(', ')}</p>}
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Pricing & Inventory</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">MRP (₹) *</label>
                <input type="number" value={mrp} onChange={e => setMrp(e.target.value)} required min="0"
                  placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (₹) *</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} required min="0"
                  placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">GST Rate</label>
                <select value={gst} onChange={e => setGst(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
                  {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stock Qty *</label>
                <input type="number" value={stock} onChange={e => setStock(e.target.value)} required min="0"
                  placeholder="0" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SKU (auto if blank)</label>
                <input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. KUR-RED-M"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Weight (grams)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} min="0"
                  placeholder="500" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Tools ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Image upload */}
          <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Product Images</h3>
            <p className="text-xs text-gray-400 mb-4">Minimum 4 images recommended. Use plain backgrounds. First image = main image.</p>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 mb-3 text-center hover:border-[#5B1A3A]/30 transition-colors">
              <svg className="mx-auto text-gray-300 mb-2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
              <p className="text-xs text-gray-400">Paste image URL below</p>
            </div>
            <div className="flex gap-2">
              <input value={imageInput} onChange={e => setImageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                placeholder="Paste image URL…"
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none" />
              <button type="button" onClick={addImage}
                className="px-3 py-2 text-xs font-semibold text-white rounded-lg" style={{ background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }}>
                Add
              </button>
            </div>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {images.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                    {i === 0 && <span className="absolute -top-1 -left-1 text-[9px] px-1 bg-[#5B1A3A] text-white rounded-sm">Main</span>}
                    <button type="button" onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-2">{images.length}/5 images added {images.length < 4 ? `(${4 - images.length} more recommended)` : '✓'}</p>
          </div>

          {/* GST Calculator */}
          <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">GST Price Calculator</h3>
            <p className="text-xs text-gray-400 mb-4">Live calculation based on your pricing.</p>
            {price ? (
              <GstInfo price={parseFloat(price) || 0} gst={gst} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Enter selling price to see breakdown</p>
            )}
          </div>

          {/* Submit card */}
          <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Submit for Review</h3>
            <div className="space-y-3 mb-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={checked1} onChange={e => setChecked1(e.target.checked)} className="mt-0.5 accent-[#5B1A3A]" />
                <span className="text-xs text-gray-600">I confirm that all product information is accurate and the images are genuine product photos.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={checked2} onChange={e => setChecked2(e.target.checked)} className="mt-0.5 accent-[#5B1A3A]" />
                <span className="text-xs text-gray-600">I confirm that this product is genuine and I have the right to sell it on Insta Fashion Points.</span>
              </label>
            </div>
            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">{error}</div>
            )}
            <button type="submit" disabled={submitting || !checked1 || !checked2}
              className="w-full py-3 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }}>
              {submitting ? 'Submitting…' : 'Submit for Approval'}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">Product will be hidden from customers until approved by our team</p>
          </div>
        </div>
      </div>
    </form>
  );
}
