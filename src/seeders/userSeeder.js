const bcrypt = require('bcrypt');
const database = require('../config/database');

/**
 * User Seeder
 * Seed initial users for development/testing
 */

const users = [
  {
    phoneNumber: '6281234567890',
    name: 'Admin User',
    password: 'admin123'
  },
  {
    phoneNumber: '6281234567891',
    name: 'Test User 1',
    password: 'user123'
  },
  {
    phoneNumber: '6281234567892',
    name: 'Test User 2',
    password: 'user123'
  },
  {
    phoneNumber: '6281234567893',
    name: 'Demo User',
    password: 'demo123'
  }
];

async function seedUsers() {
  try {
    console.log('🌱 Starting user seeder...');

    // Connect to database
    await database.connect();
    const pool = database.getPool();

    // Clear existing users (optional - comment out if you want to keep existing data)
    console.log('🗑️ Clearing existing users...');
    await pool.query('DELETE FROM users');
    console.log('✅ Users cleared');

    // Insert users
    console.log('📝 Inserting users...');
    for (const user of users) {
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Insert user
      await pool.execute(
        'INSERT INTO users (phoneNumber, name, password, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
        [user.phoneNumber, user.name, hashedPassword]
      );

      console.log(`✅ Created user: ${user.name} (${user.phoneNumber})`);
    }

    console.log('✅ User seeder completed successfully!');
    console.log(`📊 Total users created: ${users.length}`);
    console.log('\n🔑 Test Credentials:');
    users.forEach(user => {
      console.log(`   ${user.name}: ${user.phoneNumber} / ${user.password}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ User seeder failed:', error);
    process.exit(1);
  }
}

// Run seeder
seedUsers();
