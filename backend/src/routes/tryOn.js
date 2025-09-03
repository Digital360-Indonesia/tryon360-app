const express = require('express');
const multer = require('multer');
const path = require('path');
const ImageGeneratorService = require('../services/imageGenerator');
const queueManager = require('../services/queueManager');
const { KUSTOMPEDIA_MODELS, GARMENT_TYPES, QUALITY_SETTINGS } = require('../config/models');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'logoFile' ? 'logo' : 'upload';
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Setup for multiple file uploads (garment image, logo, and detail images)
const uploadFields = upload.fields([
  { name: 'garmentImage', maxCount: 1 },
  { name: 'logoFile', maxCount: 1 },
  { name: 'detailImages', maxCount: 5 } // Support up to 5 detail images for BFL playground approach
]);

const imageGenerator = new ImageGeneratorService();

// POST /api/tryon/bfl-playground
// BlackForest Lab playground-style generation with multiple images
router.post('/bfl-playground', uploadFields, async (req, res) => {
  try {
    const {
      modelId,
      garmentType = 'shirt',
      pose = 'one arm pose',
      customPrompt = '',
      quality = 'hd',
      priority = 'normal'
    } = req.body;

    // Validate required fields
    if (!modelId) {
      return res.status(400).json({
        error: 'Model ID is required'
      });
    }

    // Validate model exists
    const model = KUSTOMPEDIA_MODELS[modelId];
    if (!model) {
      return res.status(400).json({
        error: 'Invalid model ID'
      });
    }

    // Validate file uploads
    if (!req.files || !req.files.garmentImage) {
      return res.status(400).json({
        error: 'Product/garment image is required for BFL playground approach'
      });
    }

    // Extract uploaded files
    const garmentImagePath = req.files.garmentImage[0].path;
    const detailImagePaths = req.files.detailImages ? req.files.detailImages.map(file => file.path) : [];

    console.log('🎯 BFL Playground generation request:');
    console.log('   Model:', modelId);
    console.log('   Garment image:', garmentImagePath);
    console.log('   Detail images:', detailImagePaths.length);
    console.log('   Pose:', pose);

    // Create job data for BFL playground approach
    const jobData = {
      type: 'bfl-playground-generation',
      modelId,
      model,
      garmentType,
      pose,
      customPrompt,
      quality,
      priority,
      garmentImagePath,
      detailImagePaths,
      bflPlaygroundMode: true
    };

    // Add to queue
    const queueResult = queueManager.addJob(jobData);
    
    // If job started immediately, begin processing
    if (queueResult.status === 'processing') {
      processBFLPlaygroundJob(queueResult.jobId).catch(error => {
        console.error('❌ Error processing BFL playground job:', error);
        queueManager.completeJob(queueResult.jobId, { success: false, error: error.message });
      });
    }

    res.json({
      success: true,
      jobId: queueResult.jobId,
      status: queueResult.status,
      queuePosition: queueResult.position,
      estimatedWaitTime: queueResult.position * 45, // BFL playground is faster
      approach: 'bfl-playground'
    });

  } catch (error) {
    console.error('Error in BFL playground generation:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/tryon/generate
// Enhanced endpoint to generate try-on images with quality validation and adaptive retry
router.post('/generate', uploadFields, async (req, res) => {
  try {
    const {
      modelId,
      garmentType,
      garmentColor = '',
      logoDescription = '',
      logoPosition = '',
      pose = '',
      quality = 'hd',
      priority = 'normal',
      additionalDetails = '',
      logoFocusEnabled = 'false',
      generativeModel = 'flux'
    } = req.body;

    // Validate required fields
    if (!modelId || !garmentType) {
      return res.status(400).json({
        error: 'Model ID and garment type are required'
      });
    }

    // Validate model exists
    const model = KUSTOMPEDIA_MODELS[modelId];
    if (!model) {
      return res.status(400).json({
        error: 'Invalid model ID'
      });
    }

    // Validate garment type
    const garment = GARMENT_TYPES[garmentType];
    if (!garment) {
      return res.status(400).json({
        error: 'Invalid garment type'
      });
    }

    // Validate quality setting
    if (!QUALITY_SETTINGS[quality]) {
      return res.status(400).json({
        error: 'Invalid quality setting'
      });
    }

    // Enhanced generation options
    const {
      qualityTier = 'standard',
      enableRetry = 'true',
      maxRetries = '3',
      generationMode = 'auto',
      consistencyPriority = '0.7',
      accuracyPriority = '0.7',
      validationThreshold = '0.6',
      costLimit = '1.0'
    } = req.body;

    // Validate enhanced parameters
    const validTiers = ['basic', 'standard', 'premium', 'ultra'];
    if (!validTiers.includes(qualityTier)) {
      return res.status(400).json({
        error: `Invalid quality tier. Must be one of: ${validTiers.join(', ')}`
      });
    }

    // Create enhanced job data
    const jobData = {
      type: 'enhanced-try-on-generation',
      modelId,
      model,
      garmentType,
      garment,
      garmentColor,
      logoDescription,
      logoPosition,
      pose: pose || (model.poses && model.poses[0]) || 'Arms Crossed',
      quality,
      additionalDetails,
      garmentImagePath: req.files && req.files.garmentImage ? req.files.garmentImage[0].path : null,
      logoFilePath: req.files && req.files.logoFile ? req.files.logoFile[0].path : null,
      logoFocusEnabled: logoFocusEnabled === 'true',
      priority,
      generativeModel,
      // Enhanced options
      qualityTier,
      enableRetry: enableRetry === 'true',
      maxRetries: parseInt(maxRetries) || 3,
      generationMode,
      consistencyPriority: parseFloat(consistencyPriority) || 0.7,
      accuracyPriority: parseFloat(accuracyPriority) || 0.7,
      validationThreshold: parseFloat(validationThreshold) || 0.6,
      costLimit: parseFloat(costLimit) || 1.0,
      enhancedGeneration: false  // Temporarily disabled for stability
    };

    // Add to queue
    const queueResult = queueManager.addJob(jobData);
    
    // If job started immediately, begin processing
    if (queueResult.status === 'processing') {
      processGenerationJob(queueResult.jobId).catch(error => {
        console.error('❌ Error processing job:', error);
        queueManager.completeJob(queueResult.jobId, { success: false, error: error.message });
      });
    }

    res.json({
      success: true,
      jobId: queueResult.jobId,
      status: queueResult.status,
      queuePosition: queueResult.position,
      estimatedWaitTime: queueResult.position * 60 // Rough estimate: 1 minute per job
    });

  } catch (error) {
    console.error('Error in try-on generation:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/tryon/enhance-logo
// Endpoint to enhance logo details on existing image
router.post('/enhance-logo', uploadFields, async (req, res) => {
  try {
    const {
      logoDescription,
      logoPosition,
      priority = 'normal'
    } = req.body;

    if (!req.files || !req.files.originalImage) {
      return res.status(400).json({
        error: 'Original image is required'
      });
    }

    if (!logoDescription || !logoPosition) {
      return res.status(400).json({
        error: 'Logo description and position are required'
      });
    }

    const jobData = {
      type: 'logo-enhancement',
      originalImagePath: req.files.originalImage[0].path,
      logoFilePath: req.files.logoFile ? req.files.logoFile[0].path : null,
      logoDescription,
      logoPosition,
      priority
    };

    const queueResult = queueManager.addJob(jobData);
    
    if (queueResult.status === 'processing') {
      processLogoEnhancementJob(queueResult.jobId);
    }

    res.json({
      success: true,
      jobId: queueResult.jobId,
      status: queueResult.status,
      queuePosition: queueResult.position
    });

  } catch (error) {
    console.error('Error in logo enhancement:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/tryon/job/:jobId
// Get job status and result
router.get('/job/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = queueManager.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    const response = {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      startTime: job.startTime,
      estimatedCompletion: job.estimatedCompletion
    };

    if (job.status === 'completed') {
      response.result = job.result;
      response.completedAt = job.completedAt;
    }

    if (job.status === 'failed') {
      response.error = job.error;
      response.failedAt = job.failedAt;
    }

    if (job.status === 'pending') {
      response.queuePosition = queueManager.getQueuePosition(jobId);
    }

    res.json(response);

  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// DELETE /api/tryon/job/:jobId
// Cancel a job
router.delete('/job/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const canceledJob = queueManager.cancelJob(jobId);
    
    if (!canceledJob) {
      return res.status(404).json({
        error: 'Job not found or cannot be canceled'
      });
    }

    res.json({
      success: true,
      message: 'Job canceled successfully',
      jobId: canceledJob.id
    });

  } catch (error) {
    console.error('Error canceling job:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Helper function to process generation jobs
async function processGenerationJob(jobId) {
  const job = queueManager.getJob(jobId);
  if (!job) {
    console.error('❌ Job not found:', jobId);
    return;
  }

  try {
    console.log('🚀 Starting SIMPLE job processing for:', jobId);
    
    // Check credit limits before processing
    const creditManager = require('../services/creditManager');
    const requestCost = 0.04; // Standard generation cost
    const limitCheck = await creditManager.checkRequestAllowed(requestCost, 'standard');
    
    if (!limitCheck.allowed) {
      console.log('❌ Request blocked by credit limits:', limitCheck.reason);
      queueManager.failJob(jobId, `Request blocked: ${limitCheck.message}`);
      return;
    }
    
    if (limitCheck.warnings?.length > 0) {
      console.log('⚠️ Credit limit warnings:', limitCheck.warnings);
    }
    
    // Update progress
    queueManager.updateJobProgress(jobId, 10, 'building-prompt');

    // Skip complex analysis for speed - just do basic generation
    console.log('⚡ Using fast generation mode - skipping analysis');
    queueManager.updateJobProgress(jobId, 30, 'generating-image');

    // Build simple, fast prompt
    const garmentDesc = (job.garment && job.garment.name) || job.garmentType || 't-shirt';
    const colorDesc = job.garmentColor ? ` in ${job.garmentColor}` : '';
    const poseDesc = job.pose || 'Arms Crossed';
    
    const prompt = `Change the clothing to ${garmentDesc}${colorDesc}. Change pose to ${poseDesc.toLowerCase()}. FULL BODY SHOT: Show complete person from head to waist, not cropped, with proper spacing. Keep exact same face, hair, skin tone. Professional photography.`;
    
    // Create FLUX service instance
    const FluxService = require('../services/flux');
    const fluxService = new FluxService();
    
    console.log('📝 Simple prompt:', prompt);
    queueManager.updateJobProgress(jobId, 60, 'generating-image');

    // Simple FLUX generation without complex features
    let imageResult;
    try {
      // Use the same FLUX service instance
      imageResult = await fluxService.generateImageWithReference(
        job.model.referenceImage,
        prompt,
        {
          size: '1024x1024',
          model: 'flux',
          productImagePath: job.garmentImagePath, // Include product image if uploaded
          useFluxFill: job.garmentImagePath ? true : false, // Use FLUX Fill for inpainting when product uploaded
          useReverseApproach: false, // Disable reverse, use Fill instead
          useMultiStep: false // Disable multi-step, use Fill instead
        }
      );
    } catch (error) {
      console.error('❌ FLUX generation failed:', error);
      // Return a simple error result
      imageResult = {
        success: false,
        error: error.message
      };
    }

    console.log('🎨 Image generation result:', {
      success: imageResult.success,
      hasImageUrl: !!imageResult.imageUrl,
      imageUrl: imageResult.imageUrl?.substring(0, 50) + '...',
      error: imageResult.error
    });

    if (!imageResult.success) {
      console.error('❌ Image generation failed:', imageResult.error);
      queueManager.failJob(jobId, imageResult.error);
      return;
    }

    // Download and save the image locally
    queueManager.updateJobProgress(jobId, 90, 'saving-image');
    let localImagePath = null;
    
    if (imageResult.imageUrl) {
      try {
        console.log('📥 Downloading image from FLUX...');
        const FluxService = require('../services/flux');
        const fluxServiceInstance = new FluxService();
        const downloadResult = await fluxServiceInstance.downloadAndSaveImage(imageResult.imageUrl, `${jobId}.png`);
        if (downloadResult.success) {
          localImagePath = downloadResult.filePath;
          console.log('✅ Image saved locally:', localImagePath);
        } else {
          console.error('❌ Failed to download image:', downloadResult.error);
        }
      } catch (error) {
        console.error('❌ Error downloading image:', error);
      }
    }

    // Simple completion with correct URL path
    let finalImageUrl = imageResult.imageUrl; // Default to remote URL
    if (localImagePath) {
      // Convert local file path to URL path
      const fileName = path.basename(localImagePath);
      finalImageUrl = `/uploads/${fileName}`;
    }

    const result = {
      success: true,
      imageUrl: finalImageUrl,
      imagePath: localImagePath,
      remoteUrl: imageResult.imageUrl, // Keep remote URL as backup
      revisedPrompt: prompt,
      modelUsed: 'flux',
      cost: 0.04,
      dimensions: { width: 1024, height: 1024, ratio: '1:1' }
    };

    console.log('✅ Simple job completed successfully:', jobId);
    queueManager.completeJob(jobId, result);

    // Record credit usage and cost tracking
    try {
      const { recordCreditUsage } = require('./credits');
      recordCreditUsage({
        jobId,
        modelUsed: result.modelUsed || 'flux',
        quality: job.quality || 'standard',
        status: 'completed',
        cost: result.cost || 0.04,
        modelId: job.modelId,
        garmentType: job.garmentType
      });
      console.log('💳 Credit usage recorded successfully');
    } catch (error) {
      console.error('❌ Error recording credit usage:', error);
    }

    // Record cost in real-time cost tracker
    try {
      const costTracker = require('../services/costTracker');
      await costTracker.recordCost({
        jobId,
        modelUsed: result.modelUsed || 'flux',
        approach: 'standard',
        cost: result.cost || 0.04,
        quality: job.quality || 'standard',
        modelId: job.modelId,
        garmentType: job.garmentType,
        status: 'completed'
      });
    } catch (error) {
      console.error('❌ Error recording cost tracking:', error);
    }

    // Record cost in credit manager
    try {
      const creditManager = require('../services/creditManager');
      await creditManager.recordCost({
        jobId,
        modelUsed: result.modelUsed || 'flux',
        approach: 'standard',
        cost: result.cost || 0.04,
        quality: job.quality || 'standard',
        modelId: job.modelId,
        garmentType: job.garmentType,
        status: 'completed',
        emergencyUsed: limitCheck.emergencyUsed || false
      });
    } catch (error) {
      console.error('❌ Error recording credit management:', error);
    }


  } catch (error) {
    console.error('❌ Error processing generation job:', error);
    console.error('❌ Error details:', error.stack);
    queueManager.failJob(jobId, error.message);
  }
}

// Helper function to process logo enhancement jobs
async function processLogoEnhancementJob(jobId) {
  const job = queueManager.getJob(jobId);
  if (!job) return;

  try {
    queueManager.updateJobProgress(jobId, 20, 'analyzing-image');

    // Enhance the logo
    const enhanceResult = await imageGenerator.enhanceLogo(
      job.originalImagePath,
      job.logoFilePath,
      job.logoDescription,
      job.logoPosition,
      'gpt' // Logo enhancement uses GPT by default
    );

    if (!enhanceResult.success) {
      queueManager.failJob(jobId, enhanceResult.error);
      return;
    }

    queueManager.updateJobProgress(jobId, 70, 'downloading-enhanced-image');

    // Download enhanced image
    const filename = imageGenerator.generateUniqueFilename('enhanced', 'gpt');
    const saveResult = await imageGenerator.downloadAndSaveImage(enhanceResult.imageUrl, filename, 'gpt');

    if (!saveResult.success) {
      queueManager.failJob(jobId, saveResult.error);
      return;
    }

    const result = {
      originalImageUrl: `/uploads/${path.basename(job.originalImagePath)}`,
      enhancedImageUrl: `/uploads/${filename}`,
      enhancedImagePath: saveResult.filePath,
      logoDescription: job.logoDescription,
      logoPosition: job.logoPosition
    };

    queueManager.completeJob(jobId, result);

  } catch (error) {
    console.error('Error processing logo enhancement job:', error);
    queueManager.failJob(jobId, error.message);
  }
}

// Helper function to process BFL playground jobs
async function processBFLPlaygroundJob(jobId) {
  const job = queueManager.getJob(jobId);
  if (!job) {
    console.error('❌ BFL playground job not found:', jobId);
    return;
  }

  try {
    console.log('🎯 Starting BFL playground generation for:', jobId);
    
    // Check credit limits before processing
    const creditManager = require('../services/creditManager');
    const requestCost = 0.06; // BFL playground cost (slightly higher for multiple images)
    const limitCheck = await creditManager.checkRequestAllowed(requestCost, 'bfl-playground');
    
    if (!limitCheck.allowed) {
      console.log('❌ BFL playground request blocked by credit limits:', limitCheck.reason);
      queueManager.failJob(jobId, `Request blocked: ${limitCheck.message}`);
      return;
    }
    
    if (limitCheck.warnings?.length > 0) {
      console.log('⚠️ BFL playground credit limit warnings:', limitCheck.warnings);
    }
    
    // Update progress
    queueManager.updateJobProgress(jobId, 10, 'initializing-bfl-playground');

    // Create FLUX service instance
    const FluxService = require('../services/flux');
    const fluxService = new FluxService();
    
    console.log('🖼️ BFL Playground inputs:');
    console.log('   Model:', job.model.referenceImage);
    console.log('   Product:', job.garmentImagePath);
    console.log('   Details:', job.detailImagePaths?.length || 0);

    queueManager.updateJobProgress(jobId, 30, 'creating-composite');

    // Use BFL playground approach with multiple images
    const imageResult = await fluxService.generateWithMultipleImages({
      modelImagePath: job.model.referenceImage,
      productImagePath: job.garmentImagePath,
      detailImages: job.detailImagePaths || [],
      prompt: job.customPrompt || '',
      pose: job.pose || 'one arm pose',
      garmentType: job.garmentType || 'shirt',
      size: '1024x1024'
    });

    console.log('🎨 BFL playground generation result:', {
      success: imageResult.success,
      hasImageUrl: !!imageResult.imageUrl,
      approach: imageResult.approach,
      error: imageResult.error
    });

    if (!imageResult.success) {
      console.error('❌ BFL playground generation failed:', imageResult.error);
      queueManager.failJob(jobId, imageResult.error);
      return;
    }

    // Download and save the image locally
    queueManager.updateJobProgress(jobId, 80, 'saving-image');
    let localImagePath = null;
    
    if (imageResult.imageUrl) {
      try {
        console.log('📥 Downloading BFL playground image...');
        const downloadResult = await fluxService.downloadAndSaveImage(imageResult.imageUrl, `bfl_${jobId}.png`);
        if (downloadResult.success) {
          localImagePath = downloadResult.filePath;
          console.log('✅ BFL playground image saved locally:', localImagePath);
        } else {
          console.error('❌ Failed to download BFL playground image:', downloadResult.error);
        }
      } catch (error) {
        console.error('❌ Error downloading BFL playground image:', error);
      }
    }

    // Prepare final result
    let finalImageUrl = imageResult.imageUrl; // Default to remote URL
    if (localImagePath) {
      // Convert local file path to URL path
      const fileName = path.basename(localImagePath);
      finalImageUrl = `/uploads/${fileName}`;
    }

    const result = {
      success: true,
      imageUrl: finalImageUrl,
      imagePath: localImagePath,
      remoteUrl: imageResult.imageUrl, // Keep remote URL as backup
      revisedPrompt: imageResult.revisedPrompt,
      modelUsed: imageResult.modelUsed || 'flux-bfl-playground',
      approach: 'bfl-playground',
      cost: 0.06, // Slightly higher for multiple image processing
      dimensions: { width: 1024, height: 1024, ratio: '1:1' },
      detailImagesUsed: job.detailImagePaths?.length || 0
    };

    console.log('✅ BFL playground job completed successfully:', jobId);
    queueManager.completeJob(jobId, result);

    // Record credit usage
    try {
      const { recordCreditUsage } = require('./credits');
      recordCreditUsage({
        jobId,
        modelUsed: result.modelUsed,
        quality: job.quality || 'hd',
        status: 'completed',
        cost: result.cost,
        modelId: job.modelId,
        garmentType: job.garmentType,
        approach: 'bfl-playground'
      });
      console.log('💳 BFL playground credit usage recorded successfully');
    } catch (error) {
      console.error('❌ Error recording BFL playground credit usage:', error);
    }

    // Record cost in real-time cost tracker
    try {
      const costTracker = require('../services/costTracker');
      await costTracker.recordCost({
        jobId,
        modelUsed: result.modelUsed,
        approach: 'bfl-playground',
        cost: result.cost,
        quality: job.quality || 'hd',
        modelId: job.modelId,
        garmentType: job.garmentType,
        status: 'completed'
      });
    } catch (error) {
      console.error('❌ Error recording BFL playground cost tracking:', error);
    }

    // Record cost in credit manager
    try {
      const creditManager = require('../services/creditManager');
      await creditManager.recordCost({
        jobId,
        modelUsed: result.modelUsed,
        approach: 'bfl-playground',
        cost: result.cost,
        quality: job.quality || 'hd',
        modelId: job.modelId,
        garmentType: job.garmentType,
        status: 'completed',
        emergencyUsed: limitCheck.emergencyUsed || false
      });
    } catch (error) {
      console.error('❌ Error recording BFL playground credit management:', error);
    }

  } catch (error) {
    console.error('❌ Error processing BFL playground job:', error);
    console.error('❌ Error details:', error.stack);
    queueManager.failJob(jobId, error.message);
  }
}

// POST /api/tryon/validate/:jobId
// Get validation status for a completed generation
router.post('/validate/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      generatedImagePath,
      modelId,
      expectedPose,
      productImagePath,
      qualityTier = 'standard'
    } = req.body;

    if (!generatedImagePath || !modelId || !expectedPose) {
      return res.status(400).json({
        error: 'Generated image path, model ID, and expected pose are required'
      });
    }

    const validationResult = await imageGenerator.getValidationStatus(jobId, {
      generatedImagePath,
      modelId,
      expectedPose,
      productImagePath,
      qualityTier
    });

    res.json(validationResult);

  } catch (error) {
    console.error('Error getting validation status:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/tryon/retry/:jobId
// Retry failed generation with adaptive parameters
router.post('/retry/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      strategy = 'auto',
      maxRetries = 3,
      originalRequest,
      validationResults,
      generationHistory = []
    } = req.body;

    if (!originalRequest) {
      return res.status(400).json({
        error: 'Original request data is required for retry'
      });
    }

    const retryResult = await imageGenerator.retryGeneration(jobId, {
      originalRequest,
      validationResults,
      generationHistory,
      strategy,
      maxRetries
    });

    res.json(retryResult);

  } catch (error) {
    console.error('Error retrying generation:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/tryon/quality-options
// Get available quality validation options
router.get('/quality-options', (req, res) => {
  try {
    const options = imageGenerator.getQualityValidationOptions();
    res.json({
      success: true,
      options
    });
  } catch (error) {
    console.error('Error getting quality options:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/tryon/generation-modes
// Get available generation modes and configurations
router.get('/generation-modes', (req, res) => {
  try {
    const modes = imageGenerator.getGenerationModes();
    const tiers = imageGenerator.getQualityTiers();
    
    res.json({
      success: true,
      modes,
      tiers,
      enhanced: {
        available: imageGenerator.isEnhancedGenerationAvailable(),
        strategies: imageGenerator.getEnhancedGenerationStrategies()
      }
    });
  } catch (error) {
    console.error('Error getting generation modes:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/tryon/validate-parameters
// Validate generation parameters before starting
router.post('/validate-parameters', (req, res) => {
  try {
    const validation = imageGenerator.validateGenerationParameters(req.body);
    res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('Error validating parameters:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/tryon/retry-statistics
// Get adaptive retry learning statistics
router.get('/retry-statistics', (req, res) => {
  try {
    const statistics = imageGenerator.getRetryStatistics();
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error getting retry statistics:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// PUT /api/tryon/retry-config
// Update retry configuration
router.put('/retry-config', (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({
        error: 'Configuration object is required'
      });
    }

    imageGenerator.updateRetryConfiguration(config);
    
    res.json({
      success: true,
      message: 'Retry configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating retry configuration:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/tryon/reset-learning
// Reset adaptive retry learning data
router.post('/reset-learning', (req, res) => {
  try {
    imageGenerator.resetRetryLearning();
    
    res.json({
      success: true,
      message: 'Retry learning data reset successfully'
    });
  } catch (error) {
    console.error('Error resetting learning data:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Enhanced job processing function
async function processEnhancedGenerationJob(jobId) {
  const job = queueManager.getJob(jobId);
  if (!job) {
    console.error('❌ Enhanced job not found:', jobId);
    return;
  }

  try {
    console.log(`🎯 Processing enhanced generation job ${jobId}`);
    queueManager.updateJobProgress(jobId, 0, 'starting-enhanced-generation');

    const {
      model,
      garment,
      garmentColor,
      logoDescription,
      logoPosition,
      pose,
      quality,
      additionalDetails,
      garmentImagePath,
      logoFilePath,
      logoFocusEnabled,
      generativeModel,
      qualityTier,
      enableRetry,
      maxRetries,
      generationMode,
      consistencyPriority,
      accuracyPriority,
      validationThreshold,
      costLimit
    } = job;

    // Step 1: Analyze product image if provided
    let productAnalysis = null;
    if (garmentImagePath) {
      console.log('🔍 Analyzing product image...');
      queueManager.updateJobProgress(jobId, 10, 'analyzing-product');
      
      productAnalysis = await imageGenerator.analyzeProductImage(garmentImagePath);
      if (!productAnalysis.success) {
        console.warn('⚠️ Product analysis failed, continuing without structured analysis');
      }
    }

    // Step 2: Build enhanced prompt
    console.log('📝 Building enhanced generation prompt...');
    queueManager.updateJobProgress(jobId, 20, 'building-prompt');
    
    const prompt = imageGenerator.buildTryOnPrompt(model, garment, {
      garmentColor,
      logoDescription,
      logoPosition,
      pose,
      additionalDetails,
      logoFocusEnabled,
      generativeModel,
      productAnalysisResult: productAnalysis
    });

    // Step 3: Generate with quality validation and adaptive retry
    console.log('🎨 Starting enhanced generation with quality validation...');
    queueManager.updateJobProgress(jobId, 30, 'generating-with-validation');

    const generationResult = await imageGenerator.generateWithQualityValidation(
      model.referenceImage,
      prompt,
      {
        modelId: model.id,
        pose,
        productImagePath: garmentImagePath,
        productAnalysis,
        qualityTier,
        enableRetry,
        maxRetries,
        generationMode,
        consistencyPriority,
        accuracyPriority,
        validationThreshold,
        costLimit,
        size: QUALITY_SETTINGS[quality].size,
        model: generativeModel
      }
    );

    if (generationResult.success) {
      console.log(`✅ Enhanced generation completed for job ${jobId}`);
      
      // Enhanced result with validation details
      const enhancedResult = {
        success: true,
        imageUrl: generationResult.result.imageUrl,
        imagePath: generationResult.result.imagePath,
        revisedPrompt: generationResult.result.revisedPrompt,
        modelUsed: generationResult.result.modelUsed,
        // Enhanced fields
        validation: generationResult.validation,
        qualityScore: generationResult.qualityScore,
        attempts: generationResult.attempts,
        totalCost: generationResult.totalCost,
        qualityTier,
        retryExecuted: generationResult.retryExecuted || false,
        enhancedGeneration: true,
        productAnalysis: productAnalysis?.success ? {
          confidence: productAnalysis.confidence,
          colors: productAnalysis.colors?.dominantColors?.length || 0,
          branding: productAnalysis.branding?.structured?.brand_name !== 'Unknown'
        } : null
      };

      queueManager.completeJob(jobId, enhancedResult);
    } else {
      console.error(`❌ Enhanced generation failed for job ${jobId}:`, generationResult.error);
      console.log(`🔄 Falling back to basic generation for job ${jobId}`);
      
      // Fallback to basic generation
      try {
        return await originalProcessGenerationJob(jobId);
      } catch (fallbackError) {
        console.error(`❌ Fallback generation also failed for job ${jobId}:`, fallbackError);
        queueManager.failJob(jobId, `Enhanced generation failed: ${generationResult.error}. Fallback also failed: ${fallbackError.message}`);
      }
    }

  } catch (error) {
    console.error(`❌ Error processing enhanced job ${jobId}:`, error);
    console.log(`🔄 Falling back to basic generation for job ${jobId} due to error`);
    
    // Fallback to basic generation
    try {
      return await originalProcessGenerationJob(jobId);
    } catch (fallbackError) {
      console.error(`❌ Fallback generation also failed for job ${jobId}:`, fallbackError);
      queueManager.failJob(jobId, `Enhanced generation error: ${error.message}. Fallback also failed: ${fallbackError.message}`);
    }
  }
}

// Update the main processing function to handle enhanced jobs
// TEMPORARILY DISABLED TO FIX RECURSION ISSUE
// const originalProcessGenerationJob = processGenerationJob;

// async function processGenerationJob(jobId) {
//   const job = queueManager.getJob(jobId);
//   if (!job) {
//     console.error('❌ Job not found:', jobId);
//     return;
//   }

//   // Temporarily disable enhanced generation to fix loading issues
//   // if (job.enhancedGeneration === true) {
//   //   return await processEnhancedGenerationJob(jobId);
//   // }

//   // Fall back to original processing for standard jobs
//   return await originalProcessGenerationJob(jobId);
// }

module.exports = router;