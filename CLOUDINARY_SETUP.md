# Cloudinary Setup Guide

## Get Your Cloudinary API Credentials

1. **Go to Cloudinary Dashboard**
   - Visit: https://cloudinary.com/users/login
   - Log in with your account

2. **Find Your Credentials**
   - Once logged in, you'll see your dashboard
   - Look for the **"API Keys"** section or click your account name → Settings → Access Keys
   - You'll see:
     - **Cloud Name**: Already have this (`duoxrodmv`)
     - **API Key**: Copy this value
     - **API Secret**: Click "Copy" or "Reveal" to see it

3. **Update Your .env.local File**
   - Open `.env.local` file
   - Replace the placeholders:
     ```
     CLOUDINARY_API_KEY=your_cloudinary_api_key_here
     CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
     ```
   - With your actual values:
     ```
     CLOUDINARY_API_KEY=123456789012345
     CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
     ```

4. **Restart the Development Server**
   - Stop the current server (Ctrl+C)
   - Start it again: `npm run dev`

## Security Note

⚠️ **IMPORTANT**: Never commit your `.env.local` file to Git!
- The `.env.local` file should already be in `.gitignore`
- These are secret credentials - keep them safe
- Don't share them publicly

## Test the Upload

Once configured:
1. Go to Admin Portal → Add New Product
2. Click on the image upload area
3. Select an image from your computer
4. It will automatically upload to Cloudinary
5. You'll see a preview and the image ID will be saved

No more manual Cloudinary uploads! 🎉
