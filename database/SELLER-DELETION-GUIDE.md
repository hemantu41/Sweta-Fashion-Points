# Seller Deletion Guide (for Testing / Account Reset)

Use this guide when you need to fully remove a seller account so the user can re-register from scratch.

---

## Why It's Not Simple

The `spf_sellers` table is referenced by multiple FK constraints across several tables. You must delete in the correct order to avoid FK violations:

```
spf_seller_earnings  →  spf_productdetails  →  spf_sellers  →  spf_users
```

---

## Step-by-Step Deletion Queries

Replace `pankaj995597@gmail.com` with the target email and `0b9054a0-be24-4821-94de-80dba07defd7` with the actual seller UUID.

### Step 1 — Find the Seller ID

```sql
SELECT u.id AS user_id, u.email, u.user_type, s.id AS seller_id
FROM spf_users u
LEFT JOIN spf_sellers s ON s.user_id = u.id
WHERE u.email = 'pankaj995597@gmail.com';
```

Note the `seller_id` from the result — you'll need it in the steps below.

---

### Step 2 — Delete Seller Earnings Linked to Their Products

```sql
DELETE FROM spf_seller_earnings
WHERE product_id IN (
  SELECT id FROM spf_productdetails
  WHERE seller_id = '0b9054a0-be24-4821-94de-80dba07defd7'
);
```

---

### Step 3 — Delete Seller Earnings Linked Directly to the Seller

```sql
DELETE FROM spf_seller_earnings
WHERE seller_id = '0b9054a0-be24-4821-94de-80dba07defd7';
```

---

### Step 4 — Delete All Products for the Seller

```sql
DELETE FROM spf_productdetails
WHERE seller_id = '0b9054a0-be24-4821-94de-80dba07defd7';
```

---

### Step 5 — Delete the Seller Record

```sql
DELETE FROM spf_sellers
WHERE id = '0b9054a0-be24-4821-94de-80dba07defd7';
```

---

### Step 6 — Reset User Type Back to Customer

```sql
UPDATE spf_users
SET user_type = 'customer'
WHERE email = 'pankaj995597@gmail.com';
```

> **Note:** Valid values for `user_type` are: `customer`, `seller`, `admin`.
> Do NOT use `buyer` — it will violate the check constraint.

---

### Step 7 — Verify Cleanup

```sql
SELECT u.id, u.email, u.user_type, s.id AS seller_id
FROM spf_users u
LEFT JOIN spf_sellers s ON s.user_id = u.id
WHERE u.email = 'pankaj995597@gmail.com';
```

Expected result:
| email | user_type | seller_id |
|-------|-----------|-----------|
| pankaj995597@gmail.com | customer | null |

---

## All-in-One Script (Replace values before running)

```sql
-- ============================================================
-- SELLER DELETION SCRIPT
-- Replace SELLER_ID and USER_EMAIL before running
-- ============================================================

-- Variables (replace these)
-- SELLER_ID  = '0b9054a0-be24-4821-94de-80dba07defd7'
-- USER_EMAIL = 'pankaj995597@gmail.com'

-- 1. Delete earnings linked to seller's products
DELETE FROM spf_seller_earnings
WHERE product_id IN (
  SELECT id FROM spf_productdetails
  WHERE seller_id = 'SELLER_ID'
);

-- 2. Delete earnings linked directly to seller
DELETE FROM spf_seller_earnings
WHERE seller_id = 'SELLER_ID';

-- 3. Delete products
DELETE FROM spf_productdetails
WHERE seller_id = 'SELLER_ID';

-- 4. Delete seller record
DELETE FROM spf_sellers
WHERE id = 'SELLER_ID';

-- 5. Reset user type
UPDATE spf_users
SET user_type = 'customer'
WHERE email = 'USER_EMAIL';

-- 6. Verify
SELECT u.id, u.email, u.user_type, s.id AS seller_id
FROM spf_users u
LEFT JOIN spf_sellers s ON s.user_id = u.id
WHERE u.email = 'USER_EMAIL';
```

---

## FK Reference Map (Tables That Block Deletion)

| Table | Column | References |
|-------|--------|------------|
| `spf_productdetails` | `seller_id` | `spf_sellers.id` |
| `spf_seller_earnings` | `seller_id` | `spf_sellers.id` |
| `spf_seller_earnings` | `product_id` | `spf_productdetails.id` |

If you get a new FK error not listed above, run this to find all constraints:

```sql
SELECT tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.key_column_usage kcu2
  ON rc.unique_constraint_name = kcu2.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu2.table_name = 'spf_sellers';
```
