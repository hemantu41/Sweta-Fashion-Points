# 🚚 Delivery Partner System - Navigation Guide

Complete guide to accessing all delivery partner and order management features.

---

## 📍 **Quick Access URLs**

### **1. Admin Order Management** ⭐
**URL:** http://localhost:3000/admin/orders

**Access Via Navbar:**
1. Login as admin user
2. Click your profile avatar (top right)
3. Click "**Manage Orders & Delivery**" in the dropdown

**Features:**
- ✅ View all orders (system-wide, not filtered by user)
- ✅ Filter by payment status (all, captured, pending, failed)
- ✅ Filter by delivery status (all, pending, assigned, in_transit, delivered)
- ✅ Search orders by order number
- ✅ **Manual Assignment**: Click "Assign Partner" → Select delivery partner from dropdown
- ✅ **Auto-Assignment**: Click "Auto-Assign" for intelligent partner selection
- ✅ View order details (items, address, amount)
- ✅ Track delivery progress with status badges

**Dashboard Stats:**
- Total orders
- Pending assignment
- In transit
- Delivered

---

### **2. Delivery Partner Dashboard** ⭐
**URL:** http://localhost:3000/delivery/dashboard?partnerId=PARTNER_UUID

**How to Get Partner ID:**
You need to create a delivery partner first using the database or an admin API.

**Example Partner Creation (SQL):**
```sql
INSERT INTO spf_delivery_partners (
  name, mobile, email, vehicle_type, status, availability_status, service_pincodes
) VALUES (
  'Rajesh Kumar', '9876543210', 'rajesh@example.com', 'bike', 'active', 'available', '["824219", "823001"]'
) RETURNING id;
```

**Features:**
- ✅ View all assigned orders
- ✅ Update delivery status (accepted → picked_up → in_transit → out_for_delivery → delivered)
- ✅ Manage availability: Available / Busy / Offline
- ✅ Performance dashboard (total deliveries, delivered today, success rate)
- ✅ Filter orders by status
- ✅ Call customer directly from dashboard
- ✅ View delivery address with map-friendly format

**Status Flow:**
1. `assigned` → Partner receives order
2. `accepted` → Partner confirms they'll deliver
3. `picked_up` → Partner picks up from warehouse
4. `in_transit` → Order on the way
5. `out_for_delivery` → Near customer location
6. `delivered` → Successfully delivered

---

### **3. Customer Order Tracking**
**URL:** http://localhost:3000/orders/ORDER_ID/track

**Access Via:**
1. Go to: http://localhost:3000/orders
2. Click "**Track Order**" button on any order

**Features:**
- ✅ Order timeline visualization (Order Placed → Confirmed → Assigned → Delivered)
- ✅ Order number and tracking number display
- ✅ Estimated/actual delivery date
- ✅ Delivery partner info (name, mobile, vehicle)
- ✅ Delivery address details
- ✅ Support contact information
- ✅ Real-time status updates

**What Customers See:**
- Green checkmarks for completed steps
- Gray circles for pending steps
- Delivery partner contact (only after order is accepted)
- Timeline with timestamps

---

### **4. Test Tracking Page** (For Debugging)
**URL:** http://localhost:3000/test-tracking

**Purpose:** Test the tracking API with any order ID

**How to Use:**
1. Go to Orders page and copy any order UUID
2. Visit test-tracking page
3. Paste order ID
4. Click "Test Tracking API"
5. View response and console logs

---

## 🔑 **How to Create Admin User**

If you don't have admin access yet:

### **Option 1: Update Existing User**
```sql
-- Make your current user an admin
UPDATE spf_users
SET is_admin = true
WHERE email = 'your-email@example.com';
```

### **Option 2: Create New Admin User**
```sql
-- Create a new admin user
INSERT INTO spf_users (name, email, phone, password_hash, is_admin, user_type)
VALUES (
  'Admin User',
  'admin@swetafashion.com',
  '9876543210',
  -- Generate password hash using bcrypt (password: admin123)
  '$2a$10$EXAMPLE_HASH_HERE',
  true,
  'admin'
);
```

**Or use the signup page with admin flag:**
1. Sign up normally at /signup
2. Run SQL to make user admin:
```sql
UPDATE spf_users SET is_admin = true WHERE email = 'your-email@example.com';
```

---

## 🚚 **How to Create Delivery Partners**

### **Method 1: Direct SQL Insert**
```sql
INSERT INTO spf_delivery_partners (
  name,
  mobile,
  email,
  vehicle_type,
  vehicle_number,
  status,
  availability_status,
  service_pincodes
) VALUES
(
  'Ramesh Sharma',
  '9876543210',
  'ramesh@example.com',
  'bike',
  'BR01AB1234',
  'active',
  'available',
  '["824219", "823001", "824101"]'::jsonb
),
(
  'Suresh Yadav',
  '9876543211',
  'suresh@example.com',
  'car',
  'BR02CD5678',
  'active',
  'available',
  '["824219", "824201"]'::jsonb
);
```

### **Method 2: Use Delivery Partners API** (Future Feature)
Coming soon: `/api/delivery-partners` POST endpoint for admin to add partners via UI.

---

## 📊 **Testing the Complete Flow**

### **Complete Order → Delivery Flow:**

1. **Place an Order (Customer)**
   - Go to http://localhost:3000
   - Add products to cart
   - Complete checkout with payment
   - Note the order ID

2. **Assign Delivery Partner (Admin)**
   - Login as admin
   - Go to http://localhost:3000/admin/orders
   - Find the order
   - Click "Auto-Assign" (or manually select partner)
   - Verify partner is assigned

3. **Update Delivery Status (Partner)**
   - Get partner ID from database:
     ```sql
     SELECT id, name FROM spf_delivery_partners WHERE status = 'active';
     ```
   - Visit: http://localhost:3000/delivery/dashboard?partnerId=PARTNER_ID
   - Find the assigned order
   - Click "Mark as accepted"
   - Progress through: picked_up → in_transit → out_for_delivery → delivered

4. **Track Order (Customer)**
   - Go to http://localhost:3000/orders
   - Click "Track Order"
   - See timeline updated with each status change
   - View delivery partner contact info

---

## 🔔 **Notification System**

When delivery status changes, customers receive notifications via:

### **SMS (MSG91):**
- Order assigned
- Out for delivery
- Delivered

### **Email (Resend):**
- Order assigned with partner details

### **WhatsApp (Gupshup):**
- Out for delivery
- Delivered

**Configuration Required:**
Add these to `.env.local`:
```env
MSG91_AUTH_KEY=your_msg91_key
MSG91_SENDER_ID=SWEFPT
RESEND_API_KEY=your_resend_key
GUPSHUP_API_KEY=your_gupshup_key
GUPSHUP_APP_NAME=SwetaFashion
```

---

## 📈 **Analytics & Earnings**

### **Partner Analytics API:**
```
GET /api/delivery-partners/{partnerId}/analytics?range=30
```

**Returns:**
- Success rate
- Average delivery time
- Total revenue earned
- On-time delivery rate
- 7-day delivery trends
- Status distribution
- Rating distribution

### **Partner Earnings API:**
```
GET /api/delivery-partners/{partnerId}/earnings?status=pending
```

**Features:**
- Auto-calculated on delivery completion
- Base charge: ₹50
- Per km: ₹5
- Bonuses for ratings, on-time delivery
- Penalties for failures, delays
- Payment batch management

---

## 🛠️ **Troubleshooting**

### **"Manage Orders" link not showing:**
1. Check if user is admin:
   ```sql
   SELECT is_admin, user_type FROM spf_users WHERE email = 'your-email';
   ```
2. If false, make admin:
   ```sql
   UPDATE spf_users SET is_admin = true WHERE email = 'your-email';
   ```
3. Logout and login again

### **No delivery partners available:**
1. Create partners using SQL above
2. Check partner status:
   ```sql
   SELECT name, status, availability_status FROM spf_delivery_partners;
   ```
3. Make sure status is 'active' and availability is 'available'

### **Auto-assign not working:**
1. Check if order payment is captured:
   ```sql
   SELECT order_number, status FROM spf_payment_orders WHERE id = 'order-id';
   ```
2. Ensure delivery partners exist and are active
3. Check if order has delivery address with pincode

### **Tracking page shows loading forever:**
1. Clear browser cache (Ctrl+Shift+R)
2. Check browser console (F12) for errors
3. Verify dev server is running
4. Test API directly: http://localhost:3000/api/orders/ORDER_ID/tracking

---

## 📚 **Related Documentation**

- **System Design:** `DELIVERY_PARTNER_SYSTEM.md`
- **Database Schema:** `database/schema-delivery-partners.sql`
- **Earnings Schema:** `database/schema-partner-earnings.sql`
- **Notification Library:** `src/lib/delivery-notifications.ts`
- **Tracking Fix:** `TRACKING_FIX_README.md`

---

## 🎯 **Quick Command Reference**

### **Check Current Admin Status:**
```sql
SELECT id, name, email, is_admin FROM spf_users WHERE email = 'your-email';
```

### **View All Orders:**
```sql
SELECT order_number, status, delivery_status, created_at
FROM spf_payment_orders
ORDER BY created_at DESC LIMIT 10;
```

### **View All Delivery Partners:**
```sql
SELECT id, name, mobile, vehicle_type, status, availability_status
FROM spf_delivery_partners;
```

### **View Assigned Orders:**
```sql
SELECT
  po.order_number,
  od.status as delivery_status,
  dp.name as partner_name
FROM spf_order_deliveries od
JOIN spf_payment_orders po ON od.order_id = po.id
JOIN spf_delivery_partners dp ON od.delivery_partner_id = dp.id
ORDER BY od.created_at DESC;
```

---

## ✅ **Feature Checklist**

- ✅ Admin order management UI
- ✅ Manual delivery partner assignment
- ✅ Intelligent auto-assignment algorithm
- ✅ Delivery partner dashboard/portal
- ✅ Customer order tracking page
- ✅ SMS/Email/WhatsApp notifications
- ✅ Performance analytics
- ✅ Earnings tracking system
- ✅ Status history audit trail
- ✅ Real-time availability management
- ✅ Service area (pincode) filtering
- ✅ Navigation links in navbar

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** ✅ Fully Implemented
