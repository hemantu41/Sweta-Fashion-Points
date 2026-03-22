// ─── Centralized Mock Data — swap for real DB later ─────────────────────────

import type {
  DashboardStats, RevenueDataPoint, Order, CatalogueProduct,
  PaymentRecord, SupportTicket, WhatsAppNotification, GrowthSuggestion,
} from '@/types/admin';

// ─── Dashboard Stats ────────────────────────────────────────────────────────

export const MOCK_STATS: DashboardStats = {
  totalOrders: 1247,
  todayOrders: 18,
  totalRevenue: 847500,
  todayRevenue: 12450,
  totalProducts: 342,
  activeProducts: 289,
  pendingApprovals: 7,
  totalSellers: 24,
  activeSellers: 19,
  totalCustomers: 856,
  avgOrderValue: 679,
  returnRate: 3.2,
};

// ─── Revenue Chart ──────────────────────────────────────────────────────────

export const MOCK_REVENUE: RevenueDataPoint[] = [
  { date: 'Mon', revenue: 12400, orders: 15 },
  { date: 'Tue', revenue: 18200, orders: 22 },
  { date: 'Wed', revenue: 15600, orders: 19 },
  { date: 'Thu', revenue: 21300, orders: 28 },
  { date: 'Fri', revenue: 19800, orders: 25 },
  { date: 'Sat', revenue: 28500, orders: 35 },
  { date: 'Sun', revenue: 16700, orders: 21 },
];

export const MOCK_REVENUE_MONTHLY: RevenueDataPoint[] = [
  { date: 'Week 1', revenue: 68400, orders: 82 },
  { date: 'Week 2', revenue: 75200, orders: 94 },
  { date: 'Week 3', revenue: 82600, orders: 108 },
  { date: 'Week 4', revenue: 91300, orders: 121 },
];

// ─── Orders ─────────────────────────────────────────────────────────────────

export const MOCK_ORDERS: Order[] = [
  { id: '1', order_id: 'IFP-1042', customer_name: 'Priya Kumari', customer_mobile: '+91 82941xxxxx', pincode: '823001', district: 'Gaya', items: [{ product_id: 'p1', name: 'Banarasi Silk Saree', quantity: 1, price: 2450, size: 'Free' }], total: 2450, status: 'confirmed', payment_mode: 'cod', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), distance_km: 0 },
  { id: '2', order_id: 'IFP-1041', customer_name: 'Rahul Singh', customer_mobile: '+91 73215xxxxx', pincode: '824232', district: 'Bodhgaya', items: [{ product_id: 'p2', name: 'Cotton Kurta Set', quantity: 2, price: 945, size: 'L' }], total: 1890, status: 'shipped', payment_mode: 'upi', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString(), distance_km: 15 },
  { id: '3', order_id: 'IFP-1040', customer_name: 'Sunita Devi', customer_mobile: '+91 96342xxxxx', pincode: '824233', district: 'Sherghati', items: [{ product_id: 'p3', name: 'Designer Lehenga', quantity: 1, price: 3200, size: 'M' }], total: 3200, status: 'pending', payment_mode: 'cod', created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date().toISOString(), distance_km: 35 },
  { id: '4', order_id: 'IFP-1039', customer_name: 'Amit Kumar', customer_mobile: '+91 88214xxxxx', pincode: '805121', district: 'Nawada', items: [{ product_id: 'p4', name: 'Kids Party Dress', quantity: 1, price: 1250, size: '8Y' }], total: 1250, status: 'delivered', payment_mode: 'online', created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date().toISOString(), distance_km: 45 },
  { id: '5', order_id: 'IFP-1038', customer_name: 'Kavita Sharma', customer_mobile: '+91 77825xxxxx', pincode: '824219', district: 'Amas', items: [{ product_id: 'p5', name: 'Printed Palazzo Set', quantity: 1, price: 4100, size: 'XL' }], total: 4100, status: 'out_for_delivery', payment_mode: 'upi', created_at: new Date(Date.now() - 345600000).toISOString(), updated_at: new Date().toISOString(), distance_km: 12 },
  { id: '6', order_id: 'IFP-1037', customer_name: 'Ravi Prasad', customer_mobile: '+91 99123xxxxx', pincode: '824236', district: 'Paraiya', items: [{ product_id: 'p6', name: 'Embroidered Dupatta', quantity: 3, price: 399, size: 'Free' }], total: 1197, status: 'pending', payment_mode: 'cod', created_at: new Date(Date.now() - 432000000).toISOString(), updated_at: new Date().toISOString(), distance_km: 28 },
  { id: '7', order_id: 'IFP-1036', customer_name: 'Meena Devi', customer_mobile: '+91 81234xxxxx', pincode: '824125', district: 'Aurangabad', items: [{ product_id: 'p1', name: 'Banarasi Silk Saree', quantity: 1, price: 2499, size: 'Free' }], total: 2499, status: 'returned', payment_mode: 'online', created_at: new Date(Date.now() - 518400000).toISOString(), updated_at: new Date().toISOString(), distance_km: 65 },
  { id: '8', order_id: 'IFP-1035', customer_name: 'Sanjay Verma', customer_mobile: '+91 70456xxxxx', pincode: '824237', district: 'Wazirganj', items: [{ product_id: 'p2', name: 'Cotton Kurta Set', quantity: 1, price: 899, size: 'M' }], total: 899, status: 'cancelled', payment_mode: 'cod', created_at: new Date(Date.now() - 604800000).toISOString(), updated_at: new Date().toISOString(), distance_km: 22 },
];

// ─── Catalogue ──────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS: CatalogueProduct[] = [
  { id: 'p1', product_id: 'SKU-001', name: 'Banarasi Silk Saree', name_hi: 'बनारसी सिल्क साड़ी', category: 'Sarees', sub_category: 'Silk', price: 2499, original_price: 3499, main_image: '/placeholder-saree.jpg', approval_status: 'approved', is_active: true, seller_name: 'Silk House Gaya', created_at: new Date().toISOString(), stock: 12 },
  { id: 'p2', product_id: 'SKU-002', name: 'Cotton Kurta Set', name_hi: 'कॉटन कुर्ता सेट', category: "Men's Wear", price: 899, original_price: 1299, approval_status: 'approved', is_active: true, seller_name: 'Kumar Textiles', created_at: new Date().toISOString(), stock: 34 },
  { id: 'p3', product_id: 'SKU-003', name: 'Designer Lehenga', name_hi: 'डिज़ाइनर लहंगा', category: "Women's Wear", price: 4599, original_price: 5999, approval_status: 'approved', is_active: true, seller_name: 'Fashion Hub', created_at: new Date().toISOString(), stock: 5 },
  { id: 'p4', product_id: 'SKU-004', name: 'Kids Party Dress', name_hi: 'किड्स पार्टी ड्रेस', category: "Kids' Wear", price: 649, original_price: 899, approval_status: 'approved', is_active: true, seller_name: 'Little Stars', created_at: new Date().toISOString(), stock: 22 },
  { id: 'p5', product_id: 'SKU-005', name: 'Printed Palazzo Set', name_hi: 'प्रिंटेड पलाज़ो सेट', category: "Women's Wear", price: 799, original_price: 1199, approval_status: 'pending', is_active: false, seller_name: 'Ethnic Corner', created_at: new Date().toISOString(), stock: 0 },
  { id: 'p6', product_id: 'SKU-006', name: 'Embroidered Dupatta', name_hi: 'कढ़ाई वाला दुपट्टा', category: 'Accessories', price: 399, original_price: 599, approval_status: 'rejected', is_active: false, seller_name: 'Craft Corner', created_at: new Date().toISOString(), stock: 8 },
  { id: 'p7', product_id: 'SKU-007', name: 'Formal Shirt', name_hi: 'फॉर्मल शर्ट', category: "Men's Wear", price: 699, original_price: 999, approval_status: 'approved', is_active: true, seller_name: 'Kumar Textiles', created_at: new Date().toISOString(), stock: 45 },
  { id: 'p8', product_id: 'SKU-008', name: 'Chanderi Saree', name_hi: 'चंदेरी साड़ी', category: 'Sarees', price: 1899, original_price: 2499, approval_status: 'approved', is_active: true, seller_name: 'Silk House Gaya', created_at: new Date().toISOString(), stock: 7 },
];

// ─── Payments ───────────────────────────────────────────────────────────────

export const MOCK_PAYMENTS: PaymentRecord[] = [
  { id: 'pay1', order_id: 'IFP-1042', amount: 2450, commission: 0, seller_payout: 2450, status: 'settled', payment_mode: 'cod', created_at: new Date().toISOString(), settled_at: new Date().toISOString(), seller_name: 'Silk House' },
  { id: 'pay2', order_id: 'IFP-1041', amount: 1890, commission: 0, seller_payout: 1890, status: 'settled', payment_mode: 'upi', created_at: new Date(Date.now() - 86400000).toISOString(), settled_at: new Date().toISOString(), seller_name: 'Kumar Textiles' },
  { id: 'pay3', order_id: 'IFP-1040', amount: 3200, commission: 0, seller_payout: 3200, status: 'pending', payment_mode: 'cod', created_at: new Date(Date.now() - 172800000).toISOString(), seller_name: 'Fashion Hub' },
  { id: 'pay4', order_id: 'IFP-1039', amount: 1250, commission: 0, seller_payout: 1250, status: 'settled', payment_mode: 'online', created_at: new Date(Date.now() - 259200000).toISOString(), settled_at: new Date(Date.now() - 86400000).toISOString(), seller_name: 'Little Stars' },
  { id: 'pay5', order_id: 'IFP-1038', amount: 4100, commission: 0, seller_payout: 4100, status: 'pending', payment_mode: 'upi', created_at: new Date(Date.now() - 345600000).toISOString(), seller_name: 'Ethnic Corner' },
];

// ─── Support Tickets ────────────────────────────────────────────────────────

export const MOCK_TICKETS: SupportTicket[] = [
  { id: 'TKT-001', subject: 'Order not delivered — 3 days late', message: 'Customer says order IFP-1035 has not arrived', category: 'delivery', status: 'open', priority: 'high', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_name: 'Sanjay Verma', user_mobile: '+91 70456xxxxx' },
  { id: 'TKT-002', subject: 'Payment not received for COD order', message: 'Delivery partner collected cash but it was not settled', category: 'payment', status: 'in_progress', priority: 'medium', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString(), user_name: 'Silk House Gaya' },
  { id: 'TKT-003', subject: 'Product quality complaint', message: 'Saree color was different from the listing image', category: 'product', status: 'resolved', priority: 'low', created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString(), user_name: 'Meena Devi' },
  { id: 'TKT-004', subject: 'Listing removed without reason', message: 'My product was delisted after QC without any feedback', category: 'product', status: 'open', priority: 'medium', created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date(Date.now() - 172800000).toISOString(), user_name: 'Craft Corner' },
];

// ─── WhatsApp Logs ──────────────────────────────────────────────────────────

export const MOCK_WA_LOGS: WhatsAppNotification[] = [
  { id: 'wa1', type: 'order', message: 'Order #IFP-1042 confirmed — delivery by tomorrow', recipient: '+91 82941xxxxx', status: 'sent', created_at: new Date().toISOString() },
  { id: 'wa2', type: 'payment', message: 'Payment of ₹1,890 received for order #IFP-1041', recipient: '+91 73215xxxxx', status: 'sent', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'wa3', type: 'qc', message: 'Your product "Banarasi Silk Saree" has been approved', recipient: '+91 96342xxxxx', status: 'pending', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'wa4', type: 'alert', message: 'Delivery delayed for order #IFP-1035 — partner reassigned', recipient: '+91 88214xxxxx', status: 'failed', created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 'wa5', type: 'order', message: 'Order #IFP-1038 out for delivery — arriving in 2 hours', recipient: '+91 77825xxxxx', status: 'sent', created_at: new Date(Date.now() - 14400000).toISOString() },
];

// ─── Analytics (matches /api/admin/analytics shape) ─────────────────────────

export const MOCK_ANALYTICS = {
  revenue: { today: 4500, week: 28000, month: 112000 },
  orders: { pending: 12, shipped: 34, delivered: 89, returned: 5 },
  topCategories: [
    { name: 'Sarees', units: 45, revenue: 56000 },
    { name: "Men's Wear", units: 38, revenue: 41000 },
    { name: "Kids' Wear", units: 22, revenue: 18000 },
    { name: "Women's Wear", units: 31, revenue: 48000 },
    { name: 'Footwear', units: 12, revenue: 9600 },
  ],
  deliveryZones: [
    { pincode: '823001', district: 'Gaya City', orders: 34, avgDeliveryHrs: 4 },
    { pincode: '824219', district: 'Amas', orders: 28, avgDeliveryHrs: 6 },
    { pincode: '824232', district: 'Bodhgaya', orders: 22, avgDeliveryHrs: 8 },
    { pincode: '824125', district: 'Aurangabad', orders: 12, avgDeliveryHrs: 18 },
    { pincode: '805121', district: 'Nawada', orders: 9, avgDeliveryHrs: 22 },
    { pincode: '824233', district: 'Sherghati', orders: 15, avgDeliveryHrs: 14 },
  ],
  returnReasons: [
    { reason: 'Wrong size', count: 12 },
    { reason: 'Color mismatch', count: 8 },
    { reason: 'Damaged in transit', count: 5 },
    { reason: 'Not as described', count: 3 },
    { reason: 'Changed mind', count: 7 },
  ],
};

// ─── Growth Suggestions ─────────────────────────────────────────────────────

export const MOCK_GROWTH_SUGGESTIONS: GrowthSuggestion[] = [
  {
    id: '1',
    title: 'Add 5 more products to unlock Fast Delivery badge',
    title_hi: '5 और प्रोडक्ट जोड़ें और फास्ट डिलीवरी बैज पाएं',
    description: 'Sellers with 50+ active products get the Fast Delivery badge — you have 45',
    description_hi: '50+ सक्रिय प्रोडक्ट वाले विक्रेताओं को फास्ट डिलीवरी बैज मिलता है — आपके पास 45 हैं',
    type: 'boost',
    priority: 'high',
    action_label: 'Add Products',
    action_label_hi: 'प्रोडक्ट जोड़ें',
  },
  {
    id: '2',
    title: '3 pincodes near you have 0 sellers — expand coverage',
    title_hi: 'आपके पास 3 पिनकोड में 0 विक्रेता हैं — कवरेज बढ़ाएं',
    description: 'Tekari, Paraiya, and Wazirganj have demand but no sellers yet',
    description_hi: 'टेकारी, परैया और वज़ीरगंज में मांग है लेकिन अभी तक कोई विक्रेता नहीं',
    type: 'tip',
    priority: 'high',
    action_label: 'View Zones',
    action_label_hi: 'ज़ोन देखें',
  },
  {
    id: '3',
    title: 'Festival season stock alert',
    title_hi: 'त्योहारी सीज़न स्टॉक अलर्ट',
    description: 'Chhath Puja approaching — ensure sarees and ethnic wear are stocked',
    description_hi: 'छठ पूजा नज़दीक है — साड़ियां और एथनिक वियर का स्टॉक सुनिश्चित करें',
    type: 'alert',
    priority: 'high',
    action_label: 'Check Stock',
    action_label_hi: 'स्टॉक चेक करें',
  },
  {
    id: '4',
    title: 'Enable WhatsApp order updates',
    title_hi: 'व्हाट्सएप ऑर्डर अपडेट सक्रिय करें',
    description: '85% of customers prefer WhatsApp over SMS — enable it in Settings',
    description_hi: '85% ग्राहक SMS से ज़्यादा व्हाट्सएप पसंद करते हैं — सेटिंग्स में सक्रिय करें',
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
