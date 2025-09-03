const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Import routes
const tryOnRoutes = require('./src/routes/tryOn');
const modelsRoutes = require('./src/routes/models');
const queueRoutes = require('./src/routes/queue');
const testRoutes = require('./src/routes/test');
const { router: creditsRoutes } = require('./src/routes/credits');
const costsRoutes = require('./src/routes/costs');
const creditManagementRoutes = require('./src/routes/creditManagement');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/tryon', tryOnRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/test', testRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/credit-management', creditManagementRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Kustompedia Try-On Platform Backend running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
