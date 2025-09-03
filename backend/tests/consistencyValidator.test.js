const ConsistencyValidator = require('../src/services/consistencyValidator');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

describe('ConsistencyValidator', () => {
  let validator;
  let testImagePath;
  let referenceImagePath;

  beforeAll(async () => {
    validator = new ConsistencyValidator();
    
    // Create test images for validation
    testImagePath = path.join(__dirname, 'test-generated.png');
    referenceImagePath = path.join(__dirname, 'test-reference.png');
    
    // Create a simple test image (512x512 with some color variation)
    const testImage = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: { r: 180, g: 150, b: 120 } // Skin-like color
      }
    })
    .png()
    .toBuffer();
    
    await fs.writeFile(testImagePath, testImage);
    
    // Create a reference image with slightly different characteristics
    const referenceImage = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: { r: 175, g: 145, b: 115 } // Similar but slightly different
      }
    })
    .png()
    .toBuffer();
    
    await fs.writeFile(referenceImagePath, referenceImage);
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(testImagePath);
      await fs.unlink(referenceImagePath);
    } catch (error) {
      // Files may not exist, ignore error
    }
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with default thresholds', () => {
      const newValidator = new ConsistencyValidator();
      expect(newValidator.faceThreshold).toBe(0.7);
      expect(newValidator.poseThreshold).toBe(0.6);
    });

    test('should allow setting custom thresholds', () => {
      validator.setThresholds(0.8, 0.7);
      const thresholds = validator.getThresholds();
      expect(thresholds.face).toBe(0.8);
      expect(thresholds.pose).toBe(0.7);
    });

    test('should clamp thresholds to valid range', () => {
      validator.setThresholds(-0.1, 1.5);
      const thresholds = validator.getThresholds();
      expect(thresholds.face).toBe(0);
      expect(thresholds.pose).toBe(1);
    });
  });

  describe('Image Loading and Preprocessing', () => {
    test('should load and preprocess valid image', async () => {
      const buffer = await validator.loadAndPreprocessImage(testImagePath);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    test('should throw error for non-existent image', async () => {
      await expect(validator.loadAndPreprocessImage('non-existent.png'))
        .rejects.toThrow('Failed to load image');
    });

    test('should standardize image dimensions', async () => {
      const buffer = await validator.loadAndPreprocessImage(testImagePath);
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(512);
      expect(metadata.height).toBe(512);
    });
  });

  describe('Facial Feature Extraction', () => {
    test('should extract facial features from image buffer', async () => {
      const buffer = await validator.loadAndPreprocessImage(testImagePath);
      const features = await validator.extractFacialFeatures(buffer);
      
      expect(features).toHaveProperty('skinTone');
      expect(features).toHaveProperty('faceRegionStats');
      expect(features).toHaveProperty('imageStats');
      expect(features).toHaveProperty('dimensions');
      
      expect(features.skinTone).toHaveProperty('r');
      expect(features.skinTone).toHaveProperty('g');
      expect(features.skinTone).toHaveProperty('b');
    });

    test('should handle extraction errors gracefully', async () => {
      const invalidBuffer = Buffer.from('invalid image data');
      const features = await validator.extractFacialFeatures(invalidBuffer);
      
      expect(features.skinTone).toEqual({ r: 0, g: 0, b: 0 });
      expect(features.dimensions.width).toBe(0);
    });
  });

  describe('Pose Feature Extraction', () => {
    test('should extract pose features from image buffer', async () => {
      const buffer = await validator.loadAndPreprocessImage(testImagePath);
      const features = await validator.extractPoseFeatures(buffer);
      
      expect(features).toHaveProperty('bodyRegions');
      expect(features).toHaveProperty('symmetry');
      expect(features).toHaveProperty('dimensions');
      
      expect(features.symmetry).toHaveProperty('leftRight');
      expect(features.symmetry).toHaveProperty('topBottom');
    });

    test('should analyze body regions correctly', async () => {
      const buffer = await validator.loadAndPreprocessImage(testImagePath);
      const { width, height } = await sharp(buffer).metadata();
      const bodyRegions = await validator.analyzeBodyRegions(buffer, width, height);
      
      expect(bodyRegions).toHaveProperty('head');
      expect(bodyRegions).toHaveProperty('torso');
      expect(bodyRegions).toHaveProperty('arms');
    });
  });

  describe('Face Comparison', () => {
    test('should compare faces between two images', async () => {
      const score = await validator.compareFaces(testImagePath, referenceImagePath, {
        characteristics: {
          ethnicity: 'Indonesian',
          gender: 'male'
        }
      });
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('should return conservative score on error', async () => {
      const score = await validator.compareFaces('non-existent.png', referenceImagePath, {
        characteristics: {}
      });
      
      expect(score).toBe(0.3);
    });
  });

  describe('Pose Validation', () => {
    test('should validate pose accuracy', async () => {
      const score = await validator.validatePose(testImagePath, 'Arms Crossed', {
        poses: ['Arms Crossed', 'Contrapposto']
      });
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('should handle unsupported poses', async () => {
      const score = await validator.validatePose(testImagePath, 'Unsupported Pose', {
        poses: ['Arms Crossed']
      });
      
      expect(score).toBe(0.5); // Neutral score for unsupported poses
    });
  });

  describe('Similarity Calculations', () => {
    test('should calculate skin tone similarity', () => {
      const skinTone1 = { r: 180, g: 150, b: 120 };
      const skinTone2 = { r: 175, g: 145, b: 115 };
      
      const similarity = validator.compareSkinTone(skinTone1, skinTone2);
      expect(similarity).toBeGreaterThan(0.9); // Should be very similar
    });

    test('should calculate statistical similarity', () => {
      const stats1 = {
        channels: [
          { mean: 100 },
          { mean: 150 },
          { mean: 200 }
        ]
      };
      
      const stats2 = {
        channels: [
          { mean: 105 },
          { mean: 145 },
          { mean: 195 }
        ]
      };
      
      const similarity = validator.calculateStatisticalSimilarity(stats1, stats2);
      expect(similarity).toBeGreaterThan(0.9);
    });

    test('should handle missing statistics gracefully', () => {
      const similarity = validator.calculateStatisticalSimilarity(null, null);
      expect(similarity).toBe(0.5);
    });
  });

  describe('Pose Symmetry Evaluation', () => {
    test('should evaluate symmetric poses correctly', () => {
      const symmetry = { leftRight: 0.8, topBottom: 0.5 };
      const score = validator.evaluatePoseSymmetry('Arms Crossed', symmetry);
      expect(score).toBeGreaterThan(0.8); // Should score well for symmetric pose
    });

    test('should evaluate asymmetric poses correctly', () => {
      const symmetry = { leftRight: 0.3, topBottom: 0.5 };
      const score = validator.evaluatePoseSymmetry('Contrapposto', symmetry);
      expect(score).toBeGreaterThan(0.8); // Should score well for expected asymmetry
    });

    test('should handle unknown poses', () => {
      const symmetry = { leftRight: 0.6, topBottom: 0.5 };
      const score = validator.evaluatePoseSymmetry('Unknown Pose', symmetry);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Full Model Consistency Validation', () => {
    test('should validate model consistency with valid inputs', async () => {
      // Reset thresholds for test
      validator.setThresholds(0.7, 0.6);
      
      const result = await validator.validateModelConsistency(
        testImagePath,
        'johny',
        'Arms Crossed'
      );
      
      expect(result).toHaveProperty('faceConsistency');
      expect(result).toHaveProperty('poseAccuracy');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('passes');
      expect(result).toHaveProperty('modelId', 'johny');
      expect(result).toHaveProperty('expectedPose', 'Arms Crossed');
      expect(result).toHaveProperty('feedback');
      
      expect(Array.isArray(result.feedback)).toBe(true);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    test('should handle invalid model ID', async () => {
      const result = await validator.validateModelConsistency(
        testImagePath,
        'invalid-model',
        'Arms Crossed'
      );
      
      expect(result.passes).toBe(false);
      expect(result.error).toContain('Unknown model ID');
    });

    test('should handle file access errors', async () => {
      const result = await validator.validateModelConsistency(
        'non-existent.png',
        'johny',
        'Arms Crossed'
      );
      
      expect(result.passes).toBe(false);
      expect(result.faceConsistency).toBe(0.3); // Conservative fallback score
      expect(result.poseAccuracy).toBe(0.5); // Conservative fallback score
    });
  });

  describe('Feedback Generation', () => {
    test('should generate appropriate feedback for good scores', () => {
      const feedback = validator.generateConsistencyFeedback(0.8, 0.7, {
        name: 'Johny'
      });
      
      const feedbackText = feedback.join(' ');
      expect(feedbackText).toMatch(/Face consistency is good/);
      expect(feedbackText).toMatch(/Pose accuracy is good/);
    });

    test('should generate appropriate feedback for poor scores', () => {
      const feedback = validator.generateConsistencyFeedback(0.3, 0.2, {
        name: 'Isabella'
      });
      
      const feedbackText = feedback.join(' ');
      expect(feedbackText).toMatch(/Face consistency is very low/);
      expect(feedbackText).toMatch(/Pose accuracy is very low/);
    });

    test('should include specific model name in feedback', () => {
      const feedback = validator.generateConsistencyFeedback(0.5, 0.5, {
        name: 'Nyoman'
      });
      
      const feedbackText = feedback.join(' ');
      expect(feedbackText).toContain('Nyoman');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle corrupted image gracefully', async () => {
      // Create a file with invalid image data
      const corruptedPath = path.join(__dirname, 'corrupted.png');
      await fs.writeFile(corruptedPath, 'not an image');
      
      try {
        const result = await validator.validateModelConsistency(
          corruptedPath,
          'johny',
          'Arms Crossed'
        );
        
        expect(result.passes).toBe(false);
      } finally {
        await fs.unlink(corruptedPath).catch(() => {});
      }
    });

    test('should handle missing reference image', async () => {
      // Temporarily modify model config to point to non-existent reference
      const originalModels = require('../src/config/models').KUSTOMPEDIA_MODELS;
      const testModel = {
        ...originalModels.johny,
        referenceImagePath: 'non-existent-reference.png'
      };
      
      // Mock the model temporarily
      jest.doMock('../src/config/models', () => ({
        KUSTOMPEDIA_MODELS: {
          johny: testModel
        }
      }));
      
      const result = await validator.validateModelConsistency(
        testImagePath,
        'johny',
        'Arms Crossed'
      );
      
      expect(result.passes).toBe(false);
      
      jest.dontMock('../src/config/models');
    });
  });

  describe('Performance and Optimization', () => {
    test('should complete validation within reasonable time', async () => {
      const startTime = Date.now();
      
      await validator.validateModelConsistency(
        testImagePath,
        'johny',
        'Arms Crossed'
      );
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle multiple concurrent validations', async () => {
      const promises = Array(3).fill().map(() =>
        validator.validateModelConsistency(
          testImagePath,
          'johny',
          'Arms Crossed'
        )
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toHaveProperty('overallScore');
        expect(typeof result.overallScore).toBe('number');
      });
    });
  });
});