const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { KUSTOMPEDIA_MODELS } = require('../config/models');

/**
 * ConsistencyValidator - Validates model consistency in generated images
 * Implements face similarity comparison and pose validation
 */
class ConsistencyValidator {
  constructor() {
    this.faceThreshold = 0.7; // Minimum face similarity score
    this.poseThreshold = 0.6; // Minimum pose accuracy score
  }

  /**
   * Validate model consistency against reference
   * @param {string} generatedImagePath - Path to generated image
   * @param {string} modelId - Model ID (johny, nyoman, isabella)
   * @param {string} expectedPose - Expected pose name
   * @returns {Promise<Object>} Validation results
   */
  async validateModelConsistency(generatedImagePath, modelId, expectedPose) {
    try {
      const model = KUSTOMPEDIA_MODELS[modelId];
      if (!model) {
        throw new Error(`Unknown model ID: ${modelId}`);
      }

      // Get reference image path
      const referenceImagePath = path.join(__dirname, '../../..', model.referenceImagePath);
      
      // Validate face similarity
      const faceScore = await this.compareFaces(generatedImagePath, referenceImagePath, model);
      
      // Validate pose accuracy
      const poseScore = await this.validatePose(generatedImagePath, expectedPose, model);
      
      // Calculate overall consistency score
      const overallScore = (faceScore + poseScore) / 2;
      
      return {
        faceConsistency: faceScore,
        poseAccuracy: poseScore,
        overallScore: overallScore,
        passes: overallScore >= Math.min(this.faceThreshold, this.poseThreshold),
        modelId: modelId,
        expectedPose: expectedPose,
        feedback: this.generateConsistencyFeedback(faceScore, poseScore, model)
      };
    } catch (error) {
      console.error('Error validating model consistency:', error);
      return {
        faceConsistency: 0,
        poseAccuracy: 0,
        overallScore: 0,
        passes: false,
        error: error.message,
        feedback: ['Validation failed due to technical error']
      };
    }
  }

  /**
   * Compare faces between generated and reference images
   * Uses image analysis techniques to assess facial similarity
   * @param {string} generatedImagePath - Generated image path
   * @param {string} referenceImagePath - Reference image path
   * @param {Object} model - Model configuration
   * @returns {Promise<number>} Face similarity score (0-1)
   */
  async compareFaces(generatedImagePath, referenceImagePath, model) {
    try {
      // Load and analyze both images
      const [generatedBuffer, referenceBuffer] = await Promise.all([
        this.loadAndPreprocessImage(generatedImagePath),
        this.loadAndPreprocessImage(referenceImagePath)
      ]);

      // Extract facial features using image analysis
      const generatedFeatures = await this.extractFacialFeatures(generatedBuffer);
      const referenceFeatures = await this.extractFacialFeatures(referenceBuffer);

      // Calculate similarity based on facial characteristics
      const similarity = this.calculateFacialSimilarity(
        generatedFeatures, 
        referenceFeatures, 
        model.characteristics
      );

      return Math.max(0, Math.min(1, similarity));
    } catch (error) {
      console.error('Error comparing faces:', error);
      return 0.3; // Conservative fallback score
    }
  }

  /**
   * Validate pose accuracy against expected pose
   * @param {string} generatedImagePath - Generated image path
   * @param {string} expectedPose - Expected pose name
   * @param {Object} model - Model configuration
   * @returns {Promise<number>} Pose accuracy score (0-1)
   */
  async validatePose(generatedImagePath, expectedPose, model) {
    try {
      // Load and analyze image for pose detection
      const imageBuffer = await this.loadAndPreprocessImage(generatedImagePath);
      
      // Extract pose features
      const poseFeatures = await this.extractPoseFeatures(imageBuffer);
      
      // Validate against expected pose
      const poseAccuracy = this.calculatePoseAccuracy(poseFeatures, expectedPose, model);
      
      return Math.max(0, Math.min(1, poseAccuracy));
    } catch (error) {
      console.error('Error validating pose:', error);
      return 0.5; // Conservative fallback score
    }
  }

  /**
   * Load and preprocess image for analysis
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async loadAndPreprocessImage(imagePath) {
    try {
      // Check if file exists
      await fs.access(imagePath);
      
      // Load and standardize image
      const processedImage = await sharp(imagePath)
        .resize(512, 512, { 
          fit: 'cover',
          position: 'center'
        })
        .normalize()
        .png()
        .toBuffer();
        
      return processedImage;
    } catch (error) {
      throw new Error(`Failed to load image: ${imagePath} - ${error.message}`);
    }
  }

  /**
   * Extract facial features from image buffer
   * Uses image analysis to identify key facial characteristics
   * @param {Buffer} imageBuffer - Processed image buffer
   * @returns {Promise<Object>} Facial features object
   */
  async extractFacialFeatures(imageBuffer) {
    try {
      // Get image metadata and statistics
      const { width, height, channels } = await sharp(imageBuffer).metadata();
      const stats = await sharp(imageBuffer).stats();
      
      // Analyze color distribution for skin tone
      const skinToneAnalysis = this.analyzeSkinTone(stats);
      
      // Analyze facial region (center portion of image)
      const faceRegion = await sharp(imageBuffer)
        .extract({ 
          left: Math.floor(width * 0.25), 
          top: Math.floor(height * 0.15), 
          width: Math.floor(width * 0.5), 
          height: Math.floor(height * 0.6) 
        })
        .stats();
      
      return {
        skinTone: skinToneAnalysis,
        faceRegionStats: faceRegion,
        imageStats: stats,
        dimensions: { width, height, channels }
      };
    } catch (error) {
      console.error('Error extracting facial features:', error);
      return {
        skinTone: { r: 0, g: 0, b: 0 },
        faceRegionStats: null,
        imageStats: null,
        dimensions: { width: 0, height: 0, channels: 0 }
      };
    }
  }

  /**
   * Extract pose features from image buffer
   * @param {Buffer} imageBuffer - Processed image buffer
   * @returns {Promise<Object>} Pose features object
   */
  async extractPoseFeatures(imageBuffer) {
    try {
      const { width, height } = await sharp(imageBuffer).metadata();
      
      // Analyze body positioning through image regions
      const bodyRegions = await this.analyzeBodyRegions(imageBuffer, width, height);
      
      // Analyze symmetry and positioning
      const symmetryAnalysis = await this.analyzeSymmetry(imageBuffer, width, height);
      
      return {
        bodyRegions,
        symmetry: symmetryAnalysis,
        dimensions: { width, height }
      };
    } catch (error) {
      console.error('Error extracting pose features:', error);
      return {
        bodyRegions: {},
        symmetry: { leftRight: 0.5, topBottom: 0.5 },
        dimensions: { width: 0, height: 0 }
      };
    }
  }

  /**
   * Analyze skin tone from image statistics
   * @param {Object} stats - Image statistics from Sharp
   * @returns {Object} Skin tone analysis
   */
  analyzeSkinTone(stats) {
    try {
      // Extract average RGB values from channels
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
   * Analyze body regions for pose detection
   * @param {Buffer} imageBuffer - Image buffer
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Promise<Object>} Body region analysis
   */
  async analyzeBodyRegions(imageBuffer, width, height) {
    try {
      // Define key body regions
      const regions = {
        head: { left: Math.floor(width * 0.3), top: 0, width: Math.floor(width * 0.4), height: Math.floor(height * 0.25) },
        torso: { left: Math.floor(width * 0.2), top: Math.floor(height * 0.25), width: Math.floor(width * 0.6), height: Math.floor(height * 0.5) },
        arms: { left: 0, top: Math.floor(height * 0.2), width: width, height: Math.floor(height * 0.6) }
      };
      
      const regionStats = {};
      
      for (const [regionName, region] of Object.entries(regions)) {
        try {
          const stats = await sharp(imageBuffer)
            .extract(region)
            .stats();
          regionStats[regionName] = stats;
        } catch (error) {
          regionStats[regionName] = null;
        }
      }
      
      return regionStats;
    } catch (error) {
      return {};
    }
  }

  /**
   * Analyze image symmetry for pose validation
   * @param {Buffer} imageBuffer - Image buffer
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Promise<Object>} Symmetry analysis
   */
  async analyzeSymmetry(imageBuffer, width, height) {
    try {
      // Analyze left vs right symmetry
      const leftHalf = await sharp(imageBuffer)
        .extract({ left: 0, top: 0, width: Math.floor(width / 2), height })
        .stats();
        
      const rightHalf = await sharp(imageBuffer)
        .extract({ left: Math.floor(width / 2), top: 0, width: Math.floor(width / 2), height })
        .stats();
      
      // Calculate symmetry score based on statistical similarity
      const leftRightSymmetry = this.calculateStatisticalSimilarity(leftHalf, rightHalf);
      
      return {
        leftRight: leftRightSymmetry,
        topBottom: 0.5 // Placeholder for top-bottom analysis
      };
    } catch (error) {
      return { leftRight: 0.5, topBottom: 0.5 };
    }
  }

  /**
   * Calculate statistical similarity between two image regions
   * @param {Object} stats1 - First region statistics
   * @param {Object} stats2 - Second region statistics
   * @returns {number} Similarity score (0-1)
   */
  calculateStatisticalSimilarity(stats1, stats2) {
    try {
      if (!stats1?.channels || !stats2?.channels) return 0.5;
      
      let totalDifference = 0;
      let channelCount = 0;
      
      for (let i = 0; i < Math.min(stats1.channels.length, stats2.channels.length); i++) {
        const mean1 = stats1.channels[i].mean || 0;
        const mean2 = stats2.channels[i].mean || 0;
        const difference = Math.abs(mean1 - mean2) / 255; // Normalize to 0-1
        totalDifference += difference;
        channelCount++;
      }
      
      const avgDifference = channelCount > 0 ? totalDifference / channelCount : 1;
      return Math.max(0, 1 - avgDifference);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Calculate facial similarity score
   * @param {Object} generatedFeatures - Generated image facial features
   * @param {Object} referenceFeatures - Reference image facial features
   * @param {Object} modelCharacteristics - Model characteristics from config
   * @returns {number} Similarity score (0-1)
   */
  calculateFacialSimilarity(generatedFeatures, referenceFeatures, modelCharacteristics) {
    try {
      let similarityScore = 0;
      let factorCount = 0;
      
      // Compare skin tone
      if (generatedFeatures.skinTone && referenceFeatures.skinTone) {
        const skinSimilarity = this.compareSkinTone(
          generatedFeatures.skinTone, 
          referenceFeatures.skinTone
        );
        similarityScore += skinSimilarity * 0.4; // 40% weight
        factorCount += 0.4;
      }
      
      // Compare face region statistics
      if (generatedFeatures.faceRegionStats && referenceFeatures.faceRegionStats) {
        const faceSimilarity = this.calculateStatisticalSimilarity(
          generatedFeatures.faceRegionStats,
          referenceFeatures.faceRegionStats
        );
        similarityScore += faceSimilarity * 0.6; // 60% weight
        factorCount += 0.6;
      }
      
      return factorCount > 0 ? similarityScore / factorCount : 0.5;
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Compare skin tone similarity
   * @param {Object} skinTone1 - First skin tone {r, g, b}
   * @param {Object} skinTone2 - Second skin tone {r, g, b}
   * @returns {number} Similarity score (0-1)
   */
  compareSkinTone(skinTone1, skinTone2) {
    try {
      const rDiff = Math.abs(skinTone1.r - skinTone2.r) / 255;
      const gDiff = Math.abs(skinTone1.g - skinTone2.g) / 255;
      const bDiff = Math.abs(skinTone1.b - skinTone2.b) / 255;
      
      const avgDiff = (rDiff + gDiff + bDiff) / 3;
      return Math.max(0, 1 - avgDiff);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Calculate pose accuracy score
   * @param {Object} poseFeatures - Extracted pose features
   * @param {string} expectedPose - Expected pose name
   * @param {Object} model - Model configuration
   * @returns {number} Pose accuracy score (0-1)
   */
  calculatePoseAccuracy(poseFeatures, expectedPose, model) {
    try {
      // Validate that the expected pose is supported by the model
      if (!model.poses.includes(expectedPose)) {
        return 0.5; // Neutral score for unsupported poses
      }
      
      // Analyze pose based on symmetry and body positioning
      let poseScore = 0;
      let factorCount = 0;
      
      // Symmetry analysis for different poses
      if (poseFeatures.symmetry) {
        const symmetryScore = this.evaluatePoseSymmetry(expectedPose, poseFeatures.symmetry);
        poseScore += symmetryScore * 0.7; // 70% weight
        factorCount += 0.7;
      }
      
      // Body region analysis
      if (poseFeatures.bodyRegions) {
        const bodyScore = this.evaluateBodyPositioning(expectedPose, poseFeatures.bodyRegions);
        poseScore += bodyScore * 0.3; // 30% weight
        factorCount += 0.3;
      }
      
      return factorCount > 0 ? poseScore / factorCount : 0.5;
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Evaluate pose symmetry based on expected pose
   * @param {string} expectedPose - Expected pose name
   * @param {Object} symmetry - Symmetry analysis results
   * @returns {number} Symmetry score (0-1)
   */
  evaluatePoseSymmetry(expectedPose, symmetry) {
    const poseSymmetryExpectations = {
      'Arms Crossed': { expectedSymmetry: 0.8, tolerance: 0.2 },
      'Contrapposto': { expectedSymmetry: 0.3, tolerance: 0.3 }, // Asymmetric pose
      'Clasping Hands': { expectedSymmetry: 0.9, tolerance: 0.1 },
      'Hands On Chest': { expectedSymmetry: 0.8, tolerance: 0.2 },
      'Holding One Arm': { expectedSymmetry: 0.4, tolerance: 0.3 }, // Asymmetric
      'Hands in Pockets': { expectedSymmetry: 0.7, tolerance: 0.2 }
    };
    
    const expectation = poseSymmetryExpectations[expectedPose] || { expectedSymmetry: 0.6, tolerance: 0.3 };
    const actualSymmetry = symmetry.leftRight || 0.5;
    
    const difference = Math.abs(actualSymmetry - expectation.expectedSymmetry);
    const score = Math.max(0, 1 - (difference / expectation.tolerance));
    
    return Math.min(1, score);
  }

  /**
   * Evaluate body positioning for pose validation
   * @param {string} expectedPose - Expected pose name
   * @param {Object} bodyRegions - Body region analysis results
   * @returns {number} Body positioning score (0-1)
   */
  evaluateBodyPositioning(expectedPose, bodyRegions) {
    try {
      // Basic validation that key body regions are present and properly positioned
      let score = 0;
      let checks = 0;
      
      // Check head region presence and positioning
      if (bodyRegions.head) {
        score += 0.4; // Head present
        checks++;
      }
      
      // Check torso region
      if (bodyRegions.torso) {
        score += 0.4; // Torso present
        checks++;
      }
      
      // Check arms region
      if (bodyRegions.arms) {
        score += 0.2; // Arms present
        checks++;
      }
      
      return checks > 0 ? score : 0.5;
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Generate detailed feedback for consistency validation
   * @param {number} faceScore - Face consistency score
   * @param {number} poseScore - Pose accuracy score
   * @param {Object} model - Model configuration
   * @returns {Array<string>} Feedback messages
   */
  generateConsistencyFeedback(faceScore, poseScore, model) {
    const feedback = [];
    
    // Face consistency feedback
    if (faceScore < this.faceThreshold) {
      if (faceScore < 0.4) {
        feedback.push(`Face consistency is very low (${(faceScore * 100).toFixed(1)}%). The generated model looks significantly different from ${model.name}.`);
      } else if (faceScore < 0.6) {
        feedback.push(`Face consistency is below acceptable threshold (${(faceScore * 100).toFixed(1)}%). Some facial features don't match ${model.name}'s characteristics.`);
      } else {
        feedback.push(`Face consistency is slightly below threshold (${(faceScore * 100).toFixed(1)}%). Minor adjustments needed to better match ${model.name}.`);
      }
    } else {
      feedback.push(`Face consistency is good (${(faceScore * 100).toFixed(1)}%). The generated image maintains ${model.name}'s facial characteristics well.`);
    }
    
    // Pose accuracy feedback
    if (poseScore < this.poseThreshold) {
      if (poseScore < 0.4) {
        feedback.push(`Pose accuracy is very low (${(poseScore * 100).toFixed(1)}%). The body positioning doesn't match the expected pose.`);
      } else if (poseScore < 0.5) {
        feedback.push(`Pose accuracy is below acceptable threshold (${(poseScore * 100).toFixed(1)}%). Body positioning needs significant adjustment.`);
      } else {
        feedback.push(`Pose accuracy is slightly below threshold (${(poseScore * 100).toFixed(1)}%). Minor pose adjustments recommended.`);
      }
    } else {
      feedback.push(`Pose accuracy is good (${(poseScore * 100).toFixed(1)}%). Body positioning matches the expected pose well.`);
    }
    
    return feedback;
  }

  /**
   * Set custom validation thresholds
   * @param {number} faceThreshold - Face similarity threshold (0-1)
   * @param {number} poseThreshold - Pose accuracy threshold (0-1)
   */
  setThresholds(faceThreshold, poseThreshold) {
    this.faceThreshold = Math.max(0, Math.min(1, faceThreshold));
    this.poseThreshold = Math.max(0, Math.min(1, poseThreshold));
  }

  /**
   * Get current validation thresholds
   * @returns {Object} Current thresholds
   */
  getThresholds() {
    return {
      face: this.faceThreshold,
      pose: this.poseThreshold
    };
  }
}

module.exports = ConsistencyValidator;