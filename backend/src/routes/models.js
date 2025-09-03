const express = require('express');
const { KUSTOMPEDIA_MODELS, GARMENT_TYPES, QUALITY_SETTINGS } = require('../config/models');
const ImageGeneratorService = require('../services/imageGenerator');

const router = express.Router();
const imageGenerator = new ImageGeneratorService();

// GET /api/models
// Get all available Kustompedia models
router.get('/', (req, res) => {
  try {
    const models = Object.keys(KUSTOMPEDIA_MODELS).map(key => ({
      id: key,
      ...KUSTOMPEDIA_MODELS[key]
    }));

    res.json({
      success: true,
      models: models
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/models/generative
// Get available generative AI models (GPT, FLUX, etc.)
router.get('/generative', (req, res) => {
  try {
    const models = imageGenerator.getAvailableModels();
    const defaultModel = imageGenerator.getDefaultModel();

    res.json({
      success: true,
      models: models,
      defaultModel: defaultModel
    });
  } catch (error) {
    console.error('Error fetching generative models:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/models/garments
// Get all available garment types
router.get('/garments', (req, res) => {
  try {
    const garments = Object.keys(GARMENT_TYPES).map(key => ({
      id: key,
      ...GARMENT_TYPES[key]
    }));

    res.json({
      success: true,
      garments: garments
    });
  } catch (error) {
    console.error('Error fetching garments:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/models/quality
// Get available quality settings
router.get('/quality', (req, res) => {
  try {
    const qualities = Object.keys(QUALITY_SETTINGS).map(key => ({
      id: key,
      ...QUALITY_SETTINGS[key]
    }));

    res.json({
      success: true,
      qualities: qualities
    });
  } catch (error) {
    console.error('Error fetching quality settings:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/models/finetune
// Get available finetuned models and their status
router.get('/finetune', (req, res) => {
  try {
    const finetuneModels = imageGenerator.getAvailableFinetuneModels();

    res.json({
      success: true,
      models: finetuneModels
    });
  } catch (error) {
    console.error('Error fetching finetune models:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/models/finetune/initialize
// Initialize finetuning for all 3 models
router.post('/finetune/initialize', async (req, res) => {
  try {
    console.log('🎆 Starting finetuning initialization for all models');
    
    const results = await imageGenerator.initializeFinetuning();
    
    res.json({
      success: true,
      message: 'Finetuning initialization started',
      results: results
    });
  } catch (error) {
    console.error('Error initializing finetuning:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/models/finetune/:modelId/status
// Check finetune status for a specific model
router.get('/finetune/:modelId/status', async (req, res) => {
  try {
    const { modelId } = req.params;
    
    const statusResult = await imageGenerator.checkFinetuneStatus(modelId);
    
    res.json(statusResult);
  } catch (error) {
    console.error('Error checking finetune status:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;