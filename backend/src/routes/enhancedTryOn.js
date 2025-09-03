const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const EnhancedProductAnalysisService = require('../services/enhancedProductAnalysis');
const AdaptiveRetrySystem = require('../services/adaptiveRetrySystem');
const ValidationEngine = require('../services/validationEngine');
const { KUSTOMPEDIA_MODELS } = require('../config/models');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Initialize services
const productAnalysisService = new EnhancedProductAnalysisService();
const adaptiveRetrySystem = new AdaptiveRetrySystem();
const validationEngine = new ValidationEngine();

/**
 * POST /api/enhanced-tryon/generate
 * Generate try-on image with enhanced quality control
 */
router.post('/generate', upload.single('productImage'), async (req, res) => {
  try {
    const {
      modelId,
      pose,
      qualityTier = 'standard',
      enableRetry = true,
      maxRetries,
      productAnalysis
    } = req.body;

    // Validate required parameters
    if (!modelId || !pose) {
      return res.status(400).json({
        success: false,
        error: 'Model ID and pose are required'
      });
    }

    if (!KUSTOMPEDIA_MODELS[modelId]) {
      return res.status(400).json({
        success: false,
        error: `Invalid model ID: ${modelId}`
      });
    }

    let productImagePath = null;
    let analysis = null;

    // Handle product image and analysis
    if (req.file) {
      productImagePath = req.file.path;
      console.log('🔍 Analyzing uploaded product image...');
      analysis = await productAnalysisService.analyzeProduct(productImagePath);
    } else if (productAnalysis) {
      analysis = JSON.parse(productAnalysis);
    }

    if (!analysis) {
      return res.status(400).json({
        success: false,
        error: 'Product image or analysis is required'
      });
    }

    console.log(`🎯 Starting enhanced generation for ${modelId} in ${pose} pose`);

    // Prepare generation request
    const generationRequest = {
      modelId,
      pose,
      productImagePath,
      productAnalysis: analysis,
      qualityTier,
      timestamp: Date.now()
    };

    let result;
    
    if (enableRetry) {
      // Configure retry system if custom settings provided
      if (maxRetries) {
        adaptiveRetrySystem.updateConfiguration({ maxRetries: parseInt(maxRetries) });
      }
      
      // Use adaptive retry system
      result = await adaptiveRetrySystem.executeWithRetry(generationRequest);
    } else {
      // Direct generation without retry
      const enhancedGeneration = adaptiveRetrySystem.enhancedGeneration;
      const generationResult = await enhancedGeneration.generateMultiStage(generationRequest);
      
      if (generationResult.success) {
        // Validate the result
        const validationRequest = {
          generatedImagePath: generationResult.imagePath,
          modelId,
          expectedPose: pose,
          productImagePath,
          productAnalysis: analysis,
          qualityTier
        };
        
        const validationResult = await validationEngine.validateImageQuality(validationRequest);
        
        result = {
          success: true,
          result: generationResult,
          validation: validationResult,
          attempts: 1,
          retryHistory: [],
          finalQualityScore: validationResult.overallQuality
        };
      } else {
        result = {
          success: false,
          error: generationResult.error,
          attempts: 1,
          retryHistory: []
        };
      }
    }

    // Prepare response
    const response = {
      success: result.success,
      timestamp: new Date().toISOString(),
      qualityTier,
      attempts: result.attempts,
      processingTime: Date.now() - generationRequest.timestamp
    };

    if (result.success) {
      response.imagePath = result.result.imagePath;
      response.imageUrl = `/uploads/${path.basename(result.result.imagePath)}`;
      response.validation = {
        passes: result.validation.passes,
        overallQuality: result.validation.overallQuality,
        consistency: {
          face: result.validation.consistency.faceConsistency,
          pose: result.validation.consistency.poseAccuracy
        },
        accuracy: {
          color: result.validation.accuracy.colorAccuracy,
          style: result.validation.accuracy.styleAccuracy,
          branding: result.validation.accuracy.brandingAccuracy
        },
        feedback: result.validation.feedback
      };
      response.retryHistory = result.retryHistory;
    } else {
      response.error = result.error;
      response.retryHistory = result.retryHistory;
      response.recommendations = result.recommendations;
    }

    console.log(`${result.success ? '✅' : '❌'} Generation completed in ${response.attempts} attempts`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Enhanced generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/enhanced-tryon/models
 * Get available models with their capabilities
 */
router.get('/models', (req, res) => {
  try {
    const models = Object.entries(KUSTOMPEDIA_MODELS).map(([id, model]) => ({
      id,
      name: model.name,
      characteristics: model.characteristics,
      poses: model.poses,
      referenceImageUrl: `/models/${path.basename(model.referenceImagePath)}`
    }));

    res.json({
      success: true,
      models,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get models:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/enhanced-tryon/quality-tiers
 * Get available quality tiers and their thresholds
 */
router.get('/quality-tiers', (req, res) => {
  try {
    const qualityTiers = {
      standard: {
        name: 'Standard',
        description: 'Balanced quality and speed',
        thresholds: {
          overall: 0.65,
          consistency: { face: 0.65, pose: 0.55 },
          accuracy: { color: 0.65, style: 0.55, branding: 0.75 }
        },
        estimatedTime: '30-60 seconds'
      },
      premium: {
        name: 'Premium',
        description: 'Higher quality with more processing time',
        thresholds: {
          overall: 0.75,
          consistency: { face: 0.75, pose: 0.65 },
          accuracy: { color: 0.75, style: 0.65, branding: 0.85 }
        },
        estimatedTime: '60-120 seconds'
      },
      ultra: {
        name: 'Ultra',
        description: 'Maximum quality for professional use',
        thresholds: {
          overall: 0.85,
          consistency: { face: 0.85, pose: 0.75 },
          accuracy: { color: 0.85, style: 0.75, branding: 0.90 }
        },
        estimatedTime: '120-300 seconds'
      }
    };

    res.json({
      success: true,
      qualityTiers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get quality tiers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  console.error('❌ Route error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

module.exports = router;