const express = require('express');
const ValidationEngine = require('../services/validationEngine');
const queueManager = require('../services/queueManager');

const router = express.Router();
const validationEngine = new ValidationEngine();

// In-memory storage for validation history (in production, use database)
const validationHistory = new Map();
const validationMetrics = {
  totalValidations: 0,
  passedValidations: 0,
  averageQualityScore: 0,
  validationsByTier: {
    basic: { total: 0, passed: 0 },
    standard: { total: 0, passed: 0 },
    premium: { total: 0, passed: 0 },
    ultra: { total: 0, passed: 0 }
  }
};

// GET /api/validation/:jobId
// Get detailed validation results for a specific job
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check if validation results exist in history
    const storedValidation = validationHistory.get(jobId);
    if (storedValidation) {
      return res.json({
        success: true,
        jobId,
        validation: storedValidation,
        cached: true
      });
    }

    // Check job status
    const job = queueManager.getJob(jobId);
    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    if (job.status !== 'completed') {
      return res.json({
        success: false,
        jobId,
        status: job.status,
        message: 'Job not completed yet - validation not available'
      });
    }

    // If job is completed but no validation stored, return job result
    res.json({
      success: true,
      jobId,
      status: job.status,
      result: job.result,
      validation: job.result?.validation || null,
      message: job.result?.validation ? 'Validation completed' : 'No validation data available'
    });

  } catch (error) {
    console.error('Error getting validation results:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/validation/:jobId/run
// Run validation on a completed generation
router.post('/:jobId/run', async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      generatedImagePath,
      modelId,
      expectedPose,
      productImagePath,
      productAnalysis,
      qualityTier = 'standard'
    } = req.body;

    if (!generatedImagePath || !modelId || !expectedPose) {
      return res.status(400).json({
        error: 'Generated image path, model ID, and expected pose are required'
      });
    }

    console.log(`🔍 Running validation for job ${jobId}`);

    const validationResult = await validationEngine.validateImageQuality({
      generatedImagePath,
      modelId,
      expectedPose,
      productImagePath,
      productAnalysis,
      qualityTier
    });

    // Store validation result
    validationHistory.set(jobId, {
      ...validationResult,
      runAt: new Date().toISOString(),
      parameters: {
        generatedImagePath,
        modelId,
        expectedPose,
        productImagePath: productImagePath || null,
        qualityTier
      }
    });

    // Update metrics
    updateValidationMetrics(validationResult, qualityTier);

    res.json({
      success: true,
      jobId,
      validation: validationResult
    });

  } catch (error) {
    console.error('Error running validation:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/validation/:jobId/history
// Get validation history for a job (if multiple validations were run)
router.get('/:jobId/history', (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Get all validation entries for this job
    const jobValidations = [];
    validationHistory.forEach((validation, key) => {
      if (key.startsWith(jobId)) {
        jobValidations.push({
          id: key,
          ...validation
        });
      }
    });

    if (jobValidations.length === 0) {
      return res.status(404).json({
        error: 'No validation history found for this job'
      });
    }

    // Sort by timestamp (most recent first)
    jobValidations.sort((a, b) => new Date(b.runAt) - new Date(a.runAt));

    res.json({
      success: true,
      jobId,
      validations: jobValidations,
      count: jobValidations.length
    });

  } catch (error) {
    console.error('Error getting validation history:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/validation/metrics
// Get aggregated validation metrics and analytics
router.get('/metrics', (req, res) => {
  try {
    const {
      timeframe = '24h',
      qualityTier = 'all'
    } = req.query;

    // Calculate time-based metrics
    const now = new Date();
    const timeframMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const cutoffTime = new Date(now.getTime() - (timeframMs[timeframe] || timeframMs['24h']));
    
    // Filter validations by timeframe
    const recentValidations = [];
    validationHistory.forEach((validation) => {
      const validationTime = new Date(validation.runAt);
      if (validationTime >= cutoffTime) {
        if (qualityTier === 'all' || validation.qualityTier === qualityTier) {
          recentValidations.push(validation);
        }
      }
    });

    // Calculate metrics
    const totalValidations = recentValidations.length;
    const passedValidations = recentValidations.filter(v => v.passes).length;
    const passRate = totalValidations > 0 ? (passedValidations / totalValidations) * 100 : 0;
    
    const averageQuality = totalValidations > 0 
      ? recentValidations.reduce((sum, v) => sum + (v.overallQuality || 0), 0) / totalValidations
      : 0;

    // Quality distribution
    const qualityDistribution = {
      excellent: recentValidations.filter(v => (v.overallQuality || 0) >= 0.9).length,
      good: recentValidations.filter(v => (v.overallQuality || 0) >= 0.7 && (v.overallQuality || 0) < 0.9).length,
      fair: recentValidations.filter(v => (v.overallQuality || 0) >= 0.5 && (v.overallQuality || 0) < 0.7).length,
      poor: recentValidations.filter(v => (v.overallQuality || 0) < 0.5).length
    };

    // Failure analysis
    const failureReasons = {
      faceConsistency: recentValidations.filter(v => !v.passes && v.passDetails?.consistency?.face === false).length,
      poseAccuracy: recentValidations.filter(v => !v.passes && v.passDetails?.consistency?.pose === false).length,
      colorAccuracy: recentValidations.filter(v => !v.passes && v.passDetails?.accuracy?.color === false).length,
      styleAccuracy: recentValidations.filter(v => !v.passes && v.passDetails?.accuracy?.style === false).length,
      brandingAccuracy: recentValidations.filter(v => !v.passes && v.passDetails?.accuracy?.branding === false).length
    };

    res.json({
      success: true,
      timeframe,
      qualityTier,
      metrics: {
        totalValidations,
        passedValidations,
        passRate: Math.round(passRate * 100) / 100,
        averageQuality: Math.round(averageQuality * 1000) / 1000,
        qualityDistribution,
        failureReasons
      },
      trends: calculateValidationTrends(recentValidations),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting validation metrics:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/validation/live-stats
// Get real-time validation statistics
router.get('/live-stats', (req, res) => {
  try {
    // Get recent validations (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentValidations = [];
    
    validationHistory.forEach((validation) => {
      const validationTime = new Date(validation.runAt);
      if (validationTime >= oneHourAgo) {
        recentValidations.push(validation);
      }
    });

    // Calculate live stats
    const liveStats = {
      activeValidations: recentValidations.length,
      currentPassRate: recentValidations.length > 0 
        ? (recentValidations.filter(v => v.passes).length / recentValidations.length) * 100 
        : 0,
      averageProcessingTime: recentValidations.length > 0
        ? recentValidations.reduce((sum, v) => sum + (v.processingTime || 0), 0) / recentValidations.length
        : 0,
      qualityTrend: calculateQualityTrend(recentValidations),
      topFailureReason: getTopFailureReason(recentValidations),
      lastValidation: recentValidations.length > 0 
        ? Math.max(...recentValidations.map(v => new Date(v.runAt).getTime()))
        : null
    };

    res.json({
      success: true,
      liveStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting live stats:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/validation/batch
// Run validation on multiple jobs
router.post('/batch', async (req, res) => {
  try {
    const { validationRequests } = req.body;
    
    if (!Array.isArray(validationRequests) || validationRequests.length === 0) {
      return res.status(400).json({
        error: 'Validation requests array is required'
      });
    }

    if (validationRequests.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 validations per batch request'
      });
    }

    console.log(`🔍 Running batch validation for ${validationRequests.length} jobs`);

    const results = [];
    
    for (const request of validationRequests) {
      const { jobId, ...validationParams } = request;
      
      try {
        const validationResult = await validationEngine.validateImageQuality(validationParams);
        
        // Store result
        validationHistory.set(jobId, {
          ...validationResult,
          runAt: new Date().toISOString(),
          parameters: validationParams
        });

        // Update metrics
        updateValidationMetrics(validationResult, validationParams.qualityTier || 'standard');

        results.push({
          jobId,
          success: true,
          validation: validationResult
        });

      } catch (error) {
        results.push({
          jobId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      batchResults: results,
      summary: {
        total: validationRequests.length,
        successful: successCount,
        failed: validationRequests.length - successCount
      }
    });

  } catch (error) {
    console.error('Error running batch validation:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// DELETE /api/validation/:jobId
// Clear validation history for a job
router.delete('/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    
    let deletedCount = 0;
    const keysToDelete = [];
    
    validationHistory.forEach((validation, key) => {
      if (key === jobId || key.startsWith(jobId)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      validationHistory.delete(key);
      deletedCount++;
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        error: 'No validation history found for this job'
      });
    }

    res.json({
      success: true,
      message: `Deleted ${deletedCount} validation record(s) for job ${jobId}`
    });

  } catch (error) {
    console.error('Error deleting validation history:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Helper functions

function updateValidationMetrics(validationResult, qualityTier) {
  validationMetrics.totalValidations++;
  
  if (validationResult.passes) {
    validationMetrics.passedValidations++;
  }

  // Update average quality score
  const currentAvg = validationMetrics.averageQualityScore;
  const newScore = validationResult.overallQuality || 0;
  validationMetrics.averageQualityScore = 
    (currentAvg * (validationMetrics.totalValidations - 1) + newScore) / validationMetrics.totalValidations;

  // Update tier-specific metrics
  if (validationMetrics.validationsByTier[qualityTier]) {
    validationMetrics.validationsByTier[qualityTier].total++;
    if (validationResult.passes) {
      validationMetrics.validationsByTier[qualityTier].passed++;
    }
  }
}

function calculateValidationTrends(validations) {
  if (validations.length < 2) {
    return {
      qualityTrend: 'stable',
      passRateTrend: 'stable',
      trendConfidence: 'low'
    };
  }

  // Sort by time
  const sortedValidations = validations.sort((a, b) => new Date(a.runAt) - new Date(b.runAt));
  
  // Split into two halves for trend analysis
  const midpoint = Math.floor(sortedValidations.length / 2);
  const firstHalf = sortedValidations.slice(0, midpoint);
  const secondHalf = sortedValidations.slice(midpoint);

  // Calculate averages
  const firstHalfQuality = firstHalf.reduce((sum, v) => sum + (v.overallQuality || 0), 0) / firstHalf.length;
  const secondHalfQuality = secondHalf.reduce((sum, v) => sum + (v.overallQuality || 0), 0) / secondHalf.length;

  const firstHalfPassRate = firstHalf.filter(v => v.passes).length / firstHalf.length;
  const secondHalfPassRate = secondHalf.filter(v => v.passes).length / secondHalf.length;

  // Determine trends
  const qualityDiff = secondHalfQuality - firstHalfQuality;
  const passRateDiff = secondHalfPassRate - firstHalfPassRate;

  return {
    qualityTrend: qualityDiff > 0.05 ? 'improving' : qualityDiff < -0.05 ? 'declining' : 'stable',
    passRateTrend: passRateDiff > 0.05 ? 'improving' : passRateDiff < -0.05 ? 'declining' : 'stable',
    trendConfidence: validations.length > 10 ? 'high' : validations.length > 5 ? 'medium' : 'low',
    qualityChange: Math.round(qualityDiff * 1000) / 1000,
    passRateChange: Math.round(passRateDiff * 100 * 100) / 100
  };
}

function calculateQualityTrend(validations) {
  if (validations.length < 5) return 'insufficient_data';
  
  const recent = validations.slice(-5);
  const older = validations.slice(-10, -5);
  
  if (older.length === 0) return 'insufficient_data';
  
  const recentAvg = recent.reduce((sum, v) => sum + (v.overallQuality || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, v) => sum + (v.overallQuality || 0), 0) / older.length;
  
  const diff = recentAvg - olderAvg;
  
  if (diff > 0.1) return 'improving';
  if (diff < -0.1) return 'declining';
  return 'stable';
}

function getTopFailureReason(validations) {
  const failedValidations = validations.filter(v => !v.passes);
  
  if (failedValidations.length === 0) return null;
  
  const reasons = {
    face_consistency: 0,
    pose_accuracy: 0,
    color_accuracy: 0,
    style_accuracy: 0,
    branding_accuracy: 0
  };

  failedValidations.forEach(v => {
    if (v.passDetails?.consistency?.face === false) reasons.face_consistency++;
    if (v.passDetails?.consistency?.pose === false) reasons.pose_accuracy++;
    if (v.passDetails?.accuracy?.color === false) reasons.color_accuracy++;
    if (v.passDetails?.accuracy?.style === false) reasons.style_accuracy++;
    if (v.passDetails?.accuracy?.branding === false) reasons.branding_accuracy++;
  });

  const topReason = Object.keys(reasons).reduce((a, b) => reasons[a] > reasons[b] ? a : b);
  
  return {
    reason: topReason,
    count: reasons[topReason],
    percentage: Math.round((reasons[topReason] / failedValidations.length) * 100)
  };
}

module.exports = router;