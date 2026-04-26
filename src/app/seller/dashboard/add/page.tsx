'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, X, Check, ImagePlus, Tag, Package, Truck, AlertCircle, Upload } from 'lucide-react';

/* ─── Category Types ────────────────────────────────────────────────────────── */

interface CatOption {
  id: string;
  name: string;
  nameHi: string;
  icon: string;
}

/* ─── Occasion tags ─────────────────────────────────────────────────────────── */
const OCCASION_TAGS = [
  { id: 'wedding',        label: 'Wedding Season',   labelHi: 'वेडिंग सीज़न',   icon: '' },
  { id: 'chhath',         label: 'Chhath Puja',      labelHi: 'छठ पूजा',         icon: '' },
  { id: 'diwali',         label: 'Diwali',            labelHi: 'दिवाली',           icon: '' },
  { id: 'eid',            label: 'Eid',               labelHi: 'ईद',              icon: '' },
  { id: 'navratri',       label: 'Navratri',          labelHi: 'नवरात्रि',         icon: '' },
  { id: 'daily-office',   label: 'Daily Office',      labelHi: 'ऑफिस वियर',       icon: '' },
  { id: 'college',        label: 'College / Campus',  labelHi: 'कॉलेज',            icon: '' },
  { id: 'party',          label: 'Party Wear',        labelHi: 'पार्टी वियर',      icon: '' },
  { id: 'anniversary',    label: 'Anniversary',       labelHi: 'एनिवर्सरी',        icon: '' },
  { id: 'mehendi',        label: 'Mehendi / Haldi',   labelHi: 'मेहंदी/हल्दी',     icon: '' },
  { id: 'sangeet',        label: 'Sangeet',           labelHi: 'संगीत',            icon: '' },
  { id: 'raksha-bandhan', label: 'Raksha Bandhan',    labelHi: 'रक्षाबंधन',         icon: '' },
  { id: 'karwa-chauth',   label: 'Karwa Chauth',      labelHi: 'करवाचौथ',           icon: '' },
  { id: 'holi',           label: 'Holi',              labelHi: 'होली',             icon: '' },
  { id: 'casual',         label: 'Casual Everyday',   labelHi: 'कैजुअल',           icon: '' },
];

const COLORS_LIST = [
  // Reds & Pinks
  { name: 'Red',         hex: '#EF4444' }, { name: 'Maroon',      hex: '#7F1D1D' },
  { name: 'Burgundy',    hex: '#991B1B' }, { name: 'Wine',        hex: '#722F37' },
  { name: 'Pink',        hex: '#EC4899' }, { name: 'Hot Pink',    hex: '#FF69B4' },
  { name: 'Blush',       hex: '#FECDD3' }, { name: 'Dusty Pink',  hex: '#D4A5A5' },
  { name: 'Rose Gold',   hex: '#B76E79' }, { name: 'Peach',       hex: '#FBBF9E' },
  { name: 'Coral',       hex: '#F97B6B' }, { name: 'Magenta',     hex: '#D946EF' },
  // Oranges & Yellows
  { name: 'Orange',      hex: '#F97316' }, { name: 'Rust',        hex: '#B45309' },
  { name: 'Burnt Orange',hex: '#C2410C' }, { name: 'Yellow',      hex: '#EAB308' },
  { name: 'Mustard',     hex: '#CA8A04' }, { name: 'Gold',        hex: '#C49A3C' },
  { name: 'Champagne',   hex: '#F7E7CE' }, { name: 'Copper',      hex: '#B87333' },
  // Greens
  { name: 'Green',       hex: '#22C55E' }, { name: 'Emerald',     hex: '#10B981' },
  { name: 'Teal',        hex: '#14B8A6' }, { name: 'Mint',        hex: '#6EE7B7' },
  { name: 'Sage',        hex: '#84A98C' }, { name: 'Olive',       hex: '#65A30D' },
  { name: 'Forest Green',hex: '#166534' }, { name: 'Bottle Green',hex: '#004225' },
  // Blues
  { name: 'Sky Blue',    hex: '#38BDF8' }, { name: 'Blue',        hex: '#3B82F6' },
  { name: 'Royal Blue',  hex: '#2563EB' }, { name: 'Cobalt',      hex: '#1D4ED8' },
  { name: 'Navy',        hex: '#1E3A5F' }, { name: 'Turquoise',   hex: '#06B6D4' },
  // Purples
  { name: 'Lavender',    hex: '#C4B5FD' }, { name: 'Lilac',       hex: '#DDD6FE' },
  { name: 'Mauve',       hex: '#C084FC' }, { name: 'Purple',      hex: '#A855F7' },
  { name: 'Violet',      hex: '#7C3AED' }, { name: 'Indigo',      hex: '#4F46E5' },
  { name: 'Plum',        hex: '#7E22CE' },
  // Neutrals & Earthy
  { name: 'White',       hex: '#F9FAFB' }, { name: 'Off White',   hex: '#FAF9F6' },
  { name: 'Ivory',       hex: '#FFFFF0' }, { name: 'Cream',       hex: '#FFFBEB' },
  { name: 'Beige',       hex: '#D2B48C' }, { name: 'Khaki',       hex: '#C3B091' },
  { name: 'Caramel',     hex: '#C19A6B' }, { name: 'Brown',       hex: '#92400E' },
  { name: 'Chocolate',   hex: '#78350F' }, { name: 'Silver',      hex: '#9CA3AF' },
  { name: 'Grey',        hex: '#6B7280' }, { name: 'Charcoal',    hex: '#374151' },
  { name: 'Black',       hex: '#111827' },
];

const SIZES_LIST = [
  // Clothing sizes
  'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size',
  // Shoe / footwear sizes
  '5', '6', '7', '8', '9', '10', '11',
  // Waist / bottom wear (inches)
  '20', '22', '24', '26', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46',
];
const FABRIC_OPTS   = ['Cotton', 'Silk', 'Georgette', 'Chiffon', 'Polyester', 'Rayon', 'Linen', 'Net', 'Velvet', 'Wool', 'Blend', 'Other'];
const WORK_OPTS     = ['Embroidered', 'Printed', 'Woven', 'Zari', 'Sequin', 'Mirror Work', 'Handloom', 'Block Print', 'Bandhani', 'Chikankari', 'Kalamkari', 'Plain'];
const PATTERN_OPTS  = ['Solid', 'Printed', 'Striped', 'Checked', 'Floral', 'Abstract', 'Geometric', 'Paisley'];
const WASH_OPTS     = ['Hand Wash', 'Machine Wash', 'Dry Clean Only', 'Gentle Wash'];
const GST_OPTS      = [{ label: 'Exempt (0%)', value: 0 }, { label: '5% (Cotton < ₹1000)', value: 5 }, { label: '12% (Synthetic / > ₹1000)', value: 12 }, { label: '18%', value: 18 }];
const CLOSURE_OPTS  = ['Asymmetrical', 'Symmetrical'];
const POCKETS_OPTS  = ['1', '2', '3', 'No Pockets'];
const WEAVE_OPTS    = ['Chambray', 'Corduroy', 'Denim', 'Dobby', 'Knitted', 'Oxford', 'Regular'];

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function SectionCard({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-[#333333]" style={{ fontFamily: 'var(--font-dm-sans,DM Sans,sans-serif)' }}>{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-[#666666] mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const INPUT_CLS = 'w-full px-3 py-2 text-sm border border-[#E8E0E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 focus:border-[#C49A3C] bg-white text-[#333333] transition-colors';

/* ─── Main Page ─────────────────────────────────────────────────────────────── */

export default function AddProductPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [sellerId, setSellerId]   = useState('');
  const [sellerName, setSellerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  /* Category selection */
  const [l1, setL1] = useState('');
  const [l2, setL2] = useState('');
  const [l3, setL3] = useState('');
  const [catSearch, setCatSearch] = useState('');

  /* Categories fetched from DB */
  const [l1Cats, setL1Cats] = useState<CatOption[]>([]);
  const [l2Cats, setL2Cats] = useState<CatOption[]>([]);
  const [l3Cats, setL3Cats] = useState<CatOption[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{ l1Id: string; l1Name: string; l2Id: string; l2Name: string; l3Id: string; l3Name: string; breadcrumb: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  /* Product details */
  const [name, setName]         = useState('');
  const [nameHi, setNameHi]     = useState('');
  const [description, setDescription]   = useState('');
  const [brand, setBrand]       = useState('');
  const [tags, setTags]         = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  /* Photos */
  const [images, setImages]         = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Pricing */
  const [mrp, setMrp]     = useState('');
  const [price, setPrice] = useState('');
  const [gst, setGst]     = useState(5);
  const [stock, setStock] = useState('');
  const [lowStockAlert, setLowStockAlert] = useState('10');

  /* Specs */
  const [fabric, setFabric]       = useState('');
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [colors, setColors]       = useState<string[]>([]);
  const [sizes, setSizes]         = useState<string[]>([]);
  const [pattern, setPattern]     = useState('');
  const [washCare, setWashCare]   = useState('');

  /* Occasion tags */
  const [occasionTags, setOccasionTags] = useState<string[]>([]);

  /* Shipping */
  const [weight, setWeight]           = useState('');
  const [dispatchTime, setDispatchTime] = useState('2');

  /* Seller details (editable on this form) */
  const [sellerAddress, setSellerAddress]         = useState('');
  const [sellerPincode, setSellerPincode]         = useState('');
  const [sellerPhone, setSellerPhone]             = useState('');
  const [sellerPhoneConsent, setSellerPhoneConsent] = useState(false);

  /* Other details */
  const [productSku, setProductSku]   = useState('');
  const [closure, setClosure]         = useState('');
  const [pockets, setPockets]         = useState('');
  const [weavePattern, setWeavePattern] = useState('');

  /* Declarations */
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/sellers/me?userId=${user.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.seller) {
          setSellerId(d.seller.id);
          setSellerName(d.seller.businessName || user.name || 'Seller');
          setSellerAddress(d.seller.address || d.seller.business_address || '');
          setSellerPincode(d.seller.pincode || d.seller.business_pincode || '');
          setSellerPhone(d.seller.businessPhone || d.seller.business_phone || '');
        }
      });
  }, [user?.id]);

  /* Load L1 categories on mount */
  useEffect(() => {
    setCatsLoading(true);
    fetch('/api/categories?level=1&active=true')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setL1Cats((d.data || []).map((c: any) => ({ id: c.id, name: c.name, nameHi: c.name_hindi || '', icon: c.icon || '' })));
        }
      })
      .catch(() => {/* silent */})
      .finally(() => setCatsLoading(false));
  }, []);

  /* Load L2 when L1 selected */
  useEffect(() => {
    if (!l1) { setL2Cats([]); return; }
    fetch(`/api/categories?parent_id=${l1}&active=true`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setL2Cats((d.data || []).map((c: any) => ({ id: c.id, name: c.name, nameHi: c.name_hindi || '', icon: c.icon || '' })));
        }
      })
      .catch(() => {/* silent */});
  }, [l1]);

  /* Load L3 when L2 selected */
  useEffect(() => {
    if (!l2) { setL3Cats([]); return; }
    fetch(`/api/categories?parent_id=${l2}&active=true`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setL3Cats((d.data || []).map((c: any) => ({ id: c.id, name: c.name, nameHi: c.name_hindi || '', icon: c.icon || '' })));
        }
      })
      .catch(() => {/* silent */});
  }, [l2]);

  /* Debounced category search */
  const runSearch = useCallback((q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    fetch(`/api/categories/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setSearchResults((d.data || [])
            .filter((c: any) => c.level === 3)
            .map((c: any) => ({
              l1Id: c.l1_id || '',
              l1Name: c.breadcrumb?.split(' > ')[0] || '',
              l2Id: c.l2_id || '',
              l2Name: c.breadcrumb?.split(' > ')[1] || '',
              l3Id: c.id,
              l3Name: c.name,
              breadcrumb: c.breadcrumb || c.name,
            }))
            .slice(0, 8)
          );
        }
      })
      .catch(() => {/* silent */})
      .finally(() => setSearchLoading(false));
  }, []);

  useEffect(() => {
    if (!catSearch.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(() => runSearch(catSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [catSearch, runSearch]);

  /* Derived values */
  const discountPct = mrp && price && parseFloat(mrp) > parseFloat(price)
    ? Math.round((1 - parseFloat(price) / parseFloat(mrp)) * 100) : 0;
  const l1Label = l1Cats.find(c => c.id === l1);
  const l2Label = l2Cats.find(c => c.id === l2);
  const l3Label = l3Cats.find(c => c.id === l3);

  function selectL1(id: string) { setL1(id); setL2(''); setL3(''); setL2Cats([]); setL3Cats([]); setCatSearch(''); setSearchResults([]); }
  function selectL2(id: string) { setL2(id); setL3(''); setL3Cats([]); }
  function selectL3(id: string) { setL3(id); }
  function resetCat() { setL1(''); setL2(''); setL3(''); setL2Cats([]); setL3Cats([]); }
  function toggleMulti(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }
  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) { setTags(p => [...p, t]); setTagInput(''); }
  }

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!fileArr.length) return;
    const slots = 8 - images.length;
    if (slots <= 0) { setUploadError('Maximum 8 photos allowed.'); return; }
    const toUpload = fileArr.slice(0, slots);
    setUploading(true);
    setUploadError('');
    const results = await Promise.allSettled(toUpload.map(async (file) => {
      if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} exceeds 5 MB`);
      const fd = new FormData();
      fd.append('file', file);
      if (sellerId) fd.append('sellerId', sellerId);
      fd.append('category', 'products');
      const res = await fetch('/api/upload/image', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
      const data = await res.json();
      return data.url as string;
    }));
    const uploaded: string[] = [];
    const errors: string[] = [];
    results.forEach(r => {
      if (r.status === 'fulfilled') uploaded.push(r.value);
      else errors.push(r.reason?.message || 'Upload failed');
    });
    if (uploaded.length) setImages(prev => [...prev, ...uploaded].slice(0, 8));
    if (errors.length) setUploadError(errors.join('; '));
    setUploading(false);
  }, [images, sellerId]);

  const isValid = name && l3 && description && price && stock && checked1 && checked2 && sellerId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isValid) { setError('Please fill all required fields and check the declarations.'); return; }
    setSubmitting(true);
    try {
      // Auto-generate a product ID if the seller left SKU blank
      const productId = productSku.trim() || `PRD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const body = {
        userId: user?.id,
        sellerId,
        product: {
          productId,
          name,
          category: l1,
          subCategory: l2,
          description,
          fabric: fabric || undefined,
          price: parseFloat(price),
          originalPrice: parseFloat(mrp) || parseFloat(price),
          stockQuantity: parseInt(stock),
          sizes,
          colors: colors.map(c => ({ name: c, hex: COLORS_LIST.find(x => x.name === c)?.hex || '#000' })),
          images,
          mainImage: images[0] || undefined,
          isActive: false,
          isNewArrival: false,
          isBestSeller: false,
        },
      };
      const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create product'); }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit product');
    } finally { setSubmitting(false); }
  }

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16" style={{ fontFamily: 'var(--font-dm-sans,DM Sans,sans-serif)' }}>
        <div className="w-16 h-16 rounded-full bg-[#F5EDF2] flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5B1A3A" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-xl font-semibold text-[#5B1A3A] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Product Submitted for Review!</h2>
        <p className="text-sm text-[#666] mb-1">Your product is now in the QC pipeline.</p>
        <p className="text-sm text-[#999] mb-6">Our team will approve it within 24 hours — you'll be notified.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSubmitted(false); setName(''); setDescription(''); setPrice(''); setMrp(''); setStock(''); setSizes([]); setColors([]); setImages([]); setL1(''); setL2(''); setL3(''); setOccasionTags([]); setChecked1(false); setChecked2(false); }}
            className="px-5 py-2.5 text-sm font-semibold border border-[#E8E0E4] rounded-lg text-[#5B1A3A] hover:bg-[#F5EDF2] transition-colors">
            Add Another Product
          </button>
          <button onClick={() => router.push('/seller/dashboard/qc')}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
            View QC Status
          </button>
        </div>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'var(--font-dm-sans,DM Sans,sans-serif)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ══ LEFT: Form (65%) ══ */}
        <div className="lg:col-span-3 space-y-5">

          {/* ── Section 1: Category ── */}
          <SectionCard title="Category Selection">

            {/* Search */}
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
              <input value={catSearch} onChange={e => setCatSearch(e.target.value)}
                placeholder="Search category… e.g. Banarasi Saree, Kurta"
                className={`${INPUT_CLS} pl-8 text-xs`} />
              {searchLoading && catSearch.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E0E4] rounded-xl shadow-lg z-20 px-3 py-2 text-xs text-[#999]">Searching…</div>
              )}
              {searchResults.length > 0 && catSearch && !searchLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E0E4] rounded-xl shadow-lg z-20 max-h-56 overflow-y-auto">
                  {searchResults.map(r => (
                    <button key={r.l3Id} type="button"
                      onClick={() => { selectL1(r.l1Id); selectL2(r.l2Id); selectL3(r.l3Id); setCatSearch(''); setSearchResults([]); }}
                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-[#F5EDF2] transition-colors flex items-center gap-1.5 border-b border-[#E8E0E4]/50 last:border-0">
                      <span className="text-[#999]">{r.l1Name}</span>
                      <ChevronRight size={10} className="text-[#C49A3C]" />
                      <span className="text-[#666]">{r.l2Name}</span>
                      <ChevronRight size={10} className="text-[#C49A3C]" />
                      <span className="font-semibold text-[#5B1A3A]">{r.l3Name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected breadcrumb */}
            {l3 && l1Label && l2Label && l3Label ? (
              <div className="flex items-center justify-between p-3 bg-[#F5EDF2] border border-[rgba(196,154,60,0.15)] rounded-xl mb-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5B1A3A]">
                  <span>{l1Label.name}</span>
                  <ChevronRight size={12} className="text-[#C49A3C]" />
                  <span>{l2Label.name}</span>
                  <ChevronRight size={12} className="text-[#C49A3C]" />
                  <span>{l3Label.name}</span>
                </div>
                <button type="button" onClick={resetCat} className="text-xs text-[#C49A3C] font-medium hover:underline">Change</button>
              </div>
            ) : (
              <>
                {/* Step 1: Main category */}
                <div className="mb-1">
                  <p className="text-xs font-medium text-[#666] mb-2">Step 1: Main Category <span className="text-red-500">*</span></p>
                  {catsLoading ? (
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(i => <div key={i} className="w-20 h-16 rounded-[14px] bg-[#E8E0E4] animate-pulse" />)}
                    </div>
                  ) : l1Cats.length === 0 ? (
                    <p className="text-xs text-[#999]">Unable to load categories. Please refresh.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {l1Cats.map(c => (
                        <button key={c.id} type="button" onClick={() => selectL1(c.id)}
                          className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-[14px] border transition-all duration-200 min-w-[80px]"
                          style={l1 === c.id
                            ? { borderColor: '#5B1A3A', borderWidth: '2px', background: '#F5EDF2', boxShadow: '0 4px 15px rgba(91,26,58,0.1)' }
                            : { borderColor: '#E8E0E4', background: 'white' }}>
                          <span className="text-xs font-semibold text-[#333]">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 2: Subcategory */}
                {l1 && l2Cats.length > 0 && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-medium text-[#666] mb-2">Step 2: Subcategory <span className="text-red-500">*</span></p>
                    <div className="flex flex-wrap gap-2">
                      {l2Cats.map(c => (
                        <button key={c.id} type="button" onClick={() => selectL2(c.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                          style={l2 === c.id
                            ? { background: '#5B1A3A', color: 'white', borderColor: '#5B1A3A', boxShadow: '0 2px 8px rgba(91,26,58,0.2)' }
                            : { background: 'white', color: '#555', borderColor: '#E8E0E4' }}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Product type */}
                {l2 && l3Cats.length > 0 && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-medium text-[#666] mb-2">Step 3: Product Type <span className="text-red-500">*</span></p>
                    <div className="flex flex-wrap gap-2">
                      {l3Cats.map(c => (
                        <button key={c.id} type="button" onClick={() => selectL3(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs transition-all"
                          style={l3 === c.id
                            ? { borderColor: '#C49A3C', borderWidth: '2px', background: 'rgba(196,154,60,0.08)', color: '#5B1A3A', fontWeight: 700 }
                            : { background: 'white', color: '#666', borderColor: '#E8E0E4' }}>
                          {l3 === c.id && <Check size={10} />} {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {l2 && l3Cats.length === 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-[#999]">No specific product types — you can proceed with the subcategory above.</p>
                  </div>
                )}
              </>
            )}
          </SectionCard>

          {/* ── Section 2: Product Details ── */}
          <SectionCard title="Product Details">
            <div className="space-y-4">
              <div>
                <FieldLabel>Product ID / SKU</FieldLabel>
                <input value={productSku} onChange={e => setProductSku(e.target.value)} maxLength={50}
                  placeholder="e.g. SKU-001 (optional — auto-assigned if left blank)"
                  className={INPUT_CLS} />
              </div>
              <div>
                <FieldLabel required>Product Title (English)</FieldLabel>
                <input value={name} onChange={e => setName(e.target.value)} maxLength={120}
                  placeholder="e.g. Pure Banarasi Silk Saree with Zari Border"
                  className={INPUT_CLS} />
                <p className="text-[10px] text-[#999] mt-0.5 text-right">{name.length}/120</p>
              </div>
              <div>
                <FieldLabel required>Description</FieldLabel>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  placeholder="Describe the product — fabric, design, occasion, wash care, what's included…"
                  className={`${INPUT_CLS} resize-none`} />
                <p className="text-[10px] text-[#999] mt-0.5">{description.length}/2000 chars (min 50)</p>
              </div>
              <div>
                <FieldLabel>Tags / Keywords</FieldLabel>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="e.g. silk, wedding" className={`${INPUT_CLS} flex-1`} />
                  <button type="button" onClick={addTag}
                    className="px-3 py-2 text-xs font-semibold text-white rounded-lg" style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
                    <Tag size={12} />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5EDF2] text-[#5B1A3A] text-[10px] rounded-full font-medium">
                        {t}
                        <button type="button" onClick={() => setTags(p => p.filter(x => x !== t))} className="text-[#999] hover:text-[#5B1A3A]"><X size={8} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ── Section 3: Photos ── */}
          <SectionCard title="Photos & Videos">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files) processFiles(e.target.files); e.target.value = ''; }}
            />

            {/* Guidelines */}
            <div className="p-3 bg-[#F5EDF2] border border-[rgba(196,154,60,0.15)] rounded-xl mb-4 text-xs text-[#666] space-y-1">
              <p className="font-semibold text-[#5B1A3A] mb-1.5">Photo Guidelines</p>
              {['Use white / plain background', 'Minimum 3 photos from different angles', 'Include close-up of fabric texture', 'No watermarks or text on images', 'Minimum resolution: 800×800px — JPEG, PNG or WebP, max 5 MB each'].map(tip => (
                <p key={tip} className="flex items-center gap-1.5"><Check size={10} className="text-[#C49A3C]" />{tip}</p>
              ))}
            </div>

            {/* Drag-and-drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => { e.preventDefault(); setIsDragOver(false); processFiles(e.dataTransfer.files); }}
              onClick={() => images.length < 8 && fileInputRef.current?.click()}
              className={`mb-3 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-5 cursor-pointer transition-all ${
                isDragOver
                  ? 'border-[#C49A3C] bg-[rgba(196,154,60,0.05)]'
                  : images.length >= 8
                    ? 'border-[#E8E0E4] cursor-not-allowed opacity-50'
                    : 'border-[#E8E0E4] hover:border-[#C49A3C]/60 hover:bg-[#FAFAFA]'
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="animate-spin w-6 h-6 text-[#C49A3C]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  <p className="text-xs text-[#999]">Uploading…</p>
                </div>
              ) : (
                <>
                  <Upload size={22} className="text-[#C49A3C]" />
                  <p className="text-sm font-medium text-[#5B1A3A]">Drag & drop photos here</p>
                  <p className="text-xs text-[#999]">or <span className="text-[#C49A3C] font-semibold underline">click to browse</span></p>
                  <p className="text-[10px] text-[#CCC]">JPEG · PNG · WebP · max 5 MB per file</p>
                </>
              )}
            </div>

            {/* Image grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[0,1,2,3,4,5,6,7].map(i => (
                <div key={i} className="aspect-square relative">
                  {images[i] ? (
                    <div className="relative w-full h-full">
                      <img src={images[i]} alt="" className="w-full h-full object-cover rounded-xl border border-[#E8E0E4]" />
                      {i === 0 && <span className="absolute top-1 left-1 text-[8px] px-1.5 py-0.5 text-white rounded-md font-bold" style={{ background: '#5B1A3A' }}>Main</span>}
                      <button type="button" onClick={() => setImages(p => p.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center shadow">
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || images.length >= 8}
                      className="w-full h-full border-2 border-dashed border-[#E8E0E4] rounded-xl flex flex-col items-center justify-center gap-1 text-[#CCC] hover:border-[#C49A3C]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ImagePlus size={16} />
                      {i === 0 && <span className="text-[8px] text-[#999]">Main</span>}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg mb-2">
                <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{uploadError}</p>
                <button type="button" onClick={() => setUploadError('')} className="ml-auto text-red-400 hover:text-red-600"><X size={12} /></button>
              </div>
            )}

            <p className="text-[10px] text-[#999] mt-1">{images.length}/8 photos {images.length < 3 ? `— ${3 - images.length} more required` : '— requirement met'}</p>

            {/* Video callout */}
            <div className="mt-3 p-3 bg-[#FFFBEB] border border-[rgba(196,154,60,0.2)] rounded-xl text-xs text-[#5B1A3A] flex items-center gap-2">
              <span><strong>Products with videos get 3x more orders!</strong></span>
            </div>
          </SectionCard>

          {/* ── Section 4: Pricing ── */}
          <SectionCard title="Pricing & Stock">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <FieldLabel required>MRP (₹)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#999]">₹</span>
                  <input type="number" value={mrp} onChange={e => setMrp(e.target.value)} min="0" placeholder="0"
                    className={`${INPUT_CLS} pl-7`} />
                </div>
              </div>
              <div>
                <FieldLabel required>Selling Price (₹)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#999]">₹</span>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} min="0" placeholder="0"
                    className={`${INPUT_CLS} pl-7`} />
                </div>
                {discountPct > 0 && <p className="text-[10px] text-green-600 mt-0.5 font-semibold">{discountPct}% off</p>}
              </div>
              <div>
                <FieldLabel required>GST Rate</FieldLabel>
                <select value={gst} onChange={e => setGst(Number(e.target.value))} className={INPUT_CLS}>
                  {GST_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel required>Stock Quantity</FieldLabel>
                <input type="number" value={stock} onChange={e => setStock(e.target.value)} min="0" placeholder="0"
                  className={INPUT_CLS} />
              </div>
              <div>
                <FieldLabel>Low Stock Alert (pieces)</FieldLabel>
                <input type="number" value={lowStockAlert} onChange={e => setLowStockAlert(e.target.value)} min="0"
                  className={INPUT_CLS} />
              </div>
            </div>

            {/* Pricing summary */}
            {price && (
              <div className="p-3 border border-[rgba(196,154,60,0.2)] rounded-xl bg-[#FFFBEB] text-xs space-y-1.5">
                <p className="font-semibold text-[#5B1A3A] mb-1">Price Breakdown</p>
                {[
                  { label: 'MRP', val: mrp ? `₹${parseFloat(mrp).toLocaleString('en-IN')}` : '—' },
                  { label: `Selling Price${discountPct > 0 ? ` (${discountPct}% off)` : ''}`, val: `₹${parseFloat(price).toLocaleString('en-IN')}`, highlight: true },
                  { label: `GST (${gst}%)`, val: `₹${(parseFloat(price) * gst / (100 + gst)).toFixed(0)}` },
                  { label: 'Customer Pays', val: `₹${parseFloat(price).toLocaleString('en-IN')}`, bold: true },
                  { label: 'You Receive (0% commission)', val: `₹${parseFloat(price).toLocaleString('en-IN')}`, bold: true, color: '#2E7D32' },
                ].map(r => (
                  <div key={r.label} className={`flex justify-between ${r.bold ? 'font-semibold border-t border-[rgba(196,154,60,0.1)] pt-1' : ''}`}>
                    <span className="text-[#666]">{r.label}</span>
                    <span style={{ color: r.color || (r.highlight ? '#5B1A3A' : '#333') }}>{r.val}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Section 5: Fabric & Specs ── */}
          <SectionCard title="Fabric & Specifications">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <FieldLabel>Fabric / Material</FieldLabel>
                <select value={fabric} onChange={e => setFabric(e.target.value)} className={INPUT_CLS}>
                  <option value="">Select fabric</option>
                  {FABRIC_OPTS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Pattern</FieldLabel>
                <select value={pattern} onChange={e => setPattern(e.target.value)} className={INPUT_CLS}>
                  <option value="">Select pattern</option>
                  {PATTERN_OPTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <FieldLabel>Wash Care</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {WASH_OPTS.map(w => (
                    <button key={w} type="button" onClick={() => setWashCare(washCare === w ? '' : w)}
                      className="px-3 py-1.5 rounded-full border text-xs transition-all"
                      style={washCare === w ? { background: '#5B1A3A', color: 'white', borderColor: '#5B1A3A' } : { background: 'white', color: '#666', borderColor: '#E8E0E4' }}>
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <FieldLabel>Work / Design (multi-select)</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {WORK_OPTS.map(w => (
                  <button key={w} type="button" onClick={() => toggleMulti(workTypes, setWorkTypes, w)}
                    className="px-2.5 py-1 rounded-full border text-xs transition-all"
                    style={workTypes.includes(w) ? { borderColor: '#C49A3C', borderWidth: '2px', background: 'rgba(196,154,60,0.08)', color: '#5B1A3A', fontWeight: 700 } : { background: 'white', color: '#666', borderColor: '#E8E0E4' }}>
                    {workTypes.includes(w) && ' '}{w}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <FieldLabel>Available Sizes</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {SIZES_LIST.map(s => (
                  <button key={s} type="button" onClick={() => toggleMulti(sizes, setSizes, s)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                    style={sizes.includes(s) ? { background: 'linear-gradient(135deg,#5B1A3A,#7A2350)', color: 'white', borderColor: '#5B1A3A' } : { background: 'white', color: '#555', borderColor: '#E8E0E4' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Colors</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {COLORS_LIST.map(c => (
                  <button key={c.name} type="button" onClick={() => toggleMulti(colors, setColors, c.name)} title={c.name}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{ background: c.hex, borderColor: colors.includes(c.name) ? '#5B1A3A' : 'transparent', transform: colors.includes(c.name) ? 'scale(1.15)' : 'scale(1)', boxShadow: colors.includes(c.name) ? '0 0 0 2px #F5EDF2' : 'none' }} />
                ))}
              </div>
              {colors.length > 0 && <p className="text-[10px] text-[#999] mt-1.5">Selected: {colors.join(', ')}</p>}
            </div>
          </SectionCard>

          {/* ── Section 6: Occasion Tags ── */}
          <SectionCard
            title="Occasion Tags"
            badge={<span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg,#C49A3C,#DDB868)', color: 'white' }}>IFP Special</span>}>
            <p className="text-xs text-[#666] mb-3">Tag occasions to appear in IFP&apos;s Occasion Shop — reaching more customers!</p>
            <div className="flex flex-wrap gap-2">
              {OCCASION_TAGS.map(t => (
                <button key={t.id} type="button" onClick={() => toggleMulti(occasionTags, setOccasionTags, t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all"
                  style={occasionTags.includes(t.id) ? { borderColor: '#C49A3C', borderWidth: '2px', background: 'rgba(196,154,60,0.08)', color: '#5B1A3A', fontWeight: 700 } : { background: 'white', color: '#666', borderColor: '#E8E0E4' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* ── Section 7: Shipping ── */}
          <SectionCard title="Shipping">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Package Weight (grams)</FieldLabel>
                <div className="relative">
                  <Package size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)} min="0" placeholder="500"
                    className={`${INPUT_CLS} pl-8`} />
                </div>
              </div>
              <div>
                <FieldLabel>Dispatch Time</FieldLabel>
                <div className="relative">
                  <Truck size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                  <select value={dispatchTime} onChange={e => setDispatchTime(e.target.value)} className={`${INPUT_CLS} pl-8`}>
                    <option value="0">Same day</option>
                    <option value="1">1 day</option>
                    <option value="2">2 days</option>
                    <option value="3">3 days</option>
                  </select>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── Section 8: Seller Details ── */}
          <SectionCard title="Seller Details">
            <div className="space-y-4">
              <div>
                <FieldLabel>Seller Name</FieldLabel>
                <input value={sellerName} onChange={e => setSellerName(e.target.value)}
                  placeholder="Your shop / business name"
                  className={INPUT_CLS} />
              </div>
              <div>
                <FieldLabel>Address</FieldLabel>
                <input value={sellerAddress} onChange={e => setSellerAddress(e.target.value)}
                  placeholder="Shop / warehouse address"
                  className={INPUT_CLS} />
              </div>
              <div>
                <FieldLabel>Pincode</FieldLabel>
                <input type="text" inputMode="numeric" value={sellerPincode}
                  onChange={e => setSellerPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  className={INPUT_CLS} />
              </div>
              <div>
                <FieldLabel>Phone Number</FieldLabel>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-[#F5F0E8] border border-[#E8E0E4] rounded-lg text-sm text-[#666] font-medium flex-shrink-0">
                    +91
                  </div>
                  <input type="tel" inputMode="numeric" value={sellerPhone}
                    onChange={e => setSellerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit phone number"
                    maxLength={10}
                    className={`${INPUT_CLS} flex-1`} />
                </div>
                <label className="flex items-start gap-2.5 mt-2.5 cursor-pointer">
                  <input type="checkbox" checked={sellerPhoneConsent} onChange={e => setSellerPhoneConsent(e.target.checked)}
                    className="mt-0.5 accent-[#5B1A3A] flex-shrink-0" />
                  <span className="text-[11px] text-[#666] leading-relaxed">
                    I confirm this is my registered business phone number and consent to receive order updates on this number.
                  </span>
                </label>
              </div>
            </div>
          </SectionCard>

          {/* ── Section 9: Other Details ── */}
          <SectionCard title="Other Details">
            <div className="space-y-4">
              <div>
                <FieldLabel>Brand Name</FieldLabel>
                <input value={brand} onChange={e => setBrand(e.target.value)}
                  placeholder="Type your brand name (leave blank if unbranded)"
                  className={INPUT_CLS} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Closure</FieldLabel>
                  <select value={closure} onChange={e => setClosure(e.target.value)} className={INPUT_CLS}>
                    <option value="">Select closure</option>
                    {CLOSURE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>No. of Pockets</FieldLabel>
                  <select value={pockets} onChange={e => setPockets(e.target.value)} className={INPUT_CLS}>
                    <option value="">Select pockets</option>
                    {POCKETS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <FieldLabel>Weave Pattern</FieldLabel>
                <select value={weavePattern} onChange={e => setWeavePattern(e.target.value)} className={INPUT_CLS}>
                  <option value="">Select weave pattern</option>
                  {WEAVE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </SectionCard>

          {/* ── Declarations & Submit ── */}
          <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-5">
            <div className="space-y-3 mb-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={checked1} onChange={e => setChecked1(e.target.checked)} className="mt-0.5 accent-[#5B1A3A]" />
                <span className="text-xs text-[#666]">I confirm that all product information is accurate and the images are genuine product photos.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={checked2} onChange={e => setChecked2(e.target.checked)} className="mt-0.5 accent-[#5B1A3A]" />
                <span className="text-xs text-[#666]">I confirm this product is genuine and I have the right to sell it on Insta Fashion Points.</span>
              </label>
            </div>
            {error && (
              <div className="mb-4 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
            <button type="submit" disabled={submitting || !isValid}
              className="w-full py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
              {submitting ? 'Submitting…' : 'Submit Product for Approval'}
            </button>
            <p className="text-[10px] text-[#999] text-center mt-2">Product will be hidden from customers until approved (usually within 24 hours)</p>
          </div>
        </div>

        {/* ══ RIGHT: Live Preview (35%) ══ */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgba(196,154,60,0.08)] flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#5B1A3A]">Live Preview</p>
                  <p className="text-[9px] text-[#C49A3C] italic">ग्राहकों को ऐसा दिखेगा</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>

              {/* Product preview card */}
              <div className="p-4">
                {/* Image placeholder */}
                <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-[#F5EDF2] flex items-center justify-center">
                  {images[0] ? (
                    <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <ImagePlus size={32} className="text-[#C49A3C]/50 mx-auto mb-2" />
                      <p className="text-[10px] text-[#999]">Add photos above</p>
                    </div>
                  )}
                </div>

                {/* Category breadcrumb */}
                {l3Label && l2Label && (
                  <p className="text-[9px] text-[#999] mb-1">{l2Label.name} › {l3Label.name}</p>
                )}

                {/* Product name */}
                <p className="text-sm font-semibold text-[#333] line-clamp-2 mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {name || <span className="text-[#CCC]">Product title will appear here</span>}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2">
                  {price ? (
                    <>
                      <span className="text-base font-bold text-[#5B1A3A]">₹{parseFloat(price).toLocaleString('en-IN')}</span>
                      {mrp && parseFloat(mrp) > parseFloat(price) && (
                        <>
                          <span className="text-xs text-[#999] line-through">₹{parseFloat(mrp).toLocaleString('en-IN')}</span>
                          <span className="text-[10px] font-bold text-green-600">{discountPct}% off</span>
                        </>
                      )}
                    </>
                  ) : <span className="text-sm text-[#CCC]">Price not set</span>}
                </div>

                {/* Seller info */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-4 h-4 rounded-full bg-[#5B1A3A] flex items-center justify-center text-[7px] text-white font-bold">
                    {sellerName.charAt(0)}
                  </div>
                  <span className="text-[10px] text-[#666]">{sellerName || 'Your Shop'}</span>
                </div>

                {/* Tags */}
                {occasionTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {occasionTags.slice(0, 3).map(tid => {
                      const t = OCCASION_TAGS.find(x => x.id === tid);
                      return t ? (
                        <span key={tid} className="text-[8px] px-1.5 py-0.5 rounded-full border border-[rgba(196,154,60,0.2)] text-[#C49A3C] bg-[rgba(196,154,60,0.06)]">
                          {t.label}
                        </span>
                      ) : null;
                    })}
                    {occasionTags.length > 3 && <span className="text-[8px] text-[#999]">+{occasionTags.length - 3} more</span>}
                  </div>
                )}

                {/* Specs */}
                <div className="text-[10px] text-[#999] space-y-0.5">
                  {fabric && <p>Fabric: <span className="text-[#666]">{fabric}</span></p>}
                  {sizes.length > 0 && <p>Sizes: <span className="text-[#666]">{sizes.join(', ')}</span></p>}
                  {colors.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>Colors:</span>
                      {colors.slice(0,5).map(c => (
                        <span key={c} title={c} className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ background: COLORS_LIST.find(x => x.name === c)?.hex }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Completeness */}
                <div className="mt-3 pt-3 border-t border-[rgba(196,154,60,0.08)]">
                  <p className="text-[10px] font-semibold text-[#666] mb-1.5">Listing Completeness</p>
                  <div className="h-1.5 bg-[#F5EDF2] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${[l3, name, description, price, stock, images.length > 0, fabric].filter(Boolean).length / 7 * 100}%`,
                      background: 'linear-gradient(90deg,#5B1A3A,#C49A3C)'
                    }} />
                  </div>
                  <p className="text-[9px] text-[#999] mt-1">
                    {Math.round([l3, name, description, price, stock, images.length > 0, fabric].filter(Boolean).length / 7 * 100)}% complete
                  </p>
                </div>
              </div>
            </div>

            {/* GST Calculator card */}
            <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-4">
              <p className="text-xs font-semibold text-[#5B1A3A] mb-3"> GST Price Calculator</p>
              {price ? (
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Base Price (ex-GST)', val: `₹${(parseFloat(price) / (1 + gst / 100)).toFixed(2)}` },
                    { label: `GST Amount (${gst}%)`, val: `₹${(parseFloat(price) - parseFloat(price) / (1 + gst / 100)).toFixed(2)}` },
                    { label: 'Customer Pays', val: `₹${parseFloat(price).toLocaleString('en-IN')}`, bold: true },
                    { label: 'Your Earnings (0% fee)', val: `₹${parseFloat(price).toLocaleString('en-IN')}`, bold: true, color: '#2E7D32' },
                  ].map(r => (
                    <div key={r.label} className={`flex justify-between py-1 ${r.bold ? 'border-t border-[rgba(196,154,60,0.1)] font-semibold' : ''}`}>
                      <span className="text-[#999]">{r.label}</span>
                      <span style={{ color: r.color || (r.bold ? '#333' : '#666') }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#CCC] text-center py-3">Enter selling price to see breakdown</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
