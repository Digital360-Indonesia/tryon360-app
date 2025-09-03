const EnhancedGenerationService = require('../src/services/enhancedGeneration');

// Mock the dependencies
jest.mock('../src/services/flux');
jest.mock('../src/services/openai');
jest.mock('../src/services/enhancedProductAnalysis');
jest.mock('fs');
jest.mock('axios');

const FluxService = require('../src/services/flux');
const OpenAIService = require('../src/services/openai');
const EnhancedProductAnalysisService = require('../src/services/enhancedProductAnalysis');

describe('EnhancedGenerationService', () => {
  let service;
  let mockFluxService;
  let mockOpenAIService;
  let mockAnalysisService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockFluxService = {
      apiKey: 'test-flux-key',
      generateImageWithReference: jest.fn()
    };
    
    mockOpenAIService = {
      apiKey: 'test-openai-key',
      generateImageWithReference: jest.fn()
    };
    
    mockAnalysisService = {
      apiKey: 'test-analysis-key',
      analyzeProduct: jest.fn()
    };

    // Mock constructors
    FluxService.mockImplementation(() => mockFluxService);
    OpenAIService.mockImplementation(() => mockOpenAIService);
    EnhancedProductAnalysisService.mockImplementation(() => mockAnalysisService);

    service = new EnhancedGenerationService();
  });

  describe('Strategy Determination', () => {
    test('should choose model-first when no product image', () => {
      const strategy = service.determineGenerationStrategy({
        consistencyPriority: 0.8,
        accuracyPriority: 0.6,
        hasProductImage: false,
        productAnalysisQuality: 0,
        fallbackStrategy: 'balanced'
      });
      
      expect(strategy).toBe('model-first');
    });

    test('should choose balanced when product analysis quality is low', () => {
      const strategy = service.determineGenerationStrategy({
        consistencyPriority: 0.8,
        accuracyPriority: 0.8,
        hasProductImage: true,
        productAnalysisQuality: 0.3,
        fallbackStrategy: 'balanced'
      });
      
      expect(strategy).toBe('balanced');
    });

    test('should choose model-first when consistency priority is much higher', () => {
      const strategy = service.determineGenerationStrategy({
        consistencyPriority: 0.9,
        accuracyPriority: 0.5,
        hasProductImage: true,
        productAnalysisQuality: 0.8,
        fallbackStrategy: 'balanced'
      });
      
      expect(strategy).toBe('model-first');
    });

    test('should choose product-first when accuracy priority is much higher', () => {
      const strategy = service.determineGenerationStrategy({
        consistencyPriority: 0.5,
        accuracyPriority: 0.9,
        hasProductImage: true,
        productAnalysisQuality: 0.8,
        fallbackStrategy: 'balanced'
      });
      
      expect(strategy).toBe('product-first');
    });

    test('should choose multi-stage when both priorities are high with good analysis', () => {
      const strategy = service.determineGenerationStrategy({
        consistencyPriority: 0.8,
        accuracyPriority: 0.8,
        hasProductImage: true,
        productAnalysisQuality: 0.8,
        fallbackStrategy: 'balanced'
      });
      
      expect(strategy).toBe('multi-stage');
    });
  });

  describe('Prompt Building', () => {
    const mockModel = {
      characteristics: {
        ethnicity: 'Indonesian',
        gender: 'male',
        age: '25-30',
        hair: 'short dark hair',
        facial_hair: 'clean-shaven',
        build: 'medium athletic',
        expression: 'serious professional'
      }
    };

    test('should build stage 1 prompt correctly', () => {
      const prompt = service.buildStage1Prompt(mockModel, 'arms crossed');
      
      expect(prompt).toContain('STAGE 1 - PERFECT MODEL CONSISTENCY');
      expect(prompt).toContain('Indonesian male');
      expect(prompt).toContain('arms crossed');
      expect(prompt).toContain('100% facial consistency');
    });

    test('should build stage 2 prompt with enhanced analysis', () => {
      const enhancedAnalysis = {
        success: true,
        structured: {
          garment_type: 'crew neck t-shirt',
          primary_color: 'bright red',
          material: '100% cotton',
          style: 'casual',
          fit: 'regular'
        },
        branding: {
          structured: {
            brand_name: 'Nike',
            logo_type: 'embroidered',
            logo_position: 'left chest'
          }
        }
      };

      const prompt = service.buildStage2Prompt(enhancedAnalysis, 'arms crossed');
      
      expect(prompt).toContain('STAGE 2 - PRECISE CLOTHING APPLICATION');
      expect(prompt).toContain('crew neck t-shirt');
      expect(prompt).toContain('bright red');
      expect(prompt).toContain('Nike');
      expect(prompt).toContain('arms crossed');
    });

    test('should build model-first prompt correctly', () => {
      const enhancedAnalysis = {
        success: true,
        structured: {
          garment_type: 't-shirt',
          primary_color: 'blue'
        }
      };

      const prompt = service.buildModelFirstPrompt(
        mockModel, 
        'change to blue t-shirt', 
        enhancedAnalysis, 
        'contrapposto'
      );
      
      expect(prompt).toContain('MODEL-FIRST PRIORITY');
      expect(prompt).toContain('Indonesian male');
      expect(prompt).toContain('contrapposto');
      expect(prompt).toContain('Model face consistency');
    });

    test('should build product-first prompt correctly', () => {
      const enhancedAnalysis = {
        success: true,
        structured: {
          garment_type: 'hoodie',
          primary_color: 'black',
          material: 'fleece'
        },
        branding: {
          structured: {
            brand_name: 'Adidas',
            logo_type: 'screen printed'
          }
        }
      };

      const prompt = service.buildProductFirstPrompt(
        mockModel,
        'change to black hoodie',
        enhancedAnalysis,
        'hands in pockets'
      );
      
      expect(prompt).toContain('PRODUCT-FIRST PRIORITY');
      expect(prompt).toContain('hoodie');
      expect(prompt).toContain('black');
      expect(prompt).toContain('Adidas');
      expect(prompt).toContain('Product accuracy');
    });

    test('should build balanced prompt correctly', () => {
      const enhancedAnalysis = {
        success: true,
        structured: {
          garment_type: 'polo shirt',
          primary_color: 'navy blue'
        }
      };

      const prompt = service.buildBalancedPrompt(
        mockModel,
        'change to navy polo',
        enhancedAnalysis,
        'clasping hands'
      );
      
      expect(prompt).toContain('BALANCED GENERATION');
      expect(prompt).toContain('Equal priority');
      expect(prompt).toContain('polo shirt');
      expect(prompt).toContain('clasping hands');
    });
  });

  describe('Model Characteristics', () => {
    test('should extract model characteristics correctly', () => {
      const model = {
        characteristics: {
          ethnicity: 'Indonesian',
          gender: 'female',
          age: '25-30',
          hair: 'long straight dark hair',
          build: 'slim professional',
          expression: 'serious confident'
        }
      };

      const characteristics = service.getModelCharacteristics(model);
      
      expect(characteristics).toContain('Indonesian');
      expect(characteristics).toContain('female');
      expect(characteristics).toContain('25-30');
      expect(characteristics).toContain('long straight dark hair');
    });

    test('should handle missing characteristics gracefully', () => {
      const model = {};
      const characteristics = service.getModelCharacteristics(model);
      
      expect(characteristics).toBe('Same person with identical facial features');
    });
  });

  describe('Generation Methods', () => {
    const mockOptions = {
      model: {
        characteristics: {
          ethnicity: 'Indonesian',
          gender: 'male'
        }
      },
      referenceImagePath: 'test/model.jpg',
      prompt: 'change to red shirt',
      productImagePath: 'test/product.jpg',
      pose: 'arms crossed',
      size: '1024x1024',
      generativeModel: 'flux'
    };

    test('should handle model-first generation', async () => {
      mockFluxService.generateImageWithReference.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/result.jpg',
        modelUsed: 'flux-kontext-pro'
      });

      const result = await service.generateModelFirst(mockOptions);
      
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('model-first');
      expect(result.modelUsed).toBe('flux-model-first');
      expect(mockFluxService.generateImageWithReference).toHaveBeenCalledWith(
        'test/model.jpg',
        expect.stringContaining('MODEL-FIRST PRIORITY'),
        expect.objectContaining({
          size: '1024x1024',
          modelPriority: true
        })
      );
    });

    test('should handle product-first generation', async () => {
      mockFluxService.generateImageWithReference.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/result.jpg',
        modelUsed: 'flux-kontext-pro'
      });

      const result = await service.generateProductFirst(mockOptions);
      
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('product-first');
      expect(result.modelUsed).toBe('flux-product-first');
      expect(mockFluxService.generateImageWithReference).toHaveBeenCalledWith(
        'test/model.jpg',
        expect.stringContaining('PRODUCT-FIRST PRIORITY'),
        expect.objectContaining({
          size: '1024x1024',
          productPriority: true,
          useReverseApproach: true
        })
      );
    });

    test('should handle balanced generation', async () => {
      mockFluxService.generateImageWithReference.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/result.jpg',
        modelUsed: 'flux-kontext-pro'
      });

      const result = await service.generateBalanced(mockOptions);
      
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('balanced');
      expect(result.modelUsed).toBe('flux-balanced');
      expect(mockFluxService.generateImageWithReference).toHaveBeenCalledWith(
        'test/model.jpg',
        expect.stringContaining('BALANCED GENERATION'),
        expect.objectContaining({
          size: '1024x1024',
          balanced: true
        })
      );
    });

    test('should handle generation errors gracefully', async () => {
      mockFluxService.generateImageWithReference.mockResolvedValue({
        success: false,
        error: 'API Error'
      });

      const result = await service.generateModelFirst(mockOptions);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });
  });

  describe('Multi-Stage Generation', () => {
    const mockOptions = {
      model: {
        characteristics: {
          ethnicity: 'Indonesian',
          gender: 'male'
        }
      },
      referenceImagePath: 'test/model.jpg',
      prompt: 'change to red shirt',
      productImagePath: 'test/product.jpg',
      enhancedProductAnalysis: {
        success: true,
        structured: {
          garment_type: 't-shirt',
          primary_color: 'red'
        }
      },
      pose: 'arms crossed',
      size: '1024x1024',
      generativeModel: 'flux'
    };

    test('should handle successful multi-stage generation', async () => {
      // Mock stage 1 success
      mockFluxService.generateImageWithReference
        .mockResolvedValueOnce({
          success: true,
          imageUrl: 'http://example.com/stage1.jpg'
        })
        .mockResolvedValueOnce({
          success: true,
          imageUrl: 'http://example.com/stage2.jpg'
        });

      // Mock file operations
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockReturnValue(true);
      fs.writeFileSync.mockReturnValue(true);
      fs.unlinkSync.mockReturnValue(true);

      // Mock axios for image download
      const axios = require('axios');
      axios.get.mockResolvedValue({
        data: Buffer.from('mock image data')
      });

      // Mock downloadImageForNextStage
      service.downloadImageForNextStage = jest.fn().mockResolvedValue('/temp/stage1.jpg');
      service.cleanupTempFile = jest.fn();

      const result = await service.generateMultiStage(mockOptions);
      
      expect(result.success).toBe(true);
      expect(result.modelUsed).toBe('flux-multi-stage');
      expect(result.stages).toBeDefined();
      expect(result.stages.stage1).toBeDefined();
      expect(result.stages.stage2).toBeDefined();
      expect(mockFluxService.generateImageWithReference).toHaveBeenCalledTimes(2);
    });

    test('should handle stage 1 failure', async () => {
      mockFluxService.generateImageWithReference.mockResolvedValue({
        success: false,
        error: 'Stage 1 failed'
      });

      const result = await service.generateMultiStage(mockOptions);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Stage 1 failed');
    });
  });

  describe('Utility Methods', () => {
    test('should check availability correctly', () => {
      expect(service.isAvailable()).toBe(true);
      
      // Test with missing API keys
      mockFluxService.apiKey = null;
      mockOpenAIService.apiKey = null;
      expect(service.isAvailable()).toBe(false);
    });

    test('should return available strategies', () => {
      const strategies = service.getAvailableStrategies();
      
      expect(strategies).toHaveLength(4);
      expect(strategies.map(s => s.id)).toEqual([
        'multi-stage', 'model-first', 'product-first', 'balanced'
      ]);
      
      const multiStage = strategies.find(s => s.id === 'multi-stage');
      expect(multiStage.recommended).toBe(true);
      expect(multiStage.requirements).toContain('product_image');
    });

    test('should handle cleanup gracefully', () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // Should not throw
      expect(() => service.cleanupTempFile('/test/file.jpg')).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle fallback generation', async () => {
      const options = {
        generativeModel: 'flux',
        referenceImagePath: 'test/model.jpg',
        prompt: 'test prompt',
        size: '1024x1024'
      };

      mockFluxService.generateImageWithReference.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/fallback.jpg'
      });

      const result = await service.handleGenerationFailure(options, 'Original error');
      
      expect(result.success).toBe(true);
      expect(result.imageUrl).toBe('http://example.com/fallback.jpg');
    });

    test('should handle complete failure', async () => {
      const options = {
        generativeModel: 'flux',
        referenceImagePath: 'test/model.jpg',
        prompt: 'test prompt'
      };

      mockFluxService.generateImageWithReference.mockRejectedValue(
        new Error('Fallback failed')
      );

      const result = await service.handleGenerationFailure(options, 'Original error');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Enhanced generation failed');
      expect(result.error).toContain('Fallback also failed');
      expect(result.fallbackAttempted).toBe(true);
    });
  });
});