# Delivery Partner System - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Registration Process](#registration-process)
3. [Status Workflow](#status-workflow)
4. [Admin Management](#admin-management)
5. [Partner Dashboard](#partner-dashboard)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Technical Implementation](#technical-implementation)

---

## Overview

The Delivery Partner System allows individuals to register as delivery partners, get approved by admins, and manage deliveries for Sweta Fashion Points. The system includes:

- **Self-registration portal** for delivery partners
- **Admin approval workflow** with rejection reasons
- **Status management** (pending, active, inactive, suspended, rejected)
- **Reactivation capability** for inactive/suspended partners
- **Delivery dashboard** for active partners

---

## Registration Process

### Step 1: User Registration
Partners must first create a user account on the platform.

### Step 2: Delivery Partner Application
Navigate to `/delivery-partner/register` to fill out the application form.

#### Required Fields
- **Personal Information:**
  - Name *
  - Email
  - Mobile Number *

- **Vehicle Information:**
  - Vehicle Type * (Bike/Car/Van)
  - Vehicle Number *
  - Driving License Number *

- **Documents:**
  - Aadhar Number * (12 digits)
  - PAN Number * (Format: ABCDE1234F)

- **Address:**
  - Address Line 1 *
  - Address Line 2
  - City
  - State
  - Pincode * (6 digits)

- **Service Areas:**
  - Service Pincodes (comma-separated)

**Note:** Fields marked with * are mandatory.

### Step 3: Application Submission
After submission, the application goes to `pending_approval` status. Partners are redirected to the status page showing:
- Application status
- Expected approval time (24-48 hours)
- Application details

### Step 4: Admin Review
Admins review the application and can:
- **Approve** → Status changes to `active`
- **Reject** → Status changes to `rejected` (with reason)

---

## Status Workflow

### Status Types

#### 1. Pending Approval
- **Icon:** Yellow clock
- **Meaning:** Application submitted, awaiting admin review
- **Partner Access:** None
- **Admin Actions:** Approve, Reject
- **Can Re-register:** No (already in system)

#### 2. Active
- **Icon:** Green checkmark
- **Meaning:** Approved and can receive deliveries
- **Partner Access:** Full dashboard access
- **Admin Actions:** Suspend, Deactivate
- **Can Re-register:** No (already active)

#### 3. Rejected
- **Icon:** Red X
- **Meaning:** Application not approved
- **Partner Access:** None
- **Admin Actions:** None
- **Can Re-register:** Yes (deletes old record, allows fresh application)
- **Special:** Rejection reason is displayed to partner

#### 4. Suspended
- **Icon:** Orange warning
- **Meaning:** Temporarily suspended by admin
- **Partner Access:** None
- **Admin Actions:** Reactivate, Deactivate
- **Can Re-register:** No (blocked)
- **Use Cases:**
  - Policy violations
  - Quality issues
  - Under investigation
  - Document verification pending

#### 5. Inactive
- **Icon:** Gray slash
- **Meaning:** Permanently deactivated by admin
- **Partner Access:** None
- **Admin Actions:** Reactivate
- **Can Re-register:** No (blocked)
- **Use Cases:**
  - Serious violations
  - Partner requested deactivation
  - Long-term suspension

### Status Flow Diagram

```
Registration → pending_approval
                ↓
         ┌──────┴──────┐
         ↓             ↓
      active       rejected → Can re-register
         ↓
    ┌────┴────┐
    ↓         ↓
suspended  inactive
    ↓         ↓
    └────→ Reactivate → active
```

---

## Admin Management

### Accessing Admin Panel
Navigate to `/admin/delivery-partners`

### Dashboard Overview

#### Metrics Cards
- **Total Partners:** All registered partners
- **Active Partners:** Currently active count
- **Available Now:** Partners currently available for deliveries
- **Pending Approval:** Awaiting review count

#### Filters
- **Search:** By name, phone, or email
- **Status Filter:** All, Active, Pending Approval, Inactive, Suspended, Rejected
- **Availability Filter:** All, Available, Busy, Offline

### Admin Actions by Status

#### Pending Approval Partners
**Actions Available:**
- **View** → See full partner details
- **✓ Approve** → Opens confirmation modal
  - Changes status to `active`
  - Partner can access dashboard
- **✗ Reject** → Opens rejection modal
  - Requires rejection reason (mandatory)
  - Reason is shown to partner
  - Partner can re-register after rejection

#### Active Partners
**Actions Available:**
- **View** → See full partner details
- **Suspend** → Temporarily suspend partner
  - Changes status to `suspended`
  - Partner loses dashboard access
  - Can be reactivated later
- **Deactivate** → Permanently deactivate
  - Changes status to `inactive`
  - Partner loses dashboard access
  - Can be reactivated later

#### Suspended Partners
**Actions Available:**
- **View** → See full partner details
- **↻ Reactivate** → Restore to active status
  - Changes status to `active`
  - Availability set to `offline`
  - Partner regains dashboard access

#### Inactive Partners
**Actions Available:**
- **View** → See full partner details
- **↻ Reactivate** → Restore to active status
  - Changes status to `active`
  - Availability set to `offline`
  - Partner regains dashboard access

#### Rejected Partners
**Actions Available:**
- **View** → See full partner details
- Partner can submit fresh application

### Approval Workflow

1. **Navigate to Pending Partners:**
   - Use status filter or click "View All Pending" banner

2. **Review Application:**
   - Click "View" to see full details
   - Verify documents, vehicle info, and address

3. **Approve or Reject:**

   **To Approve:**
   - Click "✓ Approve" button
   - Confirm in modal
   - Partner receives active status
   - Partner can access dashboard

   **To Reject:**
   - Click "✗ Reject" button
   - Enter rejection reason (mandatory)
   - Confirm rejection
   - Partner sees rejection reason
   - Partner can re-register

---

## Partner Dashboard

### Accessing Dashboard
- **URL:** `/delivery/dashboard?partnerId={id}`
- **Access:** Only for partners with `active` status
- **Menu Link:** Appears in profile menu when status is active

### Dashboard Features
(To be implemented based on requirements)
- View assigned deliveries
- Update availability status
- Delivery history
- Earnings tracking
- Performance metrics

---

## API Endpoints

### 1. Register as Delivery Partner
**Endpoint:** `POST /api/delivery-partner/register`

**Request Body:**
```json
{
  "userId": "uuid",
  "name": "string",
  "email": "string",
  "mobile": "string",
  "vehicleType": "bike|car|van",
  "vehicleNumber": "string",
  "licenseNumber": "string",
  "aadharNumber": "string (12 digits)",
  "panNumber": "string (ABCDE1234F format)",
  "addressLine1": "string",
  "addressLine2": "string",
  "city": "string",
  "state": "string",
  "pincode": "string (6 digits)",
  "servicePincodes": ["string"]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful! Your application will be reviewed within 24-48 hours.",
  "partner": {
    "id": "uuid",
    "name": "string",
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

**Response (Error - Deactivated):**
```json
{
  "error": "Your delivery partner account has been deactivated. You cannot register with this mobile number or DL number. Please contact support for assistance."
}
```

### 2. Get Delivery Partner Details
**Endpoint:** `GET /api/delivery-partners/{id}`

**Response:**
```json
{
  "success": true,
  "partner": {
    "id": "uuid",
    "name": "string",
    "mobile": "string",
    "email": "string",
    "status": "pending_approval|active|inactive|suspended|rejected",
    "availability_status": "available|busy|offline",
    "vehicle_type": "string",
    "vehicle_number": "string",
    "license_number": "string",
    "rejection_reason": "string (if rejected)",
    "created_at": "timestamp"
  }
}
```

### 3. Update Delivery Partner (Admin Only)
**Endpoint:** `PUT /api/delivery-partners/{id}`

**Request Body:**
```json
{
  "status": "active|inactive|suspended|rejected",
  "rejectionReason": "string (required if status is rejected)",
  "availabilityStatus": "available|busy|offline",
  "updatedBy": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "partner": { ... },
  "message": "Delivery partner updated successfully"
}
```

### 4. Deactivate Delivery Partner (Admin Only)
**Endpoint:** `DELETE /api/delivery-partners/{id}`

**Response:**
```json
{
  "success": true,
  "message": "Delivery partner deactivated successfully"
}
```

### 5. Get All Delivery Partners (Admin Only)
**Endpoint:** `GET /api/delivery-partners`

**Query Parameters:**
- `status`: Filter by status
- `availability`: Filter by availability

**Response:**
```json
{
  "success": true,
  "partners": [ ... ],
  "total": 10
}
```

---

## Database Schema

### Table: `spf_delivery_partners`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique partner ID |
| `name` | VARCHAR | NOT NULL | Partner name |
| `mobile` | VARCHAR | NOT NULL, UNIQUE | Mobile number |
| `email` | VARCHAR | NULLABLE | Email address |
| `vehicle_type` | VARCHAR | NOT NULL | bike, car, van |
| `vehicle_number` | VARCHAR | NOT NULL | Vehicle registration |
| `license_number` | VARCHAR | NOT NULL | Driving license |
| `aadhar_number` | VARCHAR | NULLABLE | 12-digit Aadhar |
| `pan_number` | VARCHAR | NULLABLE | PAN card number |
| `address_line1` | VARCHAR | NULLABLE | Address line 1 |
| `address_line2` | VARCHAR | NULLABLE | Address line 2 |
| `city` | VARCHAR | NULLABLE | City |
| `state` | VARCHAR | NULLABLE | State |
| `pincode` | VARCHAR | NULLABLE | 6-digit pincode |
| `service_pincodes` | JSONB | DEFAULT [] | Service area pincodes |
| `status` | VARCHAR | DEFAULT 'pending_approval' | Partner status |
| `availability_status` | VARCHAR | DEFAULT 'offline' | Current availability |
| `rejection_reason` | TEXT | NULLABLE | Reason if rejected |
| `total_deliveries` | INTEGER | DEFAULT 0 | Total deliveries count |
| `successful_deliveries` | INTEGER | DEFAULT 0 | Successful count |
| `average_rating` | DECIMAL | DEFAULT 0 | Average rating |
| `total_ratings` | INTEGER | DEFAULT 0 | Total ratings received |
| `created_by` | UUID | FOREIGN KEY | User who registered |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Registration date |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

**Status Constraint:**
```sql
CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval', 'rejected'))
```

**Availability Status Values:**
- `available` - Ready for deliveries
- `busy` - Currently on delivery
- `offline` - Not available

### Table: `spf_users` (Additional Columns)

| Column | Type | Description |
|--------|------|-------------|
| `is_delivery_partner` | BOOLEAN | True if user is partner |
| `delivery_partner_id` | UUID | FK to delivery_partners |
| `delivery_partner_status` | VARCHAR | Current partner status |

---

## Technical Implementation

### Frontend Architecture

#### Pages

1. **Registration Page**
   - **Path:** `/app/delivery-partner/register/page.tsx`
   - **Features:**
     - Multi-section form (Personal, Vehicle, Documents, Address)
     - Client-side validation
     - Required field indicators (red asterisks)
     - Auto-fill from user profile
     - Success/error messaging
     - Redirects to status page after registration

2. **Status Page**
   - **Path:** `/app/delivery-partner/status/page.tsx`
   - **Features:**
     - Real-time status display
     - Status-specific icons and colors
     - Rejection reason display
     - Dashboard link for active partners
     - Contact support link for suspended/rejected

3. **Admin Management Page**
   - **Path:** `/app/(admin)/admin/delivery-partners/page.tsx`
   - **Features:**
     - Metrics dashboard
     - Search and filters
     - Approval/rejection modals
     - Reactivation capability
     - Real-time status updates

#### Components

**Status Badges:**
```typescript
const statusColors = {
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border-gray-200',
  suspended: 'bg-red-100 text-red-700 border-red-200',
  pending_approval: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  rejected: 'bg-red-100 text-red-700 border-red-200'
}
```

### Backend Architecture

#### API Routes

1. **Registration Handler**
   - **Path:** `/app/api/delivery-partner/register/route.ts`
   - **Logic:**
     - Validates required fields
     - Checks for existing partner
     - Handles status-specific logic:
       - Rejected: Deletes old record, allows re-registration
       - Inactive/Suspended: Blocks re-registration
       - Active/Pending: Shows already registered error
     - Creates partner record
     - Links to user account

2. **Partner Management**
   - **Path:** `/app/api/delivery-partners/[id]/route.ts`
   - **Methods:** GET, PUT, DELETE
   - **Logic:**
     - GET: Fetch partner details
     - PUT: Update status, profile, rejection reason
     - DELETE: Soft delete (set to inactive)

### Business Logic

#### Re-registration Rules
```typescript
if (status === 'rejected') {
  // Delete old record, allow fresh application
  await deletePartner(id);
  await resetUserFlags(userId);
  return { allowed: true };
}

if (status === 'inactive' || status === 'suspended') {
  // Block re-registration, show support message
  return {
    allowed: false,
    message: 'Contact support'
  };
}

if (status === 'active' || status === 'pending_approval') {
  // Already registered
  return {
    allowed: false,
    message: 'Already registered'
  };
}
```

#### Reactivation Logic
```typescript
async function reactivate(partnerId: string) {
  await updatePartner(partnerId, {
    status: 'active',
    availability_status: 'offline'
  });
  // Partner can now access dashboard
}
```

### Security Considerations

1. **Admin-Only Actions:**
   - Approval/rejection
   - Status changes
   - Partner deactivation
   - Use admin middleware/checks

2. **Data Validation:**
   - Aadhar: 12 digits
   - PAN: ABCDE1234F format
   - Pincode: 6 digits
   - Mobile: Unique constraint

3. **Authorization:**
   - Partners can only view their own data
   - Admins can view/edit all partners
   - Status page requires authentication

---

## User Flows

### Flow 1: New Partner Registration
```
1. User creates account
2. User navigates to /delivery-partner/register
3. User fills form with all required fields
4. System validates input
5. System creates partner record (status: pending_approval)
6. User redirected to status page
7. Status page shows "Under Review" message
```

### Flow 2: Admin Approval
```
1. Admin logs in
2. Admin navigates to /admin/delivery-partners
3. Admin sees "Pending Approvals" banner
4. Admin clicks "View All Pending"
5. Admin reviews partner application
6. Admin clicks "✓ Approve"
7. Admin confirms in modal
8. Status changes to "active"
9. Partner receives dashboard access
```

### Flow 3: Admin Rejection
```
1. Admin reviews partner application
2. Admin clicks "✗ Reject"
3. Modal opens requiring rejection reason
4. Admin enters reason and confirms
5. Status changes to "rejected"
6. Partner sees rejection reason
7. Partner can re-register with fresh application
```

### Flow 4: Partner Suspension & Reactivation
```
1. Admin finds active partner
2. Admin clicks "Suspend"
3. Status changes to "suspended"
4. Partner loses dashboard access
5. Partner sees "Account Suspended" message
6. Admin later clicks "↻ Reactivate"
7. Status changes back to "active"
8. Partner regains dashboard access
```

### Flow 5: Rejected Partner Re-registration
```
1. Partner sees rejection reason
2. Partner navigates to registration page
3. System detects old rejected record
4. System deletes old record
5. System resets user flags
6. Partner fills fresh application
7. New application goes to pending_approval
```

---

## Color Scheme

### Status Colors
- **Pending Approval:** Yellow (#FEF3C7 background, #92400E text)
- **Active:** Green (#D1FAE5 background, #065F46 text)
- **Rejected:** Red (#FEE2E2 background, #991B1B text)
- **Inactive:** Gray (#F3F4F6 background, #374151 text)
- **Suspended:** Orange/Red (#FED7D7 background, #C53030 text)

### Brand Colors
- **Primary:** #722F37 (Burgundy)
- **Background:** #FAF7F2 (Cream)
- **Border:** #E8E2D9 (Tan)

---

## Future Enhancements

### Phase 2 Features
- [ ] Document upload (Aadhar, PAN, License, RC)
- [ ] Photo upload (Profile, Vehicle)
- [ ] Bank account details for payments
- [ ] Real-time location tracking
- [ ] Delivery assignment system
- [ ] Earnings dashboard
- [ ] Performance analytics
- [ ] Rating and review system
- [ ] Push notifications
- [ ] In-app messaging with customers

### Phase 3 Features
- [ ] Delivery route optimization
- [ ] Batch delivery assignments
- [ ] Incentive and bonus system
- [ ] Partner referral program
- [ ] Training module
- [ ] Partner leaderboard
- [ ] Attendance tracking
- [ ] Vehicle maintenance reminders

---

## Troubleshooting

### Common Issues

**Issue:** Partner can't see registration page
- **Solution:** Check if user is logged in, redirect to `/login` if not

**Issue:** Reactivate button not appearing
- **Solution:**
  1. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
  2. Restart dev server
  3. Check partner status is 'inactive' or 'suspended'

**Issue:** Registration fails with "Already registered"
- **Check:** Partner's current status
- **Action:**
  - If rejected: Should allow re-registration
  - If active/pending: Show appropriate message
  - If inactive/suspended: Show contact support message

**Issue:** Status page shows "Status Unknown"
- **Solution:** Check if partner status is one of the valid values
- **Check:** Database constraint allows the status value

---

## Support

For issues or questions:
- **Admin:** Contact system administrator
- **Partner:** Contact support via the status page link
- **Developer:** Check logs at `/api/delivery-partner/*` endpoints

---

## Version History

- **v1.0.0** (Current)
  - Initial delivery partner system
  - Registration with mandatory fields
  - Admin approval workflow
  - Status management (pending, active, inactive, suspended, rejected)
  - Rejection reason support
  - Reactivation capability
  - Re-registration for rejected partners

---

**Last Updated:** February 13, 2026
**Maintained By:** Development Team
