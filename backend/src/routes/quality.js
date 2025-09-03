const express = require('express');
const ValidationEngine = require('../services/validationEngine');
const AdaptiveRetryService = require('../services/adaptiveRetryService');
const ImageGeneratorService = require('../services/imageGenerator');

const router = express.Router();
const validationEngine = new ValidationEngine();
const adaptiveRetry = new AdaptiveRetryService();
const imageGenerator = new ImageGeneratorService();

// In-memory storage for quality settings (in production, use database)
const qualitySettings = {
  global: {
    thresholds: {
      consistency: {
        face: 0.7,
        pose: 0.6,
        weight: 0.5
      },
      accuracy: {
        color: 0.7,
        style: 0.6,
        branding: 0.8,
        weight: 0.5
      },
      overall: 0.7
    },
    retry: {
      maxRetries: 3,
      costLimit: 1.0,
      enableLearning: true
    },
    tiers: {
      basic: { enabled: true, costMultiplier: 0.5 },
      standard: { enabled: true, costMultiplier: 1.0 },
      premium: { enabled: true, costMultiplier: 2.0 },
      ultra: { enabled: true, costMultiplier: 4.0 }
    }
  },
  user: new Map(), // User-specific overrides
  admin: {
    monitoring: {
      alertThresholds: {
        passRateBelow: 0.7,
        averageQualityBelow: 0.6,
        costAbove: 2.0
      },
      notifications: {
        email: true,
        webhook: false
      }
    }
  }
};

// GET /api/quality/settings
// Get current quality control settings
router.get('/settings', (req, res) => {
  try {
    const { userId } = req.query;
    
    let settings = { ...qualitySettings.global };
    
    // Apply user-specific overrides if available
    if (userId && qualitySettings.user.has(userId)) {
      const userOverrides = qualitySettings.user.get(userId);
      settings = mergeSettings(settings, userOverrides);
    }

    res.json({
      success: true,
      settings,
      hasUserOverrides: userId ? qualitySettings.user.has(userId) : false
    });

  } catch (error) {
    console.error('Error getting quality settings:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// PUT /api/quality/settings
// Update quality control settings
router.put('/settings', (req, res) => {
  try {
    const { settings, userId, scope = 'global' } = req.body;
    
    if (!settings) {
      return res.status(400).json({
        error: 'Settings object is required'
      });
    }

    // Validate settings
    const validation = validateQualitySettings(settings);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid settings',
        details: validation.errors
      });
    }

    if (scope === 'user' && userId) {
      // Update user-specific settings
      const existingUserSettings = qualitySettings.user.get(userId) || {};
      qualitySettings.user.set(userId, mergeSettings(existingUserSettings, settings));
      
      console.log(`📊 Updated quality settings for user ${userId}`);
    } else {
      // Update global settings
      qualitySettings.global = mergeSettings(qualitySettings.global, settings);
      
      // Apply to validation engine
      if (settings.thresholds) {
        validationEngine.updateConfiguration({ thresholds: settings.thresholds });
      }
      
      // Apply to retry service
      if (settings.retry) {
        adaptiveRetry.updateConfiguration(settings.retry);
      }
      
      console.log('📊 Updated global quality settings');
    }

    res.json({
      success: true,
      message: `Quality settings updated successfully (${scope})`,
      appliedSettings: scope === 'user' && userId 
        ? qualitySettings.user.get(userId) 
        : qualitySettings.global
    });

  } catch (error) {
    console.error('Error updating quality settings:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/quality/thresholds
// Get available threshold configurations
router.get('/thresholds', (req, res) => {
  try {
    const thresholdOptions = {
      consistency: {
        face: {
          min: 0.5,
          max: 0.95,
          default: 0.7,
          recommended: 0.75,
          description: 'Face similarity threshold for model consistency'
        },
        pose: {
          min: 0.4,
          max: 0.9,
          default: 0.6,
          recommended: 0.65,
          description: 'Pose accuracy threshold for body positioning'
        }
      },
      accuracy: {
        color: {
          min: 0.5,
          max: 0.95,
          default: 0.7,
          recommended: 0.75,
          description: 'Color matching accuracy threshold'
        },
        style: {
          min: 0.4,
          max: 0.9,
          default: 0.6,
          recommended: 0.65,
          description: 'Style and pattern accuracy threshold'
        },
        branding: {
          min: 0.6,
          max: 0.98,
          default: 0.8,
          recommended: 0.85,
          description: 'Logo and branding accuracy threshold'
        }
      },
      overall: {
        min: 0.5,
        max: 0.95,
        default: 0.7,
        recommended: 0.75,
        description: 'Overall quality threshold for pass/fail'
      }
    };

    const presets = {
      lenient: {
        name: 'Lenient',
        description: 'Lower thresholds for faster processing',
        thresholds: {
          consistency: { face: 0.6, pose: 0.5 },
          accuracy: { color: 0.6, style: 0.5, branding: 0.7 },
          overall: 0.6
        }
      },
      balanced: {
        name: 'Balanced',
        description: 'Balanced quality and performance',
        thresholds: {
          consistency: { face: 0.7, pose: 0.6 },
          accuracy: { color: 0.7, style: 0.6, branding: 0.8 },
          overall: 0.7
        }
      },
      strict: {
        name: 'Strict',
        description: 'Higher thresholds for maximum quality',
        thresholds: {
          consistency: { face: 0.8, pose: 0.7 },
          accuracy: { color: 0.8, style: 0.7, branding: 0.9 },
          overall: 0.8
        }
      }
    };

    res.json({
      success: true,
      thresholdOptions,
      presets,
      current: validationEngine.getActiveThresholds()
    });

  } catch (error) {
    console.error('Error getting threshold options:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/quality/thresholds/preset
// Apply a threshold preset
router.post('/thresholds/preset', (req, res) => {
  try {
    const { preset, userId } = req.body;
    
    const presets = {
      lenient: {
        consistency: { face: 0.6, pose: 0.5, weight: 0.5 },
        accuracy: { color: 0.6, style: 0.5, branding: 0.7, weight: 0.5 },
        overall: 0.6
      },
      balanced: {
        consistency: { face: 0.7, pose: 0.6, weight: 0.5 },
        accuracy: { color: 0.7, style: 0.6, branding: 0.8, weight: 0.5 },
        overall: 0.7
      },
      strict: {
        consistency: { face: 0.8, pose: 0.7, weight: 0.5 },
        accuracy: { color: 0.8, style: 0.7, branding: 0.9, weight: 0.5 },
        overall: 0.8
      }
    };

    if (!presets[preset]) {
      return res.status(400).json({
        error: `Invalid preset: ${preset}. Available presets: ${Object.keys(presets).join(', ')}`
      });
    }

    const thresholds = presets[preset];
    
    if (userId) {
      // Apply to user settings
      const userSettings = qualitySettings.user.get(userId) || {};
      userSettings.thresholds = thresholds;
      qualitySettings.user.set(userId, userSettings);
    } else {
      // Apply globally
      qualitySettings.global.thresholds = thresholds;
      validationEngine.updateConfiguration({ thresholds });
    }

    console.log(`📊 Applied ${preset} threshold preset${userId ? ` for user ${userId}` : ' globally'}`);

    res.json({
      success: true,
      message: `Applied ${preset} threshold preset`,
      thresholds,
      scope: userId ? 'user' : 'global'
    });

  } catch (error) {
    console.error('Error applying threshold preset:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/quality/retry-settings
// Get retry configuration options
router.get('/retry-settings', (req, res) => {
  try {
    const retryOptions = {
      maxRetries: {
        min: 1,
        max: 10,
        default: 3,
        recommended: 5,
        description: 'Maximum number of retry attempts'
      },
      costLimit: {
        min: 0.1,
        max: 5.0,
        default: 1.0,
        recommended: 2.0,
        description: 'Maximum cost limit per generation job'
      },
      strategies: [
        {
          id: 'auto',
          name: 'Auto',
          description: 'Automatically choose the best retry strategy'
        },
        {
          id: 'model_focused',
          name: 'Model Focused',
          description: 'Prioritize model consistency improvements'
        },
        {
          id: 'product_focused',
          name: 'Product Focused',
          description: 'Prioritize product accuracy improvements'
        },
        {
          id: 'balanced',
          name: 'Balanced',
          description: 'Balance consistency and accuracy improvements'
        },
        {
          id: 'complete_regeneration',
          name: 'Complete Regeneration',
          description: 'Start fresh with new parameters'
        }
      ]
    };

    const currentSettings = adaptiveRetry.config || {
      maxRetries: 3,
      costLimit: 1.0,
      enableLearning: true
    };

    res.json({
      success: true,
      retryOptions,
      currentSettings,
      learningStats: adaptiveRetry.getLearningStatistics()
    });

  } catch (error) {
    console.error('Error getting retry settings:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// PUT /api/quality/retry-settings
// Update retry configuration
router.put('/retry-settings', (req, res) => {
  try {
    const { settings, userId } = req.body;
    
    if (!settings) {
      return res.status(400).json({
        error: 'Retry settings object is required'
      });
    }

    // Validate retry settings
    const validation = validateRetrySettings(settings);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid retry settings',
        details: validation.errors
      });
    }

    if (userId) {
      // Store user-specific retry settings
      const userSettings = qualitySettings.user.get(userId) || {};
      userSettings.retry = settings;
      qualitySettings.user.set(userId, userSettings);
    } else {
      // Update global retry settings
      qualitySettings.global.retry = { ...qualitySettings.global.retry, ...settings };
      adaptiveRetry.updateConfiguration(settings);
    }

    console.log(`🔄 Updated retry settings${userId ? ` for user ${userId}` : ' globally'}`);

    res.json({
      success: true,
      message: 'Retry settings updated successfully',
      settings: userId 
        ? qualitySettings.user.get(userId).retry 
        : qualitySettings.global.retry
    });

  } catch (error) {
    console.error('Error updating retry settings:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/quality/analytics
// Get quality analytics and insights
router.get('/analytics', (req, res) => {
  try {
    const {
      timeframe = '24h',
      groupBy = 'hour'
    } = req.query;

    // Get retry statistics
    const retryStats = adaptiveRetry.getLearningStatistics();
    
    // Get validation engine statistics
    const validationStats = validationEngine.getValidationStatistics();
    
    // Calculate quality trends (mock data for now)
    const qualityTrends = generateQualityTrends(timeframe, groupBy);
    
    // Cost analysis
    const costAnalysis = {
      averageCostPerGeneration: 0.08,
      totalCostSavings: 0.24, // From retry optimization
      costEfficiencyTrend: 'improving',
      recommendedOptimizations: [
        'Consider using "balanced" strategy for better cost efficiency',
        'Increase consistency threshold to 0.75 to reduce retry rate'
      ]
    };

    // Performance insights
    const performanceInsights = {
      averageGenerationTime: 45.2,
      averageValidationTime: 3.8,
      bottlenecks: [
        'Face consistency validation takes 60% of validation time',
        'Color accuracy analysis could be optimized'
      ],
      recommendations: [
        'Enable caching for repeated model validations',
        'Consider batch processing for multiple validations'
      ]
    };

    res.json({
      success: true,
      analytics: {
        retryStats,
        validationStats,
        qualityTrends,
        costAnalysis,
        performanceInsights
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting quality analytics:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/quality/optimize
// Get optimization recommendations
router.post('/optimize', (req, res) => {
  try {
    const {
      currentSettings,
      performanceGoals = {},
      constraints = {}
    } = req.body;

    const {
      prioritizeQuality = true,
      prioritizeSpeed = false,
      prioritizeCost = false
    } = performanceGoals;

    const {
      maxCostPerGeneration = 1.0,
      maxProcessingTime = 120,
      minQualityScore = 0.7
    } = constraints;

    // Generate optimization recommendations
    const recommendations = [];

    // Quality-focused optimizations
    if (prioritizeQuality) {
      recommendations.push({
        type: 'threshold_adjustment',
        title: 'Increase Quality Thresholds',
        description: 'Raise consistency and accuracy thresholds for better results',
        impact: 'Higher quality, more retries, increased cost',
        changes: {
          'thresholds.consistency.face': 0.8,
          'thresholds.accuracy.branding': 0.9
        },
        estimatedImpact: {
          qualityImprovement: '+15%',
          costIncrease: '+25%',
          timeIncrease: '+20%'
        }
      });
    }

    // Speed-focused optimizations
    if (prioritizeSpeed) {
      recommendations.push({
        type: 'retry_optimization',
        title: 'Reduce Retry Attempts',
        description: 'Lower max retries for faster completion',
        impact: 'Faster processing, potentially lower quality',
        changes: {
          'retry.maxRetries': 2,
          'thresholds.overall': 0.65
        },
        estimatedImpact: {
          speedImprovement: '+30%',
          qualityReduction: '-5%',
          costReduction: '-15%'
        }
      });
    }

    // Cost-focused optimizations
    if (prioritizeCost) {
      recommendations.push({
        type: 'tier_optimization',
        title: 'Use Standard Quality Tier',
        description: 'Switch to standard tier for cost savings',
        impact: 'Lower cost, slightly reduced quality',
        changes: {
          'defaultTier': 'standard',
          'retry.costLimit': 0.5
        },
        estimatedImpact: {
          costReduction: '-40%',
          qualityReduction: '-8%',
          speedImprovement: '+10%'
        }
      });
    }

    // Learning-based recommendations
    const learningStats = adaptiveRetry.getLearningStatistics();
    if (learningStats.strategySuccess) {
      const bestStrategy = Object.keys(learningStats.strategySuccess)
        .reduce((a, b) => 
          learningStats.strategySuccess[a].successRate > learningStats.strategySuccess[b].successRate ? a : b
        );
      
      recommendations.push({
        type: 'strategy_optimization',
        title: `Use ${bestStrategy} Strategy`,
        description: `Based on learning data, ${bestStrategy} has the highest success rate`,
        impact: 'Improved success rate based on historical data',
        changes: {
          'retry.defaultStrategy': bestStrategy
        },
        estimatedImpact: {
          successRateImprovement: `+${Math.round((learningStats.strategySuccess[bestStrategy].successRate - 0.7) * 100)}%`
        }
      });
    }

    res.json({
      success: true,
      recommendations,
      currentPerformance: {
        averageQuality: 0.72,
        averageCost: 0.08,
        averageTime: 45.2,
        successRate: 0.85
      },
      optimizationPotential: {
        maxQualityGain: '+20%',
        maxCostSaving: '-50%',
        maxSpeedGain: '+40%'
      }
    });

  } catch (error) {
    console.error('Error generating optimization recommendations:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/quality/reset
// Reset quality settings to defaults
router.post('/reset', (req, res) => {
  try {
    const { scope = 'global', userId } = req.body;
    
    if (scope === 'user' && userId) {
      // Reset user settings
      qualitySettings.user.delete(userId);
      console.log(`📊 Reset quality settings for user ${userId}`);
    } else if (scope === 'global') {
      // Reset global settings to defaults
      qualitySettings.global = {
        thresholds: {
          consistency: { face: 0.7, pose: 0.6, weight: 0.5 },
          accuracy: { color: 0.7, style: 0.6, branding: 0.8, weight: 0.5 },
          overall: 0.7
        },
        retry: {
          maxRetries: 3,
          costLimit: 1.0,
          enableLearning: true
        },
        tiers: {
          basic: { enabled: true, costMultiplier: 0.5 },
          standard: { enabled: true, costMultiplier: 1.0 },
          premium: { enabled: true, costMultiplier: 2.0 },
          ultra: { enabled: true, costMultiplier: 4.0 }
        }
      };
      
      // Apply to services
      validationEngine.updateConfiguration({ thresholds: qualitySettings.global.thresholds });
      adaptiveRetry.updateConfiguration(qualitySettings.global.retry);
      
      console.log('📊 Reset global quality settings to defaults');
    } else if (scope === 'learning') {
      // Reset learning data
      adaptiveRetry.resetLearningData();
      console.log('🧠 Reset adaptive retry learning data');
    }

    res.json({
      success: true,
      message: `Quality settings reset successfully (${scope})`,
      newSettings: scope === 'global' ? qualitySettings.global : null
    });

  } catch (error) {
    console.error('Error resetting quality settings:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Helper functions

function mergeSettings(base, override) {
  const merged = JSON.parse(JSON.stringify(base)); // Deep clone
  
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  
  deepMerge(merged, override);
  return merged;
}

function validateQualitySettings(settings) {
  const errors = [];
  
  // Validate thresholds
  if (settings.thresholds) {
    const { consistency, accuracy, overall } = settings.thresholds;
    
    if (consistency) {
      if (consistency.face < 0.3 || consistency.face > 0.98) {
        errors.push('Face consistency threshold must be between 0.3 and 0.98');
      }
      if (consistency.pose < 0.2 || consistency.pose > 0.95) {
        errors.push('Pose accuracy threshold must be between 0.2 and 0.95');
      }
    }
    
    if (accuracy) {
      if (accuracy.color < 0.3 || accuracy.color > 0.98) {
        errors.push('Color accuracy threshold must be between 0.3 and 0.98');
      }
      if (accuracy.branding < 0.5 || accuracy.branding > 0.99) {
        errors.push('Branding accuracy threshold must be between 0.5 and 0.99');
      }
    }
    
    if (overall < 0.3 || overall > 0.98) {
      errors.push('Overall threshold must be between 0.3 and 0.98');
    }
  }
  
  // Validate retry settings
  if (settings.retry) {
    const { maxRetries, costLimit } = settings.retry;
    
    if (maxRetries < 1 || maxRetries > 10) {
      errors.push('Max retries must be between 1 and 10');
    }
    
    if (costLimit < 0.1 || costLimit > 10.0) {
      errors.push('Cost limit must be between 0.1 and 10.0');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function validateRetrySettings(settings) {
  const errors = [];
  
  if (settings.maxRetries !== undefined) {
    if (settings.maxRetries < 1 || settings.maxRetries > 10) {
      errors.push('Max retries must be between 1 and 10');
    }
  }
  
  if (settings.costLimit !== undefined) {
    if (settings.costLimit < 0.1 || settings.costLimit > 10.0) {
      errors.push('Cost limit must be between 0.1 and 10.0');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function generateQualityTrends(timeframe, groupBy) {
  // Mock quality trends data
  const now = new Date();
  const dataPoints = [];
  
  const intervals = {
    '1h': { count: 12, interval: 5 * 60 * 1000 }, // 5-minute intervals
    '24h': { count: 24, interval: 60 * 60 * 1000 }, // 1-hour intervals
    '7d': { count: 7, interval: 24 * 60 * 60 * 1000 }, // 1-day intervals
    '30d': { count: 30, interval: 24 * 60 * 60 * 1000 } // 1-day intervals
  };
  
  const config = intervals[timeframe] || intervals['24h'];
  
  for (let i = config.count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * config.interval));
    
    // Generate mock data with some trends
    const baseQuality = 0.72 + (Math.random() - 0.5) * 0.1;
    const passRate = 0.85 + (Math.random() - 0.5) * 0.15;
    const avgCost = 0.08 + (Math.random() - 0.5) * 0.02;
    
    dataPoints.push({
      timestamp: timestamp.toISOString(),
      averageQuality: Math.round(baseQuality * 1000) / 1000,
      passRate: Math.round(passRate * 1000) / 1000,
      averageCost: Math.round(avgCost * 1000) / 1000,
      totalGenerations: Math.floor(Math.random() * 50) + 10
    });
  }
  
  return {
    timeframe,
    groupBy,
    dataPoints,
    summary: {
      trend: 'stable',
      qualityChange: '+2.3%',
      passRateChange: '+1.8%',
      costChange: '-5.2%'
    }
  };
}

module.exports = router;