const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * ProductAccuracyValidator - Validates product accuracy in generated images
 * Implements color matching, style comparison, and logo/branding validation
 */
class ProductAccuracyValidator {
  constructor() {
    this.colorThreshold = 0.7; // Minimum color accuracy score
    this.styleThreshold = 0.6; // Minimum style accuracy score
    this.brandingThreshold = 0.8; // Minimum branding accuracy score
  }

  /**
   * Validate product accuracy against reference
   * @param {string} generatedImagePath - Path to generated image
   * @param {string} productImagePath - Path to product reference image
   * @param {Object} productAnalysis - Product analysis results
   * @returns {Promise<Object>} Validation results
   */
  async validateProductAccuracy(generatedImagePath, productImagePath, productAnalysis = {}) {
    try {
      // Validate color matching
      const colorScore = await this.validateColorAccuracy(
        generatedImagePath, 
        productImagePath, 
        productAnalysis.colors
      );
      
      // Validate style and pattern matching
      const styleScore = await this.validateStyleAccuracy(
        generatedImagePath, 
        productImagePath, 
        productAnalysis.structured
      );
      
      // Validate logo/branding accuracy
      const brandingScore = await this.validateBrandingAccuracy(
        generatedImagePath, 
        productImagePath, 
        productAnalysis.branding
      );
      
      // Calculate overall accuracy score
      const overallScore = this.calculateOverallAccuracy(colorScore, styleScore, brandingScore);
      
      return {
        colorAccuracy: colorScore,
        styleAccuracy: styleScore,
        brandingAccuracy: brandingScore,
        overallScore: overallScore,
        passes: this.determinePassStatus(colorScore, styleScore, brandingScore),
        feedback: this.generateAccuracyFeedback(colorScore, styleScore, brandingScore),
        confidence: productAnalysis.confidence || 0.5
      };
    } catch (error) {
      console.error('Error validating product accuracy:', error);
      return {
        colorAccuracy: 0,
        styleAccuracy: 0,
        brandingAccuracy: 0,
        overallScore: 0,
        passes: false,
        error: error.message,
        feedback: ['Product accuracy validation failed due to technical error'],
        confidence: 0
      };
    }
  }

  /**
   * Validate color accuracy between generated and reference images
   * @param {string} generatedImagePath - Generated image path
   * @param {string} productImagePath - Product reference image path
   * @param {Object} expectedColors - Expected color profile from analysis
   * @returns {Promise<number>} Color accuracy score (0-1)
   */
  async validateColorAccuracy(generatedImagePath, productImagePath, expectedColors) {
    try {
      // Extract color profiles from both images
      const [generatedColors, referenceColors] = await Promise.all([
        this.extractColorProfile(generatedImagePath),
        this.extractColorProfile(productImagePath)
      ]);
      
      // Compare dominant colors
      const dominantColorScore = this.compareDominantColors(
        generatedColors.dominant, 
        referenceColors.dominant
      );
      
      // Compare color distribution
      const distributionScore = this.compareColorDistribution(
        generatedColors.distribution, 
        referenceColors.distribution
      );
      
      // Compare against expected colors if available
      let expectedColorScore = 0.5; // Neutral if no expected colors
      if (expectedColors && expectedColors.dominant) {
        expectedColorScore = this.compareDominantColors(
          generatedColors.dominant, 
          expectedColors.dominant
        );
      }
      
      // Weighted average of color matching metrics
      const colorScore = (dominantColorScore * 0.4) + (distributionScore * 0.3) + (expectedColorScore * 0.3);
      
      return Math.max(0, Math.min(1, colorScore));
    } catch (error) {
      console.error('Error validating color accuracy:', error);
      return 0.4; // Conservative fallback
    }
  }

  /**
   * Validate style and pattern accuracy
   * @param {string} generatedImagePath - Generated image path
   * @param {string} productImagePath - Product reference image path
   * @param {Object} expectedStyle - Expected style from analysis
   * @returns {Promise<number>} Style accuracy score (0-1)
   */
  async validateStyleAccuracy(generatedImagePath, productImagePath, expectedStyle) {
    try {
      // Extract style features from both images
      const [generatedFeatures, referenceFeatures] = await Promise.all([
        this.extractStyleFeatures(generatedImagePath),
        this.extractStyleFeatures(productImagePath)
      ]);
      
      // Compare texture patterns
      const textureScore = this.compareTextures(
        generatedFeatures.texture, 
        referenceFeatures.texture
      );
      
      // Compare edge patterns (for patterns, prints, etc.)
      const edgeScore = this.compareEdgePatterns(
        generatedFeatures.edges, 
        referenceFeatures.edges
      );
      
      // Compare overall structure
      const structureScore = this.compareStructure(
        generatedFeatures.structure, 
        referenceFeatures.structure
      );
      
      // Validate against expected style if available
      let expectedStyleScore = 0.5;
      if (expectedStyle && expectedStyle.garmentType) {
        expectedStyleScore = this.validateExpectedStyle(generatedFeatures, expectedStyle);
      }
      
      // Weighted combination of style metrics
      const styleScore = (textureScore * 0.3) + (edgeScore * 0.3) + 
                        (structureScore * 0.2) + (expectedStyleScore * 0.2);
      
      return Math.max(0, Math.min(1, styleScore));
    } catch (error) {
      console.error('Error validating style accuracy:', error);
      return 0.5; // Conservative fallback
    }
  }

  /**
   * Validate logo and branding accuracy
   * @param {string} generatedImagePath - Generated image path
   * @param {string} productImagePath - Product reference image path
   * @param {Object} expectedBranding - Expected branding from analysis
   * @returns {Promise<number>} Branding accuracy score (0-1)
   */
  async validateBrandingAccuracy(generatedImagePath, productImagePath, expectedBranding) {
    try {
      // Extract branding features from both images
      const [generatedBranding, referenceBranding] = await Promise.all([
        this.extractBrandingFeatures(generatedImagePath),
        this.extractBrandingFeatures(productImagePath)
      ]);
      
      // Compare logo presence and clarity
      const logoScore = this.compareLogos(
        generatedBranding.logos, 
        referenceBranding.logos
      );
      
      // Compare text elements (embroidery, screen printing)
      const textScore = this.compareTextElements(
        generatedBranding.text, 
        referenceBranding.text
      );
      
      // Compare branding positioning
      const positionScore = this.compareBrandingPosition(
        generatedBranding.positions, 
        referenceBranding.positions
      );
      
      // Validate against expected branding if available
      let expectedBrandingScore = 0.5;
      if (expectedBranding && (expectedBranding.hasLogo || expectedBranding.hasText)) {
        expectedBrandingScore = this.validateExpectedBranding(generatedBranding, expectedBranding);
      }
      
      // Weighted combination of branding metrics
      const brandingScore = (logoScore * 0.4) + (textScore * 0.3) + 
                           (positionScore * 0.2) + (expectedBrandingScore * 0.1);
      
      return Math.max(0, Math.min(1, brandingScore));
    } catch (error) {
      console.error('Error validating branding accuracy:', error);
      return 0.6; // Conservative fallback
    }
  }

  /**
   * Extract color profile from image
   * @param {string} imagePath - Path to image
   * @returns {Promise<Object>} Color profile
   */
  async extractColorProfile(imagePath) {
    try {
      // Load and analyze image
      const imageBuffer = await sharp(imagePath)
        .resize(256, 256, { fit: 'cover' })
        .png()
        .toBuffer();
      
      // Get image statistics
      const stats = await sharp(imageBuffer).stats();
      
      // Extract dominant colors from statistics
      const dominant = this.extractDominantColors(stats);
      
      // Calculate color distribution
      const distribution = this.calculateColorDistribution(stats);
      
      return {
        dominant,
        distribution,
        stats
      };
    } catch (error) {
      console.error('Error extracting color profile:', error);
      return {
        dominant: { r: 0, g: 0, b: 0 },
        distribution: { red: 0, green: 0, blue: 0 },
        stats: null
      };
    }
  }

  /**
   * Extract style features from image
   * @param {string} imagePath - Path to image
   * @returns {Promise<Object>} Style features
   */
  async extractStyleFeatures(imagePath) {
    try {
      const imageBuffer = await sharp(imagePath)
        .resize(512, 512, { fit: 'cover' })
        .grayscale()
        .png()
        .toBuffer();
      
      // Analyze texture using statistical measures
      const texture = await this.analyzeTexture(imageBuffer);
      
      // Detect edges for pattern analysis
      const edges = await this.detectEdges(imageBuffer);
      
      // Analyze overall structure
      const structure = await this.analyzeStructure(imageBuffer);
      
      return {
        texture,
        edges,
        structure
      };
    } catch (error) {
      console.error('Error extracting style features:', error);
      return {
        texture: { roughness: 0.5, uniformity: 0.5 },
        edges: { density: 0.5, strength: 0.5 },
        structure: { symmetry: 0.5, complexity: 0.5 }
      };
    }
  }

  /**
   * Extract branding features from image
   * @param {string} imagePath - Path to image
   * @returns {Promise<Object>} Branding features
   */
  async extractBrandingFeatures(imagePath) {
    try {
      const imageBuffer = await sharp(imagePath)
        .resize(512, 512, { fit: 'cover' })
        .png()
        .toBuffer();
      
      // Detect potential logo regions (high contrast areas)
      const logos = await this.detectLogoRegions(imageBuffer);
      
      // Detect text elements
      const text = await this.detectTextElements(imageBuffer);
      
      // Analyze positioning of branding elements
      const positions = await this.analyzeBrandingPositions(imageBuffer);
      
      return {
        logos,
        text,
        positions
      };
    } catch (error) {
      console.error('Error extracting branding features:', error);
      return {
        logos: { count: 0, clarity: 0 },
        text: { count: 0, clarity: 0 },
        positions: { chest: false, back: false, sleeve: false }
      };
    }
  }

  /**
   * Extract dominant colors from image statistics
   * @param {Object} stats - Image statistics
   * @returns {Object} Dominant color
   */
  extractDominantColors(stats) {
    try {
      const channels = stats.channels || [];
      const r = channels[0]?.mean || 0;
      const g = channels[1]?.mean || 0;
      const b = channels[2]?.mean || 0;
      
      return { r, g, b };
    } catch (error) {
      return { r: 0, g: 0, b: 0 };
    }
  }

  /**
   * Calculate color distribution from statistics
   * @param {Object} stats - Image statistics
   * @returns {Object} Color distribution
   */
  calculateColorDistribution(stats) {
    try {
      const channels = stats.channels || [];
      const total = channels.reduce((sum, channel) => sum + (channel.mean || 0), 0);
      
      if (total === 0) return { red: 0, green: 0, blue: 0 };
      
      return {
        red: (channels[0]?.mean || 0) / total,
        green: (channels[1]?.mean || 0) / total,
        blue: (channels[2]?.mean || 0) / total
      };
    } catch (error) {
      return { red: 0.33, green: 0.33, blue: 0.33 };
    }
  }

  /**
   * Compare dominant colors between two color profiles
   * @param {Object} color1 - First color {r, g, b}
   * @param {Object} color2 - Second color {r, g, b}
   * @returns {number} Similarity score (0-1)
   */
  compareDominantColors(color1, color2) {
    try {
      if (!color1 || !color2) return 0.5;
      
      const rDiff = Math.abs(color1.r - color2.r) / 255;
      const gDiff = Math.abs(color1.g - color2.g) / 255;
      const bDiff = Math.abs(color1.b - color2.b) / 255;
      
      const avgDiff = (rDiff + gDiff + bDiff) / 3;
      return Math.max(0, 1 - avgDiff);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Compare color distribution between two profiles
   * @param {Object} dist1 - First distribution
   * @param {Object} dist2 - Second distribution
   * @returns {number} Similarity score (0-1)
   */
  compareColorDistribution(dist1, dist2) {
    try {
      if (!dist1 || !dist2) return 0.5;
      
      const rDiff = Math.abs(dist1.red - dist2.red);
      const gDiff = Math.abs(dist1.green - dist2.green);
      const bDiff = Math.abs(dist1.blue - dist2.blue);
      
      const avgDiff = (rDiff + gDiff + bDiff) / 3;
      return Math.max(0, 1 - avgDiff);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Analyze texture characteristics of image
   * @param {Buffer} imageBuffer - Grayscale image buffer
   * @returns {Promise<Object>} Texture analysis
   */
  async analyzeTexture(imageBuffer) {
    try {
      const stats = await sharp(imageBuffer).stats();
      
      // Calculate texture roughness based on standard deviation
      const roughness = this.calculateTextureRoughness(stats);
      
      // Calculate uniformity based on variance
      const uniformity = this.calculateTextureUniformity(stats);
      
      return { roughness, uniformity };
    } catch (error) {
      return { roughness: 0.5, uniformity: 0.5 };
    }
  }

  /**
   * Calculate texture roughness from statistics
   * @param {Object} stats - Image statistics
   * @returns {number} Roughness score (0-1)
   */
  calculateTextureRoughness(stats) {
    try {
      const channel = stats.channels?.[0];
      if (!channel) return 0.5;
      
      // Use standard deviation as roughness indicator
      const stdev = channel.stdev || 0;
      const normalizedRoughness = Math.min(1, stdev / 64); // Normalize to 0-1
      
      return normalizedRoughness;
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Calculate texture uniformity from statistics
   * @param {Object} stats - Image statistics
   * @returns {number} Uniformity score (0-1)
   */
  calculateTextureUniformity(stats) {
    try {
      const channel = stats.channels?.[0];
      if (!channel) return 0.5;
      
      // Use inverse of standard deviation as uniformity
      const stdev = channel.stdev || 0;
      const uniformity = Math.max(0, 1 - (stdev / 128)); // Normalize to 0-1
      
      return uniformity;
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Detect edges in image for pattern analysis
   * @param {Buffer} imageBuffer - Grayscale image buffer
   * @returns {Promise<Object>} Edge analysis
   */
  async detectEdges(imageBuffer) {
    try {
      // Apply edge detection using convolution (simplified Sobel-like)
      const edgeBuffer = await sharp(imageBuffer)
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
        })
        .png()
        .toBuffer();
      
      const edgeStats = await sharp(edgeBuffer).stats();
      
      // Calculate edge density and strength
      const density = this.calculateEdgeDensity(edgeStats);
      const strength = this.calculateEdgeStrength(edgeStats);
      
      return { density, strength };
    } catch (error) {
      return { density: 0.5, strength: 0.5 };
    }
  }

  /**
   * Calculate edge density from edge-detected image
   * @param {Object} stats - Edge image statistics
   * @returns {number} Edge density (0-1)
   */
  calculateEdgeDensity(stats) {
    try {
      const channel = stats.channels?.[0];
      if (!channel) return 0.5;
      
      // Higher mean indicates more edges
      const mean = channel.mean || 0;
      const density = Math.min(1, mean / 128);
      
      return density;
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Calculate edge strength from edge-detected image
   * @param {Object} stats - Edge image statistics
   * @returns {number} Edge strength (0-1)
   */
  calculateEdgeStrength(stats) {
    try {
      const channel = stats.channels?.[0];
      if (!channel) return 0.5;
      
      // Higher standard deviation indicates stronger edges
      const stdev = channel.stdev || 0;
      const strength = Math.min(1, stdev / 64);
      
      return strength;
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Analyze overall structure of image
   * @param {Buffer} imageBuffer - Grayscale image buffer
   * @returns {Promise<Object>} Structure analysis
   */
  async analyzeStructure(imageBuffer) {
    try {
      const { width, height } = await sharp(imageBuffer).metadata();
      
      // Analyze symmetry by comparing left/right halves
      const symmetry = await this.calculateImageSymmetry(imageBuffer, width, height);
      
      // Calculate complexity based on variance
      const stats = await sharp(imageBuffer).stats();
      const complexity = this.calculateImageComplexity(stats);
      
      return { symmetry, complexity };
    } catch (error) {
      return { symmetry: 0.5, complexity: 0.5 };
    }
  }

  /**
   * Calculate image symmetry
   * @param {Buffer} imageBuffer - Image buffer
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Promise<number>} Symmetry score (0-1)
   */
  async calculateImageSymmetry(imageBuffer, width, height) {
    try {
      const leftHalf = await sharp(imageBuffer)
        .extract({ left: 0, top: 0, width: Math.floor(width / 2), height })
        .stats();
        
      const rightHalf = await sharp(imageBuffer)
        .extract({ left: Math.floor(width / 2), top: 0, width: Math.floor(width / 2), height })
        .stats();
      
      // Compare statistical similarity
      const similarity = this.compareImageStats(leftHalf, rightHalf);
      return similarity;
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Calculate image complexity
   * @param {Object} stats - Image statistics
   * @returns {number} Complexity score (0-1)
   */
  calculateImageComplexity(stats) {
    try {
      const channel = stats.channels?.[0];
      if (!channel) return 0.5;
      
      // Use standard deviation as complexity indicator
      const stdev = channel.stdev || 0;
      const complexity = Math.min(1, stdev / 64);
      
      return complexity;
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Compare image statistics for similarity
   * @param {Object} stats1 - First image statistics
   * @param {Object} stats2 - Second image statistics
   * @returns {number} Similarity score (0-1)
   */
  compareImageStats(stats1, stats2) {
    try {
      if (!stats1?.channels || !stats2?.channels) return 0.5;
      
      const channel1 = stats1.channels[0];
      const channel2 = stats2.channels[0];
      
      const meanDiff = Math.abs((channel1.mean || 0) - (channel2.mean || 0)) / 255;
      const stdevDiff = Math.abs((channel1.stdev || 0) - (channel2.stdev || 0)) / 64;
      
      const avgDiff = (meanDiff + stdevDiff) / 2;
      return Math.max(0, 1 - avgDiff);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Compare textures between two texture analyses
   * @param {Object} texture1 - First texture analysis
   * @param {Object} texture2 - Second texture analysis
   * @returns {number} Texture similarity (0-1)
   */
  compareTextures(texture1, texture2) {
    try {
      if (!texture1 || !texture2) return 0.5;
      
      const roughnessDiff = Math.abs(texture1.roughness - texture2.roughness);
      const uniformityDiff = Math.abs(texture1.uniformity - texture2.uniformity);
      
      const avgDiff = (roughnessDiff + uniformityDiff) / 2;
      return Math.max(0, 1 - avgDiff);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Compare edge patterns between two edge analyses
   * @param {Object} edges1 - First edge analysis
   * @param {Object} edges2 - Second edge analysis
   * @returns {number} Edge similarity (0-1)
   */
  compareEdgePatterns(edges1, edges2) {
    try {
      if (!edges1 || !edges2) return 0.5;
      
      const densityDiff = Math.abs(edges1.density - edges2.density);
      const strengthDiff = Math.abs(edges1.strength - edges2.strength);
      
      const avgDiff = (densityDiff + strengthDiff) / 2;
      return Math.max(0, 1 - avgDiff);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Compare structure between two structure analyses
   * @param {Object} structure1 - First structure analysis
   * @param {Object} structure2 - Second structure analysis
   * @returns {number} Structure similarity (0-1)
   */
  compareStructure(structure1, structure2) {
    try {
      if (!structure1 || !structure2) return 0.5;
      
      const symmetryDiff = Math.abs(structure1.symmetry - structure2.symmetry);
      const complexityDiff = Math.abs(structure1.complexity - structure2.complexity);
      
      const avgDiff = (symmetryDiff + complexityDiff) / 2;
      return Math.max(0, 1 - avgDiff);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Validate against expected style characteristics
   * @param {Object} features - Extracted style features
   * @param {Object} expectedStyle - Expected style from analysis
   * @returns {number} Style validation score (0-1)
   */
  validateExpectedStyle(features, expectedStyle) {
    try {
      let score = 0.5; // Base score
      
      // Validate garment type expectations
      if (expectedStyle.garmentType) {
        // Different garment types have different expected characteristics
        const typeScore = this.validateGarmentTypeCharacteristics(features, expectedStyle.garmentType);
        score = (score + typeScore) / 2;
      }
      
      // Validate pattern expectations
      if (expectedStyle.hasPattern) {
        const patternScore = features.edges?.density > 0.6 ? 0.8 : 0.3;
        score = (score + patternScore) / 2;
      }
      
      return Math.max(0, Math.min(1, score));
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Validate garment type specific characteristics
   * @param {Object} features - Style features
   * @param {string} garmentType - Expected garment type
   * @returns {number} Validation score (0-1)
   */
  validateGarmentTypeCharacteristics(features, garmentType) {
    const typeExpectations = {
      't_shirt': { expectedUniformity: 0.7, expectedComplexity: 0.3 },
      'polo_shirt': { expectedUniformity: 0.6, expectedComplexity: 0.4 },
      'hoodie': { expectedUniformity: 0.5, expectedComplexity: 0.6 },
      'jacket': { expectedUniformity: 0.4, expectedComplexity: 0.7 }
    };
    
    const expectations = typeExpectations[garmentType] || { expectedUniformity: 0.5, expectedComplexity: 0.5 };
    
    const uniformityDiff = Math.abs(features.texture?.uniformity - expectations.expectedUniformity);
    const complexityDiff = Math.abs(features.structure?.complexity - expectations.expectedComplexity);
    
    const avgDiff = (uniformityDiff + complexityDiff) / 2;
    return Math.max(0, 1 - avgDiff);
  }

  /**
   * Detect logo regions in image
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<Object>} Logo detection results
   */
  async detectLogoRegions(imageBuffer) {
    try {
      // Detect high contrast regions that might contain logos
      const contrastBuffer = await sharp(imageBuffer)
        .normalise()
        .convolve({
          width: 3,
          height: 3,
          kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0] // Sharpening kernel
        })
        .png()
        .toBuffer();
      
      const stats = await sharp(contrastBuffer).stats();
      
      // Estimate logo presence based on contrast variation
      const count = this.estimateLogoCount(stats);
      const clarity = this.estimateLogoClarity(stats);
      
      return { count, clarity };
    } catch (error) {
      return { count: 0, clarity: 0 };
    }
  }

  /**
   * Estimate logo count from image statistics
   * @param {Object} stats - Image statistics
   * @returns {number} Estimated logo count
   */
  estimateLogoCount(stats) {
    try {
      const channel = stats.channels?.[0];
      if (!channel) return 0;
      
      // High standard deviation might indicate logo presence
      const stdev = channel.stdev || 0;
      const count = stdev > 40 ? 1 : 0; // Simple threshold
      
      return count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Estimate logo clarity from image statistics
   * @param {Object} stats - Image statistics
   * @returns {number} Logo clarity score (0-1)
   */
  estimateLogoClarity(stats) {
    try {
      const channel = stats.channels?.[0];
      if (!channel) return 0;
      
      // Higher contrast indicates clearer logos
      const stdev = channel.stdev || 0;
      const clarity = Math.min(1, stdev / 64);
      
      return clarity;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Detect text elements in image
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<Object>} Text detection results
   */
  async detectTextElements(imageBuffer) {
    try {
      // Apply edge detection to find text-like patterns
      const edgeBuffer = await sharp(imageBuffer)
        .grayscale()
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, 0, 1, -2, 0, 2, -1, 0, 1] // Sobel X
        })
        .png()
        .toBuffer();
      
      const stats = await sharp(edgeBuffer).stats();
      
      // Estimate text presence and clarity
      const count = this.estimateTextCount(stats);
      const clarity = this.estimateTextClarity(stats);
      
      return { count, clarity };
    } catch (error) {
      return { count: 0, clarity: 0 };
    }
  }

  /**
   * Estimate text count from edge statistics
   * @param {Object} stats - Edge image statistics
   * @returns {number} Estimated text count
   */
  estimateTextCount(stats) {
    try {
      const channel = stats.channels?.[0];
      if (!channel) return 0;
      
      // Text creates specific edge patterns
      const mean = channel.mean || 0;
      const count = mean > 20 ? 1 : 0; // Simple threshold
      
      return count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Estimate text clarity from edge statistics
   * @param {Object} stats - Edge image statistics
   * @returns {number} Text clarity score (0-1)
   */
  estimateTextClarity(stats) {
    try {
      const channel = stats.channels?.[0];
      if (!channel) return 0;
      
      // Clear text has strong, consistent edges
      const stdev = channel.stdev || 0;
      const clarity = Math.min(1, stdev / 32);
      
      return clarity;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Analyze branding positions in image
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<Object>} Position analysis
   */
  async analyzeBrandingPositions(imageBuffer) {
    try {
      const { width, height } = await sharp(imageBuffer).metadata();
      
      // Define regions for common branding positions
      const regions = {
        chest: { left: Math.floor(width * 0.3), top: Math.floor(height * 0.3), 
                width: Math.floor(width * 0.4), height: Math.floor(height * 0.3) },
        back: { left: Math.floor(width * 0.2), top: Math.floor(height * 0.2), 
               width: Math.floor(width * 0.6), height: Math.floor(height * 0.6) },
        sleeve: { left: 0, top: Math.floor(height * 0.3), 
                 width: Math.floor(width * 0.3), height: Math.floor(height * 0.4) }
      };
      
      const positions = {};
      
      // Analyze each region for branding presence
      for (const [position, region] of Object.entries(regions)) {
        try {
          const regionBuffer = await sharp(imageBuffer).extract(region).png().toBuffer();
          const stats = await sharp(regionBuffer).stats();
          
          // Simple heuristic: high variance might indicate branding
          const channel = stats.channels?.[0];
          const variance = channel ? (channel.stdev || 0) : 0;
          positions[position] = variance > 30; // Threshold for branding presence
        } catch (error) {
          positions[position] = false;
        }
      }
      
      return positions;
    } catch (error) {
      return { chest: false, back: false, sleeve: false };
    }
  }

  /**
   * Compare logos between two branding analyses
   * @param {Object} logos1 - First logo analysis
   * @param {Object} logos2 - Second logo analysis
   * @returns {number} Logo similarity (0-1)
   */
  compareLogos(logos1, logos2) {
    try {
      if (!logos1 || !logos2) return 0.5;
      
      // Compare logo count and clarity
      const countMatch = logos1.count === logos2.count ? 1 : 0.3;
      const clarityDiff = Math.abs(logos1.clarity - logos2.clarity);
      const claritySimilarity = Math.max(0, 1 - clarityDiff);
      
      return (countMatch * 0.6) + (claritySimilarity * 0.4);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Compare text elements between two branding analyses
   * @param {Object} text1 - First text analysis
   * @param {Object} text2 - Second text analysis
   * @returns {number} Text similarity (0-1)
   */
  compareTextElements(text1, text2) {
    try {
      if (!text1 || !text2) return 0.5;
      
      // Compare text count and clarity
      const countMatch = text1.count === text2.count ? 1 : 0.3;
      const clarityDiff = Math.abs(text1.clarity - text2.clarity);
      const claritySimilarity = Math.max(0, 1 - clarityDiff);
      
      return (countMatch * 0.6) + (claritySimilarity * 0.4);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Compare branding positions between two analyses
   * @param {Object} positions1 - First position analysis
   * @param {Object} positions2 - Second position analysis
   * @returns {number} Position similarity (0-1)
   */
  compareBrandingPosition(positions1, positions2) {
    try {
      if (!positions1 || !positions2) return 0.5;
      
      const positionKeys = ['chest', 'back', 'sleeve'];
      let matches = 0;
      
      for (const key of positionKeys) {
        if (positions1[key] === positions2[key]) {
          matches++;
        }
      }
      
      return matches / positionKeys.length;
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Validate against expected branding characteristics
   * @param {Object} branding - Extracted branding features
   * @param {Object} expectedBranding - Expected branding from analysis
   * @returns {number} Branding validation score (0-1)
   */
  validateExpectedBranding(branding, expectedBranding) {
    try {
      let score = 0.5; // Base score
      let factors = 0;
      
      // Check logo expectations
      if (expectedBranding.hasLogo !== undefined) {
        const logoPresent = branding.logos?.count > 0;
        const logoMatch = logoPresent === expectedBranding.hasLogo ? 1 : 0.2;
        score += logoMatch;
        factors++;
      }
      
      // Check text expectations
      if (expectedBranding.hasText !== undefined) {
        const textPresent = branding.text?.count > 0;
        const textMatch = textPresent === expectedBranding.hasText ? 1 : 0.2;
        score += textMatch;
        factors++;
      }
      
      // Check position expectations
      if (expectedBranding.expectedPosition) {
        const positionMatch = branding.positions?.[expectedBranding.expectedPosition] ? 1 : 0.3;
        score += positionMatch;
        factors++;
      }
      
      return factors > 0 ? score / (factors + 1) : 0.5; // +1 for base score
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Calculate overall accuracy score from individual metrics
   * @param {number} colorScore - Color accuracy score
   * @param {number} styleScore - Style accuracy score
   * @param {number} brandingScore - Branding accuracy score
   * @returns {number} Overall accuracy score (0-1)
   */
  calculateOverallAccuracy(colorScore, styleScore, brandingScore) {
    // Weighted average: color is most important, then style, then branding
    return (colorScore * 0.5) + (styleScore * 0.3) + (brandingScore * 0.2);
  }

  /**
   * Determine if validation passes based on individual scores
   * @param {number} colorScore - Color accuracy score
   * @param {number} styleScore - Style accuracy score
   * @param {number} brandingScore - Branding accuracy score
   * @returns {boolean} Whether validation passes
   */
  determinePassStatus(colorScore, styleScore, brandingScore) {
    return colorScore >= this.colorThreshold && 
           styleScore >= this.styleThreshold && 
           brandingScore >= this.brandingThreshold;
  }

  /**
   * Generate detailed feedback for accuracy validation
   * @param {number} colorScore - Color accuracy score
   * @param {number} styleScore - Style accuracy score
   * @param {number} brandingScore - Branding accuracy score
   * @returns {Array<string>} Feedback messages
   */
  generateAccuracyFeedback(colorScore, styleScore, brandingScore) {
    const feedback = [];
    
    // Color accuracy feedback
    if (colorScore < this.colorThreshold) {
      if (colorScore < 0.4) {
        feedback.push(`Color accuracy is very low (${(colorScore * 100).toFixed(1)}%). The garment colors don't match the reference product.`);
      } else if (colorScore < 0.6) {
        feedback.push(`Color accuracy is below acceptable threshold (${(colorScore * 100).toFixed(1)}%). Some color variations from the reference product.`);
      } else {
        feedback.push(`Color accuracy is slightly below threshold (${(colorScore * 100).toFixed(1)}%). Minor color adjustments needed.`);
      }
    } else {
      feedback.push(`Color accuracy is good (${(colorScore * 100).toFixed(1)}%). The garment colors match the reference product well.`);
    }
    
    // Style accuracy feedback
    if (styleScore < this.styleThreshold) {
      if (styleScore < 0.4) {
        feedback.push(`Style accuracy is very low (${(styleScore * 100).toFixed(1)}%). The garment style and patterns don't match the reference.`);
      } else if (styleScore < 0.5) {
        feedback.push(`Style accuracy is below acceptable threshold (${(styleScore * 100).toFixed(1)}%). Style and pattern details need improvement.`);
      } else {
        feedback.push(`Style accuracy is slightly below threshold (${(styleScore * 100).toFixed(1)}%). Minor style adjustments recommended.`);
      }
    } else {
      feedback.push(`Style accuracy is good (${(styleScore * 100).toFixed(1)}%). The garment style and patterns match the reference well.`);
    }
    
    // Branding accuracy feedback
    if (brandingScore < this.brandingThreshold) {
      if (brandingScore < 0.5) {
        feedback.push(`Branding accuracy is low (${(brandingScore * 100).toFixed(1)}%). Logo and text elements are not clearly visible or positioned correctly.`);
      } else if (brandingScore < 0.7) {
        feedback.push(`Branding accuracy is below acceptable threshold (${(brandingScore * 100).toFixed(1)}%). Logo/text clarity or positioning needs improvement.`);
      } else {
        feedback.push(`Branding accuracy is slightly below threshold (${(brandingScore * 100).toFixed(1)}%). Minor branding enhancements needed.`);
      }
    } else {
      feedback.push(`Branding accuracy is excellent (${(brandingScore * 100).toFixed(1)}%). Logo and text elements are clear and well-positioned.`);
    }
    
    return feedback;
  }

  /**
   * Set custom validation thresholds
   * @param {number} colorThreshold - Color accuracy threshold (0-1)
   * @param {number} styleThreshold - Style accuracy threshold (0-1)
   * @param {number} brandingThreshold - Branding accuracy threshold (0-1)
   */
  setThresholds(colorThreshold, styleThreshold, brandingThreshold) {
    this.colorThreshold = Math.max(0, Math.min(1, colorThreshold));
    this.styleThreshold = Math.max(0, Math.min(1, styleThreshold));
    this.brandingThreshold = Math.max(0, Math.min(1, brandingThreshold));
  }

  /**
   * Get current validation thresholds
   * @returns {Object} Current thresholds
   */
  getThresholds() {
    return {
      color: this.colorThreshold,
      style: this.styleThreshold,
      branding: this.brandingThreshold
    };
  }
}

module.exports = ProductAccuracyValidator;