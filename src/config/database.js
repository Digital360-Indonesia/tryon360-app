const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🔌 Initializing MySQL connection...');
console.log('📊 Database config:', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'tryon',
  user: process.env.DB_USER || 'root'
});

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tryon',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async connect() {
    try {
      console.log('🔗 Connecting to MySQL...');
      const connection = await this.pool.getConnection();
      console.log('✅ MySQL connected successfully!');

      // Test query
      await connection.query('SELECT 1');
      console.log('✅ MySQL test query passed');

      connection.release();
      return this.pool;
    } catch (error) {
      console.error('❌ MySQL connection failed:', {
        error: error.message,
        code: error.code,
        errno: error.errno
      });
      throw error;
    }
  }

  async createTables() {
    try {
      console.log('🏗️ Creating database tables...');

      // Create generations table
      const createGenerationsTable = `
        CREATE TABLE IF NOT EXISTS generations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          jobId VARCHAR(255) UNIQUE NOT NULL,
          modelId VARCHAR(100) NOT NULL,
          pose VARCHAR(100) DEFAULT 'professional_standing',
          provider VARCHAR(100) DEFAULT 'flux_kontext',
          status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
          progress INT DEFAULT 0,
          userIp VARCHAR(45),
          userAgent TEXT,
          imageUrl VARCHAR(500),
          imagePath VARCHAR(500),
          prompt TEXT,
          metadata JSON,
          error TEXT,
          processingTime INT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          endTime TIMESTAMP NULL,
          INDEX idx_jobId (jobId),
          INDEX idx_status (status),
          INDEX idx_createdAt (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      await this.pool.query(createGenerationsTable);
      console.log('✅ Generations table created successfully');

      return true;
    } catch (error) {
      console.error('❌ Failed to create tables:', error);
      throw error;
    }
  }

  getPool() {
    return this.pool;
  }

  async healthCheck() {
    try {
      const connection = await this.pool.getConnection();
      const [rows] = await connection.query('SELECT CONNECTION_ID() as id');
      connection.release();

      return {
        status: 'connected',
        database: process.env.DB_NAME || 'tryon',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        connectionId: rows[0].id
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async close() {
    try {
      await this.pool.end();
      console.log('✅ MySQL connection closed');
    } catch (error) {
      console.error('❌ Error closing MySQL connection:', error);
    }
  }
}

const database = new Database();

module.exports = database;