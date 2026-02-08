#!/usr/bin/env node

/**
 * Script to create an admin account
 * Run with: node scripts/create-admin.mjs
 */

const ADMIN_INVITE_CODE = 'SWETA_ADMIN_2026';

async function createAdmin() {
  console.log('Creating admin account...\n');

  const adminData = {
    name: 'Admin User',
    email: 'admin@swetafashion.com',
    mobile: '9999999999',
    password: 'Admin@123',
    inviteCode: ADMIN_INVITE_CODE
  };

  try {
    const response = await fetch('http://localhost:3000/api/admin/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Admin account created successfully!');
      console.log('\nAdmin Credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 Email/Mobile: ${adminData.email} or ${adminData.mobile}`);
      console.log(`🔑 Password: ${adminData.password}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\nNext steps:');
      console.log('1. Go to http://localhost:3000/login');
      console.log('2. Log in with the credentials above');
      console.log('3. Navigate to http://localhost:3000/admin/products');
      console.log('\n✨ You can now manage products from the admin portal!\n');
    } else {
      if (data.error && data.error.includes('already exists')) {
        console.log('⚠️  Admin account already exists!');
        console.log('\nIf you forgot the password, you can:');
        console.log('1. Use the existing admin credentials');
        console.log('2. Or manually update the password in Supabase');
      } else {
        console.error('❌ Failed to create admin account:', data.error);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Make sure the development server is running:');
    console.log('   npm run dev');
  }
}

createAdmin();
