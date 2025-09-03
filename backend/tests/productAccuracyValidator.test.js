const ProductAccuracyValidator = require('../src/services/productAccuracyValidator');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

describe('ProductAccuracyValidator', () => {
  let validator;
  let testGeneratedImagePath;
  let testProductImagePath;
  let testProductAnalysis;

  beforeAll(async () => {
    validator = new ProductAccuracyValidator();
    
    // Create test images for validation
    testGeneratedImagePath = path.join(__dirname, 'test-generated-product.png');
    testProductImagePath = path.join(__dirname, 'test-product-reference.png');
    
    // Create a test generated image (512x512 with blue dominant color)
    const generatedImage = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: { r: 50, g: 100, b: 200 } // Blue garment
      }
    })
    .png()
    .toBuffer();
    
    await fs.writeFile(testGeneratedImagePath, generatedImage);
    
    // Create a test product reference image (similar blue color)
    const productImage = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: { r: 45, g: 95, b: 195 } // Similar blue
      }
    })
    .png()
    .toBuffer();
    
    await fs.writeFile(testProductImagePath, productImage);
    
    // Mock product analysis
    testProductAnalysis = {
      colors: {
        dominant: { r: 50, g: 100, b: 200 }
      },
      structured: {
        garmentType: 't_shirt',
        hasPattern: false
      },
      branding: {
        hasLogo: true,
        hasText: false,
        expectedPosition: 'chest'
      },
      confidence: 0.8
    };
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(testGeneratedImagePath);
      await fs.unlink(testProductImagePath);
    } catch (error) {
      // Files may not exist, ignore error
    }
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with default thresholds', () => {
      const newValidator = new ProductAccuracyValidator();
      expect(newValidator.colorThreshold).toBe(0.7);
      expect(newValidator.styleThreshold).toBe(0.6);
      expect(newValidator.brandingThreshold).toBe(0.8);
    });

    test('should allow setting custom thresholds', () => {
      validator.setThresholds(0.8, 0.7, 0.9);
      const thresholds = validator.getThresholds();
      expect(thresholds.color).toBe(0.8);
      expect(thresholds.style).toBe(0.7);
      expect(thresholds.branding).toBe(0.9);
    });

    test('should clamp thresholds to valid range', () => {
      validator.setThresholds(-0.1, 1.5, 2.0);
      const thresholds = validator.getThresholds();
      expect(thresholds.color).toBe(0);
      expect(thresholds.style).toBe(1);
      expect(thresholds.branding).toBe(1);
    });
  });

  describe('Color Profile Extraction', () => {
    test('should extract color profile from image', async () => {
      const colorProfile = await validator.extractColorProfile(testProductImagePath);
      
      expect(colorProfile).toHaveProperty('dominant');
      expect(colorProfile).toHaveProperty('distribution');
      expect(colorProfile).toHaveProperty('stats');
      
      expect(colorProfile.dominant).toHaveProperty('r');
      expect(colorProfile.dominant).toHaveProperty('g');
      expect(colorProfile.dominant).toHaveProperty('b');
      
      expect(colorProfile.distribution).toHaveProperty('red');
      expect(colorProfile.distribution).toHaveProperty('green');
      expect(colorProfile.distribution).toHaveProperty('blue');
    });

    test('should handle extraction errors gracefully', async () => {
      const colorProfile = await validator.extractColorProfile('non-existent.png');
      
      expect(colorProfile.dominant).toEqual({ r: 0, g: 0, b: 0 });
      expect(colorProfile.distribution).toEqual({ red: 0, green: 0, blue: 0 });
      expect(colorProfile.stats).toBeNull();
    });
  });

  describe('Style Feature Extraction', () => {
    test('should extract style features from image', async () => {
      const styleFeatures = await validator.extractStyleFeatures(testProductImagePath);
      
      expect(styleFeatures).toHaveProperty('texture');
      expect(styleFeatures).toHaveProperty('edges');
      expect(styleFeatures).toHaveProperty('structure');
      
      expect(styleFeatures.texture).toHaveProperty('roughness');
      expect(styleFeatures.texture).toHaveProperty('uniformity');
      
      expect(styleFeatures.edges).toHaveProperty('density');
      expect(styleFeatures.edges).toHaveProperty('strength');
      
      expect(styleFeatures.structure).toHaveProperty('symmetry');
      expect(styleFeatures.structure).toHaveProperty('complexity');
    });

    test('should handle style extraction errors gracefully', async () => {
      const styleFeatures = await validator.extractStyleFeatures('non-existent.png');
      
      expect(styleFeatures.texture).toEqual({ roughness: 0.5, uniformity: 0.5 });
      expect(styleFeatures.edges).toEqual({ density: 0.5, strength: 0.5 });
      expect(styleFeatures.structure).toEqual({ symmetry: 0.5, complexity: 0.5 });
    });
  });

  describe('Branding Feature Extraction', () => {
    test('should extract branding features from image', async () => {
      const brandingFeatures = await validator.extractBrandingFeatures(testProductImagePath);
      
      expect(brandingFeatures).toHaveProperty('logos');
      expect(brandingFeatures).toHaveProperty('text');
      expect(brandingFeatures).toHaveProperty('positions');
      
      expect(brandingFeatures.logos).toHaveProperty('count');
      expect(brandingFeatures.logos).toHaveProperty('clarity');
      
      expect(brandingFeatures.text).toHaveProperty('count');
      expect(brandingFeatures.text).toHaveProperty('clarity');
      
      expect(brandingFeatures.positions).toHaveProperty('chest');
      expect(brandingFeatures.positions).toHaveProperty('back');
      expect(brandingFeatures.positions).toHaveProperty('sleeve');
    });

    test('should handle branding extraction errors gracefully', async () => {
      const brandingFeatures = await validator.extractBrandingFeatures('non-existent.png');
      
      expect(brandingFeatures.logos).toEqual({ count: 0, clarity: 0 });
      expect(brandingFeatures.text).toEqual({ count: 0, clarity: 0 });
      expect(brandingFeatures.positions).toEqual({ chest: false, back: false, sleeve: false });
    });
  });

  describe('Color Validation', () => {
    test('should validate color accuracy between similar images', async () => {
      const colorScore = await validator.validateColorAccuracy(
        testGeneratedImagePath,
        testProductImagePath,
        testProductAnalysis.colors
      );
      
      expect(colorScore).toBeGreaterThanOrEqual(0);
      expect(colorScore).toBeLessThanOrEqual(1);
      expect(colorScore).toBeGreaterThan(0.8); // Should be high for similar colors
    });

    test('should return conservative score on error', async () => {
      const colorScore = await validator.validateColorAccuracy(
        'non-existent.png',
        testProductImagePath,
        testProductAnalysis.colors
      );
      
      expect(colorScore).toBeGreaterThanOrEqual(0.4);
      expect(colorScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Style Validation', () => {
    test('should validate style accuracy', async () => {
      const styleScore = await validator.validateStyleAccuracy(
        testGeneratedImagePath,
        testProductImagePath,
        testProductAnalysis.structured
      );
      
      expect(styleScore).toBeGreaterThanOrEqual(0);
      expect(styleScore).toBeLessThanOrEqual(1);
    });

    test('should handle style validation errors', async () => {
      const styleScore = await validator.validateStyleAccuracy(
        'non-existent.png',
        testProductImagePath,
        testProductAnalysis.structured
      );
      
      expect(styleScore).toBeGreaterThanOrEqual(0.5);
      expect(styleScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Branding Validation', () => {
    test('should validate branding accuracy', async () => {
      const brandingScore = await validator.validateBrandingAccuracy(
        testGeneratedImagePath,
        testProductImagePath,
        testProductAnalysis.branding
      );
      
      expect(brandingScore).toBeGreaterThanOrEqual(0);
      expect(brandingScore).toBeLessThanOrEqual(1);
    });

    test('should handle branding validation errors', async () => {
      const brandingScore = await validator.validateBrandingAccuracy(
        'non-existent.png',
        testProductImagePath,
        testProductAnalysis.branding
      );
      
      expect(brandingScore).toBeGreaterThanOrEqual(0.6);
      expect(brandingScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Color Comparison Methods', () => {
    test('should compare dominant colors correctly', () => {
      const color1 = { r: 100, g: 150, b: 200 };
      const color2 = { r: 105, g: 145, b: 195 };
      
      const similarity = validator.compareDominantColors(color1, color2);
      expect(similarity).toBeGreaterThan(0.9); // Should be very similar
    });

    test('should compare color distributions correctly', () => {
      const dist1 = { red: 0.3, green: 0.4, blue: 0.3 };
      const dist2 = { red: 0.32, green: 0.38, blue: 0.3 };
      
      const similarity = validator.compareColorDistribution(dist1, dist2);
      expect(similarity).toBeGreaterThan(0.9);
    });

    test('should handle null color comparisons', () => {
      const similarity1 = validator.compareDominantColors(null, { r: 100, g: 100, b: 100 });
      const similarity2 = validator.compareColorDistribution(null, { red: 0.3, green: 0.3, blue: 0.4 });
      
      expect(similarity1).toBe(0.5);
      expect(similarity2).toBe(0.5);
    });
  });

  describe('Texture Analysis', () => {
    test('should analyze texture characteristics', async () => {
      const imageBuffer = await sharp(testProductImagePath)
        .resize(256, 256)
        .grayscale()
        .png()
        .toBuffer();
      
      const texture = await validator.analyzeTexture(imageBuffer);
      
      expect(texture).toHaveProperty('roughness');
      expect(texture).toHaveProperty('uniformity');
      expect(texture.roughness).toBeGreaterThanOrEqual(0);
      expect(texture.roughness).toBeLessThanOrEqual(1);
      expect(texture.uniformity).toBeGreaterThanOrEqual(0);
      expect(texture.uniformity).toBeLessThanOrEqual(1);
    });

    test('should compare textures correctly', () => {
      const texture1 = { roughness: 0.6, uniformity: 0.7 };
      const texture2 = { roughness: 0.65, uniformity: 0.68 };
      
      const similarity = validator.compareTextures(texture1, texture2);
      expect(similarity).toBeGreaterThan(0.9);
    });
  });

  describe('Edge Detection', () => {
    test('should detect edges in image', async () => {
      const imageBuffer = await sharp(testProductImagePath)
        .resize(256, 256)
        .grayscale()
        .png()
        .toBuffer();
      
      const edges = await validator.detectEdges(imageBuffer);
      
      expect(edges).toHaveProperty('density');
      expect(edges).toHaveProperty('strength');
      expect(edges.density).toBeGreaterThanOrEqual(0);
      expect(edges.density).toBeLessThanOrEqual(1);
      expect(edges.strength).toBeGreaterThanOrEqual(0);
      expect(edges.strength).toBeLessThanOrEqual(1);
    });

    test('should compare edge patterns correctly', () => {
      const edges1 = { density: 0.5, strength: 0.6 };
      const edges2 = { density: 0.52, strength: 0.58 };
      
      const similarity = validator.compareEdgePatterns(edges1, edges2);
      expect(similarity).toBeGreaterThan(0.9);
    });
  });

  describe('Structure Analysis', () => {
    test('should analyze image structure', async () => {
      const imageBuffer = await sharp(testProductImagePath)
        .resize(256, 256)
        .grayscale()
        .png()
        .toBuffer();
      
      const structure = await validator.analyzeStructure(imageBuffer);
      
      expect(structure).toHaveProperty('symmetry');
      expect(structure).toHaveProperty('complexity');
      expect(structure.symmetry).toBeGreaterThanOrEqual(0);
      expect(structure.symmetry).toBeLessThanOrEqual(1);
      expect(structure.complexity).toBeGreaterThanOrEqual(0);
      expect(structure.complexity).toBeLessThanOrEqual(1);
    });

    test('should compare structures correctly', () => {
      const structure1 = { symmetry: 0.7, complexity: 0.4 };
      const structure2 = { symmetry: 0.72, complexity: 0.38 };
      
      const similarity = validator.compareStructure(structure1, structure2);
      expect(similarity).toBeGreaterThan(0.9);
    });
  });

  describe('Logo and Branding Detection', () => {
    test('should detect logo regions', async () => {
      const imageBuffer = await sharp(testProductImagePath)
        .resize(256, 256)
        .png()
        .toBuffer();
      
      const logos = await validator.detectLogoRegions(imageBuffer);
      
      expect(logos).toHaveProperty('count');
      expect(logos).toHaveProperty('clarity');
      expect(typeof logos.count).toBe('number');
      expect(typeof logos.clarity).toBe('number');
    });

    test('should detect text elements', async () => {
      const imageBuffer = await sharp(testProductImagePath)
        .resize(256, 256)
        .png()
        .toBuffer();
      
      const text = await validator.detectTextElements(imageBuffer);
      
      expect(text).toHaveProperty('count');
      expect(text).toHaveProperty('clarity');
      expect(typeof text.count).toBe('number');
      expect(typeof text.clarity).toBe('number');
    });

    test('should analyze branding positions', async () => {
      const imageBuffer = await sharp(testProductImagePath)
        .resize(256, 256)
        .png()
        .toBuffer();
      
      const positions = await validator.analyzeBrandingPositions(imageBuffer);
      
      expect(positions).toHaveProperty('chest');
      expect(positions).toHaveProperty('back');
      expect(positions).toHaveProperty('sleeve');
      expect(typeof positions.chest).toBe('boolean');
      expect(typeof positions.back).toBe('boolean');
      expect(typeof positions.sleeve).toBe('boolean');
    });
  });

  describe('Branding Comparison Methods', () => {
    test('should compare logos correctly', () => {
      const logos1 = { count: 1, clarity: 0.8 };
      const logos2 = { count: 1, clarity: 0.75 };
      
      const similarity = validator.compareLogos(logos1, logos2);
      expect(similarity).toBeGreaterThan(0.8);
    });

    test('should compare text elements correctly', () => {
      const text1 = { count: 0, clarity: 0 };
      const text2 = { count: 0, clarity: 0 };
      
      const similarity = validator.compareTextElements(text1, text2);
      expect(similarity).toBeGreaterThan(0.8);
    });

    test('should compare branding positions correctly', () => {
      const positions1 = { chest: true, back: false, sleeve: false };
      const positions2 = { chest: true, back: false, sleeve: false };
      
      const similarity = validator.compareBrandingPosition(positions1, positions2);
      expect(similarity).toBe(1);
    });
  });

  describe('Style Validation Methods', () => {
    test('should validate expected style characteristics', () => {
      const features = {
        texture: { uniformity: 0.7 },
        structure: { complexity: 0.3 },
        edges: { density: 0.4 }
      };
      
      const expectedStyle = {
        garmentType: 't_shirt',
        hasPattern: false
      };
      
      const score = validator.validateExpectedStyle(features, expectedStyle);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('should validate garment type characteristics', () => {
      const features = {
        texture: { uniformity: 0.7 },
        structure: { complexity: 0.3 }
      };
      
      const score = validator.validateGarmentTypeCharacteristics(features, 't_shirt');
      expect(score).toBeGreaterThan(0.8); // Should match t-shirt expectations
    });
  });

  describe('Branding Validation Methods', () => {
    test('should validate expected branding characteristics', () => {
      const branding = {
        logos: { count: 1 },
        text: { count: 0 },
        positions: { chest: true, back: false, sleeve: false }
      };
      
      const expectedBranding = {
        hasLogo: true,
        hasText: false,
        expectedPosition: 'chest'
      };
      
      const score = validator.validateExpectedBranding(branding, expectedBranding);
      expect(score).toBeGreaterThan(0.8);
    });
  });

  describe('Overall Accuracy Calculation', () => {
    test('should calculate overall accuracy correctly', () => {
      const colorScore = 0.8;
      const styleScore = 0.7;
      const brandingScore = 0.9;
      
      const overallScore = validator.calculateOverallAccuracy(colorScore, styleScore, brandingScore);
      
      // Should be weighted average: 0.8*0.5 + 0.7*0.3 + 0.9*0.2 = 0.79
      expect(overallScore).toBeCloseTo(0.79, 2);
    });

    test('should determine pass status correctly', () => {
      // Reset thresholds for test
      validator.setThresholds(0.7, 0.6, 0.8);
      
      const passResult = validator.determinePassStatus(0.8, 0.7, 0.9);
      const failResult = validator.determinePassStatus(0.6, 0.7, 0.9);
      
      expect(passResult).toBe(true);
      expect(failResult).toBe(false);
    });
  });

  describe('Full Product Accuracy Validation', () => {
    test('should validate product accuracy with valid inputs', async () => {
      // Reset thresholds for test
      validator.setThresholds(0.7, 0.6, 0.8);
      
      const result = await validator.validateProductAccuracy(
        testGeneratedImagePath,
        testProductImagePath,
        testProductAnalysis
      );
      
      expect(result).toHaveProperty('colorAccuracy');
      expect(result).toHaveProperty('styleAccuracy');
      expect(result).toHaveProperty('brandingAccuracy');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('passes');
      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('confidence');
      
      expect(Array.isArray(result.feedback)).toBe(true);
      expect(result.feedback.length).toBeGreaterThan(0);
      expect(result.confidence).toBe(0.8);
    });

    test('should handle validation errors gracefully', async () => {
      const result = await validator.validateProductAccuracy(
        'non-existent.png',
        testProductImagePath,
        testProductAnalysis
      );
      
      expect(result.passes).toBe(false);
      expect(result.colorAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.styleAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.brandingAccuracy).toBeGreaterThanOrEqual(0);
      // Note: error handling allows fallback scores rather than complete failure
    });
  });

  describe('Feedback Generation', () => {
    test('should generate appropriate feedback for good scores', () => {
      const feedback = validator.generateAccuracyFeedback(0.8, 0.7, 0.9);
      
      const feedbackText = feedback.join(' ');
      expect(feedbackText).toMatch(/Color accuracy is good/);
      expect(feedbackText).toMatch(/Style accuracy is good/);
      expect(feedbackText).toMatch(/Branding accuracy is excellent/);
    });

    test('should generate appropriate feedback for poor scores', () => {
      const feedback = validator.generateAccuracyFeedback(0.3, 0.2, 0.4);
      
      const feedbackText = feedback.join(' ');
      expect(feedbackText).toMatch(/Color accuracy is very low/);
      expect(feedbackText).toMatch(/Style accuracy is very low/);
      expect(feedbackText).toMatch(/Branding accuracy is low/);
    });

    test('should generate specific feedback for threshold violations', () => {
      validator.setThresholds(0.7, 0.6, 0.8);
      
      const feedback = validator.generateAccuracyFeedback(0.65, 0.55, 0.75);
      
      const feedbackText = feedback.join(' ');
      expect(feedbackText).toMatch(/below threshold|slightly below/);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle corrupted image gracefully', async () => {
      // Create a file with invalid image data
      const corruptedPath = path.join(__dirname, 'corrupted-product.png');
      await fs.writeFile(corruptedPath, 'not an image');
      
      try {
        const result = await validator.validateProductAccuracy(
          corruptedPath,
          testProductImagePath,
          testProductAnalysis
        );
        
        expect(result.passes).toBe(false);
      } finally {
        await fs.unlink(corruptedPath).catch(() => {});
      }
    });

    test('should handle missing product analysis', async () => {
      const result = await validator.validateProductAccuracy(
        testGeneratedImagePath,
        testProductImagePath,
        {} // Empty analysis
      );
      
      expect(result).toHaveProperty('overallScore');
      expect(typeof result.overallScore).toBe('number');
    });
  });

  describe('Performance and Optimization', () => {
    test('should complete validation within reasonable time', async () => {
      const startTime = Date.now();
      
      await validator.validateProductAccuracy(
        testGeneratedImagePath,
        testProductImagePath,
        testProductAnalysis
      );
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle multiple concurrent validations', async () => {
      const promises = Array(3).fill().map(() =>
        validator.validateProductAccuracy(
          testGeneratedImagePath,
          testProductImagePath,
          testProductAnalysis
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