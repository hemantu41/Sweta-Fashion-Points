#!/usr/bin/env node

/**
 * Script to list all users in the database
 */

async function listUsers() {
  console.log('Fetching all users...\n');

  try {
    const response = await fetch('http://localhost:3000/api/admin/list-users', {
      method: 'GET',
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Users in database:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      data.users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Admin: ${user.isAdmin}`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listUsers();
