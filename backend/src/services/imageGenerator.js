const OpenAIService = require('./openai');
const FluxService = require('./flux');
const FluxFinetuningService = require('./fluxFinetuning');
const EnhancedProductAnalysisService = require('./enhancedProductAnalysis');
const EnhancedGenerationService = require('./enhancedGeneration');
const ValidationEngine = require('./validationEngine');
const AdaptiveRetryService = require('./adaptiveRetryService');

class ImageGeneratorService {
  constructor() {
    this.openaiService = new OpenAIService();
    this.fluxService = new FluxService();
    this.fluxFinetuning = new FluxFinetuningService();
    this.enhancedAnalysis = new EnhancedProductAnalysisService();
    this.enhancedGeneration = new EnhancedGenerationService();
    this.validationEngine = new ValidationEngine();
    this.adaptiveRetry = new AdaptiveRetryService();
    
    console.log('🎨 Image Generator Service initialized with full enhanced pipeline including validation and adaptive retry');
  }

  async generateImageWithReference(referenceImagePath, prompt, options = {}) {
    const { 
      model = 'flux', 
      kustomediaModel = null, 
      useEnhancedGeneration = 'auto',
      generationMode = 'auto',
      enableMultiStage = true,
      enableAutoFallback = true,
      ...otherOptions 
    } = options;
    
    console.log(`🖼️ Generating image with reference using ${model.toUpperCase()}`);
    console.log(`🎯 Generation mode: ${generationMode}, Multi-stage: ${enableMultiStage}, Auto-fallback: ${enableAutoFallback}`);
    
    // Determine if we should use enhanced generation
    const shouldUseEnhanced = this.shouldUseEnhancedGeneration(useEnhancedGeneration, options);
    
    if (shouldUseEnhanced && this.enhancedGeneration.isAvailable()) {
      console.log('🚀 Using Enhanced Generation Service');
      
      const enhancedOptions = {
        ...options,
        generativeModel: model,
        enableMultiStage,
        enableAutoFallback
      };
      
      try {
        const result = await this.generateWithEnhancedConsistency(referenceImagePath, prompt, enhancedOptions);
        
        // If enhanced generation succeeds, return result
        if (result.success) {
          return result;
        }
        
        // If enhanced generation fails and auto-fallback is enabled
        if (enableAutoFallback) {
          console.log('🔄 Enhanced generation failed, falling back to standard generation');
          return await this.generateWithStandardMethod(referenceImagePath, prompt, { model, kustomediaModel, ...otherOptions });
        }
        
        return result;
        
      } catch (error) {
        console.error('❌ Enhanced generation error:', error.message);
        
        if (enableAutoFallback) {
          console.log('🔄 Falling back to standard generation due to error');
          return await this.generateWithStandardMethod(referenceImagePath, prompt, { model, kustomediaModel, ...otherOptions });
        }
        
        throw error;
      }
    }
    
    // Use standard generation method
    return await this.generateWithStandardMethod(referenceImagePath, prompt, { model, kustomediaModel, ...otherOptions });
  }

  async generateWithStandardMethod(referenceImagePath, prompt, options = {}) {
    const { model = 'flux', kustomediaModel = null, ...otherOptions } = options;
    
    console.log(`📷 Using standard generation method with ${model.toUpperCase()}`);
    
    // Check if we should use finetuned model for Kustompedia models
    if (model === 'flux' && kustomediaModel && this.fluxFinetuning.isModelReady(kustomediaModel)) {
      console.log(`🎯 Using FINETUNED model for ${kustomediaModel}`);
      return await this.generateWithFinetunedModel(kustomediaModel, prompt, otherOptions);
    }
    
    if (model === 'gpt' || model === 'openai') {
      return await this.openaiService.generateImageWithReference(referenceImagePath, prompt, otherOptions);
    } else if (model === 'flux') {
      return await this.fluxService.generateImageWithReference(referenceImagePath, prompt, otherOptions);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  }

  shouldUseEnhancedGeneration(useEnhancedGeneration, options = {}) {
    // Explicit settings
    if (useEnhancedGeneration === true || useEnhancedGeneration === 'always') {
      return true;
    }
    if (useEnhancedGeneration === false || useEnhancedGeneration === 'never') {
      return false;
    }
    
    // Auto mode - use enhanced generation when beneficial
    if (useEnhancedGeneration === 'auto') {
      // Use enhanced generation if we have a product image or specific quality requirements
      const hasProductImage = !!(options.productImagePath || options.productImage);
      const hasQualityRequirements = !!(options.qualityTier && options.qualityTier !== 'standard');
      const hasConsistencyRequirements = !!(options.consistencyPriority || options.accuracyPriority);
      
      return hasProductImage || hasQualityRequirements || hasConsistencyRequirements;
    }
    
    // Default to false for unknown values
    return false;
  }

  async generateWithEnhancedConsistency(referenceImagePath, prompt, options = {}) {
    const {
      model = null,
      modelId = null,
      productImagePath = null,
      productImage = null, // Alternative parameter name
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
      enableAutoFallback = true,
      generationMode = 'auto',
      ...otherOptions
    } = options;

    console.log('🚀 Starting enhanced generation with consistency focus');
    console.log(`🎯 Multi-stage: ${enableMultiStage}, Auto-fallback: ${enableAutoFallback}, Mode: ${generationMode}`);

    try {
      // Get model configuration if modelId is provided
      let modelConfig = model;
      if (modelId && !modelConfig) {
        const { KUSTOMPEDIA_MODELS } = require('../config/models');
        modelConfig = KUSTOMPEDIA_MODELS[modelId];
      }

      // Determine product image path (support both parameter names)
      const finalProductImagePath = productImagePath || productImage;

      // Adjust strategy based on configuration
      let finalFallbackStrategy = fallbackStrategy;
      if (generationMode !== 'auto') {
        finalFallbackStrategy = generationMode;
      } else if (!enableMultiStage) {
        // If multi-stage is disabled, prefer balanced approach
        finalFallbackStrategy = 'balanced';
      }

      const enhancedOptions = {
        modelId,
        model: modelConfig,
        referenceImagePath,
        prompt,
        productImagePath: finalProductImagePath,
        pose,
        size,
        generativeModel,
        qualityTier,
        consistencyPriority,
        accuracyPriority,
        retryLimit,
        validationThreshold,
        fallbackStrategy: finalFallbackStrategy,
        enableMultiStage,
        enableAutoFallback,
        generationMode,
        ...otherOptions
      };

      const result = await this.enhancedGeneration.generateWithConsistency(enhancedOptions);
      
      // Add metadata about the generation method used
      if (result.success) {
        result.enhancedGeneration = true;
        result.multiStageEnabled = enableMultiStage;
        result.autoFallbackEnabled = enableAutoFallback;
        result.generationMode = generationMode;
      }
      
      return result;

    } catch (error) {
      console.error('❌ Enhanced generation failed:', error.message);
      
      // Only fallback if auto-fallback is enabled
      if (enableAutoFallback) {
        console.log('🔄 Auto-fallback enabled, falling back to standard generation');
        return await this.generateWithStandardMethod(referenceImagePath, prompt, {
          model: generativeModel,
          size,
          ...otherOptions
        });
      }
      
      // If auto-fallback is disabled, return the error
      return {
        success: false,
        error: error.message,
        enhancedGeneration: true,
        fallbackAttempted: false
      };
    }
  }

  async generateImage(prompt, options = {}) {
    const { model = 'flux', ...otherOptions } = options;
    
    console.log(`🎨 Generating image using ${model.toUpperCase()}`);
    
    if (model === 'gpt' || model === 'openai') {
      return await this.openaiService.generateImage(prompt, otherOptions);
    } else if (model === 'flux') {
      return await this.fluxService.generateImage(prompt, otherOptions);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  }

  async analyzeProductImage(imagePath) {
    // Use enhanced product analysis service for comprehensive analysis
    console.log('🔍 Using enhanced product analysis for:', imagePath);
    
    try {
      const enhancedResult = await this.enhancedAnalysis.analyzeProduct(imagePath);
      
      if (enhancedResult.success) {
        console.log('✅ Enhanced analysis completed with confidence:', enhancedResult.confidence);
        return enhancedResult;
      } else {
        console.log('⚠️ Enhanced analysis failed, falling back to basic analysis');
        // Fallback to basic OpenAI analysis
        return await this.openaiService.analyzeProductImage(imagePath);
      }
    } catch (error) {
      console.error('❌ Enhanced analysis error, using fallback:', error.message);
      // Fallback to basic OpenAI analysis
      return await this.openaiService.analyzeProductImage(imagePath);
    }
  }

  async enhanceLogo(baseImagePath, logoFile, logoDescription, logoPosition, model = 'gpt') {
    if (model === 'gpt' || model === 'openai') {
      return await this.openaiService.enhanceLogo(baseImagePath, logoFile, logoDescription, logoPosition);
    } else {
      // FLUX doesn't have a direct logo enhancement feature, fall back to OpenAI
      console.log('⚠️ Logo enhancement not available with FLUX, falling back to OpenAI');
      return await this.openaiService.enhanceLogo(baseImagePath, logoFile, logoDescription, logoPosition);
    }
  }

  buildTryOnPrompt(model, garment, options = {}) {
    const { generativeModel = 'flux', productAnalysisResult = null, ...otherOptions } = options;
    
    // Pass structured analysis if available
    const promptOptions = { ...otherOptions };
    if (productAnalysisResult && productAnalysisResult.structured) {
      promptOptions.structuredAnalysis = productAnalysisResult.structured;
    }
    if (productAnalysisResult && productAnalysisResult.analysis) {
      promptOptions.productAnalysis = productAnalysisResult.analysis;
    }
    
    if (generativeModel === 'gpt' || generativeModel === 'openai') {
      return this.openaiService.buildTryOnPrompt(model, garment, promptOptions);
    } else if (generativeModel === 'flux') {
      return this.fluxService.buildTryOnPrompt(model, garment, promptOptions);
    } else {
      // Default to FLUX
      return this.fluxService.buildTryOnPrompt(model, garment, promptOptions);
    }
  }

  async cropTo23Ratio(imagePath, model = 'flux') {
    if (model === 'gpt' || model === 'openai') {
      return await this.openaiService.cropTo23Ratio(imagePath);
    } else if (model === 'flux') {
      return await this.fluxService.cropTo23Ratio(imagePath);
    } else {
      // Default to FLUX
      return await this.fluxService.cropTo23Ratio(imagePath);
    }
  }

  async saveBase64Image(base64Data, filename, model = 'flux') {
    if (model === 'gpt' || model === 'openai') {
      return await this.openaiService.saveBase64Image(base64Data, filename);
    } else {
      // FLUX doesn't typically return base64, but use OpenAI method as fallback
      return await this.openaiService.saveBase64Image(base64Data, filename);
    }
  }

  async downloadAndSaveImage(imageUrl, filename, model = 'flux') {
    if (model === 'gpt' || model === 'openai') {
      return await this.openaiService.downloadAndSaveImage(imageUrl, filename);
    } else if (model === 'flux') {
      return await this.fluxService.downloadAndSaveImage(imageUrl, filename);
    } else {
      // Default to FLUX
      return await this.fluxService.downloadAndSaveImage(imageUrl, filename);
    }
  }

  generateUniqueFilename(prefix = 'generated', model = 'flux') {
    if (model === 'gpt' || model === 'openai') {
      return this.openaiService.generateUniqueFilename(prefix);
    } else if (model === 'flux') {
      return this.fluxService.generateUniqueFilename(prefix);
    } else {
      // Default to FLUX
      return this.fluxService.generateUniqueFilename(prefix);
    }
  }

  getAvailableModels() {
    const models = [];
    
    // Check if OpenAI is available
    if (this.openaiService.apiKey) {
      models.push({
        id: 'gpt',
        name: 'GPT Image 1',
        provider: 'OpenAI',
        description: 'Advanced image generation with reference editing',
        available: true
      });
    }
    
    // Check if FLUX is available
    if (this.fluxService.apiKey) {
      models.push({
        id: 'flux',
        name: 'FLUX Pro 1.1',
        provider: 'Black Forest Labs',
        description: 'High-quality image generation with Kontext editing',
        available: true,
        default: true
      });
    }
    
    return models;
  }

  isModelAvailable(modelId) {
    const availableModels = this.getAvailableModels();
    return availableModels.some(model => model.id === modelId && model.available);
  }

  async generateWithFinetunedModel(kustomediaModel, prompt, options = {}) {
    console.log(`🎯 Generating with finetuned ${kustomediaModel} model`);
    
    try {
      const result = await this.fluxFinetuning.generateWithFinetunedModel(kustomediaModel, prompt, options);
      
      if (result.success) {
        return {
          success: true,
          imageUrl: result.imageUrl,
          revisedPrompt: prompt,
          modelUsed: `flux-finetuned-${kustomediaModel}`
        };
      } else {
        // Fallback to regular FLUX if finetuned fails
        console.log('⚠️ Finetuned generation failed, falling back to regular FLUX');
        return await this.fluxService.generateImageWithReference('', prompt, options);
      }
    } catch (error) {
      console.error('❌ Error with finetuned generation:', error.message);
      // Fallback to regular FLUX
      return await this.fluxService.generateImageWithReference('', prompt, options);
    }
  }

  async initializeFinetuning() {
    console.log('🎯 Initializing character finetunes for all models');
    return await this.fluxFinetuning.initializeAllModels();
  }

  async checkFinetuneStatus(modelId) {
    const config = this.fluxFinetuning.getModelConfig(modelId);
    if (!config || !config.finetuneId) {
      return { success: false, error: 'No finetune found for this model' };
    }
    
    return await this.fluxFinetuning.checkFinetuneStatus(config.finetuneId);
  }

  getAvailableFinetuneModels() {
    const configs = this.fluxFinetuning.getAllModelConfigs();
    return Object.keys(configs).map(key => ({
      id: key,
      name: configs[key].name,
      triggerWord: configs[key].triggerWord,
      ready: this.fluxFinetuning.isModelReady(key),
      finetuneId: configs[key].finetuneId
    }));
  }

  getDefaultModel() {
    const availableModels = this.getAvailableModels();
    const defaultModel = availableModels.find(model => model.default);
    return defaultModel ? defaultModel.id : (availableModels.length > 0 ? availableModels[0].id : null);
  }

  async getProductAnalysisQuality(imagePath) {
    try {
      const result = await this.enhancedAnalysis.analyzeProduct(imagePath);
      
      if (result.success) {
        return {
          success: true,
          confidence: result.confidence,
          qualityScore: result.quality?.qualityScore || 0.5,
          recommendations: result.quality?.recommendations || [],
          brandingDetected: result.branding?.structured?.brand_name !== 'Unknown',
          colorCount: result.colors?.dominantColors?.length || 0,
          analysisTimestamp: result.timestamp
        };
      } else {
        return {
          success: false,
          error: result.error,
          confidence: 0,
          qualityScore: 0,
          recommendations: ['Analysis failed - using basic fallback']
        };
      }
    } catch (error) {
      console.error('❌ Error getting analysis quality:', error.message);
      return {
        success: false,
        error: error.message,
        confidence: 0,
        qualityScore: 0,
        recommendations: ['Analysis error - check image format and size']
      };
    }
  }

  isEnhancedAnalysisAvailable() {
    return !!(this.enhancedAnalysis && this.enhancedAnalysis.apiKey);
  }

  isEnhancedGenerationAvailable() {
    return this.enhancedGeneration && this.enhancedGeneration.isAvailable();
  }

  getEnhancedGenerationStrategies() {
    if (!this.isEnhancedGenerationAvailable()) {
      return [];
    }
    return this.enhancedGeneration.getAvailableStrategies();
  }

  getGenerationModes() {
    return [
      {
        id: 'auto',
        name: 'Auto',
        description: 'Automatically choose the best generation method based on inputs',
        recommended: true
      },
      {
        id: 'standard',
        name: 'Standard',
        description: 'Use standard single-pass generation without enhanced features',
        recommended: false
      },
      {
        id: 'enhanced',
        name: 'Enhanced',
        description: 'Always use enhanced generation with multi-stage support',
        recommended: true,
        requiresEnhanced: true
      },
      {
        id: 'multi-stage',
        name: 'Multi-Stage',
        description: 'Force multi-stage generation for maximum quality',
        recommended: false,
        requiresEnhanced: true
      },
      {
        id: 'model-first',
        name: 'Model Priority',
        description: 'Prioritize model consistency over product accuracy',
        recommended: false,
        requiresEnhanced: true
      },
      {
        id: 'product-first',
        name: 'Product Priority',
        description: 'Prioritize product accuracy over model consistency',
        recommended: false,
        requiresEnhanced: true
      },
      {
        id: 'balanced',
        name: 'Balanced',
        description: 'Equal priority for consistency and accuracy',
        recommended: true,
        requiresEnhanced: true
      }
    ];
  }

  getQualityTiers() {
    return [
      {
        id: 'basic',
        name: 'Basic',
        description: 'Fast generation with basic quality',
        cost: 'Low',
        features: ['Single-pass generation', 'Basic validation', '1 retry attempt']
      },
      {
        id: 'standard',
        name: 'Standard',
        description: 'Balanced quality and speed',
        cost: 'Medium',
        features: ['Enhanced generation', 'Multi-stage support', '2 retry attempts'],
        recommended: true
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'High quality with advanced features',
        cost: 'High',
        features: ['Multi-stage generation', 'Advanced validation', '3 retry attempts']
      },
      {
        id: 'ultra',
        name: 'Ultra',
        description: 'Maximum quality with all features',
        cost: 'Very High',
        features: ['Multi-stage generation', 'Comprehensive validation', '5 retry attempts']
      }
    ];
  }

  getGenerationConfiguration(mode = 'auto', tier = 'standard') {
    const modes = this.getGenerationModes();
    const tiers = this.getQualityTiers();
    
    const modeConfig = modes.find(m => m.id === mode) || modes.find(m => m.id === 'auto');
    const tierConfig = tiers.find(t => t.id === tier) || tiers.find(t => t.id === 'standard');
    
    // Base configuration from tier
    const baseConfig = {
      'basic': {
        useEnhancedGeneration: false,
        enableMultiStage: false,
        enableAutoFallback: true,
        retryLimit: 1,
        consistencyPriority: 0.6,
        accuracyPriority: 0.6,
        validationThreshold: 0.5
      },
      'standard': {
        useEnhancedGeneration: 'auto',
        enableMultiStage: true,
        enableAutoFallback: true,
        retryLimit: 2,
        consistencyPriority: 0.7,
        accuracyPriority: 0.7,
        validationThreshold: 0.6
      },
      'premium': {
        useEnhancedGeneration: true,
        enableMultiStage: true,
        enableAutoFallback: true,
        retryLimit: 3,
        consistencyPriority: 0.8,
        accuracyPriority: 0.8,
        validationThreshold: 0.7
      },
      'ultra': {
        useEnhancedGeneration: true,
        enableMultiStage: true,
        enableAutoFallback: true,
        retryLimit: 5,
        consistencyPriority: 0.9,
        accuracyPriority: 0.9,
        validationThreshold: 0.8
      }
    };

    const config = { ...baseConfig[tier] };

    // Override based on mode
    switch (mode) {
      case 'standard':
        config.useEnhancedGeneration = false;
        config.enableMultiStage = false;
        break;
      case 'enhanced':
        config.useEnhancedGeneration = true;
        break;
      case 'multi-stage':
        config.useEnhancedGeneration = true;
        config.enableMultiStage = true;
        config.generationMode = 'multi-stage';
        break;
      case 'model-first':
        config.useEnhancedGeneration = true;
        config.generationMode = 'model-first';
        config.consistencyPriority = 0.9;
        config.accuracyPriority = Math.min(config.accuracyPriority, 0.6);
        break;
      case 'product-first':
        config.useEnhancedGeneration = true;
        config.generationMode = 'product-first';
        config.accuracyPriority = 0.9;
        config.consistencyPriority = Math.min(config.consistencyPriority, 0.6);
        break;
      case 'balanced':
        config.useEnhancedGeneration = true;
        config.generationMode = 'balanced';
        config.consistencyPriority = 0.75;
        config.accuracyPriority = 0.75;
        break;
    }

    return {
      mode: modeConfig,
      tier: tierConfig,
      config
    };
  }

  async generateWithStrategy(strategy, referenceImagePath, prompt, options = {}) {
    if (!this.isEnhancedGenerationAvailable()) {
      console.log('⚠️ Enhanced generation not available, using standard generation');
      return await this.generateImageWithReference(referenceImagePath, prompt, options);
    }

    console.log(`🎯 Using generation strategy: ${strategy}`);
    
    const enhancedOptions = {
      ...options,
      useEnhancedGeneration: true,
      generationMode: strategy,
      fallbackStrategy: strategy
    };

    return await this.generateWithEnhancedConsistency(referenceImagePath, prompt, enhancedOptions);
  }

  async generateWithMultiStage(referenceImagePath, prompt, options = {}) {
    const multiStageOptions = {
      ...options,
      enableMultiStage: true,
      generationMode: 'multi-stage'
    };
    return await this.generateWithStrategy('multi-stage', referenceImagePath, prompt, multiStageOptions);
  }

  async generateWithModelFirst(referenceImagePath, prompt, options = {}) {
    const modelFirstOptions = {
      ...options,
      consistencyPriority: 0.9,
      accuracyPriority: 0.6,
      generationMode: 'model-first'
    };
    return await this.generateWithStrategy('model-first', referenceImagePath, prompt, modelFirstOptions);
  }

  async generateWithProductFirst(referenceImagePath, prompt, options = {}) {
    const productFirstOptions = {
      ...options,
      consistencyPriority: 0.6,
      accuracyPriority: 0.9,
      generationMode: 'product-first'
    };
    return await this.generateWithStrategy('product-first', referenceImagePath, prompt, productFirstOptions);
  }

  async generateWithBalanced(referenceImagePath, prompt, options = {}) {
    const balancedOptions = {
      ...options,
      consistencyPriority: 0.75,
      accuracyPriority: 0.75,
      generationMode: 'balanced'
    };
    return await this.generateWithStrategy('balanced', referenceImagePath, prompt, balancedOptions);
  }

  async generateWithConfiguration(referenceImagePath, prompt, config = {}) {
    const {
      mode = 'auto',
      multiStage = true,
      autoFallback = true,
      qualityTier = 'standard',
      consistencyPriority = 0.7,
      accuracyPriority = 0.8,
      retryLimit = 3,
      ...otherOptions
    } = config;

    console.log(`🎛️ Generating with configuration - Mode: ${mode}, Multi-stage: ${multiStage}, Auto-fallback: ${autoFallback}`);

    const configuredOptions = {
      ...otherOptions,
      useEnhancedGeneration: 'auto',
      generationMode: mode,
      enableMultiStage: multiStage,
      enableAutoFallback: autoFallback,
      qualityTier,
      consistencyPriority,
      accuracyPriority,
      retryLimit
    };

    return await this.generateImageWithReference(referenceImagePath, prompt, configuredOptions);
  }

  async generateWithQualityTier(referenceImagePath, prompt, tier = 'standard', options = {}) {
    const tierConfigs = {
      'basic': {
        enableMultiStage: false,
        retryLimit: 1,
        consistencyPriority: 0.6,
        accuracyPriority: 0.6,
        validationThreshold: 0.5
      },
      'standard': {
        enableMultiStage: true,
        retryLimit: 2,
        consistencyPriority: 0.7,
        accuracyPriority: 0.7,
        validationThreshold: 0.6
      },
      'premium': {
        enableMultiStage: true,
        retryLimit: 3,
        consistencyPriority: 0.8,
        accuracyPriority: 0.8,
        validationThreshold: 0.7
      },
      'ultra': {
        enableMultiStage: true,
        retryLimit: 5,
        consistencyPriority: 0.9,
        accuracyPriority: 0.9,
        validationThreshold: 0.8
      }
    };

    const tierConfig = tierConfigs[tier] || tierConfigs['standard'];
    
    console.log(`💎 Using quality tier: ${tier}`);

    const qualityOptions = {
      ...options,
      qualityTier: tier,
      useEnhancedGeneration: tier !== 'basic',
      ...tierConfig
    };

    return await this.generateImageWithReference(referenceImagePath, prompt, qualityOptions);
  }

  /**
   * Generate with comprehensive quality validation and adaptive retry
   * @param {string} referenceImagePath - Reference image path
   * @param {string} prompt - Generation prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation result with validation
   */
  async generateWithQualityValidation(referenceImagePath, prompt, options = {}) {
    const {
      modelId,
      pose,
      productImagePath,
      productAnalysis,
      qualityTier = 'standard',
      enableRetry = true,
      maxRetries = 3,
      ...otherOptions
    } = options;

    console.log('🎯 Starting generation with quality validation and adaptive retry');

    const jobId = this.generateUniqueFilename('job');
    const generationHistory = [];
    let currentAttempt = 1;

    try {
      // Initial generation attempt
      console.log(`🎨 Initial generation attempt (${currentAttempt}/${maxRetries + 1})`);
      
      const initialResult = await this.generateImageWithReference(referenceImagePath, prompt, {
        ...otherOptions,
        useEnhancedGeneration: true,
        qualityTier
      });

      if (!initialResult.success) {
        return {
          success: false,
          error: `Initial generation failed: ${initialResult.error}`,
          jobId,
          attempts: 1,
          totalCost: 0.04
        };
      }

      // Validate the initial result
      const validationResult = await this.validationEngine.validateImageQuality({
        generatedImagePath: initialResult.imagePath,
        modelId,
        expectedPose: pose,
        productImagePath,
        productAnalysis,
        qualityTier
      });

      // Record initial attempt
      generationHistory.push({
        attempt: currentAttempt,
        generationResult: initialResult,
        validationResult,
        score: validationResult.overallQuality,
        cost: this.estimateGenerationCost(qualityTier),
        timestamp: new Date().toISOString()
      });

      // Check if initial generation meets quality requirements
      if (validationResult.passes) {
        console.log(`✅ Initial generation passed validation with score ${(validationResult.overallQuality * 100).toFixed(1)}%`);
        return {
          success: true,
          result: initialResult,
          validation: validationResult,
          jobId,
          attempts: 1,
          totalCost: this.estimateGenerationCost(qualityTier),
          qualityScore: validationResult.overallQuality
        };
      }

      // If retry is disabled, return the initial result
      if (!enableRetry) {
        console.log('⚠️ Quality validation failed but retry is disabled');
        return {
          success: false,
          result: initialResult,
          validation: validationResult,
          jobId,
          attempts: 1,
          totalCost: this.estimateGenerationCost(qualityTier),
          error: 'Quality validation failed and retry is disabled'
        };
      }

      // Execute adaptive retry process
      console.log('🔄 Initial generation failed validation, starting adaptive retry process');
      
      const retryResult = await this.adaptiveRetry.executeAdaptiveRetry({
        originalRequest: {
          referenceImagePath,
          prompt,
          modelId,
          pose,
          productImagePath,
          productAnalysis,
          qualityTier,
          ...otherOptions
        },
        validationResults: validationResult,
        generationHistory,
        jobId
      });

      return {
        ...retryResult,
        jobId,
        initialValidation: validationResult,
        retryExecuted: true
      };

    } catch (error) {
      console.error('❌ Error in quality validation generation:', error);
      return {
        success: false,
        error: `Quality validation generation failed: ${error.message}`,
        jobId,
        attempts: generationHistory.length,
        totalCost: this.calculateTotalCost(generationHistory)
      };
    }
  }

  /**
   * Retry failed generation with adaptive parameters
   * @param {string} jobId - Original job ID
   * @param {Object} retryOptions - Retry options
   * @returns {Promise<Object>} Retry result
   */
  async retryGeneration(jobId, retryOptions = {}) {
    const {
      originalRequest,
      validationResults,
      generationHistory = [],
      strategy = 'auto',
      maxRetries = 3
    } = retryOptions;

    console.log(`🔄 Manual retry requested for job ${jobId} with strategy: ${strategy}`);

    try {
      const retryResult = await this.adaptiveRetry.executeAdaptiveRetry({
        originalRequest,
        validationResults,
        generationHistory,
        jobId
      });

      return {
        ...retryResult,
        jobId,
        manualRetry: true,
        strategy
      };

    } catch (error) {
      console.error('❌ Error in manual retry:', error);
      return {
        success: false,
        error: `Manual retry failed: ${error.message}`,
        jobId
      };
    }
  }

  /**
   * Get validation status for a generation job
   * @param {string} jobId - Job ID
   * @param {Object} validationRequest - Validation request
   * @returns {Promise<Object>} Validation status
   */
  async getValidationStatus(jobId, validationRequest) {
    const {
      generatedImagePath,
      modelId,
      expectedPose,
      productImagePath,
      productAnalysis,
      qualityTier = 'standard'
    } = validationRequest;

    console.log(`📊 Getting validation status for job ${jobId}`);

    try {
      const validationResult = await this.validationEngine.validateImageQuality({
        generatedImagePath,
        modelId,
        expectedPose,
        productImagePath,
        productAnalysis,
        qualityTier
      });

      return {
        success: true,
        jobId,
        validation: validationResult,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error getting validation status:', error);
      return {
        success: false,
        error: `Validation status check failed: ${error.message}`,
        jobId
      };
    }
  }

  /**
   * Estimate generation cost based on quality tier
   * @param {string} qualityTier - Quality tier
   * @returns {number} Estimated cost
   */
  estimateGenerationCost(qualityTier) {
    const costs = {
      basic: 0.02,
      standard: 0.04,
      premium: 0.08,
      ultra: 0.16
    };
    return costs[qualityTier] || costs.standard;
  }

  /**
   * Calculate total cost from generation history
   * @param {Array} generationHistory - Generation history
   * @returns {number} Total cost
   */
  calculateTotalCost(generationHistory) {
    return generationHistory.reduce((total, attempt) => {
      return total + (attempt.cost || 0.04);
    }, 0);
  }

  /**
   * Get adaptive retry statistics
   * @returns {Object} Retry statistics
   */
  getRetryStatistics() {
    return this.adaptiveRetry.getLearningStatistics();
  }

  /**
   * Update retry configuration
   * @param {Object} config - New retry configuration
   */
  updateRetryConfiguration(config) {
    this.adaptiveRetry.updateConfiguration(config);
  }

  /**
   * Reset retry learning data
   */
  resetRetryLearning() {
    this.adaptiveRetry.resetLearningData();
  }

  /**
   * Get available quality validation options
   * @returns {Object} Quality validation options
   */
  getQualityValidationOptions() {
    return {
      qualityTiers: this.getQualityTiers(),
      validationThresholds: {
        consistency: {
          face: { min: 0.5, max: 0.9, default: 0.7 },
          pose: { min: 0.4, max: 0.8, default: 0.6 }
        },
        accuracy: {
          color: { min: 0.5, max: 0.9, default: 0.7 },
          style: { min: 0.4, max: 0.8, default: 0.6 },
          branding: { min: 0.6, max: 0.95, default: 0.8 }
        }
      },
      retryStrategies: [
        'auto',
        'model_focused',
        'product_focused',
        'balanced',
        'complete_regeneration'
      ],
      costLimits: {
        basic: 0.20,
        standard: 0.50,
        premium: 1.00,
        ultra: 2.00
      }
    };
  }

  /**
   * Validate generation parameters before starting
   * @param {Object} params - Generation parameters
   * @returns {Object} Validation result
   */
  validateGenerationParameters(params) {
    const {
      referenceImagePath,
      prompt,
      modelId,
      pose,
      productImagePath,
      qualityTier = 'standard'
    } = params;

    const errors = [];
    const warnings = [];

    // Required parameters
    if (!referenceImagePath) {
      errors.push('Reference image path is required');
    }
    if (!prompt || prompt.trim().length === 0) {
      errors.push('Generation prompt is required');
    }
    if (!modelId) {
      errors.push('Model ID is required for validation');
    }
    if (!pose) {
      errors.push('Expected pose is required for validation');
    }

    // Optional but recommended parameters
    if (!productImagePath) {
      warnings.push('Product image path not provided - accuracy validation will be limited');
    }

    // Quality tier validation
    const validTiers = ['basic', 'standard', 'premium', 'ultra'];
    if (!validTiers.includes(qualityTier)) {
      errors.push(`Invalid quality tier: ${qualityTier}. Must be one of: ${validTiers.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations: this.generateParameterRecommendations(params)
    };
  }

  /**
   * Generate parameter recommendations
   * @param {Object} params - Generation parameters
   * @returns {Array} Recommendations
   */
  generateParameterRecommendations(params) {
    const recommendations = [];
    const { qualityTier, productImagePath, productAnalysis } = params;

    if (qualityTier === 'basic') {
      recommendations.push('Consider using "standard" quality tier for better results');
    }

    if (!productImagePath) {
      recommendations.push('Provide product image for enhanced accuracy validation');
    }

    if (!productAnalysis) {
      recommendations.push('Run product analysis first for optimal generation parameters');
    }

    return recommendations;
  }
}

module.exports = ImageGeneratorService;