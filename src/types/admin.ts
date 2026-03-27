// ─── Admin Dashboard Types ──────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export interface StatCardData {
  title: string;
  value: string | number;
  change?: number;       // percentage change
  icon: string;
  color: string;
}

export interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_mobile: string;
  pincode: string;
  district: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  payment_mode: 'cod' | 'online' | 'upi';
  created_at: string;
  updated_at: string;
  delivery_partner?: string;
  distance_km?: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  image?: string;
}

export interface CatalogueProduct {
  id: string;
  product_id: string;
  name: string;
  name_hi?: string;
  category: string;
  sub_category?: string;
  price: number;
  original_price?: number;
  main_image?: string;
  images?: string[];
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  seller_name?: string;
  created_at: string;
  stock?: number;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  amount: number;
  commission: number;       // always 0 for this platform
  seller_payout: number;
  status: 'pending' | 'settled' | 'failed';
  payment_mode: string;
  created_at: string;
  settled_at?: string;
  seller_name?: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: 'order' | 'payment' | 'product' | 'delivery' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_mobile?: string;
}

export interface DeliveryZone {
  pincode: string;
  district: string;
  state: string;
  distance_km: number;
  total_orders: number;
  is_serviceable: boolean;
}

export interface GrowthSuggestion {
  id: string;
  title: string;
  title_hi: string;
  description: string;
  description_hi: string;
  type: 'tip' | 'alert' | 'boost';
  priority: 'low' | 'medium' | 'high';
  action_label?: string;
  action_label_hi?: string;
}

export interface WhatsAppNotification {
  id: string;
  type: 'order' | 'qc' | 'payment' | 'alert';
  message: string;
  recipient: string;
  status: 'sent' | 'pending' | 'failed';
  created_at: string;
}

export interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalProducts: number;
  activeProducts: number;
  pendingApprovals: number;
  totalSellers: number;
  activeSellers: number;
  totalCustomers: number;
  avgOrderValue: number;
  returnRate: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface CategorySplit {
  name: string;
  value: number;
  color: string;
}

export interface NDRRecord {
  id: string;
  order_id: string;
  customer_name: string;
  mobile: string;
  pincode: string;
  district: string;
  failure_reason: string;
  failure_reason_hi: string;
  attempt_count: number;
  last_attempt: string;
  status: string;
  payment_mode: string;
  total: number;
  cod_verified: boolean | null;
}

export type AdminPage =
  | 'dashboard'
  | 'orders'
  | 'catalogue'
  | 'payments'
  | 'analytics'
  | 'support'
  | 'growth'
  | 'settings'
  | 'ndr'
  | 'users'
  | 'returns'
  | 'sellers';
