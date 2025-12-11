const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // Default to 3000 for single app

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/models', express.static(path.join(__dirname, 'models')));

// Serve React build files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

// Serve generated files from single location
const generatedPath = path.join(__dirname, 'generated');
console.log(`📁 Serving generated files from: ${generatedPath}`);
app.use('/generated', express.static(generatedPath));

// Health check (both /health and /api/health)
const healthHandler = (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes
app.use('/api/models', require('./src/routes/models'));
app.use('/api/generation', require('./src/routes/generation'));

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

// API Routes
app.use('/api/models', require('./src/routes/models'));
app.use('/api/generation', require('./src/routes/generation'));

// In production, serve React app for any non-API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build/index.html'));
  });
} else {
  // In development, return 404 for non-API routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });
  });
}

// Start server
app.listen(PORT, () => {
  const isProduction = process.env.NODE_ENV === 'production';

  console.log(`✅ Try-On App running on port ${PORT}`);
  console.log(`🌐 Application: http://localhost:${PORT}`);
  console.log(`📁 Environment: ${isProduction ? 'production' : 'development'}`);

  if (isProduction) {
    console.log('🎨 Frontend and Backend combined');
  }

  // Validate API keys
  const requiredKeys = ['OPENAI_API_KEY', 'FLUX_API_KEY'];
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