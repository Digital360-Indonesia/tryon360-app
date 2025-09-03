const EnhancedProductAnalysisService = require('../src/services/enhancedProductAnalysis');
const fs = require('fs');
const path = require('path');

describe('EnhancedProductAnalysisService', () => {
  let service;
  
  beforeEach(() => {
    service = new EnhancedProductAnalysisService();
  });

  describe('Color Analysis', () => {
    test('should extract dominant colors from image data', () => {
      // Mock image data (RGB values)
      const mockData = Buffer.alloc(300); // 100 pixels * 3 channels
      
      // Fill with red pixels
      for (let i = 0; i < 150; i += 3) {
        mockData[i] = 255;     // R
        mockData[i + 1] = 0;   // G
        mockData[i + 2] = 0;   // B
      }
      
      // Fill with blue pixels
      for (let i = 150; i < 300; i += 3) {
        mockData[i] = 0;       // R
        mockData[i + 1] = 0;   // G
        mockData[i + 2] = 255; // B
      }
      
      const mockInfo = { width: 10, height: 10, channels: 3 };
      const colors = service.extractDominantColors(mockData, mockInfo);
      
      expect(colors).toHaveLength(2);
      expect(colors[0].name).toBe('Red');
      expect(colors[1].name).toBe('Blue');
    });

    test('should convert RGB to hex correctly', () => {
      expect(service.rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(service.rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(service.rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(service.rgbToHex(255, 255, 255)).toBe('#ffffff');
    });

    test('should identify color names correctly', () => {
      expect(service.getColorName(255, 0, 0)).toBe('Red');
      expect(service.getColorName(0, 255, 0)).toBe('Green');
      expect(service.getColorName(0, 0, 255)).toBe('Blue');
      expect(service.getColorName(255, 255, 255)).toBe('White');
      expect(service.getColorName(0, 0, 0)).toBe('Black');
    });
  });

  describe('Analysis Parsing', () => {
    test('should parse enhanced analysis correctly', () => {
      const mockAnalysis = `
GARMENT_TYPE: crew neck t-shirt
PRIMARY_COLOR: bright red #ff0000
SECONDARY_COLORS: white collar trim
MATERIAL: 100% cotton
PATTERN: solid
STYLE: casual streetwear
FIT: regular fit
SLEEVE_TYPE: short sleeve
COLLAR: crew neck
CLOSURE: pullover
POCKETS: no pockets
LOGOS_TEXT: Nike swoosh left chest black
SPECIAL_FEATURES: none
CONSTRUCTION: flat seams
      `;
      
      const parsed = service.parseEnhancedAnalysis(mockAnalysis);
      
      expect(parsed.garment_type).toBe('crew neck t-shirt');
      expect(parsed.primary_color).toBe('bright red #ff0000');
      expect(parsed.material).toBe('100% cotton');
      expect(parsed.logos_text).toBe('Nike swoosh left chest black');
    });

    test('should parse branding analysis correctly', () => {
      const mockBranding = `
BRAND_NAME: Nike
LOGO_TYPE: embroidered
LOGO_POSITION: left chest
LOGO_SIZE: small (2cm)
LOGO_COLORS: black on white
TEXT_CONTENT: Nike swoosh
TEXT_STYLE: bold sans-serif
      `;
      
      const parsed = service.parseBrandingAnalysis(mockBranding);
      
      expect(parsed.brand_name).toBe('Nike');
      expect(parsed.logo_type).toBe('embroidered');
      expect(parsed.logo_position).toBe('left chest');
      expect(parsed.text_content).toBe('Nike swoosh');
    });

    test('should handle malformed analysis gracefully', () => {
      const malformedAnalysis = `
Invalid line without colon
GARMENT_TYPE: 
PRIMARY_COLOR: [missing value]
VALID_FIELD: valid value
      `;
      
      const parsed = service.parseEnhancedAnalysis(malformedAnalysis);
      
      expect(parsed.valid_field).toBe('valid value');
      expect(parsed.garment_type).toBeUndefined();
      expect(parsed.primary_color).toBeUndefined();
    });
  });

  describe('Confidence Calculation', () => {
    test('should calculate structured confidence correctly', () => {
      const completeStructured = {
        garment_type: 't-shirt',
        primary_color: 'red',
        material: 'cotton',
        style: 'casual',
        fit: 'regular',
        sleeve_type: 'short',
        collar: 'crew'
      };
      
      const confidence = service.calculateStructuredConfidence(completeStructured);
      expect(confidence).toBe(1.0);
      
      const partialStructured = {
        garment_type: 't-shirt',
        primary_color: 'red',
        material: 'cotton'
      };
      
      const partialConfidence = service.calculateStructuredConfidence(partialStructured);
      expect(partialConfidence).toBeCloseTo(0.43, 1);
    });

    test('should calculate branding confidence correctly', () => {
      const strongBranding = {
        brand_name: 'Nike',
        logo_type: 'embroidered',
        logo_position: 'left chest',
        text_content: 'Nike swoosh'
      };
      
      const confidence = service.calculateBrandingConfidence(strongBranding);
      expect(confidence).toBeCloseTo(1.0, 1);
      
      const weakBranding = {
        brand_name: 'Unknown'
      };
      
      const weakConfidence = service.calculateBrandingConfidence(weakBranding);
      expect(weakConfidence).toBe(0.5);
    });

    test('should calculate overall confidence correctly', () => {
      const analysisResults = {
        structured: { confidence: 0.8 },
        branding: { confidence: 0.6 },
        color: { confidence: 0.9 },
        quality: { confidence: 0.7 }
      };
      
      const confidence = service.calculateConfidence(analysisResults);
      expect(confidence).toBeCloseTo(0.75, 1);
    });
  });

  describe('Quality Assessment', () => {
    test('should provide quality recommendations', () => {
      const lowResQuality = {
        width: 256,
        height: 256,
        format: 'jpeg',
        size: 30000
      };
      
      const recommendations = service.getQualityRecommendations(lowResQuality);
      expect(recommendations.some(rec => rec.includes('Image resolution is low'))).toBe(true);
      expect(recommendations.some(rec => rec.includes('Image file size is very small'))).toBe(true);
      
      const goodQuality = {
        width: 1024,
        height: 1024,
        format: 'jpeg',
        size: 500000
      };
      
      const goodRecommendations = service.getQualityRecommendations(goodQuality);
      expect(goodRecommendations).toContain('Image quality looks good for AI generation.');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing API key gracefully', () => {
      const serviceWithoutKey = new EnhancedProductAnalysisService();
      serviceWithoutKey.apiKey = null;
      
      return serviceWithoutKey.analyzeProduct('test.jpg').then(result => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('OpenAI API key not configured');
      });
    });

    test('should handle file read errors gracefully', () => {
      const mockError = new Error('File not found');
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw mockError;
      });
      
      return service.getStructuredAnalysis('nonexistent.jpg').then(result => {
        expect(result.confidence).toBe(0);
        expect(result.structured).toEqual({});
      });
      
      fs.readFileSync.mockRestore();
    });

    test('should handle API errors gracefully', () => {
      // This would require mocking axios, but demonstrates the error handling structure
      expect(service.calculateConfidence({})).toBe(0.5);
      expect(service.parseEnhancedAnalysis('')).toEqual({});
      expect(service.parseBrandingAnalysis('')).toEqual({});
    });
  });

  describe('Integration Tests', () => {
    // These tests would require actual image files and API access
    // They should be run in a separate integration test suite
    
    test.skip('should analyze real product image', async () => {
      // This test would use a real image file
      const imagePath = path.join(__dirname, 'fixtures', 'test-shirt.jpg');
      
      if (fs.existsSync(imagePath)) {
        const result = await service.analyzeProduct(imagePath);
        
        expect(result.success).toBe(true);
        expect(result.structured).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.colors).toBeDefined();
        expect(result.branding).toBeDefined();
        expect(result.quality).toBeDefined();
      }
    });
  });
});

// Mock setup for tests
jest.mock('axios');
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    raw: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue({
      data: Buffer.alloc(300),
      info: { width: 10, height: 10, channels: 3 }
    }),
    metadata: jest.fn().mockResolvedValue({
      width: 1024,
      height: 1024,
      format: 'jpeg',
      hasAlpha: false,
      density: 72
    })
  }));
});

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(Buffer.from('mock image data')),
  statSync: jest.fn().mockReturnValue({ size: 500000 })
}));