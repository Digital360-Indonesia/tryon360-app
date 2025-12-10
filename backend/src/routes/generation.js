const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AIService = require('../services/aiService');
const ImageProcessor = require('../services/imageProcessor');
const { PROFESSIONAL_MODELS } = require('../config/models');

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

// Store for tracking generations (in production, use Redis/database)
const generationJobs = new Map();

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
    console.log('=== Generation Request Debug ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
    
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

    // Initialize job tracking
    generationJobs.set(jobId, {
      status: 'processing',
      startTime: Date.now(),
      modelId,
      pose,
      providerId,
      progress: 0
    });

    // Update progress
    const updateProgress = (stage, progress) => {
      const job = generationJobs.get(jobId);
      if (job) {
        job.stage = stage;
        job.progress = progress;
        generationJobs.set(jobId, job);
      }
    };

    updateProgress('Processing uploads', 10);

    // Process uploaded images
    const processedFiles = {};
    const uploadedImages = [];

    // Process product image
    console.log('Processing product image:', req.files.productImage[0].originalname, req.files.productImage[0].size, 'bytes');
    console.log('Product image mimetype:', req.files.productImage[0].mimetype);
    const productResult = await imageProcessor.processUpload(req.files.productImage[0], 'product');
    console.log('Product analysis result:', JSON.stringify(productResult.analysis, null, 2));
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

    // Update job status
    generationJobs.set(jobId, {
      ...generationJobs.get(jobId),
      status: 'completed',
      result: generationResult,
      progress: 100,
      endTime: Date.now()
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
      processingTime: Date.now() - generationJobs.get(jobId).startTime
    });

  } catch (error) {
    console.error('Generation error:', error);
    
    // Update job status
    generationJobs.set(jobId, {
      ...generationJobs.get(jobId),
      status: 'failed',
      error: error.message,
      endTime: Date.now()
    });

    res.status(500).json({
      success: false,
      jobId: jobId,
      error: error.message
    });
  }
});

/**
 * GET /api/generation/job/:jobId
 * Get generation job status
 */
router.get('/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = generationJobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }

  res.json({
    success: true,
    job: {
      id: jobId,
      status: job.status,
      progress: job.progress,
      stage: job.stage,
      startTime: job.startTime,
      endTime: job.endTime,
      result: job.result,
      error: job.error
    }
  });
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
router.delete('/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = generationJobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }

  if (job.status === 'processing') {
    // In a full implementation, this would cancel the actual AI request
    job.status = 'cancelled';
    job.endTime = Date.now();
    generationJobs.set(jobId, job);
  }

  res.json({
    success: true,
    message: 'Job cancelled successfully'
  });
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

module.exports = router;