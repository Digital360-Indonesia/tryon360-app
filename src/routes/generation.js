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
  req.requestTime = Date.now(); // Track start time
  let generationResult = null; // Declare generationResult variable outside try blocks
  let generation = null; // Declare generation variable outside try blocks

  console.log('🚀 === GENERATION REQUEST STARTED ===');
  console.log('🆔 Job ID:', jobId);
  console.log('⏰ Request started at:', new Date(req.requestTime).toISOString());
  console.log('📊 Request Data:', {
    body: req.body,
    files: req.files ? Object.keys(req.files) : 'no files',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString()
  });

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

    console.log('📝 Extracted Data:', {
      modelId,
      pose,
      providerId,
      garmentDescription,
      hasProductImage: !!req.files?.productImage,
      hasDetail1: !!req.files?.detail1,
      hasDetail2: !!req.files?.detail2,
      hasDetail3: !!req.files?.detail3
    });

    // Validate required fields
    if (!modelId || !PROFESSIONAL_MODELS[modelId]) {
      console.log('❌ Invalid model ID:', {
        modelId,
        availableModels: Object.keys(PROFESSIONAL_MODELS)
      });
      return res.status(400).json({
        success: false,
        error: 'Valid model ID is required'
      });
    }

    if (!req.files || !req.files.productImage) {
      console.log('❌ Missing product image:', {
        files: req.files ? Object.keys(req.files) : 'none'
      });
      return res.status(400).json({
        success: false,
        error: 'Product image is required'
      });
    }

    console.log('✅ Validation passed, initializing services...');

    // Initialize job tracking in MongoDB
    generation = new Generation({
      jobId,
      modelId,
      pose,
      provider: providerId,
      status: 'processing',
      progress: 0,
      userIp: req.ip,
      userAgent: req.get('User-Agent')
    });

    console.log('💾 Saving to MongoDB...');
    console.log('📋 Generation object to save:', {
      jobId: generation.jobId,
      modelId: generation.modelId,
      pose: generation.pose,
      provider: generation.provider,
      status: generation.status,
      progress: generation.progress,
      userIp: generation.userIp
    });

    try {
      await generation.save();
      console.log('✅ MongoDB save successful:', {
        jobId: generation.jobId,
        _id: generation._id,
        createdAt: generation.createdAt
      });
    } catch (mongoError) {
      console.error('💥 MongoDB save failed:', {
        error: mongoError.message,
        stack: mongoError.stack,
        name: mongoError.name,
        code: mongoError.code,
        jobId
      });
      throw mongoError;
    }

    // Update progress
    const updateProgress = async (stage, progress) => {
      try {
        console.log(`📊 Progress: ${stage} (${progress}%)`);
        console.log('🔄 Updating MongoDB progress...');
        const result = await generation.updateProgress(progress);
        console.log('✅ Progress updated:', {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          jobId
        });
      } catch (error) {
        console.error('❌ Progress update failed:', {
          error: error.message,
          stack: error.stack,
          jobId,
          stage,
          progress
        });
      }
    };

    updateProgress('Processing uploads', 10);
    console.log('🔄 Starting image processing...');

    // Process uploaded images
    const processedFiles = {};
    const uploadedImages = [];

    // Process product image
    console.log('🖼️ Processing product image...');
    console.log('📋 Product file info:', {
      originalName: req.files.productImage[0].originalname,
      mimetype: req.files.productImage[0].mimetype,
      size: req.files.productImage[0].size,
      bufferLength: req.files.productImage[0].buffer.length
    });

    try {
      const productResult = await imageProcessor.processUpload(req.files.productImage[0], 'product');
      processedFiles.product = productResult;
      uploadedImages.push(productResult.path);
      console.log('✅ Product image processed:', {
        path: productResult.path,
        filename: productResult.filename,
        size: productResult.size,
        hasAnalysis: !!productResult.analysis
      });
    } catch (processError) {
      console.error('💥 Product image processing failed:', {
        error: processError.message,
        stack: processError.stack,
        originalName: req.files.productImage[0].originalname
      });
      throw processError;
    }

    updateProgress('Processing detail uploads', 30);

    // Process detail images
    const detailFiles = ['detail1', 'detail2', 'detail3'];
    const embroideryDetails = [];

    console.log(`🔍 Found ${req.files ? Object.keys(req.files).length : 0} total files`);
    console.log('📋 All available files:', Object.keys(req.files || {}));

    for (let i = 0; i < detailFiles.length; i++) {
      const detailKey = detailFiles[i];
      if (req.files[detailKey] && req.files[detailKey][0]) {
        console.log(`🖼️ Processing detail ${i + 1}: ${detailKey}`);
        console.log(`📋 Detail ${i + 1} file info:`, {
          originalName: req.files[detailKey][0].originalname,
          mimetype: req.files[detailKey][0].mimetype,
          size: req.files[detailKey][0].size,
          bufferLength: req.files[detailKey][0].buffer.length
        });

        try {
          const detailResult = await imageProcessor.processUpload(req.files[detailKey][0], detailKey);
          processedFiles[detailKey] = detailResult;
          uploadedImages.push(detailResult.path);
          console.log(`✅ Detail ${i + 1} processed:`, {
            path: detailResult.path,
            filename: detailResult.filename,
            size: detailResult.size,
            hasAnalysis: !!detailResult.analysis
          });
        } catch (detailError) {
          console.error(`💥 Detail ${i + 1} processing failed:`, {
            error: detailError.message,
            stack: detailError.stack,
            detailKey,
            originalName: req.files[detailKey][0].originalname
          });
          throw detailError;
        }

        // Build embroidery detail
        const positionKey = `embroideryPosition${i + 1}`;
        const descriptionKey = `embroideryDescription${i + 1}`;

        if (req.body[positionKey] && req.body[descriptionKey]) {
          embroideryDetails.push({
            position: req.body[positionKey],
            description: req.body[descriptionKey],
            imagePath: detailResult.path
          });
          console.log(`🎨 Embroidery detail ${i + 1}:`, {
            position: req.body[positionKey],
            description: req.body[descriptionKey],
            imagePath: detailResult.path
          });
        }
      } else {
        console.log(`⚪ No detail file found for ${detailKey}`);
      }
    }

    console.log('📊 Processing summary:', {
      totalProcessedFiles: Object.keys(processedFiles).length,
      processedFileTypes: Object.keys(processedFiles),
      uploadedImagesCount: uploadedImages.length,
      embroideryDetailsCount: embroideryDetails.length
    });

    updateProgress('Building generation prompt', 50);
    console.log('🔨 Building generation request...');

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

    console.log('📋 Generation request prepared:', {
      providerId,
      modelId,
      pose,
      garmentDescription,
      uploadedImagesCount: uploadedImages.length,
      embroideryDetailsCount: embroideryDetails.length
    });

    // Validate provider capabilities
    console.log('🔍 Validating provider capabilities...');
    const providerValidation = aiService.validateProviderCapabilities(providerId, generationRequest);
    if (!providerValidation.isValid) {
      console.log('❌ Provider validation failed:', providerValidation.errors);
      return res.status(400).json({
        success: false,
        error: 'Provider validation failed',
        details: providerValidation.errors
      });
    }
    console.log('✅ Provider validation passed');

    updateProgress('Generating image', 70);
    console.log('🎨 Starting AI generation...');
    console.log('🔍 AI Service Status Check...');

    try {
      // Check AI service status before generation
      const aiStatus = aiService.getProviderStatus(providerId);
      console.log('🤖 AI Provider Status:', aiStatus);

      console.log('📤 Sending to AI Service...');
      console.log('📋 Full generation request:', {
        providerId,
        modelId,
        pose,
        garmentDescription: garmentDescription || 'uploaded garment',
        uploadedImagesCount: uploadedImages.length,
        uploadedImagesPaths: uploadedImages,
        embroideryDetailsCount: embroideryDetails.length,
        embroideryDetails: embroideryDetails,
        hasOriginalProductBuffer: !!generationRequest.originalProductBuffer,
        originalProductBufferLength: generationRequest.originalProductBuffer?.length,
        originalProductMimeType: generationRequest.originalProductMimeType,
        jobId
      });

      // Generate try-on image
      console.log('⏳ Waiting for AI response...');
      generationResult = await aiService.generateTryOn(generationRequest);

      console.log('✅ AI generation completed successfully!', {
        imagePath: generationResult.imagePath,
        provider: generationResult.provider,
        prompt: generationResult.prompt?.substring(0, 100) + '...',
        hasMetadata: !!generationResult.metadata,
        metadataKeys: generationResult.metadata ? Object.keys(generationResult.metadata) : 'none',
        processingTime: generationResult.processingTime || 'not provided'
      });

      // Validate result
      if (!generationResult.imagePath) {
        throw new Error('AI generation completed but no imagePath returned');
      }

      if (!generationResult.prompt) {
        throw new Error('AI generation completed but no prompt returned');
      }

    } catch (aiError) {
      console.error('💥 AI generation failed:', {
        error: aiError.message,
        stack: aiError.stack,
        providerId,
        modelId,
        jobId,
        generationRequestKeys: Object.keys(generationRequest)
      });
      throw aiError;
    }

    updateProgress('Finalizing', 90);
    console.log('💾 Updating job status...');

    // Update job status in MongoDB
    const completeData = {
      imageUrl: `/generated/${path.basename(generationResult.imagePath)}`,
      imagePath: generationResult.imagePath,
      prompt: generationResult.prompt,
      metadata: generationResult.metadata,
      processedFiles: Object.keys(processedFiles).map(key => ({
        type: key,
        filename: processedFiles[key].filename,
        analysis: processedFiles[key].analysis
      }))
    };

    console.log('📋 Completion data to save:', {
      jobId,
      imageUrl: completeData.imageUrl,
      imagePath: completeData.imagePath,
      hasPrompt: !!completeData.prompt,
      metadataKeys: completeData.metadata ? Object.keys(completeData.metadata) : 'none',
      processedFilesCount: completeData.processedFiles.length
    });

    try {
      await generation.complete(completeData);
      console.log('✅ Job completion saved successfully:', {
        jobId,
        status: generation.status,
        imageUrl: generation.imageUrl,
        completedAt: generation.updatedAt
      });
    } catch (completeError) {
      console.error('💥 Job completion failed:', {
        error: completeError.message,
        stack: completeError.stack,
        jobId,
        status: generation.status
      });
      throw completeError;
    }

    updateProgress('Complete', 100);
    console.log('🎉 Generation completed successfully!');

    // Return result
    const response = {
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
    };

    console.log('📤 Sending response:', {
      success: response.success,
      jobId: response.jobId,
      imageUrl: response.result.imageUrl,
      imagePath: response.result.imagePath,
      provider: response.result.provider,
      hasPrompt: !!response.result.prompt,
      promptLength: response.result.prompt?.length || 0,
      hasMetadata: !!response.result.metadata,
      metadataKeys: response.result.metadata ? Object.keys(response.result.metadata) : 'none',
      processedFilesCount: response.result.processedFiles?.length || 0,
      processingTime: response.processingTime
    });

    // Final validation before sending
    if (!response.result.imageUrl) {
      console.error('💥 CRITICAL: No imageUrl in response!');
      throw new Error('Response missing imageUrl');
    }

    if (!response.result.imagePath) {
      console.error('💥 CRITICAL: No imagePath in response!');
      throw new Error('Response missing imagePath');
    }

    console.log('🎯 === GENERATION FLOW COMPLETED SUCCESSFULLY ===');
    console.log('🏁 Total processing time:', {
      startTime: new Date(req.requestTime || Date.now()).toISOString(),
      endTime: new Date().toISOString(),
      totalMs: Date.now() - (req.requestTime || Date.now())
    });

    res.json(response);

  } catch (error) {
    console.error('💥 === GENERATION ERROR ===');
    console.error('❌ Error details:', {
      jobId,
      error: error.message,
      stack: error.stack,
      body: req.body,
      files: req.files ? Object.keys(req.files) : 'no files',
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Update job status in MongoDB
    try {
      if (generation) {
        console.log('💾 Marking job as failed...');
        console.log('📋 Fail data:', {
          jobId,
          errorMessage: error.message,
          currentStatus: generation.status
        });

        try {
          await generation.fail(error.message);
          console.log('✅ Job marked as failed successfully:', {
            jobId,
            status: generation.status,
            error: generation.error,
            failedAt: generation.updatedAt
          });
        } catch (failError) {
          console.error('💥 Job fail operation failed:', {
            error: failError.message,
            stack: failError.stack,
            jobId,
            originalError: error.message
          });
        }
      } else {
        console.log('⚠️ No generation object to mark as failed');
      }
    } catch (dbError) {
      console.error('💥 Database error updating job status:', {
        error: dbError.message,
        stack: dbError.stack,
        jobId,
        originalError: error.message
      });
    }

    const response = {
      success: false,
      jobId: jobId,
      error: error.message
    };

    console.log('📤 Sending error response:', response);
    res.status(500).json(response);
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

/**
 * GET /api/generation/logs
 * Get all generation logs with filtering
 */
router.get('/logs', async (req, res) => {
  try {
    const { provider, modelId, status, limit = 100, page = 1 } = req.query;
    const pool = require('../config/database').getPool();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = 'SELECT * FROM generations WHERE 1=1';
    let params = [];

    if (provider) {
      query += ' AND provider = ?';
      params.push(provider);
    }

    if (modelId) {
      query += ' AND modelId = ?';
      params.push(modelId);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Add ordering and pagination
    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM generations WHERE 1=1';
    let countParams = [];

    if (provider) {
      countQuery += ' AND provider = ?';
      countParams.push(provider);
    }

    if (modelId) {
      countQuery += ' AND modelId = ?';
      countParams.push(modelId);
    }

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countRows] = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/generation/logs
 * Clear all generation logs
 */
router.delete('/logs', async (req, res) => {
  try {
    const pool = require('../config/database').getPool();

    const [result] = await pool.execute('DELETE FROM generations');

    res.json({
      success: true,
      message: `${result.affectedRows} logs cleared successfully`
    });
  } catch (error) {
    console.error('❌ Error clearing logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;