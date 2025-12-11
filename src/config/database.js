const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/garment-tryon';

      this.connection = await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log('✅ Connected to MongoDB');
      console.log(`📊 Database: ${this.connection.connection.name}`);

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  getConnection() {
    return this.connection;
  }

  async healthCheck() {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      return {
        status: states[state],
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = new Database();