const ImageGeneratorService = require('../src/services/imageGenerator');

// Mock all dependencies
jest.mock('../src/services/openai');
jest.mock('../src/services/flux');
jest.mock('../src/services/fluxFinetuning');
jest.mock('../src/services/enhancedProductAnalysis');
jest.mock('../src/services/enhancedGeneration');

const OpenAIService = require('../src/services/openai');
const FluxService = require('../src/services/flux');
const FluxFinetuningService = require('../src/services/fluxFinetuning');
const EnhancedProductAnalysisService = require('../src/services/enhancedProductAnalysis');
const EnhancedGenerationService = require('../src/services/enhancedGeneration');

describe('ImageGeneratorService Enhanced Integration', () => {
  let service;
  let mockOpenAI;
  let mockFlux;
  let mockFinetuning;
  let mockEnhancedAnalysis;
  let mockEnhancedGeneration;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockOpenAI = {
      apiKey: 'test-openai-key',
      generateImageWithReference: jest.fn(),
      analyzeProductImage: jest.fn()
    };

    mockFlux = {
      apiKey: 'test-flux-key',
      generateImageWithReference: jest.fn()
    };

    mockFinetuning = {
      isModelReady: jest.fn().mockReturnValue(false)
    };

    mockEnhancedAnalysis = {
      apiKey: 'test-analysis-key',
      analyzeProduct: jest.fn()
    };

    mockEnhancedGeneration = {
      isAvailable: jest.fn().mockReturnValue(true),
      generateWithConsistency: jest.fn(),
      getAvailableStrategies: jest.fn().mockReturnValue([
        { id: 'multi-stage', name: 'Multi-Stage', recommended: true },
        { id: 'balanced', name: 'Balanced', recommended: true }
      ])
    };

    // Mock constructors
    OpenAIService.mockImplementation(() => mockOpenAI);
    FluxService.mockImplementation(() => mockFlux);
    FluxFinetuningService.mockImplementation(() => mockFinetuning);
    EnhancedProductAnalysisService.mockImplementation(() => mockEnhancedAnalysis);
    EnhancedGenerationService.mockImplementation(() => mockEnhancedGeneration);

    service = new ImageGeneratorService();
  });

  describe('Enhanced Generation Integration', () => {
    test('should use enhanced generation when requested and available', async () => {
      mockEnhancedGeneration.generateWithConsistency.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/enhanced.jpg',
        strategy: 'multi-stage',
        enhancedGeneration: true
      });

      const result = await service.generateImageWithReference(
        'test/model.jpg',
        'change to red shirt',
        {
          model: 'flux',
          useEnhancedGeneration: true,
          modelId: 'johny',
          productImagePath: 'test/product.jpg'
        }
      );

      expect(result.success).toBe(true);
      expect(result.enhancedGeneration).toBe(true);
      expect(result.strategy).toBe('multi-stage');
      expect(mockEnhancedGeneration.generateWithConsistency).toHaveBeenCalled();
    });

    test('should use enhanced generation in auto mode with product image', async () => {
      mockEnhancedGeneration.generateWithConsistency.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/auto-enhanced.jpg',
        enhancedGeneration: true
      });

      const result = await service.generateImageWithReference(
        'test/model.jpg',
        'change to blue shirt',
        {
          model: 'flux',
          useEnhancedGeneration: 'auto',
          productImagePath: 'test/product.jpg'
        }
      );

      expect(result.success).toBe(true);
      expect(result.enhancedGeneration).toBe(true);
      expect(mockEnhancedGeneration.generateWithConsistency).toHaveBeenCalled();
    });

    test('should not use enhanced generation in auto mode without product image', async () => {
      mockFlux.generateImageWithReference.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/standard.jpg'
      });

      const result = await service.generateImageWithReference(
        'test/model.jpg',
        'change to green shirt',
        {
          model: 'flux',
          useEnhancedGeneration: 'auto'
        }
      );

      expect(result.success).toBe(true);
      expect(mockFlux.generateImageWithReference).toHaveBeenCalled();
      expect(mockEnhancedGeneration.generateWithConsistency).not.toHaveBeenCalled();
    });

    test('should handle multi-stage configuration', async () => {
      mockEnhancedGeneration.generateWithConsistency.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/multi-stage.jpg',
        enhancedGeneration: true,
        multiStageEnabled: true
      });

      const result = await service.generateImageWithReference(
        'test/model.jpg',
        'change to shirt',
        {
          model: 'flux',
          useEnhancedGeneration: true,
          enableMultiStage: true,
          generationMode: 'multi-stage'
        }
      );

      expect(result.success).toBe(true);
      expect(result.multiStageEnabled).toBe(true);
      
      const calledOptions = mockEnhancedGeneration.generateWithConsistency.mock.calls[0][0];
      expect(calledOptions.enableMultiStage).toBe(true);
      expect(calledOptions.generationMode).toBe('multi-stage');
    });

    test('should fallback to regular generation when enhanced is not available', async () => {
      mockEnhancedGeneration.isAvailable.mockReturnValue(false);
      mockFlux.generateImageWithReference.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/regular.jpg'
      });

      const result = await service.generateImageWithReference(
        'test/model.jpg',
        'change to red shirt',
        {
          model: 'flux',
          useEnhancedGeneration: true
        }
      );

      expect(result.success).toBe(true);
      expect(mockFlux.generateImageWithReference).toHaveBeenCalled();
      expect(mockEnhancedGeneration.generateWithConsistency).not.toHaveBeenCalled();
    });

    test('should fallback to regular generation when enhanced fails and auto-fallback enabled', async () => {
      mockEnhancedGeneration.generateWithConsistency.mockRejectedValue(
        new Error('Enhanced generation failed')
      );
      mockFlux.generateImageWithReference.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/fallback.jpg'
      });

      const result = await service.generateImageWithReference(
        'test/model.jpg',
        'change to red shirt',
        {
          model: 'flux',
          useEnhancedGeneration: true,
          enableAutoFallback: true
        }
      );

      expect(result.success).toBe(true);
      expect(mockFlux.generateImageWithReference).toHaveBeenCalled();
    });

    test('should not fallback when auto-fallback is disabled', async () => {
      mockEnhancedGeneration.generateWithConsistency.mockRejectedValue(
        new Error('Enhanced generation failed')
      );

      const result = await service.generateImageWithReference(
        'test/model.jpg',
        'change to shirt',
        {
          model: 'flux',
          useEnhancedGeneration: true,
          enableAutoFallback: false
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Enhanced generation failed');
      expect(result.fallbackAttempted).toBe(false);
      expect(mockEnhancedGeneration.generateWithConsistency).toHaveBeenCalled();
    });
  });

  describe('Enhanced Product Analysis Integration', () => {
    test('should use enhanced analysis when available', async () => {
      mockEnhancedAnalysis.analyzeProduct.mockResolvedValue({
        success: true,
        analysis: 'Detailed analysis',
        structured: { garment_type: 't-shirt' },
        confidence: 0.9
      });

      const result = await service.analyzeProductImage('test/product.jpg');

      expect(result.success).toBe(true);
      expect(result.confidence).toBe(0.9);
      expect(mockEnhancedAnalysis.analyzeProduct).toHaveBeenCalledWith('test/product.jpg');
    });

    test('should fallback to basic analysis when enhanced fails', async () => {
      mockEnhancedAnalysis.analyzeProduct.mockResolvedValue({
        success: false,
        error: 'Enhanced analysis failed'
      });
      mockOpenAI.analyzeProductImage.mockResolvedValue({
        success: true,
        analysis: 'Basic analysis'
      });

      const result = await service.analyzeProductImage('test/product.jpg');

      expect(result.success).toBe(true);
      expect(result.analysis).toBe('Basic analysis');
      expect(mockOpenAI.analyzeProductImage).toHaveBeenCalled();
    });
  });

  describe('Strategy-Based Generation Methods', () => {
    beforeEach(() => {
      mockEnhancedGeneration.generateWithConsistency.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/strategy.jpg',
        strategy: 'test-strategy'
      });
    });

    test('should generate with multi-stage strategy', async () => {
      const result = await service.generateWithMultiStage(
        'test/model.jpg',
        'change to shirt',
        { modelId: 'johny' }
      );

      expect(result.success).toBe(true);
      expect(mockEnhancedGeneration.generateWithConsistency).toHaveBeenCalledWith(
        expect.objectContaining({
          fallbackStrategy: 'multi-stage',
          enableMultiStage: true,
          generationMode: 'multi-stage'
        })
      );
    });

    test('should generate with model-first strategy', async () => {
      const result = await service.generateWithModelFirst(
        'test/model.jpg',
        'change to shirt',
        { modelId: 'nyoman' }
      );

      expect(result.success).toBe(true);
      expect(mockEnhancedGeneration.generateWithConsistency).toHaveBeenCalledWith(
        expect.objectContaining({
          fallbackStrategy: 'model-first',
          consistencyPriority: 0.9,
          accuracyPriority: 0.6,
          generationMode: 'model-first'
        })
      );
    });

    test('should generate with product-first strategy', async () => {
      const result = await service.generateWithProductFirst(
        'test/model.jpg',
        'change to shirt',
        { productImagePath: 'test/product.jpg' }
      );

      expect(result.success).toBe(true);
      expect(mockEnhancedGeneration.generateWithConsistency).toHaveBeenCalledWith(
        expect.objectContaining({
          fallbackStrategy: 'product-first',
          consistencyPriority: 0.6,
          accuracyPriority: 0.9,
          generationMode: 'product-first'
        })
      );
    });

    test('should generate with balanced strategy', async () => {
      const result = await service.generateWithBalanced(
        'test/model.jpg',
        'change to shirt',
        { modelId: 'isabella' }
      );

      expect(result.success).toBe(true);
      expect(mockEnhancedGeneration.generateWithConsistency).toHaveBeenCalledWith(
        expect.objectContaining({
          fallbackStrategy: 'balanced',
          consistencyPriority: 0.75,
          accuracyPriority: 0.75,
          generationMode: 'balanced'
        })
      );
    });

    test('should fallback to regular generation when enhanced is not available', async () => {
      mockEnhancedGeneration.isAvailable.mockReturnValue(false);
      mockFlux.generateImageWithReference.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/fallback.jpg'
      });

      const result = await service.generateWithMultiStage(
        'test/model.jpg',
        'change to shirt',
        { model: 'flux' }
      );

      expect(result.success).toBe(true);
      expect(mockFlux.generateImageWithReference).toHaveBeenCalled();
      expect(mockEnhancedGeneration.generateWithConsistency).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Methods', () => {
    test('should provide generation modes', () => {
      const modes = service.getGenerationModes();
      
      expect(modes).toBeInstanceOf(Array);
      expect(modes.length).toBeGreaterThan(0);
      
      const autoMode = modes.find(m => m.id === 'auto');
      expect(autoMode).toBeDefined();
      expect(autoMode.recommended).toBe(true);
      
      const multiStageMode = modes.find(m => m.id === 'multi-stage');
      expect(multiStageMode).toBeDefined();
      expect(multiStageMode.requiresEnhanced).toBe(true);
    });

    test('should provide quality tiers', () => {
      const tiers = service.getQualityTiers();
      
      expect(tiers).toBeInstanceOf(Array);
      expect(tiers.length).toBe(4);
      
      const standardTier = tiers.find(t => t.id === 'standard');
      expect(standardTier).toBeDefined();
      expect(standardTier.recommended).toBe(true);
      
      const ultraTier = tiers.find(t => t.id === 'ultra');
      expect(ultraTier).toBeDefined();
      expect(ultraTier.features).toContain('5 retry attempts');
    });

    test('should generate configuration correctly', () => {
      const config = service.getGenerationConfiguration('multi-stage', 'premium');
      
      expect(config.mode.id).toBe('multi-stage');
      expect(config.tier.id).toBe('premium');
      expect(config.config.useEnhancedGeneration).toBe(true);
      expect(config.config.enableMultiStage).toBe(true);
      expect(config.config.generationMode).toBe('multi-stage');
      expect(config.config.retryLimit).toBe(3);
    });

    test('should handle basic tier configuration', () => {
      const config = service.getGenerationConfiguration('auto', 'basic');
      
      expect(config.tier.id).toBe('basic');
      expect(config.config.useEnhancedGeneration).toBe(false);
      expect(config.config.enableMultiStage).toBe(false);
      expect(config.config.retryLimit).toBe(1);
    });

    test('should generate with custom configuration', async () => {
      service.generateImageWithReference = jest.fn().mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/configured.jpg'
      });

      const config = {
        mode: 'balanced',
        multiStage: true,
        autoFallback: true,
        qualityTier: 'premium',
        consistencyPriority: 0.8,
        accuracyPriority: 0.8
      };

      const result = await service.generateWithConfiguration(
        'test/model.jpg',
        'change to suit',
        config
      );

      expect(result.success).toBe(true);
      
      const calledOptions = service.generateImageWithReference.mock.calls[0][2];
      expect(calledOptions.generationMode).toBe('balanced');
      expect(calledOptions.enableMultiStage).toBe(true);
      expect(calledOptions.enableAutoFallback).toBe(true);
      expect(calledOptions.qualityTier).toBe('premium');
    });

    test('should generate with quality tier', async () => {
      service.generateImageWithReference = jest.fn().mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/premium.jpg'
      });

      const result = await service.generateWithQualityTier(
        'test/model.jpg',
        'change to dress',
        'premium'
      );

      expect(result.success).toBe(true);
      
      const calledOptions = service.generateImageWithReference.mock.calls[0][2];
      expect(calledOptions.qualityTier).toBe('premium');
      expect(calledOptions.retryLimit).toBe(3);
      expect(calledOptions.consistencyPriority).toBe(0.8);
      expect(calledOptions.accuracyPriority).toBe(0.8);
    });

    test('should handle ultra quality tier', async () => {
      service.generateImageWithReference = jest.fn().mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/ultra.jpg'
      });

      const result = await service.generateWithQualityTier(
        'test/model.jpg',
        'change to jacket',
        'ultra'
      );

      expect(result.success).toBe(true);
      
      const calledOptions = service.generateImageWithReference.mock.calls[0][2];
      expect(calledOptions.qualityTier).toBe('ultra');
      expect(calledOptions.retryLimit).toBe(5);
      expect(calledOptions.consistencyPriority).toBe(0.9);
      expect(calledOptions.accuracyPriority).toBe(0.9);
    });
  });

  describe('Enhanced Capabilities Check', () => {
    test('should check enhanced analysis availability', () => {
      expect(service.isEnhancedAnalysisAvailable()).toBe(true);
      
      mockEnhancedAnalysis.apiKey = null;
      expect(service.isEnhancedAnalysisAvailable()).toBe(false);
    });

    test('should check enhanced generation availability', () => {
      expect(service.isEnhancedGenerationAvailable()).toBe(true);
      
      mockEnhancedGeneration.isAvailable.mockReturnValue(false);
      expect(service.isEnhancedGenerationAvailable()).toBe(false);
    });

    test('should get enhanced generation strategies', () => {
      const strategies = service.getEnhancedGenerationStrategies();
      
      expect(strategies).toHaveLength(2);
      expect(strategies[0].id).toBe('multi-stage');
      expect(strategies[1].id).toBe('balanced');
      expect(mockEnhancedGeneration.getAvailableStrategies).toHaveBeenCalled();
    });

    test('should return empty strategies when enhanced generation not available', () => {
      mockEnhancedGeneration.isAvailable.mockReturnValue(false);
      
      const strategies = service.getEnhancedGenerationStrategies();
      expect(strategies).toEqual([]);
    });
  });

  describe('Product Analysis Quality', () => {
    test('should get product analysis quality metrics', async () => {
      mockEnhancedAnalysis.analyzeProduct.mockResolvedValue({
        success: true,
        confidence: 0.85,
        quality: {
          qualityScore: 0.9,
          recommendations: ['Good quality image']
        },
        branding: {
          structured: { brand_name: 'Nike' }
        },
        colors: {
          dominantColors: [{ name: 'Red' }, { name: 'Blue' }]
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      });

      const result = await service.getProductAnalysisQuality('test/product.jpg');

      expect(result.success).toBe(true);
      expect(result.confidence).toBe(0.85);
      expect(result.qualityScore).toBe(0.9);
      expect(result.brandingDetected).toBe(true);
      expect(result.colorCount).toBe(2);
      expect(result.recommendations).toEqual(['Good quality image']);
    });

    test('should handle analysis failure gracefully', async () => {
      mockEnhancedAnalysis.analyzeProduct.mockResolvedValue({
        success: false,
        error: 'Analysis failed'
      });

      const result = await service.getProductAnalysisQuality('test/product.jpg');

      expect(result.success).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.qualityScore).toBe(0);
      expect(result.recommendations).toEqual(['Analysis failed - using basic fallback']);
    });

    test('should handle analysis errors gracefully', async () => {
      mockEnhancedAnalysis.analyzeProduct.mockRejectedValue(new Error('Network error'));

      const result = await service.getProductAnalysisQuality('test/product.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.confidence).toBe(0);
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain backward compatibility for existing calls', async () => {
      mockFlux.generateImageWithReference.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/backward.jpg'
      });

      const result = await service.generateImageWithReference(
        'test/model.jpg',
        'change to shirt',
        { model: 'flux' }
      );

      expect(result.success).toBe(true);
      expect(mockFlux.generateImageWithReference).toHaveBeenCalled();
      expect(mockEnhancedGeneration.generateWithConsistency).not.toHaveBeenCalled();
    });

    test('should handle finetuned models correctly', async () => {
      mockFinetuning.isModelReady.mockReturnValue(true);
      service.generateWithFinetunedModel = jest.fn().mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/finetuned.jpg'
      });

      const result = await service.generateImageWithReference(
        'test/model.jpg',
        'change to shirt',
        {
          model: 'flux',
          kustomediaModel: 'johny'
        }
      );

      expect(result.success).toBe(true);
      expect(service.generateWithFinetunedModel).toHaveBeenCalledWith(
        'johny',
        'change to shirt',
        expect.any(Object)
      );
    });
  });
});