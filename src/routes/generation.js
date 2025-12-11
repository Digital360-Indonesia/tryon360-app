const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AIService = require('../services/aiService');
const ImageProcessor = require('../services/imageProcessor');
const { PROFESSIONAL_MODELS } = require('../config/models');
const Generation = require('../models/Generation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 4 // product + 3 details max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
  }
});

// Initialize services
const aiService = new AIService();
const imageProcessor = new ImageProcessor();

/**
 * POST /api/generation/try-on
 * Generate try-on image with multiple uploads
 */
router.post('/try-on', upload.fields([
  { name: 'productImage', maxCount: 1 },
  { name: 'detail1', maxCount: 1 },
  { name: 'detail2', maxCount: 1 },
  { name: 'detail3', maxCount: 1 }
]), async (req, res) => {
  const jobId = uuidv4();
  
  try {
    
    // Extract form data
    const {
      modelId,
      pose = 'professional_standing',
      providerId = 'flux_kontext',
      garmentDescription,
      embroideryPosition1,
      embroideryDescription1,
      embroideryPosition2, 
      embroideryDescription2,
      embroideryPosition3,
      embroideryDescription3
    } = req.body;

    // Validate required fields
    if (!modelId || !PROFESSIONAL_MODELS[modelId]) {
      return res.status(400).json({
        success: false,
        error: 'Valid model ID is required'
      });
    }

    if (!req.files || !req.files.productImage) {
      return res.status(400).json({
        success: false,
        error: 'Product image is required'
      });
    }

    // Initialize job tracking in MongoDB
    const generation = new Generation({
      jobId,
      modelId,
      pose,
      provider: providerId,
      status: 'processing',
      progress: 0,
      userIp: req.ip,
      userAgent: req.get('User-Agent')
    });

    await generation.save();

    // Update progress
    const updateProgress = async (stage, progress) => {
      try {
        await Generation.updateOne(
          { jobId },
          {
            progress,
            // You could add a stage field if needed
            // metadata: { lastStage: stage }
          }
        );
      } catch (error) {
        // Error updating progress
      }
    };

    updateProgress('Processing uploads', 10);

    // Process uploaded images
    const processedFiles = {};
    const uploadedImages = [];

    // Process product image
    const productResult = await imageProcessor.processUpload(req.files.productImage[0], 'product');
    processedFiles.product = productResult;
    uploadedImages.push(productResult.path);

    updateProgress('Processing detail uploads', 30);

    // Process detail images
    const detailFiles = ['detail1', 'detail2', 'detail3'];
    const embroideryDetails = [];

    for (let i = 0; i < detailFiles.length; i++) {
      const detailKey = detailFiles[i];
      if (req.files[detailKey] && req.files[detailKey][0]) {
        const detailResult = await imageProcessor.processUpload(req.files[detailKey][0], detailKey);
        processedFiles[detailKey] = detailResult;
        uploadedImages.push(detailResult.path);

        // Build embroidery detail
        const positionKey = `embroideryPosition${i + 1}`;
        const descriptionKey = `embroideryDescription${i + 1}`;
        
        if (req.body[positionKey] && req.body[descriptionKey]) {
          embroideryDetails.push({
            position: req.body[positionKey],
            description: req.body[descriptionKey],
            imagePath: detailResult.path
          });
        }
      }
    }

    updateProgress('Building generation prompt', 50);

    // Prepare generation request with product analysis
    const generationRequest = {
      providerId,
      modelId,
      pose,
      garmentDescription: garmentDescription || 'uploaded garment',
      embroideryDetails,
      uploadedImages,
      productAnalysis: processedFiles.product?.analysis || null,
      // CRITICAL: Pass original uploaded image buffers for composite creation
      originalProductBuffer: req.files.productImage[0].buffer,
      originalProductMimeType: req.files.productImage[0].mimetype,
      originalDetailBuffer: req.files.detail1 ? req.files.detail1[0].buffer : null,
      originalDetailMimeType: req.files.detail1 ? req.files.detail1[0].mimetype : null,
      jobId
    };

    // Validate provider capabilities
    const providerValidation = aiService.validateProviderCapabilities(providerId, generationRequest);
    if (!providerValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Provider validation failed',
        details: providerValidation.errors
      });
    }

    updateProgress('Generating image', 70);

    // Generate try-on image
    const generationResult = await aiService.generateTryOn(generationRequest);

    updateProgress('Finalizing', 90);

    // Update job status in MongoDB
    await generation.complete({
      imageUrl: `/generated/${path.basename(generationResult.imagePath)}`,
      imagePath: generationResult.imagePath,
      prompt: generationResult.prompt,
      metadata: generationResult.metadata,
      processedFiles: Object.keys(processedFiles).map(key => ({
        type: key,
        filename: processedFiles[key].filename,
        analysis: processedFiles[key].analysis
      }))
    });

    updateProgress('Complete', 100);

    // Return result
    res.json({
      success: true,
      jobId: jobId,
      result: {
        imageUrl: `/generated/${path.basename(generationResult.imagePath)}`,
        imagePath: generationResult.imagePath,
        provider: generationResult.provider,
        prompt: generationResult.prompt,
        metadata: generationResult.metadata,
        processedFiles: Object.keys(processedFiles).map(key => ({
          type: key,
          filename: processedFiles[key].filename,
          analysis: processedFiles[key].analysis
        }))
      },
      processingTime: generation.processingTime
    });

  } catch (error) {

    // Update job status in MongoDB
    try {
      if (generation) {
        await generation.fail(error.message);
      }
    } catch (dbError) {
      // Database error updating job status
    }

    res.status(500).json({
      success: false,
      jobId: jobId,
      error: error.message
    });
  }
});


/**
 * GET /api/generation/providers
 * Get available AI providers
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = aiService.getAvailableProviders();
    
    // Add status for each provider
    const providersWithStatus = await Promise.all(
      providers.map(async (provider) => {
        const status = await aiService.getProviderStatus(provider.id);
        return {
          ...provider,
          ...status
        };
      })
    );

    res.json({
      success: true,
      providers: providersWithStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/generation/job/:jobId
 * Cancel generation job
 */
router.delete('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const generation = await Generation.findOne({ jobId });

    if (!generation) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (generation.status === 'processing') {
      // Update status to cancelled
      generation.status = 'cancelled';
      generation.endTime = new Date();
      await generation.save();
    }

    res.json({
      success: true,
      message: 'Job cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Note: Generated images are served via static middleware in server.js at /generated/

/**
 * POST /api/generation/cleanup
 * Clean up old files
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAgeHours = 24 } = req.body;
    const result = await imageProcessor.cleanupOldFiles(maxAgeHours);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/generation/status/:jobId
 * Get generation job status
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const generation = await Generation.findOne({ jobId });

    if (!generation) {
      return res.status(404).json({
        success: false,
        error: 'Generation job not found'
      });
    }

    res.json({
      success: true,
      jobId: generation.jobId,
      status: generation.status,
      progress: generation.progress,
      imageUrl: generation.imageUrl,
      error: generation.error,
      processingTime: generation.processingTime,
      createdAt: generation.createdAt,
      updatedAt: generation.updatedAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/generation/history
 * Get generation history
 */
router.get('/history', async (req, res) => {
  try {
    const { modelId, limit = 20, page = 1 } = req.query;

    const query = {};
    if (modelId) {
      query.modelId = modelId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const generations = await Generation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-metadata -processedFiles');

    const total = await Generation.countDocuments(query);

    res.json({
      success: true,
      data: generations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;