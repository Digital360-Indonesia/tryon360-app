const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import database connection
const database = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3000; // Default to 3000 for single app

// Middleware
// CORS configuration - allow local development and Vercel deployment
const allowedOrigins = [
  'http://localhost:7007',
  'http://localhost:3000',
  'http://localhost:9901',
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  // Add your Vercel deployment URL here
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/models', express.static(path.join(__dirname, 'models')));

// Serve React build files (always serve for single port setup)
app.use(express.static(path.join(__dirname, 'build')));

// Serve generated files from single location
const generatedPath = path.join(__dirname, 'generated');
console.log(`📁 Serving generated files from: ${generatedPath}`);
app.use('/generated', express.static(generatedPath));

// Health check (both /health and /api/health)
const healthHandler = async (req, res) => {
  const dbHealth = await database.healthCheck();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: dbHealth
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes
app.use('/api/models', require('./src/routes/models'));
app.use('/api/generation', require('./src/routes/generation'));
app.use('/api/auth', require('./src/routes/auth'));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large. Maximum size is 10MB.'
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file upload.'
    });
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// Serve React app for any non-API routes (both production and development)
if (process.env.NODE_ENV === 'production') {
  // In production, serve built React app
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build/index.html'));
  });
} else {
  // In development, also serve the built React app
  // Check if build directory exists, if not serve a simple message
  const buildPath = path.join(__dirname, 'build');
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  } else {
    // If no build directory exists, return helpful message
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Frontend build not found. Please run "npm run build" in the client directory first.',
        suggestion: 'The React frontend needs to be built before it can be served in development mode.'
      });
    });
  }
}

// Start server
app.listen(PORT, async () => {
  const isProduction = process.env.NODE_ENV === 'production';

  console.log(`✅ Try-On App running on port ${PORT}`);
  console.log(`🌐 Application: http://localhost:${PORT}`);
  console.log(`📁 Environment: ${isProduction ? 'production' : 'development'}`);

  if (isProduction) {
    console.log('🎨 Frontend and Backend combined');
  }

  // Connect to MySQL
  try {
    console.log('🔗 Connecting to MySQL database...');
    await database.connect();

    // Create tables if they don't exist
    console.log('🏗️ Ensuring database tables exist...');
    await database.createTables();

    console.log('✅ MySQL connection established successfully!');
  } catch (error) {
    console.error('❌ Failed to connect to MySQL:', error);
    process.exit(1);
  }

  // Validate API keys
  const requiredKeys = ['GEMINI_API_KEY', 'FLUX_API_KEY'];
  const missingKeys = requiredKeys.filter(key => !process.env[key]);

  if (missingKeys.length > 0) {
    console.warn(`⚠️  Missing API keys: ${missingKeys.join(', ')}`);
  } else {
    console.log('🔑 All API keys configured');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});