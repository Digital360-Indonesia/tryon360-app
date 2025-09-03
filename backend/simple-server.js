const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { KUSTOMPEDIA_MODELS, GARMENT_TYPES, QUALITY_SETTINGS } = require('./src/config/models');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Models endpoints
app.get('/api/models', (req, res) => {
  try {
    const models = Object.values(KUSTOMPEDIA_MODELS).map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      characteristics: model.characteristics,
      poses: model.poses,
      avatar: model.avatar
    }));

    res.json({
      success: true,
      models
    });
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

app.get('/api/models/garments', (req, res) => {
  try {
    const garments = Object.entries(GARMENT_TYPES).map(([id, garment]) => ({
      id,
      name: garment.name,
      description: garment.description,
      logoPositions: garment.logoPositions
    }));

    res.json({
      success: true,
      garments
    });
  } catch (error) {
    console.error('Error getting garment types:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

app.get('/api/models/quality-settings', (req, res) => {
  try {
    const qualitySettings = Object.entries(QUALITY_SETTINGS).map(([id, setting]) => ({
      id,
      name: setting.name,
      size: setting.size,
      cost: setting.cost,
      description: setting.description
    }));

    res.json({
      success: true,
      qualitySettings
    });
  } catch (error) {
    console.error('Error getting quality settings:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Basic try-on endpoint (returns mock response for now)
app.post('/api/tryon/generate', (req, res) => {
  res.json({
    success: false,
    error: 'Try-on generation temporarily disabled for debugging'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple Backend running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;