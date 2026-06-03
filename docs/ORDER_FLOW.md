# Order Flow — Insta Fashion Points (IFP)

> **Last updated:** 2026-04-28  
> **Covers:** Customer · Seller · Admin  
> **Tech stack:** Next.js 14 App Router · Supabase (`spf_orders`) · Shiprocket

---

## Table of Contents

1. [Order Status Reference](#1-order-status-reference)
2. [Complete Status Lifecycle](#2-complete-status-lifecycle)
3. [Customer Flow](#3-customer-flow)
4. [Seller Flow](#4-seller-flow)
5. [Admin Flow](#5-admin-flow)
6. [API Reference](#6-api-reference)
7. [Notifications](#7-notifications)
8. [Business Rules & Edge Cases](#8-business-rules--edge-cases)
9. [Database Tables](#9-database-tables)

---

## 1. Order Status Reference

All statuses are stored **uppercase** in `spf_orders.status`.

| Status | Who Sets It | Meaning |
|---|---|---|
| `CONFIRMED` | System (payment success) | Order placed, payment captured |
| `SELLER_NOTIFIED` | System (auto) | Seller has been notified via email |
| `ACCEPTED` | Seller | Seller confirmed they can fulfil the order |
| `REJECTED` | Seller | Seller declined the order |
| `LABEL_GENERATED` | Seller | Shiprocket AWB assigned, label PDF ready |
| `PACKED` | Seller | Seller confirmed item is packed, courier pickup scheduled |
| `PICKUP_SCHEDULED` | Shiprocket webhook | Courier pickup slot confirmed |
| `READY_TO_SHIP` | Shiprocket webhook | Package collected by courier |
| `IN_TRANSIT` | Shiprocket webhook | Package in transit to destination |
| `OUT_FOR_DELIVERY` | Shiprocket webhook | Package out for final delivery |
| `DELIVERED` | Shiprocket webhook | Package delivered to customer |
| `CANCELLED` | Customer / Admin | Order cancelled before handover to courier |
| `RETURN_INITIATED` | Customer / Admin | Return request raised |
| `RETURNED` | Shiprocket webhook | Package returned to seller |

### Status colour mapping (admin dashboard)

| Status group | Colour |
|---|---|
| CONFIRMED, SELLER_NOTIFIED | Blue |
| ACCEPTED, LABEL_GENERATED | Teal |
| PACKED → IN_TRANSIT | Amber / Indigo |
| OUT_FOR_DELIVERY | Orange |
| DELIVERED | Green |
| CANCELLED, REJECTED | Red |
| RETURNED | Purple |

---

## 2. Complete Status Lifecycle

```
Customer places order
        │
        ▼
   [CONFIRMED]  ──── system fires seller notification email
        │
        ▼
   [SELLER_NOTIFIED]
        │
   ┌────┴────┐
   │         │
[ACCEPTED]  [REJECTED] ──► customer gets rejection email + refund note
   │
   ▼
[LABEL_GENERATED] ◄── seller enters box dimensions → Shiprocket creates AWB + label PDF
   │
   ▼
[PACKED] ◄── seller clicks "Packing Completed" → Shiprocket pickup scheduled for next day
   │
   ▼
[PICKUP_SCHEDULED / READY_TO_SHIP] ◄── courier collects package
   │
   ▼
[IN_TRANSIT] ◄── Shiprocket webhook
   │
   ▼
[OUT_FOR_DELIVERY] ◄── Shiprocket webhook
   │
   ▼
[DELIVERED] ◄── Shiprocket webhook
   │
   └──► (if failed) [RETURN_INITIATED] → [RETURNED]


Customer can cancel at: CONFIRMED, SELLER_NOTIFIED, ACCEPTED, LABEL_GENERATED
Customer CANNOT cancel at: PACKED or later (courier has been engaged)
```

---

## 3. Customer Flow

### 3.1 Placing an Order

1. Customer adds products to cart and proceeds to checkout.
2. Enters shipping address and selects payment method (UPI / Card / COD).
3. Payment is processed → `spf_orders` row is created with status `CONFIRMED`.
4. Confirmation email is sent to the customer.

**Page:** `/checkout`  
**API:** `POST /api/orders` (or payment webhook callback)

---

### 3.2 Viewing Orders

- Customer visits **My Orders** at `/orders`.
- Orders are fetched from `spf_orders` filtered by `customer_id`.
- Statuses are mapped to user-friendly labels:

| DB Status | Shown to Customer |
|---|---|
| CONFIRMED / SELLER_NOTIFIED | Order Confirmed |
| ACCEPTED | Accepted by Seller |
| LABEL_GENERATED | Preparing Shipment |
| PACKED | Packed |
| IN_TRANSIT | Shipped |
| OUT_FOR_DELIVERY | Out for Delivery |
| DELIVERED | Delivered |
| CANCELLED | Cancelled |
| REJECTED | Cancelled (by seller) |

**API:** `GET /api/orders?userId=<id>`

---

### 3.3 Tracking an Order

- **Track Order** button appears on the orders page once an AWB is assigned.
- Clicking it opens `/track/[awb]`.
- The tracking page calls `GET /api/tracking/[awb]`.
- Tracking data is fetched from `spf_shipments` → falls back to `spf_orders` if no shipment row exists (covers older orders).

**Tracking URL format:** `https://instafashionpoints.com/track/[awb]`

---

### 3.4 Cancelling an Order

- **Cancel Order** button appears for statuses: `CONFIRMED`, `ACCEPTED`, `LABEL_GENERATED`.
- Button is **hidden** once the order reaches `PACKED` or later.
- Clicking opens a modal with:
  - Preset reasons (Changed my mind / Ordered by mistake / Found a better price / Delivery taking too long)
  - Free-text textarea for custom reasons
  - Refund timeline notice (5–7 business days for prepaid orders)
- On confirmation:
  - Order status → `CANCELLED`
  - Customer receives cancellation confirmation email
  - Seller receives "customer cancelled" notification email

**API:** `POST /api/orders/[id]/cancel`  
**Body:** `{ customerId: string, reason: string }`

---

### 3.5 Downloading Invoice

- Customer can download a GST invoice PDF for any order.

**API:** `GET /api/orders/[id]/invoice`  
Returns a PDF with seller GSTIN, order items, and totals.

---

## 4. Seller Flow

### 4.1 Viewing Incoming Orders

- Seller visits `/seller/dashboard/orders`.
- Orders are grouped into tabs:

| Tab | Statuses shown |
|---|---|
| New Orders | CONFIRMED, SELLER_NOTIFIED |
| Ready to Ship | ACCEPTED, LABEL_GENERATED |
| Shipped | PACKED, PICKUP_SCHEDULED, READY_TO_SHIP, IN_TRANSIT, OUT_FOR_DELIVERY |
| Delivered | DELIVERED |
| Cancelled | CANCELLED, REJECTED |

**API:** `GET /api/orders?sellerId=<id>`

---

### 4.2 Accepting an Order

1. Seller clicks **Accept** on a new order.
2. Status → `ACCEPTED`.
3. SLA deadline is set (acceptance window: typically 24 hours).
4. Customer receives an "order accepted" email.

**API:** `PUT /api/orders/[id]`  
**Body:** `{ sellerId: string, status: "accepted" }`

---

### 4.3 Rejecting an Order

1. Seller clicks **Reject** and enters a reason (mandatory).
2. Status → `REJECTED`.
3. Customer receives a rejection email explaining the reason and noting that a refund will be initiated for prepaid orders.

**API:** `PUT /api/orders/[id]`  
**Body:** `{ sellerId: string, status: "rejected", reason: string }`

---

### 4.4 Generating a Shipping Label

1. Seller enters package dimensions (weight / length / breadth / height).
2. Clicks **Generate Shipping Label**.
3. System calls Shiprocket to:
   - Auto-register pickup location (if not already done)
   - Create a shipment and auto-assign the cheapest available courier
   - Generate a shipping label PDF
4. AWB number and label URL are saved to `spf_shipments` and `spf_orders`.
5. Status → `LABEL_GENERATED`.

> **Note:** If the seller's Shiprocket pickup address is unverified, courier assignment will fail with "No couriers available". Verify the address in Shiprocket → Settings → Manage Pickup Addresses.

**API:** `POST /api/seller/orders/[id]/ship`  
**Body:** `{ sellerId, weight?, length?, breadth?, height? }`

---

### 4.5 Confirming Packing & Scheduling Pickup

1. Seller packs the item and clicks **Packing Completed**.
2. System calls Shiprocket `schedulePickup` for the next business day.
3. Status → `PACKED`.
4. Seller receives a pickup confirmation email with the scheduled date.

**API:** `POST /api/orders/[id]/packing-status`  
**Body:** `{ sellerId: string }`

> Pickup is scheduled at this step — **not** at label generation. Label generation and pickup scheduling are deliberately two separate steps so the seller has time to pack.

---

### 4.6 After Pickup

All subsequent status updates (READY_TO_SHIP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED) are driven by **Shiprocket webhooks** — the seller does not manually trigger these.

---

## 5. Admin Flow

### 5.1 Dashboard Orders Section

- Located inside `/admin/dashboard` → **Orders** tab.
- Shows up to 50 most recent orders with real DB data.
- Features:

| Feature | Detail |
|---|---|
| Search | Order number, customer name/mobile, seller name, AWB, product name |
| Tab filter | All / Pending / Confirmed / Shipped / Delivered / Cancelled / Returned |
| Bulk select | Select multiple orders for bulk status update or bulk label print |

**Tab → DB status mapping:**

| Tab | DB Statuses |
|---|---|
| Pending | CONFIRMED, SELLER_NOTIFIED |
| Confirmed | ACCEPTED, LABEL_GENERATED |
| Shipped | PACKED, PICKUP_SCHEDULED, READY_TO_SHIP, IN_TRANSIT, OUT_FOR_DELIVERY |
| Delivered | DELIVERED |
| Cancelled | CANCELLED, REJECTED |
| Returned | RETURNED, RETURN_INITIATED |

**API:** `GET /api/admin/dashboard/orders?adminUserId=<id>`  
Returns orders enriched with `seller_name`, `awb_number`, `label_url`.

---

### 5.2 Order Row Actions

| Button | Action |
|---|---|
| Print Shipping Label | Opens the Shiprocket label PDF URL directly in a new tab. Shows error toast if no label has been generated yet. |
| Download GST Invoice | Opens `/api/orders/[id]/invoice` — generates a PDF with seller and order details. |
| View | Opens the Order Detail Modal |

---

### 5.3 Order Detail Modal (View)

Fetched from `GET /api/admin/orders/v2/[id]`. Shows:

- **Status timeline** — visual step indicator (Order Placed → Accepted → Label Generated → Packed → In Transit → Out for Delivery → Delivered)
- **Tracking info** — AWB, courier partner, link to live tracking
- **Customer details** — name, phone, email, full delivery address
- **Seller details** — business name, phone, email
- **Items list** — product name, SKU, quantity, unit price, total
- **Order totals** — subtotal + shipping = grand total
- **Status history log** — every status change with actor type (SELLER / CUSTOMER / SYSTEM), timestamp, and note

---

### 5.4 Full Admin Orders Page

Separate from the dashboard — at `/admin/orders`.

- Server-side filtering with 8 tabs: All / Pending / Accepted / Ready to Ship / In Transit / Delivered / SLA Breach / Flagged
- Risk flags (COD verification, NDR)
- Admin actions: Nudge seller, Extend SLA by +1h, Approve hold, Cancel
- Full drawer with all order details, risk assessment, and payout breakdown

**API:** `GET /api/admin/orders/v2`

---

## 6. API Reference

### Customer APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders?userId=<id>` | List customer's orders |
| `POST` | `/api/orders/[id]/cancel` | Cancel an order (body: `{ customerId, reason }`) |
| `GET` | `/api/orders/[id]/invoice` | Download GST invoice PDF |
| `GET` | `/api/tracking/[awb]` | Track shipment by AWB number |

### Seller APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders?sellerId=<id>` | List seller's orders |
| `PUT` | `/api/orders/[id]` | Accept or reject order |
| `POST` | `/api/seller/orders/[id]/ship` | Generate shipping label (Shiprocket) |
| `POST` | `/api/orders/[id]/packing-status` | Confirm packing + schedule courier pickup |
| `GET` | `/api/orders/[id]/packing-status` | Get packing SLA and status |

### Admin APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard/orders` | Dashboard order list (enriched) |
| `GET` | `/api/admin/orders/v2` | Full order list with server-side filtering |
| `GET` | `/api/admin/orders/v2/[id]` | Full order detail (history, items, risk, payout) |
| `POST` | `/api/admin/orders/v2/[id]/nudge-seller` | Send seller reminder |
| `POST` | `/api/admin/orders/v2/[id]/sla-extend` | Extend seller SLA by 1 hour |
| `POST` | `/api/admin/orders/v2/[id]/cancel` | Admin-cancel an order |
| `POST` | `/api/admin/orders/v2/[id]/approve-hold` | Approve a held/flagged order |

---

## 7. Notifications

All notification emails are sent via `src/lib/notifications/sellerNotify.ts`.

| Event | Recipients | Function |
|---|---|---|
| Order placed | Seller | `notifySellerNewOrder` |
| Order accepted | Customer | `notifyCustomerOrderAccepted` |
| Order rejected | Customer | `notifyCustomerOrderRejected` |
| Label generated | — | (no email — seller sees it on dashboard) |
| Packing completed / Pickup scheduled | Seller | `notifySellerPickupScheduled` |
| Customer cancelled | Customer + Seller | `notifyCustomerSelfCancelled` + `notifySellerCustomerCancelled` |

> All notification calls are **fire-and-forget** (`void asyncFn()`) — they do not block the API response.

---

## 8. Business Rules & Edge Cases

### Cancellation Rules

- Customer can cancel only if status is **before PACKED** (i.e. CONFIRMED, SELLER_NOTIFIED, ACCEPTED, LABEL_GENERATED).
- Once the seller confirms packing and pickup is scheduled, cancellation is blocked — customer must raise a return request after delivery.
- Reason is mandatory for all cancellations.

### Rejection Rules

- Seller can reject only orders in `CONFIRMED` or `SELLER_NOTIFIED` status (before acceptance).
- Rejection reason is mandatory.
- System sets status to `REJECTED` — treated same as `CANCELLED` in customer-facing UI.

### Label Generation Rules

- Seller must have a business address of at least 10 characters to register a pickup location with Shiprocket.
- If `shiprocket_pickup_location` is not set on the seller record, the system auto-registers it on first label generation and saves it to `spf_sellers`.
- If Shiprocket returns "No couriers available", the seller's pickup address is likely unverified — must be verified in Shiprocket dashboard.
- Label generation is **idempotent**: if an AWB already exists, it re-generates the label PDF without creating a new Shiprocket order.

### Pickup Scheduling Rules

- Pickup is only scheduled when the seller clicks **Packing Completed** — not at label generation.
- The packing-status endpoint requires the order to be in `LABEL_GENERATED` status. It will reject calls for any other status.
- Pickup is scheduled for **tomorrow** (Shiprocket's default next-day pickup).

### Tracking Fallback

- `/api/tracking/[awb]` first queries `spf_shipments` by AWB.
- If no shipment record exists (can happen for orders created before the FK bug was fixed), it falls back to `spf_orders` and synthesises a basic tracking response from the order status.
- This means tracking always works regardless of whether a `spf_shipments` row exists.

### SLA Deadlines

- `acceptance_sla_deadline` — set at order creation; seller must accept within this window.
- `packing_sla_deadline` — set when order is accepted; seller must complete packing within this window.
- Admin can extend the packing SLA by 1 hour via the admin orders page.

---

## 9. Database Tables

| Table | Purpose |
|---|---|
| `spf_orders` | Master order record (status, amounts, addresses, AWB) |
| `spf_order_items` | Line items for each order (product, qty, price) |
| `spf_order_status_history` | Append-only log of every status change |
| `spf_order_risk_flags` | Risk signals per order (COD fraud, NDR patterns) |
| `spf_shipments` | Shiprocket shipment record (AWB, label URL, courier) |
| `spf_shipment_tracking` | Tracking events from Shiprocket webhooks |
| `spf_sellers` | Seller profile (includes `shiprocket_pickup_location`) |
| `spf_users` | Customer accounts |

### Key relationships

```
spf_orders
  ├── spf_order_items        (order_id FK)
  ├── spf_order_status_history (order_id FK)
  ├── spf_order_risk_flags   (order_id FK)
  └── spf_shipments          (order_id FK)
        └── spf_shipment_tracking (shipment_id FK)
```

> **Important:** Use `supabaseAdmin` (service role key) for all server-side queries — it bypasses RLS. Never use Prisma/DATABASE_URL in this project as the `DATABASE_URL` env var is not configured.

---

*Generated from codebase — update this file whenever order flow changes are deployed.*
