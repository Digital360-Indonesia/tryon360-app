const database = require('../config/database');

/**
 * Add Token System to Database
 * - Add role and tokens columns to users table
 * - Create token_transactions table
 */

async function addTokenSystem() {
  try {
    console.log('🔧 Starting token system setup...');

    // Connect to database
    await database.connect();
    const pool = database.getPool();

    // Check existing columns in users table
    console.log('🔍 Checking users table columns...');
    const [userColumns] = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
    `);

    const existingUserColumns = userColumns.map(col => col.COLUMN_NAME);
    console.log('📋 Existing users columns:', existingUserColumns);

    // Add role column if not exists
    if (!existingUserColumns.includes('role')) {
      console.log('➕ Adding role column to users...');
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN role ENUM('admin', 'user') DEFAULT 'user'
      `);
      console.log('✅ Role column added to users');
    } else {
      console.log('⏭️  Role column already exists in users');
    }

    // Add tokens column if not exists
    if (!existingUserColumns.includes('tokens')) {
      console.log('➕ Adding tokens column to users...');
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN tokens INT DEFAULT 3
      `);
      console.log('✅ Tokens column added to users');
    } else {
      console.log('⏭️  Tokens column already exists in users');
    }

    // Update existing admin user to have role='admin' and tokens=100
    console.log('🔄 Updating admin user...');
    await pool.query(`
      UPDATE users
      SET role = 'admin', tokens = 100
      WHERE phoneNumber = '085156858298'
    `);
    console.log('✅ Admin user updated');

    // Create token_transactions table
    console.log('📝 Creating token_transactions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS token_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        type ENUM('added', 'used', 'refunded') NOT NULL,
        amount INT NOT NULL,
        description TEXT,
        generationId INT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (generationId) REFERENCES generations(id) ON DELETE SET NULL,
        INDEX idx_userId (userId),
        INDEX idx_type (type),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Token transactions table created');

    // Show final users table structure
    console.log('\n📊 Users table structure:');
    const [finalUserColumns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);

    finalUserColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE})${col.COLUMN_DEFAULT ? ` default ${col.COLUMN_DEFAULT}` : ''}`);
    });

    // Show token_transactions table structure
    console.log('\n📊 Token transactions table structure:');
    const [tokenColumns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'token_transactions'
      ORDER BY ORDINAL_POSITION
    `);

    tokenColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE})${col.COLUMN_DEFAULT ? ` default ${col.COLUMN_DEFAULT}` : ''}`);
    });

    console.log('\n✅ Token system setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Token system setup failed:', error);
    process.exit(1);
  }
}

// Run setup
addTokenSystem();
