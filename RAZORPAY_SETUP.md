# Razorpay Payment Gateway Setup Guide

This guide will help you set up Razorpay payment gateway for automatic payment detection in Sweta Fashion Points.

## 🚀 Quick Start

### 1. Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Click "Sign Up" and create an account
3. Complete KYC verification (required for live payments)

### 2. Get API Credentials

#### For Testing (Development):

1. Log in to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Under **Test Mode**, generate Test API keys
4. Copy the **Key ID** (starts with `rzp_test_`)
5. Copy the **Key Secret**

#### For Production (Live):

1. Complete KYC verification first
2. Toggle to **Live Mode** in dashboard
3. Go to **Settings** → **API Keys**
4. Generate Live API keys
5. Copy the **Key ID** (starts with `rzp_live_`)
6. Copy the **Key Secret**

### 3. Configure Environment Variables

Update your `.env.local` file with Razorpay credentials:

```bash
# For Testing (use TEST keys)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYYYYYYYYYY
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXX

# For Production (use LIVE keys after KYC)
# RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXX
# RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYYYYYYYYYY
# NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXX
```

### 4. Set Up Database Table

Run the SQL migration to create the payment orders table:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f scripts/db/create-payment-orders-table.sql
```

**Or using Supabase Dashboard:**

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `scripts/db/create-payment-orders-table.sql`
3. Paste and run the SQL

### 5. Configure Webhook (Optional but Recommended)

Webhooks provide real-time payment status updates:

1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. **Webhook URL:** `https://your-domain.com/api/payment/webhook`
4. **Active Events:** Select these events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
5. Click **Create Webhook**
6. Copy the **Webhook Secret**
7. Add to `.env.local`:

```bash
RAZORPAY_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXX
```

### 6. Update Vercel Environment Variables

If deploying to Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `RAZORPAY_WEBHOOK_SECRET` (if using webhooks)
3. Redeploy your application

---

## 💳 How It Works

### Payment Flow:

1. **User adds items to cart** → Proceeds to checkout
2. **System creates Razorpay order** → Generates order ID and QR code
3. **User scans QR code** → Makes payment via UPI app
4. **Automatic detection:**
   - System polls payment status every 5 seconds
   - Webhook provides instant notification (if configured)
5. **Payment verified** → User sees success page + receives SMS/WhatsApp

### Payment Statuses:

- **created** - Order created, payment not started
- **pending** - Payment initiated, verification in progress
- **captured** - Payment successful ✅
- **failed** - Payment failed ❌
- **refunded** - Payment refunded

---

## 🧪 Testing Payments

### Test UPI Payments:

Razorpay provides test mode where you can simulate payments:

1. Use **TEST API keys** (rzp_test_...)
2. Generate QR code and scan with UPI app
3. Payment will work in test mode
4. Check Razorpay Dashboard → Payments to see test transactions

### Simulate Payment Success/Failure:

In Razorpay Test Mode Dashboard:
1. Go to **Payments** tab
2. Find your test payment
3. Click on it
4. Use "Capture" button to mark as successful
5. Use "Fail" button to mark as failed

---

## 📊 Transaction Fees

### UPI Payments:
- **Test Mode:** Free
- **Live Mode:** 2% per transaction (check latest pricing on Razorpay)

### Other Payment Methods:
- Debit/Credit Cards: ~2%
- Net Banking: ~₹5-10 per transaction
- Wallets: ~2%

---

## 🔒 Security Best Practices

1. **Never commit API keys** to version control
2. **Use TEST keys** for development/staging
3. **Use LIVE keys** only in production
4. **Verify webhook signatures** (already implemented)
5. **Use HTTPS** for webhook URLs
6. **Regularly rotate** API keys

---

## 🐛 Troubleshooting

### "Payment gateway not configured" error:

- Check if `.env.local` has correct Razorpay keys
- Make sure keys don't contain `your_razorpay` placeholder
- Restart development server after adding env variables

### QR code shows "Generating..." forever:

- Check browser console for errors
- Verify Razorpay API keys are valid
- Check network tab for failed API calls
- Make sure `spf_payment_orders` table exists

### Payment status not updating:

- Check if polling is working (console logs)
- Verify webhook is configured correctly
- Check Supabase database for payment records
- Look at Razorpay Dashboard → Webhooks → Logs

### Webhook not receiving events:

- Ensure webhook URL is publicly accessible (not localhost)
- Verify webhook secret is correct in `.env.local`
- Check Razorpay Dashboard → Webhooks → Logs for delivery status
- Make sure webhook URL uses HTTPS

---

## 📞 Support

### Razorpay Support:
- Email: support@razorpay.com
- Phone: 1800-123-1234
- Docs: https://razorpay.com/docs

### Application Support:
- Check logs in Vercel Dashboard
- Check Supabase logs
- Contact: +91 96080 63673

---

## ✅ Checklist

Before going live:

- [ ] Razorpay account created and KYC completed
- [ ] Live API keys generated
- [ ] Environment variables updated in Vercel
- [ ] Database table created
- [ ] Webhook configured (optional)
- [ ] Test payment completed successfully
- [ ] Notifications (SMS/WhatsApp) working
- [ ] SSL certificate active (HTTPS)

---

## 🎯 Next Steps

After Razorpay integration:

1. Test with small transactions first
2. Monitor payment success rate
3. Set up refund policies
4. Add payment analytics
5. Implement order management system
6. Add customer order tracking
7. Set up automated reconciliation

---

**Note:** This integration uses Razorpay Standard Checkout for UPI QR codes. For advanced features like saved cards, EMI, or subscription payments, refer to Razorpay documentation.
