const database = require('../config/database');

/**
 * Reset Database
 * Drops and recreates the database completely
 */

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');

    // Connect to database
    await database.connect();
    const pool = database.getPool();

    // Drop all tables
    console.log('🗑️  Dropping existing tables...');
    await pool.query('DROP TABLE IF EXISTS generations');
    await pool.query('DROP TABLE IF EXISTS users');
    console.log('✅ Tables dropped');

    // Recreate tables
    console.log('🏗️  Recreating tables...');

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
    console.log('✅ Users table created');

    // Create generations table
    const createGenerationsTable = `
      CREATE TABLE IF NOT EXISTS generations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        jobId VARCHAR(255) UNIQUE NOT NULL,
        userId INT,
        modelId VARCHAR(255),
        provider VARCHAR(100),
        pose VARCHAR(100),
        prompt TEXT,
        imageUrl VARCHAR(500),
        status VARCHAR(50) DEFAULT 'processing',
        processingTime INT,
        metadata JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_jobId (jobId),
        INDEX idx_userId (userId),
        INDEX idx_status (status),
        INDEX idx_createdAt (createdAt),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await pool.query(createGenerationsTable);
    console.log('✅ Generations table created');

    console.log('✅ Database reset completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run seed:users');
    console.log('   2. Or run: npm run setup:prod');

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to reset database:', error);
    await database.close();
    process.exit(1);
  }
}

// Run reset
resetDatabase();
