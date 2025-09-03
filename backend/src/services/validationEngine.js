const ConsistencyValidator = require('./consistencyValidator');
const ProductAccuracyValidator = require('./productAccuracyValidator');

/**
 * ValidationEngine - Orchestrates quality validation for generated images
 * Coordinates consistency and accuracy validators with configurable thresholds
 */
class ValidationEngine {
  constructor(options = {}) {
    // Initialize validators
    this.consistencyValidator = new ConsistencyValidator();
    this.productAccuracyValidator = new ProductAccuracyValidator();
    
    // Default quality thresholds
    this.qualityThresholds = {
      overall: options.overallThreshold || 0.7,
      consistency: {
        face: options.faceThreshold || 0.7,
        pose: options.poseThreshold || 0.6,
        weight: options.consistencyWeight || 0.5
      },
      accuracy: {
        color: options.colorThreshold || 0.7,
        style: options.styleThreshold || 0.6,
        branding: options.brandingThreshold || 0.8,
        weight: options.accuracyWeight || 0.5
      }
    };
    
    // Validation configuration
    this.config = {
      enableDetailedFeedback: options.enableDetailedFeedback !== false,
      enableRetryRecommendations: options.enableRetryRecommendations !== false,
      strictMode: options.strictMode || false, // Requires all sub-thresholds to pass
      ...options.config
    };
  }

  /**
   * Validate generated image quality comprehensively
   * @param {Object} validationRequest - Validation request parameters
   * @returns {Promise<Object>} Complete validation results
   */
  async validateImageQuality(validationRequest) {
    try {
      const {
        generatedImagePath,
        modelId,
        expectedPose,
        productImagePath,
        productAnalysis,
        qualityTier = 'standard'
      } = validationRequest || {};

      // Validate required parameters
      if (!generatedImagePath || !modelId || !expectedPose) {
        throw new Error('Missing required validation parameters: generatedImagePath, modelId, or expectedPose');
      }

      // Apply quality tier specific thresholds
      this.applyQualityTierThresholds(qualityTier);

      // Perform consistency validation
      const consistencyResults = await this.validateConsistency(
        generatedImagePath,
        modelId,
        expectedPose
      );

      // Perform accuracy validation
      const accuracyResults = await this.validateAccuracy(
        generatedImagePath,
        productImagePath,
        productAnalysis
      );

      // Calculate overall quality score
      const overallQuality = this.calculateOverallQuality(
        consistencyResults,
        accuracyResults
      );

      // Determine pass/fail status
      const passStatus = this.determinePassStatus(
        consistencyResults,
        accuracyResults,
        overallQuality
      );

      // Generate comprehensive feedback
      const feedback = this.generateComprehensiveFeedback(
        consistencyResults,
        accuracyResults,
        overallQuality,
        passStatus
      );

      // Generate retry recommendations if needed
      const retryRecommendations = this.generateRetryRecommendations(
        consistencyResults,
        accuracyResults,
        passStatus
      );

      return {
        timestamp: new Date().toISOString(),
        qualityTier,
        consistency: consistencyResults,
        accuracy: accuracyResults,
        overallQuality,
        passes: passStatus.overall,
        passDetails: passStatus,
        feedback,
        retryRecommendations,
        thresholds: this.getActiveThresholds(),
        processingTime: Date.now() - (validationRequest?.startTime || Date.now())
      };
    } catch (error) {
      console.error('Error in validation engine:', error);
      return this.createErrorResult(error, validationRequest);
    }
  }

  /**
   * Validate model consistency
   * @param {string} generatedImagePath - Generated image path
   * @param {string} modelId - Model ID
   * @param {string} expectedPose - Expected pose
   * @returns {Promise<Object>} Consistency validation results
   */
  async validateConsistency(generatedImagePath, modelId, expectedPose) {
    try {
      // Set consistency validator thresholds
      this.consistencyValidator.setThresholds(
        this.qualityThresholds.consistency.face,
        this.qualityThresholds.consistency.pose
      );

      // Perform validation
      const results = await this.consistencyValidator.validateModelConsistency(
        generatedImagePath,
        modelId,
        expectedPose
      );

      return {
        ...results,
        weight: this.qualityThresholds.consistency.weight,
        thresholds: {
          face: this.qualityThresholds.consistency.face,
          pose: this.qualityThresholds.consistency.pose
        }
      };
    } catch (error) {
      console.error('Error validating consistency:', error);
      return {
        faceConsistency: 0,
        poseAccuracy: 0,
        overallScore: 0,
        passes: false,
        error: error.message,
        feedback: ['Consistency validation failed'],
        weight: this.qualityThresholds.consistency.weight
      };
    }
  }

  /**
   * Validate product accuracy
   * @param {string} generatedImagePath - Generated image path
   * @param {string} productImagePath - Product reference image path
   * @param {Object} productAnalysis - Product analysis results
   * @returns {Promise<Object>} Accuracy validation results
   */
  async validateAccuracy(generatedImagePath, productImagePath, productAnalysis) {
    try {
      // Set accuracy validator thresholds
      this.productAccuracyValidator.setThresholds(
        this.qualityThresholds.accuracy.color,
        this.qualityThresholds.accuracy.style,
        this.qualityThresholds.accuracy.branding
      );

      // Perform validation
      const results = await this.productAccuracyValidator.validateProductAccuracy(
        generatedImagePath,
        productImagePath,
        productAnalysis
      );

      return {
        ...results,
        weight: this.qualityThresholds.accuracy.weight,
        thresholds: {
          color: this.qualityThresholds.accuracy.color,
          style: this.qualityThresholds.accuracy.style,
          branding: this.qualityThresholds.accuracy.branding
        }
      };
    } catch (error) {
      console.error('Error validating accuracy:', error);
      return {
        colorAccuracy: 0,
        styleAccuracy: 0,
        brandingAccuracy: 0,
        overallScore: 0,
        passes: false,
        error: error.message,
        feedback: ['Accuracy validation failed'],
        weight: this.qualityThresholds.accuracy.weight
      };
    }
  }

  /**
   * Calculate overall quality score from consistency and accuracy results
   * @param {Object} consistencyResults - Consistency validation results
   * @param {Object} accuracyResults - Accuracy validation results
   * @returns {number} Overall quality score (0-1)
   */
  calculateOverallQuality(consistencyResults, accuracyResults) {
    try {
      const consistencyScore = consistencyResults.overallScore || 0;
      const accuracyScore = accuracyResults.overallScore || 0;
      
      const consistencyWeight = this.qualityThresholds.consistency.weight;
      const accuracyWeight = this.qualityThresholds.accuracy.weight;
      
      // Weighted average of consistency and accuracy
      const overallScore = (consistencyScore * consistencyWeight) + 
                          (accuracyScore * accuracyWeight);
      
      return Math.max(0, Math.min(1, overallScore));
    } catch (error) {
      console.error('Error calculating overall quality:', error);
      return 0;
    }
  }

  /**
   * Determine pass/fail status for all validation aspects
   * @param {Object} consistencyResults - Consistency validation results
   * @param {Object} accuracyResults - Accuracy validation results
   * @param {number} overallQuality - Overall quality score
   * @returns {Object} Pass status details
   */
  determinePassStatus(consistencyResults, accuracyResults, overallQuality) {
    try {
      const passStatus = {
        consistency: {
          overall: consistencyResults.passes || false,
          face: (consistencyResults.faceConsistency || 0) >= this.qualityThresholds.consistency.face,
          pose: (consistencyResults.poseAccuracy || 0) >= this.qualityThresholds.consistency.pose
        },
        accuracy: {
          overall: accuracyResults.passes || false,
          color: (accuracyResults.colorAccuracy || 0) >= this.qualityThresholds.accuracy.color,
          style: (accuracyResults.styleAccuracy || 0) >= this.qualityThresholds.accuracy.style,
          branding: (accuracyResults.brandingAccuracy || 0) >= this.qualityThresholds.accuracy.branding
        },
        overallQuality: overallQuality >= this.qualityThresholds.overall
      };

      // Determine overall pass status
      if (this.config.strictMode) {
        // Strict mode: all sub-thresholds must pass
        passStatus.overall = passStatus.consistency.face && 
                            passStatus.consistency.pose && 
                            passStatus.accuracy.color && 
                            passStatus.accuracy.style && 
                            passStatus.accuracy.branding &&
                            passStatus.overallQuality;
      } else {
        // Standard mode: overall thresholds must pass
        passStatus.overall = passStatus.consistency.overall && 
                            passStatus.accuracy.overall && 
                            passStatus.overallQuality;
      }

      return passStatus;
    } catch (error) {
      console.error('Error determining pass status:', error);
      return {
        overall: false,
        consistency: { overall: false, face: false, pose: false },
        accuracy: { overall: false, color: false, style: false, branding: false },
        overallQuality: false
      };
    }
  }

  /**
   * Generate comprehensive feedback combining all validation results
   * @param {Object} consistencyResults - Consistency validation results
   * @param {Object} accuracyResults - Accuracy validation results
   * @param {number} overallQuality - Overall quality score
   * @param {Object} passStatus - Pass status details
   * @returns {Object} Comprehensive feedback
   */
  generateComprehensiveFeedback(consistencyResults, accuracyResults, overallQuality, passStatus) {
    try {
      const feedback = {
        summary: this.generateSummaryFeedback(overallQuality, passStatus),
        consistency: consistencyResults.feedback || [],
        accuracy: accuracyResults.feedback || [],
        detailed: [],
        actionable: []
      };

      if (this.config.enableDetailedFeedback) {
        feedback.detailed = this.generateDetailedFeedback(
          consistencyResults,
          accuracyResults,
          passStatus
        );
      }

      // Generate actionable feedback
      feedback.actionable = this.generateActionableFeedback(passStatus);

      return feedback;
    } catch (error) {
      console.error('Error generating feedback:', error);
      return {
        summary: 'Validation completed with errors',
        consistency: [],
        accuracy: [],
        detailed: ['Error generating detailed feedback'],
        actionable: ['Review validation configuration and try again']
      };
    }
  }

  /**
   * Generate summary feedback
   * @param {number} overallQuality - Overall quality score
   * @param {Object} passStatus - Pass status details
   * @returns {string} Summary feedback
   */
  generateSummaryFeedback(overallQuality, passStatus) {
    const qualityPercentage = (overallQuality * 100).toFixed(1);
    
    if (passStatus.overall) {
      return `Validation passed with ${qualityPercentage}% overall quality. The generated image meets all quality requirements.`;
    } else if (overallQuality >= 0.6) {
      return `Validation failed with ${qualityPercentage}% overall quality. The image is close to acceptable quality but needs improvements.`;
    } else if (overallQuality >= 0.4) {
      return `Validation failed with ${qualityPercentage}% overall quality. Significant improvements needed in multiple areas.`;
    } else {
      return `Validation failed with ${qualityPercentage}% overall quality. Major quality issues detected requiring substantial regeneration.`;
    }
  }

  /**
   * Generate detailed feedback for each validation aspect
   * @param {Object} consistencyResults - Consistency validation results
   * @param {Object} accuracyResults - Accuracy validation results
   * @param {Object} passStatus - Pass status details
   * @returns {Array<string>} Detailed feedback messages
   */
  generateDetailedFeedback(consistencyResults, accuracyResults, passStatus) {
    const detailed = [];

    // Safely check consistency details
    if (passStatus?.consistency?.face === false) {
      const faceScore = (consistencyResults?.faceConsistency || 0) * 100;
      const threshold = this.qualityThresholds.consistency.face * 100;
      detailed.push(`Face consistency score: ${faceScore.toFixed(1)}% (threshold: ${threshold.toFixed(1)}%)`);
    }
    
    if (passStatus?.consistency?.pose === false) {
      const poseScore = (consistencyResults?.poseAccuracy || 0) * 100;
      const threshold = this.qualityThresholds.consistency.pose * 100;
      detailed.push(`Pose accuracy score: ${poseScore.toFixed(1)}% (threshold: ${threshold.toFixed(1)}%)`);
    }

    // Safely check accuracy details
    if (passStatus?.accuracy?.color === false) {
      const colorScore = (accuracyResults?.colorAccuracy || 0) * 100;
      const threshold = this.qualityThresholds.accuracy.color * 100;
      detailed.push(`Color accuracy score: ${colorScore.toFixed(1)}% (threshold: ${threshold.toFixed(1)}%)`);
    }
    
    if (passStatus?.accuracy?.style === false) {
      const styleScore = (accuracyResults?.styleAccuracy || 0) * 100;
      const threshold = this.qualityThresholds.accuracy.style * 100;
      detailed.push(`Style accuracy score: ${styleScore.toFixed(1)}% (threshold: ${threshold.toFixed(1)}%)`);
    }
    
    if (passStatus?.accuracy?.branding === false) {
      const brandingScore = (accuracyResults?.brandingAccuracy || 0) * 100;
      const threshold = this.qualityThresholds.accuracy.branding * 100;
      detailed.push(`Branding accuracy score: ${brandingScore.toFixed(1)}% (threshold: ${threshold.toFixed(1)}%)`);
    }

    return detailed;
  }

  /**
   * Generate actionable feedback for improvements
   * @param {Object} passStatus - Pass status details
   * @returns {Array<string>} Actionable feedback messages
   */
  generateActionableFeedback(passStatus) {
    const actionable = [];

    if (!passStatus.consistency.face) {
      actionable.push('Strengthen model reference conditioning to improve facial consistency');
    }
    
    if (!passStatus.consistency.pose) {
      actionable.push('Adjust pose-specific prompts or reference images for better body positioning');
    }
    
    if (!passStatus.accuracy.color) {
      actionable.push('Enhance color matching by improving product color analysis or generation parameters');
    }
    
    if (!passStatus.accuracy.style) {
      actionable.push('Improve style transfer by refining texture and pattern preservation techniques');
    }
    
    if (!passStatus.accuracy.branding) {
      actionable.push('Enhance logo and text visibility through specialized branding enhancement prompts');
    }

    if (actionable.length === 0) {
      actionable.push('Quality validation passed - no specific improvements needed');
    }

    return actionable;
  }

  /**
   * Generate retry recommendations based on validation failures
   * @param {Object} consistencyResults - Consistency validation results
   * @param {Object} accuracyResults - Accuracy validation results
   * @param {Object} passStatus - Pass status details
   * @returns {Object} Retry recommendations
   */
  generateRetryRecommendations(consistencyResults, accuracyResults, passStatus) {
    if (!this.config.enableRetryRecommendations || passStatus.overall) {
      return null;
    }

    try {
      const recommendations = {
        shouldRetry: true,
        priority: this.determineRetryPriority(consistencyResults, accuracyResults),
        strategy: this.recommendRetryStrategy(passStatus),
        parameterAdjustments: this.recommendParameterAdjustments(passStatus),
        maxRetries: this.calculateMaxRetries(consistencyResults, accuracyResults),
        estimatedImprovement: this.estimateImprovementPotential(consistencyResults, accuracyResults)
      };

      return recommendations;
    } catch (error) {
      console.error('Error generating retry recommendations:', error);
      return {
        shouldRetry: true,
        priority: 'balanced',
        strategy: 'standard_retry',
        parameterAdjustments: {},
        maxRetries: 3,
        estimatedImprovement: 0.1
      };
    }
  }

  /**
   * Determine retry priority based on which aspects failed most severely
   * @param {Object} consistencyResults - Consistency validation results
   * @param {Object} accuracyResults - Accuracy validation results
   * @returns {string} Retry priority ('consistency', 'accuracy', 'balanced')
   */
  determineRetryPriority(consistencyResults, accuracyResults) {
    const consistencyGap = Math.max(
      this.qualityThresholds.consistency.face - (consistencyResults.faceConsistency || 0),
      this.qualityThresholds.consistency.pose - (consistencyResults.poseAccuracy || 0)
    );

    const accuracyGap = Math.max(
      this.qualityThresholds.accuracy.color - (accuracyResults.colorAccuracy || 0),
      this.qualityThresholds.accuracy.style - (accuracyResults.styleAccuracy || 0),
      this.qualityThresholds.accuracy.branding - (accuracyResults.brandingAccuracy || 0)
    );

    if (consistencyGap > accuracyGap + 0.1) {
      return 'consistency';
    } else if (accuracyGap > consistencyGap + 0.1) {
      return 'accuracy';
    } else {
      return 'balanced';
    }
  }

  /**
   * Recommend retry strategy based on failure patterns
   * @param {Object} passStatus - Pass status details
   * @returns {string} Retry strategy
   */
  recommendRetryStrategy(passStatus) {
    const failedAspects = [];
    
    if (!passStatus.consistency.face) failedAspects.push('face');
    if (!passStatus.consistency.pose) failedAspects.push('pose');
    if (!passStatus.accuracy.color) failedAspects.push('color');
    if (!passStatus.accuracy.style) failedAspects.push('style');
    if (!passStatus.accuracy.branding) failedAspects.push('branding');

    if (failedAspects.length >= 4) {
      return 'complete_regeneration';
    } else if (failedAspects.includes('face') && failedAspects.includes('pose')) {
      return 'model_focused_retry';
    } else if (failedAspects.includes('color') && failedAspects.includes('style')) {
      return 'product_focused_retry';
    } else {
      return 'targeted_retry';
    }
  }

  /**
   * Recommend parameter adjustments for retry
   * @param {Object} passStatus - Pass status details
   * @returns {Object} Parameter adjustment recommendations
   */
  recommendParameterAdjustments(passStatus) {
    const adjustments = {};

    if (!passStatus.consistency.face) {
      adjustments.modelReferenceStrength = 'increase';
      adjustments.facePreservationWeight = 'increase';
    }

    if (!passStatus.consistency.pose) {
      adjustments.poseGuidanceScale = 'increase';
      adjustments.bodyStructureWeight = 'increase';
    }

    if (!passStatus.accuracy.color) {
      adjustments.colorMatchingWeight = 'increase';
      adjustments.colorPreservationStrength = 'increase';
    }

    if (!passStatus.accuracy.style) {
      adjustments.styleTransferWeight = 'increase';
      adjustments.texturePreservationStrength = 'increase';
    }

    if (!passStatus.accuracy.branding) {
      adjustments.brandingEnhancementWeight = 'increase';
      adjustments.logoPreservationStrength = 'increase';
    }

    return adjustments;
  }

  /**
   * Calculate maximum recommended retries based on failure severity
   * @param {Object} consistencyResults - Consistency validation results
   * @param {Object} accuracyResults - Accuracy validation results
   * @returns {number} Maximum retries
   */
  calculateMaxRetries(consistencyResults, accuracyResults) {
    const overallScore = this.calculateOverallQuality(consistencyResults, accuracyResults);
    
    if (overallScore >= 0.6) {
      return 2; // Close to passing, few retries needed
    } else if (overallScore >= 0.4) {
      return 3; // Moderate issues, standard retries
    } else {
      return 5; // Significant issues, more retries allowed
    }
  }

  /**
   * Estimate potential improvement from retry
   * @param {Object} consistencyResults - Consistency validation results
   * @param {Object} accuracyResults - Accuracy validation results
   * @returns {number} Estimated improvement (0-1)
   */
  estimateImprovementPotential(consistencyResults, accuracyResults) {
    const currentScore = this.calculateOverallQuality(consistencyResults, accuracyResults);
    const targetScore = this.qualityThresholds.overall;
    
    // Estimate 60-80% of the gap can be closed with retry
    const gap = targetScore - currentScore;
    const improvementFactor = 0.7; // 70% average improvement
    
    return Math.min(gap * improvementFactor, 0.3); // Cap at 30% improvement
  }

  /**
   * Apply quality tier specific thresholds
   * @param {string} qualityTier - Quality tier ('standard', 'premium', 'ultra')
   */
  applyQualityTierThresholds(qualityTier) {
    const tierThresholds = {
      standard: {
        overall: 0.65,
        consistency: { face: 0.65, pose: 0.55 },
        accuracy: { color: 0.65, style: 0.55, branding: 0.75 }
      },
      premium: {
        overall: 0.75,
        consistency: { face: 0.75, pose: 0.65 },
        accuracy: { color: 0.75, style: 0.65, branding: 0.85 }
      },
      ultra: {
        overall: 0.85,
        consistency: { face: 0.85, pose: 0.75 },
        accuracy: { color: 0.85, style: 0.75, branding: 0.90 }
      }
    };

    const thresholds = tierThresholds[qualityTier] || tierThresholds.standard;
    
    this.qualityThresholds.overall = thresholds.overall;
    this.qualityThresholds.consistency.face = thresholds.consistency.face;
    this.qualityThresholds.consistency.pose = thresholds.consistency.pose;
    this.qualityThresholds.accuracy.color = thresholds.accuracy.color;
    this.qualityThresholds.accuracy.style = thresholds.accuracy.style;
    this.qualityThresholds.accuracy.branding = thresholds.accuracy.branding;
  }

  /**
   * Get current active thresholds
   * @returns {Object} Current thresholds
   */
  getActiveThresholds() {
    return {
      overall: this.qualityThresholds.overall,
      consistency: {
        face: this.qualityThresholds.consistency.face,
        pose: this.qualityThresholds.consistency.pose,
        weight: this.qualityThresholds.consistency.weight
      },
      accuracy: {
        color: this.qualityThresholds.accuracy.color,
        style: this.qualityThresholds.accuracy.style,
        branding: this.qualityThresholds.accuracy.branding,
        weight: this.qualityThresholds.accuracy.weight
      }
    };
  }

  /**
   * Update validation configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfiguration(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Update thresholds if provided
    if (newConfig.thresholds) {
      this.qualityThresholds = { ...this.qualityThresholds, ...newConfig.thresholds };
    }
  }

  /**
   * Create error result for validation failures
   * @param {Error} error - Error that occurred
   * @param {Object} validationRequest - Original validation request
   * @returns {Object} Error result
   */
  createErrorResult(error, validationRequest) {
    const errorMessage = `Error in validation engine: ${error.message}`;
    
    return {
      timestamp: new Date().toISOString(),
      qualityTier: (validationRequest && validationRequest.qualityTier) || 'standard',
      consistency: {
        faceConsistency: 0,
        poseAccuracy: 0,
        overallScore: 0,
        passes: false,
        error: error.message
      },
      accuracy: {
        colorAccuracy: 0,
        styleAccuracy: 0,
        brandingAccuracy: 0,
        overallScore: 0,
        passes: false,
        error: error.message
      },
      overallQuality: 0,
      passes: false,
      passDetails: {
        overall: false,
        consistency: { overall: false, face: false, pose: false },
        accuracy: { overall: false, color: false, style: false, branding: false },
        overallQuality: false
      },
      feedback: {
        summary: 'Validation failed due to technical error',
        consistency: [],
        accuracy: [],
        detailed: [error.message],
        actionable: ['Check validation configuration and image paths', 'Retry validation with corrected parameters']
      },
      retryRecommendations: {
        shouldRetry: true,
        priority: 'balanced',
        strategy: 'complete_regeneration',
        parameterAdjustments: {},
        maxRetries: 1,
        estimatedImprovement: 0
      },
      thresholds: this.getActiveThresholds(),
      processingTime: 0,
      error: errorMessage
    };
  }

  /**
   * Get validation statistics for monitoring
   * @returns {Object} Validation statistics
   */
  getValidationStatistics() {
    return {
      thresholds: this.getActiveThresholds(),
      configuration: this.config,
      validatorVersions: {
        consistency: '1.0.0',
        accuracy: '1.0.0',
        engine: '1.0.0'
      }
    };
  }
}

module.exports = ValidationEngine;