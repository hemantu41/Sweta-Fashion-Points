#!/usr/bin/env node

/**
 * Script to make an existing user an admin via API
 * Run with: node scripts/make-user-admin.mjs
 */

async function makeUserAdmin() {
  console.log('Making hemantukumar.41@gmail.com an admin...\n');

  try {
    // Use a direct API call to update the user
    const response = await fetch('http://localhost:3000/api/admin/make-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'hemantukumar.41@gmail.com'
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ User is now an admin!');
      console.log('\n⚠️  IMPORTANT: Log out and log back in to see the Admin Portal option!\n');
      console.log('Steps:');
      console.log('1. Click the Logout button in the dropdown');
      console.log('2. Log in again with your email and password');
      console.log('3. You will now see "Admin Portal" in the profile dropdown\n');
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nLet me create the API endpoint first...');
  }
}

makeUserAdmin();
