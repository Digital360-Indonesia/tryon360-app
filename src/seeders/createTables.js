const database = require('../config/database');

/**
 * Create Database Tables
 * Creates users table if it doesn't exist
 */

async function createTables() {
  try {
    console.log('🏗️ Creating database tables...');

    // Connect to database
    await database.connect();
    const pool = database.getPool();

    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phoneNumber VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) DEFAULT '',
        password VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phoneNumber (phoneNumber)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await pool.query(createUsersTable);
    console.log('✅ Users table created successfully');

    // Verify table exists
    const [tables] = await pool.query('SHOW TABLES LIKE "users"');
    if (tables.length > 0) {
      console.log('✅ Verification: Users table exists');
    } else {
      console.log('❌ Verification failed: Users table not found');
    }

    console.log('✅ Database setup completed successfully!');
    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create tables:', error);
    await database.close();
    process.exit(1);
  }
}

// Run table creation
createTables();
