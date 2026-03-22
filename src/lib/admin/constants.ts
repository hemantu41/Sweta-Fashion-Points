// ─── Admin Dashboard Constants ──────────────────────────────────────────────

import type { DeliveryZone, GrowthSuggestion, CategorySplit } from '@/types/admin';

// Delivery zones around Gaya, Bihar (~100 km radius)
export const DELIVERY_ZONES: DeliveryZone[] = [
  { pincode: '823001', district: 'Gaya', state: 'Bihar', distance_km: 0, total_orders: 245, is_serviceable: true },
  { pincode: '824219', district: 'Amas', state: 'Bihar', distance_km: 12, total_orders: 189, is_serviceable: true },
  { pincode: '824232', district: 'Bodhgaya', state: 'Bihar', distance_km: 15, total_orders: 156, is_serviceable: true },
  { pincode: '824233', district: 'Sherghati', state: 'Bihar', distance_km: 35, total_orders: 87, is_serviceable: true },
  { pincode: '805121', district: 'Nawada', state: 'Bihar', distance_km: 45, total_orders: 62, is_serviceable: true },
  { pincode: '824234', district: 'Tekari', state: 'Bihar', distance_km: 50, total_orders: 43, is_serviceable: true },
  { pincode: '824125', district: 'Aurangabad', state: 'Bihar', distance_km: 65, total_orders: 31, is_serviceable: true },
  { pincode: '824236', district: 'Paraiya', state: 'Bihar', distance_km: 28, total_orders: 54, is_serviceable: true },
  { pincode: '824237', district: 'Wazirganj', state: 'Bihar', distance_km: 22, total_orders: 78, is_serviceable: true },
  { pincode: '811307', district: 'Jahanabad', state: 'Bihar', distance_km: 72, total_orders: 19, is_serviceable: true },
  { pincode: '803101', district: 'Nalanda', state: 'Bihar', distance_km: 90, total_orders: 12, is_serviceable: true },
  { pincode: '800001', district: 'Patna', state: 'Bihar', distance_km: 105, total_orders: 5, is_serviceable: false },
];

export const CATEGORIES = [
  'Sarees', 'Men\'s Wear', 'Women\'s Wear', 'Kids\' Wear',
  'Footwear', 'Makeup', 'Ethnic Wear', 'Accessories',
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  'Sarees': '#059669',
  "Men's Wear": '#2563eb',
  "Women's Wear": '#db2777',
  "Kids' Wear": '#f59e0b',
  'Footwear': '#059669',
  'Makeup': '#8b5cf6',
  'Ethnic Wear': '#C9A962',
  'Accessories': '#64748b',
};

export const DEFAULT_CATEGORY_SPLIT: CategorySplit[] = [
  { name: 'Sarees', value: 35, color: '#059669' },
  { name: "Women's Wear", value: 25, color: '#db2777' },
  { name: "Men's Wear", value: 20, color: '#2563eb' },
  { name: "Kids' Wear", value: 10, color: '#f59e0b' },
  { name: 'Footwear', value: 5, color: '#059669' },
  { name: 'Other', value: 5, color: '#64748b' },
];

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#6366f1',
  out_for_delivery: '#0ea5e9',
  delivered: '#10b981',
  cancelled: '#ef4444',
  returned: '#f97316',
};

export const GROWTH_SUGGESTIONS: GrowthSuggestion[] = [
  {
    id: '1',
    title: 'Add product descriptions in Hindi',
    title_hi: 'हिंदी में प्रोडक्ट विवरण जोड़ें',
    description: 'Products with Hindi descriptions get 40% more views in your region',
    description_hi: 'हिंदी विवरण वाले प्रोडक्ट को आपके क्षेत्र में 40% अधिक व्यूज मिलते हैं',
    type: 'tip',
    priority: 'high',
    action_label: 'Update Catalogue',
    action_label_hi: 'कैटलॉग अपडेट करें',
  },
  {
    id: '2',
    title: 'Festival season stock alert',
    title_hi: 'त्योहारी सीज़न स्टॉक अलर्ट',
    description: 'Chhath Puja is approaching — ensure sarees and ethnic wear are well-stocked',
    description_hi: 'छठ पूजा नज़दीक है — साड़ियां और एथनिक वियर का स्टॉक सुनिश्चित करें',
    type: 'alert',
    priority: 'high',
    action_label: 'Check Stock',
    action_label_hi: 'स्टॉक चेक करें',
  },
  {
    id: '3',
    title: 'Expand delivery to Patna',
    title_hi: 'पटना तक डिलीवरी बढ़ाएं',
    description: '5 orders from Patna last week — consider expanding your delivery radius',
    description_hi: 'पिछले सप्ताह पटना से 5 ऑर्डर — डिलीवरी दायरा बढ़ाने पर विचार करें',
    type: 'boost',
    priority: 'medium',
    action_label: 'View Zone',
    action_label_hi: 'ज़ोन देखें',
  },
  {
    id: '4',
    title: 'Enable WhatsApp order updates',
    title_hi: 'व्हाट्सएप ऑर्डर अपडेट सक्रिय करें',
    description: '85% of your customers prefer WhatsApp updates over SMS',
    description_hi: '85% ग्राहक SMS की तुलना में व्हाट्सएप अपडेट पसंद करते हैं',
    type: 'tip',
    priority: 'medium',
    action_label: 'Setup WhatsApp',
    action_label_hi: 'व्हाट्सएप सेटअप करें',
  },
  {
    id: '5',
    title: 'Low stock: Banarasi Sarees',
    title_hi: 'कम स्टॉक: बनारसी साड़ियां',
    description: 'Only 3 items left — this is your top-selling category',
    description_hi: 'केवल 3 आइटम बचे — यह आपकी सबसे ज़्यादा बिकने वाली श्रेणी है',
    type: 'alert',
    priority: 'high',
    action_label: 'Restock',
    action_label_hi: 'रीस्टॉक करें',
  },
];

// Format number in Indian number system
export function formatINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-IN');
}

// Distance badge color
export function getDistanceBadge(km: number): { label: string; color: string; bg: string } {
  if (km <= 20) return { label: 'Near', color: '#059669', bg: '#ecfdf5' };
  if (km <= 50) return { label: 'Mid', color: '#d97706', bg: '#fffbeb' };
  if (km <= 100) return { label: 'Far', color: '#dc2626', bg: '#fef2f2' };
  return { label: 'Out of range', color: '#6b7280', bg: '#f3f4f6' };
}
