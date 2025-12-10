const { PROFESSIONAL_MODELS, POSES } = require('../config/models');

class PromptBuilder {
  constructor() {
    this.models = PROFESSIONAL_MODELS;
    this.poses = POSES;
  }

  /**
   * Build a complete prompt for try-on generation
   * @param {Object} params - Generation parameters
   * @param {string} params.modelId - Selected model ID
   * @param {string} params.pose - Selected pose
   * @param {string} params.garmentDescription - Description of the garment
   * @param {Array} params.embroideryDetails - Array of embroidery/print details
   * @param {Object} params.productAnalysis - Optional analysis of uploaded product
   * @returns {string} Complete generation prompt
   */
  buildTryOnPrompt({
    modelId,
    pose = 'professional_standing',
    garmentDescription,
    embroideryDetails = [],
    productAnalysis = null
  }) {
    const model = this.models[modelId];
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const poseData = this.poses[pose];
    if (!poseData) {
      throw new Error(`Pose ${pose} not found`);
    }

    // Extract or use garment description
    const finalGarmentDesc = productAnalysis ? 
      this.extractGarmentDescription(productAnalysis) : 
      (garmentDescription || 'the uploaded garment');

    // Build enhanced model description with garment
    const modelPrompt = model.basePrompt.replace('{garment_description}', finalGarmentDesc);
    
    // Add pose specification
    const posePrompt = `, ${poseData.prompt}`;
    
    // Add embroidery/print details if provided
    let embroideryPrompt = '';
    if (embroideryDetails.length > 0) {
      const details = embroideryDetails.map((detail, index) => {
        return `${detail.position}: ${detail.description}`;
      }).join(', ');
      embroideryPrompt = `. The garment features embroidery/printing details: ${details}`;
    }

    // Enhanced quality and try-on specific instructions
    const qualityPrompt = '. IMPORTANT: Maintain exact facial features, skin tone, and body proportions as described. Show the garment fitting naturally on this specific model with realistic draping and proportions. Professional commercial try-on photography, studio lighting, high resolution, clean composition, accurate garment colors matching the reference.';

    // Combine all elements
    const fullPrompt = modelPrompt + posePrompt + embroideryPrompt + qualityPrompt;

    return fullPrompt;
  }

  /**
   * Build system message for AI providers
   * @param {string} providerId - AI provider ID
   * @returns {string} System message
   */
  buildSystemMessage(providerId) {
    const baseMessage = `You are a professional virtual try-on AI system. Your goal is to create photorealistic images showing specific models wearing specific garments. Requirements:

CRITICAL REQUIREMENTS:
- MUST preserve exact facial features, skin tone, and body proportions of the specified model
- MUST accurately represent the garment from the reference image (colors, patterns, design, fit)
- MUST maintain realistic fabric draping and garment fit on the model's body
- MUST preserve embroidery/printing details exactly as specified

TECHNICAL REQUIREMENTS:
- Professional studio photography quality
- Clean composition with appropriate lighting
- High resolution and sharp focus
- Accurate color reproduction
- Natural pose execution

PROHIBITED:
- DO NOT change the model's facial features, ethnicity, or distinctive characteristics
- DO NOT alter garment colors or design from the reference
- DO NOT create unrealistic fits or proportions`;

    switch (providerId) {
      case 'flux_kontext':
        return baseMessage + '\n\nFLUX SPECIFIC: Use the reference image to guide garment details. Prioritize photorealism and anatomical accuracy.';
      
      case 'chatgpt_image':
        return baseMessage + '\n\nDALL-E SPECIFIC: Focus on consistent model identity and professional photography aesthetics.';
      
      case 'gemini_flash':
        return baseMessage + '\n\nGEMINI SPECIFIC: Emphasize natural lighting and authentic fabric representation.';
      
      default:
        return baseMessage;
    }
  }

  /**
   * Extract garment details from product analysis
   * @param {Object} productAnalysis - Analysis results from image processor
   * @returns {string} Formatted garment description
   */
  extractGarmentDescription(productAnalysis) {
    if (!productAnalysis) {
      return 'a garment';
    }

    const { colors, garmentType, style, branding } = productAnalysis;
    
    let description = '';
    
    // Add color information
    if (colors && colors.dominant) {
      const { r, g, b } = colors.dominant;
      description += this.rgbToColorName(r, g, b) + ' ';
    }
    
    // Add garment type
    if (garmentType) {
      description += garmentType;
    } else {
      description += 'garment';
    }
    
    // Add style details
    if (style) {
      if (style.fit) description += ` with ${style.fit} fit`;
      if (style.sleeve) description += `, ${style.sleeve} sleeves`;
      if (style.neckline) description += `, ${style.neckline} neckline`;
    }
    
    return description;
  }

  /**
   * Format embroidery details from uploads
   * @param {Array} detailUploads - Array of detail upload objects
   * @returns {Array} Formatted embroidery details
   */
  formatEmbroideryDetails(detailUploads) {
    return detailUploads.map((upload, index) => {
      return {
        position: upload.position || this.getDefaultPosition(index),
        description: upload.description || `embroidered detail ${index + 1}`,
        type: upload.type || 'embroidery'
      };
    });
  }

  /**
   * Get default embroidery position based on index
   * @param {number} index - Upload index
   * @returns {string} Default position
   */
  getDefaultPosition(index) {
    const positions = ['chest_left', 'chest_center', 'back_center'];
    return positions[index] || 'chest_center';
  }

  /**
   * Convert RGB values to human-readable color name
   * @param {number} r - Red value
   * @param {number} g - Green value  
   * @param {number} b - Blue value
   * @returns {string} Color name
   */
  rgbToColorName(r, g, b) {
    // Simple color name mapping - can be enhanced with more sophisticated color detection
    const colors = {
      black: [0, 0, 0],
      white: [255, 255, 255],
      red: [255, 0, 0],
      green: [0, 255, 0],
      blue: [0, 0, 255],
      navy: [0, 0, 128],
      gray: [128, 128, 128],
      yellow: [255, 255, 0],
      orange: [255, 165, 0],
      purple: [128, 0, 128]
    };

    let closest = 'unknown';
    let minDistance = Infinity;

    for (const [colorName, [cr, cg, cb]] of Object.entries(colors)) {
      const distance = Math.sqrt(
        Math.pow(r - cr, 2) + 
        Math.pow(g - cg, 2) + 
        Math.pow(b - cb, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closest = colorName;
      }
    }

    return closest;
  }

  /**
   * Validate prompt parameters
   * @param {Object} params - Prompt parameters
   * @returns {Object} Validation result
   */
  validatePromptParams(params) {
    const errors = [];
    
    if (!params.modelId || !this.models[params.modelId]) {
      errors.push('Valid model ID is required');
    }
    
    if (!params.garmentDescription) {
      errors.push('Garment description is required');
    }
    
    if (params.pose && !this.poses[params.pose]) {
      errors.push('Invalid pose specified');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = PromptBuilder;