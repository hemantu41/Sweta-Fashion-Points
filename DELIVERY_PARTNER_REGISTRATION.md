# 🚚 Delivery Partner Registration System

Complete self-service registration system for delivery partners with automatic account linking and admin approval workflow.

---

## 🎯 Overview

This system allows anyone to register as a delivery partner through a professional web form. No manual database operations required!

**Key Features:**
- ✅ Self-service registration form
- ✅ Automatic user account linking
- ✅ Admin approval workflow
- ✅ Dashboard access after approval
- ✅ Mobile-responsive design
- ✅ Real-time validation

---

## 📋 How It Works

### **For Delivery Partners:**

1. **Registration**
   - Visit the website footer
   - Click "Become a Delivery Partner 🚚"
   - Fill out the registration form
   - Submit application

2. **Approval Wait**
   - Application status: `pending_approval`
   - Admin reviews within 24-48 hours
   - Receive notification when approved

3. **Access Dashboard**
   - Login to your account
   - Dashboard link appears in profile dropdown
   - Start accepting deliveries!

### **For Admins:**

1. **Review Applications**
   - Check new delivery partner registrations
   - Verify documents and details
   - Approve or reject applications

2. **Activate Partner**
   - Update status to `active`
   - Partner can now access dashboard
   - System automatically assigns deliveries

---

## 🔗 Access Points

### **Registration Page**
**URL:** [http://localhost:3000/delivery-partner/register](http://localhost:3000/delivery-partner/register)

**Access Via:**
- Footer link: "Become a Delivery Partner"
- Direct URL navigation

**Requirements:**
- Must be logged in
- Cannot be an existing delivery partner

### **Dashboard Access**
**URL:** [http://localhost:3000/delivery/dashboard?partnerId=YOUR_ID](http://localhost:3000/delivery/dashboard)

**Access Via:**
- Profile avatar dropdown → "Delivery Partner Dashboard"
- Only visible after admin approval
- Only visible if status is `active`

---

## 📝 Registration Form Fields

### **1. Personal Information**
- **Full Name** (required)
  - Your legal name as per documents
- **Email Address** (required)
  - For important notifications
- **Mobile Number** (required)
  - Primary contact for deliveries

### **2. Vehicle Information**
- **Vehicle Type** (required)
  - Options: Bike, Car, Van, Truck
- **Vehicle Number** (required)
  - Registration plate number
- **License Number** (optional)
  - Driving license number

### **3. Documents**
- **Aadhar Number** (optional)
  - For identity verification
- **PAN Number** (optional)
  - For tax purposes

### **4. Address**
- **Address Line 1** (required)
- **Address Line 2** (optional)
- **City** (required)
- **State** (required)
- **Pincode** (required)

### **5. Service Areas**
- **Service Pincodes** (required)
  - Comma-separated list
  - Example: `824219, 823001, 824101`
  - Areas where you can deliver

---

## 🔄 Registration Flow

```
User Clicks "Become a Delivery Partner"
↓
Checks if logged in → If not, redirects to login
↓
Checks if already registered → If yes, shows message
↓
Fills registration form
↓
Submits application
↓
System creates delivery partner record (status: pending_approval)
↓
System links user account
↓
Success message: "Application submitted for review"
↓
Redirects to profile page after 3 seconds
↓
Admin reviews and approves
↓
Dashboard link appears in navbar for user
↓
User can access delivery dashboard
```

---

## 🗄️ Database Setup

### **1. Run Delivery Partners Schema**
```bash
# Run in Supabase SQL Editor
database/schema-delivery-partners.sql
```

### **2. Run User Table Migration**
```bash
# Run in Supabase SQL Editor
database/migration-add-delivery-partner-to-users.sql
```

This adds the following columns to `spf_users`:
- `is_delivery_partner` (boolean)
- `delivery_partner_id` (UUID, foreign key)
- `delivery_partner_status` (varchar)

### **3. Verify Setup**
```sql
-- Check if columns exist
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'spf_users'
  AND column_name IN ('is_delivery_partner', 'delivery_partner_id', 'delivery_partner_status')
ORDER BY column_name;
```

---

## 🔐 Authentication & Authorization

### **Registration Page Access:**
- ✅ Must be logged in
- ✅ Redirects to `/login` if not authenticated
- ✅ Shows error if already registered

### **Dashboard Access:**
- ✅ Must be logged in
- ✅ Must have `isDeliveryPartner = true`
- ✅ Must have `deliveryPartnerStatus = 'active'`
- ✅ Link only appears if all conditions met

### **Admin Approval:**
- ✅ Only admins can approve partners
- ✅ Admin panel at `/admin/orders` has partner management

---

## 🎨 UI/UX Features

### **Registration Form:**
- Clean, modern design matching site theme
- Multi-section layout for better UX
- Real-time validation
- Clear error messages
- Success confirmation with redirect
- Mobile-responsive

### **Form Validation:**
- Required fields marked with asterisk (*)
- Email format validation
- Mobile number format validation
- Pincode format validation
- Prevents duplicate registrations

### **Success State:**
- Green checkmark icon
- Clear success message
- Expected timeline (24-48 hours)
- Auto-redirect to profile

---

## 🔧 Technical Implementation

### **Frontend:**
- **Component:** `src/app/delivery-partner/register/page.tsx`
- **Type:** Client Component (`'use client'`)
- **State Management:** React useState hooks
- **Authentication:** useAuth context
- **Routing:** Next.js router with redirect

### **Backend:**
- **API Route:** `src/app/api/delivery-partner/register/route.ts`
- **Method:** POST
- **Database:** Supabase PostgreSQL
- **Validation:** Server-side + client-side

### **Authentication:**
- **Context:** `src/context/AuthContext.tsx`
- **Login Integration:** `src/app/api/auth/login/route.ts`
- **User Fields:** Fetches delivery partner info on login

### **Navigation:**
- **Footer:** `src/components/Footer.tsx`
- **Navbar:** `src/components/Navbar.tsx`

---

## 📊 Database Tables

### **spf_delivery_partners**
Main table storing delivery partner operational data.

**Key Fields:**
- `id` (UUID, primary key)
- `name`, `mobile`, `email`
- `vehicle_type`, `vehicle_number`, `license_number`
- `status` ('pending_approval', 'active', 'inactive', 'suspended')
- `availability_status` ('available', 'busy', 'offline')
- `service_pincodes` (JSONB array)
- `created_by` (UUID, references spf_users)

### **spf_users (Extended)**
User authentication table with delivery partner linking.

**New Fields:**
- `is_delivery_partner` (boolean)
- `delivery_partner_id` (UUID, foreign key)
- `delivery_partner_status` (varchar)

---

## 🧪 Testing the System

### **Test Registration Flow:**

1. **Create a Test User**
   ```sql
   -- If you don't have a user account
   -- Sign up at: http://localhost:3000/signup
   ```

2. **Visit Registration Page**
   - Go to: http://localhost:3000
   - Scroll to footer
   - Click "Become a Delivery Partner"

3. **Fill Out Form**
   - Personal info: Test Partner, test@example.com, 9876543210
   - Vehicle: Bike, BR01AB1234, License (optional)
   - Address: Test Address, Gaya, Bihar, 824219
   - Service Areas: 824219, 823001

4. **Submit Application**
   - Click "Submit Application"
   - See success message
   - Auto-redirect to profile

5. **Check Database**
   ```sql
   -- Verify delivery partner created
   SELECT id, name, mobile, status, created_by
   FROM spf_delivery_partners
   ORDER BY created_at DESC
   LIMIT 1;

   -- Verify user account linked
   SELECT id, name, is_delivery_partner, delivery_partner_id, delivery_partner_status
   FROM spf_users
   WHERE email = 'test@example.com';
   ```

6. **Approve Partner (Admin Action)**
   ```sql
   -- Update partner status to active
   UPDATE spf_delivery_partners
   SET status = 'active', availability_status = 'available'
   WHERE id = 'PARTNER_UUID_FROM_ABOVE';
   ```

7. **Test Dashboard Access**
   - Logout and login again
   - Click profile avatar
   - Should see "Delivery Partner Dashboard" option
   - Click to access dashboard

---

## 🚨 Common Issues & Fixes

### **Issue 1: "Already registered as delivery partner"**
**Cause:** User already has a delivery partner record
**Fix:**
```sql
-- Check existing registration
SELECT * FROM spf_delivery_partners WHERE created_by = 'USER_UUID';
-- If test data, delete it
DELETE FROM spf_delivery_partners WHERE created_by = 'USER_UUID';
-- Also update user record
UPDATE spf_users
SET is_delivery_partner = false,
    delivery_partner_id = NULL,
    delivery_partner_status = NULL
WHERE id = 'USER_UUID';
```

### **Issue 2: Dashboard link not appearing**
**Cause:** Status is not 'active' or user not approved

**Fix:**
```sql
-- Check partner status
SELECT dp.id, dp.name, dp.status, u.is_delivery_partner, u.delivery_partner_status
FROM spf_delivery_partners dp
JOIN spf_users u ON dp.created_by = u.id
WHERE u.email = 'YOUR_EMAIL';

-- Approve partner
UPDATE spf_delivery_partners SET status = 'active' WHERE id = 'PARTNER_UUID';
```

**Note:** You must logout and login again after approval for navbar to update!

### **Issue 3: Mobile number already registered**
**Cause:** Another user has same mobile
**Fix:**
```sql
-- Check existing mobile
SELECT id, name, mobile FROM spf_delivery_partners WHERE mobile = '9876543210';
-- Delete test data if needed
DELETE FROM spf_delivery_partners WHERE mobile = '9876543210';
```

### **Issue 4: Foreign key constraint violation**
**Cause:** spf_delivery_partners table created before migration
**Fix:** Run migration file first:
```bash
database/migration-add-delivery-partner-to-users.sql
```

---

## 📞 API Endpoints

### **POST /api/delivery-partner/register**

**Purpose:** Register new delivery partner

**Authentication:** Required (must be logged in)

**Request Body:**
```json
{
  "userId": "user-uuid",
  "name": "Partner Name",
  "email": "partner@example.com",
  "mobile": "9876543210",
  "vehicleType": "bike",
  "vehicleNumber": "BR01AB1234",
  "licenseNumber": "BR0120230001234",
  "aadharNumber": "1234 5678 9012",
  "panNumber": "ABCDE1234F",
  "addressLine1": "Address Line 1",
  "addressLine2": "Address Line 2",
  "city": "Gaya",
  "state": "Bihar",
  "pincode": "824219",
  "servicePincodes": ["824219", "823001", "824101"]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful! Your application will be reviewed within 24-48 hours.",
  "partner": {
    "id": "partner-uuid",
    "name": "Partner Name",
    "status": "pending_approval"
  }
}
```

**Response (Error - Already Registered):**
```json
{
  "error": "You are already registered as a delivery partner"
}
```

**Response (Error - Mobile Exists):**
```json
{
  "error": "This mobile number is already registered"
}
```

---

## 🎯 Admin Actions

### **View Pending Applications**
```sql
SELECT
  id,
  name,
  mobile,
  email,
  vehicle_type,
  status,
  created_at
FROM spf_delivery_partners
WHERE status = 'pending_approval'
ORDER BY created_at DESC;
```

### **Approve Delivery Partner**
```sql
UPDATE spf_delivery_partners
SET
  status = 'active',
  availability_status = 'available',
  updated_at = NOW()
WHERE id = 'PARTNER_UUID';
```

### **Reject Application**
```sql
UPDATE spf_delivery_partners
SET
  status = 'inactive',
  updated_at = NOW()
WHERE id = 'PARTNER_UUID';

-- Optionally notify user via email/SMS
```

### **Suspend Partner**
```sql
UPDATE spf_delivery_partners
SET
  status = 'suspended',
  availability_status = 'offline',
  updated_at = NOW()
WHERE id = 'PARTNER_UUID';
```

---

## 🔮 Future Enhancements

1. **Admin Dashboard for Partner Management**
   - View all applications
   - Approve/reject from UI
   - Partner analytics

2. **Email/SMS Notifications**
   - Registration confirmation
   - Approval notification
   - Rejection notification with reason

3. **Document Upload**
   - License photo
   - Aadhar card scan
   - PAN card scan
   - Vehicle RC

4. **Enhanced Validation**
   - Vehicle number format validation
   - License number verification
   - Aadhar/PAN validation

5. **Partner Onboarding**
   - Training videos
   - App download instructions
   - Best practices guide

---

## ✅ Success Criteria

- ✅ Registration form accessible from footer
- ✅ Form validates all required fields
- ✅ Submission creates delivery partner record
- ✅ User account automatically linked
- ✅ Status set to 'pending_approval'
- ✅ Admin can approve partners
- ✅ Dashboard link appears after approval
- ✅ Only approved partners see dashboard
- ✅ System prevents duplicate registrations
- ✅ Mobile-responsive design

---

## 📚 Related Documentation

- **System Overview:** `DELIVERY_PARTNER_SYSTEM.md`
- **Navigation Guide:** `DELIVERY_SYSTEM_NAVIGATION.md`
- **Database Schema:** `database/schema-delivery-partners.sql`
- **User Migration:** `database/migration-add-delivery-partner-to-users.sql`
- **Seed Data:** `database/seed-delivery-partners.sql`

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** ✅ Production Ready
