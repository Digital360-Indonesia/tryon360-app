const FluxService = require('./flux');
const OpenAIService = require('./openai');
const EnhancedProductAnalysisService = require('./enhancedProductAnalysis');
const path = require('path');
const fs = require('fs');

class EnhancedGenerationService {
  constructor() {
    this.fluxService = new FluxService();
    this.openaiService = new OpenAIService();
    this.analysisService = new EnhancedProductAnalysisService();
    
    console.log('🚀 Enhanced Generation Service initialized');
  }

  async generateWithConsistency(options) {
    const {
      modelId,
      model,
      referenceImagePath,
      prompt,
      productImagePath = null,
      pose = 'arms crossed',
      size = '1024x1024',
      generativeModel = 'flux',
      qualityTier = 'standard',
      consistencyPriority = 0.7,
      accuracyPriority = 0.8,
      retryLimit = 3,
      validationThreshold = 0.7,
      fallbackStrategy = 'balanced',
      enableMultiStage = true,
      enableAutoFallback = true
    } = options;

    console.log('🎯 Starting enhanced generation with consistency focus');
    console.log(`📊 Priorities - Consistency: ${consistencyPriority}, Accuracy: ${accuracyPriority}`);
    console.log(`🔄 Retry limit: ${retryLimit}, Validation threshold: ${validationThreshold}`);

    try {
      // Enhanced product analysis if product image provided
      let enhancedProductAnalysis = null;
      if (productImagePath) {
        console.log('🔍 Running enhanced product analysis...');
        enhancedProductAnalysis = await this.analysisService.analyzeProduct(productImagePath);
        
        if (enhancedProductAnalysis.success) {
          console.log(`✅ Product analysis completed with confidence: ${enhancedProductAnalysis.confidence}`);
        } else {
          console.log('⚠️ Product analysis failed, proceeding with basic approach');
        }
      }

      // Determine generation strategy based on priorities and available data
      const strategy = this.determineGenerationStrategy({
        consistencyPriority,
        accuracyPriority,
        hasProductImage: !!productImagePath,
        productAnalysisQuality: enhancedProductAnalysis?.confidence || 0,
        fallbackStrategy,
        enableMultiStage
      });

      console.log(`🎯 Using generation strategy: ${strategy}`);

      let result;
      switch (strategy) {
        case 'multi-stage':
          result = await this.generateMultiStage({
            model,
            referenceImagePath,
            prompt,
            productImagePath,
            enhancedProductAnalysis,
            pose,
            size,
            generativeModel
          });
          break;

        case 'model-first':
          result = await this.generateModelFirst({
            model,
            referenceImagePath,
            prompt,
            productImagePath,
            enhancedProductAnalysis,
            pose,
            size,
            generativeModel
          });
          break;

        case 'product-first':
          result = await this.generateProductFirst({
            model,
            referenceImagePath,
            prompt,
            productImagePath,
            enhancedProductAnalysis,
            pose,
            size,
            generativeModel
          });
          break;

        case 'balanced':
        default:
          result = await this.generateBalanced({
            model,
            referenceImagePath,
            prompt,
            productImagePath,
            enhancedProductAnalysis,
            pose,
            size,
            generativeModel
          });
          break;
      }

      if (result.success) {
        console.log('✅ Enhanced generation completed successfully');
        return {
          ...result,
          strategy: strategy,
          productAnalysis: enhancedProductAnalysis,
          enhancedGeneration: true
        };
      } else {
        console.log('❌ Enhanced generation failed, attempting fallback');
        return await this.handleGenerationFailure(options, result.error);
      }

    } catch (error) {
      console.error('❌ Error in enhanced generation:', error.message);
      return await this.handleGenerationFailure(options, error.message);
    }
  }

  determineGenerationStrategy(options) {
    const {
      consistencyPriority,
      accuracyPriority,
      hasProductImage,
      productAnalysisQuality,
      fallbackStrategy,
      enableMultiStage = true
    } = options;

    // If multi-stage is disabled, never use multi-stage strategy
    if (!enableMultiStage && fallbackStrategy === 'multi-stage') {
      console.log('⚠️ Multi-stage disabled, falling back to balanced strategy');
      return 'balanced';
    }

    // If no product image, focus on model consistency
    if (!hasProductImage) {
      return 'model-first';
    }

    // If product analysis quality is low, use balanced approach
    if (productAnalysisQuality < 0.5) {
      return 'balanced';
    }

    // If consistency is much more important than accuracy
    if (consistencyPriority > accuracyPriority + 0.2) {
      return 'model-first';
    }

    // If accuracy is much more important than consistency
    if (accuracyPriority > consistencyPriority + 0.2) {
      return 'product-first';
    }

    // If both are high priority and we have good product analysis, use multi-stage (if enabled)
    if (enableMultiStage && consistencyPriority >= 0.7 && accuracyPriority >= 0.7 && productAnalysisQuality >= 0.7) {
      return 'multi-stage';
    }

    // Default to fallback strategy (but check if multi-stage is allowed)
    if (!enableMultiStage && fallbackStrategy === 'multi-stage') {
      return 'balanced';
    }

    return fallbackStrategy;
  }

  async generateMultiStage(options) {
    const {
      model,
      referenceImagePath,
      prompt,
      productImagePath,
      enhancedProductAnalysis,
      pose,
      size,
      generativeModel
    } = options;

    console.log('🎯🎯 MULTI-STAGE GENERATION: Perfect consistency + Perfect accuracy');

    try {
      // STAGE 1: Generate perfect model consistency (face + pose)
      console.log('1️⃣ STAGE 1: Perfect model consistency');
      
      const stage1Prompt = this.buildStage1Prompt(model, pose);
      const stage1Options = {
        size,
        productImagePath: null, // No product interference in stage 1
        useMultiStep: false,
        useReverseApproach: false
      };

      let stage1Result;
      if (generativeModel === 'flux') {
        stage1Result = await this.fluxService.generateImageWithReference(
          referenceImagePath,
          stage1Prompt,
          stage1Options
        );
      } else {
        stage1Result = await this.openaiService.generateImageWithReference(
          referenceImagePath,
          stage1Prompt,
          stage1Options
        );
      }

      if (!stage1Result.success) {
        console.error('❌ Stage 1 failed:', stage1Result.error);
        return stage1Result;
      }

      console.log('✅ Stage 1 completed - Perfect model generated');

      // Download Stage 1 result for Stage 2 input
      const stage1ImagePath = await this.downloadImageForNextStage(stage1Result.imageUrl, 'stage1');

      // STAGE 2: Apply product details while preserving model
      console.log('2️⃣ STAGE 2: Apply product with model preservation');
      
      const stage2Prompt = this.buildStage2Prompt(enhancedProductAnalysis, pose);
      const stage2Options = {
        size,
        productImagePath, // Now use the product reference
        useMultiStep: false,
        useReverseApproach: false
      };

      // Use relative path for stage 2
      const stage1RelativePath = path.relative(path.join(__dirname, '../../'), stage1ImagePath);

      let stage2Result;
      if (generativeModel === 'flux') {
        stage2Result = await this.fluxService.generateImageWithReference(
          stage1RelativePath,
          stage2Prompt,
          stage2Options
        );
      } else {
        stage2Result = await this.openaiService.generateImageWithReference(
          stage1RelativePath,
          stage2Prompt,
          stage2Options
        );
      }

      if (!stage2Result.success) {
        console.error('❌ Stage 2 failed:', stage2Result.error);
        return stage2Result;
      }

      console.log('✅ Stage 2 completed - Product applied to perfect model');
      console.log('🎉 MULTI-STAGE GENERATION COMPLETE!');

      // Clean up temporary stage 1 image
      this.cleanupTempFile(stage1ImagePath);

      return {
        success: true,
        imageUrl: stage2Result.imageUrl,
        stage1Url: stage1Result.imageUrl,
        stage2Url: stage2Result.imageUrl,
        revisedPrompt: stage2Prompt,
        modelUsed: `${generativeModel}-multi-stage`,
        stages: {
          stage1: {
            prompt: stage1Prompt,
            result: stage1Result.imageUrl
          },
          stage2: {
            prompt: stage2Prompt,
            result: stage2Result.imageUrl
          }
        }
      };

    } catch (error) {
      console.error('❌ Multi-stage generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateModelFirst(options) {
    const {
      model,
      referenceImagePath,
      prompt,
      productImagePath,
      enhancedProductAnalysis,
      pose,
      size,
      generativeModel
    } = options;

    console.log('👤 MODEL-FIRST GENERATION: Prioritizing model consistency');

    try {
      const enhancedPrompt = this.buildModelFirstPrompt(model, prompt, enhancedProductAnalysis, pose);
      
      const generationOptions = {
        size,
        productImagePath,
        modelPriority: true,
        enhancedProductAnalysis
      };

      let result;
      if (generativeModel === 'flux') {
        result = await this.fluxService.generateImageWithReference(
          referenceImagePath,
          enhancedPrompt,
          generationOptions
        );
      } else {
        result = await this.openaiService.generateImageWithReference(
          referenceImagePath,
          enhancedPrompt,
          generationOptions
        );
      }

      if (result.success) {
        result.modelUsed = `${generativeModel}-model-first`;
        result.strategy = 'model-first';
      }

      return result;

    } catch (error) {
      console.error('❌ Model-first generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateProductFirst(options) {
    const {
      model,
      referenceImagePath,
      prompt,
      productImagePath,
      enhancedProductAnalysis,
      pose,
      size,
      generativeModel
    } = options;

    console.log('👕 PRODUCT-FIRST GENERATION: Prioritizing product accuracy');

    try {
      const enhancedPrompt = this.buildProductFirstPrompt(model, prompt, enhancedProductAnalysis, pose);
      
      const generationOptions = {
        size,
        productImagePath,
        productPriority: true,
        enhancedProductAnalysis,
        useReverseApproach: true // Use product as primary input
      };

      let result;
      if (generativeModel === 'flux') {
        result = await this.fluxService.generateImageWithReference(
          referenceImagePath,
          enhancedPrompt,
          generationOptions
        );
      } else {
        result = await this.openaiService.generateImageWithReference(
          referenceImagePath,
          enhancedPrompt,
          generationOptions
        );
      }

      if (result.success) {
        result.modelUsed = `${generativeModel}-product-first`;
        result.strategy = 'product-first';
      }

      return result;

    } catch (error) {
      console.error('❌ Product-first generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateBalanced(options) {
    const {
      model,
      referenceImagePath,
      prompt,
      productImagePath,
      enhancedProductAnalysis,
      pose,
      size,
      generativeModel
    } = options;

    console.log('⚖️ BALANCED GENERATION: Equal priority for consistency and accuracy');

    try {
      const enhancedPrompt = this.buildBalancedPrompt(model, prompt, enhancedProductAnalysis, pose);
      
      const generationOptions = {
        size,
        productImagePath,
        enhancedProductAnalysis,
        balanced: true
      };

      let result;
      if (generativeModel === 'flux') {
        result = await this.fluxService.generateImageWithReference(
          referenceImagePath,
          enhancedPrompt,
          generationOptions
        );
      } else {
        result = await this.openaiService.generateImageWithReference(
          referenceImagePath,
          enhancedPrompt,
          generationOptions
        );
      }

      if (result.success) {
        result.modelUsed = `${generativeModel}-balanced`;
        result.strategy = 'balanced';
      }

      return result;

    } catch (error) {
      console.error('❌ Balanced generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  buildStage1Prompt(model, pose) {
    const modelCharacteristics = this.getModelCharacteristics(model);
    
    return `STAGE 1 - PERFECT MODEL CONSISTENCY: Generate the exact same person with perfect facial consistency. 
    
PRESERVE EXACTLY: ${modelCharacteristics}
POSE CHANGE: Adjust to ${pose.toLowerCase()} pose while maintaining all facial features and body characteristics.
CLOTHING: Keep current clothing for now (will be changed in stage 2).
QUALITY: Professional fashion photography with studio lighting.
CRITICAL: 100% facial consistency - same face, hair, skin tone, eyes, expression, body structure.`;
  }

  buildStage2Prompt(enhancedProductAnalysis, pose) {
    if (!enhancedProductAnalysis || !enhancedProductAnalysis.success) {
      return `STAGE 2 - CLOTHING REPLACEMENT: Replace ONLY the clothing with the garment from the product reference image. 
      
PRESERVE: Exact same face, hair, skin tone, pose (${pose.toLowerCase()}), body position, and background.
CHANGE ONLY: Clothing/garment to match the uploaded product reference exactly.
SURGICAL PRECISION: Do not alter anything about the person except the clothing.`;
    }

    const structured = enhancedProductAnalysis.structured;
    const branding = enhancedProductAnalysis.branding?.structured || {};
    
    let prompt = `STAGE 2 - PRECISE CLOTHING APPLICATION: Replace ONLY the clothing with this exact garment:

GARMENT DETAILS:
- Type: ${structured.garment_type || 'garment'}
- Color: ${structured.primary_color || 'as shown'}
- Material: ${structured.material || 'as shown'}
- Style: ${structured.style || 'as shown'}
- Fit: ${structured.fit || 'as shown'}
- Sleeves: ${structured.sleeve_type || 'as shown'}
- Collar: ${structured.collar || 'as shown'}`;

    if (branding.brand_name && branding.brand_name !== 'Unknown') {
      prompt += `
BRANDING DETAILS:
- Brand: ${branding.brand_name}
- Logo Type: ${branding.logo_type || 'as shown'}
- Logo Position: ${branding.logo_position || 'as shown'}
- Logo Colors: ${branding.logo_colors || 'as shown'}`;
    }

    prompt += `

CRITICAL PRESERVATION: Keep exact same face, hair, skin tone, ${pose.toLowerCase()} pose, body position, and background.
CHANGE ONLY: Clothing to match these specifications exactly.
QUALITY: Professional fashion photography with studio lighting.`;

    return prompt;
  }

  buildModelFirstPrompt(model, basePrompt, enhancedProductAnalysis, pose) {
    const modelCharacteristics = this.getModelCharacteristics(model);
    
    let prompt = `MODEL-FIRST PRIORITY: Maintain perfect model consistency while applying clothing changes.

CRITICAL MODEL PRESERVATION: ${modelCharacteristics}
POSE: ${pose.toLowerCase()} pose
CLOTHING CHANGE: ${basePrompt}`;

    if (enhancedProductAnalysis?.success && enhancedProductAnalysis.structured) {
      const structured = enhancedProductAnalysis.structured;
      prompt += `

PRODUCT REFERENCE (Secondary Priority):
- ${structured.primary_color || ''} ${structured.garment_type || 'garment'}
- Material: ${structured.material || 'as shown'}
- Style: ${structured.style || 'as shown'}`;
    }

    prompt += `

PRIORITY ORDER: 1) Model face consistency, 2) Pose accuracy, 3) Product details
QUALITY: Professional fashion photography with studio lighting.`;

    return prompt;
  }

  buildProductFirstPrompt(model, basePrompt, enhancedProductAnalysis, pose) {
    let prompt = `PRODUCT-FIRST PRIORITY: Achieve maximum product accuracy while maintaining recognizable model.

CLOTHING SPECIFICATIONS: ${basePrompt}`;

    if (enhancedProductAnalysis?.success && enhancedProductAnalysis.structured) {
      const structured = enhancedProductAnalysis.structured;
      const branding = enhancedProductAnalysis.branding?.structured || {};
      
      prompt += `

EXACT PRODUCT MATCH:
- Type: ${structured.garment_type || 'garment'}
- Color: ${structured.primary_color || 'as shown'} (EXACT MATCH REQUIRED)
- Material: ${structured.material || 'as shown'}
- Pattern: ${structured.pattern || 'as shown'}
- Style: ${structured.style || 'as shown'}
- Fit: ${structured.fit || 'as shown'}`;

      if (branding.brand_name && branding.brand_name !== 'Unknown') {
        prompt += `
- Branding: ${branding.brand_name} ${branding.logo_type || ''} on ${branding.logo_position || 'garment'}`;
      }
    }

    const modelCharacteristics = this.getModelCharacteristics(model);
    prompt += `

MODEL REFERENCE (Secondary Priority): ${modelCharacteristics}
POSE: ${pose.toLowerCase()} pose
PRIORITY ORDER: 1) Product accuracy, 2) Color matching, 3) Model resemblance
QUALITY: Professional fashion photography with studio lighting.`;

    return prompt;
  }

  buildBalancedPrompt(model, basePrompt, enhancedProductAnalysis, pose) {
    const modelCharacteristics = this.getModelCharacteristics(model);
    
    let prompt = `BALANCED GENERATION: Equal priority for model consistency and product accuracy.

MODEL CONSISTENCY: ${modelCharacteristics}
POSE: ${pose.toLowerCase()} pose
CLOTHING CHANGE: ${basePrompt}`;

    if (enhancedProductAnalysis?.success && enhancedProductAnalysis.structured) {
      const structured = enhancedProductAnalysis.structured;
      prompt += `

PRODUCT ACCURACY:
- ${structured.primary_color || ''} ${structured.garment_type || 'garment'}
- Material: ${structured.material || 'as shown'}
- Style: ${structured.style || 'as shown'}
- Fit: ${structured.fit || 'as shown'}`;
    }

    prompt += `

EQUAL PRIORITY: Model consistency AND product accuracy are equally important.
QUALITY: Professional fashion photography with studio lighting.`;

    return prompt;
  }

  getModelCharacteristics(model) {
    if (!model || !model.characteristics) {
      return 'Same person with identical facial features';
    }

    const char = model.characteristics;
    return `${char.ethnicity || ''} ${char.gender || ''}, ${char.age || ''}, ${char.hair || ''}, ${char.facial_hair || ''}, ${char.build || ''} build, ${char.expression || ''} expression`.trim();
  }

  async downloadImageForNextStage(imageUrl, stageName) {
    try {
      console.log(`⬇️ Downloading ${stageName} result for next stage...`);
      
      const axios = require('axios');
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      
      // Save temporarily for next stage
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFileName = `${stageName}_${Date.now()}.png`;
      const tempFilePath = path.join(tempDir, tempFileName);
      
      fs.writeFileSync(tempFilePath, buffer);
      
      console.log(`✅ ${stageName} image saved for next stage:`, tempFilePath);
      return tempFilePath;
      
    } catch (error) {
      console.error(`❌ Error downloading ${stageName} image:`, error.message);
      throw error;
    }
  }

  cleanupTempFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🧹 Cleaned up temporary file:', filePath);
      }
    } catch (error) {
      console.warn('⚠️ Could not clean up temporary file:', filePath, error.message);
    }
  }

  async handleGenerationFailure(originalOptions, error) {
    console.log('🔄 Handling generation failure, attempting fallback...');
    
    try {
      // Fallback to basic generation with the original services
      const { generativeModel = 'flux', referenceImagePath, prompt } = originalOptions;
      
      if (generativeModel === 'flux') {
        return await this.fluxService.generateImageWithReference(
          referenceImagePath,
          prompt,
          { size: originalOptions.size || '1024x1024' }
        );
      } else {
        return await this.openaiService.generateImageWithReference(
          referenceImagePath,
          prompt,
          { size: originalOptions.size || '1024x1024' }
        );
      }
    } catch (fallbackError) {
      console.error('❌ Fallback generation also failed:', fallbackError.message);
      return {
        success: false,
        error: `Enhanced generation failed: ${error}. Fallback also failed: ${fallbackError.message}`,
        fallbackAttempted: true
      };
    }
  }

  // Utility method to check if enhanced generation is available
  isAvailable() {
    return !!(this.fluxService.apiKey || this.openaiService.apiKey) && 
           !!this.analysisService.apiKey;
  }

  // Get available generation strategies
  getAvailableStrategies() {
    return [
      {
        id: 'multi-stage',
        name: 'Multi-Stage',
        description: 'Two-stage generation for maximum consistency and accuracy',
        recommended: true,
        requirements: ['product_image', 'high_quality_analysis']
      },
      {
        id: 'model-first',
        name: 'Model Priority',
        description: 'Prioritize model consistency over product accuracy',
        recommended: false,
        requirements: []
      },
      {
        id: 'product-first',
        name: 'Product Priority', 
        description: 'Prioritize product accuracy over model consistency',
        recommended: false,
        requirements: ['product_image']
      },
      {
        id: 'balanced',
        name: 'Balanced',
        description: 'Equal priority for consistency and accuracy',
        recommended: true,
        requirements: []
      }
    ];
  }
}

module.exports = EnhancedGenerationService;