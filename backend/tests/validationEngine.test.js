const ValidationEngine = require('../src/services/validationEngine');
const ConsistencyValidator = require('../src/services/consistencyValidator');
const ProductAccuracyValidator = require('../src/services/productAccuracyValidator');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Mock the validators to control their behavior in tests
jest.mock('../src/services/consistencyValidator');
jest.mock('../src/services/productAccuracyValidator');

describe('ValidationEngine', () => {
  let validationEngine;
  let mockConsistencyValidator;
  let mockProductAccuracyValidator;
  let testImagePath;
  let testProductImagePath;
  let testValidationRequest;

  beforeAll(async () => {
    // Create test images
    testImagePath = path.join(__dirname, 'test-validation-generated.png');
    testProductImagePath = path.join(__dirname, 'test-validation-product.png');
    
    const testImage = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    }).png().toBuffer();
    
    await fs.writeFile(testImagePath, testImage);
    await fs.writeFile(testProductImagePath, testImage);
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(testImagePath);
      await fs.unlink(testProductImagePath);
    } catch (error) {
      // Files may not exist, ignore error
    }
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockConsistencyValidator = {
      setThresholds: jest.fn(),
      validateModelConsistency: jest.fn()
    };
    
    mockProductAccuracyValidator = {
      setThresholds: jest.fn(),
      validateProductAccuracy: jest.fn()
    };
    
    // Mock constructors
    ConsistencyValidator.mockImplementation(() => mockConsistencyValidator);
    ProductAccuracyValidator.mockImplementation(() => mockProductAccuracyValidator);
    
    // Create validation engine
    validationEngine = new ValidationEngine();
    
    // Test validation request
    testValidationRequest = {
      generatedImagePath: testImagePath,
      modelId: 'johny',
      expectedPose: 'Arms Crossed',
      productImagePath: testProductImagePath,
      productAnalysis: {
        colors: { dominant: { r: 100, g: 150, b: 200 } },
        structured: { garmentType: 't_shirt' },
        branding: { hasLogo: true },
        confidence: 0.8
      },
      qualityTier: 'standard'
    };
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with default configuration', () => {
      const engine = new ValidationEngine();
      
      expect(engine.qualityThresholds.overall).toBe(0.7);
      expect(engine.qualityThresholds.consistency.face).toBe(0.7);
      expect(engine.qualityThresholds.consistency.pose).toBe(0.6);
      expect(engine.qualityThresholds.accuracy.color).toBe(0.7);
      expect(engine.config.enableDetailedFeedback).toBe(true);
      expect(engine.config.strictMode).toBe(false);
    });

    test('should initialize with custom configuration', () => {
      const customConfig = {
        overallThreshold: 0.8,
        faceThreshold: 0.75,
        strictMode: true,
        enableDetailedFeedback: false
      };
      
      const engine = new ValidationEngine(customConfig);
      
      expect(engine.qualityThresholds.overall).toBe(0.8);
      expect(engine.qualityThresholds.consistency.face).toBe(0.75);
      expect(engine.config.strictMode).toBe(true);
      expect(engine.config.enableDetailedFeedback).toBe(false);
    });

    test('should create validator instances', () => {
      expect(ConsistencyValidator).toHaveBeenCalled();
      expect(ProductAccuracyValidator).toHaveBeenCalled();
    });
  });

  describe('Quality Tier Thresholds', () => {
    test('should apply standard quality tier thresholds', () => {
      validationEngine.applyQualityTierThresholds('standard');
      
      expect(validationEngine.qualityThresholds.overall).toBe(0.65);
      expect(validationEngine.qualityThresholds.consistency.face).toBe(0.65);
      expect(validationEngine.qualityThresholds.accuracy.color).toBe(0.65);
    });

    test('should apply premium quality tier thresholds', () => {
      validationEngine.applyQualityTierThresholds('premium');
      
      expect(validationEngine.qualityThresholds.overall).toBe(0.75);
      expect(validationEngine.qualityThresholds.consistency.face).toBe(0.75);
      expect(validationEngine.qualityThresholds.accuracy.color).toBe(0.75);
    });

    test('should apply ultra quality tier thresholds', () => {
      validationEngine.applyQualityTierThresholds('ultra');
      
      expect(validationEngine.qualityThresholds.overall).toBe(0.85);
      expect(validationEngine.qualityThresholds.consistency.face).toBe(0.85);
      expect(validationEngine.qualityThresholds.accuracy.color).toBe(0.85);
    });

    test('should default to standard tier for unknown tier', () => {
      validationEngine.applyQualityTierThresholds('unknown');
      
      expect(validationEngine.qualityThresholds.overall).toBe(0.65);
    });
  });

  describe('Consistency Validation', () => {
    test('should validate consistency with proper parameters', async () => {
      const mockResults = {
        faceConsistency: 0.8,
        poseAccuracy: 0.7,
        overallScore: 0.75,
        passes: true,
        feedback: ['Good consistency']
      };
      
      mockConsistencyValidator.validateModelConsistency.mockResolvedValue(mockResults);
      
      const results = await validationEngine.validateConsistency(
        testImagePath,
        'johny',
        'Arms Crossed'
      );
      
      expect(mockConsistencyValidator.setThresholds).toHaveBeenCalledWith(0.7, 0.6);
      expect(mockConsistencyValidator.validateModelConsistency).toHaveBeenCalledWith(
        testImagePath,
        'johny',
        'Arms Crossed'
      );
      
      expect(results.faceConsistency).toBe(0.8);
      expect(results.poseAccuracy).toBe(0.7);
      expect(results.passes).toBe(true);
      expect(results.weight).toBe(0.5);
    });

    test('should handle consistency validation errors', async () => {
      mockConsistencyValidator.validateModelConsistency.mockRejectedValue(
        new Error('Validation failed')
      );
      
      const results = await validationEngine.validateConsistency(
        testImagePath,
        'johny',
        'Arms Crossed'
      );
      
      expect(results.passes).toBe(false);
      expect(results.error).toBe('Validation failed');
      expect(results.faceConsistency).toBe(0);
    });
  });

  describe('Accuracy Validation', () => {
    test('should validate accuracy with proper parameters', async () => {
      const mockResults = {
        colorAccuracy: 0.8,
        styleAccuracy: 0.7,
        brandingAccuracy: 0.9,
        overallScore: 0.8,
        passes: true,
        feedback: ['Good accuracy']
      };
      
      mockProductAccuracyValidator.validateProductAccuracy.mockResolvedValue(mockResults);
      
      const results = await validationEngine.validateAccuracy(
        testImagePath,
        testProductImagePath,
        testValidationRequest.productAnalysis
      );
      
      expect(mockProductAccuracyValidator.setThresholds).toHaveBeenCalledWith(0.7, 0.6, 0.8);
      expect(mockProductAccuracyValidator.validateProductAccuracy).toHaveBeenCalledWith(
        testImagePath,
        testProductImagePath,
        testValidationRequest.productAnalysis
      );
      
      expect(results.colorAccuracy).toBe(0.8);
      expect(results.styleAccuracy).toBe(0.7);
      expect(results.brandingAccuracy).toBe(0.9);
      expect(results.passes).toBe(true);
    });

    test('should handle accuracy validation errors', async () => {
      mockProductAccuracyValidator.validateProductAccuracy.mockRejectedValue(
        new Error('Accuracy validation failed')
      );
      
      const results = await validationEngine.validateAccuracy(
        testImagePath,
        testProductImagePath,
        testValidationRequest.productAnalysis
      );
      
      expect(results.passes).toBe(false);
      expect(results.error).toBe('Accuracy validation failed');
      expect(results.colorAccuracy).toBe(0);
    });
  });

  describe('Overall Quality Calculation', () => {
    test('should calculate overall quality correctly', () => {
      const consistencyResults = { overallScore: 0.8 };
      const accuracyResults = { overallScore: 0.7 };
      
      const overallQuality = validationEngine.calculateOverallQuality(
        consistencyResults,
        accuracyResults
      );
      
      // Should be weighted average: 0.8 * 0.5 + 0.7 * 0.5 = 0.75
      expect(overallQuality).toBe(0.75);
    });

    test('should handle missing scores gracefully', () => {
      const consistencyResults = {};
      const accuracyResults = {};
      
      const overallQuality = validationEngine.calculateOverallQuality(
        consistencyResults,
        accuracyResults
      );
      
      expect(overallQuality).toBe(0);
    });

    test('should clamp results to valid range', () => {
      const consistencyResults = { overallScore: 1.5 };
      const accuracyResults = { overallScore: -0.5 };
      
      const overallQuality = validationEngine.calculateOverallQuality(
        consistencyResults,
        accuracyResults
      );
      
      expect(overallQuality).toBeGreaterThanOrEqual(0);
      expect(overallQuality).toBeLessThanOrEqual(1);
    });
  });

  describe('Pass Status Determination', () => {
    test('should determine pass status in standard mode', () => {
      const consistencyResults = {
        passes: true,
        faceConsistency: 0.8,
        poseAccuracy: 0.7
      };
      const accuracyResults = {
        passes: true,
        colorAccuracy: 0.8,
        styleAccuracy: 0.7,
        brandingAccuracy: 0.9
      };
      const overallQuality = 0.75;
      
      const passStatus = validationEngine.determinePassStatus(
        consistencyResults,
        accuracyResults,
        overallQuality
      );
      
      expect(passStatus.overall).toBe(true);
      expect(passStatus.consistency.overall).toBe(true);
      expect(passStatus.accuracy.overall).toBe(true);
      expect(passStatus.overallQuality).toBe(true);
    });

    test('should determine pass status in strict mode', () => {
      validationEngine.config.strictMode = true;
      
      const consistencyResults = {
        passes: true,
        faceConsistency: 0.8,
        poseAccuracy: 0.5 // Below threshold
      };
      const accuracyResults = {
        passes: true,
        colorAccuracy: 0.8,
        styleAccuracy: 0.7,
        brandingAccuracy: 0.9
      };
      const overallQuality = 0.75;
      
      const passStatus = validationEngine.determinePassStatus(
        consistencyResults,
        accuracyResults,
        overallQuality
      );
      
      expect(passStatus.overall).toBe(false); // Should fail in strict mode
      expect(passStatus.consistency.pose).toBe(false);
    });

    test('should handle errors in pass status determination', () => {
      const passStatus = validationEngine.determinePassStatus(null, null, null);
      
      expect(passStatus.overall).toBe(false);
      expect(passStatus.consistency.overall).toBe(false);
      expect(passStatus.accuracy.overall).toBe(false);
    });
  });

  describe('Feedback Generation', () => {
    test('should generate comprehensive feedback for passing validation', () => {
      const consistencyResults = { feedback: ['Good face consistency'] };
      const accuracyResults = { feedback: ['Good color accuracy'] };
      const overallQuality = 0.8;
      const passStatus = { 
        overall: true,
        consistency: { face: true, pose: true },
        accuracy: { color: true, style: true, branding: true }
      };
      
      const feedback = validationEngine.generateComprehensiveFeedback(
        consistencyResults,
        accuracyResults,
        overallQuality,
        passStatus
      );
      
      expect(feedback.summary).toContain('Validation passed');
      expect(feedback.consistency).toEqual(['Good face consistency']);
      expect(feedback.accuracy).toEqual(['Good color accuracy']);
      expect(Array.isArray(feedback.actionable)).toBe(true);
    });

    test('should generate comprehensive feedback for failing validation', () => {
      const consistencyResults = { feedback: ['Poor face consistency'] };
      const accuracyResults = { feedback: ['Poor color accuracy'] };
      const overallQuality = 0.4;
      const passStatus = { 
        overall: false,
        consistency: { face: false, pose: true },
        accuracy: { color: false, style: true, branding: true }
      };
      
      const feedback = validationEngine.generateComprehensiveFeedback(
        consistencyResults,
        accuracyResults,
        overallQuality,
        passStatus
      );
      
      expect(feedback.summary).toContain('Validation failed');
      expect(feedback.actionable.length).toBeGreaterThan(0);
    });

    test('should generate detailed feedback when enabled', () => {
      validationEngine.config.enableDetailedFeedback = true;
      
      const consistencyResults = { faceConsistency: 0.5, poseAccuracy: 0.6 };
      const accuracyResults = { colorAccuracy: 0.5, styleAccuracy: 0.6, brandingAccuracy: 0.7 };
      const passStatus = {
        consistency: { face: false, pose: true },
        accuracy: { color: false, style: true, branding: false }
      };
      
      const feedback = validationEngine.generateComprehensiveFeedback(
        consistencyResults,
        accuracyResults,
        0.6,
        passStatus
      );
      
      expect(feedback.detailed.length).toBeGreaterThan(0);
      expect(feedback.detailed.some(msg => msg.includes('Face consistency score'))).toBe(true);
    });
  });

  describe('Retry Recommendations', () => {
    test('should not generate retry recommendations for passing validation', () => {
      const consistencyResults = { overallScore: 0.8 };
      const accuracyResults = { overallScore: 0.8 };
      const passStatus = { overall: true };
      
      const recommendations = validationEngine.generateRetryRecommendations(
        consistencyResults,
        accuracyResults,
        passStatus
      );
      
      expect(recommendations).toBeNull();
    });

    test('should generate retry recommendations for failing validation', () => {
      const consistencyResults = { 
        faceConsistency: 0.5, 
        poseAccuracy: 0.6,
        overallScore: 0.55
      };
      const accuracyResults = { 
        colorAccuracy: 0.5, 
        styleAccuracy: 0.6, 
        brandingAccuracy: 0.7,
        overallScore: 0.6
      };
      const passStatus = { 
        overall: false,
        consistency: { face: false, pose: true },
        accuracy: { color: false, style: true, branding: false }
      };
      
      const recommendations = validationEngine.generateRetryRecommendations(
        consistencyResults,
        accuracyResults,
        passStatus
      );
      
      expect(recommendations.shouldRetry).toBe(true);
      expect(recommendations.priority).toBeDefined();
      expect(recommendations.strategy).toBeDefined();
      expect(recommendations.maxRetries).toBeGreaterThan(0);
      expect(typeof recommendations.estimatedImprovement).toBe('number');
    });

    test('should determine correct retry priority', () => {
      const consistencyResults = { faceConsistency: 0.3, poseAccuracy: 0.4, overallScore: 0.35 };
      const accuracyResults = { colorAccuracy: 0.6, styleAccuracy: 0.7, brandingAccuracy: 0.8, overallScore: 0.7 };
      
      const priority = validationEngine.determineRetryPriority(consistencyResults, accuracyResults);
      expect(priority).toBe('consistency');
    });

    test('should recommend appropriate retry strategy', () => {
      const passStatus = {
        consistency: { face: false, pose: false },
        accuracy: { color: false, style: false, branding: true }
      };
      
      const strategy = validationEngine.recommendRetryStrategy(passStatus);
      expect(strategy).toBe('complete_regeneration');
    });
  });

  describe('Full Image Quality Validation', () => {
    test('should perform complete validation successfully', async () => {
      // Mock successful validation results
      const mockConsistencyResults = {
        faceConsistency: 0.8,
        poseAccuracy: 0.7,
        overallScore: 0.75,
        passes: true,
        feedback: ['Good consistency']
      };
      
      const mockAccuracyResults = {
        colorAccuracy: 0.8,
        styleAccuracy: 0.7,
        brandingAccuracy: 0.9,
        overallScore: 0.8,
        passes: true,
        feedback: ['Good accuracy']
      };
      
      mockConsistencyValidator.validateModelConsistency.mockResolvedValue(mockConsistencyResults);
      mockProductAccuracyValidator.validateProductAccuracy.mockResolvedValue(mockAccuracyResults);
      
      const result = await validationEngine.validateImageQuality(testValidationRequest);
      
      expect(result.passes).toBe(true);
      expect(result.overallQuality).toBeGreaterThan(0.7);
      expect(result.consistency).toBeDefined();
      expect(result.accuracy).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(result.thresholds).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('should handle validation errors gracefully', async () => {
      mockConsistencyValidator.validateModelConsistency.mockRejectedValue(
        new Error('Validation error')
      );
      
      const result = await validationEngine.validateImageQuality(testValidationRequest);
      
      expect(result.passes).toBe(false);
      expect(result.error).toContain('Validation error');
      expect(result.feedback.summary).toContain('technical error');
    });

    test('should apply quality tier thresholds during validation', async () => {
      const premiumRequest = { ...testValidationRequest, qualityTier: 'premium' };
      
      mockConsistencyValidator.validateModelConsistency.mockResolvedValue({
        faceConsistency: 0.7,
        poseAccuracy: 0.6,
        overallScore: 0.65,
        passes: false
      });
      
      mockProductAccuracyValidator.validateProductAccuracy.mockResolvedValue({
        colorAccuracy: 0.7,
        styleAccuracy: 0.6,
        brandingAccuracy: 0.8,
        overallScore: 0.7,
        passes: false
      });
      
      const result = await validationEngine.validateImageQuality(premiumRequest);
      
      expect(result.qualityTier).toBe('premium');
      expect(result.thresholds.overall).toBe(0.75); // Premium threshold
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration correctly', () => {
      const newConfig = {
        strictMode: true,
        enableDetailedFeedback: false,
        thresholds: {
          overall: 0.8
        }
      };
      
      validationEngine.updateConfiguration(newConfig);
      
      expect(validationEngine.config.strictMode).toBe(true);
      expect(validationEngine.config.enableDetailedFeedback).toBe(false);
      expect(validationEngine.qualityThresholds.overall).toBe(0.8);
    });

    test('should get active thresholds', () => {
      const thresholds = validationEngine.getActiveThresholds();
      
      expect(thresholds).toHaveProperty('overall');
      expect(thresholds).toHaveProperty('consistency');
      expect(thresholds).toHaveProperty('accuracy');
      expect(thresholds.consistency).toHaveProperty('face');
      expect(thresholds.consistency).toHaveProperty('pose');
      expect(thresholds.accuracy).toHaveProperty('color');
    });

    test('should get validation statistics', () => {
      const stats = validationEngine.getValidationStatistics();
      
      expect(stats).toHaveProperty('thresholds');
      expect(stats).toHaveProperty('configuration');
      expect(stats).toHaveProperty('validatorVersions');
      expect(stats.validatorVersions).toHaveProperty('consistency');
      expect(stats.validatorVersions).toHaveProperty('accuracy');
      expect(stats.validatorVersions).toHaveProperty('engine');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should create appropriate error result', () => {
      const error = new Error('Test error');
      const request = { qualityTier: 'premium' };
      
      const errorResult = validationEngine.createErrorResult(error, request);
      
      expect(errorResult.passes).toBe(false);
      expect(errorResult.error).toBe('Error in validation engine: Test error');
      expect(errorResult.qualityTier).toBe('premium');
      expect(errorResult.feedback.summary).toContain('technical error');
      expect(errorResult.retryRecommendations.shouldRetry).toBe(true);
    });

    test('should handle missing validation request parameters', async () => {
      const incompleteRequest = {
        generatedImagePath: testImagePath
        // Missing other required parameters
      };
      
      const result = await validationEngine.validateImageQuality(incompleteRequest);
      
      expect(result.passes).toBe(false);
      expect(result.error).toContain('Missing required validation parameters');
    });

    test('should handle null/undefined inputs gracefully', () => {
      expect(() => {
        validationEngine.calculateOverallQuality(null, null);
      }).not.toThrow();
      
      expect(() => {
        validationEngine.determinePassStatus(null, null, null);
      }).not.toThrow();
    });
  });

  describe('Performance and Optimization', () => {
    test('should complete validation within reasonable time', async () => {
      mockConsistencyValidator.validateModelConsistency.mockResolvedValue({
        faceConsistency: 0.8,
        poseAccuracy: 0.7,
        overallScore: 0.75,
        passes: true
      });
      
      mockProductAccuracyValidator.validateProductAccuracy.mockResolvedValue({
        colorAccuracy: 0.8,
        styleAccuracy: 0.7,
        brandingAccuracy: 0.9,
        overallScore: 0.8,
        passes: true
      });
      
      const startTime = Date.now();
      const result = await validationEngine.validateImageQuality(testValidationRequest);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    test('should handle concurrent validations', async () => {
      mockConsistencyValidator.validateModelConsistency.mockResolvedValue({
        overallScore: 0.75,
        passes: true
      });
      
      mockProductAccuracyValidator.validateProductAccuracy.mockResolvedValue({
        overallScore: 0.8,
        passes: true
      });
      
      const promises = Array(3).fill().map(() =>
        validationEngine.validateImageQuality(testValidationRequest)
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toHaveProperty('overallQuality');
        expect(typeof result.overallQuality).toBe('number');
      });
    });
  });
});