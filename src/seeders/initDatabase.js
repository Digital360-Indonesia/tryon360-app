const bcrypt = require('bcrypt');
const database = require('../config/database');

/**
 * Initialize Database for Production
 * - Create/Recreate all tables with correct schema
 * - Seed initial data (admin user)
 * - Setup complete database structure for production use
 */

async function initDatabase() {
  try {
    console.log('🔧 Starting database initialization...\n');

    // Connect to database
    await database.connect();
    const pool = database.getPool();

    // ============================================
    // 1. DROP EXISTING TABLES (Clean Slate)
    // ============================================
    console.log('🗑️  Dropping existing tables...');
    await pool.query('DROP TABLE IF EXISTS token_transactions');
    await pool.query('DROP TABLE IF EXISTS generations');
    await pool.query('DROP TABLE IF EXISTS users');
    console.log('✅ Existing tables dropped\n');

    // ============================================
    // 2. CREATE TABLES
    // ============================================
    console.log('📝 Creating tables...');

    // Users table
    await pool.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phoneNumber VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user' NOT NULL,
        tokens INT DEFAULT 3 NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phoneNumber (phoneNumber),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Users table created');

    // Generations table
    await pool.query(`
      CREATE TABLE generations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        jobId VARCHAR(255) NOT NULL UNIQUE,
        userId INT NOT NULL,
        modelId VARCHAR(100) NOT NULL,
        pose VARCHAR(50) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        status ENUM('processing', 'completed', 'failed', 'cancelled') DEFAULT 'processing' NOT NULL,
        progress INT DEFAULT 0 NOT NULL,
        imageUrl TEXT,
        imagePath TEXT,
        prompt TEXT,
        metadata JSON,
        processingTime INT DEFAULT 0,
        userIp VARCHAR(45),
        userAgent TEXT,
        startTime TIMESTAMP NULL,
        endTime TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_jobId (jobId),
        INDEX idx_userId (userId),
        INDEX idx_status (status),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Generations table created');

    // Token transactions table
    await pool.query(`
      CREATE TABLE token_transactions (
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
    console.log('✅ Token transactions table created\n');

    // ============================================
    // 3. SEED INITIAL DATA
    // ============================================
    console.log('🌱 Seeding initial data...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('Ber217antok', 10);
    await pool.query(`
      INSERT INTO users (phoneNumber, name, password, role, tokens, createdAt, updatedAt)
      VALUES ('085156858298', 'Admin', ?, 'admin', 100, NOW(), NOW())
    `, [hashedPassword]);
    console.log('✅ Admin user created (085156858298 / Ber217antok / 100 tokens)');

    // Create test regular user
    const testUserPassword = await bcrypt.hash('test123', 10);
    await pool.query(`
      INSERT INTO users (phoneNumber, name, password, role, tokens, createdAt, updatedAt)
      VALUES ('08123456789', 'Test User', ?, 'user', 3, NOW(), NOW())
    `, [testUserPassword]);
    console.log('✅ Test user created (08123456789 / test123 / 3 tokens)\n');

    // ============================================
    // 4. SHOW TABLE STRUCTURES
    // ============================================
    console.log('📊 Final table structures:\n');

    // Users table
    const [usersColumns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('👥 Users Table:');
    usersColumns.forEach(col => {
      const key = col.COLUMN_KEY === 'PRI' ? '🔑' : col.COLUMN_KEY === 'UNI' ? '🔒' : '  ';
      console.log(`   ${key} ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.IS_NULLABLE === 'NO' ? ' NOT NULL' : ''}${col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
    });

    // Generations table
    const [genColumns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'generations'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('\n🎨 Generations Table:');
    genColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.IS_NULLABLE === 'NO' ? ' NOT NULL' : ''}${col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
    });

    // Token transactions table
    const [tokenColumns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'token_transactions'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('\n💰 Token Transactions Table:');
    tokenColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.IS_NULLABLE === 'NO' ? ' NOT NULL' : ''}${col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
    });

    // Show seeded users
    const [users] = await pool.query('SELECT id, phoneNumber, name, role, tokens FROM users');
    console.log('\n👥 Seeded Users:');
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.role}): ${user.phoneNumber} | ${user.tokens} tokens`);
    });

    console.log('\n✅ Database initialization completed successfully!');
    console.log('🎉 Database is ready for production use!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initDatabase();
