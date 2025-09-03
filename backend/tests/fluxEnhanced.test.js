const FluxService = require('../src/services/flux');

// Mock dependencies
jest.mock('axios');
jest.mock('fs');
jest.mock('sharp');

describe('FluxService Enhanced Methods', () => {
  let service;

  beforeEach(() => {
    service = new FluxService();
    service.apiKey = 'test-api-key'; // Mock API key
  });

  describe('Enhanced Prompt Building', () => {
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

    const mockEnhancedAnalysis = {
      success: true,
      structured: {
        garment_type: 'crew neck t-shirt',
        primary_color: 'bright red',
        material: '100% cotton',
        pattern: 'solid',
        style: 'casual',
        fit: 'regular',
        sleeve_type: 'short sleeve',
        collar: 'crew neck',
        closure: 'pullover',
        pockets: 'no pockets'
      },
      branding: {
        structured: {
          brand_name: 'Nike',
          logo_type: 'embroidered',
          logo_position: 'left chest',
          logo_colors: 'black on white',
          text_content: 'Nike swoosh'
        }
      }
    };

    test('should build enhanced stage 1 prompt with model characteristics', () => {
      const prompt = service.buildEnhancedStage1Prompt(mockModel, 'arms crossed');
      
      expect(prompt).toContain('STAGE 1 - PERFECT MODEL CONSISTENCY');
      expect(prompt).toContain('Indonesian male');
      expect(prompt).toContain('25-30');
      expect(prompt).toContain('short dark hair');
      expect(prompt).toContain('arms crossed');
      expect(prompt).toContain('100% facial and physical consistency');
    });

    test('should build enhanced stage 1 prompt without model characteristics', () => {
      const prompt = service.buildEnhancedStage1Prompt(null, 'contrapposto');
      
      expect(prompt).toContain('STAGE 1 - MODEL CONSISTENCY');
      expect(prompt).toContain('contrapposto');
      expect(prompt).toContain('perfect facial consistency');
    });

    test('should build enhanced stage 2 prompt with full analysis', () => {
      const prompt = service.buildEnhancedStage2Prompt(mockEnhancedAnalysis, 'arms crossed', mockModel);
      
      expect(prompt).toContain('STAGE 2 - ENHANCED CLOTHING APPLICATION');
      expect(prompt).toContain('crew neck t-shirt');
      expect(prompt).toContain('bright red');
      expect(prompt).toContain('100% cotton');
      expect(prompt).toContain('Nike');
      expect(prompt).toContain('embroidered');
      expect(prompt).toContain('left chest');
      expect(prompt).toContain('arms crossed');
    });

    test('should build enhanced stage 2 prompt without analysis', () => {
      const prompt = service.buildEnhancedStage2Prompt(null, 'hands in pockets', mockModel);
      
      expect(prompt).toContain('STAGE 2 - CLOTHING REPLACEMENT');
      expect(prompt).toContain('hands in pockets');
      expect(prompt).toContain('SURGICAL PRECISION');
    });

    test('should build model-first prompt correctly', () => {
      const prompt = service.buildModelFirstPrompt(
        'change to red shirt',
        mockModel,
        mockEnhancedAnalysis,
        'contrapposto'
      );
      
      expect(prompt).toContain('MODEL-FIRST FLUX GENERATION');
      expect(prompt).toContain('Indonesian male');
      expect(prompt).toContain('contrapposto');
      expect(prompt).toContain('Model face consistency');
      expect(prompt).toContain('bright red crew neck t-shirt');
    });

    test('should build product-first prompt correctly', () => {
      const prompt = service.buildProductFirstPrompt(
        'change to Nike shirt',
        mockEnhancedAnalysis,
        'clasping hands'
      );
      
      expect(prompt).toContain('PRODUCT-FIRST FLUX GENERATION');
      expect(prompt).toContain('crew neck t-shirt');
      expect(prompt).toContain('bright red');
      expect(prompt).toContain('EXACT COLOR MATCH');
      expect(prompt).toContain('Nike embroidered');
      expect(prompt).toContain('clasping hands');
    });

    test('should build balanced prompt correctly', () => {
      const prompt = service.buildBalancedPrompt(
        'change to casual shirt',
        mockModel,
        mockEnhancedAnalysis,
        'holding one arm'
      );
      
      expect(prompt).toContain('BALANCED FLUX GENERATION');
      expect(prompt).toContain('Equal priority');
      expect(prompt).toContain('Indonesian male');
      expect(prompt).toContain('bright red crew neck t-shirt');
      expect(prompt).toContain('holding one arm');
    });
  });

  describe('Model Characteristics Extraction', () => {
    test('should extract complete model characteristics', () => {
      const model = {
        characteristics: {
          ethnicity: 'Indonesian',
          gender: 'female',
          age: '25-30',
          hair: 'long straight dark hair',
          facial_hair: 'none',
          build: 'slim professional',
          expression: 'serious confident'
        }
      };

      const characteristics = service.getModelCharacteristics(model);
      
      expect(characteristics).toContain('Indonesian');
      expect(characteristics).toContain('female');
      expect(characteristics).toContain('25-30');
      expect(characteristics).toContain('long straight dark hair');
      expect(characteristics).toContain('slim professional');
      expect(characteristics).toContain('serious confident');
    });

    test('should handle missing characteristics gracefully', () => {
      const characteristics = service.getModelCharacteristics(null);
      expect(characteristics).toBe('Same person with identical facial features');
      
      const emptyModel = {};
      const emptyCharacteristics = service.getModelCharacteristics(emptyModel);
      expect(emptyCharacteristics).toBe('Same person with identical facial features');
    });

    test('should handle partial characteristics', () => {
      const model = {
        characteristics: {
          ethnicity: 'Indonesian',
          gender: 'male'
          // Missing other fields
        }
      };

      const characteristics = service.getModelCharacteristics(model);
      expect(characteristics).toContain('Indonesian');
      expect(characteristics).toContain('male');
      expect(characteristics).not.toContain('undefined');
    });
  });

  describe('Enhanced Generation Methods', () => {
    beforeEach(() => {
      // Mock the base generateImageWithReference method
      service.generateImageWithReference = jest.fn().mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/default.jpg'
      });
      service.downloadImageForStep2 = jest.fn().mockResolvedValue('/temp/stage1.jpg');
      service.cleanupTempFile = jest.fn();
    });

    test('should handle enhanced generation with multi-stage strategy', async () => {
      service.generateWithEnhancedMultiStep = jest.fn().mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/result.jpg',
        modelUsed: 'flux-enhanced-multi-step'
      });

      const result = await service.enhancedGenerateImageWithReference(
        'test/model.jpg',
        'change to red shirt',
        {
          strategy: 'multi-stage',
          model: { characteristics: { ethnicity: 'Indonesian' } },
          enhancedProductAnalysis: { success: true }
        }
      );

      expect(result.success).toBe(true);
      expect(service.generateWithEnhancedMultiStep).toHaveBeenCalled();
    });

    test('should handle enhanced generation with model-first strategy', async () => {
      service.generateImageWithReference.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/result.jpg'
      });

      const result = await service.enhancedGenerateImageWithReference(
        'test/model.jpg',
        'change to red shirt',
        {
          strategy: 'model-first',
          model: { characteristics: { ethnicity: 'Indonesian' } },
          pose: 'arms crossed'
        }
      );

      expect(result.success).toBe(true);
      expect(service.generateImageWithReference).toHaveBeenCalledWith(
        'test/model.jpg',
        expect.stringContaining('MODEL-FIRST FLUX GENERATION'),
        expect.objectContaining({
          modelPriority: true
        })
      );
    });

    test('should handle enhanced generation with product-first strategy', async () => {
      service.generateImageWithReference.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/result.jpg'
      });

      const result = await service.enhancedGenerateImageWithReference(
        'test/model.jpg',
        'change to Nike shirt',
        {
          strategy: 'product-first',
          enhancedProductAnalysis: {
            success: true,
            structured: { garment_type: 't-shirt', primary_color: 'red' }
          },
          pose: 'contrapposto'
        }
      );

      expect(result.success).toBe(true);
      expect(service.generateImageWithReference).toHaveBeenCalledWith(
        'test/model.jpg',
        expect.stringContaining('PRODUCT-FIRST FLUX GENERATION'),
        expect.objectContaining({
          productPriority: true,
          useReverseApproach: true
        })
      );
    });

    test('should handle enhanced generation with balanced strategy', async () => {
      service.generateImageWithReference.mockResolvedValue({
        success: true,
        imageUrl: 'http://example.com/result.jpg'
      });

      const result = await service.enhancedGenerateImageWithReference(
        'test/model.jpg',
        'change to casual shirt',
        {
          strategy: 'balanced',
          model: { characteristics: { ethnicity: 'Indonesian' } },
          enhancedProductAnalysis: { success: true }
        }
      );

      expect(result.success).toBe(true);
      expect(service.generateImageWithReference).toHaveBeenCalledWith(
        'test/model.jpg',
        expect.stringContaining('BALANCED FLUX GENERATION'),
        expect.objectContaining({
          balanced: true
        })
      );
    });

    test('should handle generation errors gracefully', async () => {
      service.generateImageWithReference.mockRejectedValue(new Error('API Error'));

      const result = await service.enhancedGenerateImageWithReference(
        'test/model.jpg',
        'change to shirt',
        { strategy: 'balanced' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });
  });

  describe('Enhanced Multi-Step Generation', () => {
    const mockOptions = {
      size: '1024x1024',
      productImagePath: 'test/product.jpg',
      enhancedProductAnalysis: {
        success: true,
        structured: {
          garment_type: 't-shirt',
          primary_color: 'blue'
        }
      },
      pose: 'arms crossed',
      model: {
        characteristics: {
          ethnicity: 'Indonesian',
          gender: 'male'
        }
      }
    };

    test('should handle successful enhanced multi-step generation', async () => {
      // Mock successful stage results
      let callCount = 0;
      service.generateImageWithReference = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            success: true,
            imageUrl: 'http://example.com/stage1.jpg'
          });
        } else {
          return Promise.resolve({
            success: true,
            imageUrl: 'http://example.com/stage2.jpg'
          });
        }
      });

      service.downloadImageForStep2 = jest.fn().mockResolvedValue('/temp/stage1.jpg');
      service.cleanupTempFile = jest.fn();

      const result = await service.generateWithEnhancedMultiStep(
        'test/model.jpg',
        'change to blue shirt',
        mockOptions
      );

      expect(result.success).toBe(true);
      expect(result.modelUsed).toBe('flux-enhanced-multi-step');
      expect(result.enhancedGeneration).toBe(true);
      expect(result.stages).toBeDefined();
      expect(result.stages.stage1).toBeDefined();
      expect(result.stages.stage2).toBeDefined();
      expect(service.generateImageWithReference).toHaveBeenCalledTimes(2);
      expect(service.cleanupTempFile).toHaveBeenCalledWith('/temp/stage1.jpg');
    });

    test('should handle stage 1 failure', async () => {
      service.generateImageWithReference = jest.fn().mockResolvedValue({
        success: false,
        error: 'Stage 1 failed'
      });

      const result = await service.generateWithEnhancedMultiStep(
        'test/model.jpg',
        'change to shirt',
        mockOptions
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Stage 1 failed');
    });

    test('should handle stage 2 failure', async () => {
      let callCount = 0;
      service.generateImageWithReference = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            success: true,
            imageUrl: 'http://example.com/stage1.jpg'
          });
        } else {
          return Promise.resolve({
            success: false,
            error: 'Stage 2 failed'
          });
        }
      });

      service.downloadImageForStep2 = jest.fn().mockResolvedValue('/temp/stage1.jpg');

      const result = await service.generateWithEnhancedMultiStep(
        'test/model.jpg',
        'change to shirt',
        mockOptions
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Stage 2 failed');
    });
  });

  describe('Utility Methods', () => {
    test('should cleanup temp files gracefully', () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        // Simulate successful deletion
      });

      expect(() => service.cleanupTempFile('/test/file.jpg')).not.toThrow();
      expect(fs.unlinkSync).toHaveBeenCalledWith('/test/file.jpg');
    });

    test('should handle cleanup errors gracefully', () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => service.cleanupTempFile('/test/file.jpg')).not.toThrow();
    });

    test('should skip cleanup for non-existent files', () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false);
      fs.unlinkSync.mockClear(); // Clear previous calls

      expect(() => service.cleanupTempFile('/test/nonexistent.jpg')).not.toThrow();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });
});