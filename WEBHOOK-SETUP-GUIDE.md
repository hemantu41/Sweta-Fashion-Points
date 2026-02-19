# Razorpay Webhook Setup Guide

## Problem
Seller earnings are not being created automatically even though:
- ✅ Order has productId and sellerId
- ✅ Order status is 'captured'
- ✅ Payment is completed
- ❌ Webhook didn't create earnings

## Solution: Configure Razorpay Webhook

### Step 1: Get Your Webhook URL

Your webhook endpoint is:
```
https://fashionpoints.co.in/api/payment/webhook
```

### Step 2: Configure Webhook in Razorpay Dashboard

1. **Login to Razorpay Dashboard**
   - Go to: https://dashboard.razorpay.com/
   - Use your Razorpay account credentials

2. **Navigate to Webhooks**
   - Click on **Settings** (gear icon) in left sidebar
   - Click on **Webhooks** under "API Keys & Webhooks"

3. **Create New Webhook**
   - Click **"+ Create New Webhook"** button
   - Enter the webhook URL:
     ```
     https://fashionpoints.co.in/api/payment/webhook
     ```

4. **Select Events to Subscribe**
   Check these 3 events:
   - ✅ `payment.captured` (Most important!)
   - ✅ `payment.failed`
   - ✅ `order.paid`

5. **Generate Webhook Secret**
   - Razorpay will generate a webhook secret (starts with `whsec_`)
   - **COPY THIS SECRET** - you'll need it in Step 3

6. **Set Alert Email** (Optional)
   - Enter your email to get notified of webhook failures

7. **Click "Create Webhook"**

### Step 3: Add Webhook Secret to Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/[your-username]/sweta-fashion-points
   - Click on **Settings** tab
   - Click on **Environment Variables**

2. **Add Webhook Secret**
   - Click **"Add New"** button
   - Key: `RAZORPAY_WEBHOOK_SECRET`
   - Value: `whsec_xxxxxxxxxxxxx` (paste the secret from Razorpay)
   - Environment: Select **Production, Preview, Development** (all)
   - Click **Save**

3. **Redeploy** (Important!)
   - Go to **Deployments** tab
   - Click the **three dots** on the latest deployment
   - Click **"Redeploy"**
   - This ensures the webhook secret is loaded

### Step 4: Test the Webhook

1. **Create a Test Order**
   - Hard-refresh your site (Ctrl+Shift+R)
   - Add a seller product to cart
   - Complete checkout with test payment
   - Use test card: `4111 1111 1111 1111`, CVV: `123`, Expiry: any future date

2. **Check Webhook Logs in Razorpay**
   - Go to Razorpay Dashboard → Webhooks
   - Click on your webhook
   - Click **"Webhook Logs"** tab
   - You should see entries for `payment.captured` events
   - Status should be **200 OK** (green checkmark)

3. **Check Earnings Dashboard**
   - Go to `/seller/dashboard/earnings`
   - The new order should appear automatically!

### Step 5: Verify Environment Variables

Make sure these are set in Vercel:

```
RAZORPAY_KEY_ID=rzp_live_xxxxx  (or rzp_test_xxxxx for test mode)
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## Troubleshooting

### Issue: Webhook Returns 400/401/500 Error

**Check in Razorpay Webhook Logs:**
- Click on the failed webhook event
- See the error message

**Common Errors:**
- `Missing signature` → RAZORPAY_WEBHOOK_SECRET not set in Vercel
- `Invalid signature` → Wrong webhook secret in Vercel env vars
- `500 Internal Error` → Check Vercel function logs for errors

### Issue: Webhook Never Triggered

**Possible Causes:**
1. Webhook URL is wrong (check it's exactly: `https://fashionpoints.co.in/api/payment/webhook`)
2. Webhook is not enabled in Razorpay dashboard
3. Events are not selected (must include `payment.captured`)

### Issue: Webhook Succeeds but No Earnings

**Debug:**
1. Check Vercel function logs:
   - Go to Vercel Dashboard → Deployment → Functions
   - Click on `/api/payment/webhook`
   - Check logs for errors

2. Run this SQL to verify webhook was called:
   ```sql
   SELECT
     order_number,
     status,
     payment_completed_at,
     updated_at
   FROM spf_payment_orders
   ORDER BY created_at DESC
   LIMIT 5;
   ```

   If `payment_completed_at` is set, webhook updated the order.
   If earnings still missing, check for errors in webhook logs.

---

## Test Mode vs Live Mode

**Important:** Use the same mode for everything:

**Test Mode:**
- Razorpay Key ID: `rzp_test_xxxxx`
- Webhook configured in **Test Mode** section
- Use test card numbers for payments

**Live Mode:**
- Razorpay Key ID: `rzp_live_xxxxx`
- Webhook configured in **Live Mode** section
- Real payments

**⚠️ Common Mistake:** Configuring webhook in Live mode but using Test mode keys!

---

## Summary

1. ✅ Configure webhook in Razorpay Dashboard
2. ✅ Add `RAZORPAY_WEBHOOK_SECRET` to Vercel env vars
3. ✅ Redeploy on Vercel
4. ✅ Test with a new order
5. ✅ Check webhook logs in Razorpay
6. ✅ Verify earnings appear automatically

Once configured, all future orders will automatically create seller earnings! 🎉
