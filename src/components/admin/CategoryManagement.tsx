'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Pencil, Search, X, Check } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  nameHindi?: string;
  slug: string;
  displayOrder: number;
  active: boolean;
  productCount: number;
  children?: Category[];
}

const MOCK_CATEGORIES: Category[] = [
  {
    id: '1', name: 'Women', nameHindi: 'महिलाएं', slug: 'women', displayOrder: 1, active: true, productCount: 45,
    children: [
      {
        id: '1-1', name: 'Sarees', nameHindi: 'साड़ियाँ', slug: 'sarees', displayOrder: 1, active: true, productCount: 28,
        children: [
          { id: '1-1-1', name: 'Silk Sarees', nameHindi: 'सिल्क साड़ियाँ', slug: 'silk-sarees', displayOrder: 1, active: true, productCount: 12 },
          { id: '1-1-2', name: 'Cotton Sarees', nameHindi: 'कॉटन साड़ियाँ', slug: 'cotton-sarees', displayOrder: 2, active: true, productCount: 8 },
          { id: '1-1-3', name: 'Banarasi Sarees', nameHindi: 'बनारसी साड़ियाँ', slug: 'banarasi-sarees', displayOrder: 3, active: false, productCount: 8 },
        ],
      },
      {
        id: '1-2', name: 'Kurtis & Kurta Sets', nameHindi: 'कुर्तियाँ', slug: 'kurtis-kurta-sets', displayOrder: 2, active: true, productCount: 17,
        children: [
          { id: '1-2-1', name: 'Straight Kurtis', nameHindi: 'स्ट्रेट कुर्ती', slug: 'straight-kurtis', displayOrder: 1, active: true, productCount: 9 },
          { id: '1-2-2', name: 'Anarkali Kurtis', nameHindi: 'अनारकली कुर्ती', slug: 'anarkali-kurtis', displayOrder: 2, active: true, productCount: 8 },
        ],
      },
      { id: '1-3', name: 'Lehengas', nameHindi: 'लहंगा', slug: 'lehengas', displayOrder: 3, active: true, productCount: 0, children: [] },
    ],
  },
  {
    id: '2', name: 'Men', nameHindi: 'पुरुष', slug: 'men', displayOrder: 2, active: true, productCount: 22,
    children: [
      {
        id: '2-1', name: 'Sherwanis', nameHindi: 'शेरवानी', slug: 'sherwanis', displayOrder: 1, active: true, productCount: 10,
        children: [
          { id: '2-1-1', name: 'Wedding Sherwanis', nameHindi: 'शादी शेरवानी', slug: 'wedding-sherwanis', displayOrder: 1, active: true, productCount: 6 },
          { id: '2-1-2', name: 'Party Sherwanis', nameHindi: 'पार्टी शेरवानी', slug: 'party-sherwanis', displayOrder: 2, active: true, productCount: 4 },
        ],
      },
      { id: '2-2', name: 'Kurta Pyjama', nameHindi: 'कुर्ता पायजामा', slug: 'kurta-pyjama', displayOrder: 2, active: true, productCount: 12, children: [] },
    ],
  },
  {
    id: '3', name: 'Kids', nameHindi: 'बच्चे', slug: 'kids', displayOrder: 3, active: true, productCount: 18,
    children: [
      { id: '3-1', name: 'Girls Ethnic', nameHindi: 'लड़कियों का एथनिक', slug: 'girls-ethnic', displayOrder: 1, active: true, productCount: 10, children: [] },
      { id: '3-2', name: 'Boys Ethnic', nameHindi: 'लड़कों का एथनिक', slug: 'boys-ethnic', displayOrder: 2, active: true, productCount: 8, children: [] },
    ],
  },
];

interface ModalState {
  open: boolean;
  mode: 'add' | 'edit';
  level: 1 | 2 | 3;
  parentId?: string;
  category?: Category;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ '1': true, '1-1': true });
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add', level: 1 });
  const [form, setForm] = useState({ name: '', nameHindi: '', slug: '', displayOrder: 1, active: true });

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const openAdd = (level: 1 | 2 | 3, parentId?: string) => {
    setForm({ name: '', nameHindi: '', slug: '', displayOrder: 1, active: true });
    setModal({ open: true, mode: 'add', level, parentId });
  };

  const openEdit = (cat: Category, level: 1 | 2 | 3) => {
    setForm({ name: cat.name, nameHindi: cat.nameHindi || '', slug: cat.slug, displayOrder: cat.displayOrder, active: cat.active });
    setModal({ open: true, mode: 'edit', level, category: cat });
  };

  const toggleActive = (id: string, level: 1 | 2 | 3, parentId?: string, grandParentId?: string) => {
    setCategories(prev => prev.map(l1 => {
      if (level === 1 && l1.id === id) return { ...l1, active: !l1.active };
      if (!l1.children) return l1;
      return {
        ...l1, children: l1.children.map(l2 => {
          if (level === 2 && l2.id === id) return { ...l2, active: !l2.active };
          if (!l2.children) return l2;
          return {
            ...l2, children: l2.children.map(l3 =>
              level === 3 && l3.id === id ? { ...l3, active: !l3.active } : l3
            ),
          };
        }),
      };
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const newCat: Category = {
      id: Date.now().toString(),
      name: form.name.trim(),
      nameHindi: form.nameHindi.trim() || undefined,
      slug: form.slug || slugify(form.name),
      displayOrder: form.displayOrder,
      active: form.active,
      productCount: 0,
      children: modal.level < 3 ? [] : undefined,
    };
    if (modal.mode === 'add') {
      if (modal.level === 1) {
        setCategories(p => [...p, newCat]);
      } else if (modal.level === 2) {
        setCategories(p => p.map(l1 => l1.id === modal.parentId ? { ...l1, children: [...(l1.children || []), newCat] } : l1));
      } else {
        setCategories(p => p.map(l1 => ({ ...l1, children: l1.children?.map(l2 => l2.id === modal.parentId ? { ...l2, children: [...(l2.children || []), newCat] } : l2) })));
      }
    } else if (modal.mode === 'edit' && modal.category) {
      const id = modal.category.id;
      const updated = { ...modal.category, ...form, slug: form.slug || slugify(form.name) };
      setCategories(p => p.map(l1 => {
        if (l1.id === id) return { ...updated, children: l1.children };
        return { ...l1, children: l1.children?.map(l2 => {
          if (l2.id === id) return { ...updated, children: l2.children };
          return { ...l2, children: l2.children?.map(l3 => l3.id === id ? { ...updated } : l3) };
        }) };
      }));
    }
    setModal({ open: false, mode: 'add', level: 1 });
  };

  const searchLower = search.toLowerCase();
  const matchesSearch = (name: string) => !search || name.toLowerCase().includes(searchLower);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Category Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage the 3-level product category taxonomy</p>
        </div>
        <button
          onClick={() => openAdd(1)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus size={15} /> Add Level 1 Category
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 mb-4 border border-[rgba(196,154,60,0.08)]">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
        </div>
      </div>

      {/* Category Tree */}
      <div className="bg-white rounded-xl border border-[rgba(196,154,60,0.08)] overflow-hidden">
        {categories.filter(l1 => matchesSearch(l1.name) || l1.children?.some(l2 => matchesSearch(l2.name) || l2.children?.some(l3 => matchesSearch(l3.name)))).map(l1 => (
          <div key={l1.id} className="border-b border-[rgba(196,154,60,0.06)] last:border-0">
            {/* Level 1 Row */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white border-l-[3px] border-l-[#5B1A3A] hover:bg-[#FAF7F8] transition-colors group">
              <button onClick={() => toggle(l1.id)} className="text-[#C49A3C] shrink-0">
                {expanded[l1.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <span className={`flex-1 text-sm font-semibold ${l1.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{l1.name}</span>
              {l1.nameHindi && <span className="text-xs text-gray-400 hidden sm:block">{l1.nameHindi}</span>}
              <span className="text-xs text-gray-400 hidden md:block">{l1.children?.length || 0} subcategories</span>
              <span className="px-2 py-0.5 bg-[#C49A3C]/10 text-[#C49A3C] text-xs font-medium rounded-full">{l1.productCount} products</span>
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${l1.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{l1.active ? 'Active' : 'Inactive'}</span>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(l1, 1)} className="px-2.5 py-1 border border-[#5B1A3A] text-[#5B1A3A] text-xs rounded-lg hover:bg-[#5B1A3A]/5">
                  <Pencil size={11} className="inline mr-1" />Edit
                </button>
                <button onClick={() => openAdd(2, l1.id)} className="px-2.5 py-1 border border-[#C49A3C] text-[#C49A3C] text-xs rounded-lg hover:bg-[#C49A3C]/5">
                  <Plus size={11} className="inline mr-1" />Subcategory
                </button>
                <button onClick={() => toggleActive(l1.id, 1)} className={`text-xs ${l1.active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                  {l1.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>

            {/* Level 2 Rows */}
            {expanded[l1.id] && l1.children?.filter(l2 => matchesSearch(l2.name) || l2.children?.some(l3 => matchesSearch(l3.name))).map(l2 => (
              <div key={l2.id}>
                <div className="flex items-center gap-2 ml-5 mr-0 px-3.5 py-2.5 bg-[#FAF7F8] border-l-[3px] border-l-[#C49A3C] hover:bg-[#F5F0F2] transition-colors group">
                  <button onClick={() => toggle(l2.id)} className="text-[#C49A3C] shrink-0">
                    {expanded[l2.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <span className={`flex-1 text-sm ${l2.active ? 'text-gray-700 font-medium' : 'text-gray-400 line-through'}`}>{l2.name}</span>
                  {l2.nameHindi && <span className="text-xs text-gray-400 hidden sm:block">{l2.nameHindi}</span>}
                  <span className="text-xs text-gray-400 hidden md:block">{l2.children?.length || 0} types</span>
                  <span className="px-2 py-0.5 bg-[#C49A3C]/10 text-[#C49A3C] text-xs font-medium rounded-full">{l2.productCount} products</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${l2.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{l2.active ? 'Active' : 'Inactive'}</span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(l2, 2)} className="px-2.5 py-1 border border-[#5B1A3A] text-[#5B1A3A] text-xs rounded-lg hover:bg-[#5B1A3A]/5">
                      <Pencil size={11} className="inline mr-1" />Edit
                    </button>
                    <button onClick={() => openAdd(3, l2.id)} className="px-2.5 py-1 border border-[#C49A3C] text-[#C49A3C] text-xs rounded-lg hover:bg-[#C49A3C]/5">
                      <Plus size={11} className="inline mr-1" />Type
                    </button>
                    <button onClick={() => toggleActive(l2.id, 2)} className={`text-xs ${l2.active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                      {l2.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>

                {/* Level 3 Rows */}
                {expanded[l2.id] && l2.children?.filter(l3 => matchesSearch(l3.name)).map(l3 => (
                  <div key={l3.id} className="flex items-center gap-2 ml-10 mr-0 px-3.5 py-2 bg-white border-l border-l-gray-200 hover:bg-[#FAF7F8] transition-colors group">
                    <span className="w-2 h-2 rounded-full bg-[#C49A3C]/40 shrink-0 ml-1" />
                    <span className={`flex-1 text-xs ${l3.active ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{l3.name}</span>
                    {l3.nameHindi && <span className="text-xs text-gray-400 hidden sm:block">{l3.nameHindi}</span>}
                    <span className="px-2 py-0.5 bg-[#C49A3C]/10 text-[#C49A3C] text-xs font-medium rounded-full">{l3.productCount} products</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${l3.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{l3.active ? 'Active' : 'Inactive'}</span>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(l3, 3)} className="px-2.5 py-1 border border-[#5B1A3A] text-[#5B1A3A] text-xs rounded-lg hover:bg-[#5B1A3A]/5">
                        <Pencil size={11} className="inline mr-1" />Edit
                      </button>
                      <button onClick={() => toggleActive(l3.id, 3)} className={`text-xs ${l3.active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                        {l3.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[18px] shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  {modal.mode === 'add' ? 'Add' : 'Edit'} Level {modal.level} Category
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {modal.level === 1 ? 'Top-level category' : modal.level === 2 ? 'Subcategory' : 'Product type'}
                </p>
              </div>
              <button onClick={() => setModal({ open: false, mode: 'add', level: 1 })} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Name (English) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))}
                  placeholder="e.g. Silk Sarees"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Name (Hindi)</label>
                <input
                  type="text"
                  value={form.nameHindi}
                  onChange={e => setForm(p => ({ ...p, nameHindi: e.target.value }))}
                  placeholder="e.g. सिल्क साड़ियाँ"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Slug (auto-generated)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(p => ({ ...p, slug: slugify(e.target.value) }))}
                  placeholder="silk-sarees"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/30 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Display Order</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  min={1}
                  onChange={e => setForm(p => ({ ...p, displayOrder: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/30"
                />
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-medium text-gray-700">Active</span>
                <button
                  onClick={() => setForm(p => ({ ...p, active: !p.active }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${form.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                >
                  {form.active ? <><Check size={12} /> Active</> : 'Inactive'}
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal({ open: false, mode: 'add', level: 1 })}
                className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#5B1A3A] to-[#7A2350] text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {modal.mode === 'add' ? 'Add Category' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
