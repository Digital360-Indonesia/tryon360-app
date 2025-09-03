const ValidationEngine = require('./validationEngine');
const EnhancedGenerationService = require('./enhancedGeneration');

/**
 * AdaptiveRetryService - Intelligent retry system with parameter adjustment
 * Automatically adjusts generation parameters based on validation feedback
 */
class AdaptiveRetryService {
  constructor(options = {}) {
    this.validationEngine = new ValidationEngine();
    this.enhancedGeneration = new EnhancedGenerationService();
    
    // Retry configuration
    this.config = {
      maxRetries: options.maxRetries || 5,
      costLimit: options.costLimit || 1.0, // $1.00 limit per job
      enableLearning: options.enableLearning !== false,
      ...options
    };
    
    // Parameter adjustment strategies
    this.adjustmentStrategies = {
      consistency: {
        face: {
          modelReferenceStrength: { min: 0.7, max: 1.0, step: 0.1 },
          facePreservationWeight: { min: 0.8, max: 1.0, step: 0.05 }
        },
        pose: {
          poseGuidanceScale: { min: 7.0, max: 15.0, step: 1.0 },
          bodyStructureWeight: { min: 0.6, max: 0.9, step: 0.1 }
        }
      },
      accuracy: {
        color: {
          colorMatchingWeight: { min: 0.7, max: 1.0, step: 0.1 },
          colorPreservationStrength: { min: 0.8, max: 1.0, step: 0.05 }
        },
        style: {
          styleTransferWeight: { min: 0.6, max: 0.9, step: 0.1 },
          texturePreservationStrength: { min: 0.7, max: 1.0, step: 0.1 }
        },
        branding: {
          brandingEnhancementWeight: { min: 0.8, max: 1.0, step: 0.05 },
          logoPreservationStrength: { min: 0.9, max: 1.0, step: 0.02 }
        }
      }
    };
    
    // Learning system for tracking effectiveness
    this.learningData = {
      parameterEffectiveness: new Map(),
      strategySuccess: new Map(),
      costEfficiency: new Map()
    };
  }

  /**
   * Execute adaptive retry process for failed generation
   * @param {Object} retryRequest - Retry request parameters
   * @returns {Promise<Object>} Final generation result
   */
  async executeAdaptiveRetry(retryRequest) {
    const {
      originalRequest,
      validationResults,
      generationHistory = [],
      jobId
    } = retryRequest;

    try {
      console.log(`🔄 Starting adaptive retry for job ${jobId}`);
      
      // Analyze failure patterns
      const failureAnalysis = this.analyzeFailurePatterns(validationResults, generationHistory);
      
      // Determine retry strategy
      const retryStrategy = this.determineRetryStrategy(failureAnalysis, generationHistory);
      
      // Check retry limits
      if (!this.canRetry(generationHistory, retryStrategy)) {
        return this.createFinalFailureResult(originalRequest, generationHistory, failureAnalysis);
      }
      
      // Execute retry attempts
      const retryResult = await this.executeRetryAttempts(
        originalRequest,
        retryStrategy,
        generationHistory,
        jobId
      );
      
      // Update learning data
      if (this.config.enableLearning) {
        this.updateLearningData(retryStrategy, retryResult, generationHistory);
      }
      
      return retryResult;
      
    } catch (error) {
      console.error('❌ Error in adaptive retry:', error);
      return {
        success: false,
        error: `Adaptive retry failed: ${error.message}`,
        finalAttempt: true,
        totalCost: this.calculateTotalCost(generationHistory)
      };
    }
  }

  /**
   * Analyze failure patterns from validation results
   * @param {Object} validationResults - Latest validation results
   * @param {Array} generationHistory - Previous generation attempts
   * @returns {Object} Failure analysis
   */
  analyzeFailurePatterns(validationResults, generationHistory) {
    const analysis = {
      primaryFailures: [],
      secondaryFailures: [],
      consistentIssues: [],
      improvementTrends: {},
      severity: 'moderate'
    };

    // Analyze current validation results
    if (validationResults.consistency && !validationResults.consistency.passes) {
      if (validationResults.consistency.faceConsistency < 0.5) {
        analysis.primaryFailures.push('face_consistency');
      }
      if (validationResults.consistency.poseAccuracy < 0.5) {
        analysis.primaryFailures.push('pose_accuracy');
      }
    }

    if (validationResults.accuracy && !validationResults.accuracy.passes) {
      if (validationResults.accuracy.colorAccuracy < 0.6) {
        analysis.primaryFailures.push('color_accuracy');
      }
      if (validationResults.accuracy.styleAccuracy < 0.6) {
        analysis.secondaryFailures.push('style_accuracy');
      }
      if (validationResults.accuracy.brandingAccuracy < 0.7) {
        analysis.primaryFailures.push('branding_accuracy');
      }
    }

    // Analyze historical patterns
    if (generationHistory.length > 0) {
      analysis.consistentIssues = this.identifyConsistentIssues(generationHistory);
      analysis.improvementTrends = this.analyzeImprovementTrends(generationHistory);
    }

    // Determine severity
    analysis.severity = this.calculateFailureSeverity(validationResults, analysis);

    console.log(`📊 Failure analysis: ${analysis.primaryFailures.length} primary, ${analysis.secondaryFailures.length} secondary issues`);
    
    return analysis;
  }

  /**
   * Determine optimal retry strategy based on failure analysis
   * @param {Object} failureAnalysis - Failure pattern analysis
   * @param {Array} generationHistory - Previous attempts
   * @returns {Object} Retry strategy
   */
  determineRetryStrategy(failureAnalysis, generationHistory) {
    const strategy = {
      type: 'balanced',
      priority: 'consistency',
      parameterAdjustments: {},
      maxAttempts: 3,
      qualityTier: 'standard',
      estimatedCost: 0.06
    };

    // Determine strategy type based on failure patterns
    if (failureAnalysis.primaryFailures.includes('face_consistency') || 
        failureAnalysis.primaryFailures.includes('pose_accuracy')) {
      strategy.type = 'model_focused';
      strategy.priority = 'consistency';
    } else if (failureAnalysis.primaryFailures.includes('color_accuracy') || 
               failureAnalysis.primaryFailures.includes('branding_accuracy')) {
      strategy.type = 'product_focused';
      strategy.priority = 'accuracy';
    }

    // Adjust based on severity
    if (failureAnalysis.severity === 'severe') {
      strategy.type = 'complete_regeneration';
      strategy.maxAttempts = 2;
      strategy.qualityTier = 'premium';
      strategy.estimatedCost = 0.12;
    }

    // Generate parameter adjustments
    strategy.parameterAdjustments = this.generateParameterAdjustments(
      failureAnalysis, 
      generationHistory,
      strategy.type
    );

    // Adjust attempts based on history
    if (generationHistory.length >= 3) {
      strategy.maxAttempts = Math.max(1, strategy.maxAttempts - 1);
    }

    console.log(`🎯 Retry strategy: ${strategy.type} (${strategy.priority} priority)`);
    
    return strategy;
  }

  /**
   * Generate parameter adjustments based on failure analysis
   * @param {Object} failureAnalysis - Failure analysis
   * @param {Array} generationHistory - Generation history
   * @param {string} strategyType - Strategy type
   * @returns {Object} Parameter adjustments
   */
  generateParameterAdjustments(failureAnalysis, generationHistory, strategyType) {
    const adjustments = {};

    // Face consistency adjustments
    if (failureAnalysis.primaryFailures.includes('face_consistency')) {
      adjustments.modelReferenceStrength = this.calculateAdjustment(
        'consistency.face.modelReferenceStrength',
        generationHistory,
        'increase'
      );
      adjustments.facePreservationWeight = this.calculateAdjustment(
        'consistency.face.facePreservationWeight',
        generationHistory,
        'increase'
      );
    }

    // Pose accuracy adjustments
    if (failureAnalysis.primaryFailures.includes('pose_accuracy')) {
      adjustments.poseGuidanceScale = this.calculateAdjustment(
        'consistency.pose.poseGuidanceScale',
        generationHistory,
        'increase'
      );
      adjustments.bodyStructureWeight = this.calculateAdjustment(
        'consistency.pose.bodyStructureWeight',
        generationHistory,
        'increase'
      );
    }

    // Color accuracy adjustments
    if (failureAnalysis.primaryFailures.includes('color_accuracy')) {
      adjustments.colorMatchingWeight = this.calculateAdjustment(
        'accuracy.color.colorMatchingWeight',
        generationHistory,
        'increase'
      );
      adjustments.colorPreservationStrength = this.calculateAdjustment(
        'accuracy.color.colorPreservationStrength',
        generationHistory,
        'increase'
      );
    }

    // Style accuracy adjustments
    if (failureAnalysis.secondaryFailures.includes('style_accuracy')) {
      adjustments.styleTransferWeight = this.calculateAdjustment(
        'accuracy.style.styleTransferWeight',
        generationHistory,
        'increase'
      );
    }

    // Branding accuracy adjustments
    if (failureAnalysis.primaryFailures.includes('branding_accuracy')) {
      adjustments.brandingEnhancementWeight = this.calculateAdjustment(
        'accuracy.branding.brandingEnhancementWeight',
        generationHistory,
        'increase'
      );
      adjustments.logoPreservationStrength = this.calculateAdjustment(
        'accuracy.branding.logoPreservationStrength',
        generationHistory,
        'increase'
      );
    }

    // Strategy-specific adjustments
    if (strategyType === 'complete_regeneration') {
      // More aggressive adjustments for complete regeneration
      Object.keys(adjustments).forEach(key => {
        adjustments[key] = Math.min(1.0, adjustments[key] * 1.2);
      });
    }

    return adjustments;
  }

  /**
   * Calculate parameter adjustment value
   * @param {string} parameterPath - Parameter path in adjustment strategies
   * @param {Array} generationHistory - Generation history
   * @param {string} direction - 'increase' or 'decrease'
   * @returns {number} Adjusted parameter value
   */
  calculateAdjustment(parameterPath, generationHistory, direction) {
    const pathParts = parameterPath.split('.');
    let strategy = this.adjustmentStrategies;
    
    for (const part of pathParts) {
      strategy = strategy[part];
      if (!strategy) break;
    }

    if (!strategy) return 0.8; // Default fallback

    const { min, max, step } = strategy;
    const currentValue = this.getCurrentParameterValue(parameterPath, generationHistory);
    
    if (direction === 'increase') {
      return Math.min(max, currentValue + step);
    } else {
      return Math.max(min, currentValue - step);
    }
  }

  /**
   * Get current parameter value from history or default
   * @param {string} parameterPath - Parameter path
   * @param {Array} generationHistory - Generation history
   * @returns {number} Current parameter value
   */
  getCurrentParameterValue(parameterPath, generationHistory) {
    // Check most recent attempt for parameter value
    if (generationHistory.length > 0) {
      const lastAttempt = generationHistory[generationHistory.length - 1];
      if (lastAttempt.parameters && lastAttempt.parameters[parameterPath]) {
        return lastAttempt.parameters[parameterPath];
      }
    }

    // Return default value based on parameter type
    const defaults = {
      'consistency.face.modelReferenceStrength': 0.8,
      'consistency.face.facePreservationWeight': 0.85,
      'consistency.pose.poseGuidanceScale': 10.0,
      'consistency.pose.bodyStructureWeight': 0.7,
      'accuracy.color.colorMatchingWeight': 0.8,
      'accuracy.color.colorPreservationStrength': 0.85,
      'accuracy.style.styleTransferWeight': 0.7,
      'accuracy.style.texturePreservationStrength': 0.8,
      'accuracy.branding.brandingEnhancementWeight': 0.9,
      'accuracy.branding.logoPreservationStrength': 0.95
    };

    return defaults[parameterPath] || 0.8;
  }

  /**
   * Check if retry is allowed based on limits
   * @param {Array} generationHistory - Generation history
   * @param {Object} retryStrategy - Retry strategy
   * @returns {boolean} Whether retry is allowed
   */
  canRetry(generationHistory, retryStrategy) {
    // Check attempt limit
    if (generationHistory.length >= this.config.maxRetries) {
      console.log(`⛔ Max retries (${this.config.maxRetries}) reached`);
      return false;
    }

    // Check cost limit
    const currentCost = this.calculateTotalCost(generationHistory);
    const estimatedTotalCost = currentCost + retryStrategy.estimatedCost;
    
    if (estimatedTotalCost > this.config.costLimit) {
      console.log(`💰 Cost limit ($${this.config.costLimit}) would be exceeded`);
      return false;
    }

    return true;
  }

  /**
   * Execute retry attempts with adaptive parameters
   * @param {Object} originalRequest - Original generation request
   * @param {Object} retryStrategy - Retry strategy
   * @param {Array} generationHistory - Generation history
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Retry result
   */
  async executeRetryAttempts(originalRequest, retryStrategy, generationHistory, jobId) {
    let bestResult = null;
    let bestScore = 0;
    
    for (let attempt = 1; attempt <= retryStrategy.maxAttempts; attempt++) {
      console.log(`🔄 Retry attempt ${attempt}/${retryStrategy.maxAttempts} for job ${jobId}`);
      
      try {
        // Apply parameter adjustments
        const adjustedRequest = this.applyParameterAdjustments(
          originalRequest,
          retryStrategy.parameterAdjustments,
          attempt
        );

        // Generate with adjusted parameters
        const generationResult = await this.enhancedGeneration.generateMultiStage(adjustedRequest);
        
        if (!generationResult.success) {
          console.log(`❌ Generation failed on attempt ${attempt}: ${generationResult.error}`);
          continue;
        }

        // Validate the result
        const validationResult = await this.validationEngine.validateImageQuality({
          generatedImagePath: generationResult.imagePath,
          modelId: originalRequest.modelId,
          expectedPose: originalRequest.pose,
          productImagePath: originalRequest.productImagePath,
          productAnalysis: originalRequest.productAnalysis,
          qualityTier: retryStrategy.qualityTier
        });

        // Track attempt
        const attemptRecord = {
          attempt,
          parameters: retryStrategy.parameterAdjustments,
          generationResult,
          validationResult,
          score: validationResult.overallQuality,
          cost: this.estimateGenerationCost(retryStrategy.qualityTier),
          timestamp: new Date().toISOString()
        };

        generationHistory.push(attemptRecord);

        // Check if this is the best result so far
        if (validationResult.overallQuality > bestScore) {
          bestResult = attemptRecord;
          bestScore = validationResult.overallQuality;
        }

        // Check if we've achieved acceptable quality
        if (validationResult.passes) {
          console.log(`✅ Retry successful on attempt ${attempt} with score ${(validationResult.overallQuality * 100).toFixed(1)}%`);
          return {
            success: true,
            result: generationResult,
            validation: validationResult,
            attempts: attempt,
            totalCost: this.calculateTotalCost(generationHistory),
            strategy: retryStrategy.type
          };
        }

        console.log(`📊 Attempt ${attempt} score: ${(validationResult.overallQuality * 100).toFixed(1)}% (best: ${(bestScore * 100).toFixed(1)}%)`);

      } catch (error) {
        console.error(`❌ Error in retry attempt ${attempt}:`, error);
        generationHistory.push({
          attempt,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // All attempts completed, return best result or failure
    if (bestResult && bestScore > 0.5) {
      console.log(`⚠️ Returning best attempt with score ${(bestScore * 100).toFixed(1)}%`);
      return {
        success: true,
        result: bestResult.generationResult,
        validation: bestResult.validationResult,
        attempts: retryStrategy.maxAttempts,
        totalCost: this.calculateTotalCost(generationHistory),
        strategy: retryStrategy.type,
        partial: true
      };
    }

    return {
      success: false,
      error: 'All retry attempts failed to meet quality requirements',
      attempts: retryStrategy.maxAttempts,
      totalCost: this.calculateTotalCost(generationHistory),
      bestScore: bestScore
    };
  }

  /**
   * Apply parameter adjustments to generation request
   * @param {Object} originalRequest - Original request
   * @param {Object} adjustments - Parameter adjustments
   * @param {number} attempt - Current attempt number
   * @returns {Object} Adjusted request
   */
  applyParameterAdjustments(originalRequest, adjustments, attempt) {
    const adjustedRequest = { ...originalRequest };
    
    // Apply base adjustments
    adjustedRequest.enhancedOptions = {
      ...originalRequest.enhancedOptions,
      ...adjustments
    };

    // Progressive adjustments based on attempt number
    if (attempt > 1) {
      const progressiveFactor = 1 + (attempt - 1) * 0.1;
      Object.keys(adjustments).forEach(key => {
        if (typeof adjustments[key] === 'number') {
          adjustedRequest.enhancedOptions[key] = Math.min(1.0, adjustments[key] * progressiveFactor);
        }
      });
    }

    return adjustedRequest;
  }

  /**
   * Identify consistent issues across generation history
   * @param {Array} generationHistory - Generation history
   * @returns {Array} Consistent issues
   */
  identifyConsistentIssues(generationHistory) {
    const issueCount = {};
    const threshold = Math.ceil(generationHistory.length * 0.6); // 60% threshold

    generationHistory.forEach(attempt => {
      if (attempt.validationResult && !attempt.validationResult.passes) {
        const validation = attempt.validationResult;
        
        if (validation.consistency && !validation.consistency.passes) {
          if (validation.consistency.faceConsistency < 0.7) {
            issueCount.face_consistency = (issueCount.face_consistency || 0) + 1;
          }
          if (validation.consistency.poseAccuracy < 0.6) {
            issueCount.pose_accuracy = (issueCount.pose_accuracy || 0) + 1;
          }
        }
        
        if (validation.accuracy && !validation.accuracy.passes) {
          if (validation.accuracy.colorAccuracy < 0.7) {
            issueCount.color_accuracy = (issueCount.color_accuracy || 0) + 1;
          }
          if (validation.accuracy.brandingAccuracy < 0.8) {
            issueCount.branding_accuracy = (issueCount.branding_accuracy || 0) + 1;
          }
        }
      }
    });

    return Object.keys(issueCount).filter(issue => issueCount[issue] >= threshold);
  }

  /**
   * Analyze improvement trends in generation history
   * @param {Array} generationHistory - Generation history
   * @returns {Object} Improvement trends
   */
  analyzeImprovementTrends(generationHistory) {
    const trends = {};
    
    if (generationHistory.length < 2) return trends;

    const metrics = ['overallQuality', 'faceConsistency', 'poseAccuracy', 'colorAccuracy', 'brandingAccuracy'];
    
    metrics.forEach(metric => {
      const values = generationHistory
        .filter(attempt => attempt.validationResult)
        .map(attempt => {
          if (metric === 'overallQuality') {
            return attempt.validationResult.overallQuality;
          }
          if (metric === 'faceConsistency' || metric === 'poseAccuracy') {
            return attempt.validationResult.consistency?.[metric] || 0;
          }
          return attempt.validationResult.accuracy?.[metric] || 0;
        });

      if (values.length >= 2) {
        const firstHalf = values.slice(0, Math.ceil(values.length / 2));
        const secondHalf = values.slice(Math.ceil(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        trends[metric] = {
          improving: secondAvg > firstAvg,
          change: secondAvg - firstAvg,
          confidence: Math.abs(secondAvg - firstAvg) > 0.1 ? 'high' : 'low'
        };
      }
    });

    return trends;
  }

  /**
   * Calculate failure severity
   * @param {Object} validationResults - Validation results
   * @param {Object} analysis - Failure analysis
   * @returns {string} Severity level
   */
  calculateFailureSeverity(validationResults, analysis) {
    const overallScore = validationResults.overallQuality || 0;
    const primaryCount = analysis.primaryFailures.length;
    
    if (overallScore < 0.3 || primaryCount >= 3) {
      return 'severe';
    } else if (overallScore < 0.5 || primaryCount >= 2) {
      return 'moderate';
    } else {
      return 'minor';
    }
  }

  /**
   * Calculate total cost from generation history
   * @param {Array} generationHistory - Generation history
   * @returns {number} Total cost
   */
  calculateTotalCost(generationHistory) {
    return generationHistory.reduce((total, attempt) => {
      return total + (attempt.cost || 0.04); // Default cost per attempt
    }, 0);
  }

  /**
   * Estimate generation cost based on quality tier
   * @param {string} qualityTier - Quality tier
   * @returns {number} Estimated cost
   */
  estimateGenerationCost(qualityTier) {
    const costs = {
      standard: 0.04,
      premium: 0.08,
      ultra: 0.16
    };
    return costs[qualityTier] || costs.standard;
  }

  /**
   * Create final failure result when all retries exhausted
   * @param {Object} originalRequest - Original request
   * @param {Array} generationHistory - Generation history
   * @param {Object} failureAnalysis - Failure analysis
   * @returns {Object} Final failure result
   */
  createFinalFailureResult(originalRequest, generationHistory, failureAnalysis) {
    const totalCost = this.calculateTotalCost(generationHistory);
    const bestAttempt = generationHistory.reduce((best, current) => {
      const currentScore = current.validationResult?.overallQuality || 0;
      const bestScore = best?.validationResult?.overallQuality || 0;
      return currentScore > bestScore ? current : best;
    }, null);

    return {
      success: false,
      error: 'Maximum retries exceeded without achieving acceptable quality',
      finalAttempt: true,
      totalAttempts: generationHistory.length,
      totalCost,
      bestScore: bestAttempt?.validationResult?.overallQuality || 0,
      failureAnalysis,
      recommendations: this.generateFinalRecommendations(failureAnalysis, generationHistory)
    };
  }

  /**
   * Generate final recommendations for persistent failures
   * @param {Object} failureAnalysis - Failure analysis
   * @param {Array} generationHistory - Generation history
   * @returns {Array} Recommendations
   */
  generateFinalRecommendations(failureAnalysis, generationHistory) {
    const recommendations = [];

    if (failureAnalysis.consistentIssues.includes('face_consistency')) {
      recommendations.push('Consider using a different model or updating model reference images');
    }

    if (failureAnalysis.consistentIssues.includes('color_accuracy')) {
      recommendations.push('Verify product image quality and lighting conditions');
    }

    if (failureAnalysis.consistentIssues.includes('branding_accuracy')) {
      recommendations.push('Ensure logo/text elements are clearly visible in product image');
    }

    if (generationHistory.length >= this.config.maxRetries) {
      recommendations.push('Try again later or contact support for manual review');
    }

    return recommendations;
  }

  /**
   * Update learning data based on retry results
   * @param {Object} retryStrategy - Retry strategy used
   * @param {Object} retryResult - Retry result
   * @param {Array} generationHistory - Generation history
   */
  updateLearningData(retryStrategy, retryResult, generationHistory) {
    try {
      // Update strategy success rates
      const strategyKey = retryStrategy.type;
      const currentStats = this.learningData.strategySuccess.get(strategyKey) || { attempts: 0, successes: 0 };
      
      currentStats.attempts++;
      if (retryResult.success) {
        currentStats.successes++;
      }
      
      this.learningData.strategySuccess.set(strategyKey, currentStats);

      // Update parameter effectiveness
      Object.keys(retryStrategy.parameterAdjustments).forEach(param => {
        const paramKey = `${strategyKey}_${param}`;
        const effectiveness = retryResult.success ? 1 : (retryResult.bestScore || 0);
        
        const currentEffectiveness = this.learningData.parameterEffectiveness.get(paramKey) || [];
        currentEffectiveness.push(effectiveness);
        
        // Keep only last 50 data points
        if (currentEffectiveness.length > 50) {
          currentEffectiveness.shift();
        }
        
        this.learningData.parameterEffectiveness.set(paramKey, currentEffectiveness);
      });

      // Update cost efficiency
      const costPerScore = this.calculateTotalCost(generationHistory) / (retryResult.bestScore || 0.1);
      const costEfficiency = this.learningData.costEfficiency.get(strategyKey) || [];
      costEfficiency.push(costPerScore);
      
      if (costEfficiency.length > 20) {
        costEfficiency.shift();
      }
      
      this.learningData.costEfficiency.set(strategyKey, costEfficiency);

    } catch (error) {
      console.error('Error updating learning data:', error);
    }
  }

  /**
   * Get learning statistics for monitoring
   * @returns {Object} Learning statistics
   */
  getLearningStatistics() {
    const stats = {
      strategySuccess: {},
      parameterEffectiveness: {},
      costEfficiency: {}
    };

    // Strategy success rates
    this.learningData.strategySuccess.forEach((data, strategy) => {
      stats.strategySuccess[strategy] = {
        successRate: data.successes / data.attempts,
        totalAttempts: data.attempts
      };
    });

    // Parameter effectiveness averages
    this.learningData.parameterEffectiveness.forEach((values, param) => {
      stats.parameterEffectiveness[param] = {
        averageEffectiveness: values.reduce((a, b) => a + b, 0) / values.length,
        dataPoints: values.length
      };
    });

    // Cost efficiency averages
    this.learningData.costEfficiency.forEach((values, strategy) => {
      stats.costEfficiency[strategy] = {
        averageCostPerScore: values.reduce((a, b) => a + b, 0) / values.length,
        dataPoints: values.length
      };
    });

    return stats;
  }

  /**
   * Reset learning data (for testing or maintenance)
   */
  resetLearningData() {
    this.learningData.parameterEffectiveness.clear();
    this.learningData.strategySuccess.clear();
    this.learningData.costEfficiency.clear();
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfiguration(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

module.exports = AdaptiveRetryService;